// notify.js — local notifications: a daily reading reminder and streak
// protection for the multi-day tarot spreads.
//
// Multi-day spreads (7 / 22 / 78 day) reset if the user misses a single day,
// so an un-turned card is the one thing worth interrupting someone about.
//
// ── TO GO LIVE ──────────────────────────────────────────────────────────────
//   npm i @capacitor/local-notifications && npx cap sync
// Android 13+ also needs POST_NOTIFICATIONS in AndroidManifest.xml (already
// added). In a browser this module is inert but still stores preferences, so
// the settings screen works everywhere.
// ────────────────────────────────────────────────────────────────────────────

(function () {
  const PREF_KEY = 'mystic-notify';
  const ID_DAILY = 1001;
  const ID_STREAK = { 7: 2007, 22: 2022, 78: 2078 };
  const SPREAD_KEYS = { 7: 'mystic-spread-7', 22: 'mystic-spread-22', 78: 'mystic-spread-78' };
  const SPREAD_NAMES = { 7: 'Seven Day Horseshoe', 22: 'Tree of Life', 78: 'Grand Tableau' };

  const DAILY_MESSAGES = [
    'Your card for today is waiting to be turned.',
    'The stars have written something for you today.',
    'A new day, a new reading. Come and see.',
    'Today\'s guidance is ready when you are.',
    'The deck has been shuffled. Draw your card.',
    'Your daily horoscope has arrived.',
    'The sky has moved overnight — see what changed.'
  ];

  let LN = null;

  function isNative() {
    return !!(window.Capacitor && window.Capacitor.isNativePlatform());
  }

  function defaults() {
    return { daily: true, hour: 9, minute: 0, streak: true, asked: false };
  }

  function prefs() {
    try {
      return Object.assign(defaults(), JSON.parse(localStorage.getItem(PREF_KEY)) || {});
    } catch (e) { return defaults(); }
  }

  function savePrefs(patch) {
    const p = Object.assign(prefs(), patch);
    try { localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) {}
    return p;
  }

  function localDayNumber() {
    return Math.floor(new Date(new Date().toDateString()).getTime() / 86400000);
  }

  async function permissionGranted() {
    if (!LN) return false;
    try {
      const cur = await LN.checkPermissions();
      if (cur && cur.display === 'granted') return true;
      const req = await LN.requestPermissions();
      return !!(req && req.display === 'granted');
    } catch (e) {
      return false;
    }
  }

  async function cancelIds(ids) {
    if (!LN || !ids.length) return;
    try { await LN.cancel({ notifications: ids.map(id => ({ id })) }); } catch (e) {}
  }

  // ── Daily reminder ────────────────────────────────────────────────────────

  async function scheduleDaily() {
    if (!LN) return;
    await cancelIds([ID_DAILY]);
    const p = prefs();
    if (!p.daily) return;
    if (!(await permissionGranted())) return;
    const body = DAILY_MESSAGES[localDayNumber() % DAILY_MESSAGES.length];
    try {
      await LN.schedule({
        notifications: [{
          id: ID_DAILY,
          title: 'Mystic Oracle',
          body: body,
          schedule: { on: { hour: p.hour, minute: p.minute }, repeats: true, allowWhileIdle: true }
        }]
      });
    } catch (e) { console.log('Daily reminder failed:', e); }
  }

  // ── Streak protection ─────────────────────────────────────────────────────
  // For every active multi-day spread, keep exactly one pending reminder:
  //  - today at 20:00 if today's card is still un-turned (and 20:00 is ahead)
  //  - otherwise tomorrow at 20:00
  // Called on launch and again every time a card is turned.

  function spreadState(size) {
    let data = null;
    try { data = JSON.parse(localStorage.getItem(SPREAD_KEYS[size])); } catch (e) { return null; }
    if (!data || !data.cards || data.cards.length !== size) return null;
    const turned = data.turnedDays ? data.turnedDays.length : 0;
    if (turned >= size) return null;                       // finished
    const today = localDayNumber();
    if (turned > 0 && today > data.turnedDays[turned - 1] + 1) return null; // already broken
    const turnedToday = turned > 0 && data.turnedDays[turned - 1] === today;
    return { size, turned, turnedToday };
  }

  async function refreshStreak() {
    if (!LN) return;
    const p = prefs();
    const all = [7, 22, 78];
    await cancelIds(all.map(s => ID_STREAK[s]));
    if (!p.streak) return;
    if (!(await permissionGranted())) return;

    const notifications = [];
    for (const size of all) {
      const st = spreadState(size);
      if (!st) continue;

      const at = new Date();
      at.setHours(20, 0, 0, 0);
      if (st.turnedToday || at.getTime() <= Date.now()) {
        at.setDate(at.getDate() + 1); // already done today, or 20:00 has passed
      }

      notifications.push({
        id: ID_STREAK[size],
        title: 'Don\'t break the chain ✦',
        body: `Your ${SPREAD_NAMES[size]} is at day ${st.turned} of ${size}. Turn today's card before midnight.`,
        schedule: { at: at, allowWhileIdle: true }
      });
    }
    if (!notifications.length) return;
    try { await LN.schedule({ notifications }); } catch (e) { console.log('Streak reminder failed:', e); }
  }

  async function refreshAll() {
    await scheduleDaily();
    await refreshStreak();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  MysticApp.notify = {
    available: function () { return !!LN; },
    prefs: prefs,
    // Ask for OS permission then turn everything on. Used by onboarding.
    enable: async function () {
      savePrefs({ daily: true, streak: true, asked: true });
      const ok = await permissionGranted();
      if (ok) await refreshAll();
      return ok;
    },
    setDaily: async function (on) { savePrefs({ daily: !!on, asked: true }); await scheduleDaily(); },
    setStreak: async function (on) { savePrefs({ streak: !!on, asked: true }); await refreshStreak(); },
    setTime: async function (hour, minute) {
      savePrefs({ hour: Math.max(0, Math.min(23, hour | 0)), minute: Math.max(0, Math.min(59, minute | 0)) });
      await scheduleDaily();
    },
    refreshStreak: refreshStreak,
    refreshAll: refreshAll
  };

  function init() {
    if (!isNative()) return;
    try {
      LN = window.Capacitor.registerPlugin('LocalNotifications');
    } catch (e) {
      LN = null;
      return;
    }
    const p = prefs();
    // Only (re)schedule if the user has already been asked — never prompt on
    // cold start; onboarding and settings own the permission moment.
    if (p.asked) refreshAll();
    // Keep the streak reminder honest when the app comes back to the front.
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && prefs().asked) refreshStreak();
    });
  }

  init();
})();
