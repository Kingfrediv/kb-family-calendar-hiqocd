// ---------------------------------------------------------------------------------------------
// The "Tonight" card: who has tonight, tomorrow, and the next exchange with its time and place.
// Shown for the current year to everyone, recipients of a link included.
// ---------------------------------------------------------------------------------------------

function todayDs() {
  const now = new Date();
  return dateStr(now.getFullYear(), now.getMonth(), now.getDate());
}

// The first night after `fromDs` that goes to a different parent than the night before (within 120 days).
function nextExchange(fromDs) {
  let prev = dayRecord(fromDs);
  for (let i = 1; i <= 120 && prev; i++) {
    const rec = dayRecord(addDays(fromDs, i));
    if (!rec) {
      return null;
    }
    if (prev.owner !== rec.owner && rec.owner !== "none" && rec.owner !== "both" && prev.owner !== "none") {
      return rec;
    }
    prev = rec;
  }
  return null;
}

function drawTonight() {
  const card = document.getElementById("tonightCard");
  const today = todayDs();
  const now = new Date();
  if (state.scheduleUnset || state.year !== now.getFullYear() || today.slice(0, 4) !== String(state.year)) {
    card.hidden = true;
    return;
  }
  const tonight = dayRecord(today);
  const tomorrow = dayRecord(addDays(today, 1));
  if (!tonight) {
    card.hidden = true;
    return;
  }
  card.hidden = false;
  card.classList.remove("p1", "p2", "both");
  if (tonight.owner === "p1" || tonight.owner === "p2" || tonight.owner === "both") {
    card.classList.add(tonight.owner);
  }
  document.getElementById("tonightWho").textContent = tonight.owner === "both" ? "Together" : ownerLabel(tonight.owner);
  document.getElementById("tonightOpen").setAttribute("aria-label", `Tonight: ${tonight.owner === "both" ? "together" : ownerLabel(tonight.owner)}. Open today.`);
  const parts = [];
  if (tomorrow) {
    parts.push(`Tomorrow: ${tomorrow.owner === "both" ? "together" : ownerLabel(tomorrow.owner)}.`);
  }
  const exchange = nextExchange(today);
  if (exchange) {
    const when = exchange.isHoliday || exchange.schoolStatus === "summer" ? state.timeHoliday : exchange.owner === "p1" ? state.timeToP1 : state.timeToP2;
    parts.push(`Next exchange: ${shortDate(exchange.ds)}, to ${ownerLabel(exchange.owner)}${when && when.trim() ? ", " + when.trim() : ""}${state.exchangeLocation ? " at " + state.exchangeLocation.trim() : ""}.`);
  }
  if (tonight.reason && (tonight.isHoliday || tonight.source === "summerP1" || tonight.source === "summerP2")) {
    parts.push(tonight.reason + ".");
  }
  document.getElementById("tonightSub").textContent = parts.join(" ");
}

document.getElementById("tonightOpen").onclick = () => openDaySheet(todayDs());
