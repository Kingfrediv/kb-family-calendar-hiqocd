function yearRange() {
  const _0x338be5 = new Date().getFullYear();
  return {
    min: Math.min(2020, _0x338be5 - 2),
    max: Math.max(2045, _0x338be5 + 12)
  };
}

const MIN_YEAR = yearRange().min;

const MAX_YEAR = yearRange().max;

function storageKeyFor(_0x48f6c1) {
  if (_0x48f6c1 && _0x48f6c1.fileId) {
    return "custody_cal_v9__" + _0x48f6c1.fileId;
  } else {
    return "custody_cal_v9";
  }
}

const DEMO_STARTED_KEY = "kb_demo_own_started";

const DEMO_FILE_ID = "kb_demo_own";

let kbBakedCache;

function readBakedState() {
  if (kbBakedCache !== undefined) {
    return kbBakedCache;
  }
  kbBakedCache = null;
  try {
    const _0x22571b = document.getElementById("baked-state");
    if (_0x22571b && _0x22571b.textContent.trim() !== "null") {
      const kbParsed = JSON.parse(_0x22571b.textContent);
      if (kbParsed && typeof kbParsed === "object" && !Array.isArray(kbParsed)) {
        kbBakedCache = kbParsed;
      }
    }
  } catch {}
  return kbBakedCache;
}

// true when this page is a downloaded copy of somebody's calendar
function kbIsCopy() {
  const b = readBakedState();
  return !!b && !isDemoState(b);
}

// the storage slot this page reads at start-up; everything must be saved back to the same one
function kbHomeFileId() {
  const b = readBakedState();
  if (!b) {
    return "";
  }
  if (isDemoState(b) && demoOwnStarted()) {
    return DEMO_FILE_ID;
  }
  return typeof b.fileId === "string" ? b.fileId : "";
}

// One-time rescue: an earlier version saved edits made after "Download Copy" into a slot it never read back.
let kbRecovered = false;

function kbRecoverStranded(main) {
  try {
    if (!/^https?:$/.test(location.protocol)) {
      return null;
    }
    if (localStorage.getItem("kb_recover_v1") === "1") {
      return null;
    }
    localStorage.setItem("kb_recover_v1", "1");
    let best = null;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf("custody_cal_v9__cal_") !== 0) {
        continue;
      }
      let v = null;
      try {
        v = JSON.parse(localStorage.getItem(k) || "null");
      } catch {}
      if (v && typeof v === "object" && !Array.isArray(v) && Number(v.savedAt) > (best ? Number(best.savedAt) : 0)) {
        best = v;
      }
    }
    if (!best || !(Number(best.savedAt) > ((main && Number(main.savedAt)) || 0))) {
      return null;
    }
    best.fileId = "";
    localStorage.setItem("custody_cal_v9", JSON.stringify(best));
    return best;
  } catch {
    return null;
  }
}

function demoOwnStarted() {
  try {
    return localStorage.getItem(DEMO_STARTED_KEY) === "1";
  } catch {
    return false;
  }
}

function isDemoState(_0x2709b6) {
  return !!_0x2709b6 && !!_0x2709b6.demoSample;
}

function isDemoPage() {
  return isDemoState(readBakedState()) && !demoOwnStarted();
}

let viewingShared = false;

let pendingShareKind = null;

let undoStack = [];

let lastUndoPushAt = 0;

let lastSavedJson = null;

let license = null;

let licenseDialogOpen = false;

