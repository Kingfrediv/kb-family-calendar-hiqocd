function isLicensed() {
  return !!license && !!license.key;
}

function isViewOnly() {
  return !isLicensed() && (!!viewingShared || !!pendingShareKind || kbIsCopy());
}

function needsLicense() {
  return !isLicensed() && !isViewOnly();
}

function readStoredLicense() {
  try {
    const _0x265647 = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!_0x265647) {
      return null;
    }
    const _0x108680 = JSON.parse(_0x265647);
    if (!_0x108680 || !_0x108680.key) {
      return null;
    }
    return _0x108680;
  } catch {
    return null;
  }
}

function writeStoredLicense(_0x15abf6) {
  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(_0x15abf6));
  } catch {}
}

function clearLicense() {
  license = null;
  try {
    localStorage.removeItem(LICENSE_STORAGE_KEY);
  } catch {}
}

function setBuyLinks() {
  document.querySelectorAll("[data-license-buy]").forEach(_0x1898eb => {
    _0x1898eb.href = BUY_URL;
  });
}

function setLicenseError(_0xf46735) {
  const _0x5f25f0 = document.getElementById("licenseError");
  if (!_0x5f25f0) {
    return;
  }
  _0x5f25f0.textContent = _0xf46735 || "";
  _0x5f25f0.classList.toggle("show", !!_0xf46735);
}

function openLicenseDialog(_0x3248e5) {
  licenseDialogOpen = true;
  setBuyLinks();
  setLicenseError("");
  const _0x4305ad = document.getElementById("licenseOverlay");
  _0x4305ad.classList.add("show");
  const _0x37345b = document.getElementById("licenseKeyInput");
  if (_0x3248e5 && _0x3248e5.prefill != null) {
    _0x37345b.value = _0x3248e5.prefill;
  } else if (license && license.key) {
    _0x37345b.value = license.key;
  }
  setTimeout(() => _0x37345b.focus(), 50);
}

let kbOpener = null;

function closeLicenseDialog() {
  licenseDialogOpen = false;
  document.getElementById("licenseOverlay").classList.remove("show");
  setLicenseError("");
}

function applyLicenseState() {
  setBuyLinks();
  const _0x5c95e5 = needsLicense();
  const _0x23d9a0 = isViewOnly();
  document.body.classList.toggle("license-locked", _0x5c95e5);
  document.body.classList.toggle("view-only", _0x23d9a0);
  if (_0x5c95e5) {
    openLicenseDialog({
      prefill: document.getElementById("licenseKeyInput").value || ""
    });
    const _0x548f48 = document.getElementById("setupOverlay");
    if (_0x548f48) {
      _0x548f48.classList.remove("show");
    }
  } else if (!licenseDialogOpen) {
    closeLicenseDialog();
  }
  const _0x1ecbf0 = [
    "btnSaveBakedHtml",
    "btnCopyLink",
    "btnExportIcs",
    "btnPrint",
    "btnExportCsv",
    "btnSaveShared",
    "btnDownloadShared",
    "btnBackup",
    "btnRestore",
    "btnAddCalendar"
  ];
  _0x1ecbf0.forEach(_0x4562ab => {
    const _0x58d094 = document.getElementById(_0x4562ab);
    if (_0x58d094) {
      _0x58d094.disabled = !isLicensed();
    }
  });
  // the license is read after the first drawing, so these depend on it being known
  updateUndoButton();
  renderCalendarList();
}

function requireLicense() {
  if (isLicensed()) {
    return true;
  }
  toast("Enter your license key to edit, save, or export your own calendar.");
  if (isViewOnly()) {
    if (!document.getElementById("licenseOverlay").classList.contains("show")) {
      kbRemember();
    }
    openLicenseDialog();
  }
  return false;
}

function licenseProblem(_0x2a9727) {
  if (!_0x2a9727 || _0x2a9727.success !== true) {
    if (_0x2a9727 && _0x2a9727.message) {
      return String(_0x2a9727.message);
    } else {
      return "That license key could not be verified.";
    }
  }
  const _0x42c896 = _0x2a9727.purchase || {};
  if (_0x42c896.refunded) {
    return "This license was refunded and is no longer valid.";
  }
  if (_0x42c896.chargebacked || _0x42c896.chargedback) {
    return "This license was charged back and is no longer valid.";
  }
  if (_0x42c896.disputed && !_0x42c896.dispute_won) {
    return "This license is under dispute and cannot be used right now.";
  }
  if (_0x42c896.subscription_ended_at) {
    return "This subscription has ended, so the license is no longer valid.";
  }
  if (_0x42c896.subscription_failed_at) {
    return "This subscription payment failed, so the license is no longer valid.";
  }
  return null;
}

