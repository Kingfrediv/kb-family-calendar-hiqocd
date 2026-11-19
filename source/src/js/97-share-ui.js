function renderEverything() {
  drawSummer();
  drawCustomHolidayList();
  drawSchoolEventList();
  render();
  updateUndoButton();
}

// what the sender wrote when they made the link, shown to whoever opens it
let incomingShareNote = "";

function openSharedState(_0x5dcd27) {
  viewingShared = true;
  pendingShareKind = null;
  incomingShareNote = kbStr(_0x5dcd27 && _0x5dcd27.shareNote, 200, "");
  state = normalizeState(Object.assign({}, sampleState(), _0x5dcd27 || {}));
  delete state.shareNote;
  kbViewerDefaults();
  undoStack = [];
  document.body.classList.remove("share-pending", "share-loading-on");
  document.getElementById("passcodeOverlay").classList.remove("show");
  document.getElementById("shareOverlay").classList.remove("show");
  document.getElementById("setupOverlay").classList.remove("show");
  document.getElementById("sharedBanner").classList.add("show");
  renderEverything();
  applyLicenseState();
}

function shareOpenFailed(_0x196562) {
  pendingShareKind = null;
  document.body.classList.remove("share-pending", "share-loading-on");
  document.getElementById("passcodeOverlay").classList.remove("show");
  toast(_0x196562 || "This share link could not be opened.");
  applyLicenseState();
}

async function openCompressedShare() {
  document.body.classList.add("share-pending", "share-loading-on");
  try {
    const _0x190d2c = await readCompressedHash(location.hash);
    openSharedState(_0x190d2c);
  } catch (_0x31ad59) {
    shareOpenFailed("This share link could not be opened.");
  }
}

function askSharePasscode() {
  document.body.classList.add("share-pending");
  document.body.classList.remove("share-loading-on");
  const _0xea11d2 = document.getElementById("passcodeError");
  _0xea11d2.classList.remove("show");
  document.getElementById("unlockPasscode").value = "";
  document.getElementById("passcodeOverlay").classList.add("show");
  kbFocusLater("passcodeOverlay", () => document.getElementById("unlockPasscode"), 50);
}

async function unlockSharedWithPasscode() {
  const _0x391d8e = document.getElementById("unlockPasscode").value;
  const _0x41fec8 = document.getElementById("passcodeError");
  if (!_0x391d8e) {
    _0x41fec8.textContent = "Enter the passcode to unlock this calendar.";
    _0x41fec8.classList.add("show");
    return;
  }
  _0x41fec8.classList.remove("show");
  try {
    const _0x233a27 = await readLockedHash(location.hash, _0x391d8e);
    openSharedState(_0x233a27);
  } catch (_0x86f20) {
    if (_0x86f20 && _0x86f20.code === "wrong-passcode") {
      _0x41fec8.textContent = "That passcode is incorrect. Try again.";
      _0x41fec8.classList.add("show");
      const _0x1226fc = document.getElementById("unlockPasscode");
      _0x1226fc.value = "";
      _0x1226fc.focus();
      return;
    }
    shareOpenFailed("This share link could not be opened.");
  }
}

async function copyText(_0x5e701c) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(_0x5e701c);
      return true;
    }
  } catch {}
  window.prompt(tr("Copy this share link:"), _0x5e701c);
  return false;
}

let lastShareLink = "";

let lastShareLocked = false;

function drawQr(_0xe42731) {
  const _0x3e9b69 = document.getElementById("shareQrCanvas");
  const _0x3c7a03 = qrcodegen.QrCode;
  let _0x57f929;
  try {
    _0x57f929 = _0x3c7a03.encodeText(_0xe42731, _0x3c7a03.Ecc.MEDIUM);
  } catch (_0x34b4b1) {
    _0x57f929 = _0x3c7a03.encodeText(_0xe42731, _0x3c7a03.Ecc.LOW);
  }
  const _0x5e5ec6 = 8;
  const _0x32eed1 = 4;
  const _0x58fb5c = (_0x57f929.size + _0x32eed1 * 2) * _0x5e5ec6;
  _0x3e9b69.width = _0x58fb5c;
  _0x3e9b69.height = _0x58fb5c;
  const _0x2890d0 = _0x3e9b69.getContext("2d");
  _0x2890d0.fillStyle = "#ffffff";
  _0x2890d0.fillRect(0, 0, _0x58fb5c, _0x58fb5c);
  _0x2890d0.fillStyle = "#000000";
  for (let _0x9dc4f8 = 0; _0x9dc4f8 < _0x57f929.size; _0x9dc4f8++) {
    for (let _0x3fc2cb = 0; _0x3fc2cb < _0x57f929.size; _0x3fc2cb++) {
      if (_0x57f929.getModule(_0x3fc2cb, _0x9dc4f8)) {
        _0x2890d0.fillRect(
          (_0x3fc2cb + _0x32eed1) * _0x5e5ec6,
          (_0x9dc4f8 + _0x32eed1) * _0x5e5ec6,
          _0x5e5ec6,
          _0x5e5ec6
        );
      }
    }
  }
}

function downloadQr() {
  if (!lastShareLink) {
    toast("Create a link first.");
    return;
  }
  const _0x1a73fa = document.getElementById("shareQrCanvas");
  _0x1a73fa.toBlob(_0x3cc295 => {
    if (!_0x3cc295) {
      toast("Could not build the QR image.");
      return;
    }
    const _0x58bab0 = childName();
    downloadBlob(_0x3cc295, safeFileName((_0x58bab0 ? _0x58bab0 + "-" : "") + "parenting-calendar-qr") + ".png");
    toast("QR code image downloaded");
  }, "image/png");
}

