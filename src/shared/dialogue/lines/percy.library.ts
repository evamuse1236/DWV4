import type { LinePack } from "../types";

/**
 * VOICE — Percy (Percy Jackson), library edition.
 * The dyslexic demigod who reads anyway. Easter eggs: Annabeth's
 * architecture books, Chiron's teaching, Daedalus's laptop, Athena cabin,
 * Rachel's cave paintings, blue food, Ancient-Greek-wired brain.
 *
 * pitch.frame interpolates {bookTitle} and {genreStinger}; why.* keys voice
 * ranking reasons; pick.first/pick.backup are card kickers; teaser.fallback
 * covers books with no description.
 */
export const percyLibrary: LinePack = {
  greeting: [
    {
      id: "percy.lib.greet.1",
      text: "Welcome to the library. Real talk: my brain's wired for Ancient Greek, so reading English is my hard mode — and I STILL wouldn't trade the good books. Let's find yours.",
      expression: "neutral",
    },
    {
      id: "percy.lib.greet.2",
      text: "Book quest? Excellent. Way safer than my usual quests. In fifteen years, zero people have been eaten by a paperback. I checked with Chiron.",
      expression: "laughing",
    },
    {
      id: "percy.lib.greet.3",
      text: "Hey! Hunting your next read? Annabeth would build you a color-coded reading tower. I do vibes. My vibes have a solid win rate.",
      expression: "proud",
    },
    {
      id: "percy.lib.greet.4",
      text: "The library — Annabeth's favorite battlefield. She'd live here if camp allowed it. Tell me the mood and I'll scout ahead.",
      expression: "thinking",
    },
  ],

  "genre.picked.fantasy": [
    {
      id: "percy.lib.g.fantasy.1",
      text: "Fantasy — monsters, magic, impossible odds. So... my biography. Solid pick. Fast and wild, or slow and cozy?",
      expression: "laughing",
    },
    {
      id: "percy.lib.g.fantasy.2",
      text: "Magic worlds, huh? Take it from a guy who lives in one: they're better in books. The rent is lower and nothing bites. What pace?",
      expression: "neutral",
    },
  ],
  "genre.picked.mystery": [
    {
      id: "percy.lib.g.mystery.1",
      text: "A mystery. Great. The last mystery I solved, the answer was 'a god did it.' Spoiler: it's ALWAYS 'a god did it.' Yours will have a better twist. Pace?",
      expression: "laughing",
    },
    {
      id: "percy.lib.g.mystery.2",
      text: "Secrets and clues — nice. All the detective glory, zero trips to the Underworld. I ran the numbers. Pace next.",
      expression: "neutral",
    },
  ],
  "genre.picked.adventure": [
    {
      id: "percy.lib.g.adventure.1",
      text: "Adventure! As a professional adventurer — licensed, three quests, two wars — I endorse this completely. The book version has snack access. What speed?",
      expression: "proud",
    },
    {
      id: "percy.lib.g.adventure.2",
      text: "Quests and journeys — my native language. Well, second native language, after Ancient Greek. How fast do you want this ride?",
      expression: "excited",
    },
  ],
  "genre.picked.realworld": [
    {
      id: "percy.lib.g.realworld.1",
      text: "Real-world stuff. Honestly? Sometimes reality out-weirds mythology, and I've had dinner with mythology. What pace?",
      expression: "thinking",
    },
    {
      id: "percy.lib.g.realworld.2",
      text: "True stories — respect. Facts hold up under pressure, like celestial bronze. Unlike, say, most of Hermes' promises. How fast a read?",
      expression: "neutral",
    },
  ],
  "genre.picked.fiction": [
    {
      id: "percy.lib.g.fiction.1",
      text: "Fiction. Made-up worlds, real feelings — like campfire stories at Camp Half-Blood, minus the harpies on curfew patrol. Good pick. Pace?",
      expression: "neutral",
    },
    {
      id: "percy.lib.g.fiction.2",
      text: "A story it is. The best ones feel truer than the news. Rachel paints the future on cave walls and even SHE reads fiction. What speed?",
      expression: "thinking",
    },
  ],
  "genre.picked.other": [
    {
      id: "percy.lib.g.other.1",
      text: "Off the map? Bold. That's how I found most of the good things in my life. Also most of the monsters. Net positive though! Pace?",
      expression: "laughing",
    },
    {
      id: "percy.lib.g.other.2",
      text: "A wildcard. The Fates love a wildcard — they knit it into the tapestry with a little smile. What pace do you want?",
      expression: "neutral",
    },
  ],

  "pace.picked": [
    {
      id: "percy.lib.pace.1",
      text: "Got it. Last question: more of what you already love, or new territory? No wrong answer — just different quests.",
      expression: "neutral",
    },
    {
      id: "percy.lib.pace.2",
      text: "Noted. Now — familiar waters or somewhere new? Son of Poseidon here, I can navigate either blindfolded. Grover made me prove it once.",
      expression: "proud",
    },
    {
      id: "percy.lib.pace.3",
      text: "Okay. Final thing: comfort pick or discovery pick? Both have survived my quality testing.",
      expression: "thinking",
    },
  ],

  "novelty.picked": [
    {
      id: "percy.lib.novelty.1",
      text: "That's everything. Give me a second — consulting my inner Oracle... she's faster than the real one and produces way less green smoke...",
      expression: "thinking",
    },
    {
      id: "percy.lib.novelty.2",
      text: "On it. Scouting the shelves... this is the one part of questing with zero monsters, so let me savor it...",
      expression: "neutral",
    },
  ],

  "pitch.frame": [
    {
      id: "percy.lib.pitch.1",
      text: "Okay, here's the one: {bookTitle}. {genreStinger} I'd stake Riptide on it, and Riptide always comes back to me, so technically it's a safe bet.",
      expression: "proud",
    },
    {
      id: "percy.lib.pitch.2",
      text: "Quest results: {bookTitle}. {genreStinger} Prophecies are usually vaguer than this and rhyme worse. Consider yourself lucky.",
      expression: "laughing",
    },
    {
      id: "percy.lib.pitch.3",
      text: "Found it. {bookTitle}. {genreStinger} My instincts have kept me alive through two wars. They can pick a book.",
      expression: "neutral",
    },
    {
      id: "percy.lib.pitch.4",
      text: "Top of the pile: {bookTitle}. {genreStinger} Two more picks below — but this one's doing the thing where it calls your name. Books do that. Ask Annabeth.",
      expression: "thinking",
    },
    {
      id: "percy.lib.pitch.5",
      text: "The shelves have spoken: {bookTitle}. {genreStinger} Even the Athena cabin would sign off, and they fact-check BIRTHDAY CARDS.",
      expression: "proud",
    },
    {
      id: "percy.lib.pitch.6",
      text: "Alright — {bookTitle}. {genreStinger} Chapter one tonight. That's the whole quest. Shorter than any quest I've ever gotten.",
      expression: "neutral",
    },
  ],

  "pitch.genreStinger.fantasy": [
    {
      id: "percy.lib.st.fantasy.1",
      text: "Magic, monsters, impossible odds — I live that combo, and trust me, it never gets old.",
    },
    {
      id: "percy.lib.st.fantasy.2",
      text: "A whole other world in there — and unlike mine, this one can't actually bite you.",
    },
  ],
  "pitch.genreStinger.mystery": [
    {
      id: "percy.lib.st.mystery.1",
      text: "There's a secret at the center of it, and you're going to want to get there before the characters do.",
    },
    {
      id: "percy.lib.st.mystery.2",
      text: "Clues, suspects, that itch in your brain that won't quit — the good kind of haunted.",
    },
  ],
  "pitch.genreStinger.adventure": [
    {
      id: "percy.lib.st.adventure.1",
      text: "It moves like a quest with the brakes cut — in the best way.",
    },
    {
      id: "percy.lib.st.adventure.2",
      text: "Big journey, real stakes, moments where you forget to breathe. Been there. Highly recommend.",
    },
  ],
  "pitch.genreStinger.realworld": [
    {
      id: "percy.lib.st.realworld.1",
      text: "All of it actually happened — which honestly makes it wilder than half the myths I've personally fought.",
    },
    {
      id: "percy.lib.st.realworld.2",
      text: "Real facts, real people — the kind of ammo that makes you the smartest one at the dinner table.",
    },
  ],
  "pitch.genreStinger.fiction": [
    {
      id: "percy.lib.st.fiction.1",
      text: "It's made up, but the feelings in it are real — that's the trick every good story pulls.",
    },
    {
      id: "percy.lib.st.fiction.2",
      text: "A story that follows you around after the last page — those are the ones worth hunting.",
    },
  ],
  "pitch.genreStinger.other": [
    {
      id: "percy.lib.st.other.1",
      text: "It's off the beaten path — and the best treasure always is. Labyrinth rules.",
    },
    {
      id: "percy.lib.st.other.2",
      text: "Bit of a surprise pick — the Fates were clearly in a good mood when this one surfaced.",
    },
  ],

  // --- Card voice: kickers ---------------------------------------------------
  "pick.first": [
    { id: "percy.lib.pick1.1", text: "The Chosen One" },
    { id: "percy.lib.pick1.2", text: "Quest Reward" },
    { id: "percy.lib.pick1.3", text: "Riptide-Approved" },
  ],
  "pick.backup": [
    { id: "percy.lib.pick2.1", text: "Backup Prophecy" },
    { id: "percy.lib.pick2.2", text: "Worthy Contender" },
    { id: "percy.lib.pick2.3", text: "Camp Favorite" },
  ],

  // --- Card voice: why-you'll-like-it, per ranking reason --------------------
  "why.genreMatch": [
    { id: "percy.lib.why.genre.1", text: "You asked for {genre}, and this one bleeds {genre}. Direct hit — no Apollo kid could've aimed it better." },
    { id: "percy.lib.why.genre.2", text: "This is exactly the {genre} you pointed at. Even the Oracle couldn't have matched it cleaner." },
  ],
  "why.moodMatch": [
    { id: "percy.lib.why.mood.1", text: "It's got the {vibe} feel you wanted — I checked it against my own quest logs. It qualifies." },
    { id: "percy.lib.why.mood.2", text: "Strong {vibe} current running through this one. Water-sense never lies about currents." },
  ],
  "why.history": [
    { id: "percy.lib.why.hist.1", text: "It's kin to books you already loved — same bloodline, new quest. Demigods know about bloodlines." },
    { id: "percy.lib.why.hist.2", text: "You've conquered this territory before and liked it. This is the sequel expedition." },
  ],
  "why.fiction": [
    { id: "percy.lib.why.fic.1", text: "A proper story — the kind that makes camp lights-out come way too early." },
    { id: "percy.lib.why.fic.2", text: "Made-up world, real feelings — the oldest magic there is, older than the gods. Don't tell them I said that." },
  ],
  "why.token": [
    { id: "percy.lib.why.tok.1", text: "You said \"{token}\" and this book answered like Mrs. O'Leary hearing her name. From three blocks away." },
    { id: "percy.lib.why.tok.2", text: "\"{token}\" — your word, this book's whole personality. You summoned it, I just fetched." },
  ],
  "why.fresh": [
    { id: "percy.lib.why.fresh.1", text: "Completely new territory for you — first-landing rights, plant your flag." },
    { id: "percy.lib.why.fresh.2", text: "Nothing like your usual — and my best days started with 'nothing like usual.' Also my worst. But mostly best!" },
  ],
  "why.fallback": [
    { id: "percy.lib.why.fall.1", text: "Pure instinct on this one. My instincts beat a Titan. They can pick your Tuesday book." },
    { id: "percy.lib.why.fall.2", text: "No prophecy, no fine print — sometimes the tide just leaves the right thing at your feet." },
  ],

  "teaser.fallback": [
    { id: "percy.lib.teaser.1", text: "No description on record for {bookTitle} — an unread prophecy. You get to be the first to open it. That's usually where my stories start." },
    { id: "percy.lib.teaser.2", text: "{bookTitle} arrived with no blurb, like a sealed scroll from Olympus. Could be anything. That's the fun part." },
  ],

  postStartReading: [
    {
      id: "percy.lib.start.1",
      text: "{bookTitle} — claimed. May your reading spot be comfy and your snacks be blue. Both matter. Mom's rules.",
      expression: "laughing",
    },
    {
      id: "percy.lib.start.2",
      text: "Quest accepted. First chapters are like first days at camp — awkward for ten minutes, then suddenly you belong there.",
      expression: "proud",
    },
    {
      id: "percy.lib.start.3",
      text: "Nice. {bookTitle} is officially yours. Full debrief when you finish — I want it delivered like a camp report, dramatic pauses included.",
      expression: "neutral",
    },
    {
      id: "percy.lib.start.4",
      text: "Good pick. And hey — if the reading goes slow some days, that's fine. My brain fights me on every page and I still finish quests. Slow heroes count double.",
      expression: "thinking",
    },
    {
      id: "percy.lib.start.5",
      text: "{bookTitle}, added to your saga. Chapter one tonight — shortest quest ever issued. You've survived way worse.",
      expression: "laughing",
    },
  ],

  noMatches: [
    {
      id: "percy.lib.nomatch.1",
      text: "Huh. The shelves came up empty for that combo. Not an omen — I know omens, they smell like sulfur. Just a small library. Try another mood?",
      expression: "thinking",
    },
    {
      id: "percy.lib.nomatch.2",
      text: "Nothing matched. Even the Oracle draws a blank sometimes, and she's got a direct line to Apollo. Switch the vibe, I'll re-scout.",
      expression: "neutral",
    },
    {
      id: "percy.lib.nomatch.3",
      text: "Empty-handed this time. Ask your coach to stock more books — or throw me a different quest. Grover finds food in a desert; I can find you a book.",
      expression: "laughing",
    },
  ],

  browsing: [
    {
      id: "percy.lib.browse.1",
      text: "No rush. When you want a recommendation, tap the bubbles — or name literally anything you're into. Dragons. Sharks. Sharks are basically cousins.",
      expression: "neutral",
    },
    {
      id: "percy.lib.browse.2",
      text: "Just wandering the stacks? Smart. Scout the terrain before the quest. Very Annabeth of you. That's the highest compliment I give.",
      expression: "laughing",
    },
  ],
};
