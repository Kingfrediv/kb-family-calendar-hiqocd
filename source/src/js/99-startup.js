if (pendingShareKind) {
  document.body.classList.add("share-pending");
  if (pendingShareKind === "c") {
    document.body.classList.add("share-loading-on");
  }
}

startTranslator();

fillYearMonthSelects();

drawSummer();

drawCustomHolidayList();

drawSchoolEventList();

render();

updateUndoButton();

license = readStoredLicense();

setBuyLinks();

if ((viewingShared && !pendingShareKind) || (kbIsCopy() && !isLicensed())) {
  kbViewerDefaults();
  render();
}

if (isLicensed()) {
  kbKeepStorage();
}

applyLicenseState();

recheckLicense();

if (DEMO_QUERY && viewingShared && !pendingShareKind && !kbIsCopy()) {
  document.getElementById("tourBanner").classList.add("show");
  if (license && license.key) {
    // someone who already owns it: no sales pitch, just the way back
    document.getElementById("btnTourBuy").hidden = true;
    document.getElementById("btnTourKey").textContent = "Back to my calendar";
  }
} else if (pendingShareKind === "c") {
  openCompressedShare();
} else if (pendingShareKind === "p") {
  askSharePasscode();
} else if (viewingShared) {
  document.getElementById("sharedBanner").classList.add("show");
} else if (needsLicense()) {
} else if (isViewOnly()) {
  document.getElementById("sharedBanner").classList.add("show");
} else if (isDemoPage()) {
  document.getElementById("demoBanner").classList.add("show");
} else if (!state.savedAt && !state.setupComplete) {
  openSetupDialog();
}

if (kbRecovered) {
  toast("Recovered your most recent changes.");
}

applyTheme();

registerServiceWorker();

announceRestore();

announceApplied();
