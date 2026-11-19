if (pendingShareKind) {
  document.body.classList.add("share-pending");
  if (pendingShareKind === "c") {
    document.body.classList.add("share-loading-on");
  }
}

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

if (pendingShareKind === "c") {
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
  document.getElementById("setupChild").value = state.childName || "";
  document.getElementById("setupP1").value = state.p1Name && state.p1Name !== "Parent 1" ? state.p1Name : "";
  document.getElementById("setupP2").value = state.p2Name && state.p2Name !== "Parent 2" ? state.p2Name : "";
  document.getElementById("setupMothers").value = state.mothersDayOwner || "skip";
  document.getElementById("setupFathers").value = state.fathersDayOwner || "skip";
  document.getElementById("setupOverlay").classList.add("show");
  setTimeout(() => document.getElementById("setupChild").focus(), 50);
}

if (kbRecovered) {
  toast("Recovered your most recent changes.");
}

registerServiceWorker();

announceRestore();
