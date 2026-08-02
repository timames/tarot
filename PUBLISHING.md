# Publishing & Monetization Guide

Mystic Oracle ships **free, ad-supported, with an optional subscription** ("Mystic Oracle Plus").

## Access tiers (implemented in `app.js`, `tarot.js`, `horoscope.js`)

| Tier | What's in it | How it's unlocked |
| --- | --- | --- |
| **Free** (banner ad only) | Tarot **Single Card**, **Daily** horoscope | Always open |
| **Rewarded** (watch one video → unlocked for the day) | Tarot **Three Card**, **Five Card**, **Seven Day Horseshoe**; Numerology, I Ching, Runes, Moon Phase, Lucky Numbers, Chinese Zodiac, Spirit Board | AdMob **rewarded** ad, or Plus |
| **Plus** (subscription) | **Monthly & Yearly horoscopes**, **Natal Chart**, **Tree of Life** & **Grand Tableau** spreads — and **removes all ads** everywhere | Mystic Oracle Plus |

One rewarded video unlocks **all** ad-tier tarot spreads for the calendar day; each other rewarded oracle unlocks for the day on its own view. Plus subscribers never see an ad and get everything.

Key code:
- `app.js` — `FREE_MODULES` / `PLUS_MODULES` arrays and `tierOf()` set the model. Premium is read from `localStorage['mystic-premium']`, which **only `billing.js` writes**.
- `ads.js` — banner + interstitial + **rewarded** (`MysticApp.showRewardedAd`). All ads are suppressed when Plus is active.
- `billing.js` — RevenueCat subscription, entitlement `plus`, and the subscribe screen.

---

## Part A — Set up your accounts and paste real IDs

Nothing below can be done from code alone; these are account actions. Do them first, then rebuild.

