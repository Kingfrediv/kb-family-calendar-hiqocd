// ---------------------------------------------------------------------------------------------
// The day sheet: tap a day to see who has it and why, change it, add a note, add plans.
// People without a license (a shared link or copy) get the same sheet, read-only.
// ---------------------------------------------------------------------------------------------

let sheetDate = "";
let noteTimer = null;

function dayRecord(ds) {
  const year = Number(ds.slice(0, 4));
  return buildYear(year).days.find(day => day.ds === ds) || null;
}

// Who would have the night if nobody had tapped it.
function naturalOwner(ds) {
  const [y, m, d] = ds.split("-").map(Number);
  return resolveDay(y, m - 1, d, buildHolidays(y).map, schoolEventMap(y), true).owner;
}

function plansOn(ds) {
  return state.activities
    .filter(a => a.date === ds)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99") || a.title.localeCompare(b.title));
}

// The exchange time and place that apply on a hand-off day.
function exchangeText(rec) {
  if (!rec.splitType) {
    return "";
  }
  const holidayLike = rec.isHoliday || rec.schoolStatus === "summer";
  const when = holidayLike ? state.timeHoliday : rec.owner === "p1" ? state.timeToP1 : state.timeToP2;
  const where = state.exchangeLocation;
  return `Exchange: ${when ? when.trim() : "time not set"}${where ? " at " + where.trim() : ""}.`;
}

// One sentence on why a day belongs to the parent it does.
function explainDay(rec) {
  const p1 = p1Name();
  const p2 = p2Name();
  let why;
  if (rec.source === "override") {
    const usual = naturalOwner(rec.ds);
    why = `Set by hand${usual !== "none" ? ` (the usual schedule gives it to ${ownerLabel(usual)})` : ""}.`;
  } else if (rec.source === "special") {
    why = `${rec.reason}: a holiday or break, which comes before the usual schedule.`;
  } else if (rec.source === "schoolEv") {
    why = `${rec.reason}: a school-calendar entry given to ${ownerLabel(rec.owner)}.`;
  } else if (rec.source === "summerP1") {
    why = `Summer week chosen by ${p1}.`;
  } else if (rec.source === "summerP2") {
    why = `Summer: weeks ${p1} did not pick go to ${p2}.`;
  } else {
    why = state.scheduleUnset ? "No schedule has been set yet." : "The usual schedule.";
  }
  return (why + " " + exchangeText(rec)).trim();
}

function openDaySheet(ds) {
  flushNote();
  sheetDate = ds;
  kbRemember();
  document.getElementById("daySheet").classList.add("show");
  drawDaySheet();
  const first = document.querySelector("#daySheet button:not([hidden]):not([disabled]), #daySheet textarea");
  setTimeout(() => {
    const pressed = document.querySelector("#daySheet .day-owner[aria-pressed='true']");
    (pressed || first || document.getElementById("btnDayDone")).focus();
  }, 30);
}

function closeDaySheet(returnFocus) {
  flushNote();
  sheetDate = "";
  document.getElementById("daySheet").classList.remove("show");
  if (returnFocus !== false) {
    kbReturnFocus();
  }
}

