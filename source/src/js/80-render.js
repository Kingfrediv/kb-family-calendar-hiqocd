function kbKeepFocus(draw) {
  const a = document.activeElement;
  const fk = a && a.dataset ? a.dataset.fk : "";
  draw();
  if (fk && (!document.activeElement || document.activeElement === document.body)) {
    const el = [...document.querySelectorAll("[data-fk]")].find(e => e.dataset.fk === fk);
    if (el) {
      el.focus({
        preventScroll: true
      });
    }
  }
}

function drawPicker() {
  kbKeepFocus(drawPickerNow);
}

function drawSummer() {
  kbKeepFocus(drawSummerNow);
}

function render() {
  kbKeepFocus(renderNow);
}

function drawPickerNow() {
  const _0x112075 = p1Name();
  const _0x16c715 = p2Name();
  const _0x1f0d2a = document.getElementById("baseDayPickerContainer");
  _0x1f0d2a.innerHTML = "";
  document.getElementById("biweeklyAnchorWrap").style.display = state.baseMode === "biweekly" ? "block" : "none";
  const _0x476d65 = state.weekStartsMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  function _0x126bfc(_0x1bc371, _0x21ea5c, _0x19a244, _0x129f10) {
    if (_0x19a244) {
      const _0x934128 = document.createElement("div");
      _0x934128.className = "picker-row-label";
      _0x934128.textContent = _0x19a244;
      _0x1f0d2a.appendChild(_0x934128);
    }
    const _0x3402f9 = document.createElement("div");
    _0x3402f9.className = "day-picker-grid";
    for (let _0x1b4182 = 0; _0x1b4182 < 7; _0x1b4182++) {
      const _0x270cca = _0x476d65[_0x1b4182];
      const _0x181c2f = _0x21ea5c + _0x270cca;
      const _0x2211b3 = _0x129f10(_0x1b4182, _0x270cca, _0x21ea5c);
      const _0x1def4b = !!_0x1bc371[_0x181c2f];
      const _0x5eefda = !!_0x1bc371[_0x2211b3];
      const _0xe4067e = state.showSplitDays && _0x1def4b !== _0x5eefda;
      const _0x1c5256 = document.createElement("button");
      _0x1c5256.className =
        "dp-tile " +
        (state.scheduleUnset
          ? "none"
          : _0xe4067e
            ? _0x1def4b
              ? "split-p2-to-p1"
              : "split-p1-to-p2"
            : _0x1def4b
              ? "p1"
              : "p2");
      const _0x5c74bd = _0x1def4b ? _0x112075 : _0x16c715;
      const _0x370169 = _0x5eefda ? _0x112075 : _0x16c715;
      _0x1c5256.innerHTML = `${DOW_2[_0x270cca]}<span class="dp-sub">${esc(state.scheduleUnset ? "—" : _0xe4067e ? `→ ${_0x5c74bd}` : _0x5c74bd)}</span>`;
      _0x1c5256.type = "button";
      _0x1c5256.dataset.fk = "dp:" + _0x181c2f;
      _0x1c5256.setAttribute("aria-pressed", !state.scheduleUnset && _0x1def4b ? "true" : "false");
      _0x1c5256.setAttribute(
        "aria-label",
        state.scheduleUnset ? `${DOW_3[_0x270cca]}: not set` : `${DOW_3[_0x270cca]}: overnight with ${_0x5c74bd}`
      );
      _0x1c5256.title = _0xe4067e
        ? `${DOW_3[_0x270cca]}: Morning ${_0x370169} → Overnight ${_0x5c74bd}`
        : `${DOW_3[_0x270cca]}: Full day & overnight with ${_0x5c74bd}`;
      _0x1c5256.onclick = () => {
        if (state.scheduleUnset) {
          markScheduleSet();
          _0x1bc371[_0x181c2f] = true;
        } else {
          _0x1bc371[_0x181c2f] = !_0x1bc371[_0x181c2f];
        }
        save();
        drawPicker();
        render();
      };
      _0x3402f9.appendChild(_0x1c5256);
    }
    _0x1f0d2a.appendChild(_0x3402f9);
  }
  let _0x21fbbd = 0;
  let _0x459b2d = 7;
  if (state.baseMode === "weekly") {
    _0x126bfc(state.baseWeekly, 0, "Weekly Pattern", (_0xce00c7, _0x278ffb) => (_0x278ffb - 1 + 7) % 7);
    _0x21fbbd = state.baseWeekly.filter(Boolean).length;
    _0x459b2d = 7;
  } else if (state.baseMode === "biweekly") {
    _0x126bfc(state.baseBiweekly, 0, "Week 1", _0x33df5d => {
      const _0x3b3e85 = (_0x33df5d - 1 + 7) % 7;
      const _0x5a1f57 = _0x33df5d === 0 ? 1 : 0;
      return _0x5a1f57 * 7 + _0x476d65[_0x3b3e85];
    });
    _0x126bfc(state.baseBiweekly, 7, "Week 2", _0x36dc56 => {
      const _0x38eae0 = (_0x36dc56 - 1 + 7) % 7;
      const _0x74c0c9 = _0x36dc56 === 0 ? 0 : 1;
      return _0x74c0c9 * 7 + _0x476d65[_0x38eae0];
    });
    _0x21fbbd = state.baseBiweekly.filter(Boolean).length;
    _0x459b2d = 14;
  } else if (state.baseMode === "cycle") {
    // any number of nights that repeat: one tile per night of the cycle
    const heading = document.createElement("div");
    heading.className = "picker-row-label";
    heading.textContent = `Repeating ${state.cycleLength}-day cycle`;
    _0x1f0d2a.appendChild(heading);
    const grid = document.createElement("div");
    grid.className = "day-picker-grid";
    for (let i = 0; i < state.cycleLength; i++) {
      const mine = !!state.baseCycle[i];
      const owner = mine ? _0x112075 : _0x16c715;
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "dp-tile " + (state.scheduleUnset ? "none" : mine ? "p1" : "p2");
      tile.dataset.fk = "cy:" + i;
      tile.innerHTML = `Day ${i + 1}<span class="dp-sub">${esc(state.scheduleUnset ? "—" : owner)}</span>`;
      tile.setAttribute("aria-pressed", !state.scheduleUnset && mine ? "true" : "false");
      tile.setAttribute("aria-label", state.scheduleUnset ? `Day ${i + 1}: not set` : `Day ${i + 1}: overnight with ${owner}`);
      tile.title = `Day ${i + 1} of the cycle: ${state.scheduleUnset ? "not set" : owner}`;
      tile.onclick = () => {
        if (state.scheduleUnset) {
          markScheduleSet();
          state.baseCycle[i] = true;
        } else {
          state.baseCycle[i] = !state.baseCycle[i];
        }
        save();
        drawPicker();
        render();
      };
      grid.appendChild(tile);
    }
    _0x1f0d2a.appendChild(grid);
    _0x21fbbd = state.baseCycle.filter(Boolean).length;
    _0x459b2d = state.cycleLength;
  } else {
    const _0x59a0a1 = [
      "1st Week (Days 1–7)",
      "2nd Week (Days 8–14)",
      "3rd Week (Days 15–21)",
      "4th Week (Days 22–28)",
      "5th Week (Days 29–31)"
    ];
    for (let _0x222eb0 = 0; _0x222eb0 < 5; _0x222eb0++) {
      _0x126bfc(
        state.baseMonthly,
        _0x222eb0 * 7,
        _0x59a0a1[_0x222eb0],
        (_0x3e01e6, _0x3dbf02) => (_0x222eb0 * 7 + _0x3dbf02 - 1 + 35) % 35
      );
    }
    _0x21fbbd = 0;
    _0x459b2d = 0;
    for (let _0x5cbf7e = 0; _0x5cbf7e < 12; _0x5cbf7e++) {
      for (let _0x159815 = 1; _0x159815 <= daysInMonth(state.year, _0x5cbf7e); _0x159815++) {
        _0x459b2d++;
        if (
          state.baseMonthly[(Math.ceil(_0x159815 / 7) - 1) * 7 + noonDate(state.year, _0x5cbf7e, _0x159815).getDay()]
        ) {
          _0x21fbbd++;
        }
      }
    }
  }
  const _0x34c315 = _0x459b2d - _0x21fbbd;
  const _0x3260f1 = ((_0x21fbbd / _0x459b2d) * 100).toFixed(1);
  const _0x8d3aad = (100 - Number(_0x3260f1)).toFixed(1);
  document.getElementById("baseSplitBar").innerHTML = state.scheduleUnset
    ? `Base: <b>not set yet</b> — pick a preset or tap a day to give it to ${esc(_0x112075)}.`
    : `Base: <b>${esc(_0x112075)}</b> ${_0x21fbbd}/${_0x459b2d} (${_0x3260f1}%) • <b>${esc(_0x16c715)}</b> ${_0x34c315}/${_0x459b2d} (${_0x8d3aad}%)`;
}

