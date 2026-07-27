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

No bundler — vanilla JS loaded via `<script>` tags in index.html. Load order matters (app.js first, then modules). New files must be added to both `index.html` and the `FILES` array in `build.js`.

## Architecture

**MysticApp** (defined in `app.js`) is the global namespace and app shell. It handles navigation, the home grid, freemium gating, and exposes shared utilities.

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

Module state lives in closure variables. After a casting completes, call `MysticApp.adReadingDone()` and append `MysticApp.skyStamp()` to the result.

### Key helpers on MysticApp

- `natureRng()` — returns an RNG function seeded by real sun/moon positions + timing + crypto entropy
- `seededRng(str)` — deterministic LCG PRNG from a seed string
- `shuffle(arr, rng)` / `pick(arr, rng)` — Fisher-Yates shuffle and random pick
- `todayKey()` — `YYYY-M-D` string for daily-seeded readings
- `esc(s)` — HTML entity escape
- `getProfile()` / `saveProfile(patch)` — birth data in localStorage
- `skyStamp()` — human-readable lunar/solar moment string
- `icons` — object of SVG strings keyed by module id

## Natural Randomness

All castings must use `MysticApp.natureRng()` (defined in `nature.js`), never plain `Math.random()`. It combines celestial positions (via AstroEngine from `natal.js`), `performance.now()` timing, and `crypto.getRandomValues` for entropy that feels thematically appropriate.

For deterministic daily readings (e.g. horoscope), use `MysticApp.seededRng(sign + '|' + MysticApp.todayKey())`.

## Freemium & Ads

`FREE_FOR_ALL` flag in `app.js` controls monetization (currently `true` — everything free). When disabled, `ALWAYS_FREE` modules (horoscope, tarot) stay unlocked; others rotate one free per day.

`ads.js` integrates AdMob via `@capacitor-community/admob`. Currently using test ad IDs with `TESTING: true`.

## Mobile

Capacitor v8 wraps the web app for Android and iOS. Config in `capacitor.config.json` (appId: `net.ripdi.games.tarot`). After web changes, `npm run cap:sync` copies `www/` to native projects. Keystore details tracked in memory files.

## Data Files

- `cards.js` — 78-card tarot deck (meanings, keywords, emoji)
- `art.js` — inline SVG illustrations for tarot cards
- `cities.js` — geolocation data for natal chart timezone lookup

## Styling

Dark theme (`#1a0a2e` background, `#d4a04a` gold accents) in `style.css`. Responsive grid layout. Card flip/twinkle/spin animations. Mobile-first with viewport-fit cover.
