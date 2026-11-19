// ---------------------------------------------------------------------------------------------
// Settings added in the second release: custom cycle, holiday calendar and packs, summer window, winter break.
// renderScheduleControls() makes the controls show what is in `state`; the handlers at the bottom change `state`.
// ---------------------------------------------------------------------------------------------

const PACK_CHOICES = [
  { value: "off", label: () => "Off" },
  { value: "alt", label: () => "Alternate years" },
  { value: "p1", label: () => `Always ${p1Name()}` },
  { value: "p2", label: () => `Always ${p2Name()}` },
  { value: "both", label: () => "Together" }
];

function buildOnce(select, options) {
  if (select.options.length) {
    return;
  }
  options.forEach(([value, text]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = text;
    select.appendChild(opt);
  });
}

function fillScheduleSelects() {
  fillMonthDaySelects("summerStartMonth", "summerStartDay");
  fillMonthDaySelects("summerEndMonth", "summerEndDay");
  const winterStart = document.getElementById("winterStartDay");
  const winterEnd = document.getElementById("winterEndDay");
  buildOnce(winterStart, [...Array(17).keys()].map(i => [String(15 + i), `Dec ${15 + i}`]));
  buildOnce(winterEnd, [...Array(15).keys()].map(i => [String(1 + i), `Jan ${1 + i}`]));
  buildOnce(document.getElementById("regionSelect"), REGIONS.map(r => [r.id, r.label]));
  const box = document.getElementById("packControls");
  if (!box.children.length) {
    PACK_NAMES.forEach(pack => {
      const row = document.createElement("div");
      row.className = "pack-row";
      const label = document.createElement("label");
      label.htmlFor = "pack_" + pack;
      label.textContent = PACK_DEFS[pack].label;
      const select = document.createElement("select");
      select.id = "pack_" + pack;
      select.dataset.pack = pack;
      PACK_CHOICES.forEach(choice => {
        const opt = document.createElement("option");
        opt.value = choice.value;
        select.appendChild(opt);
      });
      row.appendChild(label);
      row.appendChild(select);
      box.appendChild(row);
    });
  }
}

function setSelectValue(id, value) {
  const el = document.getElementById(id);
  if (el && document.activeElement !== el) {
    el.value = String(value);
  }
}

function renderScheduleControls() {
  fillScheduleSelects();
  if (drawnSummerKey !== state.summerStart + ">" + state.summerEnd) {
    drawSummer();
  }
  document.getElementById("modeCycleBtn").classList.toggle("active", state.baseMode === "cycle");
  document.getElementById("initialsOff").classList.toggle("active", !state.showInitials);
  document.getElementById("initialsOn").classList.toggle("active", !!state.showInitials);
  document.body.classList.toggle("show-initials", !!state.showInitials);
  document.getElementById("cycleWrap").style.display = state.baseMode === "cycle" ? "block" : "none";
  setInputValue("cycleLengthInput", state.cycleLength);
  setInputValue("cycleAnchorInput", state.cycleAnchor);
  setSelectValue("regionSelect", state.region);
  document.getElementById("longWeekendOff").classList.toggle("active", !state.longWeekends);
  document.getElementById("longWeekendOn").classList.toggle("active", !!state.longWeekends);
  document.getElementById("splitXmasOff").classList.toggle("active", !state.splitChristmas);
  document.getElementById("splitXmasOn").classList.toggle("active", !!state.splitChristmas);
  PACK_NAMES.forEach(pack => {
    const select = document.getElementById("pack_" + pack);
    PACK_CHOICES.forEach((choice, i) => {
      select.options[i].textContent = choice.label();
    });
    if (document.activeElement !== select) {
      select.value = state.packs[pack];
    }
  });
  const [sm, sd] = monthDayParts(state.summerStart);
  const [em, ed] = monthDayParts(state.summerEnd);
  setSelectValue("summerStartMonth", sm);
  setSelectValue("summerStartDay", sd);
  setSelectValue("summerEndMonth", em);
  setSelectValue("summerEndDay", ed);
  document.getElementById("summerRangeLabel").textContent = summerRangeText();
  setSelectValue("winterStartDay", state.winterStartDay);
  setSelectValue("winterEndDay", state.winterEndDay);
}

// ---- handlers -----------------------------------------------------------------------------------

function changeSetting(apply) {
  apply();
  save();
  render();
}

function setSummerWindowFromSelects() {
  const value = (month, day) => {
    const m = Number(document.getElementById(month).value);
    const d = Math.min(Number(document.getElementById(day).value), kbMonthMax(m));
    return pad2(m + 1) + "-" + pad2(d);
  };
  const start = value("summerStartMonth", "summerStartDay");
  const end = value("summerEndMonth", "summerEndDay");
  if (start >= end) {
    toast("Summer has to end after it starts.");
    render();
    return;
  }
  changeSetting(() => {
    state.summerStart = start;
    state.summerEnd = end;
  });
}

document.getElementById("initialsOff").onclick = () => changeSetting(() => (state.showInitials = false));
document.getElementById("initialsOn").onclick = () => changeSetting(() => (state.showInitials = true));
document.getElementById("modeCycleBtn").onclick = () => changeSetting(() => (state.baseMode = "cycle"));
document.getElementById("cycleLengthInput").onchange = ev => {
  const n = Math.max(2, Math.min(28, Math.round(Number(ev.target.value)) || state.cycleLength));
  ev.target.value = n;
  changeSetting(() => {
    // keep the days already chosen; new days start with the second parent
    state.baseCycle = Array.from({ length: n }, (_, i) => !!state.baseCycle[i]);
    state.cycleLength = n;
  });
};
document.getElementById("cycleAnchorInput").onchange = ev => changeSetting(() => (state.cycleAnchor = ev.target.value || state.cycleAnchor));
document.getElementById("regionSelect").onchange = ev => changeSetting(() => (state.region = ev.target.value));
document.getElementById("longWeekendOff").onclick = () => changeSetting(() => (state.longWeekends = false));
document.getElementById("longWeekendOn").onclick = () => changeSetting(() => (state.longWeekends = true));
document.getElementById("splitXmasOff").onclick = () => changeSetting(() => (state.splitChristmas = false));
document.getElementById("splitXmasOn").onclick = () => changeSetting(() => (state.splitChristmas = true));
document.getElementById("packControls").addEventListener("change", ev => {
  const select = ev.target.closest("select[data-pack]");
  if (select) {
    changeSetting(() => (state.packs[select.dataset.pack] = select.value));
  }
});
["summerStartMonth", "summerStartDay", "summerEndMonth", "summerEndDay"].forEach(id => {
  document.getElementById(id).onchange = setSummerWindowFromSelects;
});
document.getElementById("btnSummerFromSchool").onclick = () => {
  const { schoolEnd, schoolStart } = schoolDatesFor(state.year);
  const start = addDays(schoolEnd, 1).slice(5);
  const end = addDays(schoolStart, -1).slice(5);
  if (!isMonthDayText(start) || !isMonthDayText(end) || start >= end) {
    toast("Set the last day of school and the first day of fall first, with summer in between.");
    return;
  }
  changeSetting(() => {
    state.summerStart = start;
    state.summerEnd = end;
  });
  toast(`Summer now runs ${summerRangeText()}, matching your school dates.`);
};
document.getElementById("winterStartDay").onchange = ev => changeSetting(() => (state.winterStartDay = Number(ev.target.value)));
document.getElementById("winterEndDay").onchange = ev => changeSetting(() => (state.winterEndDay = Number(ev.target.value)));
