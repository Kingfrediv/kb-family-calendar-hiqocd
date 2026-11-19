// ---------------------------------------------------------------------------------------------
// Light, dark, or follow the device. A device choice, so it is kept in preferences (not in the calendar,
// not in share links): a person opening a link gets their own theme.
// ---------------------------------------------------------------------------------------------

function themePreference() {
  const pref = readPrefs().theme;
  return pref === "light" || pref === "dark" ? pref : "auto";
}

function effectiveTheme() {
  const pref = themePreference();
  if (pref !== "auto") {
    return pref;
  }
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme() {
  const theme = effectiveTheme();
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? "#0e0e10" : "#18181b");
  }
  document.querySelectorAll("[data-theme-choice]").forEach(button => {
    button.setAttribute("aria-checked", button.dataset.themeChoice === themePreference() ? "true" : "false");
  });
}

document.querySelectorAll("[data-theme-choice]").forEach(button => {
  button.onclick = () => {
    writePref("theme", button.dataset.themeChoice);
    applyTheme();
  };
});
if (window.matchMedia) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const follow = () => {
    if (themePreference() === "auto") {
      applyTheme();
    }
  };
  if (query.addEventListener) {
    query.addEventListener("change", follow);
  }
}
