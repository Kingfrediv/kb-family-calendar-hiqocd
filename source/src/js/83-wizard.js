// ---------------------------------------------------------------------------------------------
// Guided set-up for a new calendar: who it is for, how overnights are shared, holidays and summer.
// Opens by itself the first time, and for every calendar added later. "Skip for now" leaves it blank.
// ---------------------------------------------------------------------------------------------

const WIZARD_PRESETS = [
  { id: "7-7", label: "Alternating weeks", sub: "A week with each parent" },
  { id: "2-2-3", label: "2-2-3", sub: "Two nights, two nights, then three" },
  { id: "2-2-5-5", label: "2-2-5-5", sub: "Weekdays shared, a parent keeps the weekend" },
  { id: "3-4-4-3", label: "3-4-4-3", sub: "Three and four nights, swapping each week" },
  { id: "eow", label: "Every other weekend", sub: "Weekend overnights with Parent 2" },
  { id: "5-2", label: "Weekdays and weekends", sub: "Parent 1 weekdays, Parent 2 weekends" },
  { id: "", label: "I'll set it up myself", sub: "Tap the days in Settings later" }
];

let wizardStep = 1;
let wizardPreset = "";

function wizardNames() {
  const one = document.getElementById("setupP1").value.trim();
  const two = document.getElementById("setupP2").value.trim();
  return { p1: one || "Parent 1", p2: two || "Parent 2" };
}

function drawWizardPresets() {
  const box = document.getElementById("wizPresets");
  box.innerHTML = "";
  const names = wizardNames();
  WIZARD_PRESETS.forEach(preset => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "wiz-preset";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", preset.id === wizardPreset ? "true" : "false");
    button.dataset.wizPreset = preset.id;
    const title = document.createElement("strong");
    title.textContent = preset.label;
    const sub = document.createElement("span");
    sub.textContent = preset.sub.replace("Parent 1", names.p1).replace("Parent 2", names.p2);
    button.appendChild(title);
    button.appendChild(sub);
    const slots = preset.id ? presetSlots(preset.id) : null;
    if (slots) {
      // one square per night, in the colors the parents will see
      const strip = document.createElement("span");
      strip.className = "wiz-strip";
      strip.setAttribute("aria-hidden", "true");
      slots.forEach(mine => {
        const square = document.createElement("i");
        square.className = mine ? "p1" : "p2";
        strip.appendChild(square);
      });
      button.appendChild(strip);
    }
    button.onclick = () => {
      wizardPreset = preset.id;
      drawWizardPresets();
    };
    box.appendChild(button);
  });
}

function showWizardStep(n) {
  wizardStep = n;
  [1, 2, 3].forEach(i => {
    document.getElementById("wizStep" + i).hidden = i !== n;
  });
  document.getElementById("wizProgress").textContent = `Step ${n} of 3`;
  document.getElementById("btnSetupBack").hidden = n === 1;
  document.getElementById("btnSetupNext").hidden = n === 3;
  document.getElementById("btnSetupStart").hidden = n !== 3;
  const names = wizardNames();
  if (n === 2) {
    drawWizardPresets();
  }
  if (n === 3) {
    [["setupMothers", "Mother's Day"], ["setupFathers", "Father's Day"]].forEach(([id]) => {
      const select = document.getElementById(id);
      select.options[1].textContent = names.p1;
      select.options[2].textContent = names.p2;
    });
    document.getElementById("setupSummer").options[1].textContent = `${names.p2} has summer, except the weeks ${names.p1} picks`;
  }
  const firstField = document.querySelector(`#wizStep${n} input, #wizStep${n} select, #wizStep${n} .wiz-preset`);
  setTimeout(() => firstField && firstField.focus(), 30);
}

function openSetupDialog() {
  document.getElementById("setupChild").value = state.childName || "";
  document.getElementById("setupP1").value = state.p1Name && state.p1Name !== "Parent 1" ? state.p1Name : "";
  document.getElementById("setupP2").value = state.p2Name && state.p2Name !== "Parent 2" ? state.p2Name : "";
  document.getElementById("setupMothers").value = state.mothersDayOwner || "skip";
  document.getElementById("setupFathers").value = state.fathersDayOwner || "skip";
  document.getElementById("setupSummer").value = state.summerRestP2 ? "p2" : "base";
  const region = document.getElementById("setupRegion");
  if (!region.options.length) {
    REGIONS.forEach(r => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.label;
      region.appendChild(opt);
    });
  }
  region.value = state.region;
  wizardPreset = "";
  kbRemember();
  document.getElementById("setupOverlay").classList.add("show");
  showWizardStep(1);
}

// apply = true when the person finished the steps; false when they skipped or pressed Escape.
function finishSetup(apply) {
  document.getElementById("setupOverlay").classList.remove("show");
  state.setupComplete = true;
  if (apply) {
    const child = document.getElementById("setupChild").value.trim();
    const one = document.getElementById("setupP1").value.trim();
    const two = document.getElementById("setupP2").value.trim();
    if (child) {
      state.childName = child;
    }
    if (one) {
      state.p1Name = one;
    }
    if (two) {
      state.p2Name = two;
    }
    state.mothersDayOwner = document.getElementById("setupMothers").value || "skip";
    state.fathersDayOwner = document.getElementById("setupFathers").value || "skip";
    state.region = document.getElementById("setupRegion").value || "us";
    state.summerRestP2 = document.getElementById("setupSummer").value === "p2";
    if (wizardPreset) {
      applyPreset(wizardPreset, true);
    }
  }
  save();
  // setting up is the start of the calendar, not a change to take back
  undoStack = [];
  lastUndoPushAt = 0;
  render();
  kbReturnFocus();
}

document.getElementById("btnSetupNext").onclick = () => {
  if (wizardStep === 1 && !document.getElementById("setupChild").value.trim() && !document.getElementById("setupP1").value.trim() && !document.getElementById("setupP2").value.trim()) {
    // names can be left for later, but say so rather than moving on silently
    toast("You can add names later in Settings.");
  }
  showWizardStep(Math.min(3, wizardStep + 1));
};
document.getElementById("btnSetupBack").onclick = () => showWizardStep(Math.max(1, wizardStep - 1));
["setupChild", "setupP1", "setupP2"].forEach(id => {
  document.getElementById(id).addEventListener("keydown", ev => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      document.getElementById("btnSetupNext").click();
    }
  });
});
