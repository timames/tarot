// Mystic Oracle — AI worker.
//
// Two jobs:
//   1. A cron trigger writes AI-written horoscopes for all 12 signs into KV once
//      per period. Every user then reads the same cached JSON, so the AI cost is
//      fixed (~$0.08/month) no matter how many users there are.
//   2. A live endpoint writes per-user tarot and natal readings. These cost about
//      $0.0002 each and sit behind a rewarded ad or Plus in the app.
//
// The app NEVER depends on this worker: every call has a static on-device
// fallback, so an outage or an offline phone just means the original content.
//
// Deploy:  cd worker && npx wrangler deploy
// Secrets: none — Workers AI is a binding, so there is no API key to leak.

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SIGNS = [
  { name: 'Aries',       element: 'Fire',  ruler: 'Mars',              traits: 'bold, direct, impatient' },
  { name: 'Taurus',      element: 'Earth', ruler: 'Venus',             traits: 'steadfast, sensual, stubborn' },
  { name: 'Gemini',      element: 'Air',   ruler: 'Mercury',           traits: 'curious, quick, scattered' },
  { name: 'Cancer',      element: 'Water', ruler: 'the Moon',          traits: 'protective, intuitive, tender' },
  { name: 'Leo',         element: 'Fire',  ruler: 'the Sun',           traits: 'generous, proud, warm' },
  { name: 'Virgo',       element: 'Earth', ruler: 'Mercury',           traits: 'precise, useful, self-critical' },
  { name: 'Libra',       element: 'Air',   ruler: 'Venus',             traits: 'fair, charming, indecisive' },
  { name: 'Scorpio',     element: 'Water', ruler: 'Pluto and Mars',    traits: 'intense, private, perceptive' },
  { name: 'Sagittarius', element: 'Fire',  ruler: 'Jupiter',           traits: 'restless, candid, optimistic' },
  { name: 'Capricorn',   element: 'Earth', ruler: 'Saturn',            traits: 'disciplined, patient, ambitious' },
  { name: 'Aquarius',    element: 'Air',   ruler: 'Uranus and Saturn', traits: 'original, detached, principled' },
  { name: 'Pisces',      element: 'Water', ruler: 'Neptune',           traits: 'dreamy, porous, kind' }
];

// Shared guardrails. This app is rated for a general audience and the store
// listing says "entertainment and reflection" — the model must stay inside that.
const GUARDRAILS = [
  'You write horoscopes and divination readings for an entertainment app.',
  'Rules you must follow without exception:',
  '- Never predict death, illness, pregnancy, or medical outcomes.',
  '- Never give medical, legal, financial, or investment advice, and never name a specific stock, asset, treatment, dose, or diagnosis.',
  '- Never claim certainty about the future. Suggest, invite, and describe tendencies.',
  '- Never mention self-harm, suicide, violence, or explicit sexual content.',
  '- Never tell the reader that something bad is fated or unavoidable.',
  '- Do not name real people, brands, or companies.',
  '- Write in warm, plain, grounded second person. No emoji, no hashtags, no markdown, no headings.',
  '- Use American spelling.',
  '- Be specific and concrete rather than vague and cosmic. Avoid the words "cosmic", "vibration", "manifest", "energy field".',
  '- Never mention that you are an AI, a model, or a language model.'
].join('\n');

const PERIOD_BRIEF = {
  day:   { words: '2 sentences', horizon: 'today',      label: 'daily' },
  month: { words: '3 sentences', horizon: 'this month', label: 'monthly' },
  year:  { words: '4 sentences', horizon: 'this year',  label: 'yearly' }
};

// ── small helpers ──────────────────────────────────────────────────────────

const json = (obj, status, origin) => new Response(JSON.stringify(obj), {
  status: status || 200,
  headers: Object.assign({ 'Content-Type': 'application/json' }, cors(origin))
});

// The app runs from a few known origins. Capacitor uses https://localhost on
// Android and capacitor://localhost on iOS.
const ALLOWED = [
  'https://tarot.ripdi.net', 'https://localhost', 'capacitor://localhost',
  'http://localhost', 'http://localhost:8788'
];

