// ---------------------------------------------------------------------------------------------
// The schedule engine: who has each night.
// Order of precedence for one day: a day you tapped > a holiday or break > a school-calendar entry > summer > the base pattern.
// ---------------------------------------------------------------------------------------------

// ---- base pattern ----------------------------------------------------------------------------

// Which of the 14 slots (week 1 Sun..Sat, week 2 Sun..Sat) a real date falls in.
function kbBiweekIndex(dateObj) {
  const ws = state.weekStartsMonday ? 1 : 0;
  const anchor = parseDateStr(state.biweeklyAnchor || `${dateObj.getFullYear()}-01-04`);
  anchor.setDate(anchor.getDate() - ((anchor.getDay() - ws + 7) % 7));
  const diff = Math.round((dateObj - anchor) / 86400000);
  const week = Math.floor((((diff % 14) + 14) % 14) / 7);
  return week * 7 + dateObj.getDay();
}

// "Week starts on" is a display choice: re-file the two-week pattern so every real date keeps its parent.
function kbSetWeekStart(monday) {
  monday = !!monday;
  if (!!state.weekStartsMonday === monday) {
    return;
  }
  const ref = parseDateStr(state.biweeklyAnchor || "2026-01-04");
  const dayAt = i => {
    const dt = new Date(ref.getTime());
    dt.setDate(dt.getDate() + i);
    return dt;
  };
  const owners = [];
  for (let i = 0; i < 14; i++) {
    owners.push(!!state.baseBiweekly[kbBiweekIndex(dayAt(i))]);
  }
  state.weekStartsMonday = monday;
  const next = new Array(14).fill(false);
  for (let i = 0; i < 14; i++) {
    next[kbBiweekIndex(dayAt(i))] = owners[i];
  }
  state.baseBiweekly = next;
}

// Position in a repeating cycle of any length (2 to 28 days) counted from the cycle's start date.
function cycleIndex(dateObj) {
  const length = state.cycleLength;
  const anchor = parseDateStr(state.cycleAnchor || "2026-01-04");
  const diff = Math.round((dateObj - anchor) / 86400000);
  return ((diff % length) + length) % length;
}

function baseOwner(year, month0, day) {
  if (state.scheduleUnset) {
    return "none";
  }
  const date = noonDate(year, month0, day);
  const dow = date.getDay();
  if (state.baseMode === "weekly") {
    return state.baseWeekly[dow] ? "p1" : "p2";
  }
  if (state.baseMode === "biweekly") {
    return state.baseBiweekly[kbBiweekIndex(date)] ? "p1" : "p2";
  }
  if (state.baseMode === "cycle") {
    return state.baseCycle[cycleIndex(date)] ? "p1" : "p2";
  }
  return state.baseMonthly[(Math.ceil(day / 7) - 1) * 7 + dow] ? "p1" : "p2";
}

// ---- summer ----------------------------------------------------------------------------------

const MONTH_ABBR_LOWER = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// "06-01" -> [5, 1]  (month counted from 0, day)
function monthDayParts(text) {
  const parts = String(text).split("-").map(Number);
  return [parts[0] - 1, parts[1]];
}