// which summer window the week buttons were last drawn for, so a change of window (also by Undo) redraws them
let drawnSummerKey = "";
function drawSummerNow() {
  drawnSummerKey = state.summerStart + ">" + state.summerEnd;
  const box = document.getElementById("summerMonths");
  box.innerHTML = "";
  const chips = summerChips();
  [...new Set(chips.map(c => c.month))].forEach(month => {
    const inMonth = chips.filter(c => c.month === month);
    const picked = inMonth.filter(c => state.summerSelected[c.id]).length;
    const first = inMonth[0].start;
    const last = inMonth[inMonth.length - 1].end;
    const partial = first > 1 || last < daysInMonth(2025, month);
    const group = document.createElement("div");
    group.className = "control-group";
    const label = document.createElement("label");
    label.innerHTML = `${esc(MONTH_NAMES[month])}${partial ? ` ${first}–${last}` : ""} (<span class="lbl-p1">${esc(p1Name())}</span>) <span class="week-status ok">${picked} selected</span>`;
    const grid = document.createElement("div");
    grid.className = "week-grid";
    inMonth.forEach(chip => {
      const on = !!state.summerSelected[chip.id];
      const button = document.createElement("button");
      button.className = "week-chip" + (on ? " selected" : "");
      button.textContent = chip.label;
      button.type = "button";
      button.dataset.fk = "wk:" + chip.id;
      button.setAttribute("aria-pressed", on ? "true" : "false");
      button.onclick = () => {
        state.summerSelected[chip.id] = !state.summerSelected[chip.id];
        save();
        drawSummer();
        render();
      };
      grid.appendChild(button);
    });
    group.appendChild(label);
    group.appendChild(grid);
    box.appendChild(group);
  });
}
function drawCustomHolidayList() {
  const _0x2bdab1 = document.getElementById("customHolList");
  _0x2bdab1.innerHTML = "";
  (state.customHolidays || []).forEach(_0x4a22ff => {
    const _0x13621c = document.createElement("div");
    _0x13621c.className = "list-row";
    _0x13621c.innerHTML = `<span>${esc(_0x4a22ff.emoji || "✨")} <strong>${esc(_0x4a22ff.name)}</strong> (${esc(MONTH_SHORT[_0x4a22ff.m])} ${esc(_0x4a22ff.d)})</span>`;
    const _0x1d726b = document.createElement("button");
    _0x1d726b.className = "btn btn-sm";
    _0x1d726b.textContent = "✕";
    _0x1d726b.type = "button";
    _0x1d726b.setAttribute("aria-label", "Remove " + _0x4a22ff.name);
    _0x1d726b.onclick = () => {
      state.customHolidays = state.customHolidays.filter(_0x51f6d3 => _0x51f6d3.id !== _0x4a22ff.id);
      save();
      drawCustomHolidayList();
      render();
    };
    _0x13621c.appendChild(_0x1d726b);
    _0x2bdab1.appendChild(_0x13621c);
  });
}

