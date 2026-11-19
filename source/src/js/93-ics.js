// ---------------------------------------------------------------------------------------------
// Export to a phone or computer calendar (.ics): overnights as all-day blocks, exchanges (with an optional
// reminder), plans, for one to three years, in any time zone. The file is a snapshot; it does not update itself.
// ---------------------------------------------------------------------------------------------

// Offset of a time zone from UTC in minutes at a moment, or null if the browser cannot say.
function zoneOffsetMinutes(zone, ms) {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset", hour: "numeric" })
      .formatToParts(ms)
      .find(p => p.type === "timeZoneName");
    if (!part) {
      return null;
    }
    if (part.value === "GMT" || part.value === "UTC") {
      return 0;
    }
    const m = /GMT([+\-−])(\d{1,2})(?::(\d{2}))?/.exec(part.value);
    return m ? (m[1] === "+" ? 1 : -1) * (Number(m[2]) * 60 + Number(m[3] || 0)) : null;
  } catch {
    return null;
  }
}

function icsOffsetText(minutes) {
  const abs = Math.abs(minutes);
  return (minutes < 0 ? "-" : "+") + pad2(Math.floor(abs / 60)) + pad2(abs % 60);
}

function icsLocalText(ms) {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}00`;
}

// A VTIMEZONE for any zone, listing every change of offset between the two years (found by looking, so it is
// right for every country and every rule change). Returns the lines, or null if the browser cannot tell offsets.
function vtimezoneFor(zone, firstYear, lastYear) {
  const start = Date.UTC(firstYear, 0, 1) - DAY_MS;
  const end = Date.UTC(lastYear, 11, 31) + 2 * DAY_MS;
  let offset = zoneOffsetMinutes(zone, start);
  if (offset == null) {
    return null;
  }
  const lines = [
    "BEGIN:VTIMEZONE",
    `TZID:${zone}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    `TZOFFSETFROM:${icsOffsetText(offset)}`,
    `TZOFFSETTO:${icsOffsetText(offset)}`,
    `TZNAME:${zone}`,
    "END:STANDARD"
  ];
  for (let t = start + DAY_MS; t <= end; t += DAY_MS) {
    const next = zoneOffsetMinutes(zone, t);
    if (next == null || next === offset) {
      continue;
    }
    // the change happened somewhere in the last 24 hours: find the minute
    let lo = t - DAY_MS;
    let hi = t;
    while (hi - lo > 60000) {
      const mid = Math.floor((lo + hi) / 2 / 60000) * 60000;
      if (zoneOffsetMinutes(zone, mid) === offset) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    lines.push(
      next > offset ? "BEGIN:DAYLIGHT" : "BEGIN:STANDARD",
      `DTSTART:${icsLocalText(hi + offset * 60000)}`,
      `TZOFFSETFROM:${icsOffsetText(offset)}`,
      `TZOFFSETTO:${icsOffsetText(next)}`,
      `TZNAME:${zone}`,
      next > offset ? "END:DAYLIGHT" : "END:STANDARD"
    );
    offset = next;
  }
  lines.push("END:VTIMEZONE");
  return lines;
}

