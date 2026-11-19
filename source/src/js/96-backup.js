// ---------------------------------------------------------------------------------------------
// Back up every calendar on this device to one file, and restore from such a file.
// The license key is never written to a backup.
// ---------------------------------------------------------------------------------------------

function buildBackup() {
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    exportedAt: new Date().toISOString(),
    active: state.fileId,
    calendars: listCalendars()
      .filter(c => c.state)
      .map(c => ({ id: c.id, state: c.state }))
  };
}

function onBackup() {
  if (!requireLicense()) {
    return;
  }
  const json = JSON.stringify(buildBackup(), null, 1);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(new Blob([json], { type: "application/json" }), "Kingdom-Building-backup-" + stamp + ".json");
  try {
    localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()));
  } catch {}
  toast("Backup saved. Keep the file somewhere safe, like your email or cloud drive.");
}

// Checks an uploaded backup and returns clean calendars, or throws an Error with a plain message.
function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file is not a calendar backup.");
  }
  if (!data || typeof data !== "object" || data.app !== BACKUP_APP || !Array.isArray(data.calendars)) {
    throw new Error("That file is not a Kingdom Building calendar backup.");
  }
  if (Number(data.format) > BACKUP_FORMAT) {
    throw new Error("That backup was made by a newer version. Open the newest version of the calendar and try again.");
  }
  if (!data.calendars.length || data.calendars.length > MAX_CALENDARS + 1) {
    throw new Error("That backup has no calendars in it, or too many.");
  }
  const used = {};
  const calendars = [];
  data.calendars.forEach(c => {
    if (!c || typeof c !== "object" || !c.state || typeof c.state !== "object" || Array.isArray(c.state)) {
      return;
    }
    let id = c.id === "" || isProfileId(c.id) ? c.id : newCalendarId();
    if (used[id]) {
      id = newCalendarId();
    }
    used[id] = true;
    const clean = normalizeState(Object.assign(defaultState(), c.state));
    clean.fileId = id;
    calendars.push({ id, state: clean });
  });
  if (!calendars.length) {
    throw new Error("That backup has no readable calendars in it.");
  }
  return { calendars, active: typeof data.active === "string" ? data.active : "", exportedAt: String(data.exportedAt || "") };
}

// Replaces everything stored on this device with the given calendars, then reloads the page.
function applyCalendars(calendars, active) {
  readProfileIndex().forEach(p => removeCalendarSlot(p.id));
  const index = [];
  calendars.forEach(c => {
    writeCalendarSlot(c.id, c.state);
    if (c.id !== "") {
      index.push({ id: c.id, name: (c.state.childName || "").trim() });
    }
  });
  writeProfileIndex(index);
  writeActiveCalendarId(calendars.some(c => c.id === active) ? active : "");
}

function restoreBackupText(text) {
  let parsed;
  try {
    parsed = parseBackup(text);
  } catch (err) {
    toast(err.message);
    return;
  }
  const names = parsed.calendars.map(c => calendarDisplayName(c.id, c.state, 1)).join(", ");
  const when = parsed.exportedAt ? " from " + parsed.exportedAt.slice(0, 10) : "";
  if (!confirm("Replace everything on this device with the backup" + when + "?\n\nCalendars in the backup: " + names + ".\n\nYou can undo this right after.")) {
    return;
  }
  // keep what is here now, so the restore can be undone
  try {
    localStorage.setItem(PRE_RESTORE_KEY, JSON.stringify(buildBackup()));
  } catch {}
  applyCalendars(parsed.calendars, parsed.active);
  try {
    sessionStorage.setItem("kb_restored", "1");
  } catch {}
  location.reload();
}

// Puts back what was on the device before the last restore.
function undoRestore() {
  try {
    const parsed = parseBackup(localStorage.getItem(PRE_RESTORE_KEY) || "");
    applyCalendars(parsed.calendars, parsed.active);
    localStorage.removeItem(PRE_RESTORE_KEY);
    sessionStorage.setItem("kb_restore_undone", "1");
  } catch {
    toast("There is nothing to undo.");
    return;
  }
  location.reload();
}

// After a restore reloads the page, say what happened and offer to undo it.
function announceRestore() {
  let restored = false;
  let undone = false;
  try {
    restored = sessionStorage.getItem("kb_restored") === "1";
    undone = sessionStorage.getItem("kb_restore_undone") === "1";
    sessionStorage.removeItem("kb_restored");
    sessionStorage.removeItem("kb_restore_undone");
  } catch {}
  if (restored) {
    toast("Backup restored.", { label: "Undo", run: undoRestore });
  } else if (undone) {
    toast("Restore undone. Your earlier calendars are back.");
  }
}

function onRestoreClick() {
  if (!requireLicense()) {
    return;
  }
  document.getElementById("restoreFile").click();
}

document.getElementById("btnBackup").onclick = onBackup;
document.getElementById("btnRestore").onclick = onRestoreClick;
document.getElementById("restoreFile").addEventListener("change", async ev => {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!file) {
    return;
  }
  if (file.size > 8 * 1024 * 1024) {
    toast("That file is too large to be a calendar backup.");
    return;
  }
  restoreBackupText(await file.text());
});
