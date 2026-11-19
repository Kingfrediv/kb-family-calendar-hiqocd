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

function baseOwner(_0x44b6ca, _0x3a8470, _0x6040e4) {
  if (state.scheduleUnset) {
    return "none";
  }
  const _0x2607bf = noonDate(_0x44b6ca, _0x3a8470, _0x6040e4);
  const _0xd8e7b8 = _0x2607bf.getDay();
  if (state.baseMode === "weekly") {
    if (state.baseWeekly[_0xd8e7b8]) {
      return "p1";
    } else {
      return "p2";
    }
  }
  if (state.baseMode === "biweekly") {
    if (state.baseBiweekly[kbBiweekIndex(_0x2607bf)]) {
      return "p1";
    } else {
      return "p2";
    }
  }
  if (state.baseMonthly[(Math.ceil(_0x6040e4 / 7) - 1) * 7 + _0xd8e7b8]) {
    return "p1";
  } else {
    return "p2";
  }
}

function summerWeekSelected(_0x2790ef, _0x5969ec) {
  if (_0x2790ef === 5) {
    return JUNE_WEEKS.some(
      _0x17794f => state.summerSelected[_0x17794f.id] && _0x5969ec >= _0x17794f.start && _0x5969ec <= _0x17794f.end
    );
  }
  if (_0x2790ef === 6) {
    return JULY_WEEKS.some(
      _0x2eae0f => state.summerSelected[_0x2eae0f.id] && _0x5969ec >= _0x2eae0f.start && _0x5969ec <= _0x2eae0f.end
    );
  }
  if (_0x2790ef === 7 && _0x5969ec <= 14) {
    return AUGUST_WEEKS.some(
      _0x5c2893 => state.summerSelected[_0x5c2893.id] && _0x5969ec >= _0x5c2893.start && _0x5969ec <= _0x5c2893.end
    );
  }
  return null;
}

function holidayPriority(_0x5055e6, _0x7d1154, _0x2eb0af, _0x3291b0) {
  if (_0x5055e6 === "birthday") {
    return 40;
  }
  if (_0x7d1154 === "both") {
    return 30;
  }
  if (_0x2eb0af) {
    return 25;
  }
  if (_0x3291b0 === "christmas" || _0x3291b0 === "xmasEve" || _0x3291b0 === "nye" || _0x3291b0 === "newyears") {
    return 22;
  }
  if (_0x5055e6 === "holiday") {
    return 20;
  }
  if (_0x5055e6 === "break") {
    return 10;
  }
  return 15;
}

function isHolidayOff(_0x20d784, _0x4b1fba) {
  const _0x41f1cc = `${_0x20d784}:${_0x4b1fba}`;
  if (Object.prototype.hasOwnProperty.call(state.disabledByYear || {}, _0x41f1cc)) {
    return !!state.disabledByYear[_0x41f1cc];
  }
  return kbOffByDefault(_0x4b1fba);
}

function kbOffByDefault(_0x4b1fba) {
  if (_0x4b1fba === "mothersDay") {
    return (state.mothersDayOwner || "skip") === "skip";
  }
  if (_0x4b1fba === "fathersDay") {
    return (state.fathersDayOwner || "skip") === "skip";
  }
  return !!(state.disabledHolidays || {})[_0x4b1fba];
}

function appreciationDayDefault(_0x4f2bac) {
  const _0x2b82b9 = (_0x4f2bac === "mothersDay" ? state.mothersDayOwner : state.fathersDayOwner) || "skip";
  if (_0x2b82b9 === "skip") {
    return "both";
  } else {
    return _0x2b82b9;
  }
}

