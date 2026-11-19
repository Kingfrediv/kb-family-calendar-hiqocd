// Foundation features: Share & export menu, Today, backup & restore, offline/installable app, calendars list.
const L = require('./lib'); const { check } = L;
const axeSrc = L.fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => {
  const { srv, url } = await L.startServer(); const browser = await L.chromium.launch(); const logs = [];
  const mk = async (opts = {}) => { const ctx = await L.newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], ...opts }); await L.stubGumroad(ctx, 'ok'); const page = await ctx.newPage(); L.watch(page, logs); return { ctx, page }; };
  const dl = async (page, sel) => { const [d] = await Promise.all([page.waitForEvent('download'), L.act(page, sel)]); const p = L.OUT + '/v4_' + d.suggestedFilename(); await d.saveAs(p); return p; };
  const active = page => page.evaluate(() => document.activeElement.id || document.activeElement.tagName);

  // ---------------- menu
  let { ctx, page } = await mk();
  await page.goto(url); await L.unlock(page, { names: ['Avery', 'Jordan', 'Taylor'] });
  await page.click('.preset-btn[data-preset="2-2-3"]');
  check('menu: closed at start, button says it has a popup', (await page.locator('#shareMenu').isHidden()) && (await page.getAttribute('#btnMenuShare', 'aria-haspopup')) === 'menu' && (await page.getAttribute('#btnMenuShare', 'aria-expanded')) === 'false');
  await page.click('#btnMenuShare');
  check('menu: opens, first item is focused, state is announced', (await page.locator('#shareMenu').isVisible()) && (await active(page)) === 'btnCopyLink' && (await page.getAttribute('#btnMenuShare', 'aria-expanded')) === 'true', await active(page));
  const order = []; for (let i = 0; i < 10; i++) { order.push(await active(page)); await page.keyboard.press('ArrowDown'); }
  check('menu: arrow keys walk every item and wrap round', order.slice(0, 8).join() === 'btnCopyLink,btnSaveBakedHtml,btnExportIcs,btnPrint,btnExportCsv,btnBackup,btnRestore,btnHistory' && order[8] === 'btnCopyLink', order.join());
  await page.keyboard.press('End'); check('menu: End goes to the last item', (await active(page)) === 'btnHistory', await active(page));
  await page.keyboard.press('Escape');
  check('menu: Escape closes it and returns focus to the button', (await page.locator('#shareMenu').isHidden()) && (await active(page)) === 'btnMenuShare');
  await page.click('#btnMenuShare'); await page.mouse.click(5, 450);
  check('menu: clicking outside closes it', await page.locator('#shareMenu').isHidden());
  await page.click('#btnMenuShare'); await page.click('#btnCopyLink');
  check('menu: choosing an item closes the menu and opens its dialog', (await page.locator('#shareMenu').isHidden()) && (await page.locator('#shareOverlay.show').count()) === 1);
  await page.keyboard.press('Escape'); check('menu: closing that dialog returns focus to the menu button', (await active(page)) === 'btnMenuShare', await active(page));
  { await page.click('#btnMenuShare'); await page.addScriptTag({ content: axeSrc }); const v = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations.map(x => `${x.id}×${x.nodes.length} ${x.nodes[0].target.join(' ').slice(0, 60)}`)); check('menu: open menu passes the accessibility scan', v.length === 0, v.join(' | ')); await page.keyboard.press('Escape'); }
  check('menu: nothing about the menu is in the printed page', await (async () => { await page.emulateMedia({ media: 'print' }); const hidden = await page.locator('#shareMenu').isHidden(); await page.emulateMedia({ media: 'screen' }); return hidden; })());

  // ---------------- Today + toast action
  const undoBefore = await page.isDisabled('#btnUndo'); await page.waitForTimeout(900);
  await page.click('#btnNextYear'); await page.click('#btnNextYear');
  const cy = new Date().getFullYear();
  await page.click('#btnToday');
  check('Today: returns to the current year and focuses today', (await page.textContent('#headerYearBadge')) === String(cy) && (await page.evaluate(() => document.activeElement.classList.contains('is-today'))), await page.textContent('#headerYearBadge'));
  await page.click('#viewMonthBtn'); await page.selectOption('#monthSelect', '0'); await page.click('#btnToday');
  check('Today: also jumps to this month in month view', (await page.inputValue('#monthSelect')) === String(new Date().getMonth()));
  await page.click('#viewYearBtn');
  check('Today: counts as looking around, not an edit (Undo is exactly as it was)', (await page.isDisabled('#btnUndo')) === undoBefore, 'before ' + undoBefore);
  await page.evaluate(() => { document.getElementById('toast').classList.remove('show'); });

  // ---------------- backup
  await page.selectOption('#bdayChildMonth', '8'); await page.selectOption('#bdayChildDay', '12');
  await L.flipDay(page, cy + '-03-04');
  await page.fill('#exchangeLocationInput', 'School, front office');
  await L.act(page, '#btnMenuShare'); await page.keyboard.press('Escape');
  const file = await dl(page, '#btnBackup');
  const raw = L.fs.readFileSync(file, 'utf8'); const bk = JSON.parse(raw);
  check('backup: file has the app name, format and one calendar with its schedule', bk.app === 'kb-parenting-calendar' && bk.format === 1 && bk.calendars.length === 1 && bk.calendars[0].state.childName === 'Avery' && bk.calendars[0].state.exchangeLocation === 'School, front office', Object.keys(bk).join());
  check('backup: the license key is never in the file', !/TEST-TEST|kb_license|license_key|"key"/i.test(raw));
  check('backup: menu then says when the last backup was made', (await (async () => { await page.click('#btnMenuShare'); const t = await page.textContent('#backupNote'); await page.keyboard.press('Escape'); return t; })()) === 'Last backup: today');
  const ownerOwners = await L.owners(page);
  await ctx.close();

  // ---------------- restore into a clean browser
  ({ ctx, page } = await mk()); await page.goto(url); await L.unlock(page, { names: ['Someone', 'Else', 'Entirely'] });
  check('restore: starts from a different calendar', (await page.textContent('#headerTitle')).includes('Someone'));
  await L.act(page, '#btnMenuShare'); await page.keyboard.press('Escape');
  await page.click('#btnMenuShare'); await page.click('#btnRestore');
  await Promise.all([page.waitForLoadState('load'), page.setInputFiles('#restoreFile', file)]);
  await page.waitForSelector('#toastAction:not([hidden])', { timeout: 8000 });
  check('restore: calendar is back exactly as backed up', JSON.stringify(await L.owners(page)) === JSON.stringify(ownerOwners) && (await page.textContent('#headerTitle')).includes('Avery') && (await page.inputValue('#exchangeLocationInput')) === 'School, front office');
  check('restore: says so, with an Undo button', /Backup restored/.test(await page.textContent('#toastText')) && (await page.textContent('#toastAction')) === 'Undo');
  await page.click('#toastAction'); await page.waitForLoadState('load'); await page.waitForTimeout(400);
  check('restore: Undo brings the earlier calendar back', (await page.textContent('#headerTitle')).includes('Someone') && /Restore undone/.test(await page.textContent('#toastText')), await page.textContent('#headerTitle'));
  check('restore: licence is untouched by a restore', (await page.locator('#licenseOverlay.show').count()) === 0);

  // ---------------- bad and hostile backups
  const tmp = L.OUT + '/v4_bad.json';
  const tryFile = async (name, content, expectToast, extra) => { L.fs.writeFileSync(tmp, typeof content === 'string' ? content : JSON.stringify(content)); await page.evaluate(() => { document.getElementById('toast').classList.remove('show'); window.__x = 0; }); await page.setInputFiles('#restoreFile', tmp); await page.waitForTimeout(350); const t = await page.textContent('#toastText'); const stillThere = (await page.textContent('#headerTitle')).includes('Someone'); check(`restore refuses: ${name}`, expectToast.test(t) && stillThere && !(await page.evaluate(() => window.__x)), t); };
  await tryFile('text that is not JSON', 'hello', /not a calendar backup/);
  await tryFile('JSON from some other app', { hello: 1 }, /not a Kingdom Building/);
  await tryFile('a backup with no calendars', { app: 'kb-parenting-calendar', format: 1, calendars: [] }, /no calendars/);
  await tryFile('a backup from a newer version', { app: 'kb-parenting-calendar', format: 99, calendars: [{ id: '', state: {} }] }, /newer version/);
  await tryFile('a backup whose calendars are not objects', { app: 'kb-parenting-calendar', format: 1, calendars: [null, 5, 'x', []] }, /no readable calendars/);
  await tryFile('a backup with 40 calendars', { app: 'kb-parenting-calendar', format: 1, calendars: Array.from({ length: 40 }, () => ({ id: '', state: {} })) }, /too many/);
  // hostile content that IS accepted must be neutralised, not run
  const evil = '<img src=x onerror="window.__x=1">';
  L.fs.writeFileSync(tmp, JSON.stringify({ app: 'kb-parenting-calendar', format: 1, active: '', calendars: [{ id: '', state: { childName: evil, p1Name: evil, summerEmoji: evil, ue: evil, notes: evil, agreementNotes: evil, schoolEmoji: evil, customHolidays: [{ id: evil, name: evil, emoji: evil, m: 2, d: 3, rule: evil }], schoolCustomEvents: [{ id: evil, startDate: evil, endDate: evil, title: evil, kind: evil }], overrides: { [evil]: 'p1', '2026-03-01': evil }, biweeklyAnchor: evil, year: evil, summerSelected: evil, baseWeekly: evil } }] }));
  await page.evaluate(() => { window.__x = 0; }); await page.setInputFiles('#restoreFile', tmp); await page.waitForLoadState('load'); await page.waitForTimeout(700);
  check('restore: hostile text inside an accepted backup never runs and is shown as plain text', !(await page.evaluate(() => window.__x)) && (await page.locator('.container img, header img').count()) === 0 && (await page.locator('button.day-cell').count()) >= 365, await page.textContent('#headerTitle'));
  await page.click('#toastAction').catch(() => {}); await page.waitForLoadState('load'); await page.waitForTimeout(300);
  await ctx.close();

  // ---------------- view-only recipients: menu is theirs to look at, nothing to send or save
  { const owner = await mk(); await owner.page.goto(url); await L.unlock(owner.page, { names: ['Avery', 'Jordan', 'Taylor'] }); await owner.page.click('.preset-btn[data-preset="7-7"]'); await L.act(owner.page, '#btnCopyLink'); await owner.page.click('#btnShareCopy'); await owner.page.waitForSelector('#shareResult.show'); const link = await owner.page.evaluate(() => navigator.clipboard.readText()); await owner.ctx.close();
    const r = await mk(); await r.page.goto(link); await r.page.waitForSelector('#sharedBanner.show');
    check('recipient: menu button works but every send/save/backup item is switched off', (await r.page.locator('#btnMenuShare').isEnabled()) && (await r.page.evaluate(() => ['btnCopyLink', 'btnSaveBakedHtml', 'btnExportIcs', 'btnPrint', 'btnExportCsv', 'btnBackup', 'btnRestore'].every(id => document.getElementById(id).disabled))));
    await r.page.click('#btnToday'); check('recipient: Today works', (await r.page.locator('button.day-cell.is-today').count()) <= 1 && (await r.page.locator('#licenseOverlay.show').count()) === 0);
    await r.ctx.close(); }

  // ---------------- offline + installable
  { const o = await mk({ serviceWorkers: 'allow' }); await o.page.goto(url); await L.unlock(o.page, { names: ['Avery', 'Jordan', 'Taylor'] }); await o.page.click('.preset-btn[data-preset="2-2-3"]');
    await o.page.evaluate(() => navigator.serviceWorker.ready); await o.page.reload(); await o.page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 8000 });
    const manifest = await o.page.evaluate(async () => { const href = document.querySelector('link[rel=manifest]').href; const r = await fetch(href); return { ok: r.ok, j: await r.json() }; });
    check('app: manifest is valid and names three icons', manifest.ok && manifest.j.display === 'standalone' && manifest.j.icons.length === 3 && manifest.j.start_url === './', JSON.stringify(manifest.j).slice(0, 80));
    const icons = await o.page.evaluate(async () => Promise.all([...document.querySelectorAll('link[rel=apple-touch-icon]')].map(l => l.href).concat(['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png']).map(async h => (await fetch(h)).status)));
    check('app: every icon file exists', icons.every(s => s === 200), icons.join());
    await o.ctx.setOffline(true); await o.page.reload(); await o.page.waitForTimeout(500);
    check('app: offline, the page still opens with the calendar and the license', (await o.page.textContent('#headerTitle')).includes('Avery') && (await o.page.locator('#licenseOverlay.show').count()) === 0 && (await o.page.locator('button.day-cell').count()) === 365, await o.page.textContent('#headerTitle'));
    await L.flipDay(o.page, new Date().getFullYear() + '-05-05'); check('app: offline, editing still works', (await o.page.locator('button.day-cell.is-override').count()) === 1);
    await o.ctx.setOffline(false);
    const cacheNames = await o.page.evaluate(async () => caches.keys());
    check('app: the cache is named after this build, so a new release replaces it', cacheNames.length === 1 && /^kb-calendar-[0-9a-f]{10}$/.test(cacheNames[0]), cacheNames.join());
    const swSource = await o.page.evaluate(async () => (await fetch('sw.js')).text());
    check('app: the service worker never touches requests to other sites', /url\.origin !== self\.location\.origin/.test(swSource));
    await o.ctx.close(); }

  // ---------------- a downloaded copy opened from a file must not try to register a service worker
  { const c = await mk(); await c.page.goto(url); await L.unlock(c.page, { names: ['Avery', 'Jordan', 'Taylor'] }); const f = await dl(c.page, '#btnSaveBakedHtml'); const logs2 = []; const c2 = await L.newCtx(browser, { serviceWorkers: 'allow' }); const p2 = await c2.newPage(); p2.on('console', m => logs2.push(m.text())); p2.on('pageerror', e => logs2.push('ERR ' + e.message)); await p2.goto('file://' + f); await p2.waitForTimeout(500); check('app: a downloaded copy opened from a file opens cleanly and does not try to register a service worker', (await p2.locator('.container').isVisible()) && (await p2.evaluate(() => location.protocol)) === 'file:' && logs2.filter(x => /ERR|ServiceWorker|service worker/i.test(x)).length === 0, logs2.join(' | ')); await c2.close(); await c.ctx.close(); }

  const errs = logs.filter(x => /pageerror|console\.error/.test(x) && !/Failed to load resource|net::ERR|404/.test(x));
  check('no script errors anywhere in this run', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = L.summary('FOUNDATION CHECKS'); await browser.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
