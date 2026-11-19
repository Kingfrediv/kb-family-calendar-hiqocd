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

const PRESETS = {
  "7-7": [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
  "2-2-5-5": [1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  "2-2-3": [1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0],
  "3-4-4-3": [1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
  "5-2-2-5": [1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0]
};

function presetPattern(_0x265b44) {
  if (PRESETS[_0x265b44]) {
    return PRESETS[_0x265b44].map(Boolean);
  }
  const _0x35195e = state.weekStartsMonday ? 1 : 0;
  const _0x678138 = new Array(14).fill(true);
  let _0x43f4 = -1;
  for (let _0x194d6d = 0; _0x194d6d < 14; _0x194d6d++) {
    if ((_0x35195e + _0x194d6d) % 7 === 5) {
      _0x43f4 = _0x194d6d;
      break;
    }
  }
  if (_0x43f4 >= 0) {
    _0x678138[_0x43f4] = false;
    _0x678138[_0x43f4 + 1] = false;
    _0x678138[_0x43f4 + 2] = false;
  }
  if (_0x265b44 === "eow-mid") {
    for (let _0x174242 = 0; _0x174242 < 14; _0x174242++) {
      if ((_0x35195e + _0x174242) % 7 === 3) {
        _0x678138[_0x174242] = false;
      }
    }
  }
  return _0x678138;
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

function applyPreset(_0x5b3b0c) {
  if (!requireLicense()) {
    return;
  }
  const _0x5f9314 = presetPattern(_0x5b3b0c);
  if (!_0x5f9314) {
    return;
  }
  markScheduleSet();
  state.baseMode = "biweekly";
  state.baseBiweekly = patternForWeekStart(_0x5f9314);
  lastUndoPushAt = 0;
  save();
  render();
  const _0x58c632 = {
    "7-7": "Alternating weeks (7-7) applied",
    "2-2-5-5": "2-2-5-5 schedule applied",
    "2-2-3": "2-2-3 schedule applied",
    "3-4-4-3": "3-4-4-3 schedule applied",
    "5-2-2-5": "5-2-2-5 schedule applied",
    eow: `Every other weekend applied (Fri–Sun with ${p2Name()})`,
    "eow-mid": "Every other weekend + midweek overnight applied"
  };
  toast(_0x58c632[_0x5b3b0c] || "Schedule preset applied");
}

function markActivePreset() {
  const _0x15438e = document.querySelectorAll(".preset-btn[data-preset]");
  if (!_0x15438e.length) {
    return;
  }
  const _0x1fabf9 = state.baseMode === "biweekly" ? state.baseBiweekly : null;
  _0x15438e.forEach(_0x534b20 => {
    const _0x858e78 = _0x534b20.getAttribute("data-preset");
    let _0x1c0fa8 = false;
    if (_0x1fabf9) {
      const _0x3de976 = patternForWeekStart(presetPattern(_0x858e78));
      const _0x1f3b62 = _0x3de976.map(_0x588a95 => !_0x588a95);
      _0x1c0fa8 = boolArraysEqual(_0x1fabf9, _0x3de976) || boolArraysEqual(_0x1fabf9, _0x1f3b62);
    }
    _0x534b20.classList.toggle("active", _0x1c0fa8);
    _0x534b20.setAttribute("aria-pressed", _0x1c0fa8 ? "true" : "false");
  });
}