function loadInitialState() {
  const _0x28b4cc = defaultState();
  let _0x531602 = readBakedState();
  let _0x2e104b = null;
  const _0x21bdeb = shareKind();
  if (_0x21bdeb === "s") {
    const _0x420585 = readLegacyShare();
    if (_0x420585) {
      viewingShared = true;
      return mergeStates(sampleState(), _0x420585);
    }
  } else if (_0x21bdeb === "c" || _0x21bdeb === "p") {
    pendingShareKind = _0x21bdeb;
    viewingShared = true;
    return _0x28b4cc;
  }
  if (isDemoState(_0x531602) && demoOwnStarted()) {
    const _0x21d2bd = storageKeyFor({
      fileId: DEMO_FILE_ID
    });
    try {
      _0x2e104b = JSON.parse(localStorage.getItem(_0x21d2bd) || "null");
    } catch {}
    if (_0x2e104b) {
      return mergeStates(_0x28b4cc, _0x2e104b);
    }
    const _0x2f05d6 = Object.assign({}, _0x28b4cc);
    _0x2f05d6.fileId = DEMO_FILE_ID;
    return _0x2f05d6;
  }
  // which calendar this browser last had open ("" is the original one)
  const activeId = _0x531602 ? "" : readActiveCalendarId();
  const _0x1b0ebd = storageKeyFor(_0x531602 || { fileId: activeId });
  try {
    _0x2e104b = JSON.parse(localStorage.getItem(_0x1b0ebd) || "null");
  } catch {}
  if (_0x531602) {
    let _0x4e0df5;
    if (_0x2e104b && _0x2e104b.fileId === _0x531602.fileId && (_0x2e104b.savedAt || 0) > (_0x531602.savedAt || 0)) {
      _0x4e0df5 = _0x2e104b;
    } else {
      _0x4e0df5 = _0x531602;
    }
    return mergeStates(_0x28b4cc, _0x4e0df5);
  }
  if (!activeId) {
    const kbRec = kbRecoverStranded(_0x2e104b);
    if (kbRec) {
      _0x2e104b = kbRec;
      kbRecovered = true;
    }
  }
  if (_0x2e104b) {
    const merged = mergeStates(_0x28b4cc, _0x2e104b);
    merged.fileId = activeId;
    return merged;
  }
  _0x28b4cc.fileId = activeId;
  return _0x28b4cc;
}

function kbValidDate(v) {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return false;
  }
  const p = v.split("-").map(Number);
  return (
    p[0] >= 1900 && p[0] <= 2200 && p[1] >= 1 && p[1] <= 12 && p[2] >= 1 && p[2] <= new Date(p[0], p[1], 0).getDate()
  );
}

function kbStr(v, max, fallback) {
  if (typeof v === "number" || typeof v === "boolean") {
    v = String(v);
  }
  if (typeof v !== "string") {
    return fallback;
  }
  return v.length > max ? v.slice(0, max) : v;
}

function kbBool(v, fallback) {
  return typeof v === "boolean" ? v : v == null ? fallback : !!v;
}

function kbBools(v, n, fallback) {
  return Array.isArray(v) && v.length === n ? v.map(Boolean) : fallback;
}

function kbOneOf(v, list, fallback) {
  return list.indexOf(v) >= 0 ? v : fallback;
}

function kbIntOrNull(v, lo, hi) {
  if (v == null || v === "" || typeof v === "boolean" || typeof v === "object") {
    return null;
  }
  const n = Number(v);
  return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
}

function kbObj(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
}

function kbDateMap(v) {
  const out = {};
  const o = kbObj(v);
  Object.keys(o).forEach(k => {
    if (/^\d{4}$/.test(k) && kbValidDate(o[k])) {
      out[k] = o[k];
    }
  });
  return out;
}

function kbOwnerMap(v, keyOk) {
  const out = {};
  const o = kbObj(v);
  Object.keys(o).forEach(k => {
    if (keyOk(k) && (o[k] === "p1" || o[k] === "p2" || o[k] === "both")) {
      out[k] = o[k];
    }
  });
  return out;
}