function drawSchoolEventList() {
  const _0x456d48 = document.getElementById("sidebarSchoolList");
  _0x456d48.innerHTML = "";
  (state.schoolCustomEvents || []).forEach(_0x4b6e8a => {
    const _0x261167 = document.createElement("div");
    _0x261167.className = "list-row";
    const _0x12aece =
      _0x4b6e8a.endDate && _0x4b6e8a.endDate > _0x4b6e8a.startDate
        ? `${_0x4b6e8a.startDate}–${_0x4b6e8a.endDate}`
        : _0x4b6e8a.startDate;
    _0x261167.innerHTML = `<span><strong>${esc(_0x4b6e8a.title || "No School")}</strong> (${esc(_0x12aece)})</span>`;
    const _0x40274c = document.createElement("button");
    _0x40274c.className = "btn btn-sm";
    _0x40274c.textContent = "✕";
    _0x40274c.type = "button";
    _0x40274c.setAttribute("aria-label", "Remove " + (_0x4b6e8a.title || "No School"));
    _0x40274c.onclick = () => {
      state.schoolCustomEvents = state.schoolCustomEvents.filter(_0x3bd456 => _0x3bd456.id !== _0x4b6e8a.id);
      save();
      drawSchoolEventList();
      render();
    };
    _0x261167.appendChild(_0x40274c);
    _0x456d48.appendChild(_0x261167);
  });
}

function baseScheduleSummary() {
  const _0x2e2acc = p1Name();
  const _0x3ef7de = p2Name();
  if (state.scheduleUnset) {
    return "Not set yet. Choose a schedule preset or tap days in Settings.";
  }
  if (state.baseMode === "weekly") {
    const _0x58605e = DOW_3.filter((_0x1fc5fc, _0x424602) => state.baseWeekly[_0x424602]);
    const _0x2ef6a7 = DOW_3.filter((_0x10e8d8, _0x1810e6) => !state.baseWeekly[_0x1810e6]);
    return `Weekly: <b>${esc(_0x2e2acc)}</b> (${_0x58605e.length ? _0x58605e.join(", ") : "None"}) • <b>${esc(_0x3ef7de)}</b> (${_0x2ef6a7.length ? _0x2ef6a7.join(", ") : "None"}).`;
  }
  if (state.baseMode === "biweekly") {
    const _0x3f9e80 = state.baseBiweekly.slice(0, 7).filter(Boolean).length;
    const _0x15f404 = state.baseBiweekly.slice(7, 14).filter(Boolean).length;
    return `Every 2 Weeks: <b>${esc(_0x2e2acc)}</b> has ${_0x3f9e80} nights in Wk 1 &amp; ${_0x15f404} nights in Wk 2 (anchor: ${esc(state.biweeklyAnchor)}).`;
  }
  if (state.baseMode === "cycle") {
    const mine = state.baseCycle.filter(Boolean).length;
    return `Repeating ${state.cycleLength}-day cycle: <b>${esc(_0x2e2acc)}</b> has ${mine} nights, <b>${esc(_0x3ef7de)}</b> has ${state.cycleLength - mine}. Day 1 is ${esc(state.cycleAnchor)}.`;
  }
  let _0x1a6cee = 0;
  let _0x1057bd = 0;
  for (let _0xe41135 = 0; _0xe41135 < 12; _0xe41135++) {
    for (let _0x58e759 = 1; _0x58e759 <= daysInMonth(state.year, _0xe41135); _0x58e759++) {
      _0x1057bd++;
      if (state.baseMonthly[(Math.ceil(_0x58e759 / 7) - 1) * 7 + noonDate(state.year, _0xe41135, _0x58e759).getDay()]) {
        _0x1a6cee++;
      }
    }
  }
  return `Monthly (1st–5th weeks): <b>${esc(_0x2e2acc)}</b> has ${_0x1a6cee} of ${_0x1057bd} nights in ${state.year}; remaining with <b>${esc(_0x3ef7de)}</b>.`;
}