function isMonthDayText(text) {
  if (typeof text !== "string" || !/^\d{2}-\d{2}$/.test(text)) {
    return false;
  }
  const [m, d] = monthDayParts(text);
  return m >= 0 && m <= 11 && d >= 1 && d <= [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
}

function inSummerWindow(month0, day) {
  const [sm, sd] = monthDayParts(state.summerStart);
  const [em, ed] = monthDayParts(state.summerEnd);
  const key = month0 * 100 + day;
  return key >= sm * 100 + sd && key <= em * 100 + ed;
}

// The week buttons for the summer window: 1st-7th, 8th-14th, 15th-21st, 22nd-28th and 29th to month end,
// cut off at the window's edges. With the default window these are the original twelve (jun1 ... aug2).
let summerChipCache = { key: "", chips: [] };
function summerChips() {
  const key = state.summerStart + ">" + state.summerEnd;
  if (summerChipCache.key === key) {
    return summerChipCache.chips;
  }
  const [sm, sd] = monthDayParts(state.summerStart);
  const [em, ed] = monthDayParts(state.summerEnd);
  const chips = [];
  for (let m = sm; m <= em; m++) {
    const last = daysInMonth(2025, m);
    for (let i = 0; i < 5; i++) {
      let start = i * 7 + 1;
      let end = Math.min(i * 7 + 7, last);
      if (start > last) {
        break;
      }
      if (m === sm) {
        start = Math.max(start, sd);
      }
      if (m === em) {
        end = Math.min(end, ed);
      }
      if (start > end) {
        continue;
      }
      chips.push({
        id: MONTH_ABBR_LOWER[m] + (i + 1),
        month: m,
        start,
        end,
        label: `${MONTH_SHORT[m]} ${start}${end > start ? "–" + end : ""}`
      });
    }
  }
  summerChipCache = { key, chips };
  return chips;
}

// true / false: is this summer day in a week that Parent 1 picked. null: not a summer day.
function summerWeekSelected(month0, day) {
  if (!inSummerWindow(month0, day)) {
    return null;
  }
  const chip = summerChips().find(c => c.month === month0 && day >= c.start && day <= c.end);
  return chip ? !!state.summerSelected[chip.id] : false;
}

function summerRangeText() {
  const [sm, sd] = monthDayParts(state.summerStart);
  const [em, ed] = monthDayParts(state.summerEnd);
  return `${MONTH_SHORT[sm]} ${sd} – ${MONTH_SHORT[em]} ${ed}`;
}

// ---- school calendar entries -----------------------------------------------------------------

function schoolEventMap(year) {
  const map = {};
  (state.schoolCustomEvents || []).forEach(ev => {
    if (!ev.startDate) {
      return;
    }
    const last = ev.endDate && ev.endDate >= ev.startDate ? ev.endDate : ev.startDate;
    let day = ev.startDate;
    for (let i = 0; i < 60 && day <= last; i++) {
      if (day.startsWith(`${year}-`)) {
        map[day] = ev;
      }
      day = addDays(day, 1);
    }
  });
  return map;
}

// ---- one day and a whole year ----------------------------------------------------------------

function resolveDay(year, month0, day, holidayMap, schoolMap) {
  const ds = dateStr(year, month0, day);
  if (state.overrides[ds]) {
    return { owner: state.overrides[ds], source: "override" };
  }
  if (holidayMap[ds]) {
    return { owner: holidayMap[ds].owner, source: "special", special: holidayMap[ds] };
  }
  const school = schoolMap[ds];
  if (school && (school.kind === "p1" || school.kind === "p2")) {
    return { owner: school.kind, source: "schoolEv", schoolEv: school };
  }
  if (state.summerEnabled && inSummerWindow(month0, day)) {
    if (summerWeekSelected(month0, day)) {
      return { owner: "p1", source: "summerP1" };
    }
    if (state.summerRestP2 && !state.scheduleUnset) {
      return { owner: "p2", source: "summerP2" };
    }
  }
  return { owner: baseOwner(year, month0, day), source: "base" };
}

// Work is cached until the calendar changes, because one screen asks for the same year several times.
const yearMemo = { json: "", holidays: {}, years: {} };
function yearMemoFor() {
  const json = JSON.stringify(state);
  if (yearMemo.json !== json) {
    yearMemo.json = json;
    yearMemo.holidays = {};
    yearMemo.years = {};
  }
  return yearMemo;
}

function buildYear(year) {
  const memo = yearMemoFor();
  if (memo.years[year]) {
    return memo.years[year];
  }
  const { map: holidayMap, summaryRows } = buildHolidays(year);
  const schoolMap = schoolEventMap(year);
  const { schoolEnd, schoolStart } = schoolDatesFor(year);
  const p1 = p1Name();
  const p2 = p2Name();
  const summerEmoji = (state.summerEmoji || "🌻").trim() || "🌻";
  const days = [];
  // the night before Jan 1 decides whether Jan 1 is a hand-off
  let previousOwner = resolveDay(year - 1, 11, 31, buildHolidays(year - 1).map, schoolEventMap(year - 1)).owner;
  for (let m = 0; m < 12; m++) {
    for (let d = 1; d <= daysInMonth(year, m); d++) {
      const ds = dateStr(year, m, d);
      const dow = noonDate(year, m, d).getDay();
      const resolved = resolveDay(year, m, d, holidayMap, schoolMap);
      const owner = resolved.owner;
      const schoolEntry = schoolMap[ds];
      const inSummer = inSummerWindow(m, d);
      const outOfSchool = ds > schoolEnd && ds < schoolStart;
      let reason = owner === "none" ? "Not assigned yet" : `Base (${ownerLabel(owner)})`;
      let icon = "";
      let isHoliday = false;
      let isOverride = false;
      let splitType = "";
      if (resolved.source === "override") {
        reason = "Custom Override";
        isOverride = true;
      } else if (resolved.source === "special") {
        reason = resolved.special.label;
        icon = resolved.special.icon;
        isHoliday = true;
      } else if (resolved.source === "schoolEv") {
        reason = resolved.schoolEv.title || "No School";
        icon = "🏫";
      } else if (resolved.source === "summerP1") {
        reason = `${p1} Summer Week`;
        icon = summerEmoji;
      } else if (resolved.source === "summerP2") {
        reason = `${p2} Summer Time`;
        icon = summerEmoji;
      }
      if (
        state.showSplitDays &&
        !isHoliday &&
        !isOverride &&
        owner !== "both" &&
        previousOwner !== "both" &&
        owner !== "none" &&
        previousOwner !== "none" &&
        owner !== previousOwner
      ) {
        splitType = owner === "p1" ? "p2-to-p1" : "p1-to-p2";
        reason = `${ownerLabel(previousOwner)} → ${ownerLabel(owner)}`;
      }
      previousOwner = owner;
      let schoolStatus = "weekend";
      let customSchoolLabel = "";
      if (schoolEntry) {
        customSchoolLabel = schoolEntry.title || (schoolEntry.kind === "halfday" ? "Half-Day" : "No School");
        schoolStatus = schoolEntry.kind === "halfday" ? "school" : "break";
        if (!icon && schoolEntry.kind === "halfday") {
          icon = "⏰";
        }
      } else if (resolved.special && resolved.special.kind === "break") {
        schoolStatus = "break";
      } else if (outOfSchool || (state.summerEnabled && inSummer)) {
        schoolStatus = "summer";
      } else if (resolved.special && resolved.special.kind === "holiday") {
        schoolStatus = "holiday";
      } else if (dow >= 1 && dow <= 5) {
        schoolStatus = "school";
      }
      days.push({
        ds,
        y: year,
        m0: m,
        d,
        dow,
        owner,
        reason,
        icon,
        isHoliday,
        isOverride,
        splitType,
        schoolStatus,
        customSchoolLabel
      });
    }
  }
  const built = { days, summaryRows };
  memo.years[year] = built;
  return built;
}

function yearTotals(year) {
  const { days } = buildYear(year);
  let p1 = 0;
  let p2 = 0;
  let both = 0;
  days.forEach(day => {
    if (day.owner === "p1") {
      p1++;
    } else if (day.owner === "p2") {
      p2++;
    } else if (day.owner !== "none") {
      both++;
      p1 += 0.5;
      p2 += 0.5;
    }
  });
  return { p1, p2, both, total: days.length };
}
