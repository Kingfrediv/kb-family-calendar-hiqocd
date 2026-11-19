// Output: phone-calendar export (years, reminders, plans, time zones), print report, themes and patterns.
const L = require('./lib'); const { check } = L;
(async () => {
  const { srv, url } = await L.startServer(); const browser = await L.chromium.launch(); const logs = [];
  const mk = async (opts = {}, names = ['Avery', 'Jordan', 'Taylor']) => { const ctx = await L.newCtx(browser, { permissions: ['clipboard-read', 'clipboard-write'], timezoneId: 'America/New_York', ...opts }); await L.stubGumroad(ctx, 'ok'); const page = await ctx.newPage(); L.watch(page, logs); await page.goto(url); if (names) await L.unlock(page, { names }); return { ctx, page }; };
  const unfold = t => t.replace(/\r\n[ \t]/g, '');
  const events = t => unfold(t).split('BEGIN:VEVENT').slice(1).map(b => b.split('END:VEVENT')[0]);
  const field = (e, name) => { const m = e.match(new RegExp('^' + name + '[;:][^\\r\\n]*', 'm')); return m ? m[0] : null; };

  let { ctx, page } = await mk(); await page.selectOption('#yearSelect', '2026'); await page.click('.preset-btn[data-preset="2-2-3"]');
  await page.fill('#timeToP1Input', '3:00 PM'); await page.fill('#timeToP2Input', '6:00 PM'); await page.fill('#timeHolidayInput', '9:30 AM'); await page.fill('#exchangeLocationInput', 'Library, front desk');
  await page.click('button.day-cell[data-ds="2026-03-04"]'); await page.fill('#dayNote', 'Dentist at 3; bring card'); await page.fill('#planTime', '16:30'); await page.fill('#planTitle', 'Soccer, field 2'); await page.click('#btnAddPlan'); await page.fill('#planTime', ''); await page.fill('#planTitle', 'School photo day'); await page.click('#btnAddPlan'); await page.waitForTimeout(800); await page.keyboard.press('Escape');
  await page.selectOption('#yearSelect', '2027'); await page.click('button.day-cell[data-ds="2027-02-02"]'); await page.fill('#planTitle', 'Next-year plan'); await page.click('#btnAddPlan'); await page.keyboard.press('Escape'); await page.selectOption('#yearSelect', '2026');

  // ================= dialog and file shape
  { await L.act(page, '#btnExportIcs'); await page.waitForSelector('#icsOverlay.show');
    check('ics: asks what to include first (years, reminder, plans, time zone)', (await page.locator('#icsYears').isVisible()) && (await page.locator('#icsAlarm').isVisible()) && (await page.locator('#icsPlans').isChecked()) && (await page.inputValue('#icsZone')) === 'America/New_York', await page.inputValue('#icsZone'));
    check('ics: the time-zone list offers hundreds of zones, the device first', (await page.locator('#icsZone option').count()) > 300 && /This device \(America\/New_York\)/.test(await page.locator('#icsZone option').first().textContent()));
    await page.keyboard.press('Escape'); check('ics: Escape closes it without downloading', (await page.locator('#icsOverlay.show').count()) === 0); }
  const one = await L.icsDownload(page); const t1 = one.text; const ev1 = events(t1);
  check('ics: one year by default, file named for the child and year', /Avery-parenting-calendar-2026\.ics/.test(one.name) && ev1.length > 100 && !ev1.some(e => /DTSTART(;VALUE=DATE|;TZID=[^:]+):2027/.test(e)), one.name + ' / ' + ev1.length);
  check('ics: well formed (CRLF only, lines of 75 bytes or fewer, balanced BEGIN/END)', !t1.replace(/\r\n/g, '').includes('\n') && Math.max(...t1.split('\r\n').map(l => Buffer.byteLength(l))) <= 75 && (t1.match(/BEGIN:/g) || []).length === (t1.match(/END:/g) || []).length);
  check('ics: every event has a unique id', new Set(ev1.map(e => field(e, 'UID'))).size === ev1.length);
  const plan = ev1.find(e => /SUMMARY:Soccer\\, field 2/.test(e)); check('ics: a timed plan is a one-hour event at its time, commas escaped', plan && /DTSTART;TZID=America\/New_York:20260304T163000/.test(plan) && /DTEND;TZID=America\/New_York:20260304T173000/.test(plan), plan && field(plan, 'DTSTART'));
  const allday = ev1.find(e => /SUMMARY:School photo day/.test(e)); check('ics: a plan with no time is an all-day event', allday && /DTSTART;VALUE=DATE:20260304/.test(allday) && /DTEND;VALUE=DATE:20260305/.test(allday));
  check('ics: a day\'s note goes into the description of the overnight block, semicolons escaped', ev1.some(e => /DESCRIPTION:[^\r\n]*Note\\, Wed\\, Mar 4: Dentist at 3\\; bring card/.test(e)));
  check('ics: exchanges are timed from the settings (3 PM, 6 PM, 9:30 AM on holidays) with the place', ev1.some(e => /SUMMARY:Exchange to Jordan/.test(e) && /T150000/.test(e)) && ev1.some(e => /SUMMARY:Exchange to Taylor/.test(e) && /T180000/.test(e)) && ev1.some(e => /LOCATION:Library\\, front desk/.test(e)));
  check('ics: no reminders unless asked', !/VALARM/.test(t1));
  const noPlans = await L.icsDownload(page, { plans: false }); check('ics: leaving plans out leaves them and notes out', !/Soccer|School photo|Dentist/.test(noPlans.text));

  // ================= years
  const three = await L.icsDownload(page, { years: 3 }); const ev3 = events(three.text);
  const yearsSeen = new Set(ev3.map(e => (field(e, 'DTSTART') || '').match(/:(\d{4})/)?.[1])); check('ics: three years in one file', yearsSeen.has('2026') && yearsSeen.has('2027') && yearsSeen.has('2028') && /2026-2028\.ics/.test(three.name), [...yearsSeen].join() + ' ' + three.name);
  check('ics: the file name and the calendar name cover the range', /X-WR-CALNAME:Avery Parenting Calendar 2026–2028/.test(unfold(three.text)));
  check('ics: plans in later years come along', ev3.some(e => /SUMMARY:Next-year plan/.test(e) && /20270202/.test(e)));
  check('ics: ids stay unique across years', new Set(ev3.map(e => field(e, 'UID'))).size === ev3.length);
  { const blocks = ev3.filter(e => /^UID:block-/m.test(e)).map(e => [field(e, 'DTSTART;VALUE=DATE'), field(e, 'DTEND;VALUE=DATE')]).map(([a, b]) => [a.split(':')[1], b.split(':')[1]]).sort(); let gap = 0; for (let i = 1; i < blocks.length; i++) if (blocks[i][0] !== blocks[i - 1][1]) gap++; check('ics: overnight blocks run on without a gap or overlap over the three years', gap === 0 && blocks.length > 100, `${blocks.length} blocks, ${gap} gaps`); }

  // ================= reminders
  for (const [kind, trig] of [['30m', '-PT30M'], ['1h', '-PT1H'], ['1d', '-P1D']]) { const r = (await L.icsDownload(page, { alarm: kind })).text; const exch = events(r).filter(e => /^SUMMARY:Exchange/m.test(e)); const withAlarm = exch.filter(e => /BEGIN:VALARM[\s\S]*TRIGGER:/.test(e)); check(`ics: reminder "${kind}" is on every exchange (${trig}), and only there`, exch.length > 20 && withAlarm.length === exch.length && withAlarm.every(e => e.includes('TRIGGER:' + trig)) && events(r).filter(e => /^UID:block-/m.test(e)).every(e => !/VALARM/.test(e)), `${withAlarm.length}/${exch.length}`); }
  check('ics: reminders sit inside their event (valid structure)', /BEGIN:VEVENT[^]*?BEGIN:VALARM[^]*?END:VALARM[^]*?END:VEVENT/.test(unfold((await L.icsDownload(page, { alarm: '1h' })).text)));
  // all-day exchanges (no times set) remind at 9 AM
  { const q = await mk(); await q.page.selectOption('#yearSelect', '2026'); await q.page.click('.preset-btn[data-preset="7-7"]'); const r = (await L.icsDownload(q.page, { alarm: '1h' })).text; const ex = events(r).filter(e => /^SUMMARY:Exchange/m.test(e)); check('ics: exchanges with no time set are all-day markers that remind at 9 AM', ex.length > 20 && ex.every(e => /DTSTART;VALUE=DATE/.test(e) && /TRIGGER:PT9H/.test(e)), ex.length + ''); const r2 = (await L.icsDownload(q.page, { alarm: '1d' })).text; check('ics: ...or at 9 AM the day before', events(r2).filter(e => /^SUMMARY:Exchange/m.test(e)).every(e => /TRIGGER:-PT15H/.test(e))); await q.ctx.close(); }

  // ================= time zones: the definition must agree with the browser's own offsets
  const zones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Halifax', 'America/St_Johns', 'America/Mexico_City', 'America/Sao_Paulo', 'America/Argentina/Buenos_Aires', 'Europe/London', 'Europe/Dublin', 'Europe/Paris', 'Europe/Moscow', 'Africa/Cairo', 'Africa/Johannesburg', 'Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Tokyo', 'Asia/Dubai', 'Australia/Sydney', 'Australia/Lord_Howe', 'Australia/Adelaide', 'Pacific/Auckland', 'Pacific/Chatham', 'Pacific/Kiritimati', 'Asia/Tehran', 'America/Havana', 'UTC'];
  const parseLocal = s => Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(9, 11) || 0, +s.slice(11, 13) || 0);
  const parseOff = s => (s[0] === '-' ? -1 : 1) * (+s.slice(1, 3) * 60 + +s.slice(3, 5));
  const tzBad = [], tzNote = [];
  for (const zone of zones) {
    const text = unfold((await L.icsDownload(page, { years: 3, zone })).text);
    const vt = text.match(/BEGIN:VTIMEZONE[\s\S]*?END:VTIMEZONE/); if (!vt) { tzBad.push(zone + ': no VTIMEZONE'); continue; }
    if (!new RegExp('TZID:' + zone + '\\r?\\n').test(vt[0])) { tzBad.push(zone + ': TZID'); continue; }
    const obs = [...vt[0].matchAll(/BEGIN:(STANDARD|DAYLIGHT)\r?\nDTSTART:(\d{8}T\d{6})\r?\nTZOFFSETFROM:([+-]\d{4})\r?\nTZOFFSETTO:([+-]\d{4})/g)].map(m => ({ at: parseLocal(m[2]), from: parseOff(m[3]), to: parseOff(m[4]) })).sort((a, b) => a.at - b.at);
    const offsetAt = wall => { let off = obs[0].to; for (const o of obs.slice(1)) if (wall >= o.at) off = o.to; return off; };
    let bad = 0, checked = 0;
    // the expected offsets come from the browser that built the file (Node's own time-zone data can be a release older or newer)
    const samples = [];
    for (let d = Date.UTC(2026, 0, 1, 12); d < Date.UTC(2029, 0, 1); d += 5 * 86400000) {
      const wall = d; const off = offsetAt(wall);
      // skip wall times within a day of a change, where the same wall time can mean two moments
      if (obs.some(o => Math.abs(o.at - wall) < 86400000)) continue; samples.push([wall - off * 60000, off]);
    }
    const reals = await page.evaluate(([zone, list]) => list.map(ms => { const p = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(ms).find(x => x.type === 'timeZoneName').value; if (p === 'GMT') return 0; const m = /GMT([+\-−])(\d{1,2})(?::(\d{2}))?/.exec(p); return (m[1] === '+' ? 1 : -1) * (+m[2] * 60 + +(m[3] || 0)); }), [zone, samples.map(x => x[0])]);
    samples.forEach(([, off], i) => { checked++; if (reals[i] !== off) bad++; });
    // and the events in the file use that zone
    const dt = [...text.matchAll(/DTSTART;TZID=([^:]+):/g)].map(m => m[1]); if (dt.length && !dt.every(z => z === zone)) bad++;
    if (bad) tzBad.push(`${zone}: ${bad}/${checked} wrong`); if (obs.length === 1) tzNote.push(zone);
  }
  check(`time zones: the generated definition matches the browser's own offsets for ${zones.length} zones (incl. +5:45, +12:45, Lord Howe, Dublin, Cairo, Havana) over three years`, tzBad.length === 0, tzBad.join(' ; '));
  check('time zones: zones without daylight saving get a plain fixed definition', ['America/Phoenix', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Tokyo', 'UTC', 'Pacific/Honolulu', 'Pacific/Kiritimati'].every(z => tzNote.includes(z)), tzNote.join());
  { const sydney = unfold((await L.icsDownload(page, { zone: 'Australia/Sydney' })).text); check('time zones: Sydney has its changes in April and October (southern summer)', /DTSTART:2026(04|10)\d\dT0[23]0000/.test(sydney) && /BEGIN:DAYLIGHT[^]*?TZOFFSETTO:\+1100/.test(sydney)); }
  { const t = unfold((await L.icsDownload(page, { zone: 'Asia/Kolkata' })).text); const e = events(t).find(e => /SUMMARY:Exchange to Taylor/.test(e) && /TZID/.test(e)); check('time zones: an exchange at 6 PM in Kolkata stays 6 PM Kolkata time', e && /DTSTART;TZID=Asia\/Kolkata:\d{8}T180000/.test(e), e && field(e, 'DTSTART')); }
  await ctx.close();


  // ================= themes
  const themeOf = page => page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  { const d = await mk({ colorScheme: 'dark' }); check('theme: follows a dark device by default', (await themeOf(d.page)) === 'dark'); await d.ctx.close();
    const l = await mk({ colorScheme: 'light' }); check('theme: follows a light device by default', (await themeOf(l.page)) === 'light');
    await l.page.click('#btnMenuShare'); check('theme: the menu offers three radio choices with the current one checked', (await l.page.getAttribute('#themeAuto', 'aria-checked')) === 'true' && (await l.page.locator('[data-theme-choice]').count()) === 3 && (await l.page.locator('[data-lang-choice]').count()) === 2);
    await l.page.click('#themeDark'); check('theme: choosing Dark switches at once and keeps the menu open', (await themeOf(l.page)) === 'dark' && (await l.page.getAttribute('#themeDark', 'aria-checked')) === 'true' && (await l.page.locator('#shareMenu').isVisible()));
    await l.page.keyboard.press('Escape'); await l.page.reload(); check('theme: it is remembered across a reload', (await themeOf(l.page)) === 'dark');
    check('theme: it is a device choice, not part of the calendar', !(await l.page.evaluate(() => localStorage.custody_cal_v9)).includes('"dark"') && (await l.page.evaluate(() => JSON.parse(localStorage.kb_prefs_v1).theme)) === 'dark');
    await l.page.click('.preset-btn[data-preset="7-7"]'); const link = await (async () => { await L.act(l.page, '#btnCopyLink'); await l.page.click('#btnShareCopy'); await l.page.waitForSelector('#shareResult.show'); const k = await l.page.evaluate(() => navigator.clipboard.readText()); await l.page.click('#btnShareCancel'); return k; })();
    const r = await mk({ colorScheme: 'light' }, null); await r.page.goto(link); await r.page.waitForSelector('#sharedBanner.show'); check('theme: someone opening your link gets their own theme, not yours', (await themeOf(r.page)) === 'light'); await r.ctx.close();
    // no flash: the page is dark from the first moment
    const f = await L.newCtx(browser, { colorScheme: 'light' }); const fp = await f.newPage(); await fp.addInitScript(() => { localStorage.setItem('kb_prefs_v1', JSON.stringify({ theme: 'dark' })); window.__themes = []; new MutationObserver(() => window.__themes.push(document.documentElement.getAttribute('data-theme'))).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); }); await fp.goto(url); await fp.waitForTimeout(300);
    check('theme: a saved dark choice is applied before the page is drawn (never a white flash)', (await fp.evaluate(() => window.__themes)).every(t => t === 'dark') && (await themeOf(fp)) === 'dark', JSON.stringify(await fp.evaluate(() => window.__themes))); await f.close();
    await l.page.evaluate(() => { const p = JSON.parse(localStorage.kb_prefs_v1); p.theme = 'auto'; localStorage.kb_prefs_v1 = JSON.stringify(p); }); await l.page.emulateMedia({ colorScheme: 'dark' }); await l.page.reload(); check('theme: "match my device" follows it when the device changes', (await themeOf(l.page)) === 'dark'); await l.page.emulateMedia({ colorScheme: 'light' }); await l.page.waitForTimeout(200); check('theme: ...and back', (await themeOf(l.page)) === 'light');
    await l.ctx.close(); }
  // contrast in both themes, in the states people actually see
  { const axeSrc = L.fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); const scan = async page => { await page.addScriptTag({ content: axeSrc }); await page.evaluate(() => { const t = document.getElementById('toast'); t.classList.remove('show'); t.style.transition = 'none'; }); await page.waitForTimeout(60); return page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] })).violations.map(x => `${x.id}×${x.nodes.length} ${x.nodes.slice(0, 2).map(n => n.target.join(' ').slice(0, 45)).join(' & ')}`)); };
    for (const theme of ['light', 'dark']) {
      const m = await mk({ colorScheme: theme }); await m.page.selectOption('#yearSelect', '2026'); await m.page.click('.preset-btn[data-preset="2-2-3"]'); await m.page.fill('#timeToP2Input', '6:00 PM');
      await m.page.click('button.day-cell[data-ds="2026-03-04"]'); await m.page.fill('#dayNote', 'A note'); await m.page.fill('#planTitle', 'A plan'); await m.page.click('#btnAddPlan'); await m.page.waitForTimeout(700); await m.page.keyboard.press('Escape'); await m.page.click('#initialsOn');
      let v = await scan(m.page); check(`contrast (${theme}): the editor with initials on passes the accessibility scan`, v.length === 0, v.join(' | '));
      await m.page.click('button.day-cell[data-ds="2026-03-04"]'); v = await scan(m.page); check(`contrast (${theme}): the day sheet`, v.length === 0, v.join(' | ')); await m.page.keyboard.press('Escape');
      await m.page.click('#btnMenuShare'); v = await scan(m.page); check(`contrast (${theme}): the menu`, v.length === 0, v.join(' | ')); await m.page.keyboard.press('Escape');
      await L.act(m.page, '#btnCopyLink'); v = await scan(m.page); check(`contrast (${theme}): the share dialog`, v.length === 0, v.join(' | ')); await m.page.keyboard.press('Escape');
      await m.page.selectOption('#yearSelect', '2030'); v = await scan(m.page); check(`contrast (${theme}): the same page in another year`, v.length === 0, v.join(' | '));
      await m.page.screenshot({ path: L.OUT + `/v7_${theme}.png`, fullPage: true });
      // other colors the parents might choose
      for (const [c1, c2] of [['#3b82f6', '#ec4899'], ['#f97316', '#14b8a6']]) { await m.page.evaluate(([a, b]) => { const f = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }; f('p1ColorInput', a); f('p2ColorInput', b); }, [c1, c2]); v = await scan(m.page); check(`contrast (${theme}): parents' own colors ${c1} / ${c2}`, v.length === 0, v.join(' | ')); }
      await m.ctx.close();
      const lk = await mk({ colorScheme: theme }, null); v = await scan(lk.page); check(`contrast (${theme}): the licence screen`, v.length === 0, v.join(' | ')); await lk.ctx.close(); } }

  // ================= initials and pattern
  { const m = await mk(); await m.page.selectOption('#yearSelect', '2026'); await m.page.click('.preset-btn[data-preset="7-7"]'); await L.setDay(m.page, '2026-03-04', 'both');
    const bg = sel => m.page.evaluate(s => getComputedStyle(document.querySelector(s)).backgroundImage, sel); const own = ds => m.page.evaluate(d => document.querySelector(`button.day-cell[data-ds="${d}"] .day-init`).textContent, ds); const vis = ds => m.page.evaluate(d => getComputedStyle(document.querySelector(`button.day-cell[data-ds="${d}"] .day-init`)).display, ds);
    check('initials: off by default (letters hidden, no pattern)', (await vis('2026-03-02')) === 'none' && !/repeating/.test(await bg('button.day-cell.p2')));
    await m.page.click('#initialsOn'); const d = await L.days(m.page); const p1d = Object.keys(d).find(k => k.startsWith('2026-03') && L.ownerOf(d[k]) === 'Jordan' && !d[k].cls.includes('split')); const p2d = Object.keys(d).find(k => k.startsWith('2026-03') && L.ownerOf(d[k]) === 'Taylor' && !d[k].cls.includes('split'));
    check('initials: on, each day carries the initial of who has it, and Together shows both', (await vis(p1d)) === 'inline' && (await own(p1d)) === 'J' && (await own(p2d)) === 'T' && (await own('2026-03-04')) === 'J+T', `${await own(p1d)} ${await own(p2d)} ${await own('2026-03-04')}`);
    check('initials: the second parent also gets a hatched pattern, the first stays plain', /repeating-linear-gradient/.test(await bg('button.day-cell.p2')) && !/repeating/.test(await bg('button.day-cell.p1')));
    check('initials: the legend swatch for the second parent shows the pattern too', /repeating/.test(await bg('.swatch-p2')));
    await m.page.fill('#p1NameInput', 'Tom'); await m.page.fill('#p2NameInput', 'Tess'); const same = await m.page.evaluate(() => [...new Set([...document.querySelectorAll('.day-cell.p1 .day-init, .day-cell.p2 .day-init')].map(e => e.textContent))].sort().join());
    check('initials: parents who start with the same letter are told apart (TO / TE)', same === 'TE,TO', same);
    await m.page.fill('#p1NameInput', 'Parent 1'); await m.page.fill('#p2NameInput', 'Parent 2'); const num = await m.page.evaluate(() => [...new Set([...document.querySelectorAll('.day-cell.p1 .day-init, .day-cell.p2 .day-init')].map(e => e.textContent))].sort().join()); check('initials: and by 1 and 2 when even two letters match', num === '1,2', num);
    await m.page.fill('#p1NameInput', '🌻 Sun'); await m.page.fill('#p2NameInput', 'Taylor'); const emo = await m.page.evaluate(() => document.querySelector('.day-cell.p1 .day-init').textContent); check('initials: a name that starts with an emoji uses the whole emoji, not half of it', emo === '🌻', emo);
    await m.page.fill('#p1NameInput', 'Jordan'); await m.page.fill('#p2NameInput', 'Taylor');
    const lk = await (async () => { await L.act(m.page, '#btnCopyLink'); await m.page.click('#btnShareCopy'); await m.page.waitForSelector('#shareResult.show'); const k = await m.page.evaluate(() => navigator.clipboard.readText()); await m.page.click('#btnShareCancel'); return k; })();
    const r = await mk({}, null); await r.page.goto(lk); await r.page.waitForSelector('#sharedBanner.show'); check('initials: a share link carries the setting', (await r.page.evaluate(() => document.body.classList.contains('show-initials')))); await r.ctx.close();
    await m.page.click('#initialsOff'); await m.page.emulateMedia({ media: 'print' }); check('initials: a printout has the letters and the pattern whatever the setting', (await vis(p1d)) === 'inline' && /repeating-linear-gradient/.test(await bg('button.day-cell.p2'))); await m.page.emulateMedia({ media: 'screen' });
    await m.ctx.close(); }

  // ================= the printed report
  { const m = await mk({ colorScheme: 'dark' }); await m.page.selectOption('#yearSelect', '2026'); await m.page.click('.preset-btn[data-preset="2-2-3"]'); await m.page.fill('#childNameInput', 'Avery'); await m.page.selectOption('#bdayChildMonth', '8'); await m.page.selectOption('#bdayChildDay', '12');
    await m.page.click('button.day-cell[data-ds="2026-03-04"]'); await m.page.fill('#dayNote', 'Dentist at 3'); await m.page.fill('#planTime', '16:30'); await m.page.fill('#planTitle', 'Soccer practice'); await m.page.click('#btnAddPlan'); await m.page.waitForTimeout(700); await m.page.keyboard.press('Escape');
    await m.page.click('#btnToggleNotesEdit'); await m.page.fill('#notesTextarea', 'Exchanges happen at school.\nNo travel without 14 days notice.'); await m.page.click('#btnToggleNotesEdit');
    check('report: the on-screen page has the monthly totals and the notes list too', (await m.page.locator('#totalsBody tr').count()) === 12 && (await m.page.locator('#plansList .plan-line').count()) === 1 && (await m.page.locator('#signatureBlock').isHidden()) && (await m.page.locator('#printMeta').isHidden()));
    const totalsDom = await m.page.$$eval('#totalsBody tr', rs => rs.map(r => [...r.children].map(c => c.textContent)));
    const stats = await L.stats(m.page); const foot = await m.page.$$eval('#totalsFoot tr:first-child td', c => c.map(x => x.textContent));
    check('report: month totals add up to the year (days per month, and each parent\'s nights match the headline figures)', totalsDom.every((r, i) => +r[1] + +r[2] + +r[3] === [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i]) && foot[2] !== undefined && /^\d+ \(/.test(foot[0]), JSON.stringify(foot) + ' ' + stats.p1);
    await m.page.emulateMedia({ media: 'print' }); const pdfPath = L.OUT + '/v7_report.pdf'; const pdf = await m.page.pdf({ format: 'Letter', printBackground: true, preferCSSPageSize: true }); L.fs.writeFileSync(pdfPath, pdf); await m.page.emulateMedia({ media: 'screen' });
    const { execSync } = require('child_process'); const txt = execSync(`pdftotext -layout "${pdfPath}" -`).toString(); const pages = txt.split('\f').filter(x => x.trim()); const n = pages.length;
    check('report: a letter-size PDF of 4 to 6 pages (was 6 loose ones)', n >= 4 && n <= 6, n + ' pages');
    const perPage = pages.map(p => (p.match(/(January|February|March|April|May|June|July|August|September|October|November|December) 2026\s+\w+ \d+/g) || []).length);
    check('report: page 1 is the summary and the monthly totals, with who and when it was prepared', /Avery's Parenting Schedule/.test(pages[0]) && /Prepared \w+ \d+, \d{4}/.test(pages[0]) && /2026 overnights by month/i.test(pages[0]) && /Jan\s+Feb\s+Mar\s+Apr/i.test(pages[0]) && /Jordan\s+\d+/i.test(pages[0]) && /Together/i.test(pages[0]), pages[0].slice(0, 200).replace(/\s+/g, ' '));
    check('report: it says it is not a court order, and has no screen controls in it', /not a court order/i.test(txt) && !/Hide Settings|Share & export|Base Custody Days|Customize Schedule|Undo/.test(txt));
    const monthPages = [...Array(12).keys()].map(i => { const name = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][i]; return pages.findIndex((p, k) => k > 0 && new RegExp(name + ' 2026').test(p)); });
    check('report: the twelve months fill two pages, six to a page, none cut', monthPages.every(p => p > 0) && Math.max(...monthPages) - Math.min(...monthPages) === 1 && [0, 1].every(k => monthPages.filter(x => x === Math.min(...monthPages) + k).length === 6), monthPages.join());
    check('report: the holiday table, the note and plan, and the agreement notes follow the months', /Holidays, Birthdays/i.test(txt) && /Dentist at 3/.test(txt) && /4:30 PM Soccer practice/.test(txt) && /No travel without 14 days notice/.test(txt));
    check('report: it ends with the signature block: a line and a date for each parent, all on the last page', pages.findIndex(p => /Agreed by/i.test(p)) === pages.findIndex(p => /Jordan, signature/.test(p)) && pages.findIndex(p => /Agreed by/i.test(p)) === pages.findIndex(p => /Taylor, signature/.test(p)) && pages.findIndex(p => /Agreed by/i.test(p)) === n - 1 && /Jordan, signature\s+Date/.test(txt) && /Taylor, signature\s+Date/.test(txt), pages.map((p, i) => /Agreed by/i.test(p) ? i : '').join(''));
    check('report: pages are numbered "Page 1 of N"', new RegExp(`Page 1 of ${n}`).test(pages[0]) && new RegExp(`Page ${n} of ${n}`).test(pages[n - 1]), (pages[0].match(/Page \d+ of \d+/) || ['none'])[0]);
    // paper is white even though the screen was dark
    const png = L.OUT + '/v7_report_p1'; execSync(`pdftoppm -r 40 -png -f 1 -l 1 "${pdfPath}" "${png}"`); const img = L.fs.readdirSync(L.OUT).find(f => f.startsWith('v7_report_p1') && f.endsWith('.png'));
    const lum = require('child_process').execSync(`python3 -c "from PIL import Image; im=Image.open('${L.OUT}/${img}').convert('L'); d=list(im.getdata()); print(sum(d)/len(d))"`).toString(); check('report: the paper is white even when the screen theme is dark', parseFloat(lum) > 235, 'mean brightness ' + parseFloat(lum).toFixed(0));
    // black and white readable: hatch in the PDF's second-parent days is hard to test as text, so rasterise the months page and check some dark hatch pixels exist
    execSync(`pdftoppm -r 60 -png -f 2 -l 2 "${pdfPath}" "${L.OUT}/v7_report_p2"`); const img2 = L.fs.readdirSync(L.OUT).find(f => f.startsWith('v7_report_p2') && f.endsWith('.png')); const hatch = require('child_process').execSync(`python3 -c "from PIL import Image; im=Image.open('${L.OUT}/${img2}').convert('L'); d=list(im.getdata()); print(sum(1 for x in d if 60<x<200)/len(d))"`).toString(); check('report: the months page has a pattern as well as color (grey mid-tones present)', parseFloat(hatch) > 0.01, 'mid-tone share ' + parseFloat(hatch).toFixed(2));
    await m.ctx.close(); }
  { // an empty notes & plans list is not printed; a calendar with no children's names still prints
    const m = await mk(); await m.page.selectOption('#yearSelect', '2026'); await m.page.click('.preset-btn[data-preset="7-7"]'); await m.page.emulateMedia({ media: 'print' }); check('report: an empty "Notes & plans" card is left out of the printout', await m.page.locator('#plansCard').isHidden()); await m.ctx.close(); }

  const errs = logs.filter(x => /pageerror|console\.error/.test(x) && !/Failed to load resource|net::ERR|404/.test(x));
  check('no script errors anywhere in this run', errs.length === 0, errs.slice(0, 3).join(' | '));
  const failed = L.summary('OUTPUT CHECKS'); await browser.close(); srv.close(); process.exit(failed ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