function renderChrome() {
  {
    const _0x436640 = document.getElementById("notesTextarea");
    if (_0x436640 && !_0x436640.placeholder) {
      _0x436640.placeholder = "Examples:\n" + DEFAULT_NOTES;
    }
  }
  applyColors();
  const _0x54cfb2 = p1Name();
  const _0x5edae2 = p2Name();
  const _0x568810 = childName();
  const _0x5c6c25 = (state.titleEmoji || "🐝").trim() || "🐝";
  const _0x1edcaf = (state.summerEmoji || "🌻").trim() || "🌻";
  const _0x19717d = (state.schoolEmoji || "📚").trim() || "📚";
  document.getElementById("headerTitle").textContent = _0x568810
    ? `${_0x5c6c25} ${_0x568810}'s Parenting Schedule`
    : `${_0x5c6c25} Shared Parenting Schedule`;
  document.getElementById("summaryTitle").textContent = `${_0x5c6c25} Schedule Agreement Summary`;
  document.getElementById("legendSchoolEmoji").textContent = _0x19717d;
  document.getElementById("legendSummerEmoji").textContent = _0x1edcaf;
  document.getElementById("schoolCardEmoji").textContent = _0x19717d;
  document.querySelectorAll(".lbl-p1").forEach(_0x51cdcc => (_0x51cdcc.textContent = _0x54cfb2));
  document.querySelectorAll(".lbl-p2").forEach(_0xb7c922 => (_0xb7c922.textContent = _0x5edae2));
  document.querySelectorAll(".lbl-child").forEach(_0x21f418 => (_0x21f418.textContent = _0x568810 || "Child"));
  document.querySelectorAll(".lbl-yr").forEach(_0x5666a0 => (_0x5666a0.textContent = state.year));
  document
    .querySelectorAll(".lbl-child-bday")
    .forEach(
      _0x285182 =>
        (_0x285182.textContent = isValidMonthDay(state.bdayChildM, state.bdayChildD)
          ? ` (${childBirthdayLabel()})`
          : "")
    );
  setInputValue("childNameInput", state.childName);
  setInputValue("p1NameInput", state.p1Name);
  setInputValue("p2NameInput", state.p2Name);
  setInputValue("p1ColorInput", state.p1Color);
  setInputValue("p2ColorInput", state.p2Color);
  setInputValue("headerColorInput", state.headerColor);
  setInputValue("titleEmojiInput", state.titleEmoji);
  setInputValue("summerEmojiInput", state.summerEmoji);
  setInputValue("schoolEmojiInput", state.schoolEmoji);
  setInputValue("biweeklyAnchorInput", state.biweeklyAnchor);
  const _0x46433a = _0x3a7e6c => (_0x3a7e6c == null ? "" : String(_0x3a7e6c));
  document.getElementById("bdayChildMonth").value = _0x46433a(state.bdayChildM);
  document.getElementById("bdayChildDay").value = _0x46433a(state.bdayChildD);
  document.getElementById("bdayP1Month").value = _0x46433a(state.bdayP1M);
  document.getElementById("bdayP1Day").value = _0x46433a(state.bdayP1D);
  document.getElementById("bdayP2Month").value = _0x46433a(state.bdayP2M);
  document.getElementById("bdayP2Day").value = _0x46433a(state.bdayP2D);
  const _0x3df89a = document.getElementById("addSchoolKind");
  _0x3df89a.options[2].text = `No School (With ${_0x54cfb2})`;
  _0x3df89a.options[3].text = `No School (With ${_0x5edae2})`;
  const _0x1aa031 = document.getElementById("customHolRule");
  _0x1aa031.options[3].text = `Always ${_0x54cfb2}`;
  _0x1aa031.options[4].text = `Always ${_0x5edae2}`;
  yearSelect.value = state.year;
  document.getElementById("headerYearBadge").textContent = state.year;
  document.getElementById("btnPrevYear").innerHTML = `&larr; ${state.year - 1}`;
  document.getElementById("btnNextYear").innerHTML = `${state.year + 1} &rarr;`;
  document.getElementById("btnPrevYear").disabled = state.year <= MIN_YEAR;
  document.getElementById("btnNextYear").disabled = state.year >= MAX_YEAR;
  const _0x1f6532 = document.getElementById("mothersDayOwnerSelect");
  const _0x2b2292 = document.getElementById("fathersDayOwnerSelect");
  if (_0x1f6532 && document.activeElement !== _0x1f6532) {
    _0x1f6532.value = state.mothersDayOwner || "skip";
  }
  if (_0x2b2292 && document.activeElement !== _0x2b2292) {
    _0x2b2292.value = state.fathersDayOwner || "skip";
  }
  const _0x261911 = document.getElementById("clickCycleHint");
  if (_0x261911) {
    _0x261911.textContent = `Tap a day to see who has it and why, change it, or add a note or plan. Choose “Select several days” there to give a trip or long weekend to ${p1Name()}, ${p2Name()} or both in one go.`;
  }
  const _0x17cdcd = document.getElementById("btnToggleSidebar");
  if (_0x17cdcd) {
    _0x17cdcd.textContent = state.sidebarHidden ? "☰ Customize Schedule" : "✕ Hide Settings";
    _0x17cdcd.setAttribute("aria-label", state.sidebarHidden ? "Show settings" : "Hide settings");
    _0x17cdcd.setAttribute("aria-expanded", state.sidebarHidden ? "false" : "true");
  }
  document.getElementById("headerSubtitle").textContent =
    `${state.year} Parenting Calendar (${_0x54cfb2} & ${_0x5edae2}) • Overnights, Holidays, Breaks & Birthdays`;
  monthSelect.value = state.selectedMonth;
  document.getElementById("modeWeeklyBtn").classList.toggle("active", state.baseMode === "weekly");
  document.getElementById("modeBiweeklyBtn").classList.toggle("active", state.baseMode === "biweekly");
  document.getElementById("modeMonthlyBtn").classList.toggle("active", state.baseMode === "monthly");
  document.getElementById("weekStartSunBtn").classList.toggle("active", !state.weekStartsMonday);
  document.getElementById("weekStartMonBtn").classList.toggle("active", !!state.weekStartsMonday);
  document.getElementById("splitDaysOn").classList.toggle("active", state.showSplitDays);
  document.getElementById("splitDaysOff").classList.toggle("active", !state.showSplitDays);
  document.getElementById("summerOnBtn").classList.toggle("active", state.summerEnabled);
  document.getElementById("summerOffBtn").classList.toggle("active", !state.summerEnabled);
  document.getElementById("summerControlsWrap").style.display = state.summerEnabled ? "block" : "none";
  document.getElementById("summerRestP2Btn").classList.toggle("active", state.summerRestP2);
  document.getElementById("summerRestBaseBtn").classList.toggle("active", !state.summerRestP2);
  document.getElementById("rotStandardBtn").classList.toggle("active", state.evenGroupAP1);
  document.getElementById("rotFlippedBtn").classList.toggle("active", !state.evenGroupAP1);
  document.getElementById("holOverSummerOn").classList.toggle("active", state.holidaysOverrideSummer);
  document.getElementById("holOverSummerOff").classList.toggle("active", !state.holidaysOverrideSummer);
  document.getElementById("viewYearBtn").classList.toggle("active", state.viewMode === "year");
  document.getElementById("viewMonthBtn").classList.toggle("active", state.viewMode === "month");
  document.getElementById("monthPickerWrap").style.display = state.viewMode === "month" ? "block" : "none";
  document.getElementById("mainContainer").classList.toggle("hide-sidebar", !!state.sidebarHidden);
  document.getElementById("btnToggleSidebar").textContent = state.sidebarHidden
    ? "⚙️ Customize Schedule"
    : "✕ Hide Settings";
  setInputValue("timeToP1Input", state.timeToP1);
  setInputValue("timeToP2Input", state.timeToP2);
  setInputValue("timeHolidayInput", state.timeHoliday);
  setInputValue("exchangeLocationInput", state.exchangeLocation);
  setInputValue("summerDeadlineInput", state.summerDeadline);
  setInputValue("schoolNameInput", state.schoolName);
  setInputValue("schoolUrlInput", state.schoolUrl);
  setInputValue("schoolNotesInput", state.schoolNotes);
  const _0x4163eb = document.getElementById("summerFirstPickSelect");
  _0x4163eb.options[0].text = `Alternates (Even: ${_0x54cfb2} / Odd: ${_0x5edae2})`;
  _0x4163eb.options[1].text = `Alternates (Even: ${_0x5edae2} / Odd: ${_0x54cfb2})`;
  _0x4163eb.value = state.summerFirstPick;
  const { schoolEnd: _0x489855, schoolStart: _0xb05700, springBreakStart: _0x4d5822 } = schoolDatesFor(state.year);
  setInputValue("schoolEndInput", _0x489855);
  setInputValue("schoolStartInput", _0xb05700);
  setInputValue("springBreakInput", _0x4d5822);
  const _0x18cd19 = Object.keys(state.overrides).filter(_0xc127ce => _0xc127ce.startsWith(`${state.year}-`)).length;
  document.getElementById("btnResetOverrides").textContent = `Reset Individually Clicked Days (${_0x18cd19})`;
  const _0x1d04e7 =
    Object.keys(state.disabledByYear || {}).filter(_0xf45aba => _0xf45aba.startsWith(`${state.year}:`)).length +
    Object.keys(state.holidayYearOverrides || {}).filter(_0x58d706 => _0x58d706.startsWith(`${state.year}:`)).length;
  document.getElementById("btnResetHolidays").textContent = `Reset Holiday Tiles (${_0x1d04e7})`;
  const _0xa8b3e6 = summerChips()
    .filter(chip => state.summerSelected[chip.id])
    .map(chip => chip.label)
    .join(", ");
  let _0x595f1a = "By mutual agreement";
  const _0x1109a8 = state.year % 2 === 0;
  if (state.summerFirstPick === "evenP1") {
    _0x595f1a = `<b>${esc(_0x1109a8 ? _0x54cfb2 : _0x5edae2)}</b> picks first in ${state.year}`;
  } else if (state.summerFirstPick === "evenP2") {
    _0x595f1a = `<b>${esc(_0x1109a8 ? _0x5edae2 : _0x54cfb2)}</b> picks first in ${state.year}`;
  }
  const _0x46d31c = state.summerEnabled
    ? `<b>${esc(_0x54cfb2)}</b>: ${_0xa8b3e6 || "none selected"} (${state.summerRestP2 ? `rest with ${esc(_0x5edae2)}` : "rest follows base"}). Notice by <b>${esc(state.summerDeadline)}</b> (${_0x595f1a}).`
    : "Base schedule continues through summer.";
  const _0x137f37 = state.holidaysOverrideSummer
    ? "Holidays (incl. Jul 4) override summer &amp; base days."
    : "Summer weeks keep Jul 4 if it falls in a selected week; other holidays override.";
  const _0x3cc9ec = formatMonthDay(state.bdayChildM, state.bdayChildD);
  const _0x10b488 = formatMonthDay(state.bdayP1M, state.bdayP1D);
  const _0x29935f = formatMonthDay(state.bdayP2M, state.bdayP2D);
  const _0x5dfb4b = [];
  if (_0x3cc9ec) {
    _0x5dfb4b.push(`${esc(childBirthdayLabel())} (${_0x3cc9ec}): <b>All Together</b>.`);
  }
  if (_0x29935f) {
    _0x5dfb4b.push(`${esc(_0x5edae2)} (${_0x29935f}): <b>${esc(_0x5edae2)}</b>.`);
  }
  if (_0x10b488) {
    _0x5dfb4b.push(`${esc(_0x54cfb2)} (${_0x10b488}): <b>${esc(_0x54cfb2)}</b>.`);
  }
  const _0x4333fd = _0x1ca7c5 =>
    _0x1ca7c5 && String(_0x1ca7c5).trim() ? `<b>${esc(_0x1ca7c5)}</b>` : "<i>not set</i>";
  const { summaryRows: _0x408d62 } = buildHolidays(state.year);
  const _0x5978da = ["mothersDay", "fathersDay", "parentsDay"]
    .map(_0x17a0c7 => _0x408d62.find(_0x40c9b2 => _0x40c9b2.key === _0x17a0c7))
    .filter(_0x1b7af6 => _0x1b7af6 && !_0x1b7af6.disabled)
    .map(_0x20a0a0 => `${_0x20a0a0.shortName}: <b>${esc(ownerLabel(_0x20a0a0.owner))}</b>`);
  const _0x1872d7 = _0x5978da.length ? _0x5978da.join(" • ") : "No appreciation days active (all skipped)";
  document.getElementById("rulesSummaryBox").innerHTML = `
      <div class="rule-pill-box"><strong>Base Overnight Schedule</strong>${baseScheduleSummary()}</div>
      <div class="rule-pill-box p2-box"><strong>Exchange Times &amp; Location</strong>To ${esc(_0x54cfb2)}: ${_0x4333fd(state.timeToP1)} • To ${esc(_0x5edae2)}: ${_0x4333fd(state.timeToP2)} • Location: ${_0x4333fd(state.exchangeLocation)}.</div>
      <div class="rule-pill-box"><strong>Summer Schedule Layer</strong>${_0x46d31c}</div>
      <div class="rule-pill-box p2-box"><strong>Holidays &amp; School Breaks</strong>Alternating Even/Odd years (Handoff: ${_0x4333fd(state.timeHoliday)}). ${_0x137f37}</div>
      <div class="rule-pill-box"><strong>Birthdays</strong>${_0x5dfb4b.length ? _0x5dfb4b.join(" ") : "No birthdays added yet."}</div>
      <div class="rule-pill-box p2-box"><strong>Parent Appreciation Days</strong>${_0x1872d7}</div>`;
  let _0x4ee978 = `<div><strong>School Year (${state.year}):</strong> Spring ends <b>${esc(_0x489855)}</b> • Fall starts <b>${esc(_0xb05700)}</b> • Spring Break starts <b>${esc(_0x4d5822)}</b></div>`;
  if (state.schoolName) {
    _0x4ee978 += `<div style="margin-top:4px;"><strong>School:</strong> ${esc(state.schoolName)}</div>`;
  }
  if (state.schoolNotes) {
    _0x4ee978 += `<div style="margin-top:4px;white-space:pre-wrap;">${esc(state.schoolNotes)}</div>`;
  }
  if (state.schoolCustomEvents && state.schoolCustomEvents.length) {
    _0x4ee978 +=
      '<div style="margin-top:6px;"><strong>Added School Calendar Dates:</strong><br>' +
      state.schoolCustomEvents
        .map(
          _0x38fcec =>
            `• ${esc(_0x38fcec.endDate && _0x38fcec.endDate > _0x38fcec.startDate ? `${_0x38fcec.startDate} to ${_0x38fcec.endDate}` : _0x38fcec.startDate)}: <b>${esc(_0x38fcec.title || "No School")}</b>`
        )
        .join("<br>") +
      "</div>";
  }
  if (state.schoolUrl && /^https?:\/\//i.test(state.schoolUrl.trim())) {
    _0x4ee978 += `<div><a class="school-link-btn" href="${esc(state.schoolUrl.trim())}" target="_blank" rel="noopener">Open Official School Calendar &nearr;</a></div>`;
  }
  document.getElementById("schoolMainDisplay").innerHTML = _0x4ee978;
  document.getElementById("notesReadonly").textContent = state.agreementNotes || "";
  setInputValue("notesTextarea", state.agreementNotes || "");
  document.getElementById("notesReadonly").style.display = notesEditing ? "none" : "block";
  document.getElementById("notesEditorWrap").style.display = notesEditing ? "block" : "none";
  document.getElementById("btnToggleNotesEdit").textContent = notesEditing ? "Done Editing" : "Edit Notes";
  renderScheduleControls();
  renderCalendarList();
  document.querySelectorAll(".toggle-btn").forEach(b => {
    b.setAttribute("aria-pressed", b.classList.contains("active") ? "true" : "false");
  });
  document.querySelectorAll(".lbl-cyear").forEach(e => {
    e.textContent = new Date().getFullYear();
  });
  kbBannerText();
}

