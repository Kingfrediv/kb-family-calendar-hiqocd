// Things that worked before must still work: dates, time zones, licence handling, first run.
const L = require('./lib'); const { check } = L; const crypto = require('crypto');
const pad = n => String(n).padStart(2, '0'); const iso = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const nth = (y, m, dow, n) => { if (n === -1) { const d = new Date(Date.UTC(y, m + 1, 0)); while (d.getUTCDay() !== dow) d.setUTCDate(d.getUTCDate() - 1); return iso(d); } const d = new Date(Date.UTC(y, m, 1)); let c = 0; for (;;) { if (d.getUTCDay() === dow && ++c === n) return iso(d); d.setUTCDate(d.getUTCDate() + 1); } };
const add = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
(async () => {
  const { srv, url } = await L.startServer(); const browser = await L.chromium.launch(); const logs = [];
  const easter = L.fs.readFileSync(L.path.join(__dirname, 'easter.txt'), 'utf8').trim().split(',');
  const mk = async (tz, mode = 'ok', opts = {}) => { const ctx = await L.newCtx(browser, Object.assign(tz ? { timezoneId: tz } : {}, opts)); const cnt = await L.stubGumroad(ctx, mode); const page = await ctx.newPage(); L.watch(page, logs); await page.goto(url); return { ctx, page, cnt }; };

  // first run
  let { ctx, page, cnt } = await mk('America/New_York');
  check('first visit shows only the licence screen', (await page.locator('#licenseOverlay.show').count()) === 1 && (await page.locator('.container').isHidden()) && (await page.locator('#btnLicenseClose').isHidden()) && cnt.n === 0);
  await page.keyboard.press('Escape');
  check('licence screen cannot be dismissed when nothing is unlocked', (await page.locator('#licenseOverlay.show').count()) === 1);
  await page.click('#btnUnlockLicense'); check('empty key message', /Enter the license key/.test(await page.textContent('#licenseError')));
  await L.unlock(page, { names: ['Avery', 'Jordan', 'Taylor'] });
  check('unlock uses one activation', cnt.uses === 1 && cnt.n === 2);
  check('setup names applied', (await page.textContent('#headerTitle')) === "🐝 Avery's Parenting Schedule");
  check('blank calendar says base is not set', /not set yet/.test((await L.stats(page)).base) && (await L.stats(page)).two === '—');
  await page.click('.preset-btn[data-preset="2-2-3"]');
  await page.reload();
  check('reload keeps licence, names and schedule without calling Gumroad again', (await page.locator('#licenseOverlay.show').count()) === 0 && (await page.textContent('#headerTitle')).includes('Avery') && /7\/14/.test((await L.stats(page)).base) && cnt.n === 2);

  // dates
  await page.selectOption('#bdayChildMonth', '1'); await page.selectOption('#bdayChildDay', '29');
  let bad = [], n = 0;
  for (let y = 2020; y <= 2045; y++) {
    await page.selectOption('#yearSelect', String(y));
    const rows = await page.$$eval('#holidayTableBody tr', trs => Object.fromEntries(trs.map(t => [t.children[0].textContent, t.children[1].textContent])));
    const tg = nth(y, 10, 4, 4);
    const exp = { 'MLK Jr. Day': nth(y, 0, 1, 3), "Presidents' Day": nth(y, 1, 1, 3), 'Easter Sunday': easter[y - 2020], "Mother's Day": nth(y, 4, 0, 2), 'Memorial Day': nth(y, 4, 1, -1), "Father's Day": nth(y, 5, 0, 3), 'Labor Day': nth(y, 8, 1, 1), "Indigenous Peoples' Day": nth(y, 9, 1, 2), 'Thanksgiving Break (Wed–Sun)': `${add(tg, -1)} to ${add(tg, 3)}`, "National Parents' Day": nth(y, 6, 0, 4), 'Juneteenth': `${y}-06-19`, 'Veterans Day': `${y}-11-11`, 'Halloween': `${y}-10-31` };
    for (const [k, v] of Object.entries(exp)) { n++; if (rows[k] !== v) bad.push(`${y} ${k}: ${rows[k]} vs ${v}`); }
    const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    if (rows["Avery's Birthday"] !== (leap ? `${y}-02-29` : `${y}-02-28`)) bad.push(`${y} birthday ${rows["Avery's Birthday"]}`);
    if ((await page.locator('button.day-cell').count()) !== (leap ? 366 : 365)) bad.push(`${y} day count`);
    if ((await page.evaluate(() => document.querySelector('.month-card .cal-grid').querySelectorAll('.day-cell.empty').length)) !== new Date(Date.UTC(y, 0, 1)).getUTCDay()) bad.push(`${y} Jan 1 column`);
  }
  check(`${n} holiday dates, leap years and weekday columns correct for 2020–2045`, bad.length === 0, bad.slice(0, 4).join(' ; '));
  await ctx.close();

  // time zones
  const fingerprint = async tz => { const { ctx, page } = await mk(tz); await L.unlock(page, { names: ['Avery', 'Jordan', 'Taylor'] }); await page.click('.preset-btn[data-preset="2-2-5-5"]'); let all = ''; for (const y of [2024, 2025, 2026, 2027, 2028]) { await page.selectOption('#yearSelect', String(y)); all += JSON.stringify(await L.owners(page)); } const today = await page.evaluate(() => { const n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); }); await page.selectOption('#yearSelect', today.slice(0, 4)); const hl = await page.$$eval('button.day-cell.is-today', e => e.map(x => x.dataset.ds).join()); await ctx.close(); return { h: crypto.createHash('sha1').update(all).digest('hex'), ok: hl === today }; };
  const zones = ['America/New_York', 'America/Los_Angeles', 'Pacific/Honolulu', 'Europe/London', 'Asia/Kolkata', 'Australia/Sydney', 'Pacific/Auckland', 'America/Santiago', 'Africa/Cairo', 'America/Havana', 'Pacific/Kiritimati', 'Asia/Kathmandu'];
  const fp = {}; for (const z of zones) fp[z] = await fingerprint(z);
  check('schedule identical in 12 time zones, today highlighted correctly', zones.every(z => fp[z].h === fp[zones[0]].h && fp[z].ok), zones.filter(z => fp[z].h !== fp[zones[0]].h || !fp[z].ok).join());

  // licence failures
  const lic = async mode => { const { ctx, page } = await mk(null, mode); await page.fill('#licenseKeyInput', '  KEY  '); await page.click('#btnUnlockLicense'); await page.waitForTimeout(700); const out = { msg: await page.textContent('#licenseError'), locked: await page.evaluate(() => document.body.classList.contains('license-locked')) }; await ctx.close(); return out; };
  let r = await lic('invalid'); check('invalid key: clear message, stays locked', /does not exist/.test(r.msg) && r.locked);
  r = await lic('limit'); check('device limit: clear message, stays locked', /maximum of 3 devices/.test(r.msg) && r.locked);
  r = await lic('down'); check('Gumroad unreachable: clear message, stays locked', /Could not reach Gumroad/.test(r.msg) && r.locked);
  { const c = await mk(null); await L.unlock(c.page, {}); await c.ctx.unroute('**://api.gumroad.com/**'); await L.stubGumroad(c.ctx, 'down'); await c.page.evaluate(() => { const l = JSON.parse(localStorage.kb_license_v1); l.lastCheckAt = 1; localStorage.kb_license_v1 = JSON.stringify(l); }); await c.page.reload(); await c.page.waitForTimeout(600); check('offline at the weekly re-check: stays unlocked', !(await c.page.evaluate(() => document.body.classList.contains('license-locked')))); await c.ctx.close(); }
  { const c = await mk(null); await L.unlock(c.page, {}); await c.ctx.unroute('**://api.gumroad.com/**'); await L.stubGumroad(c.ctx, 'invalid'); await c.page.evaluate(() => { const l = JSON.parse(localStorage.kb_license_v1); l.lastCheckAt = 1; localStorage.kb_license_v1 = JSON.stringify(l); }); await c.page.reload(); await c.page.waitForTimeout(700); check('refunded/invalid key at the weekly re-check: locks again', await c.page.evaluate(() => document.body.classList.contains('license-locked'))); await c.ctx.close(); }

  // phone first run for the owner
  { const c = await mk(null, 'ok', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await L.unlock(c.page, { names: ['Avery', 'Jordan', 'Taylor'] }); check('phone owner first run: month view, settings folded, month arrows present, no sideways scroll', (await c.page.locator('.sidebar').isHidden()) && (await c.page.locator('.month-card').count()) === 1 && (await c.page.locator('.month-nav').count()) === 2 && !(await c.page.evaluate(() => document.documentElement.scrollWidth > innerWidth))); await c.page.click('#btnToggleSidebar'); await c.page.click('.preset-btn[data-preset="7-7"]'); check('phone owner can open settings and apply a preset', /7\/14/.test((await L.stats(c.page)).base)); await c.page.screenshot({ path: L.OUT + '/v_phone_owner.png' }); await c.ctx.close(); }
  // desktop year view has no month arrows, print layout intact
  { const c = await mk(null); await L.unlock(c.page, { names: ['Avery', 'Jordan', 'Taylor'] }); await c.page.click('.preset-btn[data-preset="2-2-3"]'); check('year view shows 12 months and no month arrows', (await c.page.locator('.month-card').count()) === 12 && (await c.page.locator('.month-nav').count()) === 0); await c.page.click('#viewMonthBtn'); await c.page.selectOption('#monthSelect', '6'); check('month view: picker and arrows agree', (await c.page.evaluate(() => document.querySelector('.month-title span').textContent)) === 'July 2026'); await c.page.click('.month-nav[data-dir="1"]'); check('arrow updates the month picker too', (await c.page.inputValue('#monthSelect')) === '7'); await c.page.emulateMedia({ media: 'print' }); check('month arrows are not printed', await c.page.locator('.month-nav').first().isHidden()); const pdf = await c.page.pdf({ format: 'Letter' }); check('print to PDF works', pdf.length > 20000); await c.page.emulateMedia({ media: 'screen' }); await c.page.screenshot({ path: L.OUT + '/v_desktop_month.png' }); await c.ctx.close(); }

  const errs = logs.filter(x => /pageerror|console\.error/.test(x) && !/Failed to load resource|net::ERR/.test(x));
  check('no script errors anywhere in this run', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = L.summary('REGRESSION CHECKS'); await browser.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
