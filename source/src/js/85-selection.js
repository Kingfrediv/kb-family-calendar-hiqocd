// ---------------------------------------------------------------------------------------------
// Picking several days (a holiday trip, a long weekend) and giving them to someone in one go.
// Tap the first day and the last; or drag with a mouse; or Shift-click. The bar at the bottom does the rest.
// ---------------------------------------------------------------------------------------------

let selecting = false;
let selected = new Set();
let selectAnchor = "";
let selectPhase = 0; // 0 nothing picked, 1 first day picked, 2 range picked
let selectSummary = "";
let dragStart = "";
let dragMoved = false;
let suppressNextClick = false;

function rangeBetween(a, b) {
  const first = a <= b ? a : b;
  const last = a <= b ? b : a;
  const out = [];
  for (let day = first; day <= last && out.length < 400; day = addDays(day, 1)) {
    out.push(day);
  }
  return out;
}

function selectedSorted() {
  return [...selected].sort();
}

function applySelectionClasses() {
  document.querySelectorAll("button.day-cell").forEach(cell => cell.classList.toggle("is-selected", selected.has(cell.dataset.ds)));
}

function drawRangeBar() {
  const days = selectedSorted();
  const text = selectSummary
    ? selectSummary
    : !days.length
      ? "Tap the first day, then the last day."
      : days.length === 1
        ? `${shortDate(days[0])} picked. Tap the last day, or choose now for just this day.`
        : `${days.length} days picked: ${dateRangeText(days[0], days[days.length - 1])}`;
  document.getElementById("rangeText").textContent = text;
  document.getElementById("rangeP1").textContent = p1Name();
  document.getElementById("rangeP2").textContent = p2Name();
  document.querySelectorAll("#rangeBar [data-range-owner], #btnRangeRequest").forEach(button => {
    button.disabled = !days.length;
  });
}

function startSelecting(firstDay) {
  if (!requireLicense()) {
    return;
  }
  selecting = true;
  selected = new Set(firstDay ? [firstDay] : []);
  selectAnchor = firstDay || "";
  selectPhase = firstDay ? 1 : 0;
  selectSummary = "";
  document.body.classList.add("selecting");
  document.getElementById("rangeBar").hidden = false;
  applySelectionClasses();
  drawRangeBar();
}

function stopSelecting() {
  selecting = false;
  selected = new Set();
  selectAnchor = "";
  selectPhase = 0;
  selectSummary = "";
  document.body.classList.remove("selecting");
  document.getElementById("rangeBar").hidden = true;
  applySelectionClasses();
}

function selectDay(ds, ev) {
  if (suppressNextClick) {
    return;
  }
  selectSummary = "";
  if ((ev && ev.shiftKey && selectAnchor) || selectPhase === 1) {
    selected = new Set(rangeBetween(selectAnchor || ds, ds));
    selectPhase = 2;
  } else {
    selected = new Set([ds]);
    selectAnchor = ds;
    selectPhase = 1;
  }
  applySelectionClasses();
  drawRangeBar();
}

function onDayClick(ds, ev) {
  if (selecting) {
    selectDay(ds, ev);
  } else {
    openDaySheet(ds);
  }
}

function applyToSelection(owner) {
  if (!requireLicense()) {
    return;
  }
  const days = selectedSorted();
  if (!days.length) {
    return;
  }
  days.forEach(ds => setDayOwner(ds, owner));
  save();
  render();
  const label = owner === "usual" ? "the usual schedule" : owner === "both" ? "together" : ownerLabel(owner);
  selectSummary = `${days.length} day${days.length === 1 ? "" : "s"} (${dateRangeText(days[0], days[days.length - 1])}) set to ${label}.`;
  drawRangeBar();
  toast(selectSummary, { label: "Undo", run: undo });
}

document.querySelectorAll("#rangeBar [data-range-owner]").forEach(button => {
  button.onclick = () => applyToSelection(button.dataset.rangeOwner);
});
document.getElementById("btnRangeDone").onclick = stopSelecting;
document.getElementById("btnRangeRequest").onclick = () => {
  const days = selectedSorted();
  const range = days.length ? dateRangeText(days[0], days[days.length - 1]) : "";
  const message = selectSummary ? `Change request: ${selectSummary}` : range ? tr(`Could we change ${range}?`) : "";
  stopSelecting();
  openShareDialog({ message });
};

// mouse drag over the calendar
const calendarBox = document.getElementById("calendarContainer");
calendarBox.addEventListener("pointerdown", ev => {
  if (!selecting || ev.pointerType !== "mouse" || ev.button !== 0) {
    return;
  }
  const cell = ev.target.closest("button.day-cell");
  if (cell) {
    dragStart = cell.dataset.ds;
    dragMoved = false;
  }
});
calendarBox.addEventListener("pointerover", ev => {
  if (!dragStart) {
    return;
  }
  const cell = ev.target.closest("button.day-cell");
  if (cell && cell.dataset.ds !== dragStart) {
    dragMoved = true;
    selected = new Set(rangeBetween(dragStart, cell.dataset.ds));
    applySelectionClasses();
  }
});
document.addEventListener("pointerup", () => {
  if (dragStart && dragMoved) {
    selectAnchor = dragStart;
    selectPhase = 2;
    selectSummary = "";
    drawRangeBar();
    // the click that follows the drag must not start a new pick
    suppressNextClick = true;
    setTimeout(() => (suppressNextClick = false), 0);
  }
  dragStart = "";
  dragMoved = false;
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && selecting && !document.querySelector(".setup-overlay.show")) {
    stopSelecting();
  }
});