function cors(origin) {
  const ok = origin && (ALLOWED.includes(origin) || /\.ripdi\.net$/.test(originHost(origin)));
  return {
    'Access-Control-Allow-Origin': ok ? origin : 'https://tarot.ripdi.net',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function originHost(origin) {
  try { return new URL(origin).hostname; } catch (e) { return ''; }
}

function utcDate(d) { return d.toISOString().slice(0, 10); }

function periodKeyNow(period, now) {
  const iso = utcDate(now);
  if (period === 'day') return iso;
  if (period === 'month') return iso.slice(0, 7);
  return iso.slice(0, 4);
}

// Clients ask using their LOCAL date, which can be a day either side of UTC.
// Accept that window and refuse anything else so nobody can make us generate
// content for the year 3000.
function acceptableKey(period, key, now) {
  // Anything unexpected falls back to the current period rather than returning
  // null — a null here would end up cached under the literal key "horo:day:null"
  // and would let a junk query string trigger a fresh generation.
  if (typeof key !== 'string' || key.length > 10) return periodKeyNow(period, now);
  const shape = { day: /^\d{4}-\d{2}-\d{2}$/, month: /^\d{4}-\d{2}$/, year: /^\d{4}$/ }[period];
  if (!shape || !shape.test(key)) return periodKeyNow(period, now);
  const allowed = [-1, 0, 1].map(off => {
    const d = new Date(now.getTime() + off * 86400000);
    return periodKeyNow(period, d);
  });
  return allowed.includes(key) ? key : periodKeyNow(period, now);
}

// Models occasionally wrap JSON in prose or fences. Recover what we can.
function extractJson(text) {
  if (!text) return null;
  let s = String(text).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try { return JSON.parse(s.slice(start, end + 1)); } catch (e) { return null; }
}

function clean(v, max) {
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').replace(/^["'\s]+|["'\s]+$/g, '').trim();
  if (t.length < 20) return null;
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, '') + '.' : t;
}

// Best-effort per-IP limiter using the edge cache. It is per-colo and eventually
// consistent, so treat it as a speed bump — the real control is a Cloudflare
// Rate Limiting rule on the dashboard (see AI-SETUP.md).
async function rateLimited(request, limit, windowSec) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'anon';
    const bucket = Math.floor(Date.now() / 1000 / windowSec);
    const key = new Request('https://ratelimit.invalid/' + encodeURIComponent(ip) + '/' + bucket);
    const cache = caches.default;
    const hit = await cache.match(key);
    const count = hit ? (parseInt(await hit.text(), 10) || 0) + 1 : 1;
    if (count > limit) return true;
    await cache.put(key, new Response(String(count), {
      headers: { 'Cache-Control': 'max-age=' + windowSec }
    }));
    return false;
  } catch (e) {
    return false; // never let the limiter itself break the endpoint
  }
}

// ── horoscope generation ───────────────────────────────────────────────────

async function generateSign(env, sign, period, keyLabel) {
  const brief = PERIOD_BRIEF[period];
  const user = [
    `Write a ${brief.label} horoscope for ${sign.name} (${sign.element} sign, ruled by ${sign.ruler}, typically ${sign.traits}) for ${keyLabel}.`,
    `Cover four areas, each ${brief.words}, each about ${brief.horizon}:`,
    '  general - the overall theme',
    '  love - relationships, romantic or otherwise',
    '  career - work, study, money',
    '  wellness - body, rest, mood',
    'Make it feel written for this sign specifically, not interchangeable filler.',
    'Reply with ONLY a JSON object, no other text:',
    '{"general":"...","love":"...","career":"...","wellness":"..."}'
  ].join('\n');

  const out = await env.AI.run(MODEL, {
    messages: [
      { role: 'system', content: GUARDRAILS },
      { role: 'user', content: user }
    ],
    max_tokens: period === 'year' ? 640 : 460,
    temperature: 0.85
  });

  const parsed = extractJson(out && out.response);
  if (!parsed) return null;
  const limit = period === 'day' ? 320 : 640;
  const result = {
    general: clean(parsed.general, limit),
    love: clean(parsed.love, limit),
    career: clean(parsed.career, limit),
    wellness: clean(parsed.wellness, limit)
  };
  // Partial results are worse than none — the client falls back cleanly.
  return (result.general && result.love && result.career && result.wellness) ? result : null;
}

