const yearSelect = document.getElementById("yearSelect");

const monthSelect = document.getElementById("monthSelect");

function fillYearMonthSelects() {
  if (!yearSelect.options.length) {
    for (let _0x1c95c5 = MIN_YEAR; _0x1c95c5 <= MAX_YEAR; _0x1c95c5++) {
      const _0x12c494 = document.createElement("option");
      _0x12c494.value = _0x1c95c5;
      _0x12c494.textContent = _0x1c95c5;
      yearSelect.appendChild(_0x12c494);
    }
  }
  if (!monthSelect.options.length) {
    MONTH_NAMES.forEach((_0x58a8bd, _0x200485) => {
      const _0x50520d = document.createElement("option");
      _0x50520d.value = _0x200485;
      _0x50520d.textContent = _0x58a8bd;
      monthSelect.appendChild(_0x50520d);
    });
  }
}

fillYearMonthSelects();

function fillMonthDaySelects(_0x18f17b, _0x2be192, _0x2435c3) {
  const _0x479def = document.getElementById(_0x18f17b);
  const _0x424500 = document.getElementById(_0x2be192);
  if (_0x2435c3 && !_0x479def.options.length) {
    const _0x5b4124 = document.createElement("option");
    _0x5b4124.value = "";
    _0x5b4124.textContent = "Month";
    _0x479def.appendChild(_0x5b4124);
  }
  if (_0x2435c3 && !_0x424500.options.length) {
    const _0x3a9563 = document.createElement("option");
    _0x3a9563.value = "";
    _0x3a9563.textContent = "Day";
    _0x424500.appendChild(_0x3a9563);
  }
  if (_0x479def.options.length <= 1) {
    MONTH_SHORT.forEach((_0x5d2853, _0x5b1ebd) => {
      const _0x4e78e0 = document.createElement("option");
      _0x4e78e0.value = _0x5b1ebd;
      _0x4e78e0.textContent = _0x5d2853;
      _0x479def.appendChild(_0x4e78e0);
    });
  }
  if (_0x424500.options.length <= 1) {
    for (let _0xa18814 = 1; _0xa18814 <= 31; _0xa18814++) {
      const _0x454b5c = document.createElement("option");
      _0x454b5c.value = _0xa18814;
      _0x454b5c.textContent = _0xa18814;
      _0x424500.appendChild(_0x454b5c);
    }
  }
}

function kbMonthMax(m0) {
  return [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m0] || 31;
}

function kbClampDay(mKey, dKey) {
  const mo = state[mKey];
  const day = state[dKey];
  if (mo != null && day != null && day > kbMonthMax(mo)) {
    state[dKey] = kbMonthMax(mo);
    toast(`${MONTH_NAMES[mo]} only has ${kbMonthMax(mo)} days, so the day was set to ${kbMonthMax(mo)}.`);
  }
}

function wireBirthdayPicker(_0x467332, _0x43f228, _0x1d7ac9, _0x5ed1b9) {
  fillMonthDaySelects(_0x467332, _0x43f228, true);
  document.getElementById(_0x467332).onchange = _0x446935 => {
    state[_0x1d7ac9] = _0x446935.target.value === "" ? null : Number(_0x446935.target.value);
    kbClampDay(_0x1d7ac9, _0x5ed1b9);
    save();
    render();
  };
  document.getElementById(_0x43f228).onchange = _0xc644b1 => {
    state[_0x5ed1b9] = _0xc644b1.target.value === "" ? null : Number(_0xc644b1.target.value);
    kbClampDay(_0x1d7ac9, _0x5ed1b9);
    save();
    render();
  };
}

wireBirthdayPicker("bdayChildMonth", "bdayChildDay", "bdayChildM", "bdayChildD");

wireBirthdayPicker("bdayP1Month", "bdayP1Day", "bdayP1M", "bdayP1D");

wireBirthdayPicker("bdayP2Month", "bdayP2Day", "bdayP2M", "bdayP2D");

fillMonthDaySelects("customHolMonth", "customHolDay");

// Presets. mode "biweekly": 14 nights (1 = Parent 1) in order from the first day of week 1.
// mode "weekly": 7 nights by weekday, Sunday first, so the week-start setting makes no difference.
// mode "cycle": any number of nights that repeat without a break.
// Slots may be given directly or built (for the weekend patterns, which depend on the week-start setting).
function weekendSlots(startWeekday, nights, midweek) {
  const ws = state.weekStartsMonday ? 1 : 0;
  const slots = new Array(14).fill(true);
  const first = [...Array(14).keys()].find(i => (ws + i) % 7 === startWeekday);
  for (let n = 0; n < nights; n++) {
    slots[first + n] = false;
  }
  if (midweek) {
    for (let i = 0; i < 14; i++) {
      if ((ws + i) % 7 === 3) {
        slots[i] = false;
      }
    }
  }
  return slots;
}