function deviceLimitMessage() {
  return (
    "This license has already been used on the maximum of " +
    MAX_DEVICES +
    " devices. Please contact the seller if you need to free up a device."
  );
}

async function verifyLicenseKey(_0x93feff, _0x534c0a) {
  const _0x50ff3c = new URLSearchParams({
    product_id: GUMROAD_PRODUCT_ID,
    license_key: String(_0x93feff || "").trim(),
    increment_uses_count: _0x534c0a ? "true" : "false"
  });
  const _0x104291 = await fetch(GUMROAD_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: _0x50ff3c.toString()
  });
  let _0x42ba6d = null;
  try {
    _0x42ba6d = await _0x104291.json();
  } catch {}
  if (!_0x42ba6d || typeof _0x42ba6d !== "object") {
    throw new Error("network");
  }
  return _0x42ba6d;
}

async function activateLicense(_0xcaecbc) {
  const _0x428385 = String(_0xcaecbc || "").trim();
  if (!_0x428385) {
    throw Object.assign(new Error("Enter the license key from your Gumroad receipt."), {
      code: "empty"
    });
  }
  const _0x498f20 = license && license.key === _0x428385;
  try {
    if (!_0x498f20) {
      const _0x5c988c = await verifyLicenseKey(_0x428385, false);
      const _0x514974 = licenseProblem(_0x5c988c);
      if (_0x514974) {
        throw Object.assign(new Error(_0x514974), {
          code: "invalid"
        });
      }
      if (Number(_0x5c988c.uses || 0) >= MAX_DEVICES) {
        throw Object.assign(new Error(deviceLimitMessage()), {
          code: "device_limit"
        });
      }
      const _0x91e6be = await verifyLicenseKey(_0x428385, true);
      const _0x363d4c = licenseProblem(_0x91e6be);
      if (_0x363d4c) {
        throw Object.assign(new Error(_0x363d4c), {
          code: "invalid"
        });
      }
      if (Number(_0x91e6be.uses || 0) > MAX_DEVICES) {
        throw Object.assign(new Error(deviceLimitMessage()), {
          code: "device_limit"
        });
      }
    } else {
      const _0x2793f9 = await verifyLicenseKey(_0x428385, false);
      const _0x3e4a9c = licenseProblem(_0x2793f9);
      if (_0x3e4a9c) {
        throw Object.assign(new Error(_0x3e4a9c), {
          code: "invalid"
        });
      }
    }
  } catch (_0x5cda3a) {
    if (
      _0x5cda3a &&
      (_0x5cda3a.code === "invalid" || _0x5cda3a.code === "device_limit" || _0x5cda3a.code === "empty")
    ) {
      throw _0x5cda3a;
    }
    throw Object.assign(new Error("Could not reach Gumroad. Check your connection and try again."), {
      code: "network"
    });
  }
  const _0x2e44fe = Date.now();
  license = {
    key: _0x428385,
    verifiedAt: (license && license.key === _0x428385 && license.verifiedAt) || _0x2e44fe,
    lastCheckAt: _0x2e44fe
  };
  writeStoredLicense(license);
}

async function onUnlockClick() {
  const _0x549eb3 = document.getElementById("licenseKeyInput");
  const _0x1538ae = document.getElementById("btnUnlockLicense");
  setLicenseError("");
  if (_0x1538ae) {
    _0x1538ae.disabled = true;
  }
  try {
    await activateLicense(_0x549eb3.value);
    licenseDialogOpen = false;
    applyLicenseState();
    toast("License unlocked on this device.");
    kbKeepStorage();
    if (kbIsCopy() && !viewingShared && !pendingShareKind) {
      document.getElementById("sharedBanner").classList.remove("show");
    }
    if (!viewingShared && !pendingShareKind && !state.savedAt && !state.setupComplete) {
      openSetupDialog();
    }
  } catch (_0x35260e) {
    if (_0x35260e && _0x35260e.code === "invalid") {
      clearLicense();
      applyLicenseState();
    }
    setLicenseError(_0x35260e && _0x35260e.message ? _0x35260e.message : "That license key could not be verified.");
  } finally {
    if (_0x1538ae) {
      _0x1538ae.disabled = false;
    }
  }
}

