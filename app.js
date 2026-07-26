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
    biorhythm: svgOpen +
      '<path d="M6,24 H42" opacity="0.45"/>' +
      '<path d="M6,24 C12,10 18,10 24,24 C30,38 36,38 42,24"/>' +
      '<path d="M6,24 C12,38 18,38 24,24 C30,10 36,10 42,24"/>' +
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
      '</svg>'
  };

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
    // Note: no 'tarot' entry — tarot.ripdi.net is the main site domain
    // and should land on the home grid, not deep-link into a module.
    const subdomainMap = {
      'numerology': 'Numerology',
      'astrology': 'Horoscope',
      'iching': 'I Ching',
      'runes': 'Runes',
      'moon': 'Moon Phase',
      'natal': 'Natal Chart',
      'biorhythm': 'Biorhythms',
      'lucky': 'Lucky Numbers',
      'chinese': 'Chinese Zodiac'
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

  return { register, init, esc, shuffle, seededRng, todayKey, pick, getProfile, saveProfile, icons };
})();
