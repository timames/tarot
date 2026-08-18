// Render icon.html at 1024x1024 with the alpha channel stripped (Apple
// rejects App Store icons containing an alpha channel) and install it
// into the iOS asset catalog.
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = path.join(__dirname, 'icon-1024-ios.png');
const CATALOG = path.join(__dirname, '..', 'ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset', 'AppIcon-512@2x.png');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 2 });
  await page.goto('file:///' + path.join(__dirname, 'icon.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 300));
  const raw = await page.screenshot();
  await browser.close();

  await sharp(raw).flatten({ background: '#110620' }).removeAlpha().png().toFile(OUT);
  await sharp(OUT).toFile(CATALOG);
  const meta = await sharp(OUT).metadata();
  console.log('icon-1024-ios.png', meta.width + 'x' + meta.height, 'channels:', meta.channels, 'alpha:', meta.hasAlpha);
})().catch(e => { console.error(e); process.exit(1); });
