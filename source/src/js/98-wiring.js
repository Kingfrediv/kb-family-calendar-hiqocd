document.getElementById("btnSaveBakedHtml").onclick = downloadCopy;

document.getElementById("btnCopyLink").onclick = onCopyLinkClick;

document.getElementById("btnShareCancel").onclick = () => kbCloseDialog(document.getElementById("shareOverlay"));

document.getElementById("btnLicenseClose").onclick = () => kbCloseDialog(document.getElementById("licenseOverlay"));

["shareOverlay", "licenseOverlay"].forEach(id => {
  const ov = document.getElementById(id);
  ov.addEventListener("mousedown", ev => {
    if (ev.target === ov) {
      kbCloseDialog(ov);
    }
  });
});

// Escape closes a dialog that can be closed; Tab stays inside the open dialog
document.addEventListener("keydown", ev => {
  const open = [...document.querySelectorAll(".setup-overlay.show")];
  const dlg = open.length ? open[open.length - 1] : null;
  if (!dlg) {
    return;
  }
  if (ev.key === "Escape") {
    if (kbCloseDialog(dlg)) {
      ev.preventDefault();
    }
    return;
  }
  if (ev.key !== "Tab") {
    return;
  }
  const items = [
    ...dlg.querySelectorAll(
      "a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])"
    )
  ].filter(x => x.offsetParent !== null);
  if (!items.length) {
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  if (!dlg.contains(document.activeElement)) {
    ev.preventDefault();
    first.focus();
  } else if (ev.shiftKey && document.activeElement === first) {
    ev.preventDefault();
    last.focus();
  } else if (!ev.shiftKey && document.activeElement === last) {
    ev.preventDefault();
    first.focus();
  }
});

// a share link opened in a tab that already shows the calendar
window.addEventListener("hashchange", () => {
  if (shareKind(location.hash)) {
    location.reload();
  }
});

document.getElementById("btnShareCopy").onclick = createShareLink;

document.querySelectorAll(".preset-btn[data-preset]").forEach(_0x3c3505 => {
  _0x3c3505.onclick = () => applyPreset(_0x3c3505.getAttribute("data-preset"));
});

document.getElementById("btnStartOwnCalendar").onclick = startOwnCalendarFromDemo;

document.getElementById("btnUnlockLicense").onclick = onUnlockClick;

document.getElementById("btnEnterLicense").onclick = () => {
  kbRemember();
  openLicenseDialog();
};

document.getElementById("licenseKeyInput").addEventListener("keydown", _0x1fc2cf => {
  if (_0x1fc2cf.key === "Enter") {
    _0x1fc2cf.preventDefault();
    onUnlockClick();
  }
});

document.addEventListener("click", blockEditsWhenUnlicensed, true);

document.addEventListener(
  "keydown",
  _0x268f51 => {
    if (_0x268f51.key === "Enter" || _0x268f51.key === " ") {
      const _0x5dd056 = _0x268f51.target;
      if (_0x5dd056 && _0x5dd056.classList && _0x5dd056.classList.contains("day-cell") && !isLicensed()) {
        _0x268f51.preventDefault();
        requireLicense();
      }
    }
  },
  true
);

window.addEventListener("beforeprint", _0x4e94c6 => {
  if (!isLicensed()) {
    _0x4e94c6.preventDefault();
    requireLicense();
  }
});

document.getElementById("btnDownloadQr").onclick = downloadQr;

document.getElementById("btnNativeShare").onclick = nativeShare;

document.getElementById("btnUnlockShare").onclick = unlockSharedWithPasscode;

document.getElementById("unlockPasscode").addEventListener("keydown", _0x1bcecf => {
  if (_0x1bcecf.key === "Enter") {
    _0x1bcecf.preventDefault();
    unlockSharedWithPasscode();
  }
});

document.getElementById("sharePasscode2").addEventListener("keydown", _0x342942 => {
  if (_0x342942.key === "Enter") {
    _0x342942.preventDefault();
    createShareLink();
  }
});

document.getElementById("btnExportIcs").onclick = onExportIcs;

document.getElementById("btnExportCsv").onclick = onExportCsv;

document.getElementById("btnPrint").onclick = () => {
  if (!requireLicense()) {
    return;
  }
  window.print();
};

document.getElementById("btnUndo").onclick = undo;

document.addEventListener("keydown", _0x111fb0 => {
  const _0x4fbc92 = _0x111fb0.key === "z" || _0x111fb0.key === "Z";
  if (_0x4fbc92 && (_0x111fb0.ctrlKey || _0x111fb0.metaKey) && !_0x111fb0.shiftKey) {
    const _0x1cc66c = (document.activeElement && document.activeElement.tagName) || "";
    if (_0x1cc66c === "INPUT" || _0x1cc66c === "TEXTAREA" || _0x1cc66c === "SELECT") {
      return;
    }
    _0x111fb0.preventDefault();
    undo();
  }
});

document.getElementById("btnSaveShared").onclick = saveSharedHere;

document.getElementById("btnDownloadShared").onclick = downloadCopy;

document.getElementById("btnDismissShared").onclick = () =>
  document.getElementById("sharedBanner").classList.remove("show");

document.getElementById("btnSetupSkip").onclick = () => finishSetup(false);

document.getElementById("btnSetupStart").onclick = () => finishSetup(true);

document.getElementById("mothersDayOwnerSelect").onchange = _0x170590 => {
  state.mothersDayOwner = _0x170590.target.value;
  save();
  render();
};

document.getElementById("fathersDayOwnerSelect").onchange = _0x557f90 => {
  state.fathersDayOwner = _0x557f90.target.value;
  save();
  render();
};
