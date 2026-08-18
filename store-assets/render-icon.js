// Render icon.html to icon-512.png (Play Store) and Android launcher mipmaps.
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// mipmap sizes: launcher (full art), round (same art, Android masks it)
const MIPMAPS = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
// foreground: art centered in the middle ~2/3 of the canvas (adaptive icon safe zone)
const FOREGROUNDS = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  const url = 'file:///' + path.join(__dirname, 'icon.html').replace(/\\/g, '/');

  async function render(size, file, pad) {
    // pad: render the 512 stage scaled into the middle, background fills the rest
    const scale = size / 512;
    await page.setViewport({ width: 512, height: 512, deviceScaleFactor: scale });
    await page.goto(url, { waitUntil: 'networkidle0' });
    if (pad) {
      await page.evaluate((p) => {
        const card = document.querySelector('.card');
        const moon = document.querySelector('.moon');
        card.style.transform = `translate(-50%, -50%) scale(${p})`;
        moon.style.display = 'none';
      }, pad);
    }
    await new Promise(r => setTimeout(r, 250));
    await page.screenshot({ path: file });
    console.log('saved', path.relative(path.join(__dirname, '..'), file), size + 'px');
  }

  // Play Store 512x512
  await render(512, path.join(__dirname, 'icon-512.png'));

  // Legacy launcher mipmaps
  for (const [dpi, size] of Object.entries(MIPMAPS)) {
    const dir = path.join(RES, 'mipmap-' + dpi);
    if (!fs.existsSync(dir)) continue;
    await render(size, path.join(dir, 'ic_launcher.png'));
    await render(size, path.join(dir, 'ic_launcher_round.png'));
  }

  // Adaptive icon foregrounds (card shrunk into the safe zone)
  for (const [dpi, size] of Object.entries(FOREGROUNDS)) {
    const dir = path.join(RES, 'mipmap-' + dpi);
    if (!fs.existsSync(dir)) continue;
    await render(size, path.join(dir, 'ic_launcher_foreground.png'), 0.62);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
