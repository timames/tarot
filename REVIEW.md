# Mystic Oracle — App Review & Improvement Options

Full read-through of all 10 modules, August 2026. Findings marked **[measured]**
were verified by running the actual code, not estimated.

---

## Part 1 — Complete inventory

**10 oracles · 18 distinct playable experiences**

### 1. Tarot — 6 subgames
| Subgame | What it is | Tier |
| --- | --- | --- |
| Single Card | One card, quick daily guidance | Free |
| Three Card | Past / Present / Future | Rewarded ad |
| Five Card | Cross spread, deeper insight | Rewarded ad |
| Seven Day Horseshoe | 7 positions, one card revealed per day for 7 days | Rewarded ad |
| Tree of Life | 22 days — 11 Sephiroth + 11 Paths | **Plus** |
| Grand Tableau | 78 days — 6 domains × 13 houses, the whole deck | **Plus** |

Assets: 78-card deck with upright + reversed meanings, inline SVG art per card,
flip/reveal animations. Multi-day spreads persist in localStorage and **reset if
you miss a day**.

### 2. Horoscope — 3 subgames × 12 signs
| Subgame | Sections | Tier |
| --- | --- | --- |
| Daily | General, Love, Career, Wellness + lucky number/colour/mood/★ rating | Free |
| Monthly | Theme, overview, love, career, wellness, 2 power days | **Plus** |
| Yearly | Theme, overview, love, career, growth, strongest month | **Plus** |

### 3. Natal Chart — 1 deep feature · **Plus**
Real ephemeris (the hand-written `AstroEngine`): planetary longitudes, Ascendant
& Midheaven (needs lat/long or city lookup), SVG chart wheel rotated to the
Ascendant, elemental balance bars, up to 10 major aspects with orbs.

### 4. Numerology — 1 feature, 6 numbers · Rewarded ad
Life Path, Expression, Soul Urge, Personality, Birthday, Personal Year.
Pythagorean system, master numbers 11/22/33 preserved.

### 5. I Ching — 1 feature · Rewarded ad
Three-coin method, all 64 hexagrams with Chinese characters, changing lines
produce a second "becoming" hexagram.

### 6. Runes — 2 subgames · Rewarded ad
Single Rune, Three Runes (Past/Present/Future). Full Elder Futhark (24), with
correct handling of symmetric runes that cannot appear reversed.

### 7. Moon Phase — 1 feature · Rewarded ad
Live lunar phase from real astronomy, % illumination, custom SVG moon, next new
and full moon dates. Passive — nothing to interact with.

### 8. Lucky Numbers — 1 feature · Rewarded ad
Choose 1–12 numbers and a ceiling of 2–999, drawn with sky-seeded randomness.

### 9. Chinese Zodiac — 1 feature · Rewarded ad
Animal + element from the sexagenary cycle, with Lunar New Year found
**astronomically** (so January/February births land correctly). Allies, secret
friend, opposite, and a note on the current year.

### 10. Spirit Board — 1 feature · Rewarded ad
Type a question; the planchette glides letter by letter. Answers are inferred
from the question's *shape* (yes-no / when / who / where / why / how / what) and
*subject* (love, money, health, family), with sensitive topics deliberately
deflected. Same question returns the same answer until tomorrow.

### Shared engine
- `natureRng()` — randomness seeded by real sun/moon positions + timing + crypto
- `seededRng()` — deterministic daily readings that don't reroll on refresh
- `AstroEngine` — solar/lunar/planetary positions, shared by natal, moon, chinese
- Shared birth profile in localStorage; `skyStamp()` signs each reading with the
  lunar/solar moment

---

## Part 2 — What's genuinely strong

**The astronomy is real, and that is rare.** Most competing apps fake the moon
phase and hardcode Lunar New Year. This app computes them. The Chinese Zodiac
correctly handles the winter-birth edge case that almost every free app gets
wrong. That's a defensible differentiator worth saying out loud in the store
listing.

**The multi-day spreads are an unusually good retention mechanic.** A 78-day
Grand Tableau that reveals one card a day is a stronger habit loop than anything
most oracle apps ship.

**Craft is consistent** — hand-built SVG icon set, one coherent dark/gold theme,
no framework bloat, fast load.

