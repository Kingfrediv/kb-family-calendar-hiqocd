document.getElementById("modeWeeklyBtn").onclick = () => {
  state.baseMode = "weekly";
  save();
  render();
};

document.getElementById("modeBiweeklyBtn").onclick = () => {
  state.baseMode = "biweekly";
  save();
  render();
};

document.getElementById("modeMonthlyBtn").onclick = () => {
  state.baseMode = "monthly";
  save();
  render();
};

document.getElementById("biweeklyAnchorInput").onchange = _0x9b70c1 => {
  state.biweeklyAnchor = _0x9b70c1.target.value || "2026-01-04";
  save();
  render();
};

document.getElementById("btnBaseClear").onclick = () => {
  markScheduleSet();
  if (state.baseMode === "weekly") {
    state.baseWeekly = state.baseWeekly.map(() => false);
  } else if (state.baseMode === "biweekly") {
    state.baseBiweekly = state.baseBiweekly.map(() => false);
  } else {
    state.baseMonthly = state.baseMonthly.map(() => false);
  }
  save();
  render();
};

document.getElementById("btnBaseFlip").onclick = () => {
  markScheduleSet();
  if (state.baseMode === "weekly") {
    state.baseWeekly = state.baseWeekly.map(_0x56d9d0 => !_0x56d9d0);
  } else if (state.baseMode === "biweekly") {
    state.baseBiweekly = state.baseBiweekly.map(_0x2c25c9 => !_0x2c25c9);
  } else {
    state.baseMonthly = state.baseMonthly.map(_0x1ee6d2 => !_0x1ee6d2);
  }
  save();
  render();
};

document.getElementById("childNameInput").oninput = _0x4711ee => {
  state.childName = _0x4711ee.target.value;
  save();
  render();
};

document.getElementById("p1NameInput").oninput = _0x6fcaac => {
  state.p1Name = _0x6fcaac.target.value;
  save();
  render();
};

document.getElementById("p2NameInput").oninput = _0x32bd1f => {
  state.p2Name = _0x32bd1f.target.value;
  save();
  render();
};

document.getElementById("p1ColorInput").oninput = _0xbad0f0 => {
  state.p1Color = _0xbad0f0.target.value;
  save();
  applyColors();
};

document.getElementById("p2ColorInput").oninput = _0xf63135 => {
  state.p2Color = _0xf63135.target.value;
  save();
  applyColors();
};

document.getElementById("headerColorInput").oninput = _0x2b771b => {
  state.headerColor = _0x2b771b.target.value;
  save();
  applyColors();
};

document.getElementById("titleEmojiInput").oninput = _0x40ce6f => {
  state.titleEmoji = _0x40ce6f.target.value;
  save();
  renderChrome();
};

document.getElementById("summerEmojiInput").oninput = _0x8e8376 => {
  state.summerEmoji = _0x8e8376.target.value;
  save();
  render();
};

document.getElementById("schoolEmojiInput").oninput = _0x367ee0 => {
  state.schoolEmoji = _0x367ee0.target.value;
  save();
  render();
};

yearSelect.onchange = () => {
  state.year = Number(yearSelect.value);
  save({
    nav: true
  });
  render();
};

monthSelect.onchange = () => {
  state.selectedMonth = Number(monthSelect.value);
  save({
    nav: true
  });
  render();
};

document.getElementById("btnPrevYear").onclick = () => {
  if (state.year > MIN_YEAR) {
    state.year--;
    save({
      nav: true
    });
    render();
  }
};

document.getElementById("btnNextYear").onclick = () => {
  if (state.year < MAX_YEAR) {
    state.year++;
    save({
      nav: true
    });
    render();
  }
};

// jump to the current month (and year) and bring today into view
document.getElementById("btnToday").onclick = () => {
  const now = new Date();
  state.year = now.getFullYear();
  state.selectedMonth = now.getMonth();
  save({ nav: true });
  render();
  const cell = document.querySelector("button.day-cell.is-today");
  if (cell) {
    cell.scrollIntoView({ block: "center", behavior: "smooth" });
    cell.focus({ preventScroll: true });
  }
};
document.getElementById("btnToggleSidebar").onclick = () => {
  state.sidebarHidden = !state.sidebarHidden;
  save({
    nav: true
  });
  render();
};

document.getElementById("weekStartSunBtn").onclick = () => {
  kbSetWeekStart(false);
  save();
  render();
};

document.getElementById("weekStartMonBtn").onclick = () => {
  kbSetWeekStart(true);
  save();
  render();
};

document.getElementById("splitDaysOn").onclick = () => {
  state.showSplitDays = true;
  save();
  render();
};

document.getElementById("splitDaysOff").onclick = () => {
  state.showSplitDays = false;
  save();
  render();
};

