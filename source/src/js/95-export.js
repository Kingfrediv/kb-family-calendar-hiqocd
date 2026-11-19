function parseExchangeTime(_0x3cdea4, _0x5c4bec, _0x1d1fc1) {
  const _0x5e23e9 = String(_0x3cdea4 || "");
  const _0x51501b = _0x5e23e9.split("(")[0].trim();
  if (/after\s*school/i.test(_0x51501b)) {
    return {
      h: 15,
      m: 0,
      label: _0x5e23e9
    };
  }
  const _0x1c820f = _0x51501b.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!_0x1c820f) {
    return {
      h: _0x5c4bec,
      m: _0x1d1fc1,
      label: _0x5e23e9
    };
  }
  let _0x22046f = parseInt(_0x1c820f[1], 10);
  let _0x33b26c = _0x1c820f[2] ? parseInt(_0x1c820f[2], 10) : 0;
  const _0x2b1606 = (_0x1c820f[3] || "").toLowerCase();
  if (_0x2b1606.startsWith("p") && _0x22046f < 12) {
    _0x22046f += 12;
  }
  if (_0x2b1606.startsWith("a") && _0x22046f === 12) {
    _0x22046f = 0;
  }
  if (_0x22046f > 23) {
    _0x22046f = 23;
  }
  if (_0x33b26c > 59) {
    _0x33b26c = 59;
  }
  return {
    h: _0x22046f,
    m: _0x33b26c,
    label: _0x5e23e9
  };
}

