// ---------------------------------------------------------------------------------------------
// Small comforts: swipe between months, dates written out in words, time suggestions.
// ---------------------------------------------------------------------------------------------

// Swipe left or right on the calendar to change month (month view only)
(function setUpSwipe() {
  const box = document.getElementById("calendarContainer");
  let startX = 0;
  let startY = 0;
  let startAt = 0;
  let tracking = false;
  box.addEventListener(
    "touchstart",
    ev => {
      tracking = state.viewMode === "month" && ev.touches.length === 1;
      if (tracking) {
        startX = ev.touches[0].clientX;
        startY = ev.touches[0].clientY;
        startAt = Date.now();
      }
    },
    { passive: true }
  );
  box.addEventListener(
    "touchend",
    ev => {
      if (!tracking) {
        return;
      }
      tracking = false;
      const t = ev.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2 && Date.now() - startAt < 800) {
        kbShiftMonth(dx < 0 ? 1 : -1);
      }
    },
    { passive: true }
  );
  box.addEventListener("touchcancel", () => {
    tracking = false;
  });
})();

// "Friday, June 5, 2026" under every date box, so nobody has to decode 06/05/2026
function refreshDateWords() {
  document.querySelectorAll('.sidebar input[type="date"]').forEach(input => {
    let words = input.nextElementSibling;
    if (!words || !words.classList.contains("date-words")) {
      words = document.createElement("div");
      words.className = "date-words";
      words.setAttribute("aria-hidden", "true");
      input.insertAdjacentElement("afterend", words);
    }
    words.textContent = kbValidDate(input.value) ? longDate(input.value) : "";
  });
}

// Suggestions for the exchange-time boxes (typing anything is still fine)
(function addTimeSuggestions() {
  const list = document.createElement("datalist");
  list.id = "timeSuggestions";
  ["After school", "8:00 AM", "9:00 AM", "Noon", "3:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "Friday 6:00 PM", "Sunday 6:00 PM"].forEach(t => {
    const o = document.createElement("option");
    o.value = t;
    list.appendChild(o);
  });
  document.body.appendChild(list);
  ["timeToP1Input", "timeToP2Input", "timeHolidayInput"].forEach(id => {
    document.getElementById(id).setAttribute("list", "timeSuggestions");
  });
})();

document.querySelector(".sidebar").addEventListener("change", () => setTimeout(refreshDateWords, 0));
