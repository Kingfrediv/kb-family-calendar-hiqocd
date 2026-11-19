function p1Name() {
  return (state.p1Name || "").trim() || "Parent 1";
}

function p2Name() {
  return (state.p2Name || "").trim() || "Parent 2";
}

function childName() {
  return (state.childName || "").trim();
}

function childBirthdayLabel() {
  const _0x202401 = childName();
  if (_0x202401) {
    return `${_0x202401}'s Birthday`;
  } else {
    return "Child's Birthday";
  }
}

function setInputValue(_0x22977e, _0x23b3f1) {
  const _0x10d4ec = document.getElementById(_0x22977e);
  if (_0x10d4ec && document.activeElement !== _0x10d4ec) {
    _0x10d4ec.value = _0x23b3f1;
  }
}

function parseColor(_0x3a8c67) {
  const _0x131599 = (_0x3a8c67 || "#eab308").replace("#", "");
  const _0x3bd0bb =
    _0x131599.length === 3
      ? _0x131599
          .split("")
          .map(_0x57c5b9 => _0x57c5b9 + _0x57c5b9)
          .join("")
      : _0x131599;
  const _0x434d4a = parseInt(_0x3bd0bb, 16);
  if (isNaN(_0x434d4a)) {
    return {
      r: 234,
      g: 179,
      b: 8
    };
  } else {
    return {
      r: (_0x434d4a >> 16) & 255,
      g: (_0x434d4a >> 8) & 255,
      b: _0x434d4a & 255
    };
  }
}

function lighten(_0x4a7098, _0xf16c2 = 0.78) {
  const { r: _0x3727d4, g: _0x42a896, b: _0x4927c9 } = parseColor(_0x4a7098);
  return `rgb(${Math.round(_0x3727d4 + (255 - _0x3727d4) * _0xf16c2)},${Math.round(_0x42a896 + (255 - _0x42a896) * _0xf16c2)},${Math.round(_0x4927c9 + (255 - _0x4927c9) * _0xf16c2)})`;
}

function darken(_0x1406f2, _0x55e1e2 = 0.42) {
  const { r: _0x4383a9, g: _0x3bcd02, b: _0xf70f15 } = parseColor(_0x1406f2);
  return `rgb(${Math.round(_0x4383a9 * _0x55e1e2)},${Math.round(_0x3bcd02 * _0x55e1e2)},${Math.round(_0xf70f15 * _0x55e1e2)})`;
}

function luminance(_0x1ede29) {
  const { r: _0x59790b, g: _0x30694d, b: _0x3f3749 } = parseColor(_0x1ede29);
  return (_0x59790b * 0.299 + _0x30694d * 0.587 + _0x3f3749 * 0.114) / 255;
}

function applyColors() {
  const _0x1512a5 = document.documentElement.style;
  const _0x241e90 = state.p1Color || "#eab308";
  const _0x34145f = state.p2Color || "#16a34a";
  const _0x7b3501 = state.headerColor || "#18181b";
  _0x1512a5.setProperty("--p1-solid", _0x241e90);
  _0x1512a5.setProperty("--p1-border-l", darken(_0x241e90, 0.8));
  _0x1512a5.setProperty("--p1-bg-l", lighten(_0x241e90, 0.74));
  _0x1512a5.setProperty("--p1-text-l", darken(_0x241e90, 0.34));
  _0x1512a5.setProperty("--p2-solid", _0x34145f);
  _0x1512a5.setProperty("--p2-border-l", darken(_0x34145f, 0.82));
  _0x1512a5.setProperty("--p2-bg-l", lighten(_0x34145f, 0.8));
  _0x1512a5.setProperty("--p2-text-l", darken(_0x34145f, 0.42));
  // dark theme: a deep tint of the same color, its own color as the edge, a pale tint for the text
  _0x1512a5.setProperty("--p1-bg-d", darken(_0x241e90, 0.3));
  _0x1512a5.setProperty("--p1-border-d", _0x241e90);
  _0x1512a5.setProperty("--p1-text-d", lighten(_0x241e90, 0.82));
  _0x1512a5.setProperty("--p2-bg-d", darken(_0x34145f, 0.34));
  _0x1512a5.setProperty("--p2-border-d", _0x34145f);
  _0x1512a5.setProperty("--p2-text-d", lighten(_0x34145f, 0.82));
  _0x1512a5.setProperty("--header-bg", _0x7b3501);
  const _0x1ac8bc = luminance(_0x7b3501) > 0.58;
  _0x1512a5.setProperty("--header-text", _0x1ac8bc ? "#18181b" : lighten(_0x241e90, 0.65));
  _0x1512a5.setProperty("--header-sub", _0x1ac8bc ? "#3f3f46" : lighten(_0x34145f, 0.72));
}

