// Everyday comforts: phone layout and settings drawer, Tonight card, swipe, "Saved" cue, Undo on resets, year rollover,
// dates in words, time suggestions, and the free demo.
const L = require('./lib'); const { check } = L;
(async () => {
  const { srv, url } = await L.startServer(); const browser = await L.chromium.launch(); const logs = [];
  const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
  const mk = async (opts = {}, names = ['Avery', 'Jordan', 'Taylor']) => { const ctx = await L.newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], timezoneId: 'America/New_York', ...opts }); await L.stubGumroad(ctx, 'ok'); const page = await ctx.newPage(); L.watch(page, logs); await page.goto(url); if (names) await L.unlock(page, { names }); return { ctx, page }; };
  const Y = new Date().getFullYear();
  const top = async (page, sel) => (await page.locator(sel).first().boundingBox()).y;

  // ================= desktop order and phone drawer
  let { ctx, page } = await mk(); await page.selectOption('#yearSelect', String(Y)); await page.click('.preset-btn[data-preset="2-2-3"]'); await page.waitForTimeout(300);
  check('order (desktop): summary and stats come first, then the calendar, then the totals table', (await top(page, '#summaryCard')) < (await top(page, '#statsCard')) && (await top(page, '#statsCard')) < (await top(page, '#calendarContainer')) && (await top(page, '#calendarContainer')) < (await top(page, '#totalsCard')));
  check('desktop: the settings stay beside the calendar and the drawer buttons are not shown', (await page.locator('#btnCloseSettings').isHidden()) && (await page.locator('#settingsBackdrop').isHidden()) && (await page.evaluate(() => getComputedStyle(document.querySelector('.sidebar')).position)) !== 'fixed');
  await ctx.close();

  { // first run on a phone: settings folded, calendar first
    const q = await mk(phone); await q.page.waitForTimeout(300);
    check('phone: the settings start folded away and the calendar comes before the summary', (await q.page.locator('.sidebar').isHidden()) && (await top(q.page, '#calendarContainer')) < (await top(q.page, '#summaryCard')), `${await top(q.page, '#calendarContainer')} vs ${await top(q.page, '#summaryCard')}`);
    check('phone: the header is compact (subtitle and brand line hidden)', (await q.page.locator('#headerSubtitle').isHidden()) && (await q.page.evaluate(() => document.querySelector('header').getBoundingClientRect().height)) < 340);
    await q.page.click('#btnToggleSidebar'); await q.page.waitForSelector('#btnCloseSettings', { state: 'visible' });
    check('phone: settings open as a drawer over the page with a backdrop and a Done button', (await q.page.evaluate(() => getComputedStyle(document.querySelector('.sidebar')).position)) === 'fixed' && (await q.page.locator('#settingsBackdrop').isVisible()) && (await q.page.getAttribute('#btnToggleSidebar', 'aria-expanded')) === 'true');
    await q.page.click('#btnCloseSettings'); check('phone drawer: Done closes it and focus returns to the settings button', (await q.page.locator('.sidebar').isHidden()) && (await q.page.evaluate(() => document.activeElement.id)) === 'btnToggleSidebar');
    await q.page.click('#btnToggleSidebar'); await q.page.keyboard.press('Escape'); check('phone drawer: Escape closes it', await q.page.locator('.sidebar').isHidden());
    await q.page.click('#btnToggleSidebar'); await q.page.mouse.click(382, 400); check('phone drawer: a tap outside it closes it', await q.page.locator('.sidebar').isHidden());
    await q.page.click('#btnToggleSidebar'); await q.page.reload(); await q.page.waitForTimeout(400); check('phone drawer: left open, it is closed again after a reload (the calendar comes first)', await q.page.locator('.sidebar').isHidden());
    await q.page.click('#btnToggleSidebar'); await q.page.click('.preset-btn[data-preset="7-7"]'); check('phone drawer: the controls inside work', /7\/14/.test((await L.stats(q.page)).base));
    await q.page.screenshot({ path: L.OUT + '/v8_phone_drawer.png' }); await q.ctx.close(); }

  // ================= Tonight card
  { const m = await mk(); await m.page.selectOption('#yearSelect', String(Y)); const hiddenBefore = await m.page.locator('#tonightCard').isHidden();
    await m.page.click('.preset-btn[data-preset="2-2-3"]'); await m.page.waitForSelector('#tonightCard:not([hidden])');
    const cell = await m.page.$eval('button.day-cell.is-today', e => e.title);
    const who = await m.page.textContent('#tonightWho'); const nameInCell = (cell.match(/: (.*?) overnight/) || [])[1];
    check('tonight: hidden until a schedule is set', hiddenBefore);
    check('tonight: says who has tonight (agrees with today\'s cell) and is coloured for that parent', who === nameInCell && (await m.page.getAttribute('#tonightCard', 'class')).includes(nameInCell === 'Jordan' ? 'p1' : 'p2'), `${who} vs ${nameInCell}`);
    const sub = await m.page.textContent('#tonightSub'); check('tonight: also says tomorrow and the next exchange', /Tomorrow: \S+/.test(sub) && /Next exchange: .*→/.test(sub), sub);
    await m.page.fill('#timeToP1Input', '3:00 PM'); await m.page.fill('#timeToP2Input', '3:00 PM'); await m.page.fill('#exchangeLocationInput', 'Library'); await m.page.waitForTimeout(200);
    check('tonight: the exchange line carries the time and place from the settings', /3:00 PM · Library/.test(await m.page.textContent('#tonightSub')), await m.page.textContent('#tonightSub'));
    await m.page.click('#tonightOpen'); check('tonight: tapping it opens today\'s day sheet', (await m.page.locator('#daySheet.show').count()) === 1 && (await m.page.textContent('#daySheetTitle')).includes(String(Y))); await m.page.keyboard.press('Escape');
    await m.page.selectOption('#yearSelect', String(Y + 1)); check('tonight: hidden while another year is on screen', await m.page.locator('#tonightCard').isHidden());
    await m.ctx.close(); }

  // ================= swipe between months (phone)
  { const m = await mk(phone); await m.page.click('#btnToggleSidebar'); await m.page.click('#viewMonthBtn'); await m.page.click('#btnCloseSettings'); await m.page.click('#btnToday');
    const title = () => m.page.textContent('.month-title span');
    const swipe = (dx, dy) => m.page.evaluate(([dx, dy]) => { const box = document.getElementById('calendarContainer'); const t = box.querySelector('.day-cell') || box; const mk = (type, x, y, list) => t.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [new Touch({ identifier: 1, target: t, clientX: x, clientY: y })], changedTouches: [new Touch({ identifier: 1, target: t, clientX: x, clientY: y })] })); mk('touchstart', 200, 400); mk('touchend', 200 + dx, 400 + dy); }, [dx, dy]);
    const start = await title(); await swipe(-120, 10); await m.page.waitForTimeout(150); const next = await title();
    check('swipe: a swipe to the left shows the next month', next !== start, `${start} -> ${next}`);
    await swipe(130, -5); await m.page.waitForTimeout(150); check('swipe: a swipe to the right comes back', (await title()) === start);
    await swipe(20, 5); check('swipe: a small movement does nothing', (await title()) === start);
    await swipe(100, 160); check('swipe: a mostly-vertical movement (scrolling) does nothing', (await title()) === start);
    await m.page.click('#btnToggleSidebar'); await m.page.click('#viewYearBtn'); await m.page.click('#btnCloseSettings'); await swipe(-150, 0); check('swipe: in the year view it does nothing', (await m.page.locator('.month-card').count()) === 12);
    await m.ctx.close(); }

  // ================= "Saved" cue, and an honest warning when the browser will not store it
  { const m = await mk(); await m.page.click('.preset-btn[data-preset="7-7"]'); await m.page.waitForTimeout(150);
    check('saved: a change shows "Saved ✓" under the title', /Saved ✓/.test(await m.page.textContent('#saveStatus')), await m.page.textContent('#saveStatus'));
    await m.page.waitForTimeout(3200); check('saved: and the line clears again by itself', (await m.page.textContent('#saveStatus')).trim() === '');
    await m.page.evaluate(() => { const real = Storage.prototype.setItem; window.__realSet = real; Storage.prototype.setItem = function (k, v) { if (/^custody_cal/.test(k)) throw new DOMException('full', 'QuotaExceededError'); return real.call(this, k, v); }; });
    await m.page.click('.preset-btn[data-preset="2-2-3"]'); await m.page.waitForTimeout(3300);
    check('saved: when the browser refuses to store it, a warning stays on screen (not a silent loss)', /Not saved/.test(await m.page.textContent('#saveStatus')) && (await m.page.getAttribute('#saveStatus', 'class')).includes('bad'), await m.page.textContent('#saveStatus'));
    await m.page.evaluate(() => { Storage.prototype.setItem = window.__realSet; }); await m.page.click('.preset-btn[data-preset="3-4-4-3"]'); await m.page.waitForTimeout(200);
    check('saved: the warning gives way to "Saved ✓" once saving works again', /Saved ✓/.test(await m.page.textContent('#saveStatus')) && !(await m.page.getAttribute('#saveStatus', 'class')).includes('bad'));
    await m.ctx.close(); }

  // ================= Undo on the reset buttons
  { const m = await mk(); await m.page.selectOption('#yearSelect', '2026'); await m.page.click('.preset-btn[data-preset="7-7"]'); await L.flipDay(m.page, '2026-03-04'); const o = await L.owners(m.page); const edited = o['2026-03-04'];
    await m.page.click('#btnResetOverrides'); const afterReset = (await L.owners(m.page))['2026-03-04']; check('reset days: clears the hand-changed days', afterReset !== edited && /Cleared the changed days/.test(await m.page.textContent('#toastText')));
    check('reset days: the message offers Undo', (await m.page.textContent('#toastAction')) === 'Undo'); await m.page.click('#toastAction'); check('reset days: Undo brings the changed day back', (await L.owners(m.page))['2026-03-04'] === edited);
    await m.page.evaluate(() => [...document.querySelectorAll('.hol-tile')].find(t => t.textContent.includes('Halloween')).click()); const tilesBefore = JSON.stringify(await m.page.$$eval('.hol-tile', t => t.map(x => x.className)));
    await m.page.click('#btnResetHolidays'); check('reset tiles: offers Undo and Undo restores them', (await m.page.textContent('#toastAction')) === 'Undo' && (await m.page.$$eval('.hol-tile', t => t.map(x => x.className))).join() !== JSON.parse(tilesBefore).join()); await m.page.click('#toastAction'); check('reset tiles: ...back to how they were', JSON.stringify(await m.page.$$eval('.hol-tile', t => t.map(x => x.className))) === tilesBefore);
    await m.page.fill('#exchangeLocationInput', 'Library'); await m.page.waitForTimeout(150);
    await m.page.click('#btnResetAll'); check('reset all: blanks the calendar (names, schedule, place)', (await m.page.inputValue('#childNameInput')) === '' && (await m.page.inputValue('#exchangeLocationInput')) === '');
    check('reset all: and the message offers Undo', (await m.page.textContent('#toastAction')) === 'Undo'); await m.page.click('#toastAction'); await m.page.waitForTimeout(200);
    check('reset all: Undo brings back everything (names, schedule, place)', (await m.page.inputValue('#childNameInput')) === 'Avery' && (await m.page.inputValue('#exchangeLocationInput')) === 'Library' && (await L.owners(m.page))['2026-03-04'] === edited);
    await m.page.reload(); await m.page.waitForTimeout(300); check('reset all: ...and it is still there after a reload', (await m.page.inputValue('#childNameInput')) === 'Avery');
    await m.ctx.close(); }

  // ================= a calendar last used in an earlier year opens on this year
  { const m = await mk(); await m.page.click('.preset-btn[data-preset="7-7"]'); await m.page.waitForTimeout(200);
    const key = await m.page.evaluate(() => Object.keys(localStorage).find(k => /^custody_cal_v9/.test(k)));
    await m.page.evaluate(([k, y]) => { const s = JSON.parse(localStorage.getItem(k)); s.year = y - 1; s.selectedMonth = 4; s.savedAt = new Date(y - 1, 11, 20).getTime(); localStorage.setItem(k, JSON.stringify(s)); }, [key, Y]); await m.page.reload(); await m.page.waitForTimeout(400);
    check('new year: a calendar last used last year opens on this year and this month', (await m.page.inputValue('#yearSelect')) === String(Y) && (await m.page.textContent('#headerYearBadge')) === String(Y));
    await m.page.evaluate(([k, y]) => { const s = JSON.parse(localStorage.getItem(k)); s.year = y - 1; s.savedAt = Date.now(); localStorage.setItem(k, JSON.stringify(s)); }, [key, Y]); await m.page.reload(); await m.page.waitForTimeout(400);
    check('new year: ...but a year chosen on purpose this year is left alone', (await m.page.inputValue('#yearSelect')) === String(Y - 1));
    await m.ctx.close(); }

  // ================= dates in words, time suggestions
  { const m = await mk(); await m.page.fill('#schoolEndInput', '2026-06-12'); await m.page.dispatchEvent('#schoolEndInput', 'change'); await m.page.waitForTimeout(200);
    check('dates: a date box says the date in words underneath', /Friday, June 12/.test(await m.page.evaluate(() => document.getElementById('schoolEndInput').nextElementSibling.textContent)), await m.page.evaluate(() => document.getElementById('schoolEndInput').nextElementSibling.textContent));
    check('times: the time boxes offer common times but still take anything typed', (await m.page.getAttribute('#timeToP1Input', 'list')) === 'timeSuggestions' && (await m.page.locator('#timeSuggestions option').count()) >= 8);
    await m.page.fill('#timeToP1Input', 'Right after swim practice'); check('times: free text is kept', (await m.page.inputValue('#timeToP1Input')) === 'Right after swim practice');
    await m.ctx.close(); }

  // ================= the licence wall: lost-key help and the demo link
  { const c = await L.newCtx(browser, { timezoneId: 'America/New_York' }); await L.stubGumroad(c, 'ok'); const pg = await c.newPage(); L.watch(pg, logs); await pg.goto(url);
    check('licence wall: says where to find a lost key', /Lost your key\?.*Gumroad/.test(await pg.textContent('#licenseOverlay')));
    check('licence wall: offers a free demo link', (await pg.getAttribute('#btnTryDemo', 'href')) === '?demo'); await pg.click('#btnTryDemo'); await pg.waitForSelector('#tourBanner.show'); check('demo: the link opens the demo with no licence wall', (await pg.locator('#licenseOverlay.show').count()) === 0);
    await c.close(); }

  // ================= the free demo
  { const c = await L.newCtx(browser, { timezoneId: 'America/New_York' }); await L.stubGumroad(c, 'ok'); const pg = await c.newPage(); L.watch(pg, logs); await pg.goto(url + '?demo'); await pg.waitForSelector('#tourBanner.show'); await pg.waitForTimeout(300);
    check('demo: shows a made-up family (Riley, Alex and Sam) and says it is a demo', /Riley/.test(await pg.textContent('#headerTitle')) && /Alex/.test(await pg.textContent('#rulesSummaryBox')) && /Free demo/.test(await pg.textContent('#tourBanner')));
    check('demo: a schedule is already there (Tonight card, days coloured)', (await pg.locator('#tonightCard:not([hidden])').count()) === 1 && (await pg.locator('button.day-cell.p1, button.day-cell.p2').count()) > 100);
    check('demo: offers the way to buy and the way back to a real key', (await pg.locator('#btnTourBuy').getAttribute('href')).includes('gumroad.com') && (await pg.locator('#btnTourKey').getAttribute('href')) === './');
    await pg.click('button.day-cell.is-today'); await pg.waitForSelector('#daySheet.show'); check('demo: tapping a day shows who has it and why, read-only', /overnight/.test(await pg.textContent('#daySheetWhy')) && (await pg.locator('#dayEdit').isHidden())); await pg.keyboard.press('Escape');
    await pg.click('#btnMenuShare'); check('demo: exporting, sharing and saving are switched off', (await pg.locator('#btnExportIcs').isDisabled()) && (await pg.locator('#btnSaveBakedHtml').isDisabled()) && (await pg.locator('#btnCopyLink').isDisabled()) && (await pg.locator('#btnBackup').isDisabled())); await pg.keyboard.press('Escape');
    await pg.click('#btnToggleSidebar'); check('demo: the settings can be looked at but not changed (controls ignore taps)', (await pg.evaluate(() => getComputedStyle(document.querySelector('.preset-btn')).pointerEvents)) === 'none' && (await pg.evaluate(() => getComputedStyle(document.getElementById('childNameInput')).pointerEvents)) === 'none' && /Riley/.test(await pg.inputValue('#childNameInput')));
    check('demo: nothing is stored on the device', (await pg.evaluate(() => Object.keys(localStorage).filter(k => /^custody_cal|kb_hist|kb_profiles/.test(k)))).length === 0);
    check('demo: no licence dialog was shown', (await pg.locator('#licenseOverlay.show').count()) === 0);
    await c.close(); }
  { // someone who owns it: the demo does not touch their calendar and shows no sales pitch
    const m = await mk(); await m.page.click('.preset-btn[data-preset="7-7"]'); await m.page.waitForTimeout(200); const before = await m.page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => /^custody_cal|kb_license/.test(k))));
    await m.page.goto(url + '?demo'); await m.page.waitForSelector('#tourBanner.show'); await m.page.waitForTimeout(300);
    check('demo (owner): says "Back to my calendar" instead of selling, and the calendar is the demo family', (await m.page.textContent('#btnTourKey')) === 'Back to my calendar' && (await m.page.locator('#btnTourBuy').isHidden()) && /Riley/.test(await m.page.textContent('#headerTitle')));
    await m.page.click('#btnMenuShare'); check('demo (owner): even an owner cannot save or send the demo family as a copy', (await m.page.locator('#btnSaveBakedHtml').isDisabled()) && (await m.page.locator('#btnCopyLink').isDisabled())); await m.page.keyboard.press('Escape');
    const after = await m.page.evaluate(() => JSON.stringify(Object.entries(localStorage).filter(([k]) => /^custody_cal|kb_license/.test(k)))); check('demo (owner): their saved calendar and licence are untouched', before === after);
    await m.page.click('#btnTourKey'); await m.page.waitForTimeout(500); check('demo (owner): "Back to my calendar" returns to their own', (await m.page.inputValue('#childNameInput')) === 'Avery');
    await m.ctx.close(); }

  const errs = logs.filter(x => /pageerror|console\.error/.test(x) && !/Failed to load resource|net::ERR|404/.test(x));
  check('no script errors anywhere in this run', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = L.summary('USABILITY CHECKS'); await browser.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
