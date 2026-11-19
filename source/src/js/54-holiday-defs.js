// ---------------------------------------------------------------------------------------------
// Every built-in holiday, as data. buildHolidays() (56-holidays.js) walks this list in order; when two
// holidays fall on the same night the one with the higher priority wins, and a later one wins a tie.
//
//   key        stable id used in saved calendars and share links, never rename one
//   regions    which holiday calendars include it (null = all)
//   date(y)    first night, "YYYY-MM-DD"
//   len        number of nights (default 1)
//   rotate     { group: "A"|"B", offset } alternates by year; offset -1 follows the previous year's turn.
//              group may be a function. Without rotate: owner is "both" or "mothers"/"fathers" (appreciation days)
//   monday     a Monday holiday that can grow into a long weekend (Sat-Mon)
//   fixed / alwaysApplies / offByDefault as in the holiday table
// ---------------------------------------------------------------------------------------------

function mondayOnOrBefore(year, month0, day) {
  const d = noonDate(year, month0, day);
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() - 1);
  }
  return dateStr(d.getFullYear(), d.getMonth(), d.getDate());
}

const ALL = null;
const HOLIDAY_DEFS = [
  { key: "newyears", regions: ALL, label: "New Year's Day", short: "New Year's Day", icon: "🎆", kind: "holiday", date: y => dateStr(y, 0, 1), rotate: { group: "B", offset: -1 } },
  {
    key: "prevWB2",
    regions: ALL,
    label: () => (state.winterEndDay > 1 ? `Winter Break (Jan 1–${state.winterEndDay})` : "Winter Break (Jan 1)"),
    short: () => (state.winterEndDay > 1 ? `Jan 1–${state.winterEndDay} Break` : "Jan 1 Break"),
    icon: "❄️",
    kind: "break",
    date: y => dateStr(y, 0, 1),
    len: () => state.winterEndDay,
    rotate: { group: "B", offset: -1 }
  },
  { key: "australiaDay", regions: ["au"], label: "Australia Day", short: "Australia Day", icon: "🇦🇺", kind: "holiday", date: y => dateStr(y, 0, 26), rotate: { group: "B", offset: 0 } },
  { key: "mlk", regions: ["us"], label: "MLK Jr. Day", short: "MLK Day", icon: "★", kind: "holiday", date: y => nthWeekday(y, 0, 1, 3), rotate: { group: "A", offset: 0 }, monday: true },
  { key: "familyDay", regions: ["ca"], label: "Family Day", short: "Family Day", icon: "👪", kind: "holiday", date: y => nthWeekday(y, 1, 1, 3), rotate: { group: "A", offset: 0 }, monday: true },
  { key: "pres", regions: ["us"], label: "Presidents' Day", short: "Presidents' Day", icon: "★", kind: "holiday", date: y => nthWeekday(y, 1, 1, 3), rotate: { group: "B", offset: 0 }, monday: true },
  {
    key: "springBreak",
    regions: ALL,
    label: "Spring Break (1 Week)",
    short: "Spring Break",
    icon: "🌷",
    kind: "break",
    date: y => schoolDatesFor(y).springBreakStart,
    len: 7,
    rotate: { group: "A", offset: 0 }
  },
  { key: "goodFriday", regions: ["ca", "uk", "au"], label: "Good Friday", short: "Good Friday", icon: "✝️", kind: "holiday", date: y => addDays(easterDate(y), -2), rotate: { group: "B", offset: 0 } },
  { key: "easter", regions: ALL, label: "Easter Sunday", short: "Easter", icon: "🐣", kind: "holiday", date: y => easterDate(y), rotate: { group: "B", offset: 0 } },
  { key: "easterMonday", regions: ["uk", "au"], label: "Easter Monday", short: "Easter Monday", icon: "🐣", kind: "holiday", date: y => addDays(easterDate(y), 1), rotate: { group: "B", offset: 0 } },
  { key: "anzac", regions: ["au"], label: "Anzac Day", short: "Anzac Day", icon: "🌺", kind: "holiday", date: y => dateStr(y, 3, 25), rotate: { group: "A", offset: 0 } },
  {
    key: "mothersDay",
    regions: ALL,
    label: () => (state.region === "uk" ? "Mothering Sunday" : "Mother's Day"),
    short: () => (state.region === "uk" ? "Mothering Sunday" : "Mother's Day"),
    icon: "💐",
    kind: "holiday",
    date: y => (state.region === "uk" ? addDays(easterDate(y), -21) : nthWeekday(y, 4, 0, 2)),
    owner: "mothers",
    alwaysApplies: true
  },
  { key: "earlyMay", regions: ["uk"], label: "Early May Bank Holiday", short: "Early May", icon: "🌼", kind: "holiday", date: y => nthWeekday(y, 4, 1, 1), rotate: { group: "A", offset: 0 }, monday: true },
  { key: "memorial", regions: ["us"], label: "Memorial Day", short: "Memorial Day", icon: "★", kind: "holiday", date: y => nthWeekday(y, 4, 1, -1), rotate: { group: "A", offset: 0 }, monday: true },
  { key: "victoriaDay", regions: ["ca"], label: "Victoria Day", short: "Victoria Day", icon: "👑", kind: "holiday", date: y => mondayOnOrBefore(y, 4, 24), rotate: { group: "A", offset: 0 }, monday: true },
  { key: "springBank", regions: ["uk"], label: "Spring Bank Holiday", short: "Spring Bank", icon: "🌷", kind: "holiday", date: y => nthWeekday(y, 4, 1, -1), rotate: { group: "B", offset: 0 }, monday: true },
  {
    key: "fathersDay",
    regions: ALL,
    label: "Father's Day",
    short: "Father's Day",
    icon: "👔",
    kind: "holiday",
    date: y => (state.region === "au" ? nthWeekday(y, 8, 0, 1) : nthWeekday(y, 5, 0, 3)),
    owner: "fathers",
    alwaysApplies: true
  },
  { key: "juneteenth", regions: ["us"], label: "Juneteenth", short: "Juneteenth", icon: "✊", kind: "holiday", date: y => dateStr(y, 5, 19), rotate: { group: "A", offset: 0 } },
  { key: "kingsBirthday", regions: ["au"], label: "King's Birthday (most states)", short: "King's Birthday", icon: "👑", kind: "holiday", date: y => nthWeekday(y, 5, 1, 2), rotate: { group: "B", offset: 0 }, monday: true },
  { key: "canadaDay", regions: ["ca"], label: "Canada Day", short: "Canada Day", icon: "🍁", kind: "holiday", date: y => dateStr(y, 6, 1), rotate: { group: "B", offset: 0 } },
  { key: "july4", regions: ["us"], label: "Independence Day (Jul 4)", short: "July 4th", icon: "🎆", kind: "holiday", date: y => dateStr(y, 6, 4), rotate: { group: "B", offset: 0 } },
  { key: "parentsDay", regions: ["us"], label: "National Parents' Day", short: "Parents' Day", icon: "💛", kind: "holiday", date: y => nthWeekday(y, 6, 0, 4), owner: "both", alwaysApplies: true, rule: "Inclusive Day" },
  { key: "civicHoliday", regions: ["ca"], label: "Civic Holiday (most provinces)", short: "Civic Holiday", icon: "☀️", kind: "holiday", date: y => nthWeekday(y, 7, 1, 1), rotate: { group: "A", offset: 0 }, monday: true },
  { key: "summerBank", regions: ["uk"], label: "Summer Bank Holiday", short: "Summer Bank", icon: "☀️", kind: "holiday", date: y => nthWeekday(y, 7, 1, -1), rotate: { group: "A", offset: 0 }, monday: true },
  { key: "labor", regions: ["us"], label: "Labor Day", short: "Labor Day", icon: "★", kind: "holiday", date: y => nthWeekday(y, 8, 1, 1), rotate: { group: "A", offset: 0 }, monday: true },
  { key: "labourCa", regions: ["ca"], label: "Labour Day", short: "Labour Day", icon: "★", kind: "holiday", date: y => nthWeekday(y, 8, 1, 1), rotate: { group: "B", offset: 0 }, monday: true },
  { key: "truthReconciliation", regions: ["ca"], label: "Truth and Reconciliation Day", short: "Truth & Reconciliation", icon: "🧡", kind: "holiday", date: y => dateStr(y, 8, 30), rotate: { group: "A", offset: 0 }, offByDefault: true },
  { key: "thanksgivingCa", regions: ["ca"], label: "Thanksgiving (Monday)", short: "Thanksgiving", icon: "🦃", kind: "holiday", date: y => nthWeekday(y, 9, 1, 2), rotate: { group: "B", offset: 0 }, monday: true },
  { key: "indigenousDay", regions: ["us"], label: "Indigenous Peoples' Day", short: "Indigenous Day", icon: "🌎", kind: "holiday", date: y => nthWeekday(y, 9, 1, 2), rotate: { group: "B", offset: 0 }, monday: true },
  { key: "halloween", regions: ["us", "ca", "uk"], label: "Halloween", short: "Halloween", icon: "🎃", kind: "holiday", date: y => dateStr(y, 9, 31), rotate: { group: "B", offset: 0 } },
  { key: "bonfire", regions: ["uk"], label: "Bonfire Night", short: "Bonfire Night", icon: "🎆", kind: "holiday", date: y => dateStr(y, 10, 5), rotate: { group: "B", offset: 0 } },
  { key: "vets", regions: ["us"], label: "Veterans Day", short: "Veterans Day", icon: "★", kind: "holiday", date: y => dateStr(y, 10, 11), rotate: { group: "A", offset: 0 } },
  { key: "remembrance", regions: ["ca"], label: "Remembrance Day", short: "Remembrance Day", icon: "🌺", kind: "holiday", date: y => dateStr(y, 10, 11), rotate: { group: "A", offset: 0 } },
  {
    key: "thanksgiving",
    regions: ["us"],
    label: "Thanksgiving Break (Wed–Sun)",
    short: "Thanksgiving",
    icon: "🦃",
    kind: "break",
    date: y => addDays(nthWeekday(y, 10, 4, 4), -1),
    len: 5,
    rotate: { group: "B", offset: 0 }
  },
  { key: "xmasEve", regions: ALL, label: "Christmas Eve", short: "Christmas Eve", icon: "🎄", kind: "holiday", date: y => dateStr(y, 11, 24), rotate: { group: "A", offset: 0 } },
  {
    key: "christmas",
    regions: ALL,
    label: "Christmas Day",
    short: "Christmas",
    icon: "🎄",
    kind: "holiday",
    date: y => dateStr(y, 11, 25),
    // with "split Christmas" the Eve and the Day go to different parents
    rotate: { group: () => (state.splitChristmas ? "B" : "A"), offset: 0 }
  },
  { key: "boxingDay", regions: ["ca", "uk", "au"], label: "Boxing Day", short: "Boxing Day", icon: "🎁", kind: "holiday", date: y => dateStr(y, 11, 26), rotate: { group: "A", offset: 0 } },
  {
    key: "wb1",
    regions: ALL,
    label: "Winter Break (1st Half)",
    short: "Winter Brk 1",
    icon: "🎄",
    kind: "break",
    date: y => dateStr(y, 11, state.winterStartDay),
    len: () => Math.min(7, 32 - state.winterStartDay),
    rotate: { group: "A", offset: 0 }
  },
  {
    key: "wb2",
    regions: ALL,
    label: "Winter Break (2nd Half)",
    short: "Winter Brk 2",
    icon: "❄️",
    kind: "break",
    date: y => (state.winterStartDay + 7 <= 31 ? dateStr(y, 11, state.winterStartDay + 7) : null),
    len: () => 25 - state.winterStartDay,
    rotate: { group: "B", offset: 0 }
  },
  { key: "nye", regions: ALL, label: "New Year's Eve", short: "New Year's Eve", icon: "🎇", kind: "holiday", date: y => dateStr(y, 11, 31), rotate: { group: "B", offset: 0 } }
];

const REGIONS = [
  { id: "us", label: "United States" },
  { id: "ca", label: "Canada" },
  { id: "uk", label: "United Kingdom" },
  { id: "au", label: "Australia" }
];

function defByKey(key) {
  return HOLIDAY_DEFS.find(d => d.key === key) || null;
}
