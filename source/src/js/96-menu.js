// ---------------------------------------------------------------------------------------------
// The "Share & export" menu in the header.
// ---------------------------------------------------------------------------------------------

const menuButton = document.getElementById("btnMenuShare");
const menuPanel = document.getElementById("shareMenu");
const menuBackdrop = document.getElementById("menuBackdrop");

function menuIsOpen() {
  return !menuPanel.hidden;
}

function menuItems() {
  return [...menuPanel.querySelectorAll(".menu-item, .menu-display")].filter(el => !el.hidden && !el.disabled);
}

function timeAgo(ts) {
  if (!ts) {
    return "never";
  }
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) {
    return "today";
  }
  return days === 1 ? "yesterday" : days + " days ago";
}

// Things in the menu that depend on the device or on what has happened since it was last opened.
function refreshMenu() {
  let last = 0;
  try {
    last = Number(localStorage.getItem(LAST_BACKUP_KEY)) || 0;
  } catch {}
  document.getElementById("backupNote").textContent = "Last backup: " + timeAgo(last);
  const showInstall = installIsPossible();
  document.getElementById("btnInstall").hidden = !showInstall;
  document.getElementById("menuAppLabel").hidden = !showInstall;
}

function openMenu() {
  refreshMenu();
  menuPanel.hidden = false;
  menuBackdrop.hidden = false;
  menuButton.setAttribute("aria-expanded", "true");
  const first = menuItems()[0];
  if (first) {
    first.focus();
  }
}

function closeMenu(focusButton) {
  if (!menuIsOpen()) {
    return;
  }
  menuPanel.hidden = true;
  menuBackdrop.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
  if (focusButton) {
    menuButton.focus();
  }
}

menuButton.addEventListener("click", () => {
  if (menuIsOpen()) {
    closeMenu(true);
  } else {
    openMenu();
  }
});
menuBackdrop.addEventListener("click", () => closeMenu(false));
// choosing an item closes the menu first, so a dialog it opens returns focus to the menu button
menuPanel.addEventListener(
  "click",
  ev => {
    if (ev.target.closest && ev.target.closest(".menu-item")) {
      closeMenu(true);
    }
  },
  true
);
menuPanel.addEventListener("keydown", ev => {
  const items = menuItems();
  const at = items.indexOf(document.activeElement);
  if (ev.key === "Escape") {
    ev.preventDefault();
    ev.stopPropagation();
    closeMenu(true);
  } else if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
    ev.preventDefault();
    const next = ev.key === "ArrowDown" ? (at + 1) % items.length : (at - 1 + items.length) % items.length;
    items[next].focus();
  } else if (ev.key === "Home" || ev.key === "End") {
    ev.preventDefault();
    items[ev.key === "Home" ? 0 : items.length - 1].focus();
  } else if (ev.key === "Tab") {
    closeMenu(false);
  }
});