function buildHolidays(_0x1dbdcb) {
  const _0xd21ec4 = {};
  const _0x248898 = [];
  const { springBreakStart: _0x408e6a } = schoolDatesFor(_0x1dbdcb);
  const _0x5ce627 = p1Name();
  const _0x3222ac = p2Name();
  function _0x36b446({
    key: _0x6e074a,
    startStr: _0x5b2a7f,
    len = 1,
    defaultOwner: _0xd6fca9,
    label: _0x180ce1,
    shortName: _0xa20a22,
    icon: _0xc9bc50,
    kind: _0x495188,
    ruleDesc: _0x4146c5,
    fixed = false,
    alwaysApplies = false
  }) {
    if (!_0x5b2a7f) {
      _0x248898.push({
        key: _0x6e074a,
        name: _0x180ce1,
        shortName: _0xa20a22 || _0x180ce1,
        icon: _0xc9bc50,
        dates: "",
        rule: _0x4146c5,
        owner: _0xd6fca9,
        disabled: true,
        fixed: fixed,
        defaultOwner: _0xd6fca9
      });
      return;
    }
    const _0xafe1bc = isHolidayOff(_0x1dbdcb, _0x6e074a);
    const _0x5485a5 = state.holidayYearOverrides[`${_0x1dbdcb}:${_0x6e074a}`];
    const _0x5af7a9 = _0x5485a5 || _0xd6fca9;
    const _0x223a08 = holidayPriority(_0x495188, _0x5af7a9, alwaysApplies, _0x6e074a);
    let _0x3d154e = "";
    if (!_0xafe1bc) {
      for (let _0x7a510b = 0; _0x7a510b < len; _0x7a510b++) {
        const _0x1f3d62 = addDays(_0x5b2a7f, _0x7a510b);
        if (_0x1f3d62.startsWith(`${_0x1dbdcb}-`)) {
          const _0x4b0448 = parseDateStr(_0x1f3d62);
          const _0x50da4a = _0x4b0448.getMonth();
          const _0xd28a6d = _0x4b0448.getDate();
          const _0x425ccb =
            state.summerEnabled && (_0x50da4a === 5 || _0x50da4a === 6 || (_0x50da4a === 7 && _0xd28a6d <= 14));
          if (
            _0x425ccb &&
            !state.holidaysOverrideSummer &&
            _0x6e074a === "july4" &&
            summerWeekSelected(_0x50da4a, _0xd28a6d)
          ) {
            _0x3d154e = `(Summer week keeps it: ${ownerLabel("p1")})`;
          } else if (_0xd21ec4[_0x1f3d62] && (_0xd21ec4[_0x1f3d62].pri || 0) > _0x223a08) {
            _0x3d154e += `${_0x3d154e ? " " : ""}(Calendar uses ${_0xd21ec4[_0x1f3d62].label} on this date)`;
          } else {
            const _0x40d50a = _0xd21ec4[_0x1f3d62] ? _0xd21ec4[_0x1f3d62].label : "";
            _0xd21ec4[_0x1f3d62] = {
              owner: _0x5af7a9,
              label: _0x180ce1,
              icon: _0xc9bc50,
              kind: _0x495188,
              alwaysApplies: alwaysApplies,
              pri: _0x223a08,
              displaced: _0x40d50a
            };
            if (_0x40d50a) {
              _0x3d154e += `${_0x3d154e ? " " : ""}(Overrides ${_0x40d50a})`;
            }
          }
        }
      }
    }
    _0x248898.push({
      key: _0x6e074a,
      name: _0x180ce1,
      shortName: _0xa20a22 || _0x180ce1,
      icon: _0xc9bc50,
      dates: len > 1 ? `${_0x5b2a7f} to ${addDays(_0x5b2a7f, len - 1)}` : _0x5b2a7f,
      rule: (_0x5485a5 ? `Custom (${_0x4146c5})` : _0x4146c5) + (_0x3d154e ? " " + _0x3d154e.trim() : ""),
      owner: _0x5af7a9,
      disabled: _0xafe1bc,
      fixed: fixed,
      defaultOwner: _0xd6fca9,
      conflict: _0x3d154e
    });
  }
  if (isValidMonthDay(state.bdayChildM, state.bdayChildD)) {
    _0x36b446({
      key: "bdayChild",
      startStr: clampedDateStr(_0x1dbdcb, Number(state.bdayChildM), Number(state.bdayChildD)),
      defaultOwner: "both",
      label: childBirthdayLabel(),
      shortName: childBirthdayLabel(),
      icon: "🎂",
      kind: "birthday",
      ruleDesc: "All Together (Shared)",
      fixed: true,
      alwaysApplies: true
    });
  }
  if (isValidMonthDay(state.bdayP2M, state.bdayP2D)) {
    _0x36b446({
      key: "bdayP2",
      startStr: clampedDateStr(_0x1dbdcb, Number(state.bdayP2M), Number(state.bdayP2D)),
      defaultOwner: "p2",
      label: `${_0x3222ac}'s Birthday`,
      shortName: `${_0x3222ac}'s B-Day`,
      icon: "🎁",
      kind: "birthday",
      ruleDesc: `Always ${_0x3222ac}`,
      fixed: true,
      alwaysApplies: true
    });
  }
  if (isValidMonthDay(state.bdayP1M, state.bdayP1D)) {
    _0x36b446({
      key: "bdayP1",
      startStr: clampedDateStr(_0x1dbdcb, Number(state.bdayP1M), Number(state.bdayP1D)),
      defaultOwner: "p1",
      label: `${_0x5ce627}'s Birthday`,
      shortName: `${_0x5ce627}'s B-Day`,
      icon: "🎉",
      kind: "birthday",
      ruleDesc: `Always ${_0x5ce627}`,
      fixed: true,
      alwaysApplies: true
    });
  }
  _0x36b446({
    key: "newyears",
    startStr: dateStr(_0x1dbdcb, 0, 1),
    defaultOwner: rotationOwner(_0x1dbdcb - 1, "B"),
    label: "New Year's Day",
    shortName: "New Year's Day",
    icon: "🎆",
    kind: "holiday",
    ruleDesc: `Alternating (${_0x1dbdcb - 1} New Year)`
  });
  _0x36b446({
    key: "prevWB2",
    startStr: dateStr(_0x1dbdcb, 0, 1),
    len: 2,
    defaultOwner: rotationOwner(_0x1dbdcb - 1, "B"),
    label: "Winter Break (Jan 1–2)",
    shortName: "Jan 1–2 Break",
    icon: "❄️",
    kind: "break",
    ruleDesc: `Alternating (${_0x1dbdcb - 1} 2nd Half)`
  });
  _0x36b446({
    key: "mlk",
    startStr: nthWeekday(_0x1dbdcb, 0, 1, 3),
    defaultOwner: rotationOwner(_0x1dbdcb, "A"),
    label: "MLK Jr. Day",
    shortName: "MLK Day",
    icon: "★",
    kind: "holiday",
    ruleDesc: "Alternating (Group A)"
  });
  _0x36b446({
    key: "pres",
    startStr: nthWeekday(_0x1dbdcb, 1, 1, 3),
    defaultOwner: rotationOwner(_0x1dbdcb, "B"),
    label: "Presidents' Day",
    shortName: "Presidents' Day",
    icon: "★",
    kind: "holiday",
    ruleDesc: "Alternating (Group B)"
  });
  _0x36b446({
    key: "springBreak",
    startStr: _0x408e6a,
    len: 7,
    defaultOwner: rotationOwner(_0x1dbdcb, "A"),
    label: "Spring Break (1 Week)",
    shortName: "Spring Break",
    icon: "🌷",
    kind: "break",
    ruleDesc: "Alternating (Group A)"
  });
  _0x36b446({
    key: "easter",
    startStr: easterDate(_0x1dbdcb),
    defaultOwner: rotationOwner(_0x1dbdcb, "B"),
    label: "Easter Sunday",
    shortName: "Easter",
    icon: "🐣",
    kind: "holiday",
    ruleDesc: "Alternating (Group B)"
  });
  const _0x1957bf = appreciationDayDefault("mothersDay");
  _0x36b446({
    key: "mothersDay",
    startStr: nthWeekday(_0x1dbdcb, 4, 0, 2),
    defaultOwner: _0x1957bf,
    label: "Mother's Day",
    shortName: "Mother's Day",
    icon: "💐",
    kind: "holiday",
    ruleDesc: _0x1957bf === "both" ? "Together" : `Assigned ${ownerLabel(_0x1957bf)}`,
    alwaysApplies: true
  });
  _0x36b446({
    key: "memorial",
    startStr: nthWeekday(_0x1dbdcb, 4, 1, -1),
    defaultOwner: rotationOwner(_0x1dbdcb, "A"),
    label: "Memorial Day",
    shortName: "Memorial Day",
    icon: "★",
    kind: "holiday",
    ruleDesc: "Alternating (Group A)"
  });
  const _0x568c17 = appreciationDayDefault("fathersDay");
  _0x36b446({
    key: "fathersDay",
    startStr: nthWeekday(_0x1dbdcb, 5, 0, 3),
    defaultOwner: _0x568c17,
    label: "Father's Day",
    shortName: "Father's Day",
    icon: "👔",
    kind: "holiday",
    ruleDesc: _0x568c17 === "both" ? "Together" : `Assigned ${ownerLabel(_0x568c17)}`,
    alwaysApplies: true
  });
  _0x36b446({
    key: "juneteenth",
    startStr: dateStr(_0x1dbdcb, 5, 19),
    defaultOwner: rotationOwner(_0x1dbdcb, "A"),
    label: "Juneteenth",
    shortName: "Juneteenth",
    icon: "✊",
    kind: "holiday",
    ruleDesc: "Alternating (Group A)"
  });
  _0x36b446({
    key: "july4",
    startStr: dateStr(_0x1dbdcb, 6, 4),
    defaultOwner: rotationOwner(_0x1dbdcb, "B"),
    label: "Independence Day (Jul 4)",
    shortName: "July 4th",
    icon: "🎆",
    kind: "holiday",
    ruleDesc: "Alternating (Group B)"
  });
  _0x36b446({
    key: "parentsDay",
    startStr: nthWeekday(_0x1dbdcb, 6, 0, 4),
    defaultOwner: "both",
    label: "National Parents' Day",
    shortName: "Parents' Day",
    icon: "💛",
    kind: "holiday",
    ruleDesc: "Inclusive Day",
    alwaysApplies: true
  });
  _0x36b446({
    key: "labor",
    startStr: nthWeekday(_0x1dbdcb, 8, 1, 1),
    defaultOwner: rotationOwner(_0x1dbdcb, "A"),
    label: "Labor Day",
    shortName: "Labor Day",
    icon: "★",
    kind: "holiday",
    ruleDesc: "Alternating (Group A)"
  });
  _0x36b446({
    key: "indigenousDay",
    startStr: nthWeekday(_0x1dbdcb, 9, 1, 2),
    defaultOwner: rotationOwner(_0x1dbdcb, "B"),
    label: "Indigenous Peoples' Day",
    shortName: "Indigenous Day",
    icon: "🌎",
    kind: "holiday",
    ruleDesc: "Alternating (Group B)"
  });
  _0x36b446({
    key: "halloween",
    startStr: dateStr(_0x1dbdcb, 9, 31),
    defaultOwner: rotationOwner(_0x1dbdcb, "B"),
    label: "Halloween",
    shortName: "Halloween",
    icon: "🎃",
    kind: "holiday",
    ruleDesc: "Alternating (Group B)"
  });
  _0x36b446({
    key: "vets",
    startStr: dateStr(_0x1dbdcb, 10, 11),
    defaultOwner: rotationOwner(_0x1dbdcb, "A"),
    label: "Veterans Day",
    shortName: "Veterans Day",
    icon: "★",
    kind: "holiday",
    ruleDesc: "Alternating (Group A)"
  });
  const _0x242d0a = nthWeekday(_0x1dbdcb, 10, 4, 4);
  _0x36b446({
    key: "thanksgiving",
    startStr: addDays(_0x242d0a, -1),
    len: 5,
    defaultOwner: rotationOwner(_0x1dbdcb, "B"),
    label: "Thanksgiving Break (Wed–Sun)",
    shortName: "Thanksgiving",
    icon: "🦃",
    kind: "break",
    ruleDesc: "Alternating (Group B)"
  });
  _0x36b446({
    key: "xmasEve",
    startStr: dateStr(_0x1dbdcb, 11, 24),
    defaultOwner: rotationOwner(_0x1dbdcb, "A"),
    label: "Christmas Eve",
    shortName: "Christmas Eve",
    icon: "🎄",
    kind: "holiday",
    ruleDesc: "Alternating (Group A)"
  });
  _0x36b446({
    key: "christmas",
    startStr: dateStr(_0x1dbdcb, 11, 25),
    defaultOwner: rotationOwner(_0x1dbdcb, "A"),
    label: "Christmas Day",
    shortName: "Christmas",
    icon: "🎄",
    kind: "holiday",
    ruleDesc: "Alternating (Group A)"
  });
  _0x36b446({
    key: "wb1",
    startStr: dateStr(_0x1dbdcb, 11, 20),
    len: 7,
    defaultOwner: rotationOwner(_0x1dbdcb, "A"),
    label: "Winter Break (1st Half)",
    shortName: "Winter Brk 1",
    icon: "🎄",
    kind: "break",
    ruleDesc: "Alternating (Group A)"
  });
  _0x36b446({
    key: "wb2",
    startStr: dateStr(_0x1dbdcb, 11, 27),
    len: 5,
    defaultOwner: rotationOwner(_0x1dbdcb, "B"),
    label: "Winter Break (2nd Half)",
    shortName: "Winter Brk 2",
    icon: "❄️",
    kind: "break",
    ruleDesc: "Alternating (Group B)"
  });
  _0x36b446({
    key: "nye",
    startStr: dateStr(_0x1dbdcb, 11, 31),
    defaultOwner: rotationOwner(_0x1dbdcb, "B"),
    label: "New Year's Eve",
    shortName: "New Year's Eve",
    icon: "🎇",
    kind: "holiday",
    ruleDesc: "Alternating (Group B)"
  });
  (state.customHolidays || []).forEach(_0x2e904f => {
    let _0x1ae75e = "both";
    let _0x1e7fc2 = "Together (50/50)";
    if (_0x2e904f.rule === "p1") {
      _0x1ae75e = "p1";
      _0x1e7fc2 = `Always ${_0x5ce627}`;
    } else if (_0x2e904f.rule === "p2") {
      _0x1ae75e = "p2";
      _0x1e7fc2 = `Always ${_0x3222ac}`;
    } else if (_0x2e904f.rule === "altA") {
      _0x1ae75e = rotationOwner(_0x1dbdcb, "A");
      _0x1e7fc2 = "Alternating (Group A)";
    } else if (_0x2e904f.rule === "altB") {
      _0x1ae75e = rotationOwner(_0x1dbdcb, "B");
      _0x1e7fc2 = "Alternating (Group B)";
    }
    _0x36b446({
      key: "cust_" + _0x2e904f.id,
      startStr: clampedDateStr(_0x1dbdcb, Number(_0x2e904f.m), Number(_0x2e904f.d)),
      defaultOwner: _0x1ae75e,
      label: _0x2e904f.name,
      shortName: _0x2e904f.name,
      icon: (_0x2e904f.emoji || "✨").trim() || "✨",
      kind: "holiday",
      ruleDesc: _0x1e7fc2
    });
  });
  return {
    map: _0xd21ec4,
    summaryRows: _0x248898
  };
}

