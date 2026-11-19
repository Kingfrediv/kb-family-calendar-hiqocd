// Verifies each reported bug is fixed.  KB_INDEX = build under test, KB_OLD = original build.
const L = require('./lib'); const { check } = L;
const OLD = process.env.KB_OLD || L.path.join(L.ROOT, 'compat', 'v0-original.html');
const axeSrc = L.fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => {
  let baked = null;
  const { srv, url } = await L.startServer({ '/baked.html': () => baked, '/old.html': () => L.fs.readFileSync(OLD, 'utf8') });
  const browser = await L.chromium.launch();
  const allLogs = [];
  const mk = async (opts = {}, mode = 'ok') => { const ctx = await L.newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], ...opts }); await L.stubGumroad(ctx, mode); const page = await ctx.newPage(); L.watch(page, allLogs); return { ctx, page }; };
  const owner = async (page, ds) => { const d = (await L.days(page))[ds]; return d ? L.ownerOf(d) : null; };
  const dl = async (page, sel) => { const [d] = await Promise.all([page.waitForEvent('download'), L.act(page, sel)]); const p = L.OUT + '/v_' + d.suggestedFilename(); await d.saveAs(p); return p; };
  const tile = (page, n) => page.evaluate(n => { const t = [...document.querySelectorAll('.hol-tile')].find(e => e.querySelector('.hol-tile-name').textContent.includes(n)); return t ? t.querySelector('.hol-tile-owner').textContent : null; }, n);
  const clickTile = (page, n) => page.evaluate(n => { [...document.querySelectorAll('.hol-tile')].find(e => e.querySelector('.hol-tile-name').textContent.includes(n)).click(); }, n);
  const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

  // ================= owner session
  let { ctx, page } = await mk({ timezoneId: 'America/New_York' });
  await page.addInitScript(() => { try { const o = navigator.storage.persist.bind(navigator.storage); navigator.storage.persist = () => { window.__persist = (window.__persist || 0) + 1; return o(); }; } catch (e) {} });
  await page.goto(url);
  await L.unlock(page, { names: ['Avery', 'Jordan', 'Taylor'] });
  check('14 storage: asks the browser to keep saved data after unlock', await page.evaluate(() => window.__persist >= 1));

  // ---- 6 summer default
  await page.click('.preset-btn[data-preset="7-7"]');
  let s = await L.stats(page);
  const pct = parseFloat(s.p1pct);
  check('6 new calendar + alternating weeks is close to 50/50', pct > 47 && pct < 53, s.p1pct + ' / ' + s.p2pct);
  check('6 summary says unselected summer days follow the base', /rest follows base/.test(await page.textContent('#rulesSummaryBox')));
  await page.evaluate(() => [...document.querySelectorAll('.week-chip')].find(c => c.textContent === 'Jul 8–14').click());
  check('6 picking a summer week gives it to Parent 1', (await owner(page, '2026-07-08')) === 'Jordan' && (await owner(page, '2026-07-14')) === 'Jordan');
  await page.evaluate(() => [...document.querySelectorAll('.week-chip')].find(c => c.textContent === 'Jul 8–14').click());

  // ---- 4 presets
  for (const p of ['7-7', '2-2-5-5', '2-2-3', '3-4-4-3', '5-2-2-5']) { await page.click(`.preset-btn[data-preset="${p}"]`); check(`4 preset ${p} is 7 nights each`, /7\/14 \(50\.0%\).*7\/14 \(50\.0%\)/.test((await L.stats(page)).base), (await L.stats(page)).base); }
  check('4 preset 5-2-2-5 pattern is 5 nights, 2, 2, 5', (await page.$$eval('.dp-tile', t => t.map(x => x.getAttribute('aria-pressed') === 'true' ? 1 : 0).join(''))) === '11111001100000', await page.$$eval('.dp-tile', t => t.map(x => x.getAttribute('aria-pressed') === 'true' ? 1 : 0).join('')));
  await page.click('.preset-btn[data-preset="eow"]');
  check('22 preset button uses the real name', (await page.textContent('.preset-btn[data-preset="eow"]')).includes('Taylor'), await page.textContent('.preset-btn[data-preset="eow"]'));
  check('22 preset message uses the real name', (await page.textContent('#toast')).includes('Taylor'), await page.textContent('#toast'));
  check('22 footer shows the current year', (await page.textContent('#siteFooter')).includes(String(new Date().getFullYear())));

  // ---- 5 week start
  for (const p of ['7-7', '2-2-3', 'eow-mid']) {
    await page.click(`.preset-btn[data-preset="${p}"]`);
    const a = await L.owners(page); const patA = await page.$$eval('.dp-tile', t => t.map(x => x.getAttribute('aria-pressed')).join(''));
    await page.click('#weekStartMonBtn'); const b = await L.owners(page);
    check(`5 "Week Starts On" Monday keeps every night (${p})`, JSON.stringify(a) === JSON.stringify(b), Object.keys(a).filter(k => a[k] !== b[k]).length + ' nights changed');
    await page.click('#weekStartSunBtn'); const c = await L.owners(page); const patC = await page.$$eval('.dp-tile', t => t.map(x => x.getAttribute('aria-pressed')).join(''));
    check(`5 switching back restores the same picker (${p})`, JSON.stringify(a) === JSON.stringify(c) && patA === patC);
  }
  await page.fill('#biweeklyAnchorInput', '2026-02-11'); await page.dispatchEvent('#biweeklyAnchorInput', 'change');
  { const a = await L.owners(page); await page.click('#weekStartMonBtn'); const b = await L.owners(page); check('5 same with a custom "Week 1" date', JSON.stringify(a) === JSON.stringify(b)); await page.click('.preset-btn[data-preset="2-2-5-5"]'); check('5 presets still apply correctly with Monday start', /7\/14/.test((await L.stats(page)).base)); await page.click('#weekStartSunBtn'); }
  await page.fill('#biweeklyAnchorInput', '2026-01-04'); await page.dispatchEvent('#biweeklyAnchorInput', 'change');
  await page.click('.preset-btn[data-preset="7-7"]');

  // ---- 7 holiday tiles
  for (const n of ['Juneteenth', 'Indigenous Day', "Parents' Day", "Mother's Day", "Father's Day"]) {
    const seq = [await tile(page, n)]; for (let i = 0; i < 4; i++) { await clickTile(page, n); seq.push(await tile(page, n)); }
    check(`7 tile "${n}" cycles on and back off`, seq.join('>') === 'Skipped>Jordan>Taylor>Together>Skipped', seq.join(' > '));
  }
  await clickTile(page, 'Juneteenth');
  check('7 enabled Juneteenth shows on the calendar', ((await L.days(page))['2026-06-19'].title).includes('Juneteenth'), (await L.days(page))['2026-06-19'].title);
  check('7 reset counter counts it', (await page.textContent('#btnResetHolidays')).includes('(1)'), await page.textContent('#btnResetHolidays'));
  await page.click('#btnResetHolidays');
  check('7 reset returns it to skipped', (await tile(page, 'Juneteenth')) === 'Skipped');
  { const n = 'Halloween'; const seq = [await tile(page, n)]; for (let i = 0; i < 4; i++) { await clickTile(page, n); seq.push(await tile(page, n)); } check('7 normal tiles still cycle', seq.join('>') === 'Taylor>Together>Skipped>Jordan>Taylor', seq.join(' > ')); await page.click('#btnResetHolidays'); }

  // ---- 8 summer keeps Jul 4
  await page.fill('#customHolName', 'Family Reunion'); await page.selectOption('#customHolMonth', '5'); await page.selectOption('#customHolDay', '10'); await page.selectOption('#customHolRule', 'p2'); await page.click('#btnAddCustomHol');
  await clickTile(page, 'Juneteenth');   // -> Jordan
  await page.click('#holOverSummerOff');
  check('8 "Summer Keeps Jul 4": custom June holiday still applies', (await L.days(page))['2026-06-10'].title.includes('Family Reunion'), (await L.days(page))['2026-06-10'].title);
  check('8 "Summer Keeps Jul 4": Juneteenth still applies', (await L.days(page))['2026-06-19'].title.includes('Juneteenth'));
  check('8 Jul 4 outside a chosen week follows the holiday rule', (await L.days(page))['2026-07-04'].title.includes('Independence Day'), (await L.days(page))['2026-07-04'].title);
  await page.evaluate(() => [...document.querySelectorAll('.week-chip')].find(c => c.textContent === 'Jul 1–7').click());
  check('8 Jul 4 inside a chosen week stays with the summer parent', (await L.days(page))['2026-07-04'].title.includes('Jordan Summer Week'), (await L.days(page))['2026-07-04'].title);
  await page.click('#holOverSummerOn');
  check('8 "Holiday Wins": Jul 4 goes back to the holiday rule', (await L.days(page))['2026-07-04'].title.includes('Independence Day'));
  await page.evaluate(() => [...document.querySelectorAll('.week-chip')].find(c => c.textContent === 'Jul 1–7').click());
  check('21 holiday table note has a space before it', !/\)\(/.test(await page.textContent('#holidayTableBody')));

  // ---- 19 impossible dates
  await page.fill('#customHolName', 'Bad Date'); await page.selectOption('#customHolMonth', '1'); await page.selectOption('#customHolDay', '31'); await page.click('#btnAddCustomHol');
  check('19 "Feb 31" is refused', !(await page.textContent('#customHolList')).includes('Bad Date') && /February only has 29 days/.test(await page.textContent('#toast')), await page.textContent('#toast'));
  await page.fill('#customHolName', '');
  await page.selectOption('#bdayChildMonth', '1'); await page.selectOption('#bdayChildDay', '30');
  check('19 birthday "Feb 30" becomes Feb 29', (await page.inputValue('#bdayChildDay')) === '29', await page.inputValue('#bdayChildDay'));
  await page.selectOption('#bdayChildMonth', '8'); await page.selectOption('#bdayChildDay', '12');

  // ---- 13 keyboard
  const active = () => page.evaluate(() => (document.activeElement.dataset && document.activeElement.dataset.fk) || document.activeElement.id || document.activeElement.tagName);
  await page.locator('button.day-cell[data-ds="2026-03-05"]').focus(); await page.keyboard.press('Enter');
  await page.waitForTimeout(120); check('13 Enter on a day opens its sheet and focus moves inside it', (await page.locator('#daySheet.show').count()) === 1 && (await page.evaluate(() => !!document.activeElement.closest('#daySheet'))));
  await page.keyboard.press('Escape');
  check('13 Escape closes the sheet and focus returns to that day', (await active()) === 'day:2026-03-05', await active());
  await page.keyboard.press('ArrowRight');
  check('13 arrow keys still move between days', (await active()) === 'day:2026-03-06', await active());
  await page.evaluate(() => document.querySelector('.hol-tile').focus()); await page.keyboard.press('Enter');
  check('13 focus stays on a holiday tile', (await active()).startsWith('hol:'), await active());
  await page.evaluate(() => document.querySelector('.dp-tile').focus()); await page.keyboard.press('Enter');
  check('13 focus stays on a base-day tile', (await active()).startsWith('dp:'), await active());
  await page.evaluate(() => document.querySelector('.week-chip').focus()); await page.keyboard.press('Enter');
  check('13 focus stays on a summer week', (await active()).startsWith('wk:'), await active());
  await page.evaluate(() => document.querySelector('.week-chip').click());
  await page.click('.preset-btn[data-preset="7-7"]'); await page.click('#btnResetOverrides'); await page.click('#btnResetHolidays');
  await page.focus('#btnMenuShare'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await page.waitForSelector('#shareOverlay.show');
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  check('13 Tab stays inside the open dialog', await page.evaluate(() => !!document.activeElement.closest('#shareOverlay')));
  await page.keyboard.press('Escape');
  check('13 Escape closes the share dialog', (await page.locator('#shareOverlay.show').count()) === 0);
  check('13 focus returns to the button that opened it (the menu button)', (await active()) === 'btnMenuShare', await active());
  check('20 all on/off buttons announce their state', await page.evaluate(() => [...document.querySelectorAll('.toggle-btn')].every(b => b.hasAttribute('aria-pressed')) && document.querySelectorAll('.toggle-btn[aria-pressed="true"]').length >= 8));

  // ---- 21 undo + passcode
  await page.waitForTimeout(900);
  await L.flipDay(page, '2026-03-10'); await page.waitForTimeout(900);
  await page.click('#btnNextYear'); await page.click('#viewMonthBtn'); await page.click('#viewYearBtn'); await page.waitForTimeout(900);
  await page.click('#btnUndo');
  check('21 Undo after browsing removes the last edit, not the browsing', (await page.locator('button.day-cell[data-ds="2026-03-10"].is-override').count()) === 0 && (await page.textContent('#btnResetOverrides')).includes('(0)'), 'year shown ' + await page.textContent('#headerYearBadge'));
  if ((await page.textContent('#headerYearBadge')) !== '2026') await page.selectOption('#yearSelect', '2026');
  await L.act(page, '#btnCopyLink'); await page.fill('#sharePasscode', 'abc'); await page.fill('#sharePasscode2', 'abc'); await page.click('#btnShareCopy'); await page.waitForTimeout(300);
  check('21 short passcode is refused', /at least 6/.test(await page.textContent('#sharePassError')) && (await page.locator('#shareResult.show').count()) === 0, await page.textContent('#sharePassError'));
  await page.fill('#sharePasscode', 'sunflower'); await page.fill('#sharePasscode2', 'sunflower'); await page.click('#btnShareCopy'); await page.waitForSelector('#shareResult.show');
  const locked = await page.evaluate(() => navigator.clipboard.readText());
  check('21 6+ character passcode makes a locked link', locked.includes('#p='));
  await page.click('#btnShareCancel');

  // ---- 15 / 16 cosmetics
  check('15 notes placeholder reads correctly', (await page.evaluate(() => getComputedStyle(document.getElementById('notesReadonly'), '::before').content)).includes('Click “Edit Notes” to add your own.'), await page.evaluate(() => getComputedStyle(document.getElementById('notesReadonly'), '::before').content));
  check('16 print-only footer hidden on screen', await page.locator('.print-disclaimer').isHidden());
  await page.emulateMedia({ media: 'print' });
  check('16 print-only footer still prints', await page.evaluate(() => getComputedStyle(document.querySelector('.print-disclaimer')).display) === 'block');
  await page.emulateMedia({ media: 'screen' });

  // ---- 17 calendar export
  let ics = (await L.icsDownload(page)).text; let flat = ics.replace(/\r\n /g, '');
  check('17 no "Time: ." when exchange times are blank', !/Time: \./.test(flat) && /Exchange time not set/.test(flat));
  check('17 blank times export as all-day exchange markers', !/DTSTART;TZID/.test(flat) && (flat.match(/SUMMARY:Exchange to/g) || []).length > 20, (flat.match(/SUMMARY:Exchange to/g) || []).length + ' exchanges');
  await page.fill('#timeToP1Input', 'After school'); await page.fill('#timeToP2Input', '6:00 PM'); await page.fill('#timeHolidayInput', '9:30 AM');
  ics = (await L.icsDownload(page)).text; flat = ics.replace(/\r\n /g, '');
  check('17 entered times export as timed events', /DTSTART;TZID=America\/New_York:\d{8}T180000/.test(flat) && /T150000/.test(flat) && /T093000/.test(flat));
  check('17 calendar file is well formed', !ics.replace(/\r\n/g, '').includes('\n') && Math.max(...ics.split('\r\n').map(l => Buffer.byteLength(l))) <= 75 && (ics.match(/BEGIN:VEVENT/g) || []).length === (ics.match(/END:VEVENT/g) || []).length);

  // ---- 12 spreadsheet
  await page.fill('#p2NameInput', '=Taylor');
  let csv = L.fs.readFileSync(await dl(page, '#btnExportCsv'));
  check('12 spreadsheet starts with the UTF-8 marker Excel needs', csv[0] === 0xEF && csv[1] === 0xBB && csv[2] === 0xBF);
  check('12 spreadsheet has header + one row per day', csv.toString('utf8').trim().split('\r\n').length === 366);
  check('12 a name starting with "=" cannot become a formula', csv.toString('utf8').includes(",'=Taylor,") && !/,=Taylor/.test(csv.toString('utf8')));
  await page.fill('#p2NameInput', 'Taylor');

  // ---- 9 long notes
  let prose = L.fs.readFileSync(L.path.join(__dirname, 'prose.txt'), 'utf8');
  await page.click('#btnToggleNotesEdit'); await page.fill('#notesTextarea', prose.slice(2000, 11000)); await page.click('#btnToggleNotesEdit');
  await page.evaluate(() => navigator.clipboard.writeText('SENTINEL'));
  await L.act(page, '#btnCopyLink'); await page.click('#btnShareCopy'); await page.waitForSelector('#shareResult.show');
  const longLink = await page.evaluate(() => navigator.clipboard.readText());
  check('9 9,000 characters of notes: link is still created and copied', longLink.startsWith('http') && longLink.includes('#c='), longLink.length + ' chars');
  check('9 QR is replaced by a plain explanation', (await page.locator('#shareQrBlock').isHidden()) && (await page.locator('#shareQrTooLong').isVisible()) && (await page.locator('#btnDownloadQr').isHidden()));
  await page.click('#btnShareCancel');
  { const r = await mk(); await r.page.goto(longLink); await r.page.waitForSelector('#sharedBanner.show'); check('9 that long link opens with the full notes', (await r.page.textContent('#notesReadonly')) === prose.slice(2000, 11000)); await r.ctx.close(); }
  await page.click('#btnToggleNotesEdit'); await page.fill('#notesTextarea', 'Short note'); await page.click('#btnToggleNotesEdit');
  await L.act(page, '#btnCopyLink'); await page.click('#btnShareCopy'); await page.waitForSelector('#shareResult.show');
  check('9 a normal schedule still shows the QR', (await page.locator('#shareQrBlock').isVisible()) && (await page.locator('#shareQrTooLong').isHidden()) && (await page.locator('#btnDownloadQr').isVisible()));
  const link = await page.evaluate(() => navigator.clipboard.readText());
  await page.click('#btnShareCancel');

  // ---- 1 / 18 Download Copy
  await page.click('.preset-btn[data-preset="2-2-3"]');      // leaves a pop-up message on screen
  const keysBefore = await page.evaluate(() => Object.keys(localStorage).sort().join());
  baked = L.fs.readFileSync(await dl(page, '#btnSaveBakedHtml'), 'utf8');
  check('18 no pop-up message baked into the copy', !/class="toast show"/.test(baked) && !/class="toast[^"]*">[^<]+</.test(baked));
  check('1 Download Copy creates no extra storage slot', (await page.evaluate(() => Object.keys(localStorage).sort().join())) === keysBefore, await page.evaluate(() => Object.keys(localStorage).sort().join()));
  await page.waitForTimeout(900);
  await page.fill('#childNameInput', 'Riley'); await page.click('.preset-btn[data-preset="3-4-4-3"]'); await L.flipDay(page, '2026-03-04'); await page.waitForTimeout(300);
  const b4 = { t: await page.textContent('#headerTitle'), o: await L.owners(page), n: await page.textContent('#btnResetOverrides') };
  await page.reload(); await page.waitForTimeout(300);
  const af = { t: await page.textContent('#headerTitle'), o: await L.owners(page), n: await page.textContent('#btnResetOverrides') };
  check('1 edits made after Download Copy survive a reload', JSON.stringify(b4) === JSON.stringify(af), b4.t + ' -> ' + af.t + ', ' + af.n);
  const ownerMap = af.o;
  await page.fill('#childNameInput', 'Avery');

  // ---- 2 the copy, opened by someone without a licence
  {
    const r = await mk(); await r.page.goto(url + 'baked.html'); await r.page.waitForTimeout(400);
    check('2 recipient of the copy sees the calendar, not a licence wall', (await r.page.locator('.container').isVisible()) && (await r.page.locator('#licenseOverlay.show').count()) === 0 && (await r.page.locator('button.day-cell').count()) === 365, await r.page.evaluate(() => document.body.className));
    check('2 copy shows the same schedule that was downloaded', (await owner(r.page, '2026-01-06')) !== null && (await r.page.textContent('#headerTitle')).includes('Avery'));
    check('2 copy is labelled as a shared, view-only copy', /shared copy/.test(await r.page.textContent('#sharedBannerTitle')) && (await r.page.locator('#viewOnlyActions').isVisible()) && (await r.page.locator('.licensed-share-actions').isHidden()));
    check('10 recipient is not shown the settings panel', await r.page.locator('.sidebar').isHidden());
    const ovBefore = JSON.stringify(await L.owners(r.page));
    await r.page.click('button.day-cell[data-ds="2026-03-05"]');
    check('2 view-only: tapping a day opens a read-only sheet (no licence wall)', (await r.page.locator('#daySheet.show').count()) === 1 && (await r.page.locator('#licenseOverlay.show').count()) === 0 && (await r.page.locator('#dayEdit').isHidden()) && (await r.page.locator('#planAdd').isHidden()) && (await r.page.locator('#btnDaySelectMore').isHidden()), await r.page.textContent('#daySheetWhy'));
    check('2 view-only: the sheet says who has the night and why', /overnight/.test(await r.page.textContent('#daySheetWhy')) && /Thursday, March 5/.test(await r.page.textContent('#daySheetTitle')), await r.page.textContent('#daySheetTitle'));
    await r.page.keyboard.press('Escape');
    check('2 view-only: nothing changed', JSON.stringify(await L.owners(r.page)) === ovBefore && (await r.page.locator('#daySheet.show').count()) === 0);
    await r.page.click('#btnEnterLicense');
    check('X the licence box can be opened from the banner and dismissed ("Not now")', (await r.page.locator('#licenseOverlay.show').count()) === 1 && (await r.page.locator('#btnLicenseClose').isVisible()));
    await r.page.click('#btnLicenseClose');
    check('X ...and the calendar is usable again', (await r.page.locator('#licenseOverlay.show').count()) === 0 && (await r.page.locator('.container').isVisible()));
    await r.page.click('#btnEnterLicense'); await r.page.keyboard.press('Escape');
    check('X Escape also dismisses it', (await r.page.locator('#licenseOverlay.show').count()) === 0);
    check('2 exports stay switched off for view-only', await r.page.evaluate(() => ['btnSaveBakedHtml', 'btnCopyLink', 'btnExportIcs', 'btnPrint', 'btnExportCsv'].every(id => document.getElementById(id).disabled)));
    await r.ctx.close();
    const ph = await mk(phone); await ph.page.goto(url + 'baked.html'); await ph.page.waitForTimeout(400);
    const top = await ph.page.evaluate(() => Math.round(document.querySelector('#calendarContainer').getBoundingClientRect().top + scrollY));
    check('10 phone recipient of the copy: no settings, single month', (await ph.page.locator('.sidebar').isHidden()) && (await ph.page.locator('.single-month').count()) === 1, 'calendar starts at y=' + top);
    await ph.ctx.close();
  }
  // the owner (licensed) opens the copy: full control, reset persists
  {
    const p3 = await ctx.newPage(); L.watch(p3, allLogs); await p3.goto(url + 'baked.html'); await p3.waitForTimeout(300);
    check('2 owner opening their own copy gets the full editor', (await p3.locator('#sharedBanner.show').count()) === 0 && (await p3.evaluate(() => document.body.className.trim())) === '' && (await p3.locator('.toast.show').count()) === 0);
    await L.flipDay(p3, '2026-04-01'); await p3.waitForTimeout(200); await p3.reload(); await p3.waitForTimeout(300);
    check('1 edits inside a copy survive reload', (await p3.locator('button.day-cell[data-ds="2026-04-01"].is-override').count()) === 1);
    await p3.click('#btnResetAll'); await p3.waitForTimeout(300); await p3.fill('#childNameInput', 'NewKid'); await p3.click('.preset-btn[data-preset="7-7"]'); await p3.waitForTimeout(300); await p3.reload(); await p3.waitForTimeout(300);
    check('1 Reset All + new edits inside a copy survive reload', (await p3.textContent('#headerTitle')).includes('NewKid'), await p3.textContent('#headerTitle'));
    await p3.close();
    await page.reload(); await page.waitForTimeout(300);
    check('1 ...and did not touch the main calendar', (await page.textContent('#headerTitle')).includes('Riley') || (await page.textContent('#headerTitle')).includes('Avery'), await page.textContent('#headerTitle'));
  }

  // ---- 10 / X share link recipients
  {
    const r = await mk(); await r.page.goto(link); await r.page.waitForSelector('#sharedBanner.show');
    check('10 desktop recipient: calendar first, settings hidden', (await r.page.locator('.sidebar').isHidden()) && (await r.page.evaluate(() => Math.round(document.querySelector('#calendarContainer').getBoundingClientRect().top))) < 900);
    check('2 share links still say "shared link"', /shared link/.test(await r.page.textContent('#sharedBannerTitle')));
    await r.ctx.close();
    const ph = await mk(phone); await ph.page.goto(link); await ph.page.waitForSelector('#sharedBanner.show');
    const top = await ph.page.evaluate(() => Math.round(document.querySelector('#calendarContainer').getBoundingClientRect().top + scrollY));
    const now = await ph.page.evaluate(() => new Date().getFullYear() + '-' + new Date().getMonth());
    const shown = await ph.page.evaluate(() => document.querySelector('.month-title span').textContent);
    check('10 phone recipient: settings hidden, one month, calendar near the top', (await ph.page.locator('.sidebar').isHidden()) && (await ph.page.locator('.month-card').count()) === 1 && top < 2200, `calendar y=${top} (was ~6073), page height ${await ph.page.evaluate(() => document.documentElement.scrollHeight)} (was 11572)`);
    check('10 phone recipient lands on the current month', now.startsWith('2026') ? shown === ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(now.split('-')[1])] + ' 2026' : true, shown);
    await ph.page.click('.month-nav[data-dir="1"]'); const s1 = await ph.page.evaluate(() => document.querySelector('.month-title span').textContent);
    await ph.page.click('.month-nav[data-dir="-1"]'); await ph.page.click('.month-nav[data-dir="-1"]'); const s2 = await ph.page.evaluate(() => document.querySelector('.month-title span').textContent);
    check('10 month arrows work for a view-only recipient', s1 !== shown && s2 !== shown && s1 !== s2, `${shown} -> ${s1} -> ${s2}`);
    for (let i = 0; i < 14; i++) await ph.page.click('.month-nav[data-dir="1"]');
    check('10 month arrows roll over into the next year', (await ph.page.evaluate(() => document.querySelector('.month-title span').textContent)).includes('2027') || (await ph.page.evaluate(() => document.querySelector('.month-title span').textContent)).includes('2028'), await ph.page.evaluate(() => document.querySelector('.month-title span').textContent));
    check('10 no sideways scrolling on a phone', !(await ph.page.evaluate(() => document.documentElement.scrollWidth > innerWidth)));
    await ph.page.screenshot({ path: L.OUT + '/v_phone_recipient.png' });
    await ph.ctx.close();
  }
  // locked link
  { const r = await mk(); await r.page.goto(locked); await r.page.waitForSelector('#passcodeOverlay.show'); await r.page.fill('#unlockPasscode', 'nope-nope'); await r.page.click('#btnUnlockShare'); await r.page.waitForTimeout(1200); const wrong = await r.page.textContent('#passcodeError'); await r.page.fill('#unlockPasscode', 'sunflower'); await r.page.click('#btnUnlockShare'); await r.page.waitForSelector('#sharedBanner.show', { timeout: 8000 }); check('A locked link: wrong passcode refused, right one opens it', /incorrect/.test(wrong) && (await r.page.locator('button.day-cell').count()) === 365); await r.ctx.close(); }

  // ---- 11 link pasted into a tab that is already open
  { const r = await mk(); await r.page.goto(url); await L.unlock(r.page, {}); await r.page.evaluate(h => { location.hash = h; }, link.split('#')[1]); await r.page.waitForSelector('#sharedBanner.show', { timeout: 5000 }).catch(() => {}); check('11 share link opened in an already-open tab loads the shared schedule', (await r.page.locator('#sharedBanner.show').count()) === 1 && (await r.page.textContent('#headerTitle')).includes('Avery'), await r.page.textContent('#headerTitle')); await r.ctx.close(); }

  // ---- 3 markup inside a share link
  const pay = tag => `<img src=x onerror="window.__x=(window.__x||'')+'${tag} '">`;
  const probes = { summerEmoji: { ue: pay('a'), ss: '111111111111' }, schoolEmoji: { ke: pay('b') }, holidayEmoji: { ch: [{ i: 1, n: 'X', e: pay('c'), m: 2, d: 3, r: 'p1' }] }, weekOneDate: { bm: 'biweekly', su: false, ba: '2026-01-04' + pay('d') }, springBreak: { by: { 2026: '2026-03-16' + pay('e') } }, schoolEventDate: { ev: [{ i: 's1', s: '2026-02-02', e: '2026-02-03">' + pay('f'), t: 'x', k: 'noschool' }] }, schoolEventId: { ev: [{ i: '"><img src=x onerror=window.__x=1>', s: '2026-02-02', e: '2026-02-03', t: pay('g'), k: pay('h') }] }, names: { a: pay('i'), b: pay('j'), cn: pay('k') }, notes: { nt: pay('l'), so: pay('m') }, holidayName: { ch: [{ i: pay('n'), n: pay('o'), e: '🎉', m: 5, d: 10, r: pay('p') }] }, colors: { c1: 'red;}</style>' + pay('q'), hc: 'x" onload="window.__x=1' }, year: { y: '2026' + pay('r') }, overrides: { ov: { ['2026-03-01' + pay('s')]: 'p1', '2026-03-02': pay('t') }, hy: { ['2026:mlk' + pay('u')]: 'p1' } }, times: { t1: pay('v'), t2: pay('w'), th: pay('x'), xl: pay('y'), dl: pay('z'), sn: pay('A'), ur: 'javascript:window.__x=1' }, all: { ue: pay('B'), ke: pay('C'), bm: 'biweekly', su: false, ba: pay('D'), by: { 2026: pay('E') }, ey: { 2026: pay('F') }, sy: { 2026: pay('G') } } };
  let fired = [];
  for (const [name, o] of Object.entries(probes)) {
    for (const vp of [{}, phone]) { const r = await mk(vp); await r.page.goto(L.mkLink(url, Object.assign({ y: 2026 }, o))); await r.page.waitForTimeout(350); if (await r.page.evaluate(() => window.__x)) fired.push(name); if ((await r.page.locator('button.day-cell').count()) < 28) fired.push(name + ':norender'); if (await r.page.evaluate(() => document.querySelector('.container img, header img, .shared-banner img') !== null)) fired.push(name + ':img'); await r.ctx.close(); }
  }
  check(`3 hostile markup in ${Object.keys(probes).length} share-link fields never runs or reaches the page`, fired.length === 0, fired.join(', ') || 'none ran');
  { const r = await mk(); await r.page.goto(L.mkLink(url, { y: 2026, ue: '🌞', ke: '🏫', a: 'Ann <3 & "Bob"', ch: [{ i: 5, n: 'Eid', e: '🌙', m: 2, d: 20, r: 'p2' }] })); await r.page.waitForSelector('#sharedBanner.show'); const d = await L.days(r.page); check('3 genuine emoji and punctuation in names still display', (await r.page.textContent('#rulesSummaryBox')).includes('Ann <3 & "Bob"') && d['2026-03-20'].icon === '🌙' && Object.values(d).some(x => x.icon === '🏫'), d['2026-03-20'].icon); await r.ctx.close(); }
  // broken links
  let bad = [];
  for (const [name, o] of Object.entries({ 'ov:null': { ov: null }, 'hy:null': { hy: null }, 'ey:null': { ey: null }, 'y:abc': { y: 'abc' }, 'ch:[null]': { ch: [null] }, 'ss:{}': { ss: {} }, 'bw:5': { bw: 5 }, 'ev:"x"': { ev: 'x' }, 'dy:[]': { dy: [] }, 'all-null': { a: null, b: null, cn: null, nt: null, ss: null, mo: null, bb: null, ch: null, ev: null, dh: null } })) {
    const lg = []; const r = await mk(); r.page.on('pageerror', e => lg.push(e.message)); await r.page.goto(L.mkLink(url, o.y ? o : Object.assign({ y: 2026 }, o))); await r.page.waitForTimeout(350);
    if (lg.length || (await r.page.locator('#sharedBanner.show').count()) !== 1 || (await r.page.locator('button.day-cell').count()) < 365) bad.push(name + ' ' + (lg[0] || 'not opened')); await r.ctx.close();
  }
  check('3 damaged share links open safely instead of failing', bad.length === 0, bad.join(' ; '));

  // ---- 20 accessibility scan in four states
  const scan = async (p) => { await p.addScriptTag({ content: axeSrc }); return p.evaluate(async () => { const r = await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }); return r.violations.map(v => `${v.id}×${v.nodes.length} (${v.nodes[0].target.join(' ').slice(0, 50)})`); }); };
  await page.click('#viewYearBtn');
  let v = await scan(page); check('20 accessibility scan, editor: no failures', v.length === 0, v.join(', '));
  { const r = await mk(); await r.page.goto(url); v = await scan(r.page); check('20 accessibility scan, licence screen: no failures', v.length === 0, v.join(', ')); await r.ctx.close(); }
  { const r = await mk(); await r.page.goto(link); await r.page.waitForSelector('#sharedBanner.show'); v = await scan(r.page); check('20 accessibility scan, view-only recipient: no failures', v.length === 0, v.join(', ')); await r.ctx.close(); }
  { await L.act(page, '#btnCopyLink'); await page.click('#btnShareCopy'); await page.waitForSelector('#shareResult.show'); v = await scan(page); check('20 accessibility scan, share dialog: no failures', v.length === 0, v.join(', ')); await page.click('#btnShareCancel'); }
  await ctx.close();

  // ---- 1 rescue of edits stranded by the old version
  if (L.fs.existsSync(OLD)) {
    const r = await mk();
    await r.page.goto(url + 'old.html'); await L.unlock(r.page, { names: ['Old', 'Pat', 'Sam'] }); await r.page.click('.preset-btn[data-preset="7-7"]'); await r.page.waitForTimeout(900);
    const [d] = await Promise.all([r.page.waitForEvent('download'), L.act(r.page, '#btnSaveBakedHtml')]); await d.path(); await r.page.waitForTimeout(900);
    await r.page.fill('#childNameInput', 'Stranded'); await r.page.click('button.day-cell[data-ds="2026-03-04"]'); await r.page.waitForTimeout(300);
    await r.page.goto(url); await r.page.waitForTimeout(400);
    check('1 edits stranded by the old version are recovered on first load', (await r.page.textContent('#headerTitle')).includes('Stranded') && (await r.page.locator('button.day-cell[data-ds="2026-03-04"].is-override').count()) === 1 && /Recovered/.test(await r.page.textContent('#toast')), await r.page.textContent('#headerTitle'));
    await r.page.fill('#childNameInput', 'Kept'); await r.page.waitForTimeout(200); await r.page.reload(); await r.page.waitForTimeout(300);
    check('1 ...and later edits are kept normally', (await r.page.textContent('#headerTitle')).includes('Kept'));
    await r.ctx.close();
  }

  const errs = allLogs.filter(x => !/Failed to load resource|net::ERR/.test(x));
  check('A no script errors anywhere in this run', errs.filter(x => x.includes('pageerror')).length === 0 && errs.filter(x => x.includes('console.error')).length === 0, errs.slice(0, 3).join(' | '));
  const failed = L.summary('FIX CHECKS');
  await browser.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