// Shows a short message. An optional action ({label, run}) adds a button, e.g. "Undo".
function toast(message, action) {
  const box = document.getElementById("toast");
  const text = document.getElementById("toastText");
  const button = document.getElementById("toastAction");
  text.textContent = message;
  if (action && action.label && typeof action.run === "function") {
    button.textContent = action.label;
    button.hidden = false;
    button.onclick = () => {
      box.classList.remove("show");
      action.run();
    };
  } else {
    button.hidden = true;
    button.textContent = "";
    button.onclick = null;
  }
  box.classList.toggle("has-action", !!(action && action.label));
  box.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => box.classList.remove("show"), action ? 9000 : 3200);
}

// Fill an element with sentences, each in its own span, so each can be translated on its own
function setSentences(el, sentences) {
  el.textContent = "";
  sentences
    .filter(Boolean)
    .forEach((text, i) => {
      if (i) {
        el.appendChild(document.createTextNode(" "));
      }
      const span = document.createElement("span");
      span.textContent = text;
      el.appendChild(span);
    });
}

function esc(_0x265182) {
  return String(_0x265182 || "").replace(
    /[&<>"']/g,
    _0x693d85 =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[_0x693d85]
  );
}

function dateStr(_0x544a9a, _0x3a9625, _0x784769) {
  return `${_0x544a9a}-${String(_0x3a9625 + 1).padStart(2, "0")}-${String(_0x784769).padStart(2, "0")}`;
}

function clampedDateStr(_0x1cf154, _0x1b385b, _0xafb6a8) {
  return dateStr(_0x1cf154, _0x1b385b, Math.min(_0xafb6a8, daysInMonth(_0x1cf154, _0x1b385b)));
}

function noonDate(_0x59d504, _0x56215e, _0xf4d391) {
  return new Date(_0x59d504, _0x56215e, _0xf4d391, 12, 0, 0);
}

function parseDateStr(_0x100144) {
  const [_0x419e02, _0x29bc2c, _0x584102] = _0x100144.split("-").map(Number);
  return noonDate(_0x419e02, _0x29bc2c - 1, _0x584102);
}

function addDays(_0x58addb, _0xf498e6) {
  const _0x117910 = parseDateStr(_0x58addb);
  _0x117910.setDate(_0x117910.getDate() + _0xf498e6);
  return dateStr(_0x117910.getFullYear(), _0x117910.getMonth(), _0x117910.getDate());
}

function daysInMonth(_0x6e3908, _0x2c032f) {
  return new Date(_0x6e3908, _0x2c032f + 1, 0).getDate();
}

function nthWeekday(_0x37b8e3, _0x1cbd98, _0x44d2ae, _0x6c366f) {
  if (_0x6c366f === -1) {
    for (let _0x438e2e = daysInMonth(_0x37b8e3, _0x1cbd98); _0x438e2e >= 1; _0x438e2e--) {
      if (noonDate(_0x37b8e3, _0x1cbd98, _0x438e2e).getDay() === _0x44d2ae) {
        return dateStr(_0x37b8e3, _0x1cbd98, _0x438e2e);
      }
    }
  }
  let _0x2bfe45 = 0;
  for (let _0x64137d = 1; _0x64137d <= daysInMonth(_0x37b8e3, _0x1cbd98); _0x64137d++) {
    if (noonDate(_0x37b8e3, _0x1cbd98, _0x64137d).getDay() === _0x44d2ae && ++_0x2bfe45 === _0x6c366f) {
      return dateStr(_0x37b8e3, _0x1cbd98, _0x64137d);
    }
  }
  return null;
}

function easterDate(_0x369e1b) {
  const _0x1c1571 = _0x369e1b % 19;
  const _0x27dc5f = Math.floor(_0x369e1b / 100);
  const _0x5d4cab = _0x369e1b % 100;
  const _0x2747e3 = Math.floor(_0x27dc5f / 4);
  const _0x4bbf0b = _0x27dc5f % 4;
  const _0x24d497 = Math.floor((_0x27dc5f + 8) / 25);
  const _0x31e24f = Math.floor((_0x27dc5f - _0x24d497 + 1) / 3);
  const _0x582d36 = (_0x1c1571 * 19 + _0x27dc5f - _0x2747e3 - _0x31e24f + 15) % 30;
  const _0x541fe6 = Math.floor(_0x5d4cab / 4);
  const _0x333681 = _0x5d4cab % 4;
  const _0x5841f9 = (32 + _0x4bbf0b * 2 + _0x541fe6 * 2 - _0x582d36 - _0x333681) % 7;
  const _0x40210c = Math.floor((_0x1c1571 + _0x582d36 * 11 + _0x5841f9 * 22) / 451);
  return dateStr(
    _0x369e1b,
    Math.floor((_0x582d36 + _0x5841f9 - _0x40210c * 7 + 114) / 31) - 1,
    ((_0x582d36 + _0x5841f9 - _0x40210c * 7 + 114) % 31) + 1
  );
}

function schoolDatesFor(_0x1a13ff) {
  return {
    schoolEnd: state.schoolEndByYear[_0x1a13ff] || nthWeekday(_0x1a13ff, 4, 5, -1),
    schoolStart: state.schoolStartByYear[_0x1a13ff] || nthWeekday(_0x1a13ff, 7, 1, 3),
    springBreakStart: state.springBreakByYear[_0x1a13ff] || nthWeekday(_0x1a13ff, 2, 1, 3)
  };
}

function rotationOwner(_0x113d51, _0x2be5e2) {
  const _0x897765 = _0x113d51 % 2 === 0 ? state.evenGroupAP1 : !state.evenGroupAP1;
  if (_0x2be5e2 === "A") {
    if (_0x897765) {
      return "p1";
    } else {
      return "p2";
    }
  } else if (_0x897765) {
    return "p2";
  } else {
    return "p1";
  }
}

function ownerLabel(_0x3f6c3c) {
  if (_0x3f6c3c === "p1") {
    return p1Name();
  } else if (_0x3f6c3c === "p2") {
    return p2Name();
  } else if (_0x3f6c3c === "none") {
    return "Unassigned";
  } else {
    return "Together";
  }
}

function markScheduleSet() {
  state.scheduleUnset = false;
}

function kbRemember() {
  const a = document.activeElement;
  kbOpener = a && a !== document.body ? a : null;
}

function kbReturnFocus() {
  const fk = kbOpener && kbOpener.dataset ? kbOpener.dataset.fk : "";
  let el = kbOpener && document.contains(kbOpener) ? kbOpener : null;
  if (!el && fk) {
    el = [...document.querySelectorAll("[data-fk]")].find(e => e.dataset.fk === fk) || null;
  }
  kbOpener = null;
  if (el && typeof el.focus === "function") {
    el.focus({
      preventScroll: true
    });
  }
}

// Move focus into a dialog a moment after it opens, unless something inside it already has focus (someone who
// starts typing at once, or a test, must not have the cursor pulled out from under them).
function kbFocusLater(dialogId, target, delay) {
  setTimeout(() => {
    const dialog = document.getElementById(dialogId);
    const el = typeof target === "function" ? target() : target;
    const active = document.activeElement;
    if (!el || (dialog && active && active !== dialog && dialog.contains(active) && active.matches("input,textarea,select,button,a[href]"))) {
      return;
    }
    el.focus();
  }, delay);
}

function kbCloseDialog(el) {
  if (!el) {
    return false;
  }
  if (el.id === "shareOverlay") {
    el.classList.remove("show");
    kbReturnFocus();
    return true;
  }
  if (el.id === "licenseOverlay") {
    if (needsLicense()) {
      return false;
    }
    closeLicenseDialog();
    kbReturnFocus();
    return true;
  }
  if (el.id === "setupOverlay") {
    finishSetup(false);
    return true;
  }
  if (el.id === "icsOverlay") {
    el.classList.remove("show");
    kbReturnFocus();
    return true;
  }
  if (el.id === "daySheet") {
    closeDaySheet();
    return true;
  }
  if (el.id === "reviewOverlay") {
    el.classList.remove("show");
    kbReturnFocus();
    return true;
  }
  if (el.id === "historyOverlay") {
    el.classList.remove("show");
    kbReturnFocus();
    return true;
  }
  return false;
}

// ---- plain-language dates and times ("Wednesday, March 4", "Wed, Mar 4", "3:30 PM")
function longDate(ds) {
  const d = parseDateStr(ds);
  return `${DOW_FULL[d.getDay()]}, ${monthDay(d.getMonth(), d.getDate(), false)}`;
}

function shortDate(ds) {
  const d = parseDateStr(ds);
  return `${DOW_3[d.getDay()]}, ${monthDay(d.getMonth(), d.getDate(), true)}`;
}

// "Mar 4 – Mar 6" for a run of days, or "Mar 4" for one
function dateRangeText(first, last) {
  const a = parseDateStr(first);
  const b = parseDateStr(last);
  const one = d => monthDay(d.getMonth(), d.getDate(), true);
  return first === last ? one(a) : `${one(a)} – ${one(b)}`;
}

function formatTime12(hhmm) {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm || "");
  if (!m) {
    return "";
  }
  const h = Number(m[1]);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h < 12 ? "AM" : "PM"}`;
}

// ---- the letters shown on days when "initials & pattern" is on
function nameStart(name, count) {
  const chars = Array.from((name || "").trim());
  return chars
    .slice(0, count)
    .join("")
    .toUpperCase();
}

function ownerInitial(owner) {
  if (owner === "none") {
    return "";
  }
  let a = nameStart(p1Name(), 1) || "1";
  let b = nameStart(p2Name(), 1) || "2";
  if (a === b) {
    // two parents with the same first letter are told apart by two letters, and by 1 and 2 if that is not enough either
    a = nameStart(p1Name(), 2);
    b = nameStart(p2Name(), 2);
    if (a === b) {
      a = "1";
      b = "2";
    }
  }
  return owner === "p1" ? a : owner === "p2" ? b : `${a}+${b}`;
}
