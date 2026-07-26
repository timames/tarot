// Natural randomness — seeds every casting from nature itself:
// the true positions of the Moon, Sun, and planets in the sky at the exact
// moment of the cast, mixed with the microsecond timing of the user's touch
// (human timing is a genuine entropy source) and hardware entropy when available.

(function () {
  const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  function skyNow() {
    const now = new Date();
    const d = AstroEngine.dayNumber(
      now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
      now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600 + now.getUTCMilliseconds() / 3.6e6
    );
    const sun = AstroEngine.sunPosition(d);
    const moon = AstroEngine.moonPosition(d);
    return { d, sun, moon };
  }

  // A human-readable stamp of the sky the cast was made under.
  function skyStamp() {
    const { sun, moon } = skyNow();
    const elong = AstroEngine.rev(moon.lon - sun.lon);
    const phase = elong < 22.5 ? "new" : elong < 90 ? "waxing crescent" : elong < 112.5 ? "first-quarter"
      : elong < 180 ? "waxing gibbous" : elong < 202.5 ? "full" : elong < 270 ? "waning gibbous"
      : elong < 292.5 ? "last-quarter" : "waning crescent";
    const sign = SIGN_NAMES[Math.floor(AstroEngine.rev(moon.lon) / 30)];
    const deg = Math.floor(AstroEngine.rev(moon.lon) % 30);
    return `Cast under a ${phase} Moon at ${deg}° ${sign}`;
  }

  function natureRng() {
    const { d, sun, moon } = skyNow();
    // The sky: exact lunar/solar longitudes at this instant carry
    // ever-shifting fractional digits.
    let seedStr = [moon.lon, moon.lat, sun.lon, sun.r, d].map(v => v.toFixed(8)).join('|');
    // The moment: microsecond timing of this very call.
    seedStr += '|' + performance.now().toFixed(6) + '|' + Date.now();
    // Hardware entropy, when the WebView provides it.
    if (window.crypto && crypto.getRandomValues) {
      const buf = new Uint32Array(2);
      crypto.getRandomValues(buf);
      seedStr += '|' + buf[0] + '|' + buf[1];
    }
    return MysticApp.seededRng(seedStr);
  }

  MysticApp.natureRng = natureRng;
  MysticApp.skyStamp = skyStamp;
})();