async function nativeShare() {
  if (!lastShareLink) {
    toast("Create a link first.");
    return;
  }
  const _0x25114c = (childName() ? childName() + " — " : "") + "Shared Parenting Calendar";
  const _0x3b4a1b = lastShareLocked
    ? "A locked parenting calendar. I'll share the passcode separately."
    : "Here's our shared parenting calendar.";
  if (typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: _0x25114c,
        text: _0x3b4a1b,
        url: lastShareLink
      });
      return;
    } catch (_0x34e5a2) {
      if (_0x34e5a2 && _0x34e5a2.name === "AbortError") {
        return;
      }
    }
  }
  await copyText(lastShareLink);
  toast(
    lastShareLocked
      ? "Link copied. Share the passcode separately — the QR and link alone will not unlock the schedule."
      : "Link copied to the clipboard."
  );
}

function openShareDialog(options) {
  document.getElementById("shareMessage").value = options && options.message ? String(options.message).slice(0, 200) : "";
  document.getElementById("sharePasscode").value = "";
  document.getElementById("sharePasscode2").value = "";
  const _0x225972 = document.getElementById("sharePassError");
  _0x225972.textContent = "";
  _0x225972.classList.remove("show");
  lastShareLink = "";
  lastShareLocked = false;
  kbRemember();
  const _0x212564 = document.getElementById("shareResult");
  if (_0x212564) {
    _0x212564.classList.remove("show");
  }
  const _0x2edb47 = document.getElementById("shareLockedQrNote");
  if (_0x2edb47) {
    _0x2edb47.classList.remove("show");
  }
  document.getElementById("shareOverlay").classList.add("show");
  kbFocusLater("shareOverlay", () => document.getElementById(options && options.message ? "shareMessage" : "sharePasscode"), 50);
}

async function createShareLink() {
  const shareMessage = document.getElementById("shareMessage").value.trim();
  const _0x26d460 = document.getElementById("sharePasscode").value;
  const _0x3ab911 = document.getElementById("sharePasscode2").value;
  const _0x4928da = document.getElementById("sharePassError");
  if (_0x26d460 || _0x3ab911) {
    if (_0x26d460 !== _0x3ab911) {
      _0x4928da.textContent = "Passcodes do not match.";
      _0x4928da.classList.add("show");
      return;
    }
  }
  if (_0x26d460 && _0x26d460.length < 6) {
    _0x4928da.textContent = "Use at least 6 characters for the passcode.";
    _0x4928da.classList.add("show");
    return;
  }
  _0x4928da.classList.remove("show");
  let _0x51c913;
  try {
    _0x51c913 =
      _0x26d460 && _0x26d460.length
        ? await makeLockedHash(state, _0x26d460, shareMessage)
        : await makeCompressedHash(state, shareMessage);
  } catch (_0x1a20ea) {
    _0x4928da.textContent = "Could not build the share link on this browser.";
    _0x4928da.classList.add("show");
    return;
  }
  const _0x16843a = location.origin + location.pathname + _0x51c913;
  lastShareLink = _0x16843a;
  lastShareLocked = !!_0x26d460 && !!_0x26d460.length;
  // a long schedule can exceed what a QR code holds; the link itself still works
  let kbQrOk = true;
  try {
    drawQr(_0x16843a);
  } catch (_0x2756ce) {
    kbQrOk = false;
  }
  document.getElementById("shareQrBlock").style.display = kbQrOk ? "" : "none";
  document.getElementById("shareQrTooLong").style.display = kbQrOk ? "none" : "block";
  document.getElementById("btnDownloadQr").style.display = kbQrOk ? "" : "none";
  document.getElementById("shareResult").classList.add("show");
  const _0x48c03c = document.getElementById("shareLockedQrNote");
  if (lastShareLocked) {
    _0x48c03c.classList.add("show");
  } else {
    _0x48c03c.classList.remove("show");
  }
  const kbCopied = await copyText(_0x16843a);
  toast(
    !kbCopied
      ? "Link created. If it was not copied, use the Share button below."
      : lastShareLocked
        ? "Locked link copied. Share the passcode separately — the QR and link alone will not unlock the schedule."
        : "Link copied. Add a passcode next time and share it separately if the schedule should stay private."
  );
}

function onCopyLinkClick() {
  if (!requireLicense()) {
    return;
  }
  openShareDialog();
}


function onExportCsv() {
  if (!requireLicense()) {
    return;
  }
  const _0x38934b = buildCsv(state.year);
  const _0x527dff =
    safeFileName("Kingdom-Building-" + (childName() ? childName() + "-" : "") + "parenting-calendar-" + state.year) +
    ".csv";
  downloadBlob(
    new Blob([_0x38934b], {
      type: "text/csv;charset=utf-8"
    }),
    _0x527dff
  );
  toast("Spreadsheet downloaded");
}

function saveSharedHere() {
  if (!requireLicense()) {
    return;
  }
  const kbHome = kbHomeFileId();
  const kbSlot = storageKeyFor({
    fileId: kbHome
  });
  let _0x128847 = null;
  try {
    _0x128847 = localStorage.getItem(kbSlot);
  } catch {}
  if (
    (_0x128847 || kbIsCopy()) &&
    !confirm(tr("Replace the calendar currently saved in this browser with this shared schedule?"))
  ) {
    return;
  }
  viewingShared = false;
  state.fileId = kbHome;
  try {
    localStorage.setItem(kbSlot, JSON.stringify(state));
  } catch {}
  history.replaceState(null, "", location.pathname + location.search);
  document.getElementById("sharedBanner").classList.remove("show");
  save({
    fromUndo: true
  });
  render();
  toast("Saved to this browser");
}

