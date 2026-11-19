// ---------------------------------------------------------------------------------------------
// Compare a share link with the calendar saved on this device, and take over the changes you agree with.
// This is how two parents keep one schedule without a server: one makes a change and sends a link with a message,
// the other opens it, compares, and applies what they accept. Applying is one step and can be undone.
// ---------------------------------------------------------------------------------------------

let reviewItems = [];

function nameIn(st, owner) {
  if (owner === "both") {
    return "together";
  }
  return (owner === "p1" ? st.p1Name : st.p2Name).trim() || (owner === "p1" ? "Parent 1" : "Parent 2");
}

function dateWithYear(ds) {
  return `${shortDate(ds)}, ${ds.slice(0, 4)}`;
}

function copyOf(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

// Everything that differs between your saved calendar (local) and the one in the link (incoming), as separate choices.
function buildReviewItems(local, incoming) {
  const items = [];
  const add = (group, text, apply, checked) => items.push({ group, text, apply, checked: checked !== false });
  const keys = obj => Object.keys(obj || {});

  [...new Set([...keys(local.overrides), ...keys(incoming.overrides)])]
    .sort()
    .forEach(ds => {
      const was = local.overrides[ds];
      const now = incoming.overrides[ds];
      if (was !== now) {
        add("Days", `${dateWithYear(ds)}: ${now ? nameIn(incoming, now) : "back to the usual schedule"}${was ? ` (now ${nameIn(local, was)})` : ""}`, t => {
          if (now) {
            t.overrides[ds] = now;
          } else {
            delete t.overrides[ds];
          }
        });
      }
    });

  [...new Set([...keys(local.dayNotes), ...keys(incoming.dayNotes)])]
    .sort()
    .forEach(ds => {
      const was = local.dayNotes[ds];
      const now = incoming.dayNotes[ds];
      if (was !== now) {
        add("Notes", now ? `${dateWithYear(ds)}: “${now}”` : `${dateWithYear(ds)}: note removed`, t => {
          if (now) {
            t.dayNotes[ds] = now;
          } else {
            delete t.dayNotes[ds];
          }
        });
      }
    });

  const byId = list => Object.fromEntries((list || []).map(x => [x.id, x]));
  const la = byId(local.activities);
  const ia = byId(incoming.activities);
  Object.keys(ia).forEach(id => {
    if (!la[id] || JSON.stringify(la[id]) !== JSON.stringify(ia[id])) {
      const p = ia[id];
      add("Plans", `${dateWithYear(p.date)}: ${p.time ? formatTime12(p.time) + " " : ""}${p.title}${la[id] ? " (changed)" : ""}`, t => {
        t.activities = t.activities.filter(x => x.id !== id).concat([copyOf(p)]);
      });
    }
  });
  Object.keys(la).forEach(id => {
    if (!ia[id]) {
      add("Plans", `${dateWithYear(la[id].date)}: ${la[id].title} removed`, t => {
        t.activities = t.activities.filter(x => x.id !== id);
      });
    }
  });

  const tileWord = (st, k) => (st.disabledByYear[k] === true ? "skipped" : st.holidayYearOverrides[k] ? nameIn(st, st.holidayYearOverrides[k]) : st.disabledByYear[k] === false ? "on" : "the usual rule");
  [...new Set([...keys(local.disabledByYear), ...keys(incoming.disabledByYear), ...keys(local.holidayYearOverrides), ...keys(incoming.holidayYearOverrides)])]
    .sort()
    .forEach(k => {
      if (tileWord(local, k) !== tileWord(incoming, k)) {
        const [year, key] = k.split(":");
        add("Holidays", `${holidayNameFor(key)} ${year}: ${tileWord(incoming, k)}`, t => {
          ["disabledByYear", "holidayYearOverrides"].forEach(field => {
            if (incoming[field][k] === undefined) {
              delete t[field][k];
            } else {
              t[field][k] = incoming[field][k];
            }
          });
        });
      }
    });

  const chips = summerChips();
  [...new Set([...keys(local.summerSelected), ...keys(incoming.summerSelected)])].forEach(id => {
    if (!!local.summerSelected[id] !== !!incoming.summerSelected[id]) {
      const chip = chips.find(c => c.id === id);
      add("Summer", `${chip ? chip.label : id}: ${incoming.summerSelected[id] ? "given to " + nameIn(incoming, "p1") : "taken off"}`, t => {
        t.summerSelected[id] = !!incoming.summerSelected[id];
      });
    }
  });

  [["customHolidays", "Holidays", "Holiday", x => x.name], ["schoolCustomEvents", "School", "School date", x => `${x.title} (${dateRangeText(x.startDate, x.endDate)})`]].forEach(([field, group, word, text]) => {
    const l = byId(local[field]);
    const n = byId(incoming[field]);
    Object.keys(n).forEach(id => {
      if (!l[id] || JSON.stringify(l[id]) !== JSON.stringify(n[id])) {
        add(group, `${word}: ${text(n[id])}${l[id] ? " (changed)" : " added"}`, t => {
          t[field] = t[field].filter(x => x.id !== id).concat([copyOf(n[id])]);
        });
      }
    });
    Object.keys(l).forEach(id => {
      if (!n[id]) {
        add(group, `${word}: ${text(l[id])} removed`, t => {
          t[field] = t[field].filter(x => x.id !== id);
        });
      }
    });
  });

  HISTORY_GROUPS.forEach(([title, fields], i) => {
    if (fields.some(f => JSON.stringify(local[f]) !== JSON.stringify(incoming[f]))) {
      const isNames = i === HISTORY_GROUPS.length - 1;
      add("Settings", title.replace(" changed", "").replace(" edited", "") + ": use theirs", t => {
        fields.forEach(f => (t[f] = copyOf(incoming[f])));
      }, !isNames);
    }
  });
  return items;
}

function openReview() {
  if (!requireLicense()) {
    return;
  }
  const slot = readCalendarSlot(readActiveCalendarId());
  const intro = document.getElementById("reviewIntro");
  const list = document.getElementById("reviewList");
  const apply = document.getElementById("btnReviewApply");
  const message = document.getElementById("reviewMessage");
  list.innerHTML = "";
  message.hidden = !incomingShareNote;
  message.textContent = incomingShareNote ? `Message: “${incomingShareNote}”` : "";
  reviewItems = [];
  if (!slot) {
    intro.textContent = "There is no calendar saved on this device to compare with. Use “Save to this browser” to keep this one.";
    apply.hidden = true;
  } else {
    const local = normalizeState(Object.assign(defaultState(), slot));
    reviewItems = buildReviewItems(local, state);
    apply.hidden = !reviewItems.length;
    intro.textContent = reviewItems.length
      ? "These are the differences between your saved calendar and this link. Tick what you agree with and apply it; the rest is left as it is."
      : "This link matches your saved calendar. There is nothing to apply.";
    let lastGroup = "";
    reviewItems.forEach((item, i) => {
      if (item.group !== lastGroup) {
        const h = document.createElement("h3");
        h.textContent = item.group;
        list.appendChild(h);
        lastGroup = item.group;
      }
      const label = document.createElement("label");
      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = item.checked;
      box.dataset.index = String(i);
      label.appendChild(box);
      label.appendChild(document.createTextNode(item.text));
      list.appendChild(label);
    });
  }
  kbRemember();
  document.getElementById("reviewOverlay").classList.add("show");
  setTimeout(() => (apply.hidden ? document.getElementById("btnReviewCancel") : apply).focus(), 30);
}

function applyReview() {
  const slot = readCalendarSlot(readActiveCalendarId());
  if (!slot) {
    return;
  }
  const chosen = [...document.querySelectorAll("#reviewList input[type=checkbox]:checked")].map(b => reviewItems[Number(b.dataset.index)]);
  if (!chosen.length) {
    toast("Nothing is ticked.");
    return;
  }
  const target = normalizeState(Object.assign(defaultState(), slot));
  chosen.forEach(item => item.apply(target));
  const result = normalizeState(Object.assign(defaultState(), target));
  result.savedAt = Date.now();
  const id = result.fileId;
  writeCalendarSlot(id, result);
  const log = readHistory(id);
  log.push({ t: Date.now(), who: currentActor(), text: `Applied ${chosen.length} change${chosen.length === 1 ? "" : "s"} from a shared link${incomingShareNote ? `: “${incomingShareNote}”` : ""}` });
  writeHistory(id, log);
  try {
    sessionStorage.setItem("kb_applied", String(chosen.length));
  } catch {}
  history.replaceState(null, "", location.pathname + location.search);
  location.reload();
}

function announceApplied() {
  let count = 0;
  try {
    count = Number(sessionStorage.getItem("kb_applied")) || 0;
    sessionStorage.removeItem("kb_applied");
  } catch {}
  if (count) {
    toast(`Applied ${count} change${count === 1 ? "" : "s"}. Send your calendar back so the other parent has it too.`, {
      label: "Send…",
      run: () => openShareDialog({ message: "Agreed. Here is the updated calendar." })
    });
  }
}

document.getElementById("btnCompareShared").onclick = openReview;
document.getElementById("btnReviewCancel").onclick = () => kbCloseDialog(document.getElementById("reviewOverlay"));
document.getElementById("btnReviewApply").onclick = applyReview;