function kbBannerText() {
  const t = document.getElementById("sharedBannerTitle");
  const x = document.getElementById("sharedBannerText");
  if (!t || !x) {
    return;
  }
  const copy = kbIsCopy() && !viewingShared && !pendingShareKind;
  t.textContent = copy ? "You are viewing a shared copy of this schedule." : "You are viewing a shared link.";
  x.textContent = copy
    ? ""
    : "It is not saved in this browser and will not change the calendar already stored on this device.";
  const note = document.getElementById("sharedMessage");
  note.hidden = !incomingShareNote;
  note.textContent = incomingShareNote ? `Message from the sender: “${incomingShareNote}”` : "";
}

// People who were sent a schedule get the calendar first, not the settings.
function kbViewerDefaults() {
  if (isViewOnly() || window.innerWidth <= 768) {
    state.sidebarHidden = true;
  }
  if (window.innerWidth <= 600) {
    state.viewMode = "month";
    const now = new Date();
    if (state.year === now.getFullYear()) {
      state.selectedMonth = now.getMonth();
    }
  }
  lastSavedJson = JSON.stringify(state);
}

function kbShiftMonth(dir) {
  let mo = state.selectedMonth + dir;
  let yr = state.year;
  if (mo < 0) {
    mo = 11;
    yr--;
  } else if (mo > 11) {
    mo = 0;
    yr++;
  }
  if (yr < MIN_YEAR || yr > MAX_YEAR) {
    return;
  }
  state.selectedMonth = mo;
  state.year = yr;
  save({
    nav: true
  });
  render();
}