function drawDaySheet() {
  const rec = dayRecord(sheetDate);
  if (!rec) {
    closeDaySheet();
    return;
  }
  const editable = isLicensed();
  document.getElementById("daySheetTitle").textContent = `${longDate(sheetDate)}, ${rec.y}`;
  document.getElementById("daySheetWhy").textContent = `${rec.owner === "none" ? "Nobody has this overnight yet." : ownerLabel(rec.owner) + " has the overnight."} ${explainDay(rec)}`;
  document.getElementById("dayEdit").hidden = !editable;
  const names = { p1: p1Name(), p2: p2Name() };
  ["p1", "p2", "both"].forEach(owner => {
    const button = document.querySelector(`#dayEdit [data-owner="${owner}"]`);
    if (owner !== "both") {
      button.textContent = names[owner];
    }
    button.setAttribute("aria-pressed", rec.owner === owner ? "true" : "false");
  });
  document.getElementById("dayOwnerUsual").hidden = !state.overrides[sheetDate];
  const note = state.dayNotes[sheetDate] || "";
  const noteBox = document.getElementById("dayNote");
  if (document.activeElement !== noteBox) {
    noteBox.value = note;
  }
  noteBox.readOnly = !editable;
  document.getElementById("dayNoteGroup").hidden = !editable && !note;
  const plans = plansOn(sheetDate);
  const list = document.getElementById("dayPlans");
  list.innerHTML = "";
  plans.forEach(plan => {
    const row = document.createElement("div");
    row.className = "plan-row";
    const text = document.createElement("span");
    if (plan.time) {
      const time = document.createElement("time");
      time.textContent = formatTime12(plan.time);
      text.appendChild(time);
    }
    text.appendChild(document.createTextNode(plan.title));
    row.appendChild(text);
    if (editable) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "btn btn-sm";
      remove.textContent = "✕";
      remove.setAttribute("aria-label", `Remove plan: ${plan.title}`);
      remove.onclick = () => {
        state.activities = state.activities.filter(a => a.id !== plan.id);
        save();
        render();
        drawDaySheet();
      };
      row.appendChild(remove);
    }
    list.appendChild(row);
  });
  document.getElementById("planAdd").hidden = !editable;
  document.getElementById("dayPlansGroup").hidden = !editable && !plans.length;
  document.getElementById("btnDaySelectMore").hidden = !editable;
  document.getElementById("btnDayRequest").hidden = !editable;
}

// Gives the night to a parent, or takes the hand-made change away. Does not save.
function setDayOwner(ds, owner) {
  if (owner === "usual" || owner === naturalOwner(ds)) {
    delete state.overrides[ds];
  } else {
    state.overrides[ds] = owner;
  }
}

function flushNote() {
  if (noteTimer) {
    clearTimeout(noteTimer);
    noteTimer = null;
    save();
    render();
  }
}

document.getElementById("dayEdit").addEventListener("click", ev => {
  const button = ev.target.closest("[data-owner], #dayOwnerUsual");
  if (!button || !requireLicense()) {
    return;
  }
  setDayOwner(sheetDate, button.id === "dayOwnerUsual" ? "usual" : button.dataset.owner);
  save();
  render();
  drawDaySheet();
});

document.getElementById("dayNote").addEventListener("input", ev => {
  if (!isLicensed()) {
    return;
  }
  const text = ev.target.value;
  if (text.trim()) {
    state.dayNotes[sheetDate] = text;
  } else {
    delete state.dayNotes[sheetDate];
  }
  clearTimeout(noteTimer);
  // saving redraws the calendar, so wait until typing pauses
  noteTimer = setTimeout(() => {
    noteTimer = null;
    save();
    render();
  }, 600);
});

function addPlanFromSheet() {
  if (!requireLicense()) {
    return;
  }
  const title = document.getElementById("planTitle").value.trim();
  if (!title) {
    toast("Type what is happening first.");
    document.getElementById("planTitle").focus();
    return;
  }
  if (state.activities.length >= 400) {
    toast("That is the most plans one calendar can hold.");
    return;
  }
  state.activities.push({
    id: "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    date: sheetDate,
    time: document.getElementById("planTime").value || "",
    title: title.slice(0, 60)
  });
  document.getElementById("planTitle").value = "";
  document.getElementById("planTime").value = "";
  save();
  render();
  drawDaySheet();
  document.getElementById("planTitle").focus();
}

document.getElementById("btnAddPlan").onclick = addPlanFromSheet;
document.getElementById("planTitle").addEventListener("keydown", ev => {
  if (ev.key === "Enter") {
    ev.preventDefault();
    addPlanFromSheet();
  }
});
document.getElementById("btnDayDone").onclick = () => closeDaySheet();
document.getElementById("btnDaySelectMore").onclick = () => {
  const ds = sheetDate;
  closeDaySheet(false);
  startSelecting(ds);
};
document.getElementById("btnDayRequest").onclick = () => {
  const ds = sheetDate;
  closeDaySheet(false);
  openShareDialog({ message: `Could we change ${shortDate(ds)}?` });
};
document.getElementById("daySheet").addEventListener("mousedown", ev => {
  if (ev.target === ev.currentTarget) {
    closeDaySheet();
  }
});
