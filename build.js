// Build: copy web assets into www/ and stamp script/style URLs with a
// version so browsers never serve stale cached files after a deploy.
const fs = require('fs');
const path = require('path');

const FILES = [
  'index.html', 'style.css', 'app.js', 'cards.js', 'art.js', 'tarot.js',
  'horoscope.js', 'natal.js', 'nature.js', 'numerology.js', 'iching.js',
  'runes.js', 'moon.js', 'biorhythm.js', 'lucky.js', 'chinese.js',
  'cities.js', 'ads.js'
];

fs.mkdirSync('www', { recursive: true });
for (const f of FILES) fs.copyFileSync(f, path.join('www', f));

fs.mkdirSync(path.join('www', 'fonts'), { recursive: true });
for (const f of fs.readdirSync('fonts')) {
  fs.copyFileSync(path.join('fonts', f), path.join('www', 'fonts', f));
}

const v = Date.now().toString(36);
let html = fs.readFileSync(path.join('www', 'index.html'), 'utf8');
html = html.replace(/src="([^"]+\.js)"/g, `src="$1?v=${v}"`);
html = html.replace(/href="style\.css"/g, `href="style.css?v=${v}"`);
fs.writeFileSync(path.join('www', 'index.html'), html);

console.log(`Built ${FILES.length} files into www/ (cache-bust v=${v})`);
