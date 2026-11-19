// Runs every test suite (files named v*.js or t*.js) in parallel and reports one verdict.
// KB_INDEX=<file> tests a specific build; default is dist/index.html.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const only = process.argv.slice(2);
const suites = fs.readdirSync(__dirname).filter(f => /^[vt]\d.*\.js$/.test(f)).filter(f => !only.length || only.some(o => f.includes(o))).sort();
const out = path.join(__dirname, '..', 'test-output'); fs.mkdirSync(out, { recursive: true });
// the compatibility suite runs once for every earlier release kept in compat/
const compat = fs.readdirSync(path.join(__dirname, '..', 'compat')).filter(f => f.endsWith('.html')).sort();
const plan = suites.flatMap(f => f === 'v3_compat.js' ? compat.map(c => ({ f, label: `${f} (${c.replace('.html', '')})`, env: { KB_OLD: path.join(__dirname, '..', 'compat', c) }, log: f.replace('.js', '-' + c.replace('.html', '') + '.txt') })) : [{ f, label: f, env: {}, log: f.replace('.js', '.txt') }]);
// a few at a time: ten browsers at once starve each other on a small machine and cause timeouts
const LIMIT = Number(process.env.KB_JOBS) || 4;
const runJob = job => new Promise(res => {
  const log = fs.createWriteStream(path.join(out, job.log));
  const p = spawn(process.execPath, [path.join(__dirname, job.f)], { env: Object.assign({}, process.env, job.env) });
  let text = ''; p.stdout.on('data', d => { text += d; log.write(d); }); p.stderr.on('data', d => { text += d; log.write(d); });
  p.on('close', code => { log.end(); const m = text.match(/(\d+)\/(\d+) passed/); res({ f: job.label, code, passed: m ? +m[1] : 0, total: m ? +m[2] : 0, text }); });
});
const pool = async () => { const results = new Array(plan.length); let next = 0; const worker = async () => { while (next < plan.length) { const i = next++; results[i] = await runJob(plan[i]); } }; await Promise.all(Array.from({ length: Math.min(LIMIT, plan.length) }, worker)); return results; };
pool().then(rs => {
  let bad = 0;
  for (const r of rs) {
    console.log(`${r.code === 0 ? 'ok  ' : 'FAIL'} ${r.f.padEnd(34)} ${r.passed}/${r.total}`);
    if (r.code !== 0) { bad++; console.log(r.text.split('\n').filter(l => /^(FAIL|CRASH)|^  - /.test(l)).join('\n')); }
  }
  console.log(`\n${rs.reduce((a, r) => a + r.passed, 0)}/${rs.reduce((a, r) => a + r.total, 0)} checks passed in ${rs.length} runs`);
  process.exit(bad ? 1 : 0);
});