// Coerce a state object into a known-good shape. Nothing outside these rules ever reaches the page.
function kbSanitize(s) {
  const d = defaultState();
  const yearKey = k => /^\d{4}:[\w-]{1,48}$/.test(k);
  s.savedAt = Number.isFinite(Number(s.savedAt)) && Number(s.savedAt) > 0 ? Number(s.savedAt) : 0;
  s.fileId = typeof s.fileId === "string" && /^[\w-]{1,64}$/.test(s.fileId) ? s.fileId : "";
  [
    "setupComplete",
    "weekStartsMonday",
    "scheduleUnset",
    "showSplitDays",
    "evenGroupAP1",
    "holidaysOverrideSummer",
    "summerEnabled",
    "summerRestP2",
    "sidebarHidden"
  ].forEach(k => {
    s[k] = kbBool(s[k], d[k]);
  });
  s.childName = kbStr(s.childName, 60, "");
  s.p1Name = kbStr(s.p1Name, 60, "Parent 1");
  s.p2Name = kbStr(s.p2Name, 60, "Parent 2");
  ["p1Color", "p2Color", "headerColor"].forEach(k => {
    s[k] = typeof s[k] === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s[k]) ? s[k] : d[k];
  });
  ["titleEmoji", "summerEmoji", "schoolEmoji"].forEach(k => {
    s[k] = kbStr(s[k], 16, d[k]);
  });
  s.baseMode = kbOneOf(s.baseMode, ["weekly", "biweekly", "monthly", "cycle"], "weekly");
  s.baseWeekly = kbBools(s.baseWeekly, 7, d.baseWeekly);
  s.baseBiweekly = kbBools(s.baseBiweekly, 14, d.baseBiweekly);
  s.baseMonthly = kbBools(s.baseMonthly, 35, d.baseMonthly);
  s.biweeklyAnchor = kbValidDate(s.biweeklyAnchor) ? s.biweeklyAnchor : "2026-01-04";
  ["bdayChildM", "bdayP1M", "bdayP2M"].forEach(k => {
    s[k] = kbIntOrNull(s[k], 0, 11);
  });
  ["bdayChildD", "bdayP1D", "bdayP2D"].forEach(k => {
    s[k] = kbIntOrNull(s[k], 1, 31);
  });
  {
    const y = kbIntOrNull(s.year, 1900, 2200);
    s.year = y == null ? new Date().getFullYear() : y;
  }
  s.viewMode = kbOneOf(s.viewMode, ["year", "month"], "year");
  {
    const mo = kbIntOrNull(s.selectedMonth, 0, 11);
    s.selectedMonth = mo == null ? 0 : mo;
  }
  ["timeToP1", "timeToP2", "timeHoliday", "exchangeLocation", "schoolName"].forEach(k => {
    s[k] = kbStr(s[k], 200, "");
  });
  s.summerDeadline = kbStr(s.summerDeadline, 200, d.summerDeadline);
  s.schoolUrl = kbStr(s.schoolUrl, 500, "");
  s.schoolNotes = kbStr(s.schoolNotes, 20000, "");
  s.agreementNotes = kbStr(s.agreementNotes, 20000, "");
  s.summerFirstPick = kbOneOf(s.summerFirstPick, ["evenP1", "evenP2", "mutual"], "evenP1");
  s.mothersDayOwner = kbOneOf(s.mothersDayOwner, ["skip", "p1", "p2", "both"], "skip");
  s.fathersDayOwner = kbOneOf(s.fathersDayOwner, ["skip", "p1", "p2", "both"], "skip");
  {
    // the twelve original weeks always exist; weeks in other months (a longer or later summer) are kept when valid
    const sel = kbObj(s.summerSelected);
    const out = {};
    SUMMER_IDS.forEach(id => {
      out[id] = !!sel[id];
    });
    Object.keys(sel).forEach(id => {
      if (isSummerWeekId(id) && SUMMER_IDS.indexOf(id) < 0) {
        out[id] = !!sel[id];
      }
    });
    s.summerSelected = out;
  }
  // ---- settings added in the second release
  s.region = kbOneOf(s.region, ["us", "ca", "uk", "au"], "us");
  s.longWeekends = kbBool(s.longWeekends, false);
  s.splitChristmas = kbBool(s.splitChristmas, false);
  {
    const flips = {};
    const raw = kbObj(s.holidayFlip);
    Object.keys(raw).forEach(k => {
      if (/^[\w-]{1,60}$/.test(k) && raw[k]) {
        flips[k] = true;
      }
    });
    s.holidayFlip = flips;
    const packs = kbObj(s.packs);
    const clean = {};
    ["jewish", "islamic", "hindu", "chinese"].forEach(name => {
      clean[name] = kbOneOf(packs[name], ["off", "alt", "p1", "p2", "both"], "off");
    });
    s.packs = clean;
  }
  s.summerStart = isMonthDayText(s.summerStart) ? s.summerStart : "06-01";
  s.summerEnd = isMonthDayText(s.summerEnd) ? s.summerEnd : "08-14";
  if (s.summerStart > s.summerEnd) {
    s.summerStart = "06-01";
    s.summerEnd = "08-14";
  }
  {
    const w1 = kbIntOrNull(s.winterStartDay, 15, 31);
    const w2 = kbIntOrNull(s.winterEndDay, 1, 15);
    s.winterStartDay = w1 == null ? 20 : w1;
    s.winterEndDay = w2 == null ? 2 : w2;
    const n = kbIntOrNull(s.cycleLength, 2, 28);
    s.cycleLength = n == null ? 14 : n;
    s.baseCycle = kbBools(s.baseCycle, s.cycleLength, new Array(s.cycleLength).fill(false));
    s.cycleAnchor = kbValidDate(s.cycleAnchor) ? s.cycleAnchor : "2026-01-04";
  }
  s.schoolEndByYear = kbDateMap(s.schoolEndByYear);
  s.schoolStartByYear = kbDateMap(s.schoolStartByYear);
  s.springBreakByYear = kbDateMap(s.springBreakByYear);
  s.schoolCustomEvents = (Array.isArray(s.schoolCustomEvents) ? s.schoolCustomEvents : [])
    .filter(e => e && typeof e === "object" && kbValidDate(e.startDate))
    .slice(0, 300)
    .map((e, i) => ({
      id: typeof e.id === "string" && /^[\w-]{1,40}$/.test(e.id) ? e.id : "sc_" + i,
      startDate: e.startDate,
      endDate: kbValidDate(e.endDate) && e.endDate >= e.startDate ? e.endDate : e.startDate,
      title: kbStr(e.title, 80, "No School") || "No School",
      kind: kbOneOf(e.kind, ["noschool", "halfday", "p1", "p2"], "noschool")
    }));
  s.customHolidays = (Array.isArray(s.customHolidays) ? s.customHolidays : [])
    .filter(h => h && typeof h === "object")
    .slice(0, 100)
    .map((h, i) => {
      const mo = kbIntOrNull(h.m, 0, 11);
      const day = kbIntOrNull(h.d, 1, 31);
      return {
        id:
          typeof h.id === "number" && Number.isFinite(h.id)
            ? h.id
            : typeof h.id === "string" && /^[\w-]{1,40}$/.test(h.id)
              ? h.id
              : "h" + i,
        name: kbStr(h.name, 60, "Holiday") || "Holiday",
        emoji: kbStr(h.emoji, 16, "✨"),
        m: mo == null ? 0 : mo,
        d: day == null ? 1 : day,
        rule: kbOneOf(h.rule, ["altA", "altB", "both", "p1", "p2"], "both")
      };
    });
  {
    const out = {};
    const o = kbObj(s.disabledHolidays);
    Object.keys(o).forEach(k => {
      if (/^[\w-]{1,48}$/.test(k)) {
        out[k] = !!o[k];
      }
    });
    s.disabledHolidays = out;
  }
  {
    const out = {};
    const o = kbObj(s.disabledByYear);
    Object.keys(o).forEach(k => {
      if (yearKey(k)) {
        out[k] = !!o[k];
      }
    });
    s.disabledByYear = out;
  }
  s.holidayYearOverrides = kbOwnerMap(s.holidayYearOverrides, yearKey);
  s.overrides = kbOwnerMap(s.overrides, kbValidDate);
  return s;
}

