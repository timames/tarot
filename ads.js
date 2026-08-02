// AdMob integration. Runs only on native platforms; in a browser it does nothing.
//
// ── TO GO LIVE ──────────────────────────────────────────────────────────────
// 1. Create the app + THREE ad units at https://admob.google.com
//      • Banner        • Interstitial        • Rewarded
// 2. Replace the four IDs below with your real ones and set TESTING = false
// 3. Replace the APPLICATION_ID in android/app/src/main/AndroidManifest.xml
//    and GADApplicationIdentifier in ios/App/App/Info.plist with your real
//    AdMob *app* ID (the one with the ~ tilde)
// The IDs below are Google's official test IDs — safe to ship to testers,
// never earn money, and must not ship to production.
// ────────────────────────────────────────────────────────────────────────────

(function () {
  const ADS = {
    TESTING: true,
    BANNER_ID: 'ca-app-pub-7770045632731047/6768627864',        // real banner
    INTERSTITIAL_ID: 'ca-app-pub-7770045632731047/1763713193',  // real interstitial
    REWARDED_ID: 'ca-app-pub-7770045632731047/8302181325',      // real rewarded
    READINGS_PER_INTERSTITIAL: 3
  };

  let AdMob = null;
  let bannerShown = false;
  let readingCount = 0;

  function isPlus() {
    try { return MysticApp.isPremium(); } catch (e) { return false; }
  }

  async function init() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform()) return;
    try {
      // No bundler here, so use the plugin's native bridge directly.
      AdMob = window.Capacitor.registerPlugin('AdMob');
      await AdMob.initialize({ initializeForTesting: ADS.TESTING });
      if (!isPlus()) showBanner();
    } catch (e) {
      console.log('AdMob unavailable:', e);
      AdMob = null;
    }
  }

  async function showBanner() {
    if (!AdMob || bannerShown || isPlus()) return;
    try {
      await AdMob.showBanner({
        adId: ADS.BANNER_ID,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
        isTesting: ADS.TESTING
      });
      bannerShown = true;
      document.body.style.paddingBottom = '70px'; // keep content clear of the banner
    } catch (e) {
      console.log('Banner unavailable:', e);
    }
  }

  // Remove every ad surface. Called by app.js when Plus becomes active.
  MysticApp.hideAds = async function () {
    if (!AdMob) return;
    try { await AdMob.removeBanner(); } catch (e) {}
    bannerShown = false;
    document.body.style.paddingBottom = '';
  };

  // Interstitial every Nth reading on the free oracles. Skipped for Plus.
  MysticApp.adReadingDone = async function () {
    if (isPlus() || !AdMob) return;
    readingCount++;
    if (readingCount % ADS.READINGS_PER_INTERSTITIAL !== 0) return;
    try {
      await AdMob.prepareInterstitial({ adId: ADS.INTERSTITIAL_ID, isTesting: ADS.TESTING });
      await AdMob.showInterstitial();
    } catch (e) {
      console.log('Interstitial unavailable:', e);
    }
  };

  // Rewarded ad. Resolves the reward → onReward(); any failure → onFail().
  // Plus users never see an ad — they unlock directly.
  let rewardListenerAdded = false;
  let lastRewarded = false;

  MysticApp.showRewardedAd = async function (onReward, onFail) {
    if (isPlus()) { if (onReward) onReward(); return; }
    if (!AdMob) { if (onFail) onFail(); return; }

    lastRewarded = false;
    try {
      if (!rewardListenerAdded) {
        // The reward event is the authoritative "user earned it" signal.
        AdMob.addListener('onRewardedVideoAdReward', () => { lastRewarded = true; });
        rewardListenerAdded = true;
      }
      await AdMob.prepareRewardVideoAd({ adId: ADS.REWARDED_ID, isTesting: ADS.TESTING });
      const item = await AdMob.showRewardVideoAd(); // resolves with the reward item
      if (item || lastRewarded) { if (onReward) onReward(); }
      else { if (onFail) onFail(); }
    } catch (e) {
      console.log('Rewarded unavailable:', e);
      if (lastRewarded) { if (onReward) onReward(); }
      else if (onFail) onFail();
    }
  };

  init();
})();
