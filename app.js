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

  // Birth profile shared by numerology, natal chart, and biorhythm.
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
    window.scrollTo(0, 0);
  }

  function openModule(mod) {
    activeModule = mod;
    els.home.classList.add('hidden');
    els.view.classList.remove('hidden');
    els.back.classList.remove('hidden');
    els.title.textContent = mod.name;
    els.subtitle.textContent = mod.subtitle;
    els.view.innerHTML = '';
    mod.render(els.view);
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
    els.title = document.getElementById('app-title');
    els.subtitle = document.getElementById('app-subtitle');

    createStars();

    modules.forEach(mod => {
      const tile = document.createElement('button');
      tile.className = 'home-tile';
      tile.innerHTML = `
        <div class="home-tile-icon">${mod.icon}</div>
        <div class="home-tile-name">${esc(mod.name)}</div>
        <div class="home-tile-desc">${esc(mod.desc)}</div>
      `;
      tile.addEventListener('click', () => openModule(mod));
      els.home.appendChild(tile);
    });

    els.back.addEventListener('click', showHome);

    // Subdomain routing — auto-open module based on hostname
    const subdomainMap = {
      'tarot': 'Tarot',
      'numerology': 'Numerology',
      'astrology': 'Horoscope',
      'iching': 'I Ching',
      'runes': 'Runes',
      'moon': 'Moon Phase',
      'natal': 'Natal Chart',
      'biorhythm': 'Biorhythms',
      'lucky': 'Lucky Numbers'
    };
    const sub = window.location.hostname.split('.')[0];
    const targetName = subdomainMap[sub];
    const targetMod = targetName && modules.find(m => m.name === targetName);

    if (targetMod) {
      openModule(targetMod);
    } else {
      showHome();
    }
  }

  return { register, init, esc, shuffle, seededRng, todayKey, pick, getProfile, saveProfile };
})();