**Tone is well-judged.** The Spirit Board refusing questions about death, and the
"entertainment and reflection only" footer, are the right instincts and will help
with content rating.

---

## Part 3 — Problems found

### 🔴 P1 — Daily horoscopes visibly collide between signs **[measured]**

The daily pools are small (10 general / 8 love / 8 career / 7 wellness lines).
Running the real code across 365 days:

- **Only 7.2 of 12 signs get a distinct headline reading on an average day.**
- Worst day measured (2026‑08‑14): **4 distinct readings across 12 signs** — Cancer,
  Libra, Scorpio and Sagittarius all got *the identical* horoscope.
- A single sign **repeats its own headline after 2.2 days on average** (sometimes
  the very next day).

Anyone who checks their partner's sign next to their own sees the trick
immediately. This is the single most likely cause of 1-star "it's fake / it
repeats" reviews. (The four sections combined are still 12/12 distinct today, so
it's the *headline* — the part people actually read — that collides.)

Monthly holds up much better (11.1 of 12 distinct); yearly dipped to 8 of 12 in
one sampled year.

### 🔴 P2 — Multi-day spreads break silently, with no reminder

Miss one day and a 78-day Grand Tableau resets to zero. There are **no
notifications** in the app at all. Users will lose long streaks without warning
and blame the app. Right now the best retention feature is also the biggest
rage-quit risk.

### 🔴 P3 — No settings screen

There is nowhere to manage the subscription, restore a purchase outside a
paywall, read the privacy policy, or control notifications. Play expects a
subscription-management path inside the app, and "Restore purchase" buried on a
paywall is a common review-rejection and support-ticket source.

### 🟠 P4 — Nothing is ever saved

Every reading disappears the moment you leave. No history, no journal, no
favourites. This is the most-requested feature in the category and the most
natural Plus upsell in the whole app — and it's absent.

### 🟠 P5 — The horoscope forgets your sign

The most-used daily feature makes you pick your sign from a 12-tile grid *every
single time*, even though the app already stores a birth date for numerology and
natal. That is daily friction on the exact screen you want to become a habit.

### 🟠 P6 — Five modules never trigger the interstitial **[measured]**

