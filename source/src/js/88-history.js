// ---------------------------------------------------------------------------------------------
// Change history: a plain list of what was changed on this device, by whom, and when. Never leaves the device,
// is not in share links, and is part of a backup. Kept per calendar. At most 200 entries.
// ---------------------------------------------------------------------------------------------

function historyKey(id) {
  return "kb_hist_v1__" + (id || "main");
}

// Anything read from storage or a backup file becomes a clean list of { t, who, text }.
function cleanHistory(list) {
  return Array.isArray(list)
    ? list
        .filter(e => e && Number.isFinite(Number(e.t)) && typeof e.text === "string")
        .slice(-200)
        .map(e => ({ t: Number(e.t), who: e.who === "p1" || e.who === "p2" ? e.who : "", text: e.text.slice(0, 200) }))
    : [];
}

function readHistory(id) {
  try {
    return cleanHistory(JSON.parse(localStorage.getItem(historyKey(id)) || "[]"));
  } catch {
    return [];
  }
}

function writeHistory(id, list) {
  try {
    localStorage.setItem(historyKey(id), JSON.stringify(list.slice(-200)));
  } catch {}
}

function currentActor() {
  const who = readPrefs().actor;
  return who === "p1" || who === "p2" ? who : "";
}

// Adds an entry. The same words by the same person within a minute update the last entry (typing a name is one change).
function recordHistoryNote(text, minuteKey) {
  if (viewingShared || !isLicensed() || !text) {
    return;
  }
  const list = readHistory(state.fileId);
  const now = Date.now();
  const who = currentActor();
  const last = list[list.length - 1];
  if (last && last.text === text && last.who === who && now - last.t < 60000 && minuteKey !== false) {
    last.t = now;
  } else {
    list.push({ t: now, who, text });
  }
  writeHistory(state.fileId, list);
}

const HISTORY_GROUPS = [
  ["Base schedule changed", ["baseMode", "baseWeekly", "baseBiweekly", "baseMonthly", "baseCycle", "cycleLength", "cycleAnchor", "biweeklyAnchor", "weekStartsMonday", "scheduleUnset"]],
  ["Summer settings changed", ["summerEnabled", "summerRestP2", "summerStart", "summerEnd", "summerDeadline", "summerFirstPick"]],
  ["Holiday settings changed", ["region", "packs", "longWeekends", "splitChristmas", "holidayFlip", "evenGroupAP1", "holidaysOverrideSummer", "mothersDayOwner", "fathersDayOwner", "winterStartDay", "winterEndDay", "disabledHolidays"]],
  ["School dates changed", ["schoolEndByYear", "schoolStartByYear", "springBreakByYear", "schoolName", "schoolUrl", "schoolNotes"]],
  ["Exchange times or place changed", ["timeToP1", "timeToP2", "timeHoliday", "exchangeLocation"]],
  ["Agreement notes edited", ["agreementNotes"]],
  ["Names, birthdays or colors changed", ["childName", "p1Name", "p2Name", "p1Color", "p2Color", "headerColor", "titleEmoji", "summerEmoji", "schoolEmoji", "bdayChildM", "bdayChildD", "bdayP1M", "bdayP1D", "bdayP2M", "bdayP2D"]]
];

function ownerWord(owner) {
  return owner === "both" ? "together" : ownerLabel(owner);
}

function holidayNameFor(key) {
  const row = buildHolidays(state.year).summaryRows.find(r => r.key === key);
  return row ? row.name : key;
}

