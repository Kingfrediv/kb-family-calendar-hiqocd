# Kingdom Building parenting calendar: source, build and tests

The live site is `index.html` in the repository root (plus `sw.js`, `manifest.webmanifest` and `icons/` for the installable, offline app). Those files are **generated** from this folder. Edit the source here, never `index.html`.

## Layout

| Path | What it is |
| --- | --- |
| `src/index.template.html` | The page. `{{STYLE}}`, `{{QR}}`, `{{APP}}` and `{{BUILD}}` are filled in by the build. |
| `src/style.css` | All styles. |
| `src/js/NN-name.js` | The program, in modules. They are joined in file-name order inside one function, so they share one scope. Functions are hoisted and can be used from any module; `const`/`let` and statements that run at load time run in file order. Constants and storage keys live in `00-constants.js` so they exist before anything runs. |
| `src/qr.js` | Third-party QR code library (MIT, Project Nayuki). |
| `src/pwa/` | Service worker, manifest and icons. `node tools/make-icons.js` redraws the PNGs from `icon.svg`. |
| `tests/` | Browser tests (Playwright + Chromium). |
| `compat/` | Earlier releases. The compatibility tests make share links and saved calendars with them and open those in the current build. |

## Everyday commands

```
npm install
npm run build          # obfuscated build into dist/ (what the tests run)
npm run build:plain    # readable script, for debugging in the browser
npm test               # build, then every suite
npm run release        # build straight into the repository root, ready to commit
npm run check:release  # fail if the root index.html is not from the current src/
```

Playwright with Chromium must be available (`npx playwright install chromium`). The tests never contact Gumroad; the license endpoint is replaced by a stand-in. The real key check has to be tried by hand with a real key.

## Releasing

1. `npm test`
2. `npm run release`
3. commit `src/` together with the regenerated root files. CI re-checks that they belong together.

## Things that must not change casually

- **Share links** store only the settings that differ from `sampleState()` in `src/js/10-defaults.js`, under the short names in `SHARE_KEYS`. Changing a value in `sampleState()` or renaming a key changes how every existing link decodes. New settings need a new short name and a default that is identical in `defaultState()` and `sampleState()`.
- **Storage keys** (`custody_cal_v9`, `kb_license_v1`, `kb_*_v1`) are what saved calendars live under. Keep them, or migrate.
- **Everything that arrives from storage, a file, a backup or a link** goes through `normalizeState()`/`kbSanitize()`; everything written into the page goes through `esc()`. Add new fields to both.
- **Obfuscation** needs javascript-obfuscator 5.x. Version 4 generates a slower string lookup that made every tap about 40% slower.
- The service worker's cache name is the build id, so every release replaces the previous cache. Pages are fetched network-first, so a release reaches people the next time they open the calendar online.

## Spanish

English is the source text everywhere in the code. When the language is Spanish (the browser says so, or the choice in the Share & export menu), `src/js/47-i18n.js` translates what is on the screen as it is drawn:

- `src/js/48-i18n-es.js` is the dictionary. Keys are the English text exactly as it appears (white space collapsed); a `#` stands for a number, so `"# (#% of nights)"` covers every count. Names of months and days come from the Spanish lists in `00-constants.js`.
- `src/js/49-i18n-es-rules.js` has patterns for sentences with names and dates in them ("Fri, 6 mar: Avery overnight — Base (Avery)").
- Text a person typed (names, notes, plans) is never looked up, except where it happens to equal a phrase in the dictionary. Anything without a translation stays in English, so a gap is never a blank.
- Text that leaves the page (phone-calendar file, spreadsheet, share message, confirm boxes) is translated where it is made, with `tr()`.
- `node tests/i18n-tour.js` walks through every screen, dialog and message in Spanish and lists what has no translation yet. `v9_spanish.js` requires that list to be empty. When you add English text, run it and add the Spanish.
- The Spanish was written without a native reviewer. Have one read it before it is sold.

## Free demo

`index.html?demo` opens a made-up family (`demoFamilyState()` in `10-defaults.js`) that cannot be edited, saved or exported, whoever opens it, and never touches stored data. The licence screen links to it.

## Tests

| Suite | Covers |
| --- | --- |
| `v1_fixes.js` | One or more checks for each bug fixed in the first round. |
| `v2_regress.js` | Holiday dates for 2020 to 2045, 12 time zones, license handling, first run on desktop and phone. |
| `v3_compat.js` | Links and saved calendars from earlier releases open unchanged. |
| `v4_foundation.js` | Share & export menu, Today, backup and restore, offline and installable app. |
| `v5_schedule.js` | Custom cycles, presets, break dates, regions, moving-date holidays, holiday rules. |
| `v6_data.js` | Day sheet, notes and plans, selecting several days, several calendars, change history, compare-and-apply. |
| `v7_output.js` | Phone-calendar file (years, reminders, time zones), printed report, themes, initials and patterns. |
| `v8_usability.js` | Phone drawer and layout, Tonight, swipe, "Saved" cue, Undo on resets, year rollover, dates in words, free demo. |
| `v9_spanish.js` | Language choice, Spanish files and links, phone layout and accessibility in Spanish, and the tour that finds untranslated text. |

`npm test` runs them four at a time (`KB_JOBS=n` changes that); `node tests/run-all.js v4` runs one.