document.getElementById("summerOnBtn").onclick = () => {
  state.summerEnabled = true;
  save();
  render();
};

document.getElementById("summerOffBtn").onclick = () => {
  state.summerEnabled = false;
  save();
  render();
};

document.getElementById("summerRestP2Btn").onclick = () => {
  state.summerRestP2 = true;
  save();
  render();
};

document.getElementById("summerRestBaseBtn").onclick = () => {
  state.summerRestP2 = false;
  save();
  render();
};

document.getElementById("rotStandardBtn").onclick = () => {
  state.evenGroupAP1 = true;
  save();
  render();
};

document.getElementById("rotFlippedBtn").onclick = () => {
  state.evenGroupAP1 = false;
  save();
  render();
};

document.getElementById("holOverSummerOn").onclick = () => {
  state.holidaysOverrideSummer = true;
  save();
  render();
};

document.getElementById("holOverSummerOff").onclick = () => {
  state.holidaysOverrideSummer = false;
  save();
  render();
};

document.getElementById("viewYearBtn").onclick = () => {
  state.viewMode = "year";
  save({
    nav: true
  });
  render();
};

document.getElementById("viewMonthBtn").onclick = () => {
  state.viewMode = "month";
  save({
    nav: true
  });
  render();
};

document.getElementById("timeToP1Input").oninput = _0x16aa53 => {
  state.timeToP1 = _0x16aa53.target.value;
  save();
  renderChrome();
};

document.getElementById("timeToP2Input").oninput = _0x1416f8 => {
  state.timeToP2 = _0x1416f8.target.value;
  save();
  renderChrome();
};

document.getElementById("timeHolidayInput").oninput = _0x18cc67 => {
  state.timeHoliday = _0x18cc67.target.value;
  save();
  renderChrome();
};

document.getElementById("exchangeLocationInput").oninput = _0x2d6750 => {
  state.exchangeLocation = _0x2d6750.target.value;
  save();
  renderChrome();
};

document.getElementById("summerDeadlineInput").oninput = _0x16c800 => {
  state.summerDeadline = _0x16c800.target.value;
  save();
  renderChrome();
};

document.getElementById("summerFirstPickSelect").onchange = _0x353879 => {
  state.summerFirstPick = _0x353879.target.value;
  save();
  renderChrome();
};

document.getElementById("schoolNameInput").oninput = _0x455ebb => {
  state.schoolName = _0x455ebb.target.value;
  save();
  renderChrome();
};

document.getElementById("schoolUrlInput").oninput = _0x452d90 => {
  state.schoolUrl = _0x452d90.target.value;
  save();
  renderChrome();
};

document.getElementById("schoolNotesInput").oninput = _0x163832 => {
  state.schoolNotes = _0x163832.target.value;
  save();
  renderChrome();
};

document.getElementById("schoolEndInput").onchange = _0x2da6dd => {
  state.schoolEndByYear[state.year] = _0x2da6dd.target.value;
  save();
  render();
};

document.getElementById("schoolStartInput").onchange = _0x2deb4d => {
  state.schoolStartByYear[state.year] = _0x2deb4d.target.value;
  save();
  render();
};

document.getElementById("springBreakInput").onchange = _0x598e07 => {
  state.springBreakByYear[state.year] = _0x598e07.target.value;
  save();
  render();
};

document.getElementById("btnAddCustomHol").onclick = () => {
  const _0x9b9109 = document.getElementById("customHolName").value.trim();
  if (!_0x9b9109) {
    toast("Enter a holiday name first!");
    return;
  }
  const _0x41424c = document.getElementById("customHolEmoji").value.trim() || "✨";
  const _0x2b6842 = Number(document.getElementById("customHolMonth").value);
  const _0x3e2e57 = Number(document.getElementById("customHolDay").value);
  const _0x97b4e = document.getElementById("customHolRule").value;
  if (_0x3e2e57 > kbMonthMax(_0x2b6842)) {
    toast(`${MONTH_NAMES[_0x2b6842]} only has ${kbMonthMax(_0x2b6842)} days. Pick another day.`);
    return;
  }
  state.customHolidays.push({
    id: Date.now(),
    name: _0x9b9109,
    emoji: _0x41424c,
    m: _0x2b6842,
    d: _0x3e2e57,
    rule: _0x97b4e
  });
  document.getElementById("customHolName").value = "";
  document.getElementById("customHolEmoji").value = "";
  save();
  drawCustomHolidayList();
  render();
};

