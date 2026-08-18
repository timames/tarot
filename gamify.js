// Gamification — daily streak, loot boxes, cosmetic card backs, mini games,
// and the "Sanctum" screen that ties them together.
//
// Boxes are never purchasable with real money (keeps us clear of Play's
// loot-box odds-disclosure requirements). All drops roll with natureRng()
// and every reveal carries skyStamp().
//
// State shape (localStorage['mystic-gamify']):
//   { v, streak: {count,lastDay,best,claimedUpTo}, boxes,
//     inv: {backs:[...]}, equipped, daily: {day,adOpens,gameWins,plusBox} }
//
// Extensible: drops are {type,id}; REWARD_TYPES maps type -> handlers, so new
// reward kinds (oracle day-unlocks, AI credits, lore cards) just add an entry.
// New games register via MysticApp.gamify.registerGame().

(function () {
  const KEY = 'mystic-gamify';
  const MILESTONES = [3, 5, 7, 14, 21, 30, 60, 100];
  const AD_OPENS_PER_DAY = 3;

  // --- Card-back catalog (visuals live in style.css under [data-back]) ------

  const BACKS = [
    { id: 'classic',  name: 'Classic',       rarity: 'common',    symbol: '&#10022;' },
    { id: 'midnight', name: 'Midnight',      rarity: 'common',    symbol: '&#9789;'  },
    { id: 'embers',   name: 'Embers',        rarity: 'common',    symbol: '&#9650;'  },
    { id: 'verdant',  name: 'Verdant',       rarity: 'common',    symbol: '&#10047;' },
    { id: 'lunar',    name: 'Lunar Veil',    rarity: 'rare',      symbol: '&#9790;'  },
    { id: 'solar',    name: 'Solar Crown',   rarity: 'rare',      symbol: '&#9737;'  },
    { id: 'serpent',  name: 'Serpent Coil',  rarity: 'rare',      symbol: '&#8767;'  },
    { id: 'runic',    name: 'Runic Ward',    rarity: 'rare',      symbol: '&#5855;'  },
    { id: 'aurora',   name: 'Aurora',        rarity: 'legendary', symbol: '&#10038;' },
    { id: 'zenith',   name: 'Zenith',        rarity: 'legendary', symbol: '&#10040;' }
  ];
  const RARITY_LABEL = { common: 'Common', rare: 'Rare', legendary: 'Legendary' };
  const RARITY_ORDER = ['common', 'rare', 'legendary'];

  function backById(id) { return BACKS.find(b => b.id === id); }

  // --- State ----------------------------------------------------------------

  function defaults() {
    return {
      v: 1,
      streak: { count: 0, lastDay: 0, best: 0, claimedUpTo: 0 },
      boxes: 0,
      inv: { backs: ['classic'] },
      equipped: 'classic',
      daily: { day: '', adOpens: 0, gameWins: {}, plusBox: false }
    };
  }

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1) return Object.assign(defaults(), s);
    } catch (e) {}
    return defaults();
  }

  let S = load();

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  // Local day number — same scheme tarot.js uses for multi-day spreads.
  function dayNum() {
    return Math.floor(new Date(new Date().toDateString()).getTime() / 86400000);
  }

  // Roll the daily counters when the calendar day changes (also handles the
  // app sitting open across midnight — call before reading any daily field).
  function ensureDaily() {
    const today = MysticApp.todayKey();
    if (S.daily.day !== today) {
      S.daily = { day: today, adOpens: 0, gameWins: {}, plusBox: false };
      save();
    }
  }

  // --- Toast ----------------------------------------------------------------

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'gamify-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 20);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 3200);
  }

  // --- Streak ---------------------------------------------------------------

  function nextMilestone(after) {
    for (const m of MILESTONES) if (m > after) return m;
    return after - ((after - 100) % 50) + 50; // every 50 past 100
  }

  function prevMilestone(count) {
    let p = 0;
    for (const m of MILESTONES) if (m <= count) p = m;
    if (count > 100) p = count - ((count - 100) % 50);
    return p;
  }

  function checkMilestones() {
    let m = nextMilestone(S.streak.claimedUpTo);
    while (S.streak.count >= m) {
      const n = m >= 30 ? 2 : 1;
      S.boxes += n;
      S.streak.claimedUpTo = m;
      toast('Day ' + m + ' of your flame — ' + (n > 1 ? n + ' boxes await' : 'a box awaits') + ' in the Sanctum');
      m = nextMilestone(S.streak.claimedUpTo);
    }
  }

  // Called (via the adReadingDone wrap and a few direct hooks) whenever the
  // user completes any reading. Idempotent within a day.
  function recordReading() {
    ensureDaily();
    const d = dayNum();
    if (S.streak.lastDay === d) return;
    if (S.streak.lastDay === d - 1) {
      S.streak.count++;
    } else {
      S.streak.count = 1;
      S.streak.claimedUpTo = 0; // a broken flame earns its milestones anew
    }
    S.streak.lastDay = d;
    if (S.streak.count > S.streak.best) S.streak.best = S.streak.count;
    checkMilestones();
    save();
  }

  // Wrap the existing interstitial hook: every module that finishes a reading
  // already calls MysticApp.adReadingDone(), so the streak rides along free —
  // including on web, where ads.js leaves the hook undefined.
  const prevDone = MysticApp.adReadingDone;
  MysticApp.adReadingDone = function () {
    try { recordReading(); } catch (e) {}
    if (prevDone) return prevDone.apply(MysticApp, arguments);
  };

  // --- Reward types ---------------------------------------------------------
  // A drop is {type, id}. Future reward kinds only add an entry here.

  const REWARD_TYPES = {
    back: {
      title: 'Card Back',
      owned: id => S.inv.backs.indexOf(id) >= 0,
      apply: id => { if (S.inv.backs.indexOf(id) < 0) S.inv.backs.push(id); },
      renderFace: function (id) {
        const b = backById(id);
        return '<div class="card-face card-front reveal-front" data-back="' + b.id + '">' +
          '<div class="card-back-pattern"><div class="card-back-symbol">' + b.symbol + '</div></div>' +
          '<div class="reveal-name">' + MysticApp.esc(b.name) + '</div>' +
          '<div class="reveal-rarity rar-' + b.rarity + '">' + RARITY_LABEL[b.rarity] + '</div>' +
          '</div>';
      }
    }
  };

  // --- Box rolls ------------------------------------------------------------

  function rollDrop(rng) {
    const r = rng();
    const order = r < 0.60 ? ['common', 'rare', 'legendary']
                : r < 0.92 ? ['rare', 'common', 'legendary']
                : ['legendary', 'rare', 'common'];
    for (const tier of order) {
      const pool = BACKS.filter(b => b.rarity === tier && !REWARD_TYPES.back.owned(b.id));
      if (pool.length) return { type: 'back', id: MysticApp.pick(pool, rng).id };
    }
    return null; // full collection
  }

  // --- Games registry -------------------------------------------------------

  const games = [];
  function registerGame(g) { games.push(g); }

  function winsLeft(g) {
    ensureDaily();
    return Math.max(0, g.dailyCap - (S.daily.gameWins[g.id] || 0));
  }

  function awardWin(g) {
    ensureDaily();
    recordReading(); // a finished game counts as the day's reading
    const w = S.daily.gameWins[g.id] || 0;
    if (w < g.dailyCap) {
      S.daily.gameWins[g.id] = w + 1;
      S.boxes++;
      save();
      return true;
    }
    save();
    return false;
  }

  // --- Plus daily box -------------------------------------------------------

  function grantPlusBox() {
    ensureDaily();
    let prem = false;
    try { prem = MysticApp.isPremium(); } catch (e) {}
    if (!prem || S.daily.plusBox) return;
    S.daily.plusBox = true;
    S.boxes++;
    save();
    toast('Your daily Plus box has arrived in the Sanctum');
  }

  // --- Shared card-back helper ---------------------------------------------

  function cardBackHtml() {
    const b = backById(S.equipped) || BACKS[0];
    return '<div class="card-face card-back" data-back="' + b.id + '">' +
      '<div class="card-back-pattern"><div class="card-back-symbol">' + b.symbol + '</div></div></div>';
  }

  // --- Sanctum UI -----------------------------------------------------------

  let root = null;

  const flameSvg =
    '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M24,5 C30,13 36,18 36,28 A12,12 0 0 1 12,28 C12,20 19,16 20,9 C22,14 26,13 24,5 Z"/>' +
    '<path d="M24,25 C26.5,29 29,30.5 29,34 A5,5 0 0 1 19,34 C19,31 22,29 22,26"/>' +
    '</svg>';

  function streakPanelHtml() {
    const c = S.streak.count;
    const next = nextMilestone(c);
    const prev = prevMilestone(c);
    const span = next - prev, done = c - prev;

    let progress;
    if (span <= 14) {
      let dots = '';
      for (let i = 0; i < span; i++) dots += '<span class="hs-dot' + (i < done ? ' filled' : '') + '"></span>';
      progress = '<div class="hs-dots">' + dots + '</div>';
    } else {
      progress = '<div class="md-bar"><div class="md-bar-fill" style="width:' + (done / span * 100).toFixed(1) + '%"></div></div>';
    }

    return '' +
      '<div class="sanctum-panel">' +
        '<div class="sanctum-panel-head">' +
          '<span class="streak-flame' + (c > 0 ? ' lit' : '') + '">' + flameSvg + '</span>' +
          '<div><div class="streak-count">' + (c > 0 ? c + '-day flame' : 'The flame is unlit') + '</div>' +
          '<div class="streak-sub">' + (c > 0
            ? 'Best: ' + S.streak.best + ' days · box at day ' + next
            : 'Complete any reading today to light it') + '</div></div>' +
        '</div>' +
        progress +
      '</div>';
  }

  function boxesPanelHtml() {
    ensureDaily();
    let prem = false;
    try { prem = MysticApp.isPremium(); } catch (e) {}
    let inner;
    if (S.boxes > 0) {
      inner = '<button class="btn-primary" id="gx-open">Open a box (' + S.boxes + ')</button>';
    } else if (!prem && S.daily.adOpens < AD_OPENS_PER_DAY) {
      inner = '<p class="sanctum-note">No boxes to open. Keep your flame alive, win a trial — or:</p>' +
        '<button class="btn-primary gate-btn" id="gx-ad">' + MysticApp.icons.play +
        '<span>Watch a vision — receive a box</span></button>';
    } else {
      inner = '<p class="sanctum-note">No boxes to open. Keep your flame alive and win the trials below.</p>';
    }
    return '' +
      '<div class="sanctum-panel">' +
        '<div class="sanctum-panel-head">' +
          '<span class="sanctum-panel-icon">' + MysticApp.icons.sanctum + '</span>' +
          '<div><div class="streak-count">Boxes</div>' +
          '<div class="streak-sub">' + (S.boxes === 1 ? '1 unopened box' : S.boxes + ' unopened boxes') + '</div></div>' +
        '</div>' + inner +
      '</div>';
  }

  function gamesPanelHtml() {
    if (!games.length) return '';
    let rows = '';
    games.forEach((g, i) => {
      const left = winsLeft(g);
      rows += '<button class="sanctum-game-row" data-game="' + i + '">' +
        '<span class="sanctum-game-icon">' + g.icon + '</span>' +
        '<span class="sanctum-game-text"><span class="sanctum-game-name">' + MysticApp.esc(g.name) + '</span>' +
        '<span class="sanctum-game-desc">' + MysticApp.esc(g.desc) + '</span></span>' +
        '<span class="sanctum-game-left">' + (left > 0
          ? left + (left === 1 ? ' box' : ' boxes') + ' today'
          : 'for glory') + '</span>' +
        '</button>';
    });
    return '<h2 class="section-title">Trials</h2>' + rows;
  }

  function collectionHtml() {
    let tiles = '';
    const sorted = [...BACKS].sort((a, b) =>
      RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity));
    sorted.forEach(b => {
      const owned = REWARD_TYPES.back.owned(b.id);
      const equipped = S.equipped === b.id;
      tiles += '<button class="back-item' + (owned ? '' : ' unowned') + (equipped ? ' equipped' : '') +
        '" data-backid="' + b.id + '">' +
        '<span class="mini-back" data-back="' + b.id + '"><span class="card-back-symbol">' + b.symbol + '</span></span>' +
        '<span class="back-item-name">' + MysticApp.esc(b.name) + '</span>' +
        '<span class="back-item-rarity rar-' + b.rarity + '">' +
        (equipped ? 'Equipped' : owned ? RARITY_LABEL[b.rarity] : RARITY_LABEL[b.rarity] + ' · in boxes') +
        '</span></button>';
    });
    return '<h2 class="section-title">Card Backs</h2><div class="back-grid">' + tiles + '</div>';
  }

  function renderSanctum() {
    if (!root) return;
    grantPlusBox();
    root.innerHTML =
      '<div class="sanctum">' +
        streakPanelHtml() +
        boxesPanelHtml() +
        gamesPanelHtml() +
        collectionHtml() +
      '</div>';

    const openBtn = root.querySelector('#gx-open');
    if (openBtn) openBtn.addEventListener('click', openBoxFlow);

    const adBtn = root.querySelector('#gx-ad');
    if (adBtn) adBtn.addEventListener('click', function () {
      adBtn.disabled = true;
      adBtn.innerHTML = MysticApp.icons.play + '<span>Loading…</span>';
      const grant = () => {
        ensureDaily();
        S.daily.adOpens++;
        S.boxes++;
        save();
        renderSanctum();
      };
      if (MysticApp.showRewardedAd) {
        MysticApp.showRewardedAd(grant, () => {
          adBtn.disabled = false;
          adBtn.innerHTML = MysticApp.icons.play + '<span>Watch a vision — receive a box</span>';
          if (!root.querySelector('.gate-err')) {
            adBtn.insertAdjacentHTML('afterend',
              '<div class="gate-err">No vision available right now — please try again in a moment.</div>');
          }
        });
      } else {
        grant(); // web / no native ads: grant so the flow can be tested
      }
    });

    root.querySelectorAll('.sanctum-game-row').forEach(row => {
      row.addEventListener('click', () => openGame(games[parseInt(row.dataset.game)]));
    });

    root.querySelectorAll('.back-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.backid;
        if (!REWARD_TYPES.back.owned(id)) { toast('This design sleeps inside a box'); return; }
        S.equipped = id;
        save();
        renderSanctum();
      });
    });
  }

  // --- Box opening ----------------------------------------------------------

  function openBoxFlow() {
    if (S.boxes <= 0) return;
    S.boxes--;
    const rng = MysticApp.natureRng();
    const drop = rollDrop(rng);
    if (drop) REWARD_TYPES[drop.type].apply(drop.id); // applied at roll time — the reveal is ceremony
    save();

    if (!drop) {
      root.innerHTML =
        '<div class="box-reveal">' +
          '<div class="sanctum-panel-icon reveal-complete-mark">' + MysticApp.icons.star + '</div>' +
          '<h2 class="section-title">The Collection Is Complete</h2>' +
          '<p class="form-note">The box opens onto still air — every design already rests in your Sanctum. ' +
          'What more the boxes may hold, the sky has not yet revealed.</p>' +
          '<div class="sky-stamp">' + MysticApp.skyStamp() + '</div>' +
          '<button class="btn-primary" id="rv-back">Return to the Sanctum</button>' +
        '</div>';
      root.querySelector('#rv-back').addEventListener('click', renderSanctum);
      return;
    }

    root.innerHTML =
      '<div class="box-reveal">' +
        '<p class="tap-hint">The box creaks open — tap the card</p>' +
        '<div class="card-slot reveal-slot"><div class="card" id="rv-card">' +
          cardBackHtml() +
          REWARD_TYPES[drop.type].renderFace(drop.id) +
        '</div></div>' +
        '<div class="reveal-actions hidden" id="rv-actions">' +
          '<div class="sky-stamp">' + MysticApp.skyStamp() + '</div>' +
          '<button class="btn-primary" id="rv-equip">Equip</button>' +
          '<button class="btn-ghost" id="rv-keep">Keep in collection</button>' +
        '</div>' +
      '</div>';

    const card = root.querySelector('#rv-card');
    card.addEventListener('click', function onFlip() {
      if (card.classList.contains('flipped')) return;
      card.classList.add('flipped');
      setTimeout(() => {
        const actions = root.querySelector('#rv-actions');
        if (actions) actions.classList.remove('hidden');
      }, 800);
    });

    root.querySelector('#rv-equip').addEventListener('click', () => {
      if (drop.type === 'back') { S.equipped = drop.id; save(); }
      renderSanctum();
    });
    root.querySelector('#rv-keep').addEventListener('click', renderSanctum);
  }

  // --- Game screen ----------------------------------------------------------

  function openGame(g) {
    root.innerHTML = '';
    g.render(root, {
      awardWin: () => awardWin(g),
      winsLeft: () => winsLeft(g),
      cardBackHtml: cardBackHtml,
      exit: renderSanctum
    });
  }

  // --- Module registration --------------------------------------------------

  MysticApp.register({
    id: 'sanctum',
    name: 'Sanctum',
    icon: MysticApp.icons.sanctum,
    get desc() {
      ensureDaily();
      const bits = [S.streak.count > 0 ? S.streak.count + '-day flame' : 'Light your flame'];
      if (S.boxes > 0) bits.push(S.boxes + ' to open');
      return bits.join(' · ');
    },
    subtitle: 'Your flame, boxes & trials',
    render: function (container) {
      root = container;
      renderSanctum();
    }
  });

  MysticApp.gamify = { recordReading, registerGame, cardBackHtml };

  // Plus members receive their daily box even if they never open the Sanctum.
  grantPlusBox();
})();
