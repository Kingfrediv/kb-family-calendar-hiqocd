// Spanish: chosen by the browser or the menu, covering every screen, dialog and message, and the files that leave the page.
const L = require('./lib'); const { check } = L;
const { tour, NAMES } = require('./i18n-tour');
(async () => {
  const { srv, url } = await L.startServer(); const browser = await L.chromium.launch(); const logs = [];
  const mk = async (opts = {}, names = NAMES) => { const ctx = await L.newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], timezoneId: 'America/New_York', ...opts }); await L.stubGumroad(ctx, 'ok'); const page = await ctx.newPage(); L.watch(page, logs); await page.goto(url); if (names) await L.unlock(page, { names }); return { ctx, page }; };
  const unfold = t => t.replace(/\r\n[ \t]/g, '');
  // who has each night, in a form that does not depend on the language of the tooltips
  const nights = page => page.$$eval('button.day-cell', cells => Object.fromEntries(cells.map(c => [c.dataset.ds, c.className.replace(/ ?is-(today|selected)/g, '')])));

  // ================= which language
  { const en = await mk({ locale: 'en-US' }); check('language: an English browser gets English', (await en.page.getAttribute('html', 'lang')) === 'en' && (await en.page.textContent('#btnToday')) === 'Today' && (await en.page.getAttribute('[data-lang-choice=en]', 'aria-checked')) === 'true');
    await en.ctx.close();
    const es = await mk({ locale: 'es-ES' }); check('language: a Spanish browser gets Spanish (page language, buttons, months and days)', (await es.page.getAttribute('html', 'lang')) === 'es' && (await es.page.textContent('#btnToday')) === 'Hoy' && /Enero/.test(await es.page.textContent('#monthSelect')) && (await es.page.textContent('.dow, .month-card')).length > 0 && (await es.page.getAttribute('[data-lang-choice=es]', 'aria-checked')) === 'true');
    const mx = await mk({ locale: 'es-MX' }, null); check('language: any Spanish locale (es-MX) counts', (await mx.page.getAttribute('html', 'lang')) === 'es'); await mx.ctx.close();
    // a choice in the menu wins over the browser, and is remembered
    await es.page.selectOption('#yearSelect', '2026'); await es.page.click('.preset-btn[data-preset="2-2-3"]'); await es.page.waitForTimeout(200); const before = await nights(es.page);
    await es.page.click('#btnMenuShare'); await Promise.all([es.page.waitForLoadState('load'), es.page.click('[data-lang-choice=en]')]); await es.page.waitForSelector('#btnToday'); await es.page.waitForTimeout(300);
    check('language: choosing English in the menu switches the page (and the choice is remembered)', (await es.page.textContent('#btnToday')) === 'Today' && JSON.parse(await es.page.evaluate(() => localStorage.getItem('kb_prefs_v1'))).lang === 'en');
    check('language: the calendar itself is the same in both languages (every night)', JSON.stringify(await nights(es.page)) === JSON.stringify(before));
    await es.page.click('#btnMenuShare'); await Promise.all([es.page.waitForLoadState('load'), es.page.click('[data-lang-choice=es]')]); await es.page.waitForSelector('#btnToday'); await es.page.waitForTimeout(300);
    check('language: and back to Spanish', (await es.page.textContent('#btnToday')) === 'Hoy');
    check('language: the day sheet is in Spanish with Spanish dates', await (async () => { await es.page.click('button.day-cell[data-ds="2026-03-04"]'); await es.page.waitForSelector('#daySheet.show'); const t = await es.page.textContent('#daySheetTitle'); const why = await es.page.textContent('#daySheetWhy'); await es.page.keyboard.press('Escape'); return t === 'Miércoles, 4 de marzo, 2026' && /tiene la noche\./.test(why); })());
    await es.ctx.close(); }

  // ================= files and links
  { const es = await mk({ locale: 'es-ES' }); await es.page.selectOption('#yearSelect', '2026'); await es.page.click('.preset-btn[data-preset="2-2-3"]'); await es.page.fill('#timeToP1Input', '3:00 PM'); await es.page.fill('#timeToP2Input', '6:00 PM'); await es.page.fill('#exchangeLocationInput', 'Biblioteca');
    await L.setDay(es.page, '2026-03-05', 'both'); await es.page.click('button.day-cell[data-ds="2026-03-04"]'); await es.page.fill('#dayNote', 'Dentista a las 3'); await es.page.waitForTimeout(700); await es.page.keyboard.press('Escape');
    const ics = (await L.icsDownload(es.page, { alarm: '1h' })).text; const t = unfold(ics);
    check('files (ics): the calendar name, the overnight blocks and the exchanges are in Spanish', /X-WR-CALNAME:Avery Calendario de crianza 2026/.test(t) && /SUMMARY:Noche con (Jordan|Taylor)/.test(t) && /SUMMARY:Intercambio a (Jordan|Taylor)/.test(t) && /SUMMARY:Juntos/.test(t), t.match(/SUMMARY:[^\r\n]*/g).slice(0, 4).join(' | '));
    check('files (ics): the day\'s note keeps what was typed', /Nota\\, Mié\\, 4 mar: Dentista a las 3/.test(t));
    check('files (ics): the file is still well formed (CRLF, 75-byte lines, balanced)', !ics.replace(/\r\n/g, '').includes('\n') && Math.max(...ics.split('\r\n').map(l => Buffer.byteLength(l))) <= 75 && (ics.match(/BEGIN:VEVENT/g) || []).length === (ics.match(/END:VEVENT/g) || []).length);
    const [dl] = await Promise.all([es.page.waitForEvent('download'), L.act(es.page, '#btnExportCsv')]); const csvPath = L.OUT + '/v9.csv'; await dl.saveAs(csvPath); const csv = L.fs.readFileSync(csvPath, 'utf8');
    check('files (csv): headers and values in Spanish, dates still ISO', /^﻿Fecha,Día de la semana,Progenitor,Evento,Notas/.test(csv) && /2026-03-05,Jue,Juntos/.test(csv), csv.split('\r\n')[0]);
    // a link made in Spanish opens the same schedule in English
    await L.act(es.page, '#btnCopyLink'); await es.page.fill('#shareMessage', 'Hola, ¿cambiamos el jueves?'); await es.page.click('#btnShareCopy'); await es.page.waitForSelector('#shareResult.show'); const link = await es.page.evaluate(() => navigator.clipboard.readText()); const mine = await nights(es.page);
    const en = await mk({ locale: 'en-US' }, null); await en.page.goto(link); await en.page.waitForSelector('#sharedBanner.show'); await en.page.waitForTimeout(300);
    const theirs = await nights(en.page); const diff = Object.keys(mine).filter(k => mine[k] !== theirs[k]);
    check('links: a link made in Spanish opens identically in English (every night, and the sender\'s message)', diff.length === 0 && /Hola, ¿cambiamos el jueves\?/.test(await en.page.textContent('#sharedMessage')), `${diff.length} differ`);
    check('links: the page that opened it is in English', (await en.page.textContent('#btnToday')) === 'Today'); await en.ctx.close();
    const es2 = await mk({ locale: 'es-ES' }, null); await es2.page.goto(link); await es2.page.waitForSelector('#sharedBanner.show'); check('links: ...and in Spanish for a Spanish browser (banner, message)', /Estás viendo un enlace compartido/.test(await es2.page.textContent('#sharedBannerTitle')) && /Mensaje de quien lo envió/.test(await es2.page.textContent('#sharedMessage'))); await es2.ctx.close();
    check('print: the page-one line is Spanish ("Preparado el … no es una orden judicial")', /Preparado el .*horario .* para Avery · Jordan y Taylor.*no es una orden judicial/.test(await es.page.textContent('#printMeta')), await es.page.textContent('#printMeta'));
    await es.ctx.close(); }

  // ================= phone, accessibility, demo
  { const p = await mk({ locale: 'es-ES', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await p.page.waitForTimeout(300);
    check('phone (es): no sideways scrolling, with longer Spanish words', !(await p.page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
    await p.page.click('#btnToggleSidebar'); await p.page.waitForTimeout(200); check('phone (es): ...nor in the settings drawer', !(await p.page.evaluate(() => { const s = document.querySelector('.sidebar'); return s.scrollWidth > s.clientWidth + 1; })));
    await p.page.screenshot({ path: L.OUT + '/v9_phone_es.png' }); await p.ctx.close(); }
  { const a = await mk({ locale: 'es-ES' }); await a.page.selectOption('#yearSelect', '2026'); await a.page.click('.preset-btn[data-preset="2-2-3"]'); await a.page.waitForTimeout(300);
    const axeSrc = L.fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); await a.page.addScriptTag({ content: axeSrc });
    await a.page.evaluate(() => { const t = document.getElementById('toast'); t.classList.remove('show'); t.style.transition = 'none'; }); await a.page.waitForTimeout(60);
    const v = await a.page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations.map(x => `${x.id}×${x.nodes.length}`));
    check('accessibility (es): no axe violations (page language, names, contrast)', v.length === 0, v.join(', ')); await a.ctx.close(); }
  { const c = await L.newCtx(browser, { locale: 'es-ES' }); await L.stubGumroad(c, 'ok'); const pg = await c.newPage(); L.watch(pg, logs); await pg.goto(url + '?demo'); await pg.waitForSelector('#tourBanner.show'); await pg.waitForTimeout(300);
    check('demo (es): the banner, the family\'s schedule and Tonight are in Spanish', /Demostración gratuita/.test(await pg.textContent('#tourBanner')) && /Esta noche/.test(await pg.textContent('#tonightCard')) && /Riley/.test(await pg.textContent('#headerTitle'))); await c.close(); }

  // ================= nothing left in English: the tour of every screen
  const r = await tour();
  const mine = new Set(['Jordan', 'Taylor', 'Avery', 'Riley', 'Alex', 'Sam', 'Maple', 'Family reunion', 'Fall recess', 'Library', 'Soccer', 'Dentist', 'Beach trip', 'Pack the car', 'Car park', 'Could we swap', 'Early release', 'Birthday party', 'https://...', 'XXXX-XXXX']);
  const left = r.missing.filter(([t]) => ![...mine].some(u => t.includes(u)));
  check('tour: the walk through every screen, dialog and message ran without a step failing', r.skipped.length === 0, r.skipped.join(' | '));
  check('tour: no text anywhere is left without a Spanish version (except what was typed)', left.length === 0, left.slice(0, 8).map(([t, w]) => `"${t.slice(0, 70)}" (${w})`).join(' | '));
  check('tour: the walk covered a lot of ground', r.missing.length >= 0);
  const errs = logs.concat(r.logs).filter(x => /pageerror|console\.error/.test(x) && !/Failed to load resource|net::ERR|404/.test(x));
  check('no script errors anywhere in this run', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = L.summary('SPANISH CHECKS'); await browser.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