document.getElementById("btnAddSchoolEvent").onclick = () => {
  const _0x14f1f2 = document.getElementById("addSchoolStart").value;
  const _0x1b399b = document.getElementById("addSchoolEnd").value;
  const _0x3c2b85 = document.getElementById("addSchoolLabel").value.trim() || "No School";
  const _0x1b1c54 = document.getElementById("addSchoolKind").value;
  if (!_0x14f1f2) {
    toast("Pick a start date first!");
    return;
  }
  state.schoolCustomEvents.push({
    id: "sc_" + Date.now(),
    startDate: _0x14f1f2,
    endDate: _0x1b399b || _0x14f1f2,
    title: _0x3c2b85,
    kind: _0x1b1c54
  });
  document.getElementById("addSchoolStart").value = "";
  document.getElementById("addSchoolEnd").value = "";
  document.getElementById("addSchoolLabel").value = "";
  save();
  drawSchoolEventList();
  render();
};

document.getElementById("btnResetOverrides").onclick = () => {
  Object.keys(state.overrides).forEach(_0x176a36 => {
    if (_0x176a36.startsWith(`${state.year}-`)) {
      delete state.overrides[_0x176a36];
    }
  });
  save();
  render();
};

document.getElementById("btnResetHolidays").onclick = () => {
  Object.keys(state.disabledByYear || {}).forEach(_0x566734 => {
    if (_0x566734.startsWith(`${state.year}:`)) {
      delete state.disabledByYear[_0x566734];
    }
  });
  Object.keys(state.holidayYearOverrides || {}).forEach(_0x265355 => {
    if (_0x265355.startsWith(`${state.year}:`)) {
      delete state.holidayYearOverrides[_0x265355];
    }
  });
  save();
  render();
};

document.getElementById("btnResetAll").onclick = () => {
  if (!confirm("Reset all names, days, holidays, and notes back to the blank default template?")) {
    return;
  }
  const _0x55189c = currentStorageKey();
  const kbHome = kbHomeFileId();
  viewingShared = false;
  undoStack = [];
  state = normalizeState(defaultState());
  state.fileId = kbHome;
  try {
    localStorage.removeItem(_0x55189c);
    localStorage.removeItem(
      storageKeyFor({
        fileId: kbHome
      })
    );
  } catch {}
  lastSavedJson = JSON.stringify(state);
  if (kbIsCopy()) {
    // the cleared calendar has to be stored, otherwise the baked-in schedule comes back on reload
    save({
      fromUndo: true
    });
  }
  history.replaceState(null, "", location.pathname + location.search);
  document.getElementById("sharedBanner").classList.remove("show");
  drawSummer();
  drawCustomHolidayList();
  drawSchoolEventList();
  render();
  updateUndoButton();
  toast("All settings reset to default template!");
};

document.getElementById("btnToggleNotesEdit").onclick = () => {
  notesEditing = !notesEditing;
  renderChrome();
};

document.getElementById("notesTextarea").oninput = _0x175964 => {
  state.agreementNotes = _0x175964.target.value;
  save();
  document.getElementById("notesReadonly").textContent = state.agreementNotes;
};

function cycleOverride(_0x2e2382, _0x5b7dbf) {
  if (!isLicensed()) {
    requireLicense();
    return;
  }
  const _0x9167b4 = ["p1", "p2", "both"];
  const _0x42e37f = state.overrides[_0x2e2382];
  if (!_0x42e37f) {
    state.overrides[_0x2e2382] = _0x9167b4[0] === _0x5b7dbf ? _0x9167b4[1] : _0x9167b4[0];
    return;
  }
  const _0x4d28bb = _0x9167b4.indexOf(_0x42e37f);
  if (_0x4d28bb < 0 || _0x4d28bb === _0x9167b4.length - 1) {
    delete state.overrides[_0x2e2382];
    return;
  }
  state.overrides[_0x2e2382] = _0x9167b4[_0x4d28bb + 1];
}

function moveFocusInGrid(_0x4b877e, _0x3fb26c) {
  const _0x4d3925 = [...document.querySelectorAll("button.day-cell:not(.empty)")];
  const _0x259a5b = _0x4d3925.findIndex(_0x43f6ae => _0x43f6ae.dataset.ds === _0x4b877e.ds);
  if (_0x259a5b < 0) {
    return;
  }
  let _0x4b4b61 = _0x259a5b;
  if (_0x3fb26c === "ArrowRight") {
    _0x4b4b61 = Math.min(_0x4d3925.length - 1, _0x259a5b + 1);
  } else if (_0x3fb26c === "ArrowLeft") {
    _0x4b4b61 = Math.max(0, _0x259a5b - 1);
  } else if (_0x3fb26c === "ArrowDown") {
    _0x4b4b61 = Math.min(_0x4d3925.length - 1, _0x259a5b + 7);
  } else if (_0x3fb26c === "ArrowUp") {
    _0x4b4b61 = Math.max(0, _0x259a5b - 7);
  }
  _0x4d3925[_0x4b4b61]?.focus();
}
