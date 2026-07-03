import type { LinePack } from "../types";

/**
 * VOICE — Steve Harrington (Stranger Things), library edition.
 * Family Video clerk energy: confidently recommending things, secretly
 * having great taste, letting Robin fact-check him. Easter eggs: Family
 * Video, Scoops Ahoy, the party's D&D campaigns, walkies, Hawkins lore.
 *
 * pitch.frame interpolates {bookTitle} and {genreStinger}; why.* keys voice
 * ranking reasons; pick.first/pick.backup are card kickers; teaser.fallback
 * covers books with no description.
 */
export const steveLibrary: LinePack = {
  greeting: [
    {
      id: "steve.lib.greet.1",
      text: "Welcome to the library, champ! I did a year at Family Video — recommending stuff is literally my trained profession. What are we in the mood for?",
      expression: "proud",
    },
    {
      id: "steve.lib.greet.2",
      text: "Book run? Nice. Robin says the right book at the right time rewires your whole brain. Robin's annoying but Robin's never wrong. Let's find yours.",
      expression: "thinking",
    },
    {
      id: "steve.lib.greet.3",
      text: "Hey hey! Okay, picture Family Video, but books, and the clerk is even better looking. What kind of story are we hunting?",
      expression: "laughing",
    },
    {
      id: "steve.lib.greet.4",
      text: "Ahoy! Looking for your next read? I've got a system. The system mostly works. The hair, however, ALWAYS works. Let's go.",
      expression: "excited",
    },
  ],

  "genre.picked.fantasy": [
    {
      id: "steve.lib.g.fantasy.1",
      text: "Fantasy! Dragons, wizards, chosen ones — the nerds made me sit through enough campaigns that I actually get it now. Don't tell them. Fast read or slow burn?",
      expression: "laughing",
    },
    {
      id: "steve.lib.g.fantasy.2",
      text: "Magic worlds, huh? Respect. After what I've seen in Hawkins, 'fantasy' is basically a documentary. What pace?",
      expression: "thinking",
    },
  ],
  "genre.picked.mystery": [
    {
      id: "steve.lib.g.mystery.1",
      text: "Mystery! Clues, suspects, secrets — I once cracked a Russian code with a mall map and an ice cream scoop. You'll love this. What pace?",
      expression: "proud",
    },
    {
      id: "steve.lib.g.mystery.2",
      text: "A whodunit fan. Nice. Fair warning: you WILL suspect everyone, including the family dog. Fast or thoughtful?",
      expression: "laughing",
    },
  ],
  "genre.picked.adventure": [
    {
      id: "steve.lib.g.adventure.1",
      text: "Adventure! High stakes, big journeys, close calls — my entire résumé, minus the bat. What speed are we going?",
      expression: "excited",
    },
    {
      id: "steve.lib.g.adventure.2",
      text: "Adventure picks are undefeated, champ. All the adrenaline, zero tunnels. Pace next!",
      expression: "proud",
    },
  ],
  "genre.picked.realworld": [
    {
      id: "steve.lib.g.realworld.1",
      text: "Real-world stuff! Facts! You know how rare facts were in Hawkins? Treasure them. What pace do you want?",
      expression: "thinking",
    },
    {
      id: "steve.lib.g.realworld.2",
      text: "True stories — solid pick. Reality's got better plot twists than fiction anyway. I've LIVED several. How fast a read?",
      expression: "neutral",
    },
  ],
  "genre.picked.fiction": [
    {
      id: "steve.lib.g.fiction.1",
      text: "Fiction! Made-up worlds, real feelings. It's like practice for life, but comfy. Okay — pace?",
      expression: "thinking",
    },
    {
      id: "steve.lib.g.fiction.2",
      text: "Stories it is! Best rental category at Family Video, and I would know — I ran that wall. What speed?",
      expression: "proud",
    },
  ],
  "genre.picked.other": [
    {
      id: "steve.lib.g.other.1",
      text: "Going random?! Bold. I love it. Some of my best finds were 'wrong shelf' finds. What pace are we thinking?",
      expression: "laughing",
    },
    {
      id: "steve.lib.g.other.2",
      text: "Surprise pick! Okay, mystery box it is. Even Robin can't predict this one. Pace?",
      expression: "excited",
    },
  ],

  "pace.picked": [
    {
      id: "steve.lib.pace.1",
      text: "Logged. Last question, champ: more of what you already love, or something totally new? No wrong answer, only late fees.",
      expression: "thinking",
    },
    {
      id: "steve.lib.pace.2",
      text: "Got it. Final call — comfort pick or new frontier?",
      expression: "neutral",
    },
    {
      id: "steve.lib.pace.3",
      text: "Noted! Now: stay in familiar territory, or are we exploring? Say the word, I've got the car keys either way.",
      expression: "laughing",
    },
  ],

  "novelty.picked": [
    {
      id: "steve.lib.novelty.1",
      text: "All set! Running it through the system... the system is me squinting at shelves with great instincts... stand by...",
      expression: "thinking",
    },
    {
      id: "steve.lib.novelty.2",
      text: "Perfect. Checking the back room... every good store has a back room... gimme a sec...",
      expression: "neutral",
    },
  ],

  "pitch.frame": [
    {
      id: "steve.lib.pitch.1",
      text: "Okay, here it is: {bookTitle}. {genreStinger} Family Video clerk's honor — this is the one.",
      expression: "proud",
    },
    {
      id: "steve.lib.pitch.2",
      text: "Boom. {bookTitle}. {genreStinger} I have carried SIX kids through worse decisions than this. Trust me.",
      expression: "excited",
    },
    {
      id: "steve.lib.pitch.3",
      text: "Found it — {bookTitle}. {genreStinger} Even Robin would co-sign this rec, and she co-signs NOTHING I say.",
      expression: "laughing",
    },
    {
      id: "steve.lib.pitch.4",
      text: "Top of the stack: {bookTitle}. {genreStinger} There are backups below, but honestly? Start here, champ.",
      expression: "thinking",
    },
    {
      id: "steve.lib.pitch.5",
      text: "Staff pick of the week: {bookTitle}. {genreStinger} The staff is me. The pick is excellent.",
      expression: "proud",
    },
    {
      id: "steve.lib.pitch.6",
      text: "Alright, drumroll... {bookTitle}! {genreStinger} Read chapter one tonight — babysitter's orders.",
      expression: "excited",
    },
  ],

  "pitch.genreStinger.fantasy": [
    {
      id: "steve.lib.st.fantasy.1",
      text: "Full-on magic world in there — portals and everything, and this time nobody has to fight it with a bat.",
    },
    {
      id: "steve.lib.st.fantasy.2",
      text: "Wizards, quests, the whole campaign — the Hellfire kids would lose their MINDS over this one.",
    },
  ],
  "pitch.genreStinger.mystery": [
    {
      id: "steve.lib.st.mystery.1",
      text: "There's a secret buried in it, and you'll be building a suspect wall with string by chapter two.",
    },
    {
      id: "steve.lib.st.mystery.2",
      text: "Clues everywhere. It's a code to crack, and cracking codes is weirdly addictive — speaking from mall-basement experience.",
    },
  ],
  "pitch.genreStinger.adventure": [
    {
      id: "steve.lib.st.adventure.1",
      text: "The pacing on this thing is a car chase — and I say that as everyone's designated driver.",
    },
    {
      id: "steve.lib.st.adventure.2",
      text: "Big journey, high stakes, close calls — everything great about my life with none of the hospital visits.",
    },
  ],
  "pitch.genreStinger.realworld": [
    {
      id: "steve.lib.st.realworld.1",
      text: "It's all TRUE — you'll be dropping facts at dinner like the smartest person at the table. Enjoy that feeling.",
    },
    {
      id: "steve.lib.st.realworld.2",
      text: "Real story, real people — and reality writes plot twists that would get a screenwriter fired.",
    },
  ],
  "pitch.genreStinger.fiction": [
    {
      id: "steve.lib.st.fiction.1",
      text: "Made-up world, hundred-percent-real feelings — the good stuff, straight off the top shelf.",
    },
    {
      id: "steve.lib.st.fiction.2",
      text: "It's a story that sticks with you after the last page — the kind you make OTHER people read so you can talk about it.",
    },
  ],
  "pitch.genreStinger.other": [
    {
      id: "steve.lib.st.other.1",
      text: "It's a wildcard, and wildcards are how you find the hidden gems nobody at school knows about yet.",
    },
    {
      id: "steve.lib.st.other.2",
      text: "Off-menu pick — like ordering the secret flavor at Scoops. Risky. Usually amazing.",
    },
  ],

  // --- Card voice: kickers ---------------------------------------------------
  "pick.first": [
    { id: "steve.lib.pick1.1", text: "Staff Pick" },
    { id: "steve.lib.pick1.2", text: "Top Shelf" },
    { id: "steve.lib.pick1.3", text: "The Headliner" },
  ],
  "pick.backup": [
    { id: "steve.lib.pick2.1", text: "Strong Backup" },
    { id: "steve.lib.pick2.2", text: "Also Rents Well" },
    { id: "steve.lib.pick2.3", text: "Robin's Corner" },
  ],

  // --- Card voice: why-you'll-like-it, per ranking reason --------------------
  "why.genreMatch": [
    { id: "steve.lib.why.genre.1", text: "You asked for {genre}, this IS {genre}. Direct hit. I don't miss." },
    { id: "steve.lib.why.genre.2", text: "Exactly the {genre} shelf you pointed at, champ. Clerk instincts." },
  ],
  "why.moodMatch": [
    { id: "steve.lib.why.mood.1", text: "It's got that {vibe} energy you wanted — I checked twice, like a professional." },
    { id: "steve.lib.why.mood.2", text: "Big {vibe} vibes on this one. Trust the guy who matched movies to moods for a living." },
  ],
  "why.history": [
    { id: "steve.lib.why.hist.1", text: "It's in the same lane as books you already loved. Repeat customers get the good stuff." },
    { id: "steve.lib.why.hist.2", text: "Your track record says you eat this genre up. I keep receipts, champ." },
  ],
  "why.fiction": [
    { id: "steve.lib.why.fic.1", text: "It's a proper story — the kind that makes you miss your bus stop. Best kind." },
    { id: "steve.lib.why.fic.2", text: "Made-up world, real feelings. That's premium shelf material." },
  ],
  "why.token": [
    { id: "steve.lib.why.tok.1", text: "You said \"{token}\" and this book basically raised its hand. I just did the paperwork." },
    { id: "steve.lib.why.tok.2", text: "It's got \"{token}\" all over it — you ordered this one yourself, I'm just the delivery guy." },
  ],
  "why.fresh": [
    { id: "steve.lib.why.fresh.1", text: "Brand new territory for you — and new territory is where the good stories live. Usually. In books, definitely." },
    { id: "steve.lib.why.fresh.2", text: "Nothing like what you've read before. Bold pick. I respect it, and I'm hard to impress." },
  ],
  "why.fallback": [
    { id: "steve.lib.why.fall.1", text: "Gut call. My gut kept six kids alive. It can pick a book, trust me." },
    { id: "steve.lib.why.fall.2", text: "No fancy math on this one — sometimes the clerk just KNOWS. This is one of those times." },
  ],

  "teaser.fallback": [
    { id: "steve.lib.teaser.1", text: "No blurb on file for {bookTitle} — total mystery box. You crack it open, you write the review, you become the legend who read it first." },
    { id: "steve.lib.teaser.2", text: "{bookTitle} came in with no description. At Family Video we called that a 'hidden gem risk.' The hidden gems were usually gems." },
  ],

  postStartReading: [
    {
      id: "steve.lib.start.1",
      text: "YES! {bookTitle}, checked out! Read it, love it, report back — I live for a good debrief. Over.",
      expression: "excited",
    },
    {
      id: "steve.lib.start.2",
      text: "Great pick! Adding {bookTitle} to your record. Chapter one's the tutorial — push through, the good stuff's coming.",
      expression: "proud",
    },
    {
      id: "steve.lib.start.3",
      text: "Boom — new book started. I claim ten percent of the credit. Standard clerk commission.",
      expression: "laughing",
    },
    {
      id: "steve.lib.start.4",
      text: "{bookTitle}! Excellent taste. Almost as good as your buddy Steve's. Almost.",
      expression: "proud",
    },
    {
      id: "steve.lib.start.5",
      text: "Reading initiated, champ! And no late fees here — take your time, enjoy the ride.",
      expression: "excited",
    },
  ],

  noMatches: [
    {
      id: "steve.lib.nomatch.1",
      text: "Hm. Shelves came up empty for that combo. Not a you problem — a stock problem. Happens at every store. Different vibe?",
      expression: "thinking",
    },
    {
      id: "steve.lib.nomatch.2",
      text: "Zero hits. Weird — even the Family Video horror section had SOMETHING. Ask your coach to stock more books, or let's re-run it.",
      expression: "neutral",
    },
    {
      id: "steve.lib.nomatch.3",
      text: "Nothing matched, champ. The back room's empty too, I checked. Metaphorically. Switch the mood and I'll go again.",
      expression: "laughing",
    },
  ],

  browsing: [
    {
      id: "steve.lib.browse.1",
      text: "Totally fine, browse away. When you want recs, hit the bubbles — or name literally anything you're into. Dinosaurs. Basketball. Whatever.",
      expression: "neutral",
    },
    {
      id: "steve.lib.browse.2",
      text: "Just scoping the shelves? Respect. Best customers always browse first. I'll be here. Fixing my hair. It doesn't need fixing. I'll be here anyway.",
      expression: "laughing",
    },
  ],
};
