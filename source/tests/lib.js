const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const INDEX = process.env.KB_INDEX || path.join(ROOT, 'dist', 'index.html');   // the build under test
const DIST = process.env.KB_DIST ? path.resolve(ROOT, process.env.KB_DIST) : path.join(ROOT, 'dist');
const OUT = path.join(ROOT, 'test-output');
fs.mkdirSync(OUT, { recursive: true });

function startServer(extra = {}) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const u = req.url.split('?')[0];
      if (extra[u]) { rsp.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); rsp.end(extra[u]()); return; }
      // the app's own files (service worker, manifest, icons) come from the build output next to the page under test
      const asset = ['/sw.js', '/manifest.webmanifest'].includes(u) || u.startsWith('/icons/') ? path.join(DIST, u) : null;
      if (asset && fs.existsSync(asset) && fs.statSync(asset).isFile()) {
        const type = u.endsWith('.js') ? 'text/javascript' : u.endsWith('.png') ? 'image/png' : 'application/manifest+json';
        rsp.writeHead(200, { 'content-type': type }); rsp.end(fs.readFileSync(asset)); return;
      }
      if (u === '/' || u === '/index.html') {
        rsp.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        rsp.end(fs.readFileSync(INDEX));
      } else { rsp.writeHead(404); rsp.end('nf'); }
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, url: `http://127.0.0.1:${srv.address().port}/` }));
  });
}

// Stub the license endpoint so no real network call is ever made.
async function stubGumroad(ctx, mode = 'ok', counter = { n: 0, uses: 0 }) {
  await ctx.route('**://api.gumroad.com/**', async route => {
    counter.n++;
    const body = route.request().postData() || '';
    const inc = /increment_uses_count=true/.test(body);
    if (mode === 'ok') { if (inc) counter.uses++; return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: true, uses: counter.uses, purchase: {} }) }); }
    if (mode === 'invalid') return route.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: false, message: 'That license does not exist for the provided product.' }) });
    if (mode === 'limit') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ success: true, uses: 3, purchase: {} }) });
    if (mode === 'down') return route.abort('failed');
  });
  return counter;
}

async function newCtx(browser, opts = {}) {
  // service workers are blocked unless a test asks for them, so one test's cache can never leak into another
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true, serviceWorkers: 'block', ...opts });
  return ctx;
}

function watch(page, log) {
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push(`[console.${m.type()}] ${m.text()}`); });
  page.on('pageerror', e => log.push(`[pageerror] ${e.message}`));
  page.on('dialog', async d => { log.push(`[dialog:${d.type()}] ${d.message().slice(0, 120)}`); await d.accept(); });
}

// Unlock through the real UI with the stubbed endpoint, then complete setup.
async function unlock(page, { setup = true, names } = {}) {
  await page.fill('#licenseKeyInput', 'TEST-TEST-TEST-TEST');
  await page.click('#btnUnlockLicense');
  await page.waitForFunction(() => !document.body.classList.contains('license-locked'));
  if (setup) {
    await page.waitForSelector('#setupOverlay.show', { timeout: 3000 }).catch(() => {});
    if (await page.locator('#setupOverlay.show').count()) {
      if (names) { await page.fill('#setupChild', names[0]); await page.fill('#setupP1', names[1]); await page.fill('#setupP2', names[2]); await page.click('#btnSetupStart'); }
      else await page.click('#btnSetupSkip');
    }
  }
}

// Read every rendered day: date -> {cls, title}
async function days(page) {
  return page.$$eval('button.day-cell', els => Object.fromEntries(els.map(e => [e.dataset.ds, { cls: e.className.replace('day-cell ', ''), title: e.title, label: e.querySelector('.day-label')?.textContent || '', icon: e.querySelector('.day-icons')?.textContent || '' }])));
}
function ownerOf(d) { const m = d.title.match(/: (.*?) overnight/); return m ? m[1] : '?'; }
async function stats(page) {
  return page.evaluate(() => ({ p1: document.getElementById('statP1Days').textContent, p1pct: document.getElementById('statP1Pct').textContent, p2: document.getElementById('statP2Days').textContent, p2pct: document.getElementById('statP2Pct').textContent, both: document.getElementById('statBothDays').textContent, two: document.getElementById('statTwoYearAvg').textContent, base: document.getElementById('baseSplitBar').textContent }));
}
async function setYearView(page) { await page.click('#viewYearBtn'); }
module.exports = { chromium, startServer, stubGumroad, newCtx, watch, unlock, days, ownerOf, stats, setYearView, OUT, ROOT, fs, path };

// ---- assertion helpers for the verification suites
const results = [];
function check(name, ok, detail = '') { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail !== '' ? '  — ' + detail : ''}`); }
function summary(label) { const f = results.filter(r => !r.ok); console.log(`\n${label}: ${results.length - f.length}/${results.length} passed`); if (f.length) { console.log('FAILED:'); f.forEach(r => console.log('  - ' + r.name + '  ' + r.detail)); } return f.length; }
const zlib = require('zlib');
const b64u = buf => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const mkLink = (url, obj) => url + '#c=' + b64u(zlib.deflateRawSync(Buffer.from(JSON.stringify(obj))));
async function owners(page) { const d = await days(page); return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, ownerOf(v) + '|' + v.cls.replace(' is-today', '')])); }
Object.assign(module.exports, { check, summary, mkLink, owners, results });

// Click something that lives in the Share & export menu, opening the menu first if needed.
async function act(page, sel) {
  const el = page.locator(sel);
  if (!(await el.isVisible())) await page.click('#btnMenuShare');
  await el.click();
}
Object.assign(module.exports, { act });

// ---- the day sheet (tapping a day no longer cycles it)
// Choose who has a night: who = 'p1' | 'p2' | 'both' | 'usual'.  Opens the sheet, picks, closes it.
async function setDay(page, ds, who) {
  await page.click(`button.day-cell[data-ds="${ds}"]`);
  await page.waitForSelector('#daySheet.show');
  await page.click({ p1: '#dayOwnerP1', p2: '#dayOwnerP2', both: '#dayOwnerBoth', usual: '#dayOwnerUsual' }[who]);
  await page.click('#btnDayDone');
  await page.waitForSelector('#daySheet.show', { state: 'detached' });
}
// Give the night to whichever parent does not have it now (what a single tap used to do).
async function flipDay(page, ds) {
  await page.click(`button.day-cell[data-ds="${ds}"]`);
  await page.waitForSelector('#daySheet.show');
  const p1Has = (await page.getAttribute('#dayOwnerP1', 'aria-pressed')) === 'true';
  await page.click(p1Has ? '#dayOwnerP2' : '#dayOwnerP1');
  await page.click('#btnDayDone');
  await page.waitForSelector('#daySheet.show', { state: 'detached' });
}
Object.assign(module.exports, { setDay, flipDay });
