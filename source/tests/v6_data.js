// Data features: day sheet, notes and plans, picking several days, several calendars, change history,
// and comparing a share link with your calendar (the server-free way to agree a swap).
const L = require('./lib'); const { check } = L;
const axeSrc = L.fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => {
  const { srv, url } = await L.startServer(); const browser = await L.chromium.launch(); const logs = [];
  const mk = async (opts = {}, names = ['Avery', 'Jordan', 'Taylor']) => { const ctx = await L.newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], timezoneId: 'America/New_York', ...opts }); await L.stubGumroad(ctx, 'ok'); const page = await ctx.newPage(); L.watch(page, logs); await page.goto(url); if (names) await L.unlock(page, { names }); return { ctx, page }; };
  const owner = async (page, ds) => { const d = (await L.days(page))[ds]; return d ? L.ownerOf(d) : null; };
  const cy = new Date().getFullYear(); const Y = 2026;
  const getLink = async (page, message) => { await L.act(page, '#btnCopyLink'); if (message) await page.fill('#shareMessage', message); await page.click('#btnShareCopy'); await page.waitForSelector('#shareResult.show'); const link = await page.evaluate(() => navigator.clipboard.readText()); await page.click('#btnShareCancel'); return link; };

  let { ctx, page } = await mk(); await page.click('.preset-btn[data-preset="7-7"]');
  await page.selectOption('#yearSelect', String(Y));

  // ================= day sheet
  const base = await owner(page, '2026-03-04');
  await page.click('button.day-cell[data-ds="2026-03-04"]'); await page.waitForSelector('#daySheet.show');
  check('sheet: opens with the date in words and the year', (await page.textContent('#daySheetTitle')) === 'Wednesday, March 4, 2026', await page.textContent('#daySheetTitle'));
  check('sheet: says who has the night and why', /overnight\. The usual schedule/.test(await page.textContent('#daySheetWhy')), await page.textContent('#daySheetWhy'));
  check('sheet: the owner buttons carry the parents\' real names and show who has it', (await page.textContent('#dayOwnerP1')) === 'Jordan' && (await page.textContent('#dayOwnerP2')) === 'Taylor' && (await page.getAttribute(base === 'Jordan' ? '#dayOwnerP1' : '#dayOwnerP2', 'aria-pressed')) === 'true');
  check('sheet: "back to the usual schedule" is not offered when nothing was changed', await page.locator('#dayOwnerUsual').isHidden());
  const other = base === 'Jordan' ? 'P2' : 'P1'; await page.click('#dayOwner' + other);
  check('sheet: choosing the other parent changes the night, and the sheet follows', (await owner(page, '2026-03-04')) !== base && /Set by hand/.test(await page.textContent('#daySheetWhy')) && (await page.locator('#dayOwnerUsual').isVisible()), await page.textContent('#daySheetWhy'));
  check('sheet: the calendar behind it shows the change marker', (await page.locator('button.day-cell[data-ds="2026-03-04"].is-override').count()) === 1);
  await page.click('#dayOwnerBoth'); check('sheet: Together', (await owner(page, '2026-03-04')) === 'Together' && (await page.getAttribute('#dayOwnerBoth', 'aria-pressed')) === 'true');
  await page.click('#dayOwnerUsual'); check('sheet: back to the usual schedule removes the change', (await owner(page, '2026-03-04')) === base && (await page.locator('button.day-cell[data-ds="2026-03-04"].is-override').count()) === 0 && (await page.textContent('#btnResetOverrides')).includes('(0)'));
  await page.click(base === 'Jordan' ? '#dayOwnerP1' : '#dayOwnerP2'); check('sheet: choosing the parent who already has it leaves no stray change', (await page.textContent('#btnResetOverrides')).includes('(0)'));
  // note
  await page.fill('#dayNote', 'Dentist at 3 <b>bold</b>'); await page.waitForTimeout(800);
  check('sheet: a note is kept, shown as a dot on the day and in its tooltip', (await page.locator('button.day-cell[data-ds="2026-03-04"] .day-note-dot').count()) === 1 && /Dentist at 3/.test(await page.getAttribute('button.day-cell[data-ds="2026-03-04"]', 'title')) && /Has a note/.test(await page.getAttribute('button.day-cell[data-ds="2026-03-04"]', 'aria-label')));
  check('sheet: markup in a note is shown as text, never run', (await page.locator('#calendarContainer b, #daySheet b, #daySheet img, #calendarContainer img').count()) === 0 && (await page.inputValue('#dayNote')) === 'Dentist at 3 <b>bold</b>');
  // plans
  await page.fill('#planTime', '16:30'); await page.fill('#planTitle', 'Soccer practice'); await page.click('#btnAddPlan');
  await page.fill('#planTime', '08:00'); await page.fill('#planTitle', 'Drop-off'); await page.keyboard.press('Enter');
  const plans = await page.$$eval('#dayPlans .plan-row', r => r.map(x => x.textContent.replace('✕', '').trim()));
  check('sheet: plans are listed by time with 12-hour times', plans.join('|') === '8:00 AMDrop-off|4:30 PMSoccer practice', plans.join('|'));
  check('sheet: day shows a dot for plans and says how many in its label', /2 plans/.test(await page.getAttribute('button.day-cell[data-ds="2026-03-04"]', 'aria-label')));
  await page.fill('#planTitle', '   '); await page.click('#btnAddPlan'); check('sheet: an empty plan is refused with a message', /Type what is happening/.test(await page.textContent('#toastText')) && (await page.locator('#dayPlans .plan-row').count()) === 2);
  await page.click('#dayPlans .plan-row button'); check('sheet: a plan can be removed', (await page.locator('#dayPlans .plan-row').count()) === 1);
  // a11y of the open sheet
  { await page.addScriptTag({ content: axeSrc }); const v = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations.map(x => `${x.id}×${x.nodes.length} ${x.nodes[0].target.join(' ').slice(0, 60)}`)); check('sheet: open sheet passes the accessibility scan', v.length === 0, v.join(' | ')); }
  // keyboard: Tab stays inside, Escape closes and returns focus to the day
  for (let i = 0; i < 20; i++) await page.keyboard.press('Tab'); check('sheet: Tab stays inside the sheet', await page.evaluate(() => !!document.activeElement.closest('#daySheet')));
  await page.keyboard.press('Escape'); check('sheet: Escape closes it and the day has focus again', (await page.locator('#daySheet.show').count()) === 0 && (await page.evaluate(() => document.activeElement.dataset.ds)) === '2026-03-04');
  // note typed then closed straight away is not lost
  await page.click('button.day-cell[data-ds="2026-03-10"]'); await page.fill('#dayNote', 'Quick note'); await page.keyboard.press('Escape'); await page.reload(); await page.selectOption('#yearSelect', String(Y));
  check('sheet: a note typed and closed at once survives a reload', (await page.locator('button.day-cell[data-ds="2026-03-10"] .day-note-dot').count()) === 1 && (await page.locator('button.day-cell[data-ds="2026-03-04"] .day-note-dot').count()) === 1);
  // undo covers a sheet change
  await page.waitForTimeout(900); const was12 = await owner(page, '2026-03-12'); await L.flipDay(page, '2026-03-12'); const changed = await owner(page, '2026-03-12'); await page.click('#btnUndo'); check('sheet: Undo takes back a change made in the sheet', changed !== was12 && (await owner(page, '2026-03-12')) === was12, `${was12} -> ${changed} -> ${await owner(page, '2026-03-12')}`);

  // ================= picking several days
  await page.waitForTimeout(900);
  await page.click('button.day-cell[data-ds="2026-03-16"]'); await page.click('#btnDaySelectMore');
  check('select: starts from the day you were on, with the bar and a hint', (await page.locator('#rangeBar').isVisible()) && /picked/.test(await page.textContent('#rangeText')) && (await page.locator('button.day-cell.is-selected').count()) === 1, await page.textContent('#rangeText'));
  await page.click('button.day-cell[data-ds="2026-03-19"]');
  check('select: the second tap picks the whole run', (await page.locator('button.day-cell.is-selected').count()) === 4 && /4 days picked: Mar 16 – Mar 19/.test(await page.textContent('#rangeText')), await page.textContent('#rangeText'));
  const before = await owner(page, '2026-03-17'); await page.click('#rangeP' + (before === 'Jordan' ? '2' : '1'));
  const all = []; for (const d of ['16', '17', '18', '19']) all.push(await owner(page, '2026-03-' + d));
  check('select: giving the run to one parent changes every day in it', new Set(all).size === 1 && all[0] !== before, all.join());
  check('select: and says what happened, with Undo', /4 days \(Mar 16 – Mar 19\) set to/.test(await page.textContent('#rangeText')) && (await page.textContent('#toastAction')) === 'Undo', await page.textContent('#rangeText'));
  await page.click('#toastAction'); const back = []; for (const d of ['16', '17', '18', '19']) back.push(await owner(page, '2026-03-' + d));
  check('select: one Undo takes back the whole run', back.join() !== all.join() && (await owner(page, '2026-03-17')) === before, back.join());
  await page.click('button.day-cell[data-ds="2026-03-23"]', { modifiers: [] }); await page.click('button.day-cell[data-ds="2026-03-26"]', { modifiers: ['Shift'] });
  check('select: Shift-click extends from the first day', (await page.locator('button.day-cell.is-selected').count()) === 4);
  await page.click('button.day-cell[data-ds="2026-03-02"]'); await page.click('button.day-cell[data-ds="2026-03-05"]');
  check('select: a new pick starts over', (await page.locator('button.day-cell.is-selected').count()) === 4 && (await page.locator('button.day-cell[data-ds="2026-03-23"].is-selected').count()) === 0);
  // mouse drag
  { const a = await page.locator('button.day-cell[data-ds="2026-04-06"]').boundingBox(), b = await page.locator('button.day-cell[data-ds="2026-04-09"]').boundingBox(); await page.mouse.move(a.x + 5, a.y + 5); await page.mouse.down(); await page.mouse.move(b.x + 5, b.y + 5, { steps: 6 }); await page.mouse.up();
    check('select: dragging with the mouse picks the run', (await page.locator('button.day-cell.is-selected').count()) === 4 && (await page.locator('button.day-cell[data-ds="2026-04-07"].is-selected').count()) === 1 && /4 days picked: Apr 6 – Apr 9/.test(await page.textContent('#rangeText')), await page.textContent('#rangeText')); }
  await page.click('#rangeP1'); await page.click('#btnRangeRequest');
  check('select: "Send a change request" closes the bar and opens the share dialog with the words filled in', (await page.locator('#rangeBar').isHidden()) && (await page.locator('#shareOverlay.show').count()) === 1 && /Change request: 4 days \(Apr 6 – Apr 9\) set to Jordan\./.test(await page.inputValue('#shareMessage')), await page.inputValue('#shareMessage'));
  await page.keyboard.press('Escape');
  await page.click('button.day-cell[data-ds="2026-05-04"]'); await page.click('#btnDaySelectMore'); await page.keyboard.press('Escape'); check('select: Escape leaves selecting mode', (await page.locator('#rangeBar').isHidden()) && (await page.locator('button.day-cell.is-selected').count()) === 0);
  await page.click('button.day-cell[data-ds="2026-05-05"]'); await page.keyboard.press('Escape');

  // ================= several calendars
  { const names0 = await page.textContent('#headerTitle'); check('calendars: one calendar to start, no switcher in the header', (await page.locator('#calendarSwitch').isHidden()) && (await page.locator('#calendarList .list-row').count()) === 1);
    await page.click('#btnAddCalendar'); await page.waitForSelector('#setupOverlay.show');
    check('calendars: a new one opens its set-up and starts blank with the same parents and colors', (await page.inputValue('#setupP1')) === 'Jordan' && (await page.inputValue('#setupP2')) === 'Taylor');
    await page.fill('#setupChild', 'Riley'); await page.click('#btnSetupNext'); await page.click('#btnSetupNext'); await page.click('#btnSetupStart');
    check('calendars: the new calendar is open, named, and has no schedule yet', (await page.textContent('#headerTitle')).includes('Riley') && /not set yet/.test((await L.stats(page)).base));
    check('calendars: the header now has a switcher and the list shows both', (await page.locator('#calendarSwitch').isVisible()) && (await page.locator('#calendarList .list-row').count()) === 2 && (await page.$$eval('#calendarSwitch option', o => o.map(x => x.textContent).join())) === 'Avery,Riley');
    await page.click('.preset-btn[data-preset="2-2-3"]'); await page.selectOption('#yearSelect', String(Y)); await L.setDay(page, '2026-03-04', 'both'); await page.fill('#childNameInput', 'Riley');
    await page.selectOption('#calendarSwitch', ''); await page.waitForTimeout(300);
    check('calendars: switching brings back the first calendar exactly as it was', (await page.textContent('#headerTitle')).includes('Avery') && /7\/14/.test((await L.stats(page)).base) && (await owner(page, '2026-03-04')) === base && (await page.locator('button.day-cell[data-ds="2026-03-04"] .day-note-dot').count()) === 1, await page.textContent('#headerTitle'));
    await page.reload(); check('calendars: the one you had open is the one that opens next time', (await page.textContent('#headerTitle')).includes('Avery') && (await page.locator('#calendarSwitch').isVisible()));
    check('calendars: Undo history is not shared between calendars', await page.isDisabled('#btnUndo'));
    await page.selectOption('#calendarSwitch', await page.$$eval('#calendarSwitch option', o => o[1].value)); await page.waitForTimeout(200); await page.selectOption('#yearSelect', String(Y));
    check('calendars: the second calendar kept its own schedule and day', (await page.textContent('#headerTitle')).includes('Riley') && /7\/14/.test((await L.stats(page)).base) && (await owner(page, '2026-03-04')) === 'Together');
    // backup includes both and brings both back
    const [d] = await Promise.all([page.waitForEvent('download'), L.act(page, '#btnBackup')]); const f = L.OUT + '/v6_backup.json'; await d.saveAs(f); const bk = JSON.parse(L.fs.readFileSync(f, 'utf8'));
    check('calendars: a backup holds every calendar and its history', bk.calendars.length === 2 && bk.calendars.every(c => Array.isArray(c.history)) && bk.calendars.some(c => c.history.length > 0), bk.calendars.map(c => c.id + ':' + c.history.length).join());
    // delete the second one
    await page.evaluate(() => { window.confirm = () => true; }); await page.click('#calendarList .list-row:nth-child(2) button[aria-label^="Delete"]');
    check('calendars: deleting the open one returns to the first and removes the switcher', (await page.textContent('#headerTitle')).includes('Avery') && (await page.locator('#calendarSwitch').isHidden()) && (await page.locator('#calendarList .list-row').count()) === 1);
    check('calendars: deleted data is really gone from the device', (await page.evaluate(() => Object.keys(localStorage).filter(k => /^custody_cal_v9__p_|kb_hist_v1__p_/.test(k)).length)) === 0);
    // restore brings the second back
    await page.click('#btnMenuShare'); await page.click('#btnRestore'); await Promise.all([page.waitForLoadState('load'), page.setInputFiles('#restoreFile', f)]); await page.waitForTimeout(500);
    check('calendars: a restore brings the deleted calendar back', (await page.locator('#calendarSwitch').isVisible()) && (await page.$$eval('#calendarSwitch option', o => o.map(x => x.textContent).join())) === 'Avery,Riley', await page.$$eval('#calendarSwitch option', o => o.map(x => x.textContent).join()));
    // limit
    await page.evaluate(() => { const idx = []; for (let i = 0; i < 11; i++) { const id = 'p_test' + i; idx.push({ id, name: 'C' + i }); localStorage.setItem('custody_cal_v9__' + id, JSON.stringify({ fileId: id, childName: 'C' + i })); } const cur = JSON.parse(localStorage.kb_profiles_v1); localStorage.kb_profiles_v1 = JSON.stringify(cur.concat(idx).slice(0, 11)); });
    await page.reload(); check('calendars: at the limit the add button is switched off', await page.isDisabled('#btnAddCalendar'), String(await page.locator('#calendarList .list-row').count()));
    names0 && 0; }

  // ================= change history
  await page.evaluate(() => { localStorage.clear(); }); await ctx.close();
  ({ ctx, page } = await mk()); await page.selectOption('#yearSelect', String(Y)); await page.click('.preset-btn[data-preset="7-7"]');
  { await L.act(page, '#btnHistory'); check('history: opens as a dialog, even when empty it says so in words', (await page.locator('#historyOverlay.show').count()) === 1); const first = (await page.$$eval('#historyList li', l => l.map(x => x.textContent))); await page.keyboard.press('Escape');
    check('history: the first change (a schedule preset) is already listed', first.some(t => /Base schedule changed/.test(t)), first.join(' | '));
    await page.selectOption('#bdayChildMonth', '8'); await L.act(page, '#btnHistory'); await page.selectOption('#actorSelect', 'p2'); await page.keyboard.press('Escape');
    await L.setDay(page, '2026-03-04', 'both'); await L.act(page, '#btnHistory'); const namesBefore = (await page.$$eval('#historyList li', l => l.map(x => x.textContent))).filter(t => /Names, birthdays or colors changed/.test(t)).length; await page.keyboard.press('Escape'); await page.fill('#childNameInput', 'Avery2'); await page.fill('#childNameInput', 'Avery3'); await page.click('.week-chip >> nth=0'); await page.click('#viewMonthBtn'); await page.click('#viewYearBtn');
    await L.act(page, '#btnHistory'); const list = await page.$$eval('#historyList li', l => l.map(x => x.textContent)); await page.keyboard.press('Escape');
    check('history: a day is described in words ("Wed, Mar 4: together")', list.some(t => /Wed, Mar 4: together/.test(t)), list.join(' | '));
    check('history: entries say who made them once that is set', list.some(t => /Taylor/.test(t) && /together/.test(t)), list.slice(0, 2).join(' | '));
    check('history: typing a name is one entry, not one per letter', list.filter(t => /Names, birthdays or colors changed/.test(t)).length - namesBefore === 1, `${namesBefore} -> ${list.filter(t => /Names, birthdays or colors changed/.test(t)).length}`);
    check('history: summer weeks are described', list.some(t => /Summer week Jun 1–7: given to Jordan/.test(t)), list.join(' | '));
    check('history: looking around (year, month, view) is not a change', !list.some(t => /year|view|month/i.test(t.replace(/Summer|Names|Holiday/g, ''))), list.join(' | '));
    check('history: newest first', /Names|Summer/.test(list[0]) , list[0]);
    // a note and a plan
    await page.click('button.day-cell[data-ds="2026-03-05"]'); await page.fill('#dayNote', 'Pack swim bag'); await page.fill('#planTitle', 'Swim'); await page.click('#btnAddPlan'); await page.waitForTimeout(800); await page.keyboard.press('Escape');
    await L.act(page, '#btnHistory'); const list2 = await page.$$eval('#historyList li', l => l.map(x => x.textContent)); await page.keyboard.press('Escape'); check('history: notes and plans are described', list2.some(t => /Note added on Thu, Mar 5/.test(t)) && list2.some(t => /Plan added on Thu, Mar 5: Swim/.test(t)), list2.join(' | '));
    const stored = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith('kb_hist')).length); check('history: it lives on the device under its own key', stored === 1);
    const link = await getLink(page); const r = await mk({}, null); await r.page.goto(link); await r.page.waitForSelector('#sharedBanner.show'); check('history: it is not in share links', !JSON.stringify(await r.page.evaluate(() => ({ ...localStorage }))).includes('Pack swim bag') && true); await r.ctx.close();
    await L.act(page, '#btnHistory'); await page.evaluate(() => { window.confirm = () => true; }); await page.click('#btnHistoryClear'); check('history: it can be cleared', (await page.$$eval('#historyList li', l => l.length)) === 1 && /Nothing yet/.test(await page.textContent('#historyList')));
    await page.keyboard.press('Escape'); }

  // ================= compare a link with your calendar (swap requests without a server)
  await page.click('.preset-btn[data-preset="7-7"]');
  { // Taylor (B) already has the calendar saved on this device; Jordan (A) sends a change request
    const A = await mk(); await A.page.selectOption('#yearSelect', String(Y)); await A.page.click('.preset-btn[data-preset="7-7"]'); const aliceDay = '2026-06-12';
    const B = await mk(); await B.page.selectOption('#yearSelect', String(Y)); await B.page.click('.preset-btn[data-preset="7-7"]');
    // identical to start with: nothing to apply
    const sameLink = await getLink(A.page); await B.page.goto(sameLink); await B.page.waitForSelector('#sharedBanner.show'); await B.page.click('#btnCompareShared');
    check('compare: identical calendars say so and offer nothing to apply', /nothing to apply/.test(await B.page.textContent('#reviewIntro')) && (await B.page.locator('#btnReviewApply').isHidden()), await B.page.textContent('#reviewIntro')); await B.page.keyboard.press('Escape');
    // A makes a swap, a note, a plan, a tile change, a summer week and a setting, and writes a message
    await A.page.waitForTimeout(900); await L.flipDay(A.page, aliceDay); await L.setDay(A.page, '2026-06-13', 'both');
    await A.page.click('button.day-cell[data-ds="2026-06-14"]'); await A.page.fill('#dayNote', 'Beach trip'); await A.page.fill('#planTime', '09:00'); await A.page.fill('#planTitle', 'Pack the car'); await A.page.click('#btnAddPlan'); await A.page.waitForTimeout(800); await A.page.keyboard.press('Escape');
    await A.page.evaluate(() => [...document.querySelectorAll('.week-chip')].find(c => c.textContent === 'Jul 8–14').click()); await A.page.fill('#exchangeLocationInput', 'Library car park'); await A.page.fill('#childNameInput', 'Avery (renamed)');
    await A.page.evaluate(() => [...document.querySelectorAll('.hol-tile')].find(t => t.textContent.includes('Halloween')).click());
    const link = await getLink(A.page, 'Could we swap the 12th? I will take the beach weekend.');
    await B.page.goto(link); await B.page.waitForSelector('#sharedBanner.show');
    check('compare: the sender\'s message is shown to whoever opens the link', /Could we swap the 12th\?/.test(await B.page.textContent('#sharedMessage')) && (await B.page.locator('#sharedMessage').isVisible()), await B.page.textContent('#sharedMessage'));
    check('compare: a licensed recipient is offered "Compare with my calendar"', await B.page.locator('#btnCompareShared').isVisible());
    await B.page.click('#btnCompareShared'); await B.page.waitForSelector('#reviewOverlay.show');
    const items = await B.page.$$eval('#reviewList label', l => l.map(x => ({ t: x.textContent, c: x.querySelector('input').checked })));
    const heads = await B.page.$$eval('#reviewList h3', h => h.map(x => x.textContent));
    check('compare: the differences are listed in groups, in words', heads.join() === 'Days,Notes,Plans,Holidays,Summer,Settings' && items.some(i => /Fri, Jun 12, 2026/.test(i.t)) && items.some(i => /Beach trip/.test(i.t)) && items.some(i => /9:00 AM Pack the car/.test(i.t)) && items.some(i => /Halloween 2026/.test(i.t)) && items.some(i => /Jul 8–14: given to/.test(i.t)), heads.join() + ' :: ' + items.map(i => i.t).join(' | '));
    check('compare: changes are ticked, names and colors are not', items.filter(i => !/Names/.test(i.t)).every(i => i.c) && items.filter(i => /Names/.test(i.t)).every(i => !i.c), items.map(i => (i.c ? '✓' : '·') + i.t.slice(0, 20)).join(' | '));
    check('compare: the message is repeated in the dialog', /Could we swap the 12th\?/.test(await B.page.textContent('#reviewMessage')));
    // untick the plan and the exchange place, apply the rest
    await B.page.evaluate(() => [...document.querySelectorAll('#reviewList label')].filter(l => /Pack the car|Exchange/.test(l.textContent)).forEach(l => l.querySelector('input').click()));
    const nTicked = await B.page.locator('#reviewList input:checked').count(); await Promise.all([B.page.waitForLoadState('load'), B.page.click('#btnReviewApply')]); await B.page.waitForSelector('#toastAction:not([hidden])', { timeout: 8000 }); await B.page.selectOption('#yearSelect', String(Y));
    const aOwner = await owner(A.page, aliceDay); check('compare: after applying, the day is exactly what the sender chose', (await owner(B.page, aliceDay)) === aOwner && (await owner(B.page, '2026-06-13')) === 'Together', `${await owner(B.page, aliceDay)} vs ${aOwner}`);
    check('compare: the note came across, the plan the recipient unticked did not', (await B.page.getAttribute('button.day-cell[data-ds="2026-06-14"]', 'title')).includes('Beach trip') && !(await B.page.getAttribute('button.day-cell[data-ds="2026-06-14"]', 'title')).includes('Pack the car'));
    check('compare: the setting they unticked stayed as it was, and their own names are untouched', (await B.page.inputValue('#exchangeLocationInput')) === '' && (await B.page.textContent('#headerTitle')).includes('Avery') && !(await B.page.textContent('#headerTitle')).includes('renamed'));
    check('compare: the page left the shared view and is their own saved calendar again', (await B.page.locator('#sharedBanner.show').count()) === 0 && !(await B.page.evaluate(() => location.hash)));
    check('compare: they are told how many changes were applied, and offered a button to send it back', new RegExp(`Applied ${nTicked} changes`).test(await B.page.textContent('#toastText')) && nTicked >= 5 && (await B.page.textContent('#toastAction')) === 'Send…', await B.page.textContent('#toastText'));
    await B.page.click('#toastAction'); check('compare: that button opens the share dialog with a reply started', /Agreed/.test(await B.page.inputValue('#shareMessage'))); await B.page.keyboard.press('Escape');
    await B.page.click('#btnUndo').catch(() => {}); 
    await L.act(B.page, '#btnHistory'); const hist = await B.page.$$eval('#historyList li', l => l.map(x => x.textContent)); check('compare: it is in their change history, with the message', hist.some(t => new RegExp(`Applied ${nTicked} changes from a shared link: “Could we swap the 12th\\?`).test(t)), hist.slice(0, 2).join(' | ')); await B.page.keyboard.press('Escape');
    // no saved calendar: say so
    const C = await mk({}, null); await C.page.goto(link); await C.page.waitForSelector('#sharedBanner.show'); check('compare: with nothing saved on the device, the button is not offered to someone without a licence', await C.page.locator('#btnCompareShared').isHidden());
    await C.ctx.close(); await A.ctx.close(); await B.ctx.close(); }

  // ================= hostile or damaged data in notes and plans
  { const evil = '<img src=x onerror="window.__x=1">'; const cases = { notes: { zj: { '2026-03-04': evil, [evil]: 'x', '2026-03-05': 12 } }, plans: { zk: [['a1', '2026-03-04', '09:00', evil], ['"><img src=x onerror=window.__x=1>', '2026-03-05', evil, evil], null, 5, ['x'], [evil, evil, evil, evil]] }, notesNotObject: { zj: evil }, plansNotArray: { zk: evil }, bigNote: { zj: { '2026-03-04': 'x'.repeat(5000) } }, manyPlans: { zk: Array.from({ length: 1000 }, (_, i) => ['p' + i, '2026-03-04', '', 'Plan']) }, shareNote: { sn: evil }, shareNoteType: { sn: { a: 1 } } };
    for (const [name, o] of Object.entries(cases)) { const r = await mk({}, null); const lg = []; r.page.on('pageerror', e => lg.push(e.message)); await r.page.goto(L.mkLink(url, Object.assign({ y: 2026 }, o))); await r.page.waitForTimeout(350); let bad = ''; if (lg.length) bad = 'error ' + lg[0]; else if ((await r.page.locator('button.day-cell').count()) < 365) bad = 'did not open'; else { await r.page.click('button.day-cell[data-ds="2026-03-04"]'); await r.page.waitForTimeout(150); if (await r.page.evaluate(() => !!window.__x || !!document.querySelector('.container img, header img, #daySheet img, #sharedBanner img'))) bad = 'markup ran'; } cases[name] = bad || 'ok'; await r.ctx.close(); }
    const bad = Object.entries(cases).filter(([, v]) => v !== 'ok'); check(`hostile/damaged notes, plans and messages (${Object.keys(cases).length} cases) open safely, nothing runs`, bad.length === 0, bad.map(([k, v]) => k + ' ' + v).join(' ; '));
    const r = await mk({}, null); await r.page.goto(L.mkLink(url, { y: 2026, zj: { '2026-03-04': 'Visible note' }, zk: [['a', '2026-03-04', '15:00', 'Visible plan']] })); await r.page.waitForSelector('#sharedBanner.show'); await r.page.click('button.day-cell[data-ds="2026-03-04"]');
    check('recipient: notes and plans from a link are readable in the sheet, and nothing can be edited', /Visible note/.test(await r.page.inputValue('#dayNote')) && /3:00 PMVisible plan/.test(await r.page.textContent('#dayPlans')) && (await r.page.locator('#dayNote').getAttribute('readonly')) !== null && (await r.page.locator('#planAdd').isHidden())); await r.ctx.close(); }

  const errs = logs.filter(x => /pageerror|console\.error/.test(x) && !/Failed to load resource|net::ERR|404/.test(x));
  check('no script errors anywhere in this run', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = L.summary('DATA CHECKS'); await browser.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
