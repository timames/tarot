// Capture Play Store screenshots (1080x1920) and feature graphic (1024x500)
// against the live site using system Chrome via puppeteer-core.
const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SITE = 'https://tarot.ripdi.net';

const dayNum = Math.floor(new Date(new Date().toDateString()).getTime() / 86400000);
const d = new Date();
const todayKey = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

const PROFILE = { onboarded: true, fullName: '', sign: 'Leo', birthDate: '1992-08-05' };
const GAMIFY = {
  v: 1,
  streak: { count: 12, lastDay: dayNum, best: 14, claimedUpTo: 7 },
  boxes: 3,
  inv: { backs: ['classic', 'midnight', 'embers', 'lunar', 'aurora'] },
  equipped: 'aurora',
  daily: { day: todayKey, adOpens: 0, gameWins: {}, plusBox: false }
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function clickTile(page, name) {
  await page.evaluate((n) => {
    const tiles = Array.from(document.querySelectorAll('.home-tile'));
    const t = tiles.find(el => {
      const nm = el.querySelector('.home-tile-name');
      return nm && nm.textContent.trim().toLowerCase().includes(n.toLowerCase());
    });
    if (t) t.click();
  }, name);
  await sleep(900);
}

async function goHome(page) {
  await page.evaluate(() => {
    const b = document.getElementById('btn-back');
    if (b && !b.classList.contains('hidden')) b.click();
    window.scrollTo(0, 0);
  });
  await sleep(700);
}

async function shot(page, file) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  await page.screenshot({ path: path.join(__dirname, file) });
  console.log('saved', file);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--hide-scrollbars', '--force-device-scale-factor=3']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });
  await page.evaluateOnNewDocument((profile, gamify, tk) => {
    localStorage.setItem('mystic-profile', JSON.stringify(profile));
    localStorage.setItem('mystic-gamify', JSON.stringify(gamify));
    localStorage.setItem('mystic-notify', JSON.stringify({ asked: true, daily: false, streak: false, hour: 9, minute: 0 }));
    localStorage.setItem('mystic-ad-tarot-adv', tk); // day-unlock for 3/5/7 spreads
  }, PROFILE, GAMIFY, todayKey);

  await page.goto(SITE, { waitUntil: 'networkidle2', timeout: 60000 });
  await sleep(1500);

  // 1. Home grid
  await shot(page, 'shot-1-home.png');

  // 2. Horoscope (auto-opens Leo)
  await clickTile(page, 'Horoscope');
  await sleep(1200);
  await shot(page, 'shot-2-horoscope.png');
  await goHome(page);

  // 3. Tarot 3-card spread revealed (day-unlock pre-seeded in localStorage)
  await clickTile(page, 'Tarot');
  await page.evaluate(() => {
    const opt = document.querySelector('[data-spread="3"]');
    if (opt) opt.click();
  });
  await sleep(1000);
  // flip all cards
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const slots = Array.from(document.querySelectorAll('.card-slot'));
      const s = slots.find(sl => { const c = sl.querySelector('.card'); return c && !c.classList.contains('flipped'); });
      if (s) s.click();
    });
    await sleep(900);
  }
  // wait for the AI narrative to finish loading (skeleton shimmer gone)
  await page.waitForFunction(() => {
    const v = document.getElementById('ai-voice');
    return !v || !v.querySelector('.ai-skel, .skel, [class*="skel"]') || v.textContent.trim().length > 40;
  }, { timeout: 15000 }).catch(() => {});
  await sleep(1000);
  await shot(page, 'shot-3-tarot.png');
  await goHome(page);

  // 4. Sanctum
  await clickTile(page, 'Sanctum');
  await sleep(800);
  await shot(page, 'shot-4-sanctum.png');

  // 5. Box reveal (open a box, flip the card)
  await page.evaluate(() => {
    const b = document.getElementById('gx-open');
    if (b) b.click();
  });
  await sleep(800);
  await page.evaluate(() => {
    const c = document.getElementById('rv-card');
    if (c) c.click();
  });
  await sleep(1300);
  await shot(page, 'shot-5-reveal.png');
  await goHome(page);

  // 6. Arcana Pairs with a couple of tiles flipped
  await clickTile(page, 'Sanctum');
  await page.evaluate(() => {
    const row = document.querySelector('.sanctum-game-row, [data-game]');
    if (row) row.click();
  });
  await sleep(900);
  await page.evaluate(() => {
    const tiles = document.querySelectorAll('.mem-tile');
    if (tiles[5]) tiles[5].click();
  });
  await sleep(250);
  await page.evaluate(() => {
    const tiles = document.querySelectorAll('.mem-tile:not(.flipped)');
    if (tiles[8]) tiles[8].click();
  });
  await sleep(300);
  await shot(page, 'shot-6-pairs.png');
  await goHome(page);

  // 7. Plus subscribe screen
  await page.evaluate(() => {
    const cta = document.querySelector('.home-plus-cta, #home-plus, .plus-cta');
    if (cta) cta.click(); else if (typeof MysticApp !== 'undefined' && MysticApp.openSubscribe) MysticApp.openSubscribe();
  });
  await sleep(1000);
  await shot(page, 'shot-7-plus.png');

  // Feature graphic 1024x500
  const fg = await browser.newPage();
  await fg.setViewport({ width: 1024, height: 500, deviceScaleFactor: 1 });
  await fg.goto('file:///' + path.join(__dirname, 'feature-graphic.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await fg.evaluate(() => document.fonts.ready);
  await sleep(600);
  await fg.screenshot({ path: path.join(__dirname, 'feature-graphic.png') });
  console.log('saved feature-graphic.png');

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
