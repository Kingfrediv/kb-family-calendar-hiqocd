// Parses the program part of a built page and reports syntax errors with the module they came from.  node tools/check-syntax.js [page]
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const page = fs.readFileSync(process.argv[2] || path.join(__dirname, '..', 'dist', 'index.html'), 'utf8');
const start = page.lastIndexOf('<script>') + 8, end = page.lastIndexOf('</script>');
try { new vm.Script(page.slice(start, end), { filename: 'app' }); console.log('syntax ok'); }
catch (e) { console.log('SYNTAX ERROR:', e.message); const m = (e.stack || '').match(/app:(\d+)/); if (m) { const lines = page.slice(start, end).split('\n'); const n = +m[1]; console.log(lines.slice(Math.max(0, n - 3), n + 2).map((l, i) => (n - 2 + i) + ': ' + l).join('\n')); } process.exit(1); }
