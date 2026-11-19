// Backward compatibility: links and saved calendars made by the ORIGINAL build must open unchanged in the new one.
const L = require('./lib'); const { check } = L;
const OLD = process.env.KB_OLD || L.path.join(L.ROOT, 'compat', 'v0-original.html');
(async () => {
  const { srv, url } = await L.startServer({ '/old.html': () => L.fs.readFileSync(OLD, 'utf8') }); const browser = await L.chromium.launch(); const logs = [];
  const mk = async () => { const ctx = await L.newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], timezoneId: 'America/Chicago' }); await L.stubGumroad(ctx, 'ok'); const page = await ctx.newPage(); L.watch(page, logs); return { ctx, page }; };
  const text = async p => ({ title: await p.textContent('#headerTitle'), rules: (await p.textContent('#rulesSummaryBox')).replace(/\s+/g, ' '), stats: JSON.stringify(await L.stats(p)), notes: await p.textContent('#notesReadonly'), school: (await p.textContent('#schoolMainDisplay')).replace(/\s+/g, ' ') });
  const scenarios = {
    'default summer (rest with Parent 2)': async p => { await p.click('.preset-btn[data-preset="7-7"]'); },
    'weekly, Monday start, birthdays, custom days': async p => { await p.click('#modeWeeklyBtn'); for (const i of [2, 3, 4]) await p.evaluate(i => document.querySelectorAll('.dp-tile')[i].click(), i); await p.click('#weekStartMonBtn'); await p.selectOption('#bdayChildMonth', '8'); await p.selectOption('#bdayChildDay', '12'); await p.selectOption('#bdayP1Month', '1'); await p.selectOption('#bdayP1Day', '29'); for (const d of ['2026-03-04', '2026-03-05', '2026-10-31']) await p.click(`button.day-cell[data-ds="${d}"]`); await p.click('button.day-cell[data-ds="2026-03-05"]'); },
    'two-week, Monday start, summer weeks, holidays, school dates, notes': async p => { await p.click('#weekStartMonBtn'); await p.click('.preset-btn[data-preset="2-2-5-5"]'); await p.fill('#biweeklyAnchorInput', '2026-02-11'); await p.dispatchEvent('#biweeklyAnchorInput', 'change'); for (const w of ['Jun 8–14', 'Jul 1–7', 'Aug 1–7']) await p.evaluate(w => [...document.querySelectorAll('.week-chip')].find(c => c.textContent === w).click(), w); await p.click('#summerRestBaseBtn'); await p.selectOption('#mothersDayOwnerSelect', 'p2'); await p.selectOption('#fathersDayOwnerSelect', 'both'); await p.click('#rotFlippedBtn'); await p.evaluate(() => [...document.querySelectorAll('.hol-tile')].find(t => t.textContent.includes('Halloween')).click()); await p.evaluate(() => [...document.querySelectorAll('.hol-tile')].find(t => t.textContent.includes('Labor Day')).click()); await p.fill('#customHolName', 'Eid'); await p.fill('#customHolEmoji', '🌙'); await p.selectOption('#customHolMonth', '2'); await p.selectOption('#customHolDay', '20'); await p.selectOption('#customHolRule', 'altB'); await p.click('#btnAddCustomHol'); await p.fill('#addSchoolStart', '2026-02-13'); await p.fill('#addSchoolEnd', '2026-02-17'); await p.fill('#addSchoolLabel', 'Mid-winter break'); await p.selectOption('#addSchoolKind', 'p1'); await p.click('#btnAddSchoolEvent'); await p.fill('#springBreakInput', '2026-04-06'); await p.dispatchEvent('#springBreakInput', 'change'); await p.fill('#timeToP2Input', '6:00 PM'); await p.fill('#exchangeLocationInput', 'School; front office, "main" door'); await p.fill('#p1ColorInput', '#3366cc'); await p.dispatchEvent('#p1ColorInput', 'input'); await p.fill('#summerEmojiInput', '🏖️'); await p.dispatchEvent('#summerEmojiInput', 'input'); await p.click('#splitDaysOff'); await p.click('#btnToggleNotesEdit'); await p.fill('#notesTextarea', 'Line one\nLine two — “quotes”, émoji 🎈 & <tags>'); await p.click('#btnToggleNotesEdit'); },
    'monthly pattern': async p => { await p.click('#modeMonthlyBtn'); for (const i of [0, 6, 7, 13, 20, 30, 34]) await p.evaluate(i => document.querySelectorAll('.dp-tile')[i].click(), i); await p.click('#summerOffBtn'); },
  };
  for (const [name, setup] of Object.entries(scenarios)) {
    const a = await mk(); await a.page.goto(url + 'old.html'); await L.unlock(a.page, { names: ['Avery', 'Jordan', 'Taylor'] }); await setup(a.page); await a.page.waitForTimeout(150);
    const want = { o: await L.owners(a.page), t: await text(a.page) };
    await L.act(a.page, '#btnCopyLink'); await a.page.click('#btnShareCopy'); await a.page.waitForSelector('#shareResult.show'); const plain = (await a.page.evaluate(() => navigator.clipboard.readText())).replace('old.html', '');
    await a.page.click('#btnShareCancel'); await L.act(a.page, '#btnCopyLink'); await a.page.fill('#sharePasscode', 'secret-pass'); await a.page.fill('#sharePasscode2', 'secret-pass'); await a.page.click('#btnShareCopy'); await a.page.waitForSelector('#shareResult.show'); const locked = (await a.page.evaluate(() => navigator.clipboard.readText())).replace('old.html', ''); await a.page.click('#btnShareCancel');
    const legacy = await a.page.evaluate(() => { const s = JSON.parse(localStorage.custody_cal_v9); return '#s=' + encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(s))))); });
    // saved calendar opened by the new build in the same browser profile
    await a.page.goto(url); await a.page.waitForTimeout(300);
    let got = { o: await L.owners(a.page), t: await text(a.page) };
    check(`saved calendar from the old version loads unchanged — ${name}`, JSON.stringify(got) === JSON.stringify(want), Object.keys(want.o).filter(k => want.o[k] !== got.o[k]).length + ' nights differ; text same: ' + (JSON.stringify(got.t) === JSON.stringify(want.t)));
    // ...and can be edited, saved, reloaded
    await a.page.click('button.day-cell[data-ds="2026-09-15"]'); await a.page.waitForTimeout(150); await a.page.reload(); await a.page.waitForTimeout(250);
    check(`...and keeps working after an edit + reload — ${name}`, (await a.page.locator('button.day-cell[data-ds="2026-09-15"].is-override').count()) === 1);
    await a.ctx.close();
    for (const [kind, lk] of [['plain', plain], ['locked', locked], ['older-format', url + legacy]]) {
      const b = await mk(); await L.unlock(await (async () => { await b.page.goto(url); return b.page; })(), {});      // licensed viewer: no view-only layout changes
      await b.page.goto(lk);
      if (kind === 'locked') { await b.page.waitForSelector('#passcodeOverlay.show', { timeout: 8000 }); await b.page.fill('#unlockPasscode', 'secret-pass'); await b.page.click('#btnUnlockShare'); }
      await b.page.waitForSelector('#sharedBanner.show', { timeout: 8000 }); await b.page.evaluate(() => document.getElementById('viewYearBtn').click());
      got = { o: await L.owners(b.page), t: await text(b.page) };
      check(`${kind} link from the old version opens unchanged — ${name}`, JSON.stringify(got.o) === JSON.stringify(want.o) && got.t.rules === want.t.rules && got.t.notes === want.t.notes && got.t.school === want.t.school && got.t.stats === want.t.stats, Object.keys(want.o).filter(k => want.o[k] !== got.o[k]).length + ' nights differ');
      await b.ctx.close();
    }
  }
  // links made by the new build open in the new build (round trip), including a new-default calendar
  { const a = await mk(); await a.page.goto(url); await L.unlock(a.page, { names: ['Avery', 'Jordan', 'Taylor'] }); await a.page.click('.preset-btn[data-preset="5-2-2-5"]'); await a.page.evaluate(() => [...document.querySelectorAll('.hol-tile')].find(t => t.textContent.includes('Juneteenth')).click()); await a.page.evaluate(() => [...document.querySelectorAll('.week-chip')].find(c => c.textContent === 'Jul 8–14').click()); const want = await L.owners(a.page); await L.act(a.page, '#btnCopyLink'); await a.page.click('#btnShareCopy'); await a.page.waitForSelector('#shareResult.show'); const lk = await a.page.evaluate(() => navigator.clipboard.readText()); await a.ctx.close(); const b = await mk(); await b.page.goto(lk); await b.page.waitForSelector('#sharedBanner.show'); check('new link → new build: identical schedule (new defaults, enabled Juneteenth, summer week)', JSON.stringify(await L.owners(b.page)) === JSON.stringify(want)); await b.ctx.close(); }
  const errs = logs.filter(x => /pageerror|console\.error/.test(x) && !/Failed to load resource|net::ERR/.test(x));
  check('no script errors anywhere in this run', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = L.summary('COMPATIBILITY CHECKS'); await browser.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
