// Horoscope module — zodiac profiles plus Daily, Monthly, and Yearly readings.
// Daily is free for everyone. Monthly and Yearly are Mystic Oracle Plus features.
//
// SELECTION MODEL (important — do not replace with a plain random pick):
// Readings are chosen by `cyclePick()`, a Latin-square selector that guarantees
//   (a) all 12 signs receive a DIFFERENT line on the same day, and
//   (b) a given sign sees every line in a pool before any line repeats.
// A naive random pick produced only ~7 distinct headlines across the 12 signs
// on an average day (and as few as 4), which reads as obviously fake.

const ZODIAC_SIGNS = [
  { name: "Aries", glyph: "♈︎", dates: "Mar 21 – Apr 19", element: "Fire", quality: "Cardinal", ruler: "Mars", traits: "Bold, ambitious, direct, passionate", compat: "Leo, Sagittarius, Gemini" },
  { name: "Taurus", glyph: "♉︎", dates: "Apr 20 – May 20", element: "Earth", quality: "Fixed", ruler: "Venus", traits: "Steadfast, sensual, patient, devoted", compat: "Virgo, Capricorn, Cancer" },
  { name: "Gemini", glyph: "♊︎", dates: "May 21 – Jun 20", element: "Air", quality: "Mutable", ruler: "Mercury", traits: "Curious, adaptable, witty, expressive", compat: "Libra, Aquarius, Aries" },
  { name: "Cancer", glyph: "♋︎", dates: "Jun 21 – Jul 22", element: "Water", quality: "Cardinal", ruler: "Moon", traits: "Nurturing, intuitive, protective, tenacious", compat: "Scorpio, Pisces, Taurus" },
  { name: "Leo", glyph: "♌︎", dates: "Jul 23 – Aug 22", element: "Fire", quality: "Fixed", ruler: "Sun", traits: "Radiant, generous, dramatic, loyal", compat: "Aries, Sagittarius, Libra" },
  { name: "Virgo", glyph: "♍︎", dates: "Aug 23 – Sep 22", element: "Earth", quality: "Mutable", ruler: "Mercury", traits: "Precise, analytical, helpful, modest", compat: "Taurus, Capricorn, Cancer" },
  { name: "Libra", glyph: "♎︎", dates: "Sep 23 – Oct 22", element: "Air", quality: "Cardinal", ruler: "Venus", traits: "Harmonious, diplomatic, charming, fair", compat: "Gemini, Aquarius, Leo" },
  { name: "Scorpio", glyph: "♏︎", dates: "Oct 23 – Nov 21", element: "Water", quality: "Fixed", ruler: "Pluto & Mars", traits: "Intense, magnetic, perceptive, resolute", compat: "Cancer, Pisces, Virgo" },
  { name: "Sagittarius", glyph: "♐︎", dates: "Nov 22 – Dec 21", element: "Fire", quality: "Mutable", ruler: "Jupiter", traits: "Adventurous, optimistic, candid, free", compat: "Aries, Leo, Aquarius" },
  { name: "Capricorn", glyph: "♑︎", dates: "Dec 22 – Jan 19", element: "Earth", quality: "Cardinal", ruler: "Saturn", traits: "Disciplined, ambitious, wise, enduring", compat: "Taurus, Virgo, Scorpio" },
  { name: "Aquarius", glyph: "♒︎", dates: "Jan 20 – Feb 18", element: "Air", quality: "Fixed", ruler: "Uranus & Saturn", traits: "Visionary, independent, humanitarian, original", compat: "Gemini, Libra, Sagittarius" },
  { name: "Pisces", glyph: "♓︎", dates: "Feb 19 – Mar 20", element: "Water", quality: "Mutable", ruler: "Neptune & Jupiter", traits: "Dreamy, empathic, artistic, gentle", compat: "Cancer, Scorpio, Capricorn" }
];