async function buildPeriod(env, period, key) {
  const label = period === 'day' ? key : period === 'month' ? key : 'the year ' + key;
  const results = await Promise.all(SIGNS.map(async s => {
    try { return [s.name, await generateSign(env, s, period, label)]; }
    catch (e) { return [s.name, null]; }
  }));

  const signs = {};
  let ok = 0;
  for (const [name, data] of results) {
    if (data) { signs[name] = data; ok++; }
  }
  // If most of it failed, don't cache a mostly-empty payload for a whole day.
  if (ok < 7) return null;
  return { period, key, generated: new Date().toISOString(), model: MODEL, signs };
}

async function getOrBuild(env, period, key, waitUntil) {
  const kvKey = `horo:${period}:${key}`;
  const cached = await env.ORACLE_KV.get(kvKey, 'json');
  if (cached) return cached;

  const built = await buildPeriod(env, period, key);
  if (!built) return null;

  // Daily content is worth a couple of days of TTL; yearly much longer.
  const ttl = period === 'day' ? 60 * 60 * 72 : period === 'month' ? 60 * 60 * 24 * 40 : 60 * 60 * 24 * 400;
  const put = env.ORACLE_KV.put(kvKey, JSON.stringify(built), { expirationTtl: ttl });
  if (waitUntil) waitUntil(put); else await put;
  return built;
}

// ── live readings ──────────────────────────────────────────────────────────

function tarotPrompt(p) {
  const cards = (p.cards || []).slice(0, 12).map((c, i) =>
    `${i + 1}. ${String(c.position || 'Card ' + (i + 1)).slice(0, 60)}: ${String(c.name || '').slice(0, 40)}` +
    (c.reversed ? ' (reversed)' : '') +
    (c.meaning ? ` — traditional meaning: ${String(c.meaning).slice(0, 220)}` : '')
  ).join('\n');

  const q = p.question ? String(p.question).slice(0, 200) : '';

  return [
    `The reader has drawn a ${String(p.spread || 'tarot').slice(0, 40)} spread:`,
    cards,
    q ? `They asked: "${q}"` : 'They did not ask a specific question.',
    '',
    'Write one flowing interpretation of 120-180 words that reads these cards TOGETHER',
    'as a single story — how the positions relate, where the tension is, what it suggests',
    'they do next. Refer to the cards by name. Do not list them one by one, and do not',
    'repeat the traditional meanings verbatim. No headings, no bullet points.'
  ].join('\n');
}

function natalPrompt(p) {
  const placements = (p.placements || []).slice(0, 14)
    .map(x => `${String(x.body || '').slice(0, 20)} in ${String(x.sign || '').slice(0, 20)}`).join(', ');
  const aspects = (p.aspects || []).slice(0, 8)
    .map(a => `${String(a.a || '').slice(0, 20)} ${String(a.type || '').slice(0, 20)} ${String(a.b || '').slice(0, 20)}`).join(', ');

  return [
    'A natal chart has been calculated with these placements:',
    placements || '(none)',
    aspects ? 'Notable aspects: ' + aspects : '',
    p.dominant ? `The chart leans ${String(p.dominant).slice(0, 12)}.` : '',
    '',
    'Write a 150-200 word portrait of this person as the chart describes them:',
    'how they meet the world, where their tension sits, and what they are working on.',
    'Weave the placements together rather than listing them. Speak to them directly',
    'as "you". No headings, no bullet points.'
  ].filter(Boolean).join('\n');
}

