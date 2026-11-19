// ---------------------------------------------------------------------------------------------
// Holidays that move: Jewish and Islamic dates come from the browser's own calendar data (Intl);
// Diwali and the Chinese holidays come from a short moon and sun calculation (Jean Meeus, Astronomical Algorithms).
// Everything is cached per year. If the browser lacks a calendar, that pack simply has no dates.
// ---------------------------------------------------------------------------------------------

const DAY_MS = 86400000;
const movingDateCache = {};

function isoFromUtc(date) {
  return date.getUTCFullYear() + "-" + pad2(date.getUTCMonth() + 1) + "-" + pad2(date.getUTCDate());
}

// A calendar's day is the day in the place that defines it, so each is sampled at local noon there.
const CALENDAR_ZONES = {
  "islamic-umalqura": { zone: "Asia/Riyadh", utcHour: 9 },
  hebrew: { zone: "UTC", utcHour: 12 }
};

// Every day from 1 Dec of the year before to 31 Dec of the year, named in another calendar: [{ iso, day, month }].
function otherCalendarDays(year, calendar) {
  const key = calendar + ":" + year;
  if (movingDateCache[key]) {
    return movingDateCache[key];
  }
  const out = [];
  const where = CALENDAR_ZONES[calendar] || CALENDAR_ZONES.hebrew;
  try {
    const format = new Intl.DateTimeFormat("en-u-ca-" + calendar, {
      timeZone: where.zone,
      day: "numeric",
      month: calendar === "hebrew" ? "long" : "numeric"
    });
    const end = Date.UTC(year, 11, 31, where.utcHour);
    for (let t = Date.UTC(year - 1, 11, 1, where.utcHour); t <= end; t += DAY_MS) {
      const date = new Date(t);
      const parts = format.formatToParts(date);
      const day = parts.find(p => p.type === "day");
      const month = parts.find(p => p.type === "month");
      if (day && month) {
        out.push({ iso: isoFromUtc(date), day: Number(day.value), month: month.value });
      }
    }
  } catch {}
  movingDateCache[key] = out;
  return out;
}

// The Gregorian dates on which the given day of the given month(s) of another calendar falls.
function datesWhere(year, calendar, months, day) {
  return otherCalendarDays(year, calendar)
    .filter(d => d.day === day && months.indexOf(d.month) >= 0)
    .map(d => d.iso);
}

// Time of the new moon for lunation number k (k = 0 is the new moon of 6 Jan 2000), in milliseconds since 1970 (UT).
function newMoonMs(k) {
  const T = k / 1236.85;
  const rad = Math.PI / 180;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T * T * T + 0.00000000073 * T * T * T * T;
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;
  const M = (2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T * T * T) * rad;
  const Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T * T * T - 0.000000058 * T * T * T * T) * rad;
  const F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T * T * T + 0.000000011 * T * T * T * T) * rad;
  const O = (124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T * T * T) * rad;
  jde +=
    -0.4072 * Math.sin(Mp) +
    0.17241 * E * Math.sin(M) +
    0.01608 * Math.sin(2 * Mp) +
    0.01039 * Math.sin(2 * F) +
    0.00739 * E * Math.sin(Mp - M) -
    0.00514 * E * Math.sin(Mp + M) +
    0.00208 * E * E * Math.sin(2 * M) -
    0.00111 * Math.sin(Mp - 2 * F) -
    0.00057 * Math.sin(Mp + 2 * F) +
    0.00056 * E * Math.sin(2 * Mp + M) -
    0.00042 * Math.sin(3 * Mp) +
    0.00042 * E * Math.sin(M + 2 * F) +
    0.00038 * E * Math.sin(M - 2 * F) -
    0.00024 * E * Math.sin(2 * Mp - M) -
    0.00017 * Math.sin(O) -
    0.00007 * Math.sin(Mp + 2 * M) +
    0.00004 * Math.sin(2 * Mp - 2 * F) +
    0.00004 * Math.sin(3 * M) +
    0.00003 * Math.sin(Mp + M - 2 * F) +
    0.00003 * Math.sin(2 * Mp + 2 * F) -
    0.00003 * Math.sin(Mp + M + 2 * F) +
    0.00003 * Math.sin(Mp - M + 2 * F) -
    0.00002 * Math.sin(Mp - M - 2 * F) -
    0.00002 * Math.sin(3 * Mp + M) +
    0.00002 * Math.sin(4 * Mp);
  // Julian day (dynamical time) to milliseconds since 1970, less about 69 s to get from dynamical time to UT
  return (jde - 2440587.5) * DAY_MS - 69000;
}

