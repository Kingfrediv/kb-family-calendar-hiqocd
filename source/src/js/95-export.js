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

function usTimeZoneRules(_0x2f5913) {
  const _0x18150 = {
    "America/New_York": {
      d: "-0400",
      s: "-0500",
      dn: "EDT",
      sn: "EST"
    },
    "America/Chicago": {
      d: "-0500",
      s: "-0600",
      dn: "CDT",
      sn: "CST"
    },
    "America/Denver": {
      d: "-0600",
      s: "-0700",
      dn: "MDT",
      sn: "MST"
    },
    "America/Los_Angeles": {
      d: "-0700",
      s: "-0800",
      dn: "PDT",
      sn: "PST"
    },
    "America/Phoenix": {
      d: "-0700",
      s: "-0700",
      dn: "MST",
      sn: "MST"
    },
    "America/Anchorage": {
      d: "-0800",
      s: "-0900",
      dn: "AKDT",
      sn: "AKST"
    },
    "Pacific/Honolulu": {
      d: "-1000",
      s: "-1000",
      dn: "HST",
      sn: "HST"
    }
  };
  return _0x18150[_0x2f5913] || null;
}

function vtimezoneFor(_0x332bd6) {
  const _0xf900c7 = usTimeZoneRules(_0x332bd6);
  if (!_0xf900c7) {
    return null;
  }
  if (_0xf900c7.d === _0xf900c7.s) {
    return [
      "BEGIN:VTIMEZONE",
      `TZID:${_0x332bd6}`,
      `X-LIC-LOCATION:${_0x332bd6}`,
      "BEGIN:STANDARD",
      `TZOFFSETFROM:${_0xf900c7.s}`,
      `TZOFFSETTO:${_0xf900c7.s}`,
      `TZNAME:${_0xf900c7.sn}`,
      "DTSTART:19700101T000000",
      "END:STANDARD",
      "END:VTIMEZONE"
    ];
  }
  return [
    "BEGIN:VTIMEZONE",
    `TZID:${_0x332bd6}`,
    `X-LIC-LOCATION:${_0x332bd6}`,
    "BEGIN:DAYLIGHT",
    `TZOFFSETFROM:${_0xf900c7.s}`,
    `TZOFFSETTO:${_0xf900c7.d}`,
    `TZNAME:${_0xf900c7.dn}`,
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    `TZOFFSETFROM:${_0xf900c7.d}`,
    `TZOFFSETTO:${_0xf900c7.s}`,
    `TZNAME:${_0xf900c7.sn}`,
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE"
  ];
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

function buildIcs(_0x378e7f) {
  const { days: _0x1bf149 } = buildYear(_0x378e7f);
  const _0x30598f = p1Name();
  const _0x22bcab = p2Name();
  const _0x48e5a9 = childName();
  const _0x33078a = (_0x48e5a9 ? `${_0x48e5a9} ` : "") + "Parenting Calendar " + _0x378e7f;
  const _0x836674 = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  const _0x5899ae = vtimezoneFor(_0x836674);
  const _0x2959da = !!_0x5899ae;
  const _0x253e4c = icsUtcStamp(new Date());
  const _0x115fe0 = (state.fileId || "spc") + "-" + _0x378e7f;
  const _0x42c758 = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kingdom Building//Parenting Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:" + icsEscape(_0x33078a)
  ];
  if (_0x2959da) {
    _0x42c758.push("X-WR-TIMEZONE:" + _0x836674);
    _0x42c758.push.apply(_0x42c758, _0x5899ae);
  } else {
    _0x42c758.push("X-WR-TIMEZONE:floating");
  }
  function _0x12bed3(_0x3b0bb6) {
    _0x42c758.push("BEGIN:VEVENT");
    Object.keys(_0x3b0bb6).forEach(_0x25c5d7 => {
      if (_0x3b0bb6[_0x25c5d7] == null || _0x3b0bb6[_0x25c5d7] === "") {
        return;
      }
      _0x42c758.push(_0x25c5d7 + ":" + _0x3b0bb6[_0x25c5d7]);
    });
    _0x42c758.push("END:VEVENT");
  }
  let _0x207a26 = 0;
  while (_0x207a26 < _0x1bf149.length) {
    const _0x48afd2 = _0x1bf149[_0x207a26].owner;
    const _0xb03271 = _0x1bf149[_0x207a26];
    let _0x557324 = _0x207a26 + 1;
    while (_0x557324 < _0x1bf149.length && _0x1bf149[_0x557324].owner === _0x48afd2) {
      _0x557324++;
    }
    if (_0x48afd2 === "none") {
      _0x207a26 = _0x557324;
      continue;
    }
    const _0x395a8f = _0x1bf149[_0x557324 - 1];
    const _0x4a6f40 = addDaysParts(_0x395a8f.y, _0x395a8f.m0, _0x395a8f.d, 1);
    const _0x28e4a1 = _0x1bf149
      .slice(_0x207a26, _0x557324)
      .filter(_0x4c3895 => _0x4c3895.isHoliday)
      .map(_0x47fee8 => _0x47fee8.reason);
    const _0x72a396 =
      _0x48afd2 === "both"
        ? `Together${_0x28e4a1.length ? " — " + _0x28e4a1[0] : ""}`
        : `Overnight with ${ownerLabel(_0x48afd2)}${_0x28e4a1.length ? " — " + _0x28e4a1[0] : ""}`;
    const _0x356138 = [`Overnight: ${ownerLabel(_0x48afd2)}`];
    if (_0x28e4a1.length) {
      _0x356138.push("Events: " + _0x28e4a1.join("; "));
    }
    if (state.exchangeLocation) {
      _0x356138.push("Exchange location: " + state.exchangeLocation);
    }
    _0x12bed3({
      UID: icsEscape(`block-${_0x115fe0}-${_0xb03271.ds}@parenting-calendar`),
      DTSTAMP: _0x253e4c,
      "DTSTART;VALUE=DATE": icsDate(_0xb03271.y, _0xb03271.m0, _0xb03271.d),
      "DTEND;VALUE=DATE": icsDate(_0x4a6f40.y, _0x4a6f40.m0, _0x4a6f40.d),
      SUMMARY: icsEscape(_0x72a396),
      DESCRIPTION: icsEscape(_0x356138.join("\n")),
      TRANSP: "TRANSPARENT"
    });
    _0x207a26 = _0x557324;
  }
  const _0x1bc34e = parseExchangeTime(state.timeToP1, 15, 0);
  const _0x514047 = parseExchangeTime(state.timeToP2, 18, 0);
  const _0x34a2b2 = parseExchangeTime(state.timeHoliday, 18, 0);
  _0x1bf149.forEach((_0x54f57d, _0x49ca03) => {
    const _0x37cb61 = _0x49ca03 === 0 ? null : _0x1bf149[_0x49ca03 - 1];
    const _0x3aefdc =
      _0x37cb61 &&
      _0x37cb61.owner !== _0x54f57d.owner &&
      _0x54f57d.owner !== "both" &&
      _0x54f57d.owner !== "none" &&
      _0x37cb61.owner !== "none";
    const _0x4a3ebc = !!_0x54f57d.splitType;
    if (!_0x3aefdc && !_0x4a3ebc) {
      return;
    }
    if (_0x54f57d.owner === "none") {
      return;
    }
    const _0x13ab19 =
      _0x54f57d.isHoliday || _0x54f57d.schoolStatus === "summer"
        ? _0x34a2b2
        : _0x54f57d.owner === "p1"
          ? _0x1bc34e
          : _0x514047;
    if (!String(_0x13ab19.label || "").trim()) {
      // no time entered: mark the day instead of inventing a clock time
      const kbTo = `to ${ownerLabel(_0x54f57d.owner)}`;
      const kbNext = addDaysParts(_0x54f57d.y, _0x54f57d.m0, _0x54f57d.d, 1);
      _0x12bed3({
        UID: icsEscape(`exch-${_0x115fe0}-${_0x54f57d.ds}@parenting-calendar`),
        DTSTAMP: _0x253e4c,
        "DTSTART;VALUE=DATE": icsDate(_0x54f57d.y, _0x54f57d.m0, _0x54f57d.d),
        "DTEND;VALUE=DATE": icsDate(kbNext.y, kbNext.m0, kbNext.d),
        SUMMARY: icsEscape(`Exchange ${kbTo}`),
        DESCRIPTION: icsEscape(
          `Handoff ${kbTo}. Exchange time not set.${_0x54f57d.reason ? ` ${_0x54f57d.reason}` : ""}`
        ),
        LOCATION: icsEscape(state.exchangeLocation || ""),
        TRANSP: "TRANSPARENT"
      });
      return;
    }
    const _0x1fb423 = _0x2959da ? `DTSTART;TZID=${_0x836674}` : "DTSTART";
    const _0x229b38 = _0x13ab19.h;
    const _0xcf0ea0 = _0x13ab19.m + 30;
    const _0x1d65e8 = _0xcf0ea0 >= 60 ? _0x229b38 + 1 : _0x229b38;
    const _0x20249c = _0xcf0ea0 % 60;
    const _0x387756 = _0x2959da ? `DTEND;TZID=${_0x836674}` : "DTEND";
    const _0x381e6d = `to ${ownerLabel(_0x54f57d.owner)}`;
    _0x12bed3({
      UID: icsEscape(`exch-${_0x115fe0}-${_0x54f57d.ds}@parenting-calendar`),
      DTSTAMP: _0x253e4c,
      [_0x1fb423]: icsDateTime(_0x54f57d.y, _0x54f57d.m0, _0x54f57d.d, _0x13ab19.h, _0x13ab19.m),
      [_0x387756]: icsDateTime(
        _0x54f57d.y,
        _0x54f57d.m0,
        _0x54f57d.d,
        _0x1d65e8 > 23 ? 23 : _0x1d65e8,
        _0x1d65e8 > 23 ? 59 : _0x20249c
      ),
      SUMMARY: icsEscape(`Exchange ${_0x381e6d}`),
      DESCRIPTION: icsEscape(
        `Handoff ${_0x381e6d}. Time: ${_0x13ab19.label}${_0x54f57d.reason ? `. ${_0x54f57d.reason}` : ""}`
      ),
      LOCATION: icsEscape(state.exchangeLocation || "")
    });
  });
  _0x42c758.push("END:VCALENDAR");
  return _0x42c758.map(icsFold).join("\r\n") + "\r\n";
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
  const _0x19fa7a = ["Date", "Weekday", "Parent", "Event", "Notes"];
  const _0x27116d = [_0x19fa7a.map(csvCell).join(",")];
  _0x3af2ea.forEach(_0x3fdb1c => {
    const _0x500999 = [];
    if (_0x3fdb1c.splitType) {
      _0x500999.push("Handoff " + _0x3fdb1c.reason);
    }
    if (_0x3fdb1c.customSchoolLabel) {
      _0x500999.push(_0x3fdb1c.customSchoolLabel);
    }
    if (_0x3fdb1c.isOverride) {
      _0x500999.push("Custom override");
    }
    if (_0x3fdb1c.isHoliday && _0x3fdb1c.reason) {
    }
    _0x27116d.push(
      [_0x3fdb1c.ds, DOW_3[_0x3fdb1c.dow], ownerLabel(_0x3fdb1c.owner), _0x3fdb1c.reason || "", _0x500999.join("; ")]
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
  "baseSplitBar"
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