async function recheckLicense() {
  if (!license || !license.key) {
    return;
  }
  const _0x1ec79d = Number(license.lastCheckAt || 0);
  if (_0x1ec79d && Date.now() - _0x1ec79d < LICENSE_RECHECK_MS) {
    return;
  }
  try {
    const _0x44f8a4 = await verifyLicenseKey(license.key, false);
    const _0x1c94b8 = licenseProblem(_0x44f8a4);
    if (_0x1c94b8) {
      clearLicense();
      applyLicenseState();
      toast(_0x1c94b8);
      return;
    }
    license.lastCheckAt = Date.now();
    writeStoredLicense(license);
  } catch (_0x430bcd) {}
}

function blockEditsWhenUnlicensed(_0x4c4f63) {
  if (isLicensed()) {
    return;
  }
  const _0x3b65ce = _0x4c4f63.target;
  if (!_0x3b65ce || !_0x3b65ce.closest) {
    return;
  }
  if (
    _0x3b65ce.closest(
      "#licenseOverlay,#passcodeOverlay,#shareOverlay,#setupOverlay,#viewOnlyActions,#btnEnterLicense,#btnGetOwnCalendar,#btnBuyLicense,#btnUnlockLicense"
    )
  ) {
    return;
  }
  if (
    _0x3b65ce.closest(
      "#btnPrevYear,#btnNextYear,#headerYearBadge,#btnToday,#btnMenuShare,#menuBackdrop,#yearSelect,#monthSelect,#viewYearBtn,#viewMonthBtn,#btnToggleSidebar,#btnDismissShared,.menu-display,.month-nav,.plan-link,.menu-radio,#shareMenu .menu-label,#shareMenu .menu-note"
    )
  ) {
    return;
  }
  const _0x49d09f =
    _0x3b65ce.closest(
      ".preset-btn,.dp-tile,.week-chip,.hol-tile,.swap-years,#btnSaveBakedHtml,#btnCopyLink,#btnExportIcs,#btnPrint,#btnExportCsv,#btnBackup,#btnRestore,#btnUndo,#btnSaveShared,#btnDownloadShared,#btnBaseFlip,#btnBaseClear,#btnAddCustomHol,#btnAddSchoolEvent,#btnToggleNotesEdit,#btnResetOverrides,#notesTextarea"
    ) ||
    (_0x3b65ce.closest(".sidebar") && _0x3b65ce.closest("button,input,select,textarea,label"));
  if (!_0x49d09f) {
    return;
  }
  if (_0x3b65ce.closest("#yearSelect,#monthSelect,#viewYearBtn,#viewMonthBtn")) {
    return;
  }
  _0x4c4f63.preventDefault();
  _0x4c4f63.stopPropagation();
  requireLicense();
}

function startOwnCalendarFromDemo() {
  try {
    localStorage.setItem(DEMO_STARTED_KEY, "1");
  } catch {}
  try {
    localStorage.removeItem(storageKeyFor(state));
  } catch {}
  viewingShared = false;
  undoStack = [];
  lastUndoPushAt = 0;
  state = normalizeState(defaultState());
  state.fileId = DEMO_FILE_ID;
  state.setupComplete = false;
  state.savedAt = 0;
  lastSavedJson = JSON.stringify(state);
  const _0x4f8ff8 = document.getElementById("demoBanner");
  if (_0x4f8ff8) {
    _0x4f8ff8.classList.remove("show");
  }
  document.getElementById("setupChild").value = "";
  document.getElementById("setupP1").value = "";
  document.getElementById("setupP2").value = "";
  document.getElementById("setupMothers").value = "skip";
  document.getElementById("setupFathers").value = "skip";
  renderEverything();
  updateUndoButton();
  document.getElementById("setupOverlay").classList.add("show");
  setTimeout(() => document.getElementById("setupChild").focus(), 50);
  toast("Sample data cleared. Start your own calendar.");
}