// Sun's tropical longitude in degrees for a moment (ms since 1970, UT). Low-precision formula (about 0.01 degree).
function sunLongitude(ms) {
  const T = (ms / DAY_MS + 2440587.5 - 2451545) / 36525;
  const rad = Math.PI / 180;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * rad;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M) + 0.000289 * Math.sin(3 * M);
  const omega = (125.04 - 1934.136 * T) * rad;
  return (((L0 + C - 0.00569 - 0.00478 * Math.sin(omega)) % 360) + 360) % 360;
}

// Diwali is the new moon at which the Sun stands in sidereal Libra (Lahiri ayanamsa); this also skips a leap month.
// Lakshmi Puja is the day of that new moon in India if it comes after about 6 pm, otherwise the day before.
// Local custom can differ by a day.
function diwaliDates(year) {
  const key = "diwali:" + year;
  if (movingDateCache[key]) {
    return movingDateCache[key];
  }
  const out = [];
  const guess = Math.round((year + 0.8 - 2000) * 12.3685);
  const found = [];
  for (let k = guess - 3; k <= guess + 3; k++) {
    const t = newMoonMs(k);
    const ist = new Date(t + 330 * 60000);
    const iso = isoFromUtc(ist);
    const ayanamsa = 23.853 + 0.013969 * (year - 2000);
    const sidereal = (((sunLongitude(t) - ayanamsa) % 360) + 360) % 360;
    if (iso >= `${year}-10-01` && iso <= `${year}-11-30` && sidereal >= 180 && sidereal < 210) {
      found.push({ iso, hour: ist.getUTCHours() + ist.getUTCMinutes() / 60 });
    }
  }
  if (found.length) {
    // two in a row means the first was a leap month
    const pick = found[found.length - 1];
    out.push(pick.hour >= 18 ? pick.iso : addDays(pick.iso, -1));
  }
  movingDateCache[key] = out;
  return out;
}

