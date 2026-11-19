// Renders src/pwa/icon.svg to the PNG sizes the manifest and iOS need. Run: node tools/make-icons.js
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..', 'src', 'pwa');
const svg = fs.readFileSync(path.join(root, 'icon.svg'), 'utf8');
(async () => {
  const browser = await chromium.launch();
  const render = async (size, file, { maskable = false } = {}) => {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    // maskable icons need the artwork inside the central safe zone, on a full-bleed background
    const inner = maskable ? `<div style="position:absolute;inset:0;background:#18181b"></div><div style="position:absolute;inset:14%">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>` : svg.replace('<svg ', `<svg width="${size}" height="${size}" `);
    await page.setContent(`<body style="margin:0;background:transparent;overflow:hidden">${inner}</body>`);
    await page.screenshot({ path: path.join(root, 'icons', file), omitBackground: !maskable });
    await page.close();
  };
  await render(192, 'icon-192.png'); await render(512, 'icon-512.png'); await render(180, 'apple-touch-icon.png', { maskable: true });
  await render(512, 'icon-maskable-512.png', { maskable: true });
  await browser.close(); console.log('icons written');
})();
