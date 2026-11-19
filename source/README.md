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

## Tests

| Suite | Covers |
| --- | --- |
| `v1_fixes.js` | One or more checks for each bug fixed in the first round. |
| `v2_regress.js` | Holiday dates for 2020 to 2045, 12 time zones, license handling, first run on desktop and phone. |
| `v3_compat.js` | Links and saved calendars from earlier releases open unchanged. |
| `v4_foundation.js` | Share & export menu, Today, backup and restore, offline and installable app. |

`npm test` runs them in parallel; `node tests/run-all.js v4` runs one.
