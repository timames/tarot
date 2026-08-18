// Mystic Oracle — app shell, navigation, and shared helpers.
// Modules register themselves via MysticApp.register() and render into #module-view.

const MysticApp = (function () {
  const modules = [];
  let activeModule = null;

  function register(mod) {
    modules.push(mod);
  }

  // --- Shared helpers -------------------------------------------------------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function shuffle(arr, rng) {
    const rand = rng || Math.random;
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Deterministic RNG so daily readings stay stable for the whole day.
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function seededRng(seedStr) {
    let a = hashString(seedStr);
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  }

  function pick(arr, rng) {
    return arr[Math.floor((rng || Math.random)() * arr.length)];
  }

  // Birth profile shared by numerology and natal chart.
  function getProfile() {
    try {
      return JSON.parse(localStorage.getItem('mystic-profile')) || {};
    } catch (e) {
      return {};
    }
  }

  function saveProfile(patch) {
    const p = Object.assign(getProfile(), patch);
    try { localStorage.setItem('mystic-profile', JSON.stringify(p)); } catch (e) {}
    return p;
  }

  // Sun sign from a 'YYYY-MM-DD' string. Boundaries match ZODIAC_SIGNS.
  const SIGN_BOUNDS = [
    [120, 'Capricorn'], [219, 'Aquarius'], [321, 'Pisces'], [420, 'Aries'],
    [521, 'Taurus'], [621, 'Gemini'], [723, 'Cancer'], [823, 'Leo'],
    [923, 'Virgo'], [1023, 'Libra'], [1122, 'Scorpio'], [1222, 'Sagittarius'],
    [1232, 'Capricorn']
  ];

  function sunSign(dateStr) {
    if (!dateStr) return null;
    const parts = String(dateStr).split('-').map(Number);
    const m = parts[1], d = parts[2];
    if (!m || !d) return null;
    const md = m * 100 + d;
    for (let i = 0; i < SIGN_BOUNDS.length; i++) {
      if (md < SIGN_BOUNDS[i][0]) return SIGN_BOUNDS[i][1];
    }
    return 'Capricorn';
  }

  // --- Occult icon set (gold line-art, stroke follows currentColor) ---------

  const svgOpen = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">';
  const icons = {
    tarot: svgOpen +
      '<rect x="15" y="7" width="18" height="34" rx="2.5"/>' +
      '<path d="M18.5,24 Q24,19 29.5,24 Q24,29 18.5,24 Z"/>' +
      '<circle cx="24" cy="24" r="1.8"/>' +
      '<path d="M24,11.5 v3 M22.5,13 h3 M24,33.5 v3 M22.5,35 h3"/>' +
      '</svg>',
    horoscope: svgOpen +
      '<circle cx="24" cy="24" r="16"/>' +
      '<circle cx="24" cy="24" r="6"/>' +
      Array.from({ length: 12 }, (_, i) => {
        const a = i * Math.PI / 6;
        const x1 = 24 + 13 * Math.cos(a), y1 = 24 + 13 * Math.sin(a);
        const x2 = 24 + 16 * Math.cos(a), y2 = 24 + 16 * Math.sin(a);
        return `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}"/>`;
      }).join('') +
      '<circle cx="24" cy="24" r="1" fill="currentColor"/>' +
      '</svg>',
    natal: svgOpen +
      '<circle cx="24" cy="24" r="8.5"/>' +
      '<ellipse cx="24" cy="24" rx="19" ry="6.5" transform="rotate(-18 24 24)"/>' +
      '<circle cx="7.5" cy="29" r="1.3" fill="currentColor"/>' +
      '<circle cx="40.5" cy="19" r="1.3" fill="currentColor"/>' +
      '</svg>',
    numerology: svgOpen +
      '<circle cx="24" cy="24" r="17"/>' +
      '<path d="M24,8.5 L37.9,31.8 L10.1,31.8 Z"/>' +
      '<circle cx="24" cy="25" r="5.5"/>' +
      '</svg>',
    iching: svgOpen +
      '<path d="M13,10 h8 M27,10 h8"/><path d="M13,16 h22"/>' +
      '<path d="M13,22 h8 M27,22 h8"/><path d="M13,28 h22"/>' +
      '<path d="M13,34 h8 M27,34 h8"/><path d="M13,40 h22"/>' +
      '</svg>',
    runes: svgOpen +
      '<circle cx="24" cy="24" r="16"/>' +
      '<path d="M24,34 V15 M24,21 L17,13.5 M24,21 L31,13.5"/>' +
      '</svg>',
    moon: svgOpen +
      '<path d="M29,8 A16.5,16.5 0 1,0 29,40 A13,13 0 1,1 29,8 Z"/>' +
      '<path d="M36,14 v4 M34,16 h4 M39,26 v3 M37.5,27.5 h3"/>' +
      '</svg>',
    lucky: svgOpen +
      '<circle cx="24" cy="24" r="17"/>' +
      '<path d="M24,8 L14.6,36.9 L39.2,19.1 L8.8,19.1 L33.4,36.9 Z"/>' +
      '</svg>',
    chinese: svgOpen +
      '<circle cx="24" cy="24" r="16"/>' +
      '<path d="M24,8 a8,8 0 0 1 0,16 a8,8 0 0 0 0,16"/>' +
      '<circle cx="24" cy="16" r="2"/>' +
      '<circle cx="24" cy="32" r="2" fill="currentColor"/>' +
      '</svg>',
    ouija: svgOpen +
      '<path d="M24,5 C35,13 41,24 39.5,35 C38,43 31.5,48 24,48 C16.5,48 10,43 8.5,35 C7,24 13,13 24,5 Z" transform="translate(0,-3)"/>' +
      '<circle cx="24" cy="18" r="6"/>' +
      '<circle cx="14" cy="34" r="1.4" fill="currentColor"/>' +
      '<circle cx="34" cy="34" r="1.4" fill="currentColor"/>' +
      '<circle cx="24" cy="40" r="1.4" fill="currentColor"/>' +
      '</svg>',
    gear: svgOpen +
      '<circle cx="24" cy="24" r="6.5"/>' +
      '<circle cx="24" cy="24" r="12.5"/>' +
      Array.from({ length: 8 }, (_, i) => {
        const a = i * Math.PI / 4;
        const x1 = 24 + 12.5 * Math.cos(a), y1 = 24 + 12.5 * Math.sin(a);
        const x2 = 24 + 17.5 * Math.cos(a), y2 = 24 + 17.5 * Math.sin(a);
        return `<path d="M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)}"/>`;
      }).join('') +
      '</svg>',
    play: svgOpen +
      '<circle cx="24" cy="24" r="17"/>' +
      '<path d="M20,17 L33,24 L20,31 Z" fill="currentColor" stroke="none"/>' +
      '</svg>',
    star: svgOpen +
      '<path d="M24,6 L29.5,18.5 L43,20 L33,29.5 L35.8,43 L24,36 L12.2,43 L15,29.5 L5,20 L18.5,18.5 Z"/>' +
      '</svg>',
    sanctum: svgOpen +
      '<path d="M9,22 h30 v18 h-30 Z"/>' +
      '<path d="M9,22 a15,11 0 0 1 30,0"/>' +
      '<path d="M9,29 h30"/>' +
      '<path d="M21.5,26 h5 v6 h-5 Z"/>' +
      '<path d="M24,29.5 v1.5"/>' +
      '</svg>'
  };

  // --- Access model ---------------------------------------------------------
  //
  // Three tiers (set at launch — see monetization plan):
  //   FREE_MODULES     — open to everyone (banner ad only). Sub-features inside
  //                      these may still be rewarded/Plus (handled by the module).
  //   PLUS_MODULES     — subscription only ("Mystic Oracle Plus").
  //   everything else  — REWARDED: watch one rewarded ad to unlock for the day,
  //                      or free with Plus.
  //
  // Premium status is owned by billing.js, which writes localStorage
  // 'mystic-premium' = '1' whenever the RevenueCat "plus" entitlement is active.
  // Everything here reads it synchronously via isPremium().

  const FREE_MODULES = ['horoscope', 'tarot', 'sanctum'];
  const PLUS_MODULES = ['natal'];

  function tierOf(mod) {
    if (FREE_MODULES.includes(mod.id)) return 'free';
    if (PLUS_MODULES.includes(mod.id)) return 'plus';
    return 'rewarded';
  }

  function isPremium() {
    try { return localStorage.getItem('mystic-premium') === '1'; } catch (e) { return false; }
  }

  // Called by billing.js after checking the RevenueCat entitlement.
  function applyPremium(active) {
    try {
      if (active) localStorage.setItem('mystic-premium', '1');
      else localStorage.removeItem('mystic-premium');
    } catch (e) {}
    if (active && MysticApp.hideAds) MysticApp.hideAds();
    if (els.home) { buildHome(); if (!activeModule) showHome(); }
  }

  // Legacy name kept for the old "unlock" flow / manual testing.
  function unlockPremium() { applyPremium(true); }

  // Rewarded-ad unlocks are remembered per module for the current calendar day.
  function adUnlockedToday(id) {
    try { return localStorage.getItem('mystic-ad-' + id) === todayKey(); } catch (e) { return false; }
  }
  function grantAdUnlock(id) {
    try { localStorage.setItem('mystic-ad-' + id, todayKey()); } catch (e) {}
  }

  function isUnlocked(mod) {
    const t = tierOf(mod);
    if (t === 'free') return true;
    if (isPremium()) return true;
    if (t === 'plus') return false;
    return adUnlockedToday(mod.id); // rewarded
  }

  // --- Gate screens ---------------------------------------------------------

  // Shown for a REWARDED oracle the user hasn't unlocked today.
  function renderRewardGate(mod) {
    els.subtitle.textContent = 'Unlock today’s reading';
    els.view.innerHTML = `
      <div class="gate reward-gate">
        <div class="gate-icon">${mod.icon}</div>
        <h2>${esc(mod.name)}</h2>
        <p class="gate-text">Watch a short video to unlock <b>${esc(mod.name)}</b> for the rest of today — free.</p>
        <button class="btn-primary gate-btn" id="btn-watch">${icons.play}<span>Watch &amp; Unlock</span></button>
        <div class="gate-or">or</div>
        <div class="gate-plus">
          <h3>Mystic Oracle Plus</h3>
          <p>Unlock every oracle, remove all ads, and open the monthly &amp; yearly horoscopes and natal chart.</p>
          <button class="btn-ghost" id="btn-gate-plus">See Plus</button>
        </div>
      </div>`;

    const watchBtn = els.view.querySelector('#btn-watch');
    watchBtn.addEventListener('click', function () {
      watchBtn.disabled = true;
      watchBtn.innerHTML = icons.play + '<span>Loading…</span>';
      const onReward = () => { grantAdUnlock(mod.id); openModule(mod); };
      if (MysticApp.showRewardedAd) {
        MysticApp.showRewardedAd(onReward, () => {
          watchBtn.disabled = false;
          watchBtn.innerHTML = icons.play + '<span>Watch &amp; Unlock</span>';
          if (!els.view.querySelector('.gate-err')) {
            watchBtn.insertAdjacentHTML('afterend',
              '<div class="gate-err">No ad available right now — please try again in a moment.</div>');
          }
        });
      } else {
        // Web / no native ads: unlock so the flow can be tested.
        onReward();
      }
    });
    els.view.querySelector('#btn-gate-plus').addEventListener('click', () => openSubscribe());
  }

  // Shown for a PLUS-only oracle when the user isn't subscribed.
  function renderPlusPaywall(mod) {
    els.subtitle.textContent = 'A Mystic Oracle Plus feature';
    els.view.innerHTML = `
      <div class="gate plus-gate">
        <div class="gate-icon">${mod.icon}</div>
        <h2>${esc(mod.name)}</h2>
        <p class="gate-text"><b>${esc(mod.name)}</b> is part of <b>Mystic Oracle Plus</b>.</p>
        <button class="btn-primary gate-btn" id="btn-paywall-plus">${icons.star}<span>Unlock with Plus</span></button>
        <div class="gate-restore"><button class="link-btn" id="btn-restore">Restore purchase</button></div>
      </div>`;
    els.view.querySelector('#btn-paywall-plus').addEventListener('click', () => openSubscribe());
    const restore = els.view.querySelector('#btn-restore');
    restore.addEventListener('click', function () {
      restore.textContent = 'Restoring…';
      if (MysticApp.billing && MysticApp.billing.restore) {
        MysticApp.billing.restore().then(active => {
          if (active) openModule(mod);
          else restore.textContent = 'No purchase found';
        });
      } else { restore.textContent = 'Not available here'; }
    });
  }

  // Full "Mystic Oracle Plus" subscribe screen. billing.js overrides this with
  // one wired to live RevenueCat offerings; this is the fallback shell.
  function defaultSubscribe() {
    activeModule = { id: '__subscribe__', name: 'Mystic Oracle Plus' };
    els.home.classList.add('hidden');
    els.view.classList.remove('hidden');
    els.back.classList.remove('hidden');
    els.title.textContent = 'Mystic Oracle Plus';
    els.subtitle.textContent = 'Every oracle, no ads';
    if (els.footer) els.footer.classList.add('hidden');
    els.view.innerHTML = `
      <div class="subscribe">
        <div class="sub-crown">${icons.star}</div>
        <h2>Mystic Oracle Plus</h2>
        <ul class="sub-benefits">
          <li>Every oracle unlocked, every day</li>
          <li>No ads, anywhere</li>
          <li>Monthly &amp; yearly horoscopes</li>
          <li>Full natal chart, Tree of Life &amp; Grand Tableau spreads</li>
        </ul>
        <div class="sub-note">Subscriptions will be available in the store build. (This preview build has no billing configured.)</div>
        <button class="link-btn" id="sub-restore">Restore purchase</button>
      </div>`;
    const r = els.view.querySelector('#sub-restore');
    if (r) r.addEventListener('click', () => { r.textContent = 'Not available here'; });
    window.scrollTo(0, 0);
  }

  function openSubscribe() {
    if (MysticApp.billing && MysticApp.billing.openSubscribe) MysticApp.billing.openSubscribe();
    else defaultSubscribe();
  }

  // --- Navigation -----------------------------------------------------------

  const els = {};

  function showHome() {
    activeModule = null;
    els.home.classList.remove('hidden');
    els.view.classList.add('hidden');
    els.back.classList.add('hidden');
    els.title.textContent = 'Mystic Oracle';
    els.subtitle.textContent = 'Ancient wisdom at your fingertips';
    els.view.innerHTML = '';
    if (els.footer) els.footer.classList.remove('hidden');
    if (els.settings) els.settings.classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  function openModule(mod) {
    activeModule = mod;
    els.home.classList.add('hidden');
    els.view.classList.remove('hidden');
    els.back.classList.remove('hidden');
    els.title.textContent = mod.name;
    els.view.innerHTML = '';
    if (els.footer) els.footer.classList.add('hidden');

    if (isUnlocked(mod)) {
      els.subtitle.textContent = mod.subtitle;
      mod.render(els.view);
    } else if (tierOf(mod) === 'plus') {
      renderPlusPaywall(mod);
    } else {
      renderRewardGate(mod);
    }
    window.scrollTo(0, 0);
  }

  function buildHome() {
    els.home.innerHTML = '';
    const premium = isPremium();
    modules.forEach(mod => {
      const t = tierOf(mod);
      const unlocked = isUnlocked(mod);
      const tile = document.createElement('button');
      tile.className = 'home-tile' + (unlocked || premium ? '' : ' locked');

      let badge = '';
      if (!premium) {
        if (t === 'plus') {
          badge = `<div class="tile-badge plus-badge">${icons.star}<span>Plus</span></div>`;
        } else if (t === 'rewarded' && !unlocked) {
          badge = `<div class="tile-badge ad-badge">${icons.play}<span>Ad</span></div>`;
        }
      }

      tile.innerHTML = `
        ${badge}
        <div class="home-tile-icon">${mod.icon}</div>
        <div class="home-tile-name">${esc(mod.name)}</div>
        <div class="home-tile-desc">${esc(mod.desc)}</div>
      `;
      tile.addEventListener('click', () => openModule(mod));
      els.home.appendChild(tile);
    });

    // A slim "Go Plus" call-to-action under the grid for non-subscribers.
    if (!premium) {
      const cta = document.createElement('button');
      cta.className = 'home-plus-cta';
      cta.innerHTML = `${icons.star}<span>Get Mystic Oracle Plus — every oracle, no ads</span>`;
      cta.addEventListener('click', () => openSubscribe());
      els.home.appendChild(cta);
    }
  }

  // --- First-run onboarding -------------------------------------------------
  // Asked once. Everything here is optional — Skip must always work.

  function renderOnboarding() {
    els.home.classList.add('hidden');
    els.view.classList.remove('hidden');
    els.back.classList.add('hidden');
    if (els.settings) els.settings.classList.add('hidden');
    if (els.footer) els.footer.classList.add('hidden');
    els.title.textContent = 'Welcome';
    els.subtitle.textContent = 'A moment, and the oracle knows you';

    els.view.innerHTML = `
      <div class="onboard">
        <div class="onboard-mark">${icons.star}</div>
        <p class="onboard-lead">Tell the oracle a little about you and your readings arrive
        already tuned — your horoscope opens on your own sign, and your numbers and chart
        are ready when you want them.</p>
        <form class="mystic-form" id="ob-form">
          <label>Your name <span class="ob-optional">optional</span>
            <input type="text" id="ob-name" placeholder="What shall we call you?" autocomplete="off">
          </label>
          <label>Birth date <span class="ob-optional">optional</span>
            <input type="date" id="ob-dob">
          </label>
          <div class="ob-sign hidden" id="ob-sign"></div>
          <label class="ob-check">
            <input type="checkbox" id="ob-notify" checked>
            <span>Remind me each day, and warn me before a multi-day spread breaks</span>
          </label>
          <button type="submit" class="btn-primary">Begin</button>
        </form>
        <button class="link-btn" id="ob-skip">Skip for now</button>
      </div>`;

    const dob = els.view.querySelector('#ob-dob');
    const signEl = els.view.querySelector('#ob-sign');
    dob.addEventListener('change', function () {
      const s = sunSign(this.value);
      if (s) {
        signEl.textContent = 'You are ' + s + ' ✦';
        signEl.classList.remove('hidden');
      } else {
        signEl.classList.add('hidden');
      }
    });

    function finish(patch) {
      saveProfile(Object.assign({ onboarded: true }, patch));
      if (els.settings) els.settings.classList.remove('hidden');
      buildHome();
      showHome();
    }

    els.view.querySelector('#ob-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const name = els.view.querySelector('#ob-name').value.trim();
      const birthDate = dob.value;
      const wantsNotify = els.view.querySelector('#ob-notify').checked;
      const patch = {};
      if (name) patch.fullName = name;
      if (birthDate) {
        patch.birthDate = birthDate;
        const s = sunSign(birthDate);
        if (s) patch.sign = s;
      }
      if (wantsNotify && MysticApp.notify) MysticApp.notify.enable();
      else if (MysticApp.notify) MysticApp.notify.setDaily(false);
      finish(patch);
    });

    els.view.querySelector('#ob-skip').addEventListener('click', () => finish({}));
    window.scrollTo(0, 0);
  }

  function createStars() {
    const container = document.getElementById('stars');
    for (let i = 0; i < 80; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.setProperty('--dur', (1.5 + Math.random() * 3) + 's');
      star.style.animationDelay = Math.random() * 3 + 's';
      star.style.width = star.style.height = (1 + Math.random() * 2) + 'px';
      container.appendChild(star);
    }
  }

  function init() {
    els.home = document.getElementById('home');
    els.view = document.getElementById('module-view');
    els.back = document.getElementById('btn-back');
    els.settings = document.getElementById('btn-settings');
    els.title = document.getElementById('app-title');
    els.subtitle = document.getElementById('app-subtitle');
    els.footer = document.querySelector('.app-footer');

    createStars();
    buildHome();

    els.back.addEventListener('click', showHome);

    if (els.settings) {
      els.settings.innerHTML = icons.gear;
      els.settings.addEventListener('click', function () {
        if (MysticApp.settings) MysticApp.settings.open();
      });
    }

    // Subdomain routing — auto-open module based on hostname
    // Note: no 'tarot' entry — tarot.ripdi.net is the main site domain
    // and should land on the home grid, not deep-link into a module.
    const subdomainMap = {
      'numerology': 'Numerology',
      'astrology': 'Horoscope',
      'iching': 'I Ching',
      'runes': 'Runes',
      'moon': 'Moon Phase',
      'natal': 'Natal Chart',
      'lucky': 'Lucky Numbers',
      'chinese': 'Chinese Zodiac',
      'ouija': 'Spirit Board',
      'spirit': 'Spirit Board',
    };
    const sub = window.location.hostname.split('.')[0];
    const targetName = subdomainMap[sub];
    const targetMod = targetName && modules.find(m => m.name === targetName);

    if (targetMod) {
      openModule(targetMod);
    } else if (!getProfile().onboarded) {
      renderOnboarding();
    } else {
      showHome();
    }
  }

  return {
    register, init, esc, shuffle, seededRng, todayKey, pick,
    getProfile, saveProfile, sunSign, icons,
    isPremium, applyPremium, unlockPremium,
    adUnlockedToday, grantAdUnlock,
    openModule, showHome, openSubscribe,
    refresh: function () { if (els.home) { buildHome(); if (!activeModule) showHome(); } }
  };
})();
