// ai.js — client for the Mystic Oracle AI worker.
//
// Everything here is best-effort. Every function resolves to null rather than
// throwing, and every caller keeps its original on-device content as the
// fallback, so the app still works fully offline and if the worker is down.
//
// ── TO GO LIVE ──────────────────────────────────────────────────────────────
// 1. Deploy the worker:  cd worker && npx wrangler deploy
// 2. Put its URL in ENDPOINT below (no trailing slash), e.g.
//      https://mystic-oracle-ai.<your-subdomain>.workers.dev
//    or a custom route such as https://ai.ripdi.net
// 3. Leave ENDPOINT empty to ship a build with AI switched off entirely —
//    the app falls back to its written-in content everywhere.
// ────────────────────────────────────────────────────────────────────────────

(function () {
  const ENDPOINT = 'https://mystic-oracle-ai.tames.workers.dev';
  const TIMEOUT_MS = 9000;
  const OPT_OUT_KEY = 'mystic-ai';
  const CACHE_PREFIX = 'mystic-ai-horo-';

  function configured() { return typeof ENDPOINT === 'string' && /^https?:\/\//.test(ENDPOINT); }

  function optedOut() {
    try { return localStorage.getItem(OPT_OUT_KEY) === '0'; } catch (e) { return false; }
  }

  function enabled() {
    if (!configured() || optedOut()) return false;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
    return typeof fetch === 'function';
  }

  function setEnabled(on) {
    try {
      if (on) localStorage.removeItem(OPT_OUT_KEY);
      else localStorage.setItem(OPT_OUT_KEY, '0');
    } catch (e) {}
  }

  // Period keys use the device's LOCAL date so the text doesn't change under
  // the user mid-day. The worker accepts a day either side of UTC.
  function localKey(period) {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    const y = d.getFullYear(), m = p(d.getMonth() + 1), day = p(d.getDate());
    if (period === 'day') return y + '-' + m + '-' + day;
    if (period === 'month') return y + '-' + m;
    return String(y);
  }

  function readCache(period) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + period);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (!obj || obj.key !== localKey(period) || !obj.data || !obj.data.signs) return null;
      return obj.data;
    } catch (e) { return null; }
  }

  function writeCache(period, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + period,
        JSON.stringify({ key: localKey(period), data: data }));
    } catch (e) { /* quota — fine, we just refetch next time */ }
  }

  function timedFetch(url, opts) {
    const o = Object.assign({}, opts);
    let ctl = null;
    try {
      ctl = new AbortController();
      o.signal = ctl.signal;
    } catch (e) {}
    const timer = setTimeout(() => { if (ctl) try { ctl.abort(); } catch (e) {} }, TIMEOUT_MS);
    return fetch(url, o)
      .then(r => { clearTimeout(timer); return r; })
      .catch(err => { clearTimeout(timer); throw err; });
  }

  const inflight = {};

  // Resolves to the whole period payload ({ signs: { Aries: {...}, ... } }) or null.
  function horoscope(period) {
    period = ['day', 'month', 'year'].includes(period) ? period : 'day';

    const cached = readCache(period);
    if (cached) return Promise.resolve(cached);
    if (!enabled()) return Promise.resolve(null);
    if (inflight[period]) return inflight[period];

    const url = ENDPOINT + '/v1/horoscope?period=' + period + '&key=' + encodeURIComponent(localKey(period));
    inflight[period] = timedFetch(url, { method: 'GET' })
      .then(r => (r && r.ok) ? r.json() : null)
      .then(data => {
        if (data && data.signs && Object.keys(data.signs).length) {
          writeCache(period, data);
          return data;
        }
        return null;
      })
      .catch(() => null)
      .then(v => { delete inflight[period]; return v; });

    return inflight[period];
  }

  // Synchronous peek — lets a module render AI content instantly when it's
  // already cached, instead of flashing the fallback first.
  function cachedSign(period, signName) {
    const data = readCache(period);
    return (data && data.signs && data.signs[signName]) || null;
  }

  // Live per-user reading. kind: 'tarot' | 'natal'
  function reading(kind, payload) {
    if (!enabled()) return Promise.resolve(null);
    return timedFetch(ENDPOINT + '/v1/reading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: kind, payload: payload })
    })
      .then(r => (r && r.ok) ? r.json() : null)
      .then(d => (d && typeof d.text === 'string' && d.text.length > 40) ? d.text : null)
      .catch(() => null);
  }

  function clearCache() {
    try {
      ['day', 'month', 'year'].forEach(p => localStorage.removeItem(CACHE_PREFIX + p));
    } catch (e) {}
  }

  MysticApp.ai = {
    configured: configured,
    enabled: enabled,
    setEnabled: setEnabled,
    horoscope: horoscope,
    cachedSign: cachedSign,
    reading: reading,
    clearCache: clearCache
  };
})();