### A1. AdMob — three ad units
1. At [admob.google.com](https://admob.google.com), create (or open) the app for `net.ripdi.games.tarot`.
2. Create **three** ad units: a **Banner**, an **Interstitial**, and a **Rewarded**.
3. In `ads.js`, replace `BANNER_ID`, `INTERSTITIAL_ID`, `REWARDED_ID` with your real unit IDs and set `TESTING: false`.
4. Replace the AdMob **app ID** (the `~` one) in two places:
   - `android/app/src/main/AndroidManifest.xml` → `com.google.android.gms.ads.APPLICATION_ID`
   - `ios/App/App/Info.plist` → `GADApplicationIdentifier`

The IDs currently in the repo are Google's official **test** IDs — safe for testers, never earn money, must not ship to production.

### A2. Google Play — subscription products
1. In **Play Console → Monetize → Products → Subscriptions**, create one subscription (e.g. **Mystic Oracle Plus**) with two base plans:
   - Monthly — suggested product/base-plan id `plus-monthly`
   - Yearly — suggested product/base-plan id `plus-yearly` (price it ~40–50% below 12× monthly; yearly is your best-value anchor)
2. Activate both base plans. Note the product IDs — RevenueCat needs them.
3. Create a **service account** with Play access and download its JSON (RevenueCat uses it to verify purchases). See RevenueCat's Play setup guide.

### A3. RevenueCat — wire billing
1. `npm i @revenuecat/purchases-capacitor` then `npm run cap:sync`.
2. At [app.revenuecat.com](https://app.revenuecat.com): create a project, add the Google Play app, upload the service-account JSON.
3. Create an **Entitlement** with identifier exactly **`plus`**.
4. Import the two Play products, attach both to the `plus` entitlement.
5. Create an **Offering** (identifier `default`) with a **Monthly** package and an **Annual** package pointing at those products.
6. In `billing.js`, paste your **public** API keys: `ANDROID_API_KEY` (starts `goog_…`) and `IOS_API_KEY` (starts `appl_…`).
7. Because this app has no bundler, `billing.js` reaches the plugin through the Capacitor bridge. After `cap sync`, run a **sandbox purchase on a device** (see D) to confirm the flow before release.

---

## Part B — Build the signed Android release

### B1. Bump the version
`android/app/build.gradle` is already at `versionCode 2` / `versionName "1.1"` for this monetization release. Increment `versionCode` (integer) for **every** subsequent upload.

### B2. Build the AAB
```bash
npm run cap:sync

cd android
set JAVA_HOME=C:\Users\Tames\.jdks\jdk-21.0.11+10
.\gradlew bundleRelease
```
Output: `android/app/build/outputs/bundle/release/app-release.aab` (signed via `keystore.properties`).

---

## Part C — Play Console listing & policy

### C1. Store listing
- **App name:** Mystic Oracle · **Category:** Lifestyle or Entertainment
- Short + full description (lead with: free daily tarot & horoscope; monthly/yearly forecasts and more with Plus).
- **Screenshots:** ≥2 phone shots. Good ones to include: the home grid, a tarot reading, the Daily/Monthly/Yearly horoscope tabs, and the **Plus** subscribe screen.
- **Feature graphic** 1024×500, **App icon** 512×512.

### C2. Data safety — this changed, update it
The app is no longer "collects no data." Because of AdMob and purchases, declare:
- **Device or other IDs** — collected (AdMob advertising ID), for **Advertising/marketing** and **Analytics**; may be shared.
- **App activity / app info & performance** — ad interaction & diagnostics via AdMob.
- **Purchase history** — processed by Google Play / RevenueCat to manage the subscription.
- Birth details you enter stay **on-device** (not "collected" in Play's sense).
The updated `privacy-policy.html` already reflects all of this — host it and use its URL.

### C2b. AI-written readings — declare these too
The app sends reading context (drawn card names, or calculated chart positions) to a
Cloudflare Worker for AI generation. No name, birth data, typed text, or identifier is
sent, and horoscopes are pre-generated so they send nothing at all. For Data Safety:
- There is **no additional personal data type** to declare — card names and derived
  astrological positions are not personal identifiers, and no user ID accompanies them.
- Answer **Yes** to the store-listing question about **generative AI features**, and keep
  the in-app "Freshly written readings" toggle (Settings → Readings) so users can opt out.
- Google's GenAI policy requires safeguards against harmful output. The worker's system
  prompt blocks medical, legal, financial, mortality and self-harm content; keep those
  guardrails in `worker/src/index.js` if you change the prompt.
- Keep the "entertainment and reflection only" disclaimer visible.

See `AI-SETUP.md` for deploying the worker.

### C3. Other forms
- **Content rating** questionnaire (occult/entertainment themes — typically Teen; answer honestly).
- **Target audience:** not directed at children (you show ads and sell subscriptions).
- **Ads:** answer **Yes, contains ads** in the store listing.

### C4. Upload & roll out
Production → Create new release → upload the AAB → release notes → review & roll out. First review can take a few days.

---

## Part D — Test before you ship

1. **Test ads:** keep `TESTING: true` (or add your device as an AdMob test device) until live, so you never click your own real ads.
2. **License testers:** Play Console → Setup → License testing — add your Google account so you can buy the subscription without being charged.
3. **Sandbox purchase:** install an internal-testing build, open **Plus**, buy Monthly and Yearly, confirm ads disappear and every oracle unlocks; test **Restore purchase**.
4. Confirm the rewarded flow: on an ad-tier oracle/spread, "Watch & Unlock" plays a test rewarded ad and unlocks for the day.

---

## Apple App Store (when you're ready for iOS)

The web layer is identical; only the native setup differs.
1. `npm run cap:ios`, set your Team + bundle id `net.ripdi.games.tarot` in Xcode Signing.
2. **RevenueCat for iOS:** create the same subscription products in **App Store Connect**, import them into RevenueCat, attach to the `plus` entitlement, and use your `appl_…` public key (already referenced in `billing.js`).
3. **AdMob for iOS:** replace `GADApplicationIdentifier` in `Info.plist`; add an **App Tracking Transparency** prompt (`NSUserTrackingUsageDescription` + request) since AdMob personalized ads require it.
4. Set version/build, **Product → Archive → Distribute → App Store Connect**, then submit for review (typically 1–2 days).

---

## Requirements for both stores
- **Privacy policy URL** — `privacy-policy.html` is updated for ads + subscriptions; host it publicly.
- **Screenshots** per each store's sizes (easiest from emulator/simulator).
- **App icons** — 512×512 (Play), 1024×1024 (App Store).
- Comply with Google's ad policies and, on iOS, Apple's ATT framework.