// Human sentences for what differs between two saved versions of a calendar (JSON text).
function describeChanges(previousJson, nextJson) {
  let a;
  let b;
  try {
    a = JSON.parse(previousJson);
    b = JSON.parse(nextJson);
  } catch {
    return [];
  }
  const out = [];
  const keys = obj => Object.keys(obj || {});
  // days set by hand
  const days = [...new Set([...keys(a.overrides), ...keys(b.overrides)])].sort().filter(d => (a.overrides || {})[d] !== (b.overrides || {})[d]);
  if (days.length <= 3) {
    days.forEach(d => out.push(`${shortDate(d)}: ${b.overrides && b.overrides[d] ? ownerWord(b.overrides[d]) : "back to the usual schedule"}`));
  } else if (days.length) {
    out.push(`${days.length} days changed (${dateRangeText(days[0], days[days.length - 1])})`);
  }
  // notes and plans
  [...new Set([...keys(a.dayNotes), ...keys(b.dayNotes)])]
    .sort()
    .filter(d => (a.dayNotes || {})[d] !== (b.dayNotes || {})[d])
    .slice(0, 3)
    .forEach(d => out.push(`${(b.dayNotes || {})[d] ? ((a.dayNotes || {})[d] ? "Note edited" : "Note added") : "Note removed"} on ${shortDate(d)}`));
  const planIds = list => Object.fromEntries((list || []).map(p => [p.id, p]));
  const pa = planIds(a.activities);
  const pb = planIds(b.activities);
  Object.keys(pb).filter(id => !pa[id]).slice(0, 3).forEach(id => out.push(`Plan added on ${shortDate(pb[id].date)}: ${pb[id].title}`));
  Object.keys(pa).filter(id => !pb[id]).slice(0, 3).forEach(id => out.push(`Plan removed on ${shortDate(pa[id].date)}: ${pa[id].title}`));
  // holiday tiles tapped for a year
  const tile = (st, k) => ((st.disabledByYear || {})[k] === true ? "skipped" : (st.holidayYearOverrides || {})[k] ? ownerWord(st.holidayYearOverrides[k]) : (st.disabledByYear || {})[k] === false ? "on" : "usual");
  [...new Set([...keys(a.disabledByYear), ...keys(b.disabledByYear), ...keys(a.holidayYearOverrides), ...keys(b.holidayYearOverrides)])]
    .sort()
    .filter(k => tile(a, k) !== tile(b, k))
    .slice(0, 3)
    .forEach(k => out.push(`${holidayNameFor(k.split(":")[1])} ${k.split(":")[0]}: ${tile(b, k) === "usual" ? "back to the usual rule" : tile(b, k)}`));
  // summer weeks
  const chips = summerChips();
  [...new Set([...keys(a.summerSelected), ...keys(b.summerSelected)])]
    .filter(id => !!(a.summerSelected || {})[id] !== !!(b.summerSelected || {})[id])
    .slice(0, 3)
    .forEach(id => {
      const chip = chips.find(c => c.id === id);
      out.push(`Summer week ${chip ? chip.label : id}: ${b.summerSelected[id] ? "given to " + ownerLabel("p1") : "taken off"}`);
    });
  const byId = list => Object.fromEntries((list || []).map(x => [x.id, x]));
  [["customHolidays", "holiday", x => x.name], ["schoolCustomEvents", "school date", x => x.title]].forEach(([field, word, nameOf]) => {
    const ia = byId(a[field]);
    const ib = byId(b[field]);
    Object.keys(ib).filter(id => !ia[id]).slice(0, 2).forEach(id => out.push(`Added ${word}: ${nameOf(ib[id])}`));
    Object.keys(ia).filter(id => !ib[id]).slice(0, 2).forEach(id => out.push(`Removed ${word}: ${nameOf(ia[id])}`));
  });
  HISTORY_GROUPS.forEach(([text, fields]) => {
    if (fields.some(f => JSON.stringify(a[f]) !== JSON.stringify(b[f]))) {
      out.push(text);
    }
  });
  return out.slice(0, 8);
}

function recordHistory(previousJson, nextJson) {
  if (!previousJson || previousJson === nextJson) {
    return;
  }
  describeChanges(previousJson, nextJson).forEach(text => recordHistoryNote(text));
}

// ---- the dialog ---------------------------------------------------------------------------------

function drawHistory() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  const entries = readHistory(state.fileId).reverse();
  if (!entries.length) {
    const empty = document.createElement("li");
    empty.textContent = "Nothing yet. Changes you make from now on are listed here.";
    list.appendChild(empty);
  }
  entries.forEach(entry => {
    const item = document.createElement("li");
    const when = document.createElement("time");
    const date = new Date(entry.t);
    when.dateTime = date.toISOString();
    when.textContent = `${monthDay(date.getMonth(), date.getDate(), true)}, ${formatTime12(pad2(date.getHours()) + ":" + pad2(date.getMinutes()))}${entry.who ? " · " + ownerLabel(entry.who) : ""}`;
    item.appendChild(when);
    item.appendChild(document.createTextNode(entry.text));
    list.appendChild(item);
  });
  const actor = document.getElementById("actorSelect");
  actor.innerHTML = "";
  [["", "Not set"], ["p1", p1Name()], ["p2", p2Name()]].forEach(([value, text]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    actor.appendChild(opt);
  });
  actor.value = currentActor();
}

function openHistory() {
  kbRemember();
  drawHistory();
  document.getElementById("historyOverlay").classList.add("show");
  setTimeout(() => document.getElementById("btnHistoryClose").focus(), 30);
}

document.getElementById("btnHistory").onclick = openHistory;
document.getElementById("btnHistoryClose").onclick = () => kbCloseDialog(document.getElementById("historyOverlay"));
document.getElementById("actorSelect").onchange = ev => writePref("actor", ev.target.value);
document.getElementById("btnHistoryClear").onclick = () => {
  if (confirm(tr("Clear the change history for this calendar?"))) {
    writeHistory(state.fileId, []);
    drawHistory();
  }
};
