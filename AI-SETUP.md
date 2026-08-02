# AI-written readings — setup

The app writes horoscopes and reading interpretations with an AI model running on
Cloudflare Workers AI. **The app never depends on it**: every AI call has an
on-device fallback, so an outage, an offline phone, or a build with AI switched
off all still produce complete readings from the built-in text.

## How it is split (and why it's cheap)

| What | How it's generated | Cost |
| --- | --- | --- |
| Daily / monthly / yearly horoscopes | **Pre-generated** by a cron trigger, once per period for all 12 signs, cached in KV | **~$0.08/month total**, regardless of user count |
| Tarot spread interpretation | **Live**, per reading | ~$0.0002 each |
| Natal chart portrait | **Live**, per reading (Plus only) | ~$0.0002 each |

Live readings sit behind a rewarded ad or Plus. A rewarded view earns roughly
$0.010 against $0.0002 of cost — about 46× covered.

Entitlement in the app:

- **Single card (free)** — offers "Watch & Read" for a rewarded view. This is a new
  ad surface, and rewarded is the highest-eCPM format you have.
- **Three / Five card, Seven Day Horseshoe** — already required a rewarded view, so the
  interpretation is included automatically.
- **Tree of Life, Grand Tableau, Natal Chart** — Plus, included.
- **Plus subscribers** — everything included, no ads.

---

## 1. Create the KV namespace

```bash
cd worker
npm install
npx wrangler kv namespace create ORACLE_KV
```

Copy the printed `id` into `worker/wrangler.jsonc`, replacing
`REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.

## 2. Deploy

```bash
npx wrangler deploy
```

There is **no API key to configure**. Workers AI is a binding, so nothing secret
ever ships in the app or the repo.

Wrangler prints the deployed URL, e.g.
`https://mystic-oracle-ai.<your-subdomain>.workers.dev`.

## 3. Point the app at it

In `ai.js`, set:

```js
const ENDPOINT = 'https://mystic-oracle-ai.<your-subdomain>.workers.dev';
```

Then `npm run build` (or `npm run cap:sync` for the app).

Leaving `ENDPOINT` empty ships a build with AI fully off — useful if you want to
submit to the store before the worker is live.

## 4. Warm the cache

The cron runs at 03:15 UTC. To generate immediately:

```bash
curl "https://<your-worker-url>/v1/horoscope?period=day"
```

The first call for a period generates all 12 signs (~15–30s) and caches them; every
call after that is served from KV. Also worth running once for `period=month` and
`period=year`.

Check it's alive: `curl https://<your-worker-url>/v1/health`

## 5. Add a rate-limiting rule (recommended)

The worker has a built-in per-IP limiter, but it uses the edge cache so it is
per-datacenter and best-effort. The real control is a Cloudflare rule:

**Dashboard → your domain → Security → WAF → Rate limiting rules**
- Match: `URI Path contains /v1/reading`
- Limit: 20 requests per 1 minute per IP
- Action: Block

Without this, someone who finds the endpoint could run up inference usage. Cost is
still bounded by `max_tokens`, but there is no reason to leave it open.

---

## What it costs

Workers AI includes **10,000 Neurons/day free**, then $0.011 per 1,000 Neurons.
Workers itself is free to 100k requests/day; KV is free to 100k reads and 1,000
writes/day. The design writes **one KV key per period**, so it stays far inside the
free write limit.

At low volume this is likely $0/month. If live readings grow past the free
allocation you'll need Workers Paid ($5/month), and inference on top is still
fractions of a cent per reading.

## Guardrails

`GUARDRAILS` in `worker/src/index.js` is the system prompt that blocks medical,
legal, financial, mortality, self-harm, and explicit content, and stops the model
breaking character. Google Play's generative-AI policy requires safeguards like
these — **keep them if you edit the prompt**, and answer "yes" to the store
listing's generative-AI question.

## Privacy

Horoscopes send nothing about the user — they are identical for everyone and simply
downloaded. Live readings send only drawn card names and positions, or calculated
chart positions. No name, birth date, birth location, typed text, or identifier is
ever transmitted. Users can turn the whole thing off in **Settings → Readings**.
`privacy-policy.html` documents all of this.

## Changing the model

`MODEL` at the top of `worker/src/index.js`. Anything on Workers AI's text-generation
list works. Larger models write better prose and cost more; the default
(`@cf/meta/llama-3.1-8b-instruct`) is a reasonable balance. If you later want a
frontier model, swap `env.AI.run(...)` for a `fetch()` to that provider and store the
key with `npx wrangler secret put` — the client and the rest of the app don't change.