function icsEscape(_0x1206ff) {
  return String(_0x1206ff ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function pad2(_0x44bd03) {
  return String(_0x44bd03).padStart(2, "0");
}

function icsDate(_0x1d87ce, _0x2a7067, _0x491e57) {
  return `${_0x1d87ce}${pad2(_0x2a7067 + 1)}${pad2(_0x491e57)}`;
}

function icsDateTime(_0x62c042, _0x410ac4, _0x5a3a94, _0x5f4e70, _0x54fab6) {
  return `${icsDate(_0x62c042, _0x410ac4, _0x5a3a94)}T${pad2(_0x5f4e70)}${pad2(_0x54fab6)}00`;
}

function icsUtcStamp(_0x40ef5d) {
  return (
    _0x40ef5d.getUTCFullYear() +
    pad2(_0x40ef5d.getUTCMonth() + 1) +
    pad2(_0x40ef5d.getUTCDate()) +
    "T" +
    pad2(_0x40ef5d.getUTCHours()) +
    pad2(_0x40ef5d.getUTCMinutes()) +
    pad2(_0x40ef5d.getUTCSeconds()) +
    "Z"
  );
}

function icsFold(_0x1f04aa) {
  const _0x4bc684 = new TextEncoder();
  const _0x22481e = new TextDecoder();
  const _0x25afff = _0x4bc684.encode(_0x1f04aa);
  if (_0x25afff.length <= 75) {
    return _0x1f04aa;
  }
  const _0x1c1120 = [];
  let _0x2129dc = 0;
  let _0x3abfd7 = true;
  while (_0x2129dc < _0x25afff.length) {
    let _0xed0140 = Math.min(_0x3abfd7 ? 75 : 74, _0x25afff.length - _0x2129dc);
    while (
      _0xed0140 > 1 &&
      _0x2129dc + _0xed0140 < _0x25afff.length &&
      (_0x25afff[_0x2129dc + _0xed0140] & 192) === 128
    ) {
      _0xed0140--;
    }
    while (_0xed0140 > 1 && (_0x25afff[_0x2129dc + _0xed0140 - 1] & 192) === 128) {
      _0xed0140--;
    }
    if (_0xed0140 > 1 && _0x25afff[_0x2129dc + _0xed0140 - 1] >= 192) {
      _0xed0140--;
    }
    if (_0xed0140 < 1) {
      _0xed0140 = 1;
    }
    const _0xe03bad = _0x22481e.decode(_0x25afff.slice(_0x2129dc, _0x2129dc + _0xed0140));
    _0x1c1120.push(_0x3abfd7 ? _0xe03bad : " " + _0xe03bad);
    _0x2129dc += _0xed0140;
    _0x3abfd7 = false;
  }
  return _0x1c1120.join("\r\n");
}

function addDaysParts(_0x33ee5b, _0x4a017c, _0x45014f, _0x44ca80) {
  const _0x3182b9 = noonDate(_0x33ee5b, _0x4a017c, _0x45014f);
  _0x3182b9.setDate(_0x3182b9.getDate() + _0x44ca80);
  return {
    y: _0x3182b9.getFullYear(),
    m0: _0x3182b9.getMonth(),
    d: _0x3182b9.getDate()
  };
}

function csvCell(_0x14a55e) {
  let _0x52ff69 = String(_0x14a55e ?? "");
  if (/^[=+\-@\t\r]/.test(_0x52ff69)) {
    _0x52ff69 = "'" + _0x52ff69;
  }
  if (/[",\r\n]/.test(_0x52ff69)) {
    return '"' + _0x52ff69.replace(/"/g, '""') + '"';
  }
  return _0x52ff69;
}

function buildCsv(_0x28a3ab) {
  const { days: _0x3af2ea } = buildYear(_0x28a3ab);
  const _0x19fa7a = ["Date", "Weekday", "Parent", "Event", "Notes"].map(h => tr(h));
  const _0x27116d = [_0x19fa7a.map(csvCell).join(",")];
  _0x3af2ea.forEach(_0x3fdb1c => {
    const _0x500999 = [];
    if (_0x3fdb1c.splitType) {
      _0x500999.push(tr("Handoff " + _0x3fdb1c.reason));
    }
    if (_0x3fdb1c.customSchoolLabel) {
      _0x500999.push(_0x3fdb1c.customSchoolLabel);
    }
    if (_0x3fdb1c.isOverride) {
      _0x500999.push(tr("Custom override"));
    }
    if (_0x3fdb1c.isHoliday && _0x3fdb1c.reason) {
    }
    _0x27116d.push(
      [_0x3fdb1c.ds, DOW_3[_0x3fdb1c.dow], tr(ownerLabel(_0x3fdb1c.owner)), tr(_0x3fdb1c.reason || "", true), _0x500999.join("; ")]
        .map(csvCell)
        .join(",")
    );
  });
  return "\uFEFF" + _0x27116d.join("\r\n") + "\r\n";
}

function safeFileName(_0x2a5ad7) {
  return (
    String(_0x2a5ad7 || "parenting-calendar")
      .replace(/[^\w\-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "parenting-calendar"
  );
}

function downloadBlob(_0x355f40, _0x4d3b9b) {
  const _0x4b6db9 = document.createElement("a");
  _0x4b6db9.href = URL.createObjectURL(_0x355f40);
  _0x4b6db9.download = _0x4d3b9b;
  document.body.appendChild(_0x4b6db9);
  _0x4b6db9.click();
  setTimeout(() => {
    URL.revokeObjectURL(_0x4b6db9.href);
    _0x4b6db9.remove();
  }, 1500);
}

const BAKE_CLEAR_IDS = [
  "yearSelect",
  "monthSelect",
  "bdayChildMonth",
  "bdayChildDay",
  "bdayP1Month",
  "bdayP1Day",
  "bdayP2Month",
  "bdayP2Day",
  "customHolMonth",
  "customHolDay",
  "calendarContainer",
  "holidayTiles",
  "holidayTableBody",
  "baseDayPickerContainer",
  "summerMonths",
  "summerStartMonth",
  "summerStartDay",
  "summerEndMonth",
  "summerEndDay",
  "winterStartDay",
  "winterEndDay",
  "regionSelect",
  "packControls",
  "customHolList",
  "sidebarSchoolList",
  "rulesSummaryBox",
  "schoolMainDisplay",
  "baseSplitBar",
  "saveStatus"
];

function downloadCopy() {
  if (!requireLicense()) {
    return;
  }
  notesEditing = false;
  renderChrome();
  // a pop-up message that happens to be on screen must not be frozen into the copy
  const kbToast = document.getElementById("toast");
  const kbToastText = document.getElementById("toastText");
  const kbToastAction = document.getElementById("toastAction");
  const kbToastOn = kbToast.classList.contains("show");
  const kbToastMessage = kbToastText.textContent;
  const kbToastActionHidden = kbToastAction.hidden;
  const kbToastActionLabel = kbToastAction.textContent;
  kbToast.classList.remove("show", "has-action");
  kbToastText.textContent = "";
  kbToastAction.hidden = true;
  kbToastAction.textContent = "";
  const kbOpenDialogs = [...document.querySelectorAll(".setup-overlay.show")];
  kbOpenDialogs.forEach(o => o.classList.remove("show"));
  const _0x4f3bb3 = document.getElementById("setupOverlay");
  const _0x13f46 = document.getElementById("sharedBanner");
  const _0x259f74 = document.getElementById("demoBanner");
  const _0x367c49 = _0x4f3bb3 && _0x4f3bb3.classList.contains("show");
  const _0x25e3fc = _0x13f46 && _0x13f46.classList.contains("show");
  const _0x3c03c2 = _0x259f74 && _0x259f74.classList.contains("show");
  if (_0x4f3bb3) {
    _0x4f3bb3.classList.remove("show");
  }
  if (_0x13f46) {
    _0x13f46.classList.remove("show");
  }
  if (_0x259f74) {
    _0x259f74.classList.remove("show");
  }
  const _0x434713 = {};
  BAKE_CLEAR_IDS.forEach(_0x9f80d0 => {
    const _0x2779b4 = document.getElementById(_0x9f80d0);
    if (_0x2779b4) {
      _0x434713[_0x9f80d0] = _0x2779b4.innerHTML;
      _0x2779b4.innerHTML = "";
    }
  });
  const _0x519d1a = document.getElementById("baked-state");
  const _0x3f9914 = _0x519d1a.textContent;
  const _0x3d05e6 = Object.assign({}, state);
  delete _0x3d05e6.demoSample;
  // the copy gets its own identity; the calendar you are working on keeps its own storage slot
  if (!_0x3d05e6.fileId) {
    _0x3d05e6.fileId = "cal_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }
  _0x3d05e6.savedAt = Date.now();
  _0x519d1a.textContent = JSON.stringify(_0x3d05e6).replace(/</g, "\\u003c");
  const _0x1ffd28 = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;
  _0x519d1a.textContent = _0x3f9914;
  BAKE_CLEAR_IDS.forEach(_0x5c25bc => {
    const _0x298d08 = document.getElementById(_0x5c25bc);
    if (_0x298d08 && _0x434713[_0x5c25bc] != null) {
      _0x298d08.innerHTML = _0x434713[_0x5c25bc];
    }
  });
  if (_0x367c49) {
    _0x4f3bb3.classList.add("show");
  }
  if (_0x25e3fc) {
    _0x13f46.classList.add("show");
  }
  if (_0x3c03c2) {
    _0x259f74.classList.add("show");
  }
  kbOpenDialogs.forEach(o => o.classList.add("show"));
  kbToastText.textContent = kbToastMessage;
  kbToastAction.textContent = kbToastActionLabel;
  kbToastAction.hidden = kbToastActionHidden;
  if (!kbToastActionHidden) {
    kbToast.classList.add("has-action");
  }
  if (kbToastOn) {
    kbToast.classList.add("show");
  }
  fillYearMonthSelects();
  const _0xc6c871 = childName();
  const _0x5b3eca = safeFileName((_0xc6c871 ? _0xc6c871 + "-" : "") + "parenting-calendar-" + state.year) + ".html";
  downloadBlob(
    new Blob([_0x1ffd28], {
      type: "text/html;charset=utf-8"
    }),
    _0x5b3eca
  );
  toast("Downloaded a self-contained copy you can send");
}