`adReadingDone()` is called by tarot, I Ching, runes, lucky and ouija — but **not**
by horoscope, numerology, chinese, moon or natal. Numerology and Chinese Zodiac
produce full readings that never count toward ad revenue. (Horoscope-free and
natal-Plus arguably shouldn't; numerology and chinese should.)

### 🟡 P7 — Thin modules

- **Lucky Numbers** is a shuffle with no lottery presets (Powerball, Mega Millions,
  EuroMillions all have specific formats), no saved tickets, no history.
- **Moon Phase** is read-only — no moon sign, no void-of-course, no upcoming-phase
  calendar, no ritual guidance.
- **I Ching** shows only the hexagram judgment. Traditional I Ching gives each
  *changing line* its own text — that's the depth serious users look for.
- **Numerology** omits pinnacles, challenges, personal month/day.

### 🟡 P8 — No sharing, no compatibility

Two of the most viral features in this category are missing entirely: a shareable
reading card (free user acquisition) and a compatibility/synastry match
(the single highest-engagement feature in astrology apps).

### 🟡 P9 — Code hygiene

- `hoursToMidnight()` and `icons.lock` in `app.js` are now dead code **[measured]**.
- Stray empty `-p` directory in the repo root (from a mistyped `mkdir -p`).
- No global error handling — one thrown error in a module leaves a blank screen
  with no recovery.
- 19 unminified scripts loaded serially.
- ✅ Keystore hygiene is **correct** — `*.keystore`, `keystore.properties` and
  `KEYSTORE-INFO.txt` are all properly gitignored and untracked.

---

## Part 4 — Improvement options

Rated by impact on revenue/retention vs. build effort.

### Tier 1 — Do before launch

| # | Option | Why | Effort |
| --- | --- | --- | --- |
| 1 | **Rewrite the horoscope content engine** — expand pools 4–5×, and select with a collision-free algorithm so no two signs share a headline on the same day and no sign repeats within ~30 days | Fixes P1, the top 1-star risk | M |
| 2 | **Daily + streak notifications** (`@capacitor/local-notifications`) — "your card is ready", and "your Grand Tableau needs today's card" | Fixes P2; the single biggest retention lever | M |
| 3 | **Settings screen** — manage/restore subscription, notification toggles, privacy policy, terms, reset data | Fixes P3; store-compliance risk | S |
| 4 | **Remember the user's sign** + a light first-run onboarding (name, birth date, sign) | Fixes P5; makes the daily loop one tap | S |
| 5 | **Fire `adReadingDone()` in numerology + chinese** | Fixes P6; free revenue already earned | XS |

### Tier 2 — Retention & revenue

| # | Option | Why | Effort |
| --- | --- | --- | --- |
| 6 | **Reading Journal / history** — auto-save every reading; free keeps last 3, Plus unlimited + personal notes | Fixes P4; strongest natural Plus upsell | M |
| 7 | **Share cards** — render any reading to an image and open the share sheet | Free user acquisition | M |
| 8 | **Streaks & milestones** — daily-visit streak, badges for completing multi-day spreads | Compounds with notifications | S |
| 9 | **7-day free trial on the yearly plan** (RevenueCat/Play support it natively) | Typically the largest single conversion lever | S |
| 10 | **Daily Card home widget** — today's card on the home screen before you tap in | Habit formation | M |

### Tier 3 — New games (growth)

| # | Option | Why | Effort |
| --- | --- | --- | --- |
| 11 | **Compatibility / Love Match** — sign×sign, or full chart synastry for Plus | Highest-engagement feature in the category; inherently shareable | M–L |
| 12 | **Transits — "what today means for *your* chart"** (Plus) | Reuses AstroEngine; gives Plus a *daily* reason to open, which it currently lacks | M |
| 13 | **Yes/No Oracle** — one tap, instant answer | Cheapest possible new game; great rewarded-ad surface | XS |
| 14 | **Angel Numbers** (111, 222, 1111…) | Huge search volume, pure content, no math | S |
| 15 | **Dream Dictionary** — searchable symbol meanings | Very high retention in this category | M |
| 16 | **Lenormand (36 cards)** or **playing-card cartomancy** | Reuses the entire tarot engine with new data | S–M |
| 17 | **Biorhythms**, **Aura Colours**, **Past Life**, **Crystal Oracle** | Cheap tile-filler games, each ~a day of work | S each |

### Tier 4 — Deepen what exists

| # | Option | Effort |
| --- | --- | --- |
| 18 | Lucky Numbers: real lottery presets (Powerball, Mega Millions, EuroMillions), saved tickets, draw history | S |
| 19 | Moon Phase: moon sign, void-of-course, 30-day phase calendar, ritual suggestions | M |
| 20 | I Ching: per-changing-line texts (the traditional depth) | M |
| 21 | Numerology: pinnacles, challenges, personal month/day, name compatibility | M |
| 22 | Natal: 12 houses, chart shape, planetary dignities | L |
| 23 | Runes: 5-rune cross spread + rune of the day | S |

### Tier 5 — Polish & technical

| # | Option | Effort |
| --- | --- | --- |
| 24 | Global error boundary so a module crash shows a friendly retry, not a blank screen | S |
| 25 | Delete dead code (`hoursToMidnight`, `icons.lock`) and the stray `-p` directory | XS |
| 26 | Verify the new Ad/Plus badges don't overlap the spread-picker icons on a real device | XS |
| 27 | Minify + concatenate for faster cold start | S |
| 28 | Accessibility pass — aria-labels, focus states, contrast check | S |
| 29 | Localisation scaffolding (Spanish/Portuguese are large astrology markets) | L |

---

## Recommended sequence

**Before you publish:** options 1–5. They're a few days of work and they address
the two things most likely to sink the launch (repeating content, broken streaks
with no reminder) plus the store-compliance gap.

**First post-launch update:** 6, 9, 11 — journal, free trial, compatibility. That
trio is where the revenue actually compounds.

**Then:** cheap new tiles (13, 14, 16) to grow the grid, and 12 (transits) so Plus
has a daily hook instead of only being a one-time unlock.