function schoolEventMap(_0xfed5d8) {
  const _0x280b52 = {};
  (state.schoolCustomEvents || []).forEach(_0x19a90d => {
    if (!_0x19a90d.startDate) {
      return;
    }
    const _0x589550 =
      _0x19a90d.endDate && _0x19a90d.endDate >= _0x19a90d.startDate ? _0x19a90d.endDate : _0x19a90d.startDate;
    let _0x56ef24 = _0x19a90d.startDate;
    for (let _0x22d9f6 = 0; _0x22d9f6 < 60 && _0x56ef24 <= _0x589550; _0x22d9f6++) {
      if (_0x56ef24.startsWith(`${_0xfed5d8}-`)) {
        _0x280b52[_0x56ef24] = _0x19a90d;
      }
      _0x56ef24 = addDays(_0x56ef24, 1);
    }
  });
  return _0x280b52;
}

function resolveDay(_0x1913ce, _0x3361ed, _0x503568, _0x42d938, _0x174ac9) {
  const _0x4f60eb = dateStr(_0x1913ce, _0x3361ed, _0x503568);
  if (state.overrides[_0x4f60eb]) {
    return {
      owner: state.overrides[_0x4f60eb],
      source: "override"
    };
  }
  if (_0x42d938[_0x4f60eb]) {
    return {
      owner: _0x42d938[_0x4f60eb].owner,
      source: "special",
      special: _0x42d938[_0x4f60eb]
    };
  }
  const _0x29929a = _0x174ac9[_0x4f60eb];
  if (_0x29929a && (_0x29929a.kind === "p1" || _0x29929a.kind === "p2")) {
    return {
      owner: _0x29929a.kind,
      source: "schoolEv",
      schoolEv: _0x29929a
    };
  }
  const _0x5172da = state.summerEnabled && (_0x3361ed === 5 || _0x3361ed === 6 || (_0x3361ed === 7 && _0x503568 <= 14));
  if (_0x5172da) {
    if (summerWeekSelected(_0x3361ed, _0x503568)) {
      return {
        owner: "p1",
        source: "summerP1"
      };
    }
    if (state.summerRestP2 && !state.scheduleUnset) {
      return {
        owner: "p2",
        source: "summerP2"
      };
    }
  }
  return {
    owner: baseOwner(_0x1913ce, _0x3361ed, _0x503568),
    source: "base"
  };
}