async function liveReading(env, body) {
  const kind = body && body.kind;
  let user;
  if (kind === 'tarot') user = tarotPrompt(body.payload || {});
  else if (kind === 'natal') user = natalPrompt(body.payload || {});
  else return null;

  const out = await env.AI.run(MODEL, {
    messages: [
      { role: 'system', content: GUARDRAILS },
      { role: 'user', content: user }
    ],
    max_tokens: 420,
    temperature: 0.9
  });

  const text = out && out.response ? String(out.response).trim() : '';
  const tidy = text
    .replace(/^```[\s\S]*?\n/, '').replace(/```$/, '')
    .replace(/^(here('s| is)[^\n:]*:\s*)/i, '')
    .replace(/\*\*/g, '').replace(/^#+\s*/gm, '')
    .trim();
  return tidy.length >= 80 ? tidy.slice(0, 2000) : null;
}

// ── handlers ───────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(origin) });
    }

    try {
      if (url.pathname === '/v1/health') {
        return json({ ok: true, model: MODEL }, 200, origin);
      }

      if (url.pathname === '/v1/horoscope' && request.method === 'GET') {
        const period = ['day', 'month', 'year'].includes(url.searchParams.get('period'))
          ? url.searchParams.get('period') : 'day';
        const now = new Date();
        const key = acceptableKey(period, url.searchParams.get('key'), now);

        // Cheap to serve from KV, so the limit here is generous.
        if (await rateLimited(request, 120, 3600)) {
          return json({ error: 'rate_limited' }, 429, origin);
        }

        const data = await getOrBuild(env, period, key, ctx.waitUntil.bind(ctx));
        if (!data) return json({ error: 'unavailable' }, 503, origin);
        return new Response(JSON.stringify(data), {
          headers: Object.assign(
            { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
            cors(origin)
          )
        });
      }

      if (url.pathname === '/v1/reading' && request.method === 'POST') {
        // Live generation costs money per call, so this one is tight.
        if (await rateLimited(request, 20, 3600)) {
          return json({ error: 'rate_limited' }, 429, origin);
        }
        const raw = await request.text();
        if (raw.length > 8000) return json({ error: 'too_large' }, 413, origin);
        let body;
        try { body = JSON.parse(raw); } catch (e) { return json({ error: 'bad_json' }, 400, origin); }

        const text = await liveReading(env, body);
        if (!text) return json({ error: 'unavailable' }, 503, origin);
        return json({ text }, 200, origin);
      }

      return json({ error: 'not_found' }, 404, origin);
    } catch (e) {
      // Never leak internals; the client falls back to on-device content anyway.
      return json({ error: 'server_error' }, 500, origin);
    }
  },

  // Cron: 03:15 UTC daily. Always refresh today and tomorrow (so every timezone
  // has content ready); refresh the month on the 1st and the year on Jan 1.
  async scheduled(event, env, ctx) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 86400000);
    const jobs = [
      ['day', periodKeyNow('day', now)],
      ['day', periodKeyNow('day', tomorrow)]
    ];
    if (now.getUTCDate() === 1) jobs.push(['month', periodKeyNow('month', now)]);
    if (now.getUTCMonth() === 0 && now.getUTCDate() === 1) jobs.push(['year', periodKeyNow('year', now)]);

    ctx.waitUntil((async () => {
      for (const [period, key] of jobs) {
        const kvKey = `horo:${period}:${key}`;
        const exists = await env.ORACLE_KV.get(kvKey);
        if (exists) continue;
        const built = await buildPeriod(env, period, key);
        if (!built) continue;
        const ttl = period === 'day' ? 60 * 60 * 72 : period === 'month' ? 60 * 60 * 24 * 40 : 60 * 60 * 24 * 400;
        await env.ORACLE_KV.put(kvKey, JSON.stringify(built), { expirationTtl: ttl });
      }
    })());
  }
};

// Exported for unit tests.
export const _internals = { extractJson, clean, acceptableKey, periodKeyNow, tarotPrompt, natalPrompt, cors, SIGNS, GUARDRAILS };
