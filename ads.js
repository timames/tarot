// AdMob integration. Runs only on native platforms; in a browser it does nothing.
//
// ── TO GO LIVE ──────────────────────────────────────────────────────────────
// 1. Create the app + ad units at https://admob.google.com
// 2. Replace the three IDs below with your real ones and set TESTING = false
// 3. Replace the APPLICATION_ID in android/app/src/main/AndroidManifest.xml
//    and GADApplicationIdentifier in ios/App/App/Info.plist with your real
//    AdMob *app* ID (the one with the ~ tilde)
// The IDs below are Google's official test IDs — safe to ship to testers,
// never earn money, and must not ship to production.
// ────────────────────────────────────────────────────────────────────────────

(function () {
  const ADS = {
    TESTING: true,
    BANNER_ID: 'ca-app-pub-3940256099942544/6300978111',       // test banner
    INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712', // test interstitial
    READINGS_PER_INTERSTITIAL: 3
  };

  let AdMob = null;
  let readingCount = 0;

  async function init() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
    try {
      // No bundler here, so use the plugin's native bridge directly.
      AdMob = window.Capacitor.registerPlugin('AdMob');
      await AdMob.initialize({ initializeForTesting: ADS.TESTING });
      await AdMob.showBanner({
        adId: ADS.BANNER_ID,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: ADS.TESTING
      });
      // Keep content clear of the banner overlay
      document.body.style.paddingBottom = '70px';
    } catch (e) {
      console.log('AdMob unavailable:', e);
      AdMob = null;
    }
  }

  // Called by modules after a completed reading/casting.
  // Shows an interstitial every Nth reading.
  MysticApp.adReadingDone = async function () {
    readingCount++;
    if (!AdMob || readingCount % ADS.READINGS_PER_INTERSTITIAL !== 0) return;
    try {
      await AdMob.prepareInterstitial({ adId: ADS.INTERSTITIAL_ID, isTesting: ADS.TESTING });
      await AdMob.showInterstitial();
    } catch (e) {
      console.log('Interstitial unavailable:', e);
    }
  };

  init();
})();
