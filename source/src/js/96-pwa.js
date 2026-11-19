// ---------------------------------------------------------------------------------------------
// Install as an app and work offline. The service worker (sw.js) keeps a copy of this page.
// It is only registered on https (or localhost), never for a downloaded copy opened from a file.
// ---------------------------------------------------------------------------------------------

let installPrompt = null;

function isStandalone() {
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
}

function isIosSafari() {
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

function installIsPossible() {
  return !isStandalone() && !isViewOnly() && (!!installPrompt || isIosSafari());
}

function canRegisterServiceWorker() {
  return (
    "serviceWorker" in navigator &&
    (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")
  );
}

function registerServiceWorker() {
  if (!canRegisterServiceWorker()) {
    return;
  }
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) {
      toast("The calendar was updated. Reload to use the newest version.", { label: "Reload", run: () => location.reload() });
    }
  });
}

async function onInstallClick() {
  if (installPrompt) {
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } catch {}
    installPrompt = null;
  } else if (isIosSafari()) {
    toast("To install: tap the Share button in Safari, then “Add to Home Screen”.");
  }
}

window.addEventListener("beforeinstallprompt", ev => {
  ev.preventDefault();
  installPrompt = ev;
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  toast("Installed. You can open the calendar from your home screen.");
});
window.addEventListener("offline", () => toast("You are offline. Your calendar still works."));
document.getElementById("btnInstall").onclick = onInstallClick;
