# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Deploy

```bash
npm run build          # Copy files to www/, cache-bust with timestamp
npm run deploy         # Build + deploy to Cloudflare Pages (tarot.ripdi.net)
npm run cap:sync       # Build + sync web assets to Android/iOS
npm run cap:android    # cap:sync + open Android Studio
npm run cap:ios        # cap:sync + open iOS via Xcode
```

No bundler — vanilla JS loaded via `<script>` tags in index.html. Load order matters (app.js first, then billing/notify/settings, then modules). **When adding a new file, you must add it in three places:** the `<script>` tag list in `index.html`, the `FILES` array in `build.js`, and (for modules with icons) an entry in the `icons` object in `app.js`.

Native plugins in use: `@capacitor-community/admob`, `@revenuecat/purchases-capacitor`, `@capacitor/local-notifications`. After adding one, run `npm run cap:sync`.

## Architecture

**MysticApp** (defined in `app.js`) is the global namespace and app shell. It handles navigation, the home grid, freemium gating, and exposes shared utilities. It returns a public API object from its IIFE, but other scripts also attach properties at runtime (e.g. `nature.js` adds `natureRng` and `skyStamp`, `ads.js` adds `adReadingDone`).

Each oracle is a standalone IIFE in its own file that calls `MysticApp.register()`:

```javascript
(function () {
  function render(container) {
    container.innerHTML = `...`;
    // build UI, attach listeners
  }

  MysticApp.register({
    id: 'myoracle',
    name: 'My Oracle',
    icon: MysticApp.icons.myoracle,   // SVG string defined in app.js
    desc: 'Short tagline',
    subtitle: 'Longer subtitle',
    render
  });
})();
```

Module state lives in closure variables. After a casting completes, call `MysticApp.adReadingDone()` (guard with `if (MysticApp.adReadingDone)`) and append `MysticApp.skyStamp()` to the result wrapped in `<div class="sky-stamp">`.

### Key helpers on MysticApp

- `natureRng()` — returns an RNG function seeded by real sun/moon positions + timing + crypto entropy
- `seededRng(str)` — deterministic LCG PRNG from a seed string
- `shuffle(arr, rng)` / `pick(arr, rng)` — Fisher-Yates shuffle and random pick
- `todayKey()` — `YYYY-M-D` string for daily-seeded readings
- `esc(s)` — HTML entity escape
- `getProfile()` / `saveProfile(patch)` — birth data in localStorage
- `skyStamp()` — human-readable lunar/solar moment string (added by `nature.js`)
- `adReadingDone()` — trigger interstitial ad counter (added by `ads.js`)
- `icons` — object of SVG strings keyed by module id

## Natural Randomness

All castings must use `MysticApp.natureRng()` (defined in `nature.js`), never plain `Math.random()`. It combines celestial positions (via AstroEngine from `natal.js`), `performance.now()` timing, and `crypto.getRandomValues` for entropy that feels thematically appropriate.

For deterministic daily readings (e.g. horoscope), use `MysticApp.seededRng(sign + '|' + MysticApp.todayKey())`.

## Monetization (freemium + ads + subscription)

Three tiers, defined in `app.js` by `tierOf()` over `FREE_MODULES` / `PLUS_MODULES`:
- **Free** — `horoscope`, `tarot` modules are open (banner ad only). Sub-features inside them are gated by the module itself (see below).
- **Rewarded** — every other oracle (numerology, iching, runes, moon, lucky, chinese, ouija): watch one AdMob rewarded video to unlock for the calendar day (`MysticApp.adUnlockedToday(id)` / `grantAdUnlock(id)`).
- **Plus** — `natal` module, plus the monthly/yearly horoscopes and the Tree of Life / Grand Tableau tarot spreads. Subscription only; also removes all ads.

Within the free modules: `tarot.js` gates by spread size (1 free; 3/5/7 rewarded via a shared `tarot-adv` day-unlock; 22/78 Plus). `horoscope.js` gates by tab (Daily free; Monthly/Yearly Plus).

Premium status lives in `localStorage['mystic-premium']` and is **written only by `billing.js`**; everything else reads it via `MysticApp.isPremium()`. Call `MysticApp.applyPremium(bool)` to flip it (rebuilds home, removes ads).

`ads.js` integrates AdMob via `@capacitor-community/admob`: banner + interstitial + rewarded (`MysticApp.showRewardedAd(onReward, onFail)`). All ads are suppressed for Plus. Currently test ad IDs with `TESTING: true`.