function normalizeState(_0x1766e7) {
  if (!_0x1766e7 || typeof _0x1766e7 !== "object" || Array.isArray(_0x1766e7)) {
    _0x1766e7 = defaultState();
  }
  kbSanitize(_0x1766e7);
  if (_0x1766e7.year < MIN_YEAR) {
    _0x1766e7.year = MIN_YEAR;
  }
  if (_0x1766e7.year > MAX_YEAR) {
    _0x1766e7.year = MAX_YEAR;
  }
  return _0x1766e7;
}

let state = normalizeState(loadInitialState());

if (!Array.isArray(state.schoolCustomEvents)) {
  state.schoolCustomEvents = [];
}

if (!Array.isArray(state.customHolidays)) {
  state.customHolidays = [];
}

if (!Array.isArray(state.baseWeekly) || state.baseWeekly.length !== 7) {
  state.baseWeekly = defaultState().baseWeekly;
}

if (!Array.isArray(state.baseBiweekly) || state.baseBiweekly.length !== 14) {
  state.baseBiweekly = defaultState().baseBiweekly;
}

if (!Array.isArray(state.baseMonthly) || state.baseMonthly.length !== 35) {
  state.baseMonthly = emptyMonthlyPattern();
}

const isFirstRun = !state.savedAt && !viewingShared;

