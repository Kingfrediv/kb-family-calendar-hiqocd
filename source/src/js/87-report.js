// ---------------------------------------------------------------------------------------------
// The parts of the page that make it a report: overnights by month, notes and plans, and (printed only)
// the prepared-on line and the signature lines.
// ---------------------------------------------------------------------------------------------

function drawTotals(days) {
  const body = document.getElementById("totalsBody");
  const foot = document.getElementById("totalsFoot");
  body.innerHTML = "";
  foot.innerHTML = "";
  document.getElementById("totalsTitle").textContent = `${state.year} overnights by month`;
  const sum = { p1: 0, p2: 0, both: 0, none: 0 };
  for (let m = 0; m < 12; m++) {
    const count = { p1: 0, p2: 0, both: 0, none: 0 };
    days.filter(d => d.m0 === m).forEach(d => count[d.owner]++);
    Object.keys(sum).forEach(k => (sum[k] += count[k]));
    const row = document.createElement("tr");
    [MONTH_NAMES[m], count.p1, count.p2, count.both].forEach((value, i) => {
      const cell = document.createElement(i === 0 ? "th" : "td");
      if (i === 0) {
        cell.scope = "row";
      }
      cell.textContent = String(value);
      row.appendChild(cell);
    });
    body.appendChild(row);
  }
  const total = days.length;
  const pct = n => ((n / total) * 100).toFixed(1) + "%";
  const share1 = sum.p1 + sum.both / 2;
  const share2 = sum.p2 + sum.both / 2;
  const row = document.createElement("tr");
  [`${state.year} total`, `${sum.p1} (${pct(share1)} of nights)`, `${sum.p2} (${pct(share2)} of nights)`, `${sum.both}`].forEach((text, i) => {
    const cell = document.createElement(i === 0 ? "th" : "td");
    if (i === 0) {
      cell.scope = "row";
    }
    cell.textContent = state.scheduleUnset && i > 0 ? "—" : text;
    row.appendChild(cell);
  });
  foot.appendChild(row);
  const note = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 4;
  cell.className = "totals-note";
  cell.textContent = "Nights together count half to each parent in the percentages.";
  note.appendChild(cell);
  foot.appendChild(note);
  drawTotalsWide(days);
}

// The same totals with the months across the page, which takes a third of the height on paper.
function drawTotalsWide(days) {
  const table = document.getElementById("totalsWide");
  table.innerHTML = "";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["", ...MONTH_SHORT, `${state.year}`].forEach(text => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = text;
    headRow.appendChild(th);
  });
  head.appendChild(headRow);
  table.appendChild(head);
  const body = document.createElement("tbody");
  [["p1", p1Name()], ["p2", p2Name()], ["both", "Together"]].forEach(([owner, label]) => {
    const row = document.createElement("tr");
    const th = document.createElement("th");
    th.scope = "row";
    th.textContent = label;
    row.appendChild(th);
    let sum = 0;
    for (let m = 0; m < 12; m++) {
      const n = days.filter(d => d.m0 === m && d.owner === owner).length;
      sum += n;
      const td = document.createElement("td");
      td.textContent = state.scheduleUnset && owner !== "both" ? "—" : String(n);
      row.appendChild(td);
    }
    const total = document.createElement("td");
    total.className = "totals-sum";
    total.textContent = state.scheduleUnset && owner !== "both" ? "—" : String(sum);
    row.appendChild(total);
    body.appendChild(row);
  });
  table.appendChild(body);
}

function drawPlansList() {
  const box = document.getElementById("plansList");
  box.innerHTML = "";
  document.getElementById("plansTitle").textContent = `📝 ${state.year} notes & plans`;
  const dates = [...new Set([...Object.keys(state.dayNotes), ...state.activities.map(a => a.date)])].filter(d => d.startsWith(`${state.year}-`)).sort();
  if (!dates.length) {
    const hint = document.createElement("p");
    hint.className = "hint no-print";
    hint.textContent = "Nothing yet. Tap a day in the calendar to add a note or a plan.";
    box.appendChild(hint);
    document.getElementById("plansCard").classList.add("is-empty");
    return;
  }
  document.getElementById("plansCard").classList.remove("is-empty");
  dates.forEach(ds => {
    const line = document.createElement("div");
    line.className = "plan-line";
    const open = document.createElement("button");
    open.type = "button";
    open.className = "plan-link";
    open.textContent = shortDate(ds);
    open.setAttribute("aria-label", `Open ${longDate(ds)}`);
    open.onclick = () => openDaySheet(ds);
    line.appendChild(open);
    const parts = [];
    if (state.dayNotes[ds]) {
      parts.push(state.dayNotes[ds]);
    }
    plansOn(ds).forEach(p => parts.push(`${p.time ? formatTime12(p.time) + " " : ""}${p.title}`));
    const text = document.createElement("span");
    text.textContent = parts.join(" · ");
    line.appendChild(text);
    box.appendChild(line);
  });
}

function todayText() {
  const now = new Date();
  return `${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

function drawPrintExtras() {
  const child = childName();
  document.getElementById("printMeta").textContent =
    `Prepared ${todayText()} · ${state.year} schedule for ${child ? child + " · " : ""}${p1Name()} and ${p2Name()}. ` +
    "A planning calendar; it is not a court order.";
  const box = document.getElementById("signatureBlock");
  box.innerHTML = "";
  const title = document.createElement("h2");
  title.className = "section-title";
  title.textContent = "Agreed by";
  box.appendChild(title);
  const lead = document.createElement("p");
  lead.textContent = "We have read this schedule and agree to follow it.";
  box.appendChild(lead);
  [p1Name(), p2Name()].forEach(name => {
    const row = document.createElement("div");
    row.className = "sig-row";
    [`${name}, signature`, "Date"].forEach((caption, i) => {
      const cell = document.createElement("div");
      cell.className = i ? "sig-cell sig-date" : "sig-cell";
      const line = document.createElement("div");
      line.className = "sig-line";
      const cap = document.createElement("div");
      cap.className = "sig-cap";
      cap.textContent = caption;
      cell.appendChild(line);
      cell.appendChild(cap);
      row.appendChild(cell);
    });
    box.appendChild(row);
  });
}