`billing.js` integrates RevenueCat (`@revenuecat/purchases-capacitor`) for the Plus subscription (entitlement id `plus`), and renders the subscribe screen (`MysticApp.openSubscribe()`). On a device it uses live offerings; in a browser it shows a preview with a "simulate Plus" button. **See `PUBLISHING.md` for the full go-live checklist (AdMob unit IDs, Play subscription products, RevenueCat keys).**

## Horoscope content selection

`horoscope.js` picks lines with `cyclePick()`, a Latin-square selector — **do not replace it with `MysticApp.pick()`**. It guarantees (a) all 12 signs get a different line on the same day, and (b) a sign walks the entire pool before any line repeats. The permutation is seeded by the salt alone and deliberately never reshuffles; reshuffling per cycle breaks guarantee (b) at every boundary. A plain random pick previously produced only ~7 distinct headlines across 12 signs per day (as few as 4) and repeated for a sign every ~2 days. Pools live at the top of the file; adding lines is safe, and a pool must stay ≥ 12 entries.

## AI-written readings

`worker/` is a Cloudflare Worker using Workers AI. It has two jobs: a **cron trigger** pre-generates horoscopes for all 12 signs once per period into KV (so the AI cost is fixed at ~$0.08/month regardless of user count), and a **live endpoint** writes per-user tarot and natal interpretations (~$0.0002 each, gated behind a rewarded ad or Plus).

`ai.js` is the client. **Every function resolves to `null` rather than throwing, and every caller keeps its on-device content as the fallback** — so the app still works fully offline, when the worker is down, and in builds where `ENDPOINT` is left empty. Do not make any feature depend on a successful AI call.

- `horoscope.js` renders from the static pools immediately, then silently re-paints if AI text arrives for the sign and tab the reader is still on (`maybeUpgrade()`).
- `tarot.js` `renderVoice()` shows the narrative automatically for spreads that already required a rewarded view or Plus, and offers a **rewarded "Watch & Read"** on the free single card — an extra ad surface where the ~$0.010 earned covers the ~$0.0002 cost many times over.
- `natal.js` adds a chart portrait for Plus users.

`GUARDRAILS` in `worker/src/index.js` is the system prompt blocking medical, legal, financial, mortality and self-harm content. Google Play's generative-AI policy requires safeguards — **keep them if you edit the prompt.** No API key exists anywhere: Workers AI is a binding.

Privacy shape (documented in `privacy-policy.html`, and the reason the Data Safety form stays simple): horoscopes send **nothing** about the user; live readings send only drawn card names/positions or calculated chart positions. Name, birth date, birth location, typed text and identifiers are **never** transmitted. Users can switch it all off in Settings → Readings. See `AI-SETUP.md` to deploy.

## Notifications & Settings

`notify.js` wraps `@capacitor/local-notifications`. Two jobs: a repeating daily reminder at the user's chosen time (id 1001), and **streak protection** for multi-day tarot spreads (ids 2007/2022/2078) — a one-off 20:00 reminder whenever a spread has an un-turned card, since missing a day resets the spread. `tarot.js` calls `MysticApp.notify.refreshStreak()` after sealing a spread and after every card turn. Preferences live in `localStorage['mystic-notify']`; nothing is scheduled until the user has been asked (`asked` flag), so the app never prompts on cold start.

`settings.js` renders the Settings screen (`MysticApp.settings.open()`, opened by the gear button in the header): Plus status, manage/restore subscription, notification toggles, birth details, privacy policy, subscription terms, and a two-tap data reset. Play expects an in-app path to manage a subscription — keep it.

First-run onboarding lives in `app.js` (`renderOnboarding()`), gated on `profile.onboarded`. It captures an optional name and birth date, derives the sun sign via `MysticApp.sunSign(dateStr)`, and offers the notification opt-in. Skip must always work. Once a sign is saved, `horoscope.js` opens straight to it instead of the 12-sign grid.

## Subdomain Routing

`app.js` maps subdomains to modules (e.g. `numerology.ripdi.net` → Numerology). The main domain `tarot.ripdi.net` shows the home grid. Map is in the `subdomainMap` object in `init()`.

## Mobile

Capacitor v8 wraps the web app for Android and iOS. Config in `capacitor.config.json` (appId: `net.ripdi.games.tarot`). After web changes, `npm run cap:sync` copies `www/` to native projects. Keystore details tracked in memory files.

## Data Files

- `cards.js` — 78-card tarot deck (meanings, keywords, emoji)
- `art.js` — inline SVG illustrations for tarot cards
- `cities.js` — geolocation data for natal chart timezone lookup

## Styling

Dark theme (`#1a0a2e` background, `#d4a04a` gold accents) in `style.css`. Responsive grid layout. Card flip/twinkle/spin animations. Mobile-first with viewport-fit cover.
