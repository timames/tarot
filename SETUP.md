# Mystic Oracle — AdMob & RevenueCat Setup Checklist

A click-through guide for wiring live ads and subscriptions into this app
(`net.ripdi.mystic_oracle`). Both services are free to create with your Google
account. **Do RevenueCat Step 2 first** — Google can take up to ~36 hours to
activate the credentials, so start that clock, then do AdMob while you wait.

File references below are relative to the repo root (`C:\PERS\tarot`).

---

## Part 1 — AdMob (≈30 min)

- [ ] **1. Create the account.** Sign in at [admob.google.com](https://admob.google.com) and complete the one-time signup (address + payment profile so Google can pay you).

- [ ] **2. Add the app.** Apps → **Add app** → **Android**. When asked "Is your app listed on Google Play?", if it isn't published yet choose **No** and add it manually as **Mystic Oracle** (link the store listing later). This produces an **App ID** like `ca-app-pub-1234…~5678…` — note the **`~`**.

- [ ] **3. Create three ad units.** In the app → **Ad units** → **Add ad unit**, make one of each:
  - [ ] **Banner**
  - [ ] **Interstitial**
  - [ ] **Rewarded** (name a reward, e.g. "unlock" / amount 1)

  Each gives an ad-unit ID like `ca-app-pub-1234…/9999…` — note the **`/`**.

- [ ] **4. Paste the `/` unit IDs into `ads.js`** and flip the flag:
  ```js
  BANNER_ID:       'ca-app-pub-…/…',   // your banner
  INTERSTITIAL_ID: 'ca-app-pub-…/…',   // your interstitial
  REWARDED_ID:     'ca-app-pub-…/…',   // your rewarded
  TESTING: false
  ```

- [ ] **5. Paste the `~` App ID** in two places:
  - [ ] `android/app/src/main/AndroidManifest.xml` → `com.google.android.gms.ads.APPLICATION_ID`
  - [ ] `ios/App/App/Info.plist` → `GADApplicationIdentifier` (iOS only, later)

- [ ] **6. app-ads.txt.** Publish the line AdMob shows you at `https://ripdi.net/app-ads.txt` (looks like `google.com, pub-1234…, DIRECT, f08c47fec0942fa0`) and list that domain as your developer website. This is how AdMob verifies the ads are yours.

- [ ] **7. Don't tap your own live ads.** Keep `TESTING: true` (or register your phone as a test device in AdMob) until the app is actually on the store — self-clicks can get your account flagged.

---

## Part 2 — RevenueCat (≈1 hr of work + up to 36 hr waiting)

### Step 1 — Create the subscription in Play Console (must exist first)

- [ ] Play Console → your app → **Monetize → Products → Subscriptions → Create subscription**.
- [ ] Name it **Mystic Oracle Plus**.
- [ ] Add a **monthly** base plan (auto-renewing, 1 month) and a **yearly** base plan (1 year); set prices.
- [ ] **Activate** both base plans. Note the product ID + base-plan IDs.

### Step 2 — Connect Google Play to RevenueCat (start this early — 36 hr clock)

- [ ] In **Google Cloud Console**, enable the **Google Play Android Developer API** and the **Google Play Developer Reporting API**.
- [ ] **IAM & Admin → Service Accounts** → create a service account; grant roles **Pub/Sub Editor** and **Monitoring Viewer**.
- [ ] Under the service account's **Keys**, create + download a **JSON** key.
- [ ] **Play Console → Users & permissions** → invite the service-account email; grant: *view app information / download bulk reports*, *view financial data & orders*, and *manage orders and subscriptions*.
- [ ] **RevenueCat → your project → the Play app → upload the JSON.** Then wait — activation can take up to ~36 hours (validation errors before then are normal).

### Step 3 — Configure products in RevenueCat

- [ ] Create a project; add the **Google Play app** with package **`net.ripdi.mystic_oracle`**.
- [ ] **Entitlements → new** → identifier exactly **`plus`** (the code checks this string).
- [ ] **Products** → add your two Play products (monthly, yearly).
- [ ] Attach **both** products to the **`plus`** entitlement.
- [ ] **Offerings** → create one with identifier **`default`**, and add two packages: **Monthly** (→ monthly product) and **Annual** (→ yearly product).

### Step 4 — Paste your key + install the plugin

- [ ] RevenueCat → **Project settings → API keys** → copy the **public Google/Android SDK key** (starts `goog_`). Paste it into `billing.js` → `ANDROID_API_KEY`. (The `appl_` iOS key comes later.)
- [ ] In the repo, install the native plugins and sync:
  ```bash
  npm i @revenuecat/purchases-capacitor @capacitor/local-notifications
  npm run cap:sync
  ```
  (`local-notifications` powers the daily reminder and multi-day streak protection.
  The Android permissions it needs are already in `AndroidManifest.xml`.)

### Step 5 — Test before shipping

- [ ] Play Console → **Setup → License testing** → add your Google account as a license tester.
- [ ] Install an **internal-testing** build, open **Plus**, and buy **both** plans in sandbox.
- [ ] Confirm: ads disappear, every oracle unlocks, the monthly/yearly horoscopes open, and **Restore purchase** works.

---

## The identifiers that must match exactly

These strings tie the code to your dashboards. A subscribe screen showing no
prices is almost always one of these not matching (or the 36-hour delay):

| Thing | Value | Where it's set |
| --- | --- | --- |
| Android package | `net.ripdi.mystic_oracle` | Play Console + RevenueCat app |
| Entitlement | `plus` | RevenueCat → `billing.js` (`ENTITLEMENT_ID`) |
| Offering | `default` | RevenueCat → read by `billing.js` |
| Packages | **Monthly** + **Annual** | RevenueCat offering → read by `billing.js` |
| RevenueCat key | `goog_…` | `billing.js` → `ANDROID_API_KEY` |
| AdMob app ID (`~`) | your `ca-app-pub-…~…` | AndroidManifest.xml / Info.plist |
| AdMob unit IDs (`/`) | banner / interstitial / rewarded | `ads.js` |

See `PUBLISHING.md` for the full build-and-release steps once these are done.