function buildYear(_0x5d23a8) {
  const { map: _0x10bb4a, summaryRows: _0x4c7a92 } = buildHolidays(_0x5d23a8);
  const _0x5b36ea = schoolEventMap(_0x5d23a8);
  const { schoolEnd: _0x26e580, schoolStart: _0x1de331 } = schoolDatesFor(_0x5d23a8);
  const _0x249d6e = p1Name();
  const _0x550d37 = p2Name();
  const _0x12333c = (state.summerEmoji || "🌻").trim() || "🌻";
  const _0x25295f = [];
  let _0x45425f = resolveDay(
    _0x5d23a8 - 1,
    11,
    31,
    buildHolidays(_0x5d23a8 - 1).map,
    schoolEventMap(_0x5d23a8 - 1)
  ).owner;
  for (let _0x381ed1 = 0; _0x381ed1 < 12; _0x381ed1++) {
    for (let _0x225529 = 1; _0x225529 <= daysInMonth(_0x5d23a8, _0x381ed1); _0x225529++) {
      const _0x11c3d0 = dateStr(_0x5d23a8, _0x381ed1, _0x225529);
      const _0x21a927 = noonDate(_0x5d23a8, _0x381ed1, _0x225529).getDay();
      const _0x435f03 = resolveDay(_0x5d23a8, _0x381ed1, _0x225529, _0x10bb4a, _0x5b36ea);
      const _0x32b99d = _0x435f03.owner;
      const _0xee33ba = _0x5b36ea[_0x11c3d0];
      const _0x33fadb = _0x381ed1 === 5 || _0x381ed1 === 6 || (_0x381ed1 === 7 && _0x225529 <= 14);
      const _0x20da43 = _0x11c3d0 > _0x26e580 && _0x11c3d0 < _0x1de331;
      let _0x31b0db = _0x32b99d === "none" ? "Not assigned yet" : `Base (${ownerLabel(_0x32b99d)})`;
      let _0x3e53a2 = "";
      let _0x28cdf4 = false;
      let _0x2ac0bc = false;
      let _0x19f449 = "";
      if (_0x435f03.source === "override") {
        _0x31b0db = "Custom Override";
        _0x2ac0bc = true;
      } else if (_0x435f03.source === "special") {
        _0x31b0db = _0x435f03.special.label;
        _0x3e53a2 = _0x435f03.special.icon;
        _0x28cdf4 = true;
      } else if (_0x435f03.source === "schoolEv") {
        _0x31b0db = _0x435f03.schoolEv.title || "No School";
        _0x3e53a2 = "🏫";
      } else if (_0x435f03.source === "summerP1") {
        _0x31b0db = `${_0x249d6e} Summer Week`;
        _0x3e53a2 = _0x12333c;
      } else if (_0x435f03.source === "summerP2") {
        _0x31b0db = `${_0x550d37} Summer Time`;
        _0x3e53a2 = _0x12333c;
      }
      if (
        state.showSplitDays &&
        !_0x28cdf4 &&
        !_0x2ac0bc &&
        _0x32b99d !== "both" &&
        _0x45425f !== "both" &&
        _0x32b99d !== "none" &&
        _0x45425f !== "none" &&
        _0x32b99d !== _0x45425f
      ) {
        _0x19f449 = _0x32b99d === "p1" ? "p2-to-p1" : "p1-to-p2";
        _0x31b0db = `${ownerLabel(_0x45425f)} → ${ownerLabel(_0x32b99d)}`;
      }
      _0x45425f = _0x32b99d;
      let _0x3b89ea = "weekend";
      let _0x3aed7f = "";
      if (_0xee33ba) {
        _0x3aed7f = _0xee33ba.title || (_0xee33ba.kind === "halfday" ? "Half-Day" : "No School");
        _0x3b89ea = _0xee33ba.kind === "halfday" ? "school" : "break";
        if (!_0x3e53a2 && _0xee33ba.kind === "halfday") {
          _0x3e53a2 = "⏰";
        }
      } else if (_0x435f03.special && _0x435f03.special.kind === "break") {
        _0x3b89ea = "break";
      } else if (_0x20da43 || (state.summerEnabled && _0x33fadb)) {
        _0x3b89ea = "summer";
      } else if (_0x435f03.special && _0x435f03.special.kind === "holiday") {
        _0x3b89ea = "holiday";
      } else if (_0x21a927 >= 1 && _0x21a927 <= 5) {
        _0x3b89ea = "school";
      }
      _0x25295f.push({
        ds: _0x11c3d0,
        y: _0x5d23a8,
        m0: _0x381ed1,
        d: _0x225529,
        dow: _0x21a927,
        owner: _0x32b99d,
        reason: _0x31b0db,
        icon: _0x3e53a2,
        isHoliday: _0x28cdf4,
        isOverride: _0x2ac0bc,
        splitType: _0x19f449,
        schoolStatus: _0x3b89ea,
        customSchoolLabel: _0x3aed7f
      });
    }
  }
  return {
    days: _0x25295f,
    summaryRows: _0x4c7a92
  };
}

function yearTotals(_0x1cbbce) {
  const { days: _0x4dfb44 } = buildYear(_0x1cbbce);
  let _0x18d396 = 0;
  let _0xe5f9e1 = 0;
  let _0x313a4d = 0;
  _0x4dfb44.forEach(_0x3bd179 => {
    if (_0x3bd179.owner === "p1") {
      _0x18d396++;
    } else if (_0x3bd179.owner === "p2") {
      _0xe5f9e1++;
    } else if (_0x3bd179.owner === "none") {
    } else {
      _0x313a4d++;
      _0x18d396 += 0.5;
      _0xe5f9e1 += 0.5;
    }
  });
  return {
    p1: _0x18d396,
    p2: _0xe5f9e1,
    both: _0x313a4d,
    total: _0x4dfb44.length
  };
}