// Time (ms) at which the Sun's longitude reaches `degrees`, searching around guessMs.
function sunReaches(degrees, guessMs) {
  let lo = guessMs - 5 * DAY_MS;
  let hi = guessMs + 5 * DAY_MS;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const diff = ((sunLongitude(mid) - degrees + 540) % 360) - 180;
    if (diff < 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

// Chinese calendar days are China (UTC+8) days; day numbers count days since 1970.
function chinaDay(ms) {
  return Math.floor((ms + 8 * 3600000) / DAY_MS);
}

// New moons as China dates: the lunations that start at or after the one holding `ms`. [{ start, next }] in day numbers.
function lunationsFrom(ms, count) {
  const day = chinaDay(ms);
  const k0 = Math.floor((ms / DAY_MS + 2440587.5 - 2451550.1) / 29.530588861) - 2;
  const list = [];
  for (let k = k0; k < k0 + count + 6; k++) {
    list.push({ start: chinaDay(newMoonMs(k)), next: chinaDay(newMoonMs(k + 1)) });
  }
  const first = list.findIndex(l => l.start <= day && day < l.next);
  return first < 0 ? [] : list.slice(first, first + count);
}

// A lunation "has a zhongqi" when the Sun crosses a multiple of 30 degrees during it (counted in China days).
function lunationHasZhongqi(lunation) {
  const at = d => Math.floor(sunLongitude(d * DAY_MS - 8 * 3600000) / 30);
  return at(lunation.next) !== at(lunation.start);
}

function chinaDateText(dayNumber) {
  return isoFromUtc(new Date(dayNumber * DAY_MS));
}

// Chinese New Year is the start of month 1. Month 11 holds the winter solstice; months are then counted on,
// and the first month with no solar term in it is a leap month that takes no number. (So 2034 starts on 19 Feb
// although a month holding the Sun at 330 degrees begins on 20 Jan.) The browser's own Chinese calendar is a day
// out in some years (2027, where the new moon falls 4 minutes before midnight), so it is not used.
function lunarNewYearDates(year) {
  const lunations = lunationsFrom(sunReaches(270, Date.UTC(year - 1, 11, 21)), 6);
  let month = 11;
  let leapSeen = false;
  for (let i = 1; i < lunations.length; i++) {
    if (!leapSeen && !lunationHasZhongqi(lunations[i])) {
      leapSeen = true;
      continue;
    }
    month = (month % 12) + 1;
    if (month === 1) {
      return [chinaDateText(lunations[i].start)];
    }
  }
  return [];
}

// Mid-Autumn is the 15th day of month 8, the month that holds the autumn equinox (a month holding a solar term is never a leap month).
function midAutumnDates(year) {
  const lunation = lunationsFrom(sunReaches(180, Date.UTC(year, 8, 23)), 1)[0];
  return lunation ? [chinaDateText(lunation.start + 14)] : [];
}

// The holidays offered in each pack. find(year) lists the dates the holiday starts on (about the year).
const PACK_DEFS = {
  jewish: {
    label: "Jewish holidays",
    items: [
      { id: "roshHashanah", label: "Rosh Hashanah (2 days)", short: "Rosh Hashanah", icon: "🍎", len: 2, find: y => datesWhere(y, "hebrew", ["Tishri"], 1) },
      { id: "yomKippur", label: "Yom Kippur", short: "Yom Kippur", icon: "🕯️", len: 1, find: y => datesWhere(y, "hebrew", ["Tishri"], 10) },
      { id: "sukkot", label: "Sukkot (first day)", short: "Sukkot", icon: "🌿", len: 1, find: y => datesWhere(y, "hebrew", ["Tishri"], 15) },
      { id: "hanukkah", label: "Hanukkah (8 days)", short: "Hanukkah", icon: "🕎", len: 8, find: y => datesWhere(y, "hebrew", ["Kislev"], 25) },
      { id: "purim", label: "Purim", short: "Purim", icon: "🎭", len: 1, find: y => datesWhere(y, "hebrew", ["Adar", "Adar II"], 14) },
      { id: "passover", label: "Passover (8 days)", short: "Passover", icon: "🍷", len: 8, find: y => datesWhere(y, "hebrew", ["Nisan"], 15) }
    ]
  },
  islamic: {
    label: "Islamic holidays",
    items: [
      { id: "ramadan", label: "Ramadan begins", short: "Ramadan", icon: "🌙", len: 1, find: y => datesWhere(y, "islamic-umalqura", ["9"], 1) },
      { id: "eidFitr", label: "Eid al-Fitr (3 days)", short: "Eid al-Fitr", icon: "🌙", len: 3, find: y => datesWhere(y, "islamic-umalqura", ["10"], 1) },
      { id: "eidAdha", label: "Eid al-Adha (3 days)", short: "Eid al-Adha", icon: "🐑", len: 3, find: y => datesWhere(y, "islamic-umalqura", ["12"], 10) },
      { id: "hijriNewYear", label: "Islamic New Year", short: "Islamic New Year", icon: "🌙", len: 1, find: y => datesWhere(y, "islamic-umalqura", ["1"], 1) }
    ]
  },
  hindu: {
    label: "Diwali",
    items: [{ id: "diwali", label: "Diwali", short: "Diwali", icon: "🪔", len: 1, find: y => diwaliDates(y) }]
  },
  chinese: {
    label: "Chinese holidays",
    items: [
      { id: "lunarNewYear", label: "Lunar New Year", short: "Lunar New Year", icon: "🧧", len: 1, find: y => lunarNewYearDates(y) },
      { id: "midAutumn", label: "Mid-Autumn Festival", short: "Mid-Autumn", icon: "🥮", len: 1, find: y => midAutumnDates(y) }
    ]
  }
};
const PACK_NAMES = ["jewish", "islamic", "hindu", "chinese"];

// Starts of one pack holiday that touch this year (a late-December start can run into January; some recur twice a year).
function packInstances(item, year) {
  const len = item.len || 1;
  return item
    .find(year)
    .filter(iso => iso <= `${year}-12-31` && addDays(iso, len - 1) >= `${year}-01-01`)
    .sort();
}
