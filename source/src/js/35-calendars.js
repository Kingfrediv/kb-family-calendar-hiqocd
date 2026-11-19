// ---------------------------------------------------------------------------------------------
// Device preferences, and the list of calendars kept in this browser.
// The original calendar has the id "" and lives in the same storage slot it always did.
// Extra calendars (for another child, say) get an id like "p_k3j9x2ab" and their own slot.
// ---------------------------------------------------------------------------------------------

function readPrefs() {
  try {
    return kbObj(JSON.parse(localStorage.getItem(PREFS_KEY) || "{}"));
  } catch {
    return {};
  }
}

function writePref(key, value) {
  const prefs = readPrefs();
  prefs[key] = value;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

function isProfileId(id) {
  return typeof id === "string" && /^p_[a-z0-9]{4,24}$/.test(id);
}

function readProfileIndex() {
  try {
    const list = JSON.parse(localStorage.getItem(PROFILES_KEY) || "[]");
    if (!Array.isArray(list)) {
      return [];
    }
    return list
      .filter(p => p && isProfileId(p.id))
      .slice(0, MAX_CALENDARS)
      .map(p => ({ id: p.id, name: kbStr(p.name, 60, "") }));
  } catch {
    return [];
  }
}

function writeProfileIndex(list) {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list));
  } catch {}
}

function readActiveCalendarId() {
  try {
    const id = localStorage.getItem(ACTIVE_CALENDAR_KEY) || "";
    return isProfileId(id) && readProfileIndex().some(p => p.id === id) ? id : "";
  } catch {
    return "";
  }
}

function writeActiveCalendarId(id) {
  try {
    localStorage.setItem(ACTIVE_CALENDAR_KEY, id || "");
  } catch {}
}

function newCalendarId() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// The saved state of one calendar, or null.
function readCalendarSlot(id) {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKeyFor({ fileId: id })) || "null");
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
  } catch {
    return null;
  }
}

function writeCalendarSlot(id, st) {
  try {
    localStorage.setItem(storageKeyFor({ fileId: id }), JSON.stringify(st));
    return true;
  } catch {
    return false;
  }
}

function removeCalendarSlot(id) {
  try {
    localStorage.removeItem(storageKeyFor({ fileId: id }));
  } catch {}
}

// Keeps the stored list's display name in step with the child's name.
function noteCalendarName() {
  if (!isProfileId(state.fileId)) {
    return;
  }
  const list = readProfileIndex();
  const entry = list.find(p => p.id === state.fileId);
  const name = (state.childName || "").trim();
  if (entry && entry.name !== name) {
    entry.name = name;
    writeProfileIndex(list);
  }
}

function calendarDisplayName(id, st, position) {
  const name = ((st && st.childName) || "").trim();
  return name || (id === "" ? "My calendar" : "Calendar " + position);
}

// Every calendar on this device: [{ id, name, state }] with the open one taken from memory.
function listCalendars() {
  const ids = [""].concat(readProfileIndex().map(p => p.id));
  if (state.fileId && ids.indexOf(state.fileId) < 0) {
    ids.push(state.fileId);
  }
  const out = [];
  ids.forEach((id, i) => {
    const st = id === state.fileId ? state : readCalendarSlot(id);
    if (st) {
      out.push({ id, name: calendarDisplayName(id, st, i + 1), state: st });
    } else if (id !== "") {
      out.push({ id, name: calendarDisplayName(id, null, i + 1), state: null });
    }
  });
  return out;
}