(function () {
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  // ── Daily pools ──────────────────────────────────────────────────────────
  const D_GENERAL = [
    "The cosmos aligns to open an unexpected door — walk through it with confidence.",
    "A conversation today carries more weight than it first appears. Listen between the lines.",
    "Your instincts are sharper than usual. Trust the first quiet answer that rises within you.",
    "Something you released long ago circles back in a new form. This time, you are ready.",
    "Small, steady steps today build the foundation for a leap you'll make next month.",
    "An old pattern loosens its grip. Notice the freedom in choosing differently.",
    "The energy of the day favors beginnings. Plant a seed before sunset.",
    "What feels like a delay is actually protection. Let the timing be what it is.",
    "Someone sees your effort even when you think no one is watching.",
    "A moment of solitude today will reveal more than a week of searching.",
    "You are closer than you think. The last stretch always feels the longest.",
    "Say the thing you have been rehearsing. The words will find their own shape.",
    "A door you assumed was locked has been open for some time. Try the handle.",
    "Today rewards the honest question over the clever answer.",
    "The right people are already around you. Look again at who keeps showing up.",
    "Resist the urge to fix everything at once. Choose one thing and finish it.",
    "An unexpected kindness arrives from an unlikely direction. Accept it plainly.",
    "What you are avoiding is smaller than the dread you have built around it.",
    "Momentum is quietly on your side. Do not stop to measure it.",
    "A choice made from calm today will still look wise years from now.",
    "Let someone help you. Refusing assistance is not the same as strength.",
    "The story you keep telling about yourself is due for an edit.",
    "Something ordinary today carries an unusual signal. Stay awake to it.",
    "You have already learned the lesson. You are only waiting for permission to move.",
    "Be generous with your attention today; it is the rarest thing you own.",
    "A small risk taken now saves a large regret later.",
    "The noise around you is not the truth. Find the quiet channel underneath.",
    "You do not need the whole map. The next step is enough.",
    "Someone's sharp words today are about their own weather, not yours.",
    "A promise you made to yourself is asking to be kept.",
    "Slow down at the exact moment you feel like rushing — that is where the error hides.",
    "What looks like luck today was built by a decision you made months ago.",
    "Say no once, cleanly, and watch how much room appears.",
    "An old friendship is one message away from waking up.",
    "You are being invited to grow, and it is disguised as an inconvenience.",
    "Finish the sentence you keep trailing off from. There is power in the ending.",
    "Today favors repair over replacement. Mend rather than discard.",
    "Something you dismissed as coincidence deserves a second look.",
    "Give yourself the advice you would offer a friend in the same position.",
    "There is more time than the panic suggests. Breathe, then re-check the facts.",
    "A door closes gently today. Let it — the draught was never good for you.",
    "You are more prepared than the doubt in your chest is claiming.",
    "Ask for the thing directly. Hinting has cost you enough already.",
    "The work you do unseen today becomes the reason things go well later.",
    "Curiosity will carry you further than confidence today. Lead with questions.",
    "Something is trying to simplify itself in your life. Stop complicating it.",
    "A single honest hour beats a whole day of half-attention.",
    "Trust the version of you that made the plan — it knew things today's tired mind forgot."
  ];

  const D_LOVE = [
    "Affection deepens through honesty — say the true thing gently.",
    "A shared laugh dissolves a lingering tension. Let lightness lead.",
    "If single, an unexpected encounter carries a familiar spark. Stay open.",
    "Express appreciation out loud; unspoken warmth cannot be felt.",
    "The heart asks for patience today. Let connection unfold at its own pace.",
    "Vulnerability is your strength now — the right person will meet you there.",
    "Revisit what first drew you together; the ember still glows beneath the routine.",
    "Someone close needs your listening more than your advice.",
    "Ask the question you have been circling. The answer is kinder than you fear.",
    "Small attention beats grand gesture today — bring them the little thing.",
    "Do not confuse intensity with intimacy. The quiet ones are building something.",
    "A misunderstanding untangles the moment one of you goes first. Go first.",
    "Let yourself be admired without deflecting it.",
    "Distance today is not rejection; someone is simply tired. Give room.",
    "Say what you want from this. Clarity is the most romantic thing available.",
    "An old attraction resurfaces. Notice whether it is love or only familiarity.",
    "Your standards are not too high. Your patience has just been too short.",
    "Reach out to someone you have been meaning to call — the timing is unusually good.",
    "Choose curiosity over assumption when they behave unexpectedly.",
    "The relationship improves the moment you stop keeping score.",
    "Being fully present for ten minutes outweighs a whole distracted evening.",
    "Let them surprise you. You have been writing their lines for them long enough.",
    "Forgiveness today is less about them and more about your own lightness.",
    "If it feels like effort every single day, that itself is information.",
    "Flirtation finds you while you are doing something you genuinely enjoy.",
    "Speak your affection in their language rather than your own.",
    "A bond steadies when you each keep one thing that is entirely yours.",
    "The apology you are rehearsing will land better shortened.",
    "Notice who makes you feel calm, not only who makes you feel electric.",
    "Loneliness today is a signal to reach out, not proof of anything about you.",
    "You are allowed to want more without being ungrateful for what you have.",
    "Someone is waiting on a sign from you that would cost you almost nothing.",
    "Old wounds surface near new love. Tend them; do not hand them over.",
    "Plan something together — the anticipation is half the pleasure.",
    "Honesty delivered warmly has never been a risk to real affection.",
    "Let this one be easy. Not everything worthwhile has to be hard."
  ];

  const D_CAREER = [
    "A detail others overlook becomes your advantage. Stay thorough.",
    "Collaboration multiplies your efforts today — share the vision, share the credit.",
    "Hold your boundary on what matters; flexibility everywhere else wins allies.",
    "The bold idea you have been sitting on is riper than you think. Voice it.",
    "Finish the lingering task first; momentum will carry the rest of the day.",
    "A mentor's earlier advice suddenly makes sense. Apply it now.",
    "Resources arrive when the plan is clear. Sharpen the plan.",
    "Quiet competence speaks louder than self-promotion today.",
    "Put your name on the work. Visibility is not vanity.",
    "Decline one thing today so you can do the rest properly.",
    "The problem is upstream of where everyone is looking. Trace it back.",
    "Ask for the number you actually want, then stop talking.",
    "A colleague's resistance is a request for information. Give it to them.",
    "Write down what you achieved this quarter — you will need it sooner than expected.",
    "Progress hides in unglamorous maintenance today. Do it anyway.",
    "Send the follow-up. The silence is not a no.",
    "Simplify the offer. Complexity is costing you agreement.",
    "The skill you keep meaning to learn is the bottleneck. Begin this week.",
    "Choose the project that teaches you something over the one that flatters you.",
    "Money behaves better when you look directly at it. Open the spreadsheet.",
    "One clear priority beats five urgent ones. Pick it before lunch.",
    "Your instinct about that person is worth more than their credentials.",
    "Negotiate the terms, not only the price.",
    "A slower start today produces a cleaner finish. Resist the shortcut.",
    "Credit given freely comes back multiplied. Name who helped.",
    "The opportunity looks small because it is early. Judge its direction, not its size.",
    "Stop polishing and ship it. Feedback teaches faster than perfection.",
    "Protect one block of uninterrupted time; that is where the real work lives.",
    "An old contact holds the introduction you need. Reach out without an agenda.",
    "Saying 'I don't know yet' earns more respect than guessing.",
    "The expense you keep ignoring is the one to cut first.",
    "Have the difficult conversation early in the day, not at the end of it.",
    "Your work is better than your description of it. Practise the description.",
    "Your consistency is being noticed by someone who has not mentioned it yet.",
    "Build the thing that keeps working while you sleep.",
    "Rest is part of the strategy, not a break from it."
  ];

  const D_WELLNESS = [
    "Your body asks for rhythm — regular meals, regular rest, regular breath.",
    "Step outside; ten minutes under the open sky resets everything.",
    "Tension gathers in the shoulders of those who carry too much. Set something down.",
    "Water and movement are your medicine today.",
    "Guard the hour before sleep; let the mind land softly.",
    "A creative act — however small — restores more energy than it spends.",
    "Notice what you consume, in food and in media alike. Choose nourishment.",
    "The tiredness is real. Treat it as information, not as a character flaw.",
    "Stretch the part of you that has been holding still too long.",
    "Eat something that took a little effort to prepare.",
    "Your attention is a nutrient. Stop feeding it to things that drain you.",
    "Sunlight early in the day steadies everything that follows.",
    "One fewer thing on today's list is a legitimate act of care.",
    "Move for the pleasure of it, not to earn anything.",
    "Twenty minutes of silence will tell you what you actually need.",
    "Hydrate before you caffeinate.",
    "The ache is asking for attention, not endurance. Book the appointment.",
    "Company is medicine today; do not spend the whole evening alone.",
    "Put the phone in another room and notice how your shoulders respond.",
    "Slow, long exhales are the fastest way back to yourself.",
    "Choose the walk over the scroll. Your mind will thank you within minutes.",
    "Feed yourself as though you were someone you love.",
    "A cluttered space is quietly taxing you. Clear one surface.",
    "Sleep is not the reward for finishing; it is the reason you can.",
    "Warmth helps today — a bath, a blanket, a hot drink held in both hands.",
    "Your energy dips are predictable. Plan around them instead of fighting them.",
    "Decline one social obligation and let the relief confirm it was right.",
    "Breathe through the nose, slower than feels necessary.",
    "The body keeps the appointments the mind cancels. Listen earlier.",
    "Do the gentle version today. Intensity can wait.",
    "Green things — plants, parks, vegetables — all count. Get near some.",
    "Laughter is a physical therapy. Seek out something genuinely funny.",
    "Your posture is telling a story. Change the sentence.",
    "Rest before you are empty, not after.",
    "One good habit repeated beats five started.",
    "Be as patient with your body as you would be with a friend's."
  ];

  const COLORS = ["Gold","Crimson","Emerald","Sapphire","Violet","Silver","Amber","Rose","Turquoise","Ivory","Indigo","Copper","Jade","Scarlet","Pearl","Obsidian","Saffron","Lavender","Bronze","Cobalt","Moss","Coral","Onyx","Opal"];
  const MOODS = ["Inspired","Grounded","Magnetic","Reflective","Bold","Serene","Curious","Radiant","Focused","Tender","Fearless","Quietly certain","Playful","Steady","Open","Luminous"];

  // ── Monthly pools ────────────────────────────────────────────────────────
  const M_THEMES = ["Renewal","Momentum","Reflection","Expansion","Grounding","Connection","Transformation","Clarity","Abundance","Courage","Healing","Vision","Discipline","Release","Reinvention","Harvest","Beginnings","Depth","Freedom","Devotion","Resolve","Curiosity","Restoration","Ascent"];

  const M_OPEN = [
    "This month invites you to rebuild something on firmer ground.",
    "The weeks ahead reward patience over force.",
    "A long cycle closes and a cleaner one opens.",
    "Opportunities cluster near the middle of the month.",
    "Relationships take centre stage from the first week onward.",
    "Your focus turns to foundations — home, health, and daily rhythm.",
    "Momentum you have been building finally becomes visible to others.",
    "This is a month of clarity after a long stretch of guessing.",
    "The pace quickens, and it suits you more than you expected.",
    "Something you have been carrying alone gets shared this month.",
    "A decision you postponed twice arrives a third time, and this time it is easy.",
    "The month begins slowly and ends far ahead of where you thought you'd be.",
    "Money and self-worth turn out to be the same conversation this month.",
    "You are being asked to finish rather than to start.",
    "An old ambition returns wearing more practical clothes.",
    "This month rewards those who ask plainly for what they need.",
    "The theme is boundaries — where you end and everyone else begins.",
    "Travel, study, or a new idea widens the walls of your life.",
    "A quieter month than the last, and you will be grateful for it.",
    "What felt like a setback last month reveals its purpose in this one.",
    "Your reputation does quiet work for you while you are busy elsewhere.",
    "This month asks for one honest conversation you keep postponing.",
    "Creative energy returns after a fallow stretch. Use it before it moves on.",
    "The month favors the practical over the perfect."
  ];

  const M_CLOSE = [
    "What you tend quietly now begins to show above the surface.",
    "A situation that stalled loosens once you stop pushing and start listening.",
    "Release what belongs to the past so your hands are free for what arrives.",
    "Prepare early so you can move decisively when the moment comes.",
    "Old bonds deepen, and a new one may surprise you with how easy it feels.",
    "Small repairs made now prevent a much larger one later.",
    "Let recognition find you rather than chasing it.",
    "Something uncertain resolves into a plain, workable next step.",
    "Keep one evening a week entirely unscheduled and the rest will hold.",
    "Accepting help is the fastest route through the middle weeks.",
    "Trust the version of the plan that survives contact with reality.",
    "By the final week the effort stops feeling like effort.",
    "Spend on what lasts; the rest can wait another month.",
    "Closing the loose ends will free more energy than any new project would.",
    "Start it smaller than your ambition suggests and it will actually happen.",
    "Directness saves you two weeks of quiet resentment.",
    "Guard your time and your generosity becomes sustainable.",
    "Say yes to the invitation that scares you slightly.",
    "Rest is productive this month; treat it as part of the work.",
    "Hindsight arrives early this time — use it while it still matters.",
    "Someone speaks well of you in a room you are not in.",
    "The conversation goes better than the version you rehearsed.",
    "Protect the first hour of the day and the work takes care of itself.",
    "Choose the sturdy option; this is not the month for gambles."
  ];

  const M_LOVE = [
    "In love, sincerity outshines grand gestures — the small consistent kindnesses land deepest.",
    "Romance benefits from honesty about what you actually need. Say it plainly and the air clears.",
    "Coupled or single, the theme is presence: be where you are, with whoever is in front of you.",
    "An old misunderstanding can finally be mended if you lead with curiosity instead of defence.",
    "Attraction sparks through shared purpose — you will meet someone while doing what you love.",
    "A relationship shifts gear this month. Let it change shape rather than forcing the old form.",
    "Someone's steadiness becomes more appealing than someone else's excitement.",
    "Speak first. The silence between you is not meaningful, only stubborn.",
    "This month asks you to be chosen clearly, or not at all.",
    "Affection grows through ordinary time spent together, not through occasions.",
    "If single, say yes to the second invitation as well as the first.",
    "Jealousy this month is pointing at something you want, not at something they did.",
    "The relationship you tend most carefully should be the one with yourself.",
    "A conversation about the future goes better than either of you expects.",
    "Forgive the small thing quickly; it is not worth the weeks it would cost.",
    "Let them see the unpolished version. That is where closeness actually starts.",
    "Distance early in the month gives way to unusual warmth later.",
    "Do not audition for a place you already belong in.",
    "Someone from the past resurfaces. Decide with your head, feel with your heart, and take your time.",
    "Plan something to look forward to together — anticipation carries the whole month.",
    "The kindest thing you can offer this month is your full attention.",
    "Being easy to love starts with being honest about what is hard for you.",
    "A friendship quietly turns into something else. Let it happen at its own pace.",
    "Ask them how they are, then wait longer than feels comfortable for the answer."
  ];

  const M_CAREER = [
    "At work, a project you nurtured earns its moment. Document your wins.",
    "Money flows more steadily when you close one leak rather than chase a windfall.",
    "A collaboration proves more valuable than going it alone.",
    "Say yes to the task that scares you slightly — it is the one that grows your standing.",
    "Organise before you accelerate; structure now prevents a scramble later.",
    "Your rate is too low. Raise it with the next new client, not the current one.",
    "A quiet reputation for reliability opens a door this month.",
    "Stop waiting to be ready. Announce it and let readiness catch up.",
    "The middle weeks bring an offer worth negotiating rather than accepting.",
    "One skill, practised deliberately this month, changes your options for years.",
    "Delegate the thing you are secretly proud of doing yourself.",
    "Review your subscriptions and small recurring costs — the total will surprise you.",
    "A difficult colleague becomes manageable once you stop trying to be liked by them.",
    "Ship the imperfect version. The market teaches faster than your own review.",
    "Build a small reserve this month; next month will thank you.",
    "Ask for the meeting. The worst outcome is a polite no.",
    "Choose the work that compounds over the work that merely pays.",
    "Your network is warmer than you assume. Send three messages with no ask attached.",
    "A side interest starts looking like a real option. Give it one honest month.",
    "Track where the hours actually go for one week; the fix will be obvious.",
    "Set the price, state it calmly, and let the silence do the work.",
    "The bottleneck is a decision no one has made. Make it.",
    "Finish the unglamorous thing first and the month opens up.",
    "Protect your best hours for your most important work, not your most urgent."
  ];

  const M_WELLNESS = [
    "Your energy runs in waves this month; schedule demanding things for when the tide is high.",
    "Sleep is the quiet lever behind everything else — protect it and the rest steadies.",
    "Movement you enjoy beats discipline you dread. Find the version that feels like play.",
    "Tend your nervous system: fewer inputs, more nature, longer exhales.",
    "A small daily ritual becomes an anchor. Keep it simple enough to actually repeat.",
    "Book the appointment you have been postponing. The waiting is worse than the knowing.",
    "Cut one stimulant and notice how much steadier the afternoons become.",
    "Your body is asking for warmth and regularity rather than intensity this month.",
    "Eat earlier in the evening and sleep will improve on its own.",
    "Company is medicine — put two social evenings in the calendar now.",
    "Strength work suits this month better than endurance.",
    "The screen before bed is costing you more than the extra hour is worth.",
    "Hydration and daylight will do more this month than any supplement.",
    "Give yourself one entirely unproductive afternoon and treat it as maintenance.",
    "Stretch in the morning, even briefly; your back is keeping score.",
    "Say no to one recurring commitment and reinvest the time in rest.",
    "Cook something properly at least twice a week — the ritual matters as much as the food.",
    "Your mood tracks your blood sugar more closely than you think. Eat regularly.",
    "Walk without headphones once this month and let your thoughts finish.",
    "Breathwork for five minutes beats an hour of worrying about stress.",
    "Do the gentler workout and stay consistent rather than going hard and stopping.",
    "Declutter one room; the mental effect is out of proportion to the effort.",
    "Get outside before noon whenever you can — it resets the whole system.",
    "Treat rest as scheduled maintenance, not as a reward you have to earn."
  ];

  // ── Yearly pools ─────────────────────────────────────────────────────────
  const Y_THEMES = ["The Year of Foundations","The Year of Becoming","The Year of Opening","The Year of Mastery","The Year of the Heart","The Year of Bold Moves","The Year of Renewal","The Year of Alignment","The Year of Roots","The Year of the Threshold","The Year of Quiet Power","The Year of the Wider Circle","The Year of Craft","The Year of Return","The Year of Clear Sight","The Year of the Long Game","The Year of Reinvention","The Year of Belonging","The Year of Enough","The Year of the Open Road","The Year of Repair","The Year of Momentum","The Year of Stillness","The Year of the Unwritten Page"];

  const Y_OPEN = [
    "This is a building year.",
    "A long chapter completes and a more authentic one begins.",
    "Expansion is the keynote — travel, learning, and new circles widen what feels possible.",
    "The year rewards mastery over novelty.",
    "Relationships are this year's great teachers.",
    "Courage is the currency of the year.",
    "This is a year of steady healing.",
    "Alignment is the thread running through everything.",
    "The year asks you to choose depth over breadth.",
    "Something you have wanted for a long time becomes practical rather than theoretical.",
    "This year your private work becomes public in a way you did not plan.",
    "The first half tests your patience; the second half pays it back.",
    "You end this year with a noticeably smaller, better list of priorities.",
    "A year of thresholds — several doors close and better ones open.",
    "Money, worth, and security are the year's central conversation.",
    "This is the year the experiment becomes the plan.",
    "Home and belonging take on more weight than ambition does.",
    "A year of consolidation after several years of change.",
    "You will be asked to lead something before you feel ready.",
    "This year rewards the unglamorous discipline you have been avoiding.",
    "An identity you outgrew finally falls away without drama.",
    "The year favors those who ask for help early.",
    "Creative work you shelved returns with better timing.",
    "This is a year of quiet, compounding wins rather than dramatic ones."
  ];

  const Y_CLOSE = [
    "The choices you make quietly in the first half set the stage for visible growth in the second.",
    "You will end the year noticeably closer to who you actually are.",
    "Say yes early and often; the doors are open wider than usual.",
    "Depth in one thing you already love will outperform scattering yourself.",
    "Through others you learn where you end and another begins.",
    "Each time you choose the braver option, doors you could not see swing open.",
    "What felt heavy at the start grows lighter as you release it in stages.",
    "Work, love, and values slowly move in the same direction, and life gets simpler.",
    "By December the narrower path will feel like the obvious one.",
    "Do the boring preparation early and the opportunity will not catch you unready.",
    "Let people see the work before it is finished; the response will redirect you well.",
    "Protect your energy in the first quarter and you will have plenty for the rest.",
    "Whatever you decide to stop doing will matter as much as what you start.",
    "Endings this year are merciful. Do not argue with them.",
    "Build the reserve before you need it and the year stays calm.",
    "Commit publicly to the thing and let accountability do the rest.",
    "The people you gather this year matter more than the goals you set.",
    "Slow, unglamorous consistency will outperform every burst of intensity.",
    "Accept the role before you feel qualified; competence follows commitment.",
    "The habit you keep all year becomes the identity you carry into the next one.",
    "Grief and relief arrive together. Both are allowed.",
    "Ask for more than feels polite; you have been undercharging in every sense.",
    "Finish one thing properly rather than starting four things well.",
    "Small, repeated acts of care compound into a very different life by year's end."
  ];

  const Y_LOVE = [
    "In love, the year favors depth over drama. Commitments made now are built to last.",
    "The heart's lesson is worthiness — you attract what you believe you deserve, so raise the bar kindly.",
    "A significant bond either deepens into something lasting or gracefully makes room for what fits better.",
    "Partnership grows through shared projects; you build something real rather than only talking about it.",
    "Single or paired, self-respect is the magnet all year. Tend it and the right people draw near.",
    "This is a year to stop auditioning and start choosing.",
    "An honest conversation early in the year saves you from a difficult one later.",
    "Love arrives in a plainer package than you have been picturing. Do not overlook it.",
    "You will be loved better this year, largely because you finally let yourself be known.",
    "Family relationships shift as you stop playing the role you were assigned.",
    "A friendship becomes one of the defining relationships of your year.",
    "If you are waiting for certainty before committing, the year will teach you it never arrives.",
    "Old patterns in love surface early so they can be finished for good.",
    "Romance thrives on unhurried time this year — protect the ordinary evenings.",
    "Someone who has been steady in the background moves into focus.",
    "You learn the difference between being needed and being loved, and choose the second.",
    "Say the vulnerable thing. This is the year it will be received well.",
    "A relationship survives by changing its terms rather than its people.",
    "Loneliness earlier in the year gives way to a genuinely better circle by its end.",
    "Attraction follows aliveness — pursue what interests you and company arrives.",
    "Let go of the almost. It has been occupying the space meant for something real.",
    "Your capacity for intimacy grows faster than your confidence does. Trust the growth.",
    "The year rewards the couple that keeps making new memories rather than defending old ones.",
    "Choose the person who is easy to be honest with."
  ];

  const Y_CAREER = [
    "Professionally, a seed planted this year matures over the next two. Choose a direction you would be glad to grow.",
    "Finances stabilise as you trade quick wins for compounding habits.",
    "A change of role, title, or field is well-starred — especially if it aligns work with values.",
    "Reputation builds this year through reliability; following through pays outsized dividends.",
    "Invest in one skill now; by year's end it becomes the thing that sets you apart.",
    "Your income responds to positioning more than to effort this year. Change how you are described.",
    "A quiet year of building beats a loud year of announcing. Build.",
    "The right opportunity will look like more responsibility than you want. Take it.",
    "Diversify your income before you need to, not after.",
    "You outgrow a working relationship this year. Leave it well.",
    "Charge what the work is worth to them, not what it costs you.",
    "One introduction this year changes your trajectory. Be findable.",
    "Automate or delegate the repetitive work; it is quietly capping your ceiling.",
    "The market is readier for your idea than you are. Close the gap.",
    "Save aggressively in the strong months; the lean ones are predictable.",
    "A qualification, course, or certification opens more doors than expected.",
    "Say no to profitable work that pulls you off your line.",
    "Your best year yet financially, provided you keep the overheads honest.",
    "Publish, share, or teach what you know — visibility compounds faster than skill alone.",
    "The project you keep postponing is the one with your name on it.",
    "Partnership beats solo effort this year; find someone whose strengths differ from yours.",
    "Track the numbers monthly and the decisions make themselves.",
    "Leaving is not failure. Staying too long usually is.",
    "Build one asset this year that keeps earning without you."
  ];

  const Y_GROWTH = [
    "Spiritually, the year asks you to trust timing. Not everything blooms on demand, and that is mercy.",
    "Your growth edge is boundaries — a clean no so that your yes means something.",
    "Practice becomes identity this year: who you are is simply what you repeatedly do.",
    "The lesson is integration — bringing scattered parts of your life into one coherent story.",
    "You are learning to hold ambition and peace at once. This year they stop being opposites.",
    "Solitude stops feeling like loneliness and starts feeling like a resource.",
    "You will forgive something this year that you assumed you never would.",
    "The year teaches you the difference between intuition and anxiety.",
    "Simplicity is the spiritual work of this year. Own less, commit deeper.",
    "You stop performing certainty and become genuinely more convincing.",
    "A belief you inherited gets examined and, gently, put down.",
    "Patience is the muscle this year builds, whether or not you volunteer.",
    "Your relationship with your body becomes more honest and less transactional.",
    "You learn to grieve properly, and it makes room for a great deal of joy.",
    "Service to others turns out to be the thing that steadies you.",
    "The year rewards attention: what you look at closely begins to change.",
    "You will stop waiting for permission somewhere around the middle of the year.",
    "Rest becomes a practice rather than a collapse.",
    "Curiosity replaces judgement, and your world gets noticeably larger.",
    "You will be humbled once, usefully, and thank it later.",
    "The stories you tell about your past soften into something more accurate.",
    "Trust builds slowly this year — in others, and more importantly in yourself.",
    "You learn that consistency is a form of self-respect.",
    "By the end of the year you will need far less reassurance than you do now."
  ];

  // ── Collision-free selector ──────────────────────────────────────────────
  // Guarantees: 12 signs -> 12 different lines on the same period, and a given
  // sign cycles through the entire pool before repeating any line.
  // The permutation is fixed (seeded only by `salt`), which is deliberate:
  // it makes each sign walk the whole pool one step per period, so a line
  // cannot return for exactly pool.length periods. Re-shuffling per cycle
  // would break that guarantee at every cycle boundary.
  const permCache = {};
  function cyclePick(pool, signIdx, period, salt) {
    const P = pool.length;
    if (!P) return '';
    const stride = Math.max(1, Math.floor(P / 12)); // 11*stride < P => 12 distinct
    const pos = ((period % P) + P) % P;
    let perm = permCache[salt];
    if (!perm || perm.length !== P) {
      perm = permCache[salt] = MysticApp.shuffle(pool, MysticApp.seededRng(salt));
    }
    return perm[(pos + signIdx * stride) % P];
  }

  function signIndex(sign) {
    const i = ZODIAC_SIGNS.findIndex(s => s.name === sign.name);
    return i < 0 ? 0 : i;
  }

  function dayNumber() {
    return Math.floor(new Date(new Date().toDateString()).getTime() / 86400000);
  }

  function dailyReading(sign) {
    const i = signIndex(sign);
    const day = dayNumber();
    // Lucky extras stay seeded per (sign, day) — collisions there are harmless.
    const rng = MysticApp.seededRng(sign.name + '|X|' + MysticApp.todayKey());
    return {
      general: cyclePick(D_GENERAL, i, day, 'dg'),
      love: cyclePick(D_LOVE, i, day, 'dl'),
      career: cyclePick(D_CAREER, i, day, 'dc'),
      wellness: cyclePick(D_WELLNESS, i, day, 'dw'),
      luckyNumber: Math.floor(rng() * 99) + 1,
      luckyColor: cyclePick(COLORS, i, day, 'dk'),
      mood: cyclePick(MOODS, i, day, 'dm'),
      stars: 3 + Math.floor(rng() * 3)
    };
  }

  function monthlyReading(sign) {
    const i = signIndex(sign);
    const d = new Date();
    const period = d.getFullYear() * 12 + d.getMonth();
    const rng = MysticApp.seededRng(sign.name + '|MX|' + d.getFullYear() + '-' + d.getMonth());
    const days = MysticApp.shuffle(Array.from({ length: 28 }, (_, n) => n + 1), rng).slice(0, 3).sort((a, b) => a - b);
    return {
      label: MONTHS[d.getMonth()] + ' ' + d.getFullYear(),
      theme: cyclePick(M_THEMES, i, period, 'mt'),
      overview: cyclePick(M_OPEN, i, period, 'mo') + ' ' + cyclePick(M_CLOSE, i, period, 'mc'),
      love: cyclePick(M_LOVE, i, period, 'ml'),
      career: cyclePick(M_CAREER, i, period, 'mr'),
      wellness: cyclePick(M_WELLNESS, i, period, 'mw'),
      powerDays: days.map(ord).join(' · '),
      luckyColor: cyclePick(COLORS, i, period, 'mk'),
      stars: 3 + Math.floor(rng() * 3)
    };
  }

  function yearlyReading(sign) {
    const i = signIndex(sign);
    const year = new Date().getFullYear();
    const rng = MysticApp.seededRng(sign.name + '|YX|' + year);
    return {
      label: String(year),
      theme: cyclePick(Y_THEMES, i, year, 'yt'),
      overview: cyclePick(Y_OPEN, i, year, 'yo') + ' ' + cyclePick(Y_CLOSE, i, year, 'yc'),
      love: cyclePick(Y_LOVE, i, year, 'yl'),
      career: cyclePick(Y_CAREER, i, year, 'yr'),
      growth: cyclePick(Y_GROWTH, i, year, 'yg'),
      bestMonth: MONTHS[(i * 5 + year) % 12],
      luckyColor: cyclePick(COLORS, i, year, 'yk'),
      stars: 4 + Math.floor(rng() * 2)
    };
  }

  function ord(n) {
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  let root = null;
  let currentSign = null;
  let currentMode = 'day';

  function render(container) {
    root = container;
    currentSign = null;
    // If the user has told us their sign, go straight to it.
    const saved = (MysticApp.getProfile() || {}).sign;
    const savedSign = saved && ZODIAC_SIGNS.find(s => s.name === saved);
    if (savedSign) { currentMode = 'day'; showSign(savedSign); return; }
    showPicker();
  }

  function showPicker() {
    currentSign = null;
    let html = '<div class="zodiac-grid">';
    ZODIAC_SIGNS.forEach((s, i) => {
      html += `
        <button class="zodiac-tile" data-index="${i}">
          <div class="zodiac-glyph">${s.glyph}</div>
          <div class="zodiac-name">${s.name}</div>
          <div class="zodiac-dates">${s.dates}</div>
        </button>
      `;
    });
    html += '</div>';
    root.innerHTML = html;

    root.querySelectorAll('.zodiac-tile').forEach(tile => {
      tile.addEventListener('click', () => { currentMode = 'day'; showSign(ZODIAC_SIGNS[parseInt(tile.dataset.index)]); });
    });
  }

  function stars(n) { return '★︎'.repeat(n) + '☆︎'.repeat(5 - n); }

  function showSign(sign) {
    currentSign = sign;
    const premium = MysticApp.isPremium();
    const saved = (MysticApp.getProfile() || {}).sign;
    const isMine = saved === sign.name;

    root.innerHTML = `
      <div class="sign-header">
        <div class="sign-header-glyph">${sign.glyph}</div>
        <h2>${sign.name}${isMine ? ' <span class="your-sign">your sign</span>' : ''}</h2>
        <div class="sign-header-dates">${sign.dates}</div>
        <div class="sign-facts">
          <span><b>Element</b> ${sign.element}</span>
          <span><b>Quality</b> ${sign.quality}</span>
          <span><b>Ruler</b> ${sign.ruler}</span>
        </div>
        <div class="sign-traits">${sign.traits}</div>
      </div>

      <div class="horo-tabs">
        <button class="horo-tab" data-mode="day">Today</button>
        <button class="horo-tab" data-mode="month">This Month${premium ? '' : ' ✦'}</button>
        <button class="horo-tab" data-mode="year">This Year${premium ? '' : ' ✦'}</button>
      </div>
      <div class="horo-body" id="horo-body"></div>

      <button class="btn-primary" id="btn-back-signs">All Signs</button>
      ${isMine ? '' : `<button class="btn-ghost horo-setmine" id="btn-set-mine">Make ${sign.name} my sign</button>`}
    `;

    root.querySelectorAll('.horo-tab').forEach(tab => {
      tab.addEventListener('click', () => { currentMode = tab.dataset.mode; paint(); });
    });
    root.querySelector('#btn-back-signs').addEventListener('click', () => showPicker());
    const mine = root.querySelector('#btn-set-mine');
    if (mine) mine.addEventListener('click', () => { MysticApp.saveProfile({ sign: sign.name }); showSign(sign); });
    paint();
    window.scrollTo(0, 0);
  }

  // AI-written text for this sign/period if the worker has already supplied it.
  // Null means "use the built-in pools" — which is also what happens offline.
  function aiFor(mode, sign) {
    if (!MysticApp.ai || !sign) return null;
    try { return MysticApp.ai.cachedSign(mode, sign.name); } catch (e) { return null; }
  }

  // Render immediately from the pools, then quietly upgrade to the AI text if it
  // arrives while the reader is still on this sign and tab. Never blocks.
  function maybeUpgrade() {
    if (!MysticApp.ai || !MysticApp.ai.enabled()) return;
    const mode = currentMode, sign = currentSign;
    if (!sign || aiFor(mode, sign)) return;
    if (mode !== 'day' && !MysticApp.isPremium()) return; // locked anyway
    MysticApp.ai.horoscope(mode).then(data => {
      if (!data || !data.signs || !data.signs[sign.name]) return;
      if (currentMode !== mode || !currentSign || currentSign.name !== sign.name) return;
      if (!root || !root.querySelector('#horo-body')) return;
      paint();
    });
  }

  function paint() {
    root.querySelectorAll('.horo-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.mode === currentMode);
    });
    const body = root.querySelector('#horo-body');
    const premium = MysticApp.isPremium();

    if (currentMode === 'day') {
      body.innerHTML = dailyHtml(currentSign, aiFor('day', currentSign));
      maybeUpgrade();
      return;
    }
    if (!premium) { body.innerHTML = lockedHtml(currentMode); wireLock(body); return; }
    body.innerHTML = currentMode === 'month'
      ? monthlyHtml(currentSign, aiFor('month', currentSign))
      : yearlyHtml(currentSign, aiFor('year', currentSign));
    maybeUpgrade();
  }

  const FRESH = '<span class="ai-tag" title="Written fresh for this period">✦ fresh</span>';

  function dailyHtml(sign, ai) {
    const r = dailyReading(sign);
    if (ai) { r.general = ai.general; r.love = ai.love; r.career = ai.career; r.wellness = ai.wellness; }
    const dateStr = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    return `
      <div class="interp-card horo-lead">
        <h3>Today's Horoscope${ai ? FRESH : ''}</h3>
        <div class="interp-position">${dateStr} &nbsp;·&nbsp; ${stars(r.stars)}</div>
        <div class="interp-meaning">${MysticApp.esc(r.general)}</div>
      </div>
      <div class="interp-card"><h3>Love</h3><div class="interp-meaning">${MysticApp.esc(r.love)}</div></div>
      <div class="interp-card"><h3>Career</h3><div class="interp-meaning">${MysticApp.esc(r.career)}</div></div>
      <div class="interp-card"><h3>Wellness</h3><div class="interp-meaning">${MysticApp.esc(r.wellness)}</div></div>
      <div class="lucky-row">
        <div class="lucky-item"><div class="lucky-label">Lucky Number</div><div class="lucky-value">${r.luckyNumber}</div></div>
        <div class="lucky-item"><div class="lucky-label">Lucky Color</div><div class="lucky-value">${r.luckyColor}</div></div>
        <div class="lucky-item"><div class="lucky-label">Mood</div><div class="lucky-value">${r.mood}</div></div>
      </div>
      <div class="interp-summary"><h3>Best Matches</h3><p>${sign.compat}</p></div>`;
  }

  function monthlyHtml(sign, ai) {
    const r = monthlyReading(sign);
    if (ai) { r.overview = ai.general; r.love = ai.love; r.career = ai.career; r.wellness = ai.wellness; }
    return `
      <div class="interp-card horo-lead">
        <h3>${r.label}${ai ? FRESH : ''}</h3>
        <div class="interp-position">Theme: ${r.theme} &nbsp;·&nbsp; ${stars(r.stars)}</div>
        <div class="interp-meaning">${MysticApp.esc(r.overview)}</div>
      </div>
      <div class="interp-card"><h3>Love</h3><div class="interp-meaning">${MysticApp.esc(r.love)}</div></div>
      <div class="interp-card"><h3>Career &amp; Money</h3><div class="interp-meaning">${MysticApp.esc(r.career)}</div></div>
      <div class="interp-card"><h3>Wellness</h3><div class="interp-meaning">${MysticApp.esc(r.wellness)}</div></div>
      <div class="lucky-row">
        <div class="lucky-item"><div class="lucky-label">Power Days</div><div class="lucky-value">${r.powerDays}</div></div>
        <div class="lucky-item"><div class="lucky-label">Lucky Color</div><div class="lucky-value">${r.luckyColor}</div></div>
      </div>`;
  }

  function yearlyHtml(sign, ai) {
    const r = yearlyReading(sign);
    if (ai) { r.overview = ai.general; r.love = ai.love; r.career = ai.career; r.growth = ai.wellness; }
    return `
      <div class="interp-card horo-lead">
        <h3>${r.label} — ${r.theme}${ai ? FRESH : ''}</h3>
        <div class="interp-position">${stars(r.stars)}</div>
        <div class="interp-meaning">${MysticApp.esc(r.overview)}</div>
      </div>
      <div class="interp-card"><h3>Love &amp; Relationships</h3><div class="interp-meaning">${MysticApp.esc(r.love)}</div></div>
      <div class="interp-card"><h3>Career &amp; Finances</h3><div class="interp-meaning">${MysticApp.esc(r.career)}</div></div>
      <div class="interp-card"><h3>Growth &amp; Spirit</h3><div class="interp-meaning">${MysticApp.esc(r.growth)}</div></div>
      <div class="lucky-row">
        <div class="lucky-item"><div class="lucky-label">Strongest Month</div><div class="lucky-value">${r.bestMonth}</div></div>
        <div class="lucky-item"><div class="lucky-label">Lucky Color</div><div class="lucky-value">${r.luckyColor}</div></div>
      </div>`;
  }

  function lockedHtml(mode) {
    const name = mode === 'month' ? 'Monthly Horoscope' : 'Yearly Horoscope';
    const blurb = mode === 'month'
      ? 'A full month-ahead forecast — theme, love, career, wellness and your power days.'
      : 'Your year-ahead forecast — the year’s theme, love, career, finances and spiritual growth.';
    return `
      <div class="horo-locked">
        <div class="horo-locked-icon">${MysticApp.icons.star}</div>
        <h3>${name}</h3>
        <p>${blurb}</p>
        <p class="horo-locked-tag">Included with <b>Mystic Oracle Plus</b></p>
        <button class="btn-primary" id="horo-unlock">${MysticApp.icons.star}<span>Unlock with Plus</span></button>
      </div>`;
  }

  function wireLock(body) {
    const b = body.querySelector('#horo-unlock');
    if (b) b.addEventListener('click', () => MysticApp.openSubscribe());
  }

  // Exposed so the settings screen can offer a sign picker.
  MysticApp.zodiacSigns = ZODIAC_SIGNS;

  MysticApp.register({
    id: 'horoscope',
    name: 'Horoscope',
    icon: MysticApp.icons.horoscope,
    desc: 'Daily zodiac guidance',
    subtitle: 'Daily, monthly & yearly stars',
    render
  });
})();