if (isFirstRun && window.innerWidth <= 768) {
  state.sidebarHidden = true;
}

if (isFirstRun && window.innerWidth <= 600) {
  state.viewMode = "month";
  const _0x226911 = new Date();
  if (state.year === _0x226911.getFullYear()) {
    state.selectedMonth = _0x226911.getMonth();
  }
}

let notesEditing = false;

lastSavedJson = JSON.stringify(state);

function currentStorageKey() {
  return storageKeyFor(state);
}

function save(_0x12f078) {
  const _0x1ce805 = _0x12f078 && (_0x12f078.fromUndo || _0x12f078.nav);
  if (!_0x1ce805 && lastSavedJson) {
    const _0x5209fa = Date.now();
    if (!(_0x5209fa - lastUndoPushAt < 800) || !undoStack.length) {
      undoStack.push(lastSavedJson);
      if (undoStack.length > 40) {
        undoStack.shift();
      }
    }
    lastUndoPushAt = _0x5209fa;
  }
  state.savedAt = Date.now();
  if (!viewingShared && isLicensed()) {
    try {
      localStorage.setItem(currentStorageKey(), JSON.stringify(state));
    } catch {}
  }
  lastSavedJson = JSON.stringify(state);
  updateUndoButton();
}

function updateUndoButton() {
  const _0x4d675e = document.getElementById("btnUndo");
  if (_0x4d675e) {
    _0x4d675e.disabled = !undoStack.length;
  }
}

function undo() {
  if (!requireLicense()) {
    return;
  }
  if (!undoStack.length) {
    return;
  }
  const _0x3388e6 = undoStack.pop();
  state = normalizeState(Object.assign({}, defaultState(), JSON.parse(_0x3388e6)));
  if (!viewingShared && isLicensed()) {
    try {
      localStorage.setItem(currentStorageKey(), JSON.stringify(state));
    } catch {}
  }
  lastSavedJson = JSON.stringify(state);
  updateUndoButton();
  drawSummer();
  drawCustomHolidayList();
  drawSchoolEventList();
  render();
  toast("Undid last change");
}

// Ask the browser not to clear this site's saved data on its own (it may still say no).
function kbKeepStorage() {
  try {
    if (navigator.storage && typeof navigator.storage.persist === "function") {
      navigator.storage.persist().catch(() => {});
    }
  } catch {}
}