function renderNow() {
  renderChrome();
  drawPicker();
  markActivePreset();
  const _0x1ee166 = p1Name();
  const _0x527835 = p2Name();
  const _0x64ef20 = (state.schoolEmoji || "📚").trim() || "📚";
  const { days: _0x1d36c1, summaryRows: _0x2d1403 } = buildYear(state.year);
  const _0x3142b2 = _0x1d36c1.length;
  let _0x49b89e = 0;
  let _0x40722f = 0;
  let _0x35b20f = 0;
  _0x1d36c1.forEach(_0x396431 => {
    if (_0x396431.owner === "p1") {
      _0x49b89e++;
    } else if (_0x396431.owner === "p2") {
      _0x40722f++;
    } else if (_0x396431.owner === "none") {
    } else {
      _0x35b20f++;
      _0x49b89e += 0.5;
      _0x40722f += 0.5;
    }
  });
  const _0xb35469 = ((_0x49b89e / _0x3142b2) * 100).toFixed(1);
  const _0xcd742f = ((_0x40722f / _0x3142b2) * 100).toFixed(1);
  document.getElementById("statP1Days").textContent = Number.isInteger(_0x49b89e) ? _0x49b89e : _0x49b89e.toFixed(1);
  document.getElementById("statP1Pct").textContent = `${_0xb35469}% of ${_0x3142b2} nights`;
  document.getElementById("statP2Days").textContent = Number.isInteger(_0x40722f) ? _0x40722f : _0x40722f.toFixed(1);
  document.getElementById("statP2Pct").textContent = `${_0xcd742f}% of ${_0x3142b2} nights`;
  document.getElementById("statBothDays").textContent = _0x35b20f;
  const _0x8db2b4 = yearTotals(state.year + 1);
  const _0x1aba20 = (((_0x49b89e + _0x8db2b4.p1) / (_0x3142b2 + _0x8db2b4.total)) * 100).toFixed(1);
  const _0x6e885c = (((_0x40722f + _0x8db2b4.p2) / (_0x3142b2 + _0x8db2b4.total)) * 100).toFixed(1);
  document.getElementById("statTwoYearAvg").textContent = state.scheduleUnset ? "—" : `${_0x1aba20}% / ${_0x6e885c}%`;
  document.getElementById("statTwoYearSub").textContent =
    `${state.year} + ${state.year + 1} (${_0x1ee166} / ${_0x527835})`;
  const _0x2a517d = _0x49b89e - _0x35b20f * 0.5;
  const _0x31281c = _0x40722f - _0x35b20f * 0.5;
  document.getElementById("barP1").style.width = `${((_0x2a517d / _0x3142b2) * 100).toFixed(1)}%`;
  document.getElementById("barBoth").style.width = `${((_0x35b20f / _0x3142b2) * 100).toFixed(1)}%`;
  document.getElementById("barP2").style.width = `${((_0x31281c / _0x3142b2) * 100).toFixed(1)}%`;
  const _0x46d7e9 = _0x1d36c1
    .filter(_0x11fdfd => _0x11fdfd.owner === "both")
    .map(_0xa8facf => `${MONTH_SHORT[_0xa8facf.m0]} ${_0xa8facf.d}${_0xa8facf.reason ? ` (${_0xa8facf.reason})` : ""}`);
  document.getElementById("statBothSub").textContent = _0x46d7e9.length
    ? `${_0x46d7e9.join("; ")} · Split 0.5 / 0.5 each`
    : "No together days this year";
  const _0x229b2c = document.getElementById("calendarContainer");
  _0x229b2c.innerHTML = "";
  _0x229b2c.className = "months-grid" + (state.viewMode === "month" ? " single-month" : "");
  const _0x37a5b5 = new Date();
  const _0x47e2e8 = dateStr(_0x37a5b5.getFullYear(), _0x37a5b5.getMonth(), _0x37a5b5.getDate());
  const _0x3ec613 = state.viewMode === "month" ? [state.selectedMonth] : [...Array(12).keys()];
  const _0x2e7811 = state.weekStartsMonday ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  const _0xddbd48 = state.weekStartsMonday ? 1 : 0;
  _0x3ec613.forEach(_0x212da5 => {
    const _0x37ecde = _0x1d36c1.filter(_0xecd3fd => _0xecd3fd.m0 === _0x212da5);
    let _0x53e71f = 0;
    let _0x21d756 = 0;
    let _0x38e860 = 0;
    _0x37ecde.forEach(_0x1b8e76 => {
      if (_0x1b8e76.owner === "p1") {
        _0x53e71f++;
      } else if (_0x1b8e76.owner === "p2") {
        _0x21d756++;
      } else if (_0x1b8e76.owner === "none") {
        _0x38e860++;
      } else {
        _0x53e71f += 0.5;
        _0x21d756 += 0.5;
      }
    });
    const _0x40f62c = Math.round((_0x53e71f / _0x37ecde.length) * 100);
    const _0x1a1678 = _0x38e860 ? Math.round((_0x21d756 / _0x37ecde.length) * 100) : 100 - _0x40f62c;
    const _0x10d167 = document.createElement("div");
    _0x10d167.className = "month-card";
    const kbNav = (dir, label, glyph) =>
      state.viewMode === "month"
        ? `<button type="button" class="month-nav no-print" data-fk="mnav:${dir}" data-dir="${dir}" aria-label="${label}">${glyph}</button>`
        : "";
    _0x10d167.innerHTML = `<div class="month-header"><div class="month-title">${kbNav(-1, "Previous month", "‹")}<span>${MONTH_NAMES[_0x212da5]} ${state.year}</span>${kbNav(1, "Next month", "›")}</div><div class="month-stats">${esc(_0x1ee166)} ${_0x53e71f}n (${_0x40f62c}%) • ${esc(_0x527835)} ${_0x21d756}n (${_0x1a1678}%)</div></div>`;
    const _0x1a4139 = document.createElement("div");
    _0x1a4139.className = "cal-grid";
    _0x2e7811.forEach(_0x5e77b7 => {
      const _0x4243ef = document.createElement("div");
      _0x4243ef.className = "dow";
      _0x4243ef.textContent = DOW_2[_0x5e77b7];
      _0x1a4139.appendChild(_0x4243ef);
    });
    const _0x4b10c4 = (_0x37ecde[0].dow - _0xddbd48 + 7) % 7;
    for (let _0x5b5f75 = 0; _0x5b5f75 < _0x4b10c4; _0x5b5f75++) {
      const _0x357822 = document.createElement("div");
      _0x357822.className = "day-cell empty";
      _0x1a4139.appendChild(_0x357822);
    }
    _0x37ecde.forEach(_0x55b6ec => {
      const _0x4d5926 = document.createElement("button");
      _0x4d5926.type = "button";
      let _0x3c1fd2 = `day-cell ${_0x55b6ec.owner}`;
      if (_0x55b6ec.splitType === "p2-to-p1") {
        _0x3c1fd2 = "day-cell split-p2-to-p1";
      } else if (_0x55b6ec.splitType === "p1-to-p2") {
        _0x3c1fd2 = "day-cell split-p1-to-p2";
      }
      if (_0x55b6ec.isHoliday) {
        _0x3c1fd2 += " is-holiday";
      }
      if (_0x55b6ec.isOverride) {
        _0x3c1fd2 += " is-override";
      }
      if (_0x55b6ec.ds === _0x47e2e8) {
        _0x3c1fd2 += " is-today";
      }
      _0x4d5926.className = _0x3c1fd2;
      _0x4d5926.dataset.ds = _0x55b6ec.ds;
      _0x4d5926.dataset.fk = "day:" + _0x55b6ec.ds;
      const dayNote = state.dayNotes[_0x55b6ec.ds];
      const dayPlans = state.activities.filter(a => a.date === _0x55b6ec.ds);
      const _0x4c0c90 = `${shortDate(_0x55b6ec.ds)}: ${ownerLabel(_0x55b6ec.owner)} overnight — ${_0x55b6ec.reason}${_0x55b6ec.customSchoolLabel ? " (" + _0x55b6ec.customSchoolLabel + ")" : ""}`;
      const extras = (dayNote ? ". Has a note" : "") + (dayPlans.length ? `. ${dayPlans.length} plan${dayPlans.length === 1 ? "" : "s"}` : "");
      _0x4d5926.title = _0x4c0c90 + (dayNote ? `\n${dayNote}` : "") + dayPlans.map(p => `\n${p.time ? formatTime12(p.time) + " " : ""}${p.title}`).join("");
      _0x4d5926.setAttribute("aria-label", _0x4c0c90 + extras + ". Press Enter to open this day.");
      if (selected.has(_0x55b6ec.ds)) {
        _0x4d5926.classList.add("is-selected");
      }
      const _0x1d027d = _0x55b6ec.icon || (_0x55b6ec.schoolStatus === "school" ? _0x64ef20 : "");
      let _0x1701d0 = "";
      if (_0x55b6ec.isHoliday || _0x55b6ec.isOverride) {
        _0x1701d0 = _0x55b6ec.reason;
      } else if (_0x55b6ec.customSchoolLabel) {
        _0x1701d0 = _0x55b6ec.customSchoolLabel;
      } else if (_0x55b6ec.splitType === "p2-to-p1") {
        _0x1701d0 = `→ ${_0x1ee166}`;
      } else if (_0x55b6ec.splitType === "p1-to-p2") {
        _0x1701d0 = `→ ${_0x527835}`;
      }
      _0x4d5926.innerHTML = `<div class="day-top"><span>${_0x55b6ec.d}</span><span class="day-icons">${esc(_0x1d027d)}${dayNote || dayPlans.length ? '<span class="day-note-dot" aria-hidden="true"></span>' : ""}</span></div><div class="day-label">${esc(_0x1701d0)}</div>`;
      _0x4d5926.onclick = ev => onDayClick(_0x55b6ec.ds, ev);
      _0x4d5926.onkeydown = _0x168908 => {
        if (
          _0x168908.key === "ArrowRight" ||
          _0x168908.key === "ArrowLeft" ||
          _0x168908.key === "ArrowUp" ||
          _0x168908.key === "ArrowDown"
        ) {
          _0x168908.preventDefault();
          moveFocusInGrid(_0x55b6ec, _0x168908.key);
        }
      };
      _0x1a4139.appendChild(_0x4d5926);
    });
    _0x10d167.querySelectorAll(".month-nav").forEach(b => {
      b.onclick = () => kbShiftMonth(Number(b.dataset.dir));
    });
    _0x10d167.appendChild(_0x1a4139);
    _0x229b2c.appendChild(_0x10d167);
  });
  const _0x224b20 = document.getElementById("holidayTiles");
  _0x224b20.innerHTML = "";
  _0x2d1403
    .filter(_0x500a4e => !_0x500a4e.fixed)
    .forEach(_0x1c8f8d => {
      const _0x88ea05 = document.createElement("button");
      _0x88ea05.type = "button";
      _0x88ea05.dataset.fk = "hol:" + _0x1c8f8d.key;
      _0x88ea05.className = "hol-tile " + (_0x1c8f8d.disabled ? "off" : _0x1c8f8d.owner);
      _0x88ea05.setAttribute("aria-pressed", _0x1c8f8d.disabled ? "false" : "true");
      _0x88ea05.innerHTML = `<span class="hol-tile-name">${esc(_0x1c8f8d.icon)} ${esc(_0x1c8f8d.shortName)}</span><span class="hol-tile-owner">${esc(_0x1c8f8d.disabled ? "Skipped" : ownerLabel(_0x1c8f8d.owner))}</span>`;
      _0x88ea05.title = `Tap to cycle ${_0x1c8f8d.name}`;
      _0x88ea05.onclick = () => {
        const _0x4f4012 = `${state.year}:${_0x1c8f8d.key}`;
        const _0x1db68a = ["p1", "p2", "both", "skip"];
        const _0x4a8461 = _0x1c8f8d.disabled ? "skip" : _0x1c8f8d.owner;
        const _0x11343f = _0x1db68a[(Math.max(0, _0x1db68a.indexOf(_0x4a8461)) + 1) % _0x1db68a.length];
        const kbOff = kbOffByDefault(_0x1c8f8d.key);
        if (_0x11343f === "skip") {
          if (kbOff) {
            delete state.disabledByYear[_0x4f4012];
          } else {
            state.disabledByYear[_0x4f4012] = true;
          }
          delete state.holidayYearOverrides[_0x4f4012];
        } else {
          if (kbOff) {
            state.disabledByYear[_0x4f4012] = false;
          } else {
            delete state.disabledByYear[_0x4f4012];
          }
          if (_0x11343f === _0x1c8f8d.defaultOwner) {
            delete state.holidayYearOverrides[_0x4f4012];
          } else {
            state.holidayYearOverrides[_0x4f4012] = _0x11343f;
          }
        }
        save();
        render();
      };
      _0x224b20.appendChild(_0x88ea05);
    });
  document.getElementById("holidayTableTitle").textContent = `${state.year} Holidays, Birthdays & School Breaks`;
  const _0x10c1eb = document.getElementById("holidayTableBody");
  _0x10c1eb.innerHTML = "";
  _0x2d1403.forEach(_0x1db5f9 => {
    const _0x41729b = document.createElement("tr");
    if (_0x1db5f9.disabled) {
      _0x41729b.className = "is-disabled";
    }
    const _0x5daa78 = _0x1db5f9.disabled
      ? '<span class="pill off">Skipped</span>'
      : `<span class="pill ${_0x1db5f9.owner}">${esc(ownerLabel(_0x1db5f9.owner))}</span>`;
    const _0x4ec15b = _0x1db5f9.rule && _0x1db5f9.rule.indexOf("Calendar uses") >= 0;
    _0x41729b.innerHTML = `<td><strong>${esc(_0x1db5f9.name)}</strong></td><td>${esc(_0x1db5f9.dates)}</td><td class="hide-mobile-col${_0x4ec15b ? " conflict-note" : ""}">${esc(_0x1db5f9.rule)}</td><td>${_0x5daa78}</td>`;
    if (_0x1db5f9.rotates) {
      // alternating holidays can be turned around for good: the parent who had even years takes odd years
      const swap = document.createElement("button");
      swap.type = "button";
      swap.className = "btn btn-sm swap-years no-print";
      swap.textContent = "⇄";
      swap.title = _0x1db5f9.flipped ? "Back to the usual years" : `Swap who has ${_0x1db5f9.name} in even and odd years`;
      swap.setAttribute("aria-label", `Swap who has ${_0x1db5f9.name} in even and odd years`);
      swap.setAttribute("aria-pressed", _0x1db5f9.flipped ? "true" : "false");
      swap.dataset.fk = "swap:" + _0x1db5f9.key;
      swap.onclick = () => {
        if (!requireLicense()) {
          return;
        }
        const flips = Object.assign({}, state.holidayFlip);
        if (flips[_0x1db5f9.key]) {
          delete flips[_0x1db5f9.key];
        } else {
          flips[_0x1db5f9.key] = true;
        }
        state.holidayFlip = flips;
        save();
        render();
      };
      _0x41729b.lastElementChild.appendChild(swap);
    }
    _0x10c1eb.appendChild(_0x41729b);
  });
}
