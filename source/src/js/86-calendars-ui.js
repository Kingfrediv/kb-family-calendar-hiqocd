// ---------------------------------------------------------------------------------------------
// Several calendars on one device (another child, say). Each has its own saved schedule and history.
// Storage lives in 35-calendars.js; this is switching, adding, deleting and the lists that show them.
// ---------------------------------------------------------------------------------------------


// Calendars can be switched and added by someone with a license, on their own saved calendar.
function canManageCalendars() {
  return isLicensed() && !viewingShared && !kbIsCopy();
}

function renderCalendarList() {
  const card = document.getElementById("calendarsCard");
  card.hidden = !canManageCalendars();
  const switcher = document.getElementById("calendarSwitch");
  if (!canManageCalendars()) {
    switcher.hidden = true;
    return;
  }
  const calendars = listCalendars();
  const list = document.getElementById("calendarList");
  list.innerHTML = "";
  calendars.forEach(c => {
    const row = document.createElement("div");
    row.className = "list-row";
    const name = document.createElement("span");
    const current = c.id === state.fileId;
    name.innerHTML = `<strong>${esc(c.name)}</strong>${current ? " (open now)" : ""}`;
    row.appendChild(name);
    const actions = document.createElement("span");
    if (!current) {
      const open = document.createElement("button");
      open.type = "button";
      open.className = "btn btn-sm";
      open.textContent = "Open";
      open.setAttribute("aria-label", `Open ${c.name}`);
      open.onclick = () => switchCalendar(c.id);
      actions.appendChild(open);
    }
    if (c.id !== "") {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn btn-sm";
      remove.textContent = "✕";
      remove.setAttribute("aria-label", `Delete ${c.name}`);
      remove.onclick = () => deleteCalendar(c.id, c.name);
      actions.appendChild(remove);
    }
    row.appendChild(actions);
    list.appendChild(row);
  });
  document.getElementById("btnAddCalendar").disabled = calendars.length >= MAX_CALENDARS;
  // the header shows a switcher once there is more than one
  switcher.hidden = calendars.length < 2;
  if (calendars.length >= 2) {
    switcher.innerHTML = "";
    calendars.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      switcher.appendChild(opt);
    });
    switcher.value = state.fileId;
  }
}

function switchCalendar(id) {
  if (!canManageCalendars() || id === state.fileId) {
    return;
  }
  flushNote();
  stopSelecting();
  closeDaySheet(false);
  writeActiveCalendarId(id);
  const stored = readCalendarSlot(id);
  state = normalizeState(Object.assign(defaultState(), stored || { fileId: id }));
  state.fileId = id;
  undoStack = [];
  lastUndoPushAt = 0;
  lastSavedJson = JSON.stringify(state);
  notesEditing = false;
  applyColors();
  renderEverything();
  toast(`Opened ${calendarDisplayName(id, state, 1)}.`);
}

function addCalendar() {
  if (!requireLicense() || !canManageCalendars()) {
    return;
  }
  if (listCalendars().length >= MAX_CALENDARS) {
    toast("That is the most calendars this device can hold.");
    return;
  }
  const id = newCalendarId();
  // the same parents are usually behind the next child's calendar, so start from their names, colors and region
  const keep = ["p1Name", "p2Name", "p1Color", "p2Color", "headerColor", "titleEmoji", "summerEmoji", "schoolEmoji", "region", "evenGroupAP1", "weekStartsMonday", "exchangeLocation"];
  const fresh = defaultState();
  keep.forEach(k => (fresh[k] = state[k]));
  fresh.fileId = id;
  const index = readProfileIndex();
  index.push({ id, name: "" });
  writeProfileIndex(index);
  writeCalendarSlot(id, normalizeState(fresh));
  switchCalendar(id);
  openSetupDialog();
}

function deleteCalendar(id, name) {
  if (!canManageCalendars() || id === "") {
    return;
  }
  if (!confirm(LANG === "es" ? `¿Eliminar el calendario «${name}» de este dispositivo?\n\nHaz primero una copia de seguridad si podrías querer recuperarlo. No se puede deshacer.` : `Delete the calendar “${name}” from this device?\n\nMake a backup first if you might want it back. This cannot be undone.`)) {
    return;
  }
  removeCalendarSlot(id);
  try {
    localStorage.removeItem(historyKey(id));
  } catch {}
  writeProfileIndex(readProfileIndex().filter(p => p.id !== id));
  if (state.fileId === id) {
    writeActiveCalendarId("");
    const stored = readCalendarSlot("");
    state = normalizeState(Object.assign(defaultState(), stored || {}));
    state.fileId = "";
    undoStack = [];
    lastSavedJson = JSON.stringify(state);
    applyColors();
    renderEverything();
  } else {
    render();
  }
  toast(`Deleted ${name}.`);
}

document.getElementById("btnAddCalendar").onclick = addCalendar;
document.getElementById("calendarSwitch").onchange = ev => switchCalendar(ev.target.value);