function icsAlarm(kind, allDay, text) {
  if (!kind || kind === "none") {
    return [];
  }
  // an all-day marker has no clock time, so it reminds at 9 AM (the same morning, or the one before)
  const trigger = allDay ? (kind === "1d" ? "-PT15H" : "PT9H") : { "30m": "-PT30M", "1h": "-PT1H", "1d": "-P1D" }[kind];
  return ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEscape(text)}`, `TRIGGER:${trigger}`, "END:VALARM"];
}

// options: { years: [2026, 2027], zone, alarm: "none"|"30m"|"1h"|"1d", plans: true }
function buildIcs(options) {
  const years = options.years;
  const days = years.flatMap(y => buildYear(y).days);
  const first = years[0];
  const last = years[years.length - 1];
  const zone = options.zone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const tz = vtimezoneFor(zone, first, last);
  const child = childName();
  const calName = (child ? `${child} ` : "") + "Parenting Calendar " + (first === last ? first : `${first}–${last}`);
  const stamp = icsUtcStamp(new Date());
  const idBase = state.fileId || "spc";
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Kingdom Building//Parenting Calendar//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:" + icsEscape(calName)];
  if (tz) {
    lines.push("X-WR-TIMEZONE:" + zone, ...tz);
  } else {
    lines.push("X-WR-TIMEZONE:floating");
  }
  const dtstart = tz ? `DTSTART;TZID=${zone}` : "DTSTART";
  const dtend = tz ? `DTEND;TZID=${zone}` : "DTEND";

  function event(fields, alarmLines) {
    lines.push("BEGIN:VEVENT");
    Object.keys(fields).forEach(key => {
      if (fields[key] != null && fields[key] !== "") {
        lines.push(key + ":" + fields[key]);
      }
    });
    (alarmLines || []).forEach(l => lines.push(l));
    lines.push("END:VEVENT");
  }

  // overnights: one all-day block for each run of the same parent
  let i = 0;
  while (i < days.length) {
    const owner = days[i].owner;
    const startDay = days[i];
    let j = i + 1;
    while (j < days.length && days[j].owner === owner) {
      j++;
    }
    if (owner !== "none") {
      const lastDay = days[j - 1];
      const after = addDaysParts(lastDay.y, lastDay.m0, lastDay.d, 1);
      const run = days.slice(i, j);
      const holidays = run.filter(d => d.isHoliday).map(d => d.reason);
      const notes = options.plans ? run.filter(d => state.dayNotes[d.ds]).slice(0, 6).map(d => `Note, ${shortDate(d.ds)}: ${state.dayNotes[d.ds]}`) : [];
      const description = [`Overnight: ${ownerLabel(owner)}`];
      if (holidays.length) {
        description.push("Events: " + holidays.join("; "));
      }
      if (state.exchangeLocation) {
        description.push("Exchange location: " + state.exchangeLocation);
      }
      event({
        UID: icsEscape(`block-${idBase}-${startDay.ds}@parenting-calendar`),
        DTSTAMP: stamp,
        "DTSTART;VALUE=DATE": icsDate(startDay.y, startDay.m0, startDay.d),
        "DTEND;VALUE=DATE": icsDate(after.y, after.m0, after.d),
        SUMMARY: icsEscape(owner === "both" ? `Together${holidays.length ? " — " + holidays[0] : ""}` : `Overnight with ${ownerLabel(owner)}${holidays.length ? " — " + holidays[0] : ""}`),
        DESCRIPTION: icsEscape(description.concat(notes).join("\n")),
        TRANSP: "TRANSPARENT"
      });
    }
    i = j;
  }

  // exchanges: the day a night changes hands
  const toP1 = parseExchangeTime(state.timeToP1, 15, 0);
  const toP2 = parseExchangeTime(state.timeToP2, 18, 0);
  const holidayTime = parseExchangeTime(state.timeHoliday, 18, 0);
  days.forEach((day, k) => {
    const before = k === 0 ? null : days[k - 1];
    const handOver = before && before.owner !== day.owner && day.owner !== "both" && day.owner !== "none" && before.owner !== "none";
    if ((!handOver && !day.splitType) || day.owner === "none") {
      return;
    }
    const time = day.isHoliday || day.schoolStatus === "summer" ? holidayTime : day.owner === "p1" ? toP1 : toP2;
    const to = `to ${ownerLabel(day.owner)}`;
    const base = {
      UID: icsEscape(`exch-${idBase}-${day.ds}@parenting-calendar`),
      DTSTAMP: stamp,
      SUMMARY: icsEscape(`Exchange ${to}`),
      LOCATION: icsEscape(state.exchangeLocation || "")
    };
    if (!String(time.label || "").trim()) {
      // no time entered: mark the day instead of inventing a clock time
      const next = addDaysParts(day.y, day.m0, day.d, 1);
      event({ ...base, "DTSTART;VALUE=DATE": icsDate(day.y, day.m0, day.d), "DTEND;VALUE=DATE": icsDate(next.y, next.m0, next.d), DESCRIPTION: icsEscape(`Handoff ${to}. Exchange time not set.${day.reason ? ` ${day.reason}` : ""}`), TRANSP: "TRANSPARENT" }, icsAlarm(options.alarm, true, `Exchange ${to}`));
      return;
    }
    const endMinutes = Math.min(time.h * 60 + time.m + 30, 23 * 60 + 59);
    event({ ...base, [dtstart]: icsDateTime(day.y, day.m0, day.d, time.h, time.m), [dtend]: icsDateTime(day.y, day.m0, day.d, Math.floor(endMinutes / 60), endMinutes % 60), DESCRIPTION: icsEscape(`Handoff ${to}. Time: ${time.label}${day.reason ? `. ${day.reason}` : ""}`) }, icsAlarm(options.alarm, false, `Exchange ${to}`));
  });

  // plans
  if (options.plans) {
    state.activities
      .filter(a => years.indexOf(Number(a.date.slice(0, 4))) >= 0)
      .forEach(plan => {
        const [y, m, d] = plan.date.split("-").map(Number);
        const common = { UID: icsEscape(`plan-${idBase}-${plan.id}@parenting-calendar`), DTSTAMP: stamp, SUMMARY: icsEscape(plan.title), DESCRIPTION: icsEscape(child ? `Plan for ${child}` : "") };
        if (plan.time) {
          const [h, min] = plan.time.split(":").map(Number);
          const end = new Date(Date.UTC(y, m - 1, d, h + 1, min));
          event({ ...common, [dtstart]: icsDateTime(y, m - 1, d, h, min), [dtend]: icsDateTime(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()) }, icsAlarm(options.alarm, false, plan.title));
        } else {
          const next = addDaysParts(y, m - 1, d, 1);
          event({ ...common, "DTSTART;VALUE=DATE": icsDate(y, m - 1, d), "DTEND;VALUE=DATE": icsDate(next.y, next.m0, next.d), TRANSP: "TRANSPARENT" });
        }
      });
  }
  lines.push("END:VCALENDAR");
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

// ---- the dialog ---------------------------------------------------------------------------------

function deviceZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
}

// Browsers list some zones under older names (Asia/Calcutta, Asia/Katmandu) and leave out UTC, so the modern
// names people look for are added, as long as this browser can tell their offsets.
const EXTRA_ZONES = ["UTC", "Asia/Kolkata", "Asia/Kathmandu", "Asia/Yangon", "Asia/Ho_Chi_Minh", "America/Argentina/Buenos_Aires", "America/Nuuk", "Europe/Kyiv"];

function zoneChoices() {
  const listed = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  const extra = EXTRA_ZONES.filter(z => listed.indexOf(z) < 0 && zoneOffsetMinutes(z, Date.now()) != null);
  return listed.concat(extra).sort();
}

function fillZoneSelect() {
  const select = document.getElementById("icsZone");
  if (select.options.length) {
    return;
  }
  const device = deviceZone();
  const add = (value, text) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    select.appendChild(opt);
  };
  add(device, `This device (${device})`);
  zoneChoices()
    .filter(z => z !== device)
    .forEach(z => add(z, z));
}

function onExportIcs() {
  if (!requireLicense()) {
    return;
  }
  fillZoneSelect();
  kbRemember();
  document.getElementById("icsOverlay").classList.add("show");
  setTimeout(() => document.getElementById("icsYears").focus(), 30);
}

function downloadIcs() {
  const count = Number(document.getElementById("icsYears").value) || 1;
  const years = [];
  for (let y = state.year; y < state.year + count && y <= MAX_YEAR; y++) {
    years.push(y);
  }
  const zone = document.getElementById("icsZone").value || deviceZone();
  const text = buildIcs({ years, zone, alarm: document.getElementById("icsAlarm").value, plans: document.getElementById("icsPlans").checked });
  const name = safeFileName((childName() ? childName() + "-" : "") + "parenting-calendar-" + (years.length > 1 ? `${years[0]}-${years[years.length - 1]}` : years[0])) + ".ics";
  downloadBlob(new Blob([text], { type: "text/calendar;charset=utf-8" }), name);
  document.getElementById("icsOverlay").classList.remove("show");
  kbReturnFocus();
  toast("Calendar file downloaded. Open it on your phone or computer to add it to your calendar.");
}

document.getElementById("btnIcsDownload").onclick = downloadIcs;
document.getElementById("btnIcsCancel").onclick = () => kbCloseDialog(document.getElementById("icsOverlay"));
