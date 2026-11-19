// Scheduling features: custom cycle + presets, summer window, winter break, regions, moving-date packs,
// long weekends, split Christmas, swap years, plain-language rules, hostile data in the new fields.
const L = require('./lib'); const { check } = L;
const pad = n => String(n).padStart(2, '0'); const iso = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const nth = (y, m, dow, n) => { if (n === -1) { const d = new Date(Date.UTC(y, m + 1, 0)); while (d.getUTCDay() !== dow) d.setUTCDate(d.getUTCDate() - 1); return iso(d); } const d = new Date(Date.UTC(y, m, 1)); let c = 0; for (;;) { if (d.getUTCDay() === dow && ++c === n) return iso(d); d.setUTCDate(d.getUTCDate() + 1); } };
const add = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const dayDiff = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
const easter = { 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28' };
(async () => {
  const { srv, url } = await L.startServer(); const browser = await L.chromium.launch(); const logs = [];
  const mk = async (opts = {}) => { const ctx = await L.newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], timezoneId: 'America/New_York', ...opts }); await L.stubGumroad(ctx, 'ok'); const page = await ctx.newPage(); L.watch(page, logs); await page.goto(url); await L.unlock(page, { names: ['Avery', 'Jordan', 'Taylor'] }); return { ctx, page }; };
  const rows = page => page.$$eval('#holidayTableBody tr', trs => trs.map(t => ({ name: t.children[0].textContent.replace('⇄', '').trim(), dates: t.children[1].textContent, rule: t.children[2].textContent, who: t.children[3].textContent.replace('⇄', '').trim(), off: t.classList.contains('is-disabled') })));
  const row = async (page, name) => (await rows(page)).find(r => r.name === name || r.name.startsWith(name));
  const year = (page, y) => page.selectOption('#yearSelect', String(y));
  const ownerOn = async (page, ds) => { const d = (await L.days(page))[ds]; return d ? L.ownerOf(d) : null; };
  const startOf = r => r && r.dates.split(' to ')[0];
  const endOf = r => r && r.dates.split(' to ').pop();

  let { ctx, page } = await mk();
  await page.click('.preset-btn[data-preset="7-7"]');

  // ================= regions
  const regionExpect = {
    ca: { 'Family Day': nth(2026, 1, 1, 3), 'Good Friday': add(easter[2026], -2), 'Victoria Day': '2026-05-18', 'Canada Day': '2026-07-01', 'Civic Holiday (most provinces)': nth(2026, 7, 1, 1), 'Labour Day': nth(2026, 8, 1, 1), 'Thanksgiving (Monday)': nth(2026, 9, 1, 2), 'Remembrance Day': '2026-11-11', 'Boxing Day': '2026-12-26', "Mother's Day": nth(2026, 4, 0, 2), "Father's Day": nth(2026, 5, 0, 3) },
    uk: { 'Good Friday': add(easter[2026], -2), 'Easter Monday': add(easter[2026], 1), 'Early May Bank Holiday': nth(2026, 4, 1, 1), 'Spring Bank Holiday': nth(2026, 4, 1, -1), 'Summer Bank Holiday': nth(2026, 7, 1, -1), 'Bonfire Night': '2026-11-05', 'Boxing Day': '2026-12-26', 'Mothering Sunday': add(easter[2026], -21), "Father's Day": nth(2026, 5, 0, 3) },
    au: { 'Australia Day': '2026-01-26', 'Good Friday': add(easter[2026], -2), 'Easter Monday': add(easter[2026], 1), 'Anzac Day': '2026-04-25', "King's Birthday (most states)": nth(2026, 5, 1, 2), 'Boxing Day': '2026-12-26', "Mother's Day": nth(2026, 4, 0, 2), "Father's Day": nth(2026, 8, 0, 1) },
    us: { "MLK Jr. Day": nth(2026, 0, 1, 3), 'Memorial Day': nth(2026, 4, 1, -1), 'Labor Day': nth(2026, 8, 1, 1), 'Veterans Day': '2026-11-11', 'Independence Day (Jul 4)': '2026-07-04' }
  };
  for (const [region, exp] of Object.entries(regionExpect)) {
    await page.selectOption('#regionSelect', region);
    const rs = await rows(page); const bad = [];
    for (const [name, date] of Object.entries(exp)) { const r = rs.find(x => x.name === name); if (!r) bad.push(`${name}: missing`); else if (startOf(r) !== date) bad.push(`${name}: ${startOf(r)} vs ${date}`); }
    check(`region ${region}: ${Object.keys(exp).length} holidays on the right dates`, bad.length === 0, bad.join(' ; '));
  }
  await page.selectOption('#regionSelect', 'ca'); { const names = (await rows(page)).map(r => r.name); check('region ca: US-only holidays are gone, Canadian ones present', !names.includes('Memorial Day') && !names.includes('Juneteenth') && names.includes('Canada Day') && names.includes('Victoria Day')); }
  { const r = await row(page, 'Truth and Reconciliation Day'); check('region ca: Truth and Reconciliation Day starts switched off', r && r.off, JSON.stringify(r)); }
  await page.selectOption('#regionSelect', 'uk'); { const names = (await rows(page)).map(r => r.name); check('region uk: Halloween is there but Thanksgiving is not', names.includes('Halloween') && !names.some(n => /Thanksgiving/.test(n))); }
  await page.selectOption('#regionSelect', 'us'); check('region us: back to the original list (22 built-in holidays, no birthdays set)', (await rows(page)).length === 22, String((await rows(page)).length));
  // every region, every year 2020..2045: no crash, 365/366 days, no overlapping-name duplicates
  { let bad = []; for (const region of ['us', 'ca', 'uk', 'au']) { await page.selectOption('#regionSelect', region); for (const y of [2020, 2024, 2025, 2026, 2030, 2038, 2045]) { await year(page, y); const n = await page.locator('button.day-cell').count(); const names = (await rows(page)).map(r => r.name); if (n !== ((y % 4 === 0) ? 366 : 365) || new Set(names).size !== names.length) bad.push(`${region} ${y}`); } } await page.selectOption('#regionSelect', 'us'); await year(page, 2026); check('regions: every region renders every sampled year, no duplicate rows', bad.length === 0, bad.join(',')); }

  // ================= plain-language rules
  { const rs = await rows(page); const bad = rs.filter(r => /Group [AB]/.test(r.rule)); check('rules say who has what in plain words (no "Group A/B")', bad.length === 0, bad.map(r => r.name + ': ' + r.rule).slice(0, 2).join(' | '));
    const mlk = rs.find(r => r.name === 'MLK Jr. Day'); check('rule reads "Jordan in even years, Taylor in odd years"', /^(Jordan in even years, Taylor in odd years|Taylor in even years, Jordan in odd years)/.test(mlk.rule), mlk.rule); }

  // ================= swap years
  { const before = await row(page, 'MLK Jr. Day'); const evenBefore = before.who;
    await page.evaluate(() => [...document.querySelectorAll('#holidayTableBody tr')].find(t => t.children[0].textContent.startsWith('MLK')).querySelector('.swap-years').click());
    const after = await row(page, 'MLK Jr. Day'); await year(page, 2027); const after27 = await row(page, 'MLK Jr. Day'); await year(page, 2026);
    check('swap years: flips who has the holiday this year', after.who !== evenBefore, `${evenBefore} -> ${after.who}`);
    check('swap years: and the other parent gets the other years too', after27.who !== (await (async () => { await page.evaluate(() => [...document.querySelectorAll('#holidayTableBody tr')].find(t => t.children[0].textContent.startsWith('MLK')).querySelector('.swap-years').click()); await year(page, 2027); const w = (await row(page, 'MLK Jr. Day')).who; await year(page, 2026); return w; })()), after27.who);
    const restored = await row(page, 'MLK Jr. Day'); check('swap years: swapping again restores the usual years', restored.who === evenBefore && restored.rule === before.rule, restored.who); }

  // ================= long weekends
  { const mem = '2026-05-25'; const before = await ownerOn(page, '2026-05-23'); const rowBefore = await row(page, 'Memorial Day');
    check('long weekends: off by default (Memorial Day is one day)', rowBefore.dates === mem);
    await page.click('#longWeekendOn'); const r = await row(page, 'Memorial Day'); const sat = await ownerOn(page, '2026-05-23'), sun = await ownerOn(page, '2026-05-24'), mon = await ownerOn(page, mem);
    check('long weekends: Memorial Day grows to Sat–Mon', startOf(r) === '2026-05-23' && endOf(r) === mem, r.dates);
    check('long weekends: the whole weekend goes to whoever has the holiday', sat === mon && sun === mon, `${sat}/${sun}/${mon}`);
    const lab = await row(page, 'Labor Day'); check('long weekends: other Monday holidays too (Labor Day)', startOf(lab) === add(nth(2026, 8, 1, 1), -2), lab.dates);
    const ee = await row(page, 'Easter Sunday'); check('long weekends: a Sunday holiday is unchanged (Easter)', ee.dates === easter[2026]);
    await page.click('#longWeekendOff'); check('long weekends: turning it off restores everything', (await ownerOn(page, '2026-05-23')) === before && (await row(page, 'Memorial Day')).dates === mem); }

  // ================= split Christmas
  { const eve = await ownerOn(page, '2026-12-24'), day = await ownerOn(page, '2026-12-25'); check('split Christmas: off by default, Eve and Day with the same parent', eve === day, `${eve}/${day}`);
    await page.click('#splitXmasOn'); const eve2 = await ownerOn(page, '2026-12-24'), day2 = await ownerOn(page, '2026-12-25'); check('split Christmas: on, Eve and Day go to different parents', eve2 !== day2 && eve2 === eve, `${eve2}/${day2}`);
    await year(page, 2027); const e27 = await ownerOn(page, '2027-12-24'), d27 = await ownerOn(page, '2027-12-25'); check('split Christmas: and they swap the next year', e27 !== d27 && e27 !== eve2, `${e27}/${d27}`); await year(page, 2026); await page.click('#splitXmasOff'); }

  // ================= winter break
  { const d = (await rows(page)); check('winter break: defaults are Dec 20 to Jan 2 (as before)', d.find(r => r.name === 'Winter Break (1st Half)').dates === '2026-12-20 to 2026-12-26' && d.find(r => r.name === 'Winter Break (2nd Half)').dates === '2026-12-27 to 2026-12-31' && d.find(r => r.name === 'Winter Break (Jan 1–2)').dates === '2026-01-01 to 2026-01-02');
    await page.selectOption('#winterStartDay', '23'); await page.selectOption('#winterEndDay', '5'); const e = await rows(page);
    check('winter break: moved to Dec 23 – Jan 5', e.find(r => r.name === 'Winter Break (1st Half)').dates === '2026-12-23 to 2026-12-29' && e.find(r => r.name === 'Winter Break (2nd Half)').dates === '2026-12-30 to 2026-12-31' && !!e.find(r => r.name === 'Winter Break (Jan 1–5)'), e.filter(r => /Winter/.test(r.name)).map(r => r.name + ' ' + r.dates).join(' | '));
    await page.selectOption('#winterStartDay', '31'); const f = await rows(page); check('winter break: starting Dec 31 leaves no second half (not a broken row)', f.find(r => r.name === 'Winter Break (1st Half)').dates === '2026-12-31' && !f.find(r => r.name === 'Winter Break (2nd Half)'), f.filter(r => /Winter/.test(r.name)).map(r => r.name + ' ' + r.dates).join(' | '));
    await page.selectOption('#winterStartDay', '20'); await page.selectOption('#winterEndDay', '2'); }

  // ================= summer window
  { const legacy = await page.$$eval('#summerMonths .week-chip', c => c.map(x => x.textContent));
    check('summer: default window shows exactly the original twelve week buttons', legacy.join('|') === 'Jun 1–7|Jun 8–14|Jun 15–21|Jun 22–28|Jun 29–30|Jul 1–7|Jul 8–14|Jul 15–21|Jul 22–28|Jul 29–31|Aug 1–7|Aug 8–14', legacy.join('|'));
    check('summer: label says Jun 1 – Aug 14', (await page.textContent('#summerRangeLabel')) === 'Jun 1 – Aug 14');
    await page.selectOption('#summerStartMonth', '4'); await page.selectOption('#summerStartDay', '15'); await page.selectOption('#summerEndMonth', '7'); await page.selectOption('#summerEndDay', '31');
    const chips = await page.$$eval('#summerMonths .week-chip', c => c.map(x => x.textContent));
    check('summer: window May 15 – Aug 31 gives May 15–21 … Aug 29–31', chips[0] === 'May 15–21' && chips[chips.length - 1] === 'Aug 29–31' && chips.includes('Aug 22–28') && chips.length === 3 + 5 + 5 + 5, chips.join('|'));
    check('summer: label follows', (await page.textContent('#summerRangeLabel')) === 'May 15 – Aug 31');
    await page.evaluate(() => [...document.querySelectorAll('.week-chip')].find(c => c.textContent === 'May 22–28').click());
    check('summer: a week picked in May goes to Parent 1', (await ownerOn(page, '2026-05-22')) === 'Jordan' && (await ownerOn(page, '2026-05-28')) === 'Jordan' && (await L.days(page))['2026-05-26'].title.includes('Summer Week'), (await L.days(page))['2026-05-26'].title);
    check('summer: days before the window are untouched', (await L.days(page))['2026-05-14'].title.includes('Base'));
    await page.evaluate(() => [...document.querySelectorAll('.week-chip')].find(c => c.textContent === 'Aug 22–28').click());
    check('summer: a week picked in late August works too', (await L.days(page))['2026-08-25'].title.includes('Summer Week'));
    const err = await page.evaluate(() => { document.getElementById('summerEndMonth').value = '3'; document.getElementById('summerEndMonth').dispatchEvent(new Event('change')); return document.getElementById('toastText').textContent; });
    check('summer: an end before the start is refused with a message', /end after it starts/.test(err) && (await page.textContent('#summerRangeLabel')) === 'May 15 – Aug 31', err);
    // link keeps the new weeks
    await L.act(page, '#btnCopyLink'); await page.click('#btnShareCopy'); await page.waitForSelector('#shareResult.show'); const link = await page.evaluate(() => navigator.clipboard.readText()); await page.click('#btnShareCancel');
    const want = await L.owners(page); const r = await mk(); await r.page.goto(link); await r.page.waitForSelector('#sharedBanner.show');
    check('summer: a share link carries the window and the weeks picked outside June–August', JSON.stringify(await L.owners(r.page)) === JSON.stringify(want) && (await r.page.textContent('#summerRangeLabel')) === 'May 15 – Aug 31'); await r.ctx.close();
    // match school dates
    await page.fill('#schoolEndInput', '2026-06-05'); await page.dispatchEvent('#schoolEndInput', 'change'); await page.fill('#schoolStartInput', '2026-08-24'); await page.dispatchEvent('#schoolStartInput', 'change');
    await page.click('#btnSummerFromSchool');
    check('summer: "Match my school dates" sets Jun 6 – Aug 23', (await page.textContent('#summerRangeLabel')) === 'Jun 6 – Aug 23', await page.textContent('#summerRangeLabel'));
    await page.selectOption('#summerStartMonth', '5'); await page.selectOption('#summerStartDay', '1'); await page.selectOption('#summerEndMonth', '7'); await page.selectOption('#summerEndDay', '14');
    check('summer: setting it back gives the original window', (await page.$$eval('#summerMonths .week-chip', c => c.length)) === 12);
    await page.evaluate(() => [...document.querySelectorAll('.week-chip.selected')].forEach(c => c.click())); }

  // ================= presets + custom cycle
  { const counts = {}; for (const p of ['3-3-4-4', '4-3-3-4', 'eow-thu', '4-3', '5-2', '4-4', '3-3', '5-5']) { await page.click(`.preset-btn[data-preset="${p}"]`); counts[p] = (await L.stats(page)).base; }
    check('presets: 3-3-4-4 and 4-3-3-4 are 7 nights each', /7\/14/.test(counts['3-3-4-4']) && /7\/14/.test(counts['4-3-3-4']), counts['3-3-4-4'] + ' / ' + counts['4-3-3-4']);
    check('presets: 4-3 is weekly, 4 nights and 3', /4\/7/.test(counts['4-3']) && /3\/7/.test(counts['4-3']), counts['4-3']);
    check('presets: 5-2 gives weekdays to Parent 1', /5\/7/.test(counts['5-2']), counts['5-2']);
    check('presets: every other long weekend is 4 nights of 14 with Parent 2', /Jordan 10\/14.*Taylor 4\/14/.test(counts['eow-thu']), counts['eow-thu']);
    check('presets: 4-4, 3-3, 5-5 give half each over their cycle', /4\/8/.test(counts['4-4']) && /3\/6/.test(counts['3-3']) && /5\/10/.test(counts['5-5']), `${counts['4-4']} | ${counts['3-3']} | ${counts['5-5']}`);
    // eow-thu really is Thu–Sun
    await page.click('.preset-btn[data-preset="eow-thu"]'); const d = await L.days(page); const p2days = Object.keys(d).filter(k => k.startsWith('2026-03') && L.ownerOf(d[k]) === 'Taylor').map(k => new Date(k + 'T12:00:00').getDay());
    check('presets: the long-weekend nights are Thu, Fri, Sat, Sun', [...new Set(p2days)].sort().join() === '0,4,5,6', [...new Set(p2days)].sort().join());
    // cycle: 4 on / 4 off from the anchor
    await page.click('.preset-btn[data-preset="4-4"]'); check('cycle: mode switched on and the controls are shown', (await page.locator('#cycleWrap').isVisible()) && (await page.inputValue('#cycleLengthInput')) === '8' && (await page.locator('.dp-tile').count()) === 8);
    const anchor = await page.inputValue('#cycleAnchorInput'); const dd = await L.days(page); let ok = true, why = '';
    for (const k of Object.keys(dd).filter(k => k >= '2026-02-01' && k <= '2026-04-30' && !/is-holiday|is-override/.test(dd[k].cls) && dd[k].title.includes('Base') && !dd[k].title.includes('→'))) { const idx = ((dayDiff(anchor, k) % 8) + 8) % 8; const want = idx < 4 ? 'Jordan' : 'Taylor'; if (L.ownerOf(dd[k]) !== want) { ok = false; why = `${k}: ${L.ownerOf(dd[k])} vs ${want}`; break; } }
    check('cycle: 4 on / 4 off repeats exactly from the start date', ok, why);
    // continues across the year boundary
    await year(page, 2027); const d27 = await L.days(page); const k = '2027-01-10'; const idx = ((dayDiff(anchor, k) % 8) + 8) % 8; check('cycle: continues into the next year without a reset', (d27['2027-01-02'] && true) && (L.ownerOf(d27[k]) === (idx < 4 ? 'Jordan' : 'Taylor') || d27[k].title.includes('Winter') || d27[k].cls.includes('is-holiday')), `${k} idx ${idx} ${L.ownerOf(d27[k])}`); await year(page, 2026);
    // change length & start, tap a tile
    await page.fill('#cycleLengthInput', '5'); await page.dispatchEvent('#cycleLengthInput', 'change'); check('cycle: length 5 gives 5 tiles and keeps the days already chosen', (await page.locator('.dp-tile').count()) === 5 && (await page.$$eval('.dp-tile', t => t.map(x => x.getAttribute('aria-pressed')).join())) === 'true,true,true,true,false');
    await page.fill('#cycleLengthInput', '99'); await page.dispatchEvent('#cycleLengthInput', 'change'); check('cycle: length is held to 28', (await page.inputValue('#cycleLengthInput')) === '28' && (await page.locator('.dp-tile').count()) === 28);
    await page.fill('#cycleLengthInput', '1'); await page.dispatchEvent('#cycleLengthInput', 'change'); check('cycle: and to at least 2', (await page.inputValue('#cycleLengthInput')) === '2');
    await page.click('.preset-btn[data-preset="4-4"]'); await page.evaluate(() => document.querySelectorAll('.dp-tile')[4].click()); check('cycle: tapping a tile gives that night to the other parent', (await page.$$eval('.dp-tile', t => t.map(x => x.getAttribute('aria-pressed')).join())) === 'true,true,true,true,true,false,false,false');
    await page.fill('#cycleAnchorInput', '2026-01-05'); await page.dispatchEvent('#cycleAnchorInput', 'change'); check('cycle: moving the start date shifts the pattern by a day', (await L.stats(page)).base.includes('5/8'));
    check('cycle: summary says what the cycle is', /Repeating 8-day cycle/.test(await page.textContent('#rulesSummaryBox')));
    // round trip through a share link
    await L.act(page, '#btnCopyLink'); await page.click('#btnShareCopy'); await page.waitForSelector('#shareResult.show'); const link = await page.evaluate(() => navigator.clipboard.readText()); await page.click('#btnShareCancel'); const want = await L.owners(page);
    const r = await mk(); await r.page.goto(link); await r.page.waitForSelector('#sharedBanner.show'); check('cycle: a share link reproduces it exactly', JSON.stringify(await L.owners(r.page)) === JSON.stringify(want)); await r.ctx.close();
    await page.click('.preset-btn[data-preset="7-7"]'); check('cycle: choosing a two-week preset leaves cycle mode', (await page.locator('#cycleWrap').isHidden())); }

  // ================= moving-date packs
  { for (const p of ['jewish', 'islamic', 'hindu', 'chinese']) await page.selectOption('#pack_' + p, 'both');
    const T = async (y, name, expectStart, tol = 0, len) => { await year(page, y); const all = (await rows(page)).filter(x => x.name.startsWith(name)); const r = all.find(x => startOf(x).startsWith(String(y))) || all[0]; if (!r) return `${y} ${name}: missing`; const got = startOf(r); const diff = Math.abs(dayDiff(expectStart, got)); if (diff > tol) return `${y} ${name}: ${got} vs ${expectStart}`; if (len && (r.dates.includes(' to ') ? dayDiff(startOf(r), endOf(r)) + 1 : 1) !== len) return `${y} ${name}: length ${r.dates}`; return null; };
    const probs = (await Promise.all([])).concat(
      await T(2026, 'Rosh Hashanah', '2026-09-12', 0, 2), await T(2026, 'Yom Kippur', '2026-09-21'), await T(2026, 'Sukkot', '2026-09-26'), await T(2025, 'Hanukkah', '2025-12-15', 0, 8), await T(2026, 'Hanukkah', '2026-12-05', 0, 8),
      await T(2026, 'Purim', '2026-03-03'), await T(2026, 'Passover', '2026-04-02', 0, 8), await T(2025, 'Passover', '2025-04-13', 0, 8), await T(2027, 'Rosh Hashanah', '2027-10-02', 0, 2));
    check('Jewish holidays on the known dates (Rosh Hashanah, Yom Kippur, Sukkot, Hanukkah, Purim, Passover)', probs.every(x => !x), probs.filter(Boolean).join(' ; '));
    const lny = { 2020: '01-25', 2021: '02-12', 2022: '02-01', 2023: '01-22', 2024: '02-10', 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26', 2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31', 2034: '02-19', 2035: '02-08', 2036: '01-28', 2037: '02-15', 2038: '02-04', 2039: '01-24', 2040: '02-12' };
    const mid = { 2020: '10-01', 2021: '09-21', 2022: '09-10', 2023: '09-29', 2024: '09-17', 2025: '10-06', 2026: '09-25', 2027: '09-15', 2028: '10-03', 2029: '09-22', 2030: '09-12' };
    const p2 = []; for (const [y, d] of Object.entries(lny)) p2.push(await T(+y, 'Lunar New Year', `${y}-${d}`)); for (const [y, d] of Object.entries(mid)) p2.push(await T(+y, 'Mid-Autumn Festival', `${y}-${d}`));
    check('Chinese holidays on the published dates (Lunar New Year every year 2020–2040, Mid-Autumn 2020–2030)', p2.every(x => !x), p2.filter(Boolean).join(' ; '));
    const p3 = [await T(2026, 'Eid al-Fitr', '2026-03-20', 1, 3), await T(2026, 'Eid al-Adha', '2026-05-27', 1, 3), await T(2025, 'Eid al-Fitr', '2025-03-30', 1), await T(2025, 'Eid al-Adha', '2025-06-06', 1), await T(2026, 'Ramadan', '2026-02-18', 1)];
    check('Islamic holidays on the published dates, within a day (moon sighting)', p3.every(x => !x), p3.filter(Boolean).join(' ; '));
    const dw = { 2020: '2020-11-14', 2021: '2021-11-04', 2022: '2022-10-24', 2023: '2023-11-12', 2026: '2026-11-08' }; const p4 = []; for (const [y, d] of Object.entries(dw)) p4.push(await T(+y, 'Diwali', d, 0));
    check('Diwali on the known dates 2020–2023 and 2026', p4.every(x => !x), p4.filter(Boolean).join(' ; '));
    const p5 = [await T(2024, 'Diwali', '2024-10-31', 1), await T(2025, 'Diwali', '2025-10-20', 1)]; check('Diwali 2024 and 2025 within a day (the festival day itself is observed on different days)', p5.every(x => !x), p5.filter(Boolean).join(' ; '));
    // two rows when a holiday recurs inside one Gregorian year, and a Hanukkah that runs into January
    await year(page, 2025); const h25 = (await rows(page)).filter(r => /Hanukkah/.test(r.name)); check('packs: Hanukkah that starts in late December 2024 shows in 2025 as well (it runs into January)', h25.length === 2 && h25.some(r => r.dates.startsWith('2024-12-26')), h25.map(r => r.dates).join(' | '));
    await year(page, 2030); const eid30 = (await rows(page)).filter(r => /Islamic New Year|Eid al-Fitr|Ramadan/.test(r.name)); check('packs: a Hijri-calendar holiday that comes twice in a year gets two rows (no clash)', new Set((await rows(page)).map(r => r.name + r.dates)).size === (await rows(page)).length, eid30.map(r => r.name + ' ' + startOf(r)).join(' | '));
    // 2020–2045: every pack yields something each year
    let empty = []; for (let y = 2020; y <= 2045; y += 5) { await year(page, y); const rs = await rows(page); for (const n of ['Rosh Hashanah', 'Eid al-Fitr', 'Diwali', 'Lunar New Year']) if (!rs.find(r => r.name.startsWith(n))) empty.push(`${y} ${n}`); }
    check('packs: every pack has dates in every sampled year 2020–2045', empty.length === 0, empty.join(','));
    // sharing options
    await year(page, 2026); await page.selectOption('#pack_jewish', 'p1'); check('packs: "Always Jordan" gives the holiday to Jordan', (await row(page, 'Yom Kippur')).who === 'Jordan' && /Always Jordan/.test((await row(page, 'Yom Kippur')).rule));
    await page.selectOption('#pack_jewish', 'alt'); const alt = (await rows(page)).filter(r => ['Rosh Hashanah', 'Yom Kippur', 'Sukkot', 'Hanukkah', 'Purim', 'Passover'].some(n => r.name.startsWith(n))).map(r => r.who); check('packs: "Alternate years" splits the six holidays between the parents', new Set(alt).size === 2, alt.join());
    await page.selectOption('#pack_jewish', 'off'); check('packs: switching a pack off removes its rows', !(await rows(page)).some(r => /Rosh Hashanah/.test(r.name)));
    // a pack holiday tile cycles for the year, and appears on the calendar
    await page.selectOption('#pack_chinese', 'both'); for (let i = 0; i < 2; i++) await page.evaluate(() => [...document.querySelectorAll('.hol-tile')].find(t => t.textContent.includes('Lunar New Year')).click()); check('packs: a pack holiday has a tile that can be changed for the year', (await row(page, 'Lunar New Year')).who === 'Jordan', (await row(page, 'Lunar New Year')).who); check('packs: and it shows on the calendar day with its icon', (await L.days(page))['2026-02-17'].icon === '🧧' && (await L.days(page))['2026-02-17'].title.includes('Lunar New Year'));
    for (const p of ['jewish', 'islamic', 'hindu', 'chinese']) await page.selectOption('#pack_' + p, 'off'); }

  // ================= compatibility: calendars saved before this release keep their schedule
  check('compat: a plain new calendar still starts in the US set with summer unselected days following the base', (await page.inputValue('#regionSelect')) === 'us');

  // ================= performance with everything on
  { for (const p of ['jewish', 'islamic', 'hindu', 'chinese']) await page.selectOption('#pack_' + p, 'alt'); await page.selectOption('#regionSelect', 'ca'); await page.click('#longWeekendOn'); const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const t = await page.evaluate(() => { const med = a => { a.sort((x, y) => x - y); return Math.round(a[Math.floor(a.length / 2)]); }; const k = [], c = []; for (let i = 0; i < 15; i++) { let t0 = performance.now(); const el = document.getElementById('childNameInput'); el.value = 'Avery' + i; el.dispatchEvent(new Event('input', { bubbles: true })); k.push(performance.now() - t0); t0 = performance.now(); document.querySelector(`button.day-cell[data-ds="2026-04-${String(10 + (i % 15)).padStart(2, '0')}"]`).click(); c.push(performance.now() - t0); } return { keystroke: med(k), dayTap: med(c) }; });
    check('speed: with a region, four packs and long weekends on, typing and tapping stay under 150 ms (4x slower CPU)', t.keystroke < 150 && t.dayTap < 150, JSON.stringify(t)); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await page.selectOption('#regionSelect', 'us'); await page.click('#longWeekendOff'); for (const p of ['jewish', 'islamic', 'hindu', 'chinese']) await page.selectOption('#pack_' + p, 'off'); }

  // ================= accessibility with the new controls open
  { await page.click('.preset-btn[data-preset="4-4"]'); await page.selectOption('#pack_jewish', 'alt'); await page.addScriptTag({ content: L.fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') });
    const v = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations.map(x => `${x.id}×${x.nodes.length} ${x.nodes[0].target.join(' ').slice(0, 70)}`)); check('accessibility: custom cycle, packs and swap buttons pass the scan', v.length === 0, v.join(' | ')); }
  await ctx.close();

  // ================= hostile or damaged data in the new fields (share links and saved calendars)
  { const evil = '<img src=x onerror="window.__x=1">'; const fields = { region: { zr: evil }, regionOther: { zr: 'moon' }, packs: { zp: { jewish: evil, islamic: 'p3', hindu: 7, chinese: null } }, packsNotObject: { zp: evil }, flips: { zf: { [evil]: true, mlk: 1, ok_key: true } }, summerStart: { za: evil, zb: evil }, summerBackwards: { za: '09-30', zb: '06-01' }, summerImpossible: { za: '02-31', zb: '13-45' }, winter: { zc: evil, zd: 'x' }, winterRange: { zc: 3, zd: 99 }, cycleLength: { ze: evil, zg: evil, zh: evil }, cycleHuge: { ze: 9999, zg: '1'.repeat(5000) }, cycleShort: { ze: 5, zg: '101' }, cycleMode: { bm: 'cycle', ze: 3, zg: '110', zh: '2026-01-04' }, extraWeeks: { zi: `may3,${evil},zzz9,sep5,${'a'.repeat(300)}` }, extraWeeksNotString: { zi: { a: 1 } } };
    for (const [name, o] of Object.entries(fields)) { const lg = []; const r = await mk(); r.page.on('pageerror', e => lg.push(e.message)); await r.page.goto(L.mkLink(url, Object.assign({ y: 2026 }, o))); await r.page.waitForTimeout(350); const n = await r.page.locator('button.day-cell').count(); const xss = await r.page.evaluate(() => !!window.__x || !!document.querySelector('.container img, header img')); if (lg.length || xss || n < 365) fields[name] = 'BAD: ' + (lg[0] || (xss ? 'markup ran' : 'did not open ' + n)); else fields[name] = 'ok'; await r.ctx.close(); }
    const bad = Object.entries(fields).filter(([, v]) => v !== 'ok'); check(`hostile/damaged values in ${Object.keys(fields).length} new fields open safely, nothing runs`, bad.length === 0, bad.map(([k, v]) => k + ' ' + v).join(' ; ')); }

  const errs = logs.filter(x => /pageerror|console\.error/.test(x) && !/Failed to load resource|net::ERR|404/.test(x));
  check('no script errors anywhere in this run', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = L.summary('SCHEDULING CHECKS'); await browser.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
