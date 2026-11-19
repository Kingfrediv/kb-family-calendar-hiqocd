// Walks through every screen, dialog and message of the calendar in Spanish and reports text that has no translation yet.
// Used by v8_usability.js (which expects the list to be empty) and by hand (node tests/i18n-tour.js) to see what is missing.
const L = require('./lib');

const NAMES = ['Avery', 'Jordan', 'Taylor'];

async function tour() {
  const { srv, url } = await L.startServer(); const browser = await L.chromium.launch(); const logs = []; const seen = new Map(); const skipped = [];
  const mk = async (opts = {}) => { const ctx = await L.newCtx(browser, { locale: 'es-ES', permissions: ['clipboard-read', 'clipboard-write'], timezoneId: 'America/New_York', ...opts }); await L.stubGumroad(ctx, 'ok'); const page = await ctx.newPage(); L.watch(page, logs); await page.addInitScript(() => { window.__kbWantTrace = true; }); return { ctx, page }; };
  const trace = async page => page.evaluate(() => window.__kbI18n && window.__kbI18n.trace());
  const collect = async (page, label) => { let miss = []; for (let i = 0; i < 4; i++) { try { miss = await page.evaluate(() => window.__kbI18n.missing()); break; } catch (e) { await page.waitForTimeout(400); } } for (const m of miss) if (!seen.has(m)) seen.set(m, label); };
  const step = async (page, label, fn) => { try { await fn(); } catch (e) { skipped.push(label + ': ' + String(e.message).split('\n')[0]); } try { await collect(page, label); } catch (e) { skipped.push(label + ' (collect): ' + e.message); } };
  const go = async (page, target) => { await page.goto(target); await trace(page); await page.evaluate(() => window.__kbI18n.trace()); };

  // ---- 1. first visit: licence wall, then the free demo
  let { ctx, page } = await mk();
  await page.goto(url); await trace(page); await page.waitForSelector('#licenseOverlay.show');
  await step(page, 'licence wall', async () => { await page.fill('#licenseKeyInput', 'bad'); });
  // the page is already running, so trace now and look at what is left on the next draws
  await step(page, 'licence reload', async () => { await page.reload(); await trace(page); await page.waitForSelector('#licenseOverlay.show'); await page.waitForTimeout(200); });
  await page.evaluate(() => { document.documentElement.dataset.traced = '1'; });

  // ---- 2. unlock, setup wizard, every step
  await step(page, 'wizard', async () => {
    await page.fill('#licenseKeyInput', 'TEST-TEST-TEST-TEST'); await page.click('#btnUnlockLicense'); await page.waitForSelector('#setupOverlay.show'); await collect(page, 'wizard step 1');
    await page.fill('#setupChild', NAMES[0]); await page.fill('#setupP1', NAMES[1]); await page.fill('#setupP2', NAMES[2]); await page.click('#btnSetupNext'); await collect(page, 'wizard step 2');
    await page.click('#wizPresets button >> nth=1'); await page.click('#btnSetupNext'); await collect(page, 'wizard step 3');
    await page.click('#btnSetupBack'); await page.click('#btnSetupNext'); await page.click('#btnSetupStart');
  });
  await step(page, 'main page', async () => { await page.waitForTimeout(400); });

  // ---- 3. settings: every mode and card
  await step(page, 'modes', async () => {
    for (const id of ['#modeBiweeklyBtn', '#modeMonthlyBtn', '#modeCycleBtn', '#modeWeeklyBtn']) { await page.click(id); await collect(page, 'mode ' + id); }
    await page.click('#modeCycleBtn'); await page.fill('#cycleLengthInput', '10'); await page.dispatchEvent('#cycleLengthInput', 'change'); await collect(page, 'cycle');
    await page.click('#modeWeeklyBtn');
  });
  await step(page, 'presets', async () => { const n = await page.locator('.preset-btn').count(); for (let i = 0; i < n; i += 3) { await page.locator('.preset-btn').nth(i).click(); } await collect(page, 'presets'); await page.click('#btnBaseFlip'); await page.click('#btnBaseClear'); await page.click('.preset-btn[data-preset="2-2-3"]'); });
  await step(page, 'view and year', async () => { await page.click('#viewMonthBtn'); await collect(page, 'month view'); await page.click('.month-nav >> nth=0'); await page.click('#viewYearBtn'); await page.click('#btnToday'); await page.selectOption('#yearSelect', '2026'); await collect(page, 'year'); });
  await step(page, 'summer', async () => { await page.click('#summerOffBtn'); await page.click('#summerOnBtn'); await page.click('#summerRestBaseBtn'); await page.click('#summerRestP2Btn'); await page.locator('.week-chip').nth(1).click(); await page.click('#btnSummerFromSchool'); await page.selectOption('#summerFirstPickSelect', { index: 1 }); });
  await step(page, 'holidays', async () => {
    await page.locator('.hol-tile').first().click(); await page.locator('.hol-tile').first().click(); await page.selectOption('#mothersDayOwnerSelect', { index: 1 }); await page.selectOption('#fathersDayOwnerSelect', { index: 2 });
    await page.click('#rotFlippedBtn'); await page.click('#rotStandardBtn'); await page.click('#holOverSummerOff'); await page.click('#holOverSummerOn'); await page.click('#longWeekendOn'); await page.click('#splitXmasOn');
    const regions = await page.$$eval('#regionSelect option', o => o.map(x => x.value)); for (const r of regions) { await page.selectOption('#regionSelect', r); await collect(page, 'region ' + r); }
    await page.selectOption('#regionSelect', 'us'); await collect(page, 'holidays');
  });
  await step(page, 'packs', async () => { const boxes = page.locator('#packControls input[type=checkbox]'); const n = await boxes.count(); for (let i = 0; i < n; i++) { await boxes.nth(i).check(); } await collect(page, 'packs'); });
  await step(page, 'custom holiday', async () => { await page.fill('#customHolName', 'Family reunion'); await page.selectOption('#customHolMonth', '6'); await page.selectOption('#customHolDay', '4'); await page.click('#btnAddCustomHol'); await collect(page, 'custom holiday'); await page.click('#customHolList button >> nth=0'); });
  await step(page, 'school', async () => { await page.fill('#schoolNameInput', 'Maple School'); await page.fill('#addSchoolStart', '2026-11-25'); await page.fill('#addSchoolEnd', '2026-11-27'); await page.fill('#addSchoolLabel', 'Fall recess'); await page.click('#btnAddSchoolEvent'); await page.selectOption('#addSchoolKind', { index: 1 }); await collect(page, 'school'); });
  await step(page, 'colors and initials', async () => { await page.click('#initialsOn'); await collect(page, 'initials'); await page.click('#initialsOff'); });
  await step(page, 'times', async () => { await page.fill('#timeToP1Input', '3:00 PM'); await page.fill('#exchangeLocationInput', 'Library'); await page.fill('#biweeklyAnchorInput', '2026-01-04'); });
  await step(page, 'notes', async () => { await page.click('#btnToggleNotesEdit'); await collect(page, 'notes edit'); await page.click('#btnToggleNotesEdit'); });
  await step(page, 'week start', async () => { await page.click('#weekStartMonBtn'); await page.click('#weekStartSunBtn'); await page.click('#splitDaysOff'); await page.click('#splitDaysOn'); });

  // ---- 4. the day sheet, notes and plans, selecting several days, change requests
  await step(page, 'day sheet', async () => {
    await page.click('button.day-cell[data-ds="2026-03-04"]'); await collect(page, 'day sheet'); await page.click('#dayOwnerP1'); await page.click('#dayOwnerP2'); await page.click('#dayOwnerBoth'); await page.click('#dayOwnerUsual');
    await page.fill('#dayNote', 'Dentist at 3'); await page.fill('#planTime', '16:30'); await page.fill('#planTitle', 'Soccer'); await page.click('#btnAddPlan'); await page.waitForTimeout(700); await collect(page, 'day sheet with plan');
    await page.click('#btnDayRequest'); await page.waitForSelector('#shareOverlay.show'); await collect(page, 'change request dialog'); await page.keyboard.press('Escape');
  });
  await step(page, 'holiday day sheet', async () => { await page.click('button.day-cell[data-ds="2026-12-25"]'); await collect(page, 'christmas sheet'); await page.keyboard.press('Escape'); await page.click('button.day-cell[data-ds="2026-07-04"]'); await collect(page, 'july 4 sheet'); await page.keyboard.press('Escape'); await page.click('button.day-cell[data-ds="2026-06-20"]'); await collect(page, 'summer sheet'); await page.keyboard.press('Escape'); });
  await step(page, 'select several', async () => {
    await page.click('button.day-cell[data-ds="2026-03-16"]'); await page.click('#btnDaySelectMore'); await page.click('button.day-cell[data-ds="2026-03-19"]', { modifiers: ['Shift'] }); await collect(page, 'range bar');
    await page.click('#rangeP1'); await collect(page, 'range applied'); await page.click('#toastAction'); await page.click('button.day-cell[data-ds="2026-03-23"]'); await page.click('button.day-cell[data-ds="2026-03-25"]', { modifiers: ['Shift'] }); await page.click('#rangeP2'); await page.click('#btnRangeRequest'); await collect(page, 'range request'); await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  });
  await step(page, 'tonight', async () => { await page.click('#btnToday'); await collect(page, 'tonight'); });

  // ---- 5. menu and its dialogs
  await step(page, 'menu', async () => { await page.click('#btnMenuShare'); await collect(page, 'menu'); await page.keyboard.press('Escape'); });
  await step(page, 'history', async () => { await L.act(page, '#btnHistory'); await page.waitForSelector('#historyOverlay.show'); await collect(page, 'history'); await page.selectOption('#actorSelect', { index: 1 }); await page.click('#btnHistoryClose'); });
  await step(page, 'ics dialog', async () => { await L.act(page, '#btnExportIcs'); await page.waitForSelector('#icsOverlay.show'); await collect(page, 'ics'); await page.selectOption('#icsAlarm', { index: 1 }); await page.keyboard.press('Escape'); });
  await step(page, 'ics file', async () => { await L.icsDownload(page, { alarm: '1h', years: 2 }); await collect(page, 'ics file'); });
  await step(page, 'csv', async () => { await L.act(page, '#btnExportCsv'); await page.waitForTimeout(300); await collect(page, 'csv'); });
  await step(page, 'share dialog', async () => { await L.act(page, '#btnCopyLink'); await page.waitForSelector('#shareOverlay.show'); await page.fill('#sharePasscode', 'secret-pass'); await page.fill('#sharePasscode2', 'other'); await page.click('#btnShareCopy'); await collect(page, 'share mismatch'); await page.fill('#sharePasscode2', 'secret-pass'); await page.click('#btnShareCopy'); await page.waitForTimeout(600); await collect(page, 'share result'); await page.keyboard.press('Escape'); });
  await step(page, 'backup', async () => { await L.act(page, '#btnBackup'); await page.waitForTimeout(400); await collect(page, 'backup'); });
  await step(page, 'undo and resets', async () => { await page.click('#btnUndo'); await collect(page, 'undo'); await page.click('#btnResetOverrides'); await collect(page, 'reset days'); await page.click('#btnResetHolidays'); await collect(page, 'reset tiles'); });
  await step(page, 'calendars', async () => { await page.click('#btnAddCalendar'); await page.waitForSelector('#setupOverlay.show'); await page.fill('#setupChild', 'Riley'); await page.click('#btnSetupSkip'); await page.waitForTimeout(300); await collect(page, 'second calendar'); await page.selectOption('#calendarSwitch', { index: 0 }); await collect(page, 'switch'); });
  await step(page, 'dark theme', async () => { await L.act(page, '#themeDark'); await collect(page, 'theme'); await page.keyboard.press('Escape'); });
  await step(page, 'phone drawer', async () => { await page.setViewportSize({ width: 390, height: 844 }); await page.waitForSelector('#btnCloseSettings', { state: 'visible' }); await collect(page, 'phone drawer'); await page.click('#btnCloseSettings'); await page.click('#btnToggleSidebar'); await page.click('#btnCloseSettings'); await page.setViewportSize({ width: 1400, height: 900 }); });

  // ---- 6. the other side of a change request: a licensed recipient compares
  let theLink = ''; const A = await mk(); const B = await mk();
  await step(A.page, 'compare', async () => {
    for (const P of [A, B]) { await P.page.goto(url); await trace(P.page); await L.unlock(P.page, { names: NAMES }); await P.page.selectOption('#yearSelect', '2026'); await P.page.click('.preset-btn[data-preset="7-7"]'); }
    await A.page.waitForTimeout(800); await L.flipDay(A.page, '2026-06-12'); await A.page.click('button.day-cell[data-ds="2026-06-14"]'); await A.page.fill('#dayNote', 'Beach trip'); await A.page.fill('#planTime', '09:00'); await A.page.fill('#planTitle', 'Pack the car'); await A.page.click('#btnAddPlan'); await A.page.waitForTimeout(700); await A.page.keyboard.press('Escape');
    await A.page.evaluate(() => [...document.querySelectorAll('.hol-tile')][0].click()); await A.page.fill('#childNameInput', 'Avery B'); await A.page.fill('#exchangeLocationInput', 'Car park');
    await L.act(A.page, '#btnCopyLink'); await A.page.waitForSelector('#shareOverlay.show'); await A.page.fill('#shareMessage', 'Could we swap the 12th?'); await A.page.click('#btnShareCopy'); await A.page.waitForSelector('#shareResult.show');
    const link = await A.page.evaluate(() => navigator.clipboard.readText()); theLink = link; await A.page.click('#btnShareCancel'); await B.page.goto(link); await B.page.waitForSelector('#sharedBanner.show'); await collect(B.page, 'shared banner');
    await B.page.click('#btnCompareShared'); await B.page.waitForSelector('#reviewOverlay.show'); await collect(B.page, 'review'); await B.page.click('#btnReviewApply'); await B.page.waitForLoadState('load'); await B.page.waitForTimeout(900); await collect(B.page, 'applied');
  });
  await step(B.page, 'cleanup', async () => { await collect(B.page, 'after apply'); });
  await collect(A.page, 'A').catch(() => {});

  // ---- 7. recipient without a licence, and the demo
  const R = await mk(); const demo = await mk();
  await step(R.page, 'recipient', async () => { await R.page.goto(theLink); await trace(R.page); await R.page.waitForSelector('#sharedBanner.show'); await R.page.waitForTimeout(300); await collect(R.page, 'recipient banner'); await R.page.click('button.day-cell >> nth=40'); await collect(R.page, 'recipient day sheet'); await R.page.keyboard.press('Escape'); await R.page.click('#btnUndo', { force: true }).catch(() => {}); await collect(R.page, 'recipient'); });
  await step(demo.page, 'demo', async () => { await demo.page.goto(url + '?demo'); await trace(demo.page); await demo.page.waitForSelector('#tourBanner.show'); await demo.page.waitForTimeout(300); await collect(demo.page, 'demo'); await demo.page.click('button.day-cell >> nth=45'); await collect(demo.page, 'demo sheet'); await demo.page.keyboard.press('Escape'); await demo.page.click('#btnMenuShare'); await demo.page.click('#btnBackup', { force: true }).catch(() => {}); await collect(demo.page, 'demo export'); });

  await browser.close(); srv.close();
  return { missing: [...seen.entries()], skipped, logs };
}

module.exports = { tour, NAMES };
if (require.main === module) tour().then(r => { console.log(JSON.stringify(r.missing.map(([t, w]) => [t, w]), null, 1)); console.log('SKIPPED', r.skipped); console.log('LOGS', r.logs.slice(0, 20)); });
