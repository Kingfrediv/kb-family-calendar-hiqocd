// Runs every test suite (files named v*.js or t*.js) in parallel and reports one verdict.
// KB_INDEX=<file> tests a specific build; default is dist/index.html.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const only = process.argv.slice(2);
const suites = fs.readdirSync(__dirname).filter(f => /^[vt]\d.*\.js$/.test(f)).filter(f => !only.length || only.some(o => f.includes(o))).sort();
const out = path.join(__dirname, '..', 'test-output'); fs.mkdirSync(out, { recursive: true });
const jobs = suites.map(f => new Promise(res => {
  const log = fs.createWriteStream(path.join(out, f.replace('.js', '.txt')));
  const p = spawn(process.execPath, [path.join(__dirname, f)], { env: process.env });
  let text = ''; p.stdout.on('data', d => { text += d; log.write(d); }); p.stderr.on('data', d => { text += d; log.write(d); });
  p.on('close', code => { log.end(); const m = text.match(/(\d+)\/(\d+) passed/); res({ f, code, passed: m ? +m[1] : 0, total: m ? +m[2] : 0, text }); });
}));
Promise.all(jobs).then(rs => {
  let bad = 0;
  for (const r of rs) {
    console.log(`${r.code === 0 ? 'ok  ' : 'FAIL'} ${r.f.padEnd(24)} ${r.passed}/${r.total}`);
    if (r.code !== 0) { bad++; console.log(r.text.split('\n').filter(l => /^(FAIL|CRASH)|^  - /.test(l)).join('\n')); }
  }
  console.log(`\n${rs.reduce((a, r) => a + r.passed, 0)}/${rs.reduce((a, r) => a + r.total, 0)} checks passed in ${rs.length} suites`);
  process.exit(bad ? 1 : 0);
});