const PRESET_DEFS = {
  "7-7": { mode: "biweekly", slots: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0], done: "Alternating weeks (7-7) applied" },
  "2-2-5-5": { mode: "biweekly", slots: [1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0], done: "2-2-5-5 schedule applied" },
  "2-2-3": { mode: "biweekly", slots: [1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0], done: "2-2-3 schedule applied" },
  "3-4-4-3": { mode: "biweekly", slots: [1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0], done: "3-4-4-3 schedule applied" },
  "5-2-2-5": { mode: "biweekly", slots: [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0], done: "5-2-2-5 schedule applied" },
  "3-3-4-4": { mode: "biweekly", slots: [1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0], done: "3-3-4-4 schedule applied" },
  "4-3-3-4": { mode: "biweekly", slots: [1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0], done: "4-3-3-4 schedule applied" },
  eow: { mode: "biweekly", build: () => weekendSlots(5, 3, false), done: () => `Every other weekend applied (Fri–Sun with ${p2Name()})` },
  "eow-mid": { mode: "biweekly", build: () => weekendSlots(5, 3, true), done: "Every other weekend + midweek overnight applied" },
  "eow-thu": { mode: "biweekly", build: () => weekendSlots(4, 4, false), done: () => `Every other long weekend applied (Thu–Sun with ${p2Name()})` },
  "4-3": { mode: "weekly", slots: [0, 1, 1, 1, 1, 0, 0], done: () => `4-3 applied: ${p1Name()} Mon–Thu, ${p2Name()} Fri–Sun` },
  "5-2": { mode: "weekly", slots: [0, 1, 1, 1, 1, 1, 0], done: () => `5-2 applied: ${p1Name()} on weekdays, ${p2Name()} on weekends` },
  "4-4": { mode: "cycle", slots: [1, 1, 1, 1, 0, 0, 0, 0], done: "4 on, 4 off (8-day cycle) applied" },
  "3-3": { mode: "cycle", slots: [1, 1, 1, 0, 0, 0], done: "3 on, 3 off (6-day cycle) applied" },
  "5-5": { mode: "cycle", slots: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0], done: "5 on, 5 off (10-day cycle) applied" }
};

function presetSlots(id) {
  const def = PRESET_DEFS[id];
  if (!def) {
    return null;
  }
  return (def.slots || def.build()).map(Boolean);
}

function patternForWeekStart(_0x33ec38) {
  const _0xff72a2 = state.weekStartsMonday ? 1 : 0;
  const _0x5b4a01 = new Array(14).fill(false);
  for (let _0x1af574 = 0; _0x1af574 < 14; _0x1af574++) {
    const _0x38345e = Math.floor(_0x1af574 / 7);
    const _0x512498 = (_0xff72a2 + (_0x1af574 % 7)) % 7;
    _0x5b4a01[_0x38345e * 7 + _0x512498] = !!_0x33ec38[_0x1af574];
  }
  return _0x5b4a01;
}

function boolArraysEqual(_0x121745, _0xb0faaf) {
  return (
    Array.isArray(_0x121745) &&
    Array.isArray(_0xb0faaf) &&
    _0x121745.length === _0xb0faaf.length &&
    _0x121745.every((_0x343484, _0x5c9275) => !!_0x343484 === !!_0xb0faaf[_0x5c9275])
  );
}

function applyPreset(id, quiet) {
  if (!requireLicense()) {
    return;
  }
  const def = PRESET_DEFS[id];
  const slots = presetSlots(id);
  if (!def || !slots) {
    return;
  }
  markScheduleSet();
  if (def.mode === "biweekly") {
    state.baseMode = "biweekly";
    state.baseBiweekly = patternForWeekStart(slots);
  } else if (def.mode === "weekly") {
    state.baseMode = "weekly";
    state.baseWeekly = slots;
  } else {
    state.baseMode = "cycle";
    state.cycleLength = slots.length;
    state.baseCycle = slots;
  }
  lastUndoPushAt = 0;
  save();
  render();
  if (!quiet) {
    toast(textOrCall(def.done) || "Schedule preset applied", { label: "Undo", run: undo });
  }
}

// Highlights the preset that matches what is set now (swapping the two parents still counts as a match).
function markActivePreset() {
  const buttons = document.querySelectorAll(".preset-btn[data-preset]");
  buttons.forEach(button => {
    const id = button.getAttribute("data-preset");
    const def = PRESET_DEFS[id];
    let active = false;
    if (def) {
      const slots = presetSlots(id);
      let current = null;
      let mine = null;
      if (def.mode === "biweekly" && state.baseMode === "biweekly") {
        mine = patternForWeekStart(slots);
        current = state.baseBiweekly;
      } else if (def.mode === "weekly" && state.baseMode === "weekly") {
        mine = slots;
        current = state.baseWeekly;
      } else if (def.mode === "cycle" && state.baseMode === "cycle" && state.cycleLength === slots.length) {
        mine = slots;
        current = state.baseCycle;
      }
      if (current) {
        active = boolArraysEqual(current, mine) || boolArraysEqual(current, mine.map(v => !v));
      }
    }
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}
