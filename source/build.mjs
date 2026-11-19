// Builds the site from src/.
//
//   node build.mjs                    obfuscated build into dist/            (what the tests run against)
//   node build.mjs --plain            same, with readable script             (for debugging)
//   node build.mjs --release          obfuscated build into the repository root, ready to commit and publish
//   node build.mjs --out <file>       write only the page, to <file>
//   node build.mjs --check <file>     exit 1 if <file> was not built from the current src/ (CI uses this)
//
// Needs javascript-obfuscator 5.x (4.x generates a slower string lookup).
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const flag = n => process.argv.includes(n);
const srcDir = path.join(here, 'src');
const read = f => fs.readFileSync(path.join(srcDir, f), 'utf8');

// the build id is a hash of everything in src/, so it does not change with the obfuscator's random choices
function walk(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]); }
const buildId = (() => {
  const h = crypto.createHash('sha1');
  for (const f of walk(srcDir).sort()) { h.update(path.relative(srcDir, f)); h.update(fs.readFileSync(f)); }
  return h.digest('hex').slice(0, 10);
})();

if (flag('--check')) {
  const target = arg('--check');
  const html = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
  const m = html.match(/<meta name="kb-build" content="([0-9a-f]+)"/);
  if (!m || m[1] !== buildId) { console.error(`STALE: ${target} was built from ${m ? m[1] : 'unknown source'}, src/ is ${buildId}. Run: npm run release`); process.exit(1); }
  console.log(`ok: ${target} matches src/ (${buildId})`); process.exit(0);
}

// every js/*.js module, in file-name order, inside one function scope
const modules = fs.readdirSync(path.join(srcDir, 'js')).filter(f => f.endsWith('.js')).sort();
let app = '(function () {\n' + modules.map(f => read('js/' + f)).join('\n') + '\n})();\n';

if (!flag('--plain')) {
  const JsObf = require('javascript-obfuscator');
  app = JsObf.obfuscate(app, {
    compact: true, target: 'browser', seed: 0,
    identifierNamesGenerator: 'hexadecimal', renameGlobals: false,
    controlFlowFlattening: true, controlFlowFlatteningThreshold: 0.5,
    stringArray: true, stringArrayEncoding: ['base64'], stringArrayThreshold: 0.75,
    stringArrayRotate: true, stringArrayShuffle: true, stringArrayIndexShift: true,
    numbersToExpressions: false, simplify: true, splitStrings: false,
    deadCodeInjection: false, selfDefending: false, debugProtection: false, disableConsoleOutput: false,
    unicodeEscapeSequence: false, transformObjectKeys: false,
  }).getObfuscatedCode();
}
if (/<\/script/i.test(app)) throw new Error('app code contains a closing script tag');

const html = read('index.template.html')
  .replace('{{BUILD}}', buildId)
  .replace('{{STYLE}}', () => read('style.css'))
  .replace('{{QR}}', () => read('qr.js'))
  .replace('{{APP}}', () => app);

const single = arg('--out');
const outDir = flag('--release') ? path.join(here, '..') : path.join(here, 'dist');
if (single) {
  fs.mkdirSync(path.dirname(single), { recursive: true });
  fs.writeFileSync(single, html);
} else {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  fs.writeFileSync(path.join(outDir, 'sw.js'), read('pwa/sw.js').replace('{{BUILD}}', buildId));
  fs.copyFileSync(path.join(srcDir, 'pwa', 'manifest.webmanifest'), path.join(outDir, 'manifest.webmanifest'));
  fs.mkdirSync(path.join(outDir, 'icons'), { recursive: true });
  for (const f of fs.readdirSync(path.join(srcDir, 'pwa', 'icons'))) fs.copyFileSync(path.join(srcDir, 'pwa', 'icons', f), path.join(outDir, 'icons', f));
}
console.log('built', path.relative(process.cwd(), single || path.join(outDir, 'index.html')) || 'index.html', html.length, 'bytes', flag('--plain') ? '(plain)' : '(obfuscated)', `${modules.length} modules, build ${buildId}`);
