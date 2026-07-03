import type { LinePack } from "../types";

/**
 * VOICE — Luffy (One Piece), library edition.
 * Books are treasure; the library is an island. Easter eggs everywhere:
 * Robin the archaeologist reads everything, Nami's maps, Poneglyphs,
 * Ohara, Shanks, niku. Romaji + translation in dialogue lines, subs-style.
 *
 * pitch.frame lines interpolate {bookTitle} and {genreStinger}.
 * why.* keys voice the ranking reasons on each card; pick.first/pick.backup
 * are card kickers; teaser.fallback covers books with no description.
 */
export const luffyLibrary: LinePack = {
  greeting: [
    {
      id: "luffy.lib.greet.1",
      text: "OI! The treasure room! Hon wa takara da! (Books are treasure!) Robin taught me that — she'd trade ME for a good book. Want me to find yours?",
      expression: "excited",
    },
    {
      id: "luffy.lib.greet.2",
      text: "Shishishi! Book hunt? Yosha! (Alright!) I've got a nose for treasure — it's how I found this whole library. And you!",
      expression: "laughing",
    },
    {
      id: "luffy.lib.greet.3",
      text: "A library's like a meat buffet for your brain. Tabehoudai! (All you can eat!) What flavor are you hungry for?",
      expression: "excited",
    },
    {
      id: "luffy.lib.greet.4",
      text: "Yosh! Robin says every book is an island someone folded up small. Dore ni suru? (Which one will you pick?)",
      expression: "neutral",
    },
  ],

  "genre.picked.fantasy": [
    {
      id: "luffy.lib.g.fantasy.1",
      text: "FANTASY! Mahou da! (Magic!) Dragons, curses, impossible stuff — basically my Tuesday! Now: fast and wild, or slow and cozy?",
      expression: "excited",
    },
    {
      id: "luffy.lib.g.fantasy.2",
      text: "Magic worlds?! Seikai! (Correct answer!) I ate a magic fruit once and look how great that turned out! What speed are we sailing?",
      expression: "laughing",
    },
  ],
  "genre.picked.mystery": [
    {
      id: "luffy.lib.g.mystery.1",
      text: "A mystery! Himitsu da! (A secret!) Somebody's hiding the treasure and YOU get to sniff it out — like Robin with the Poneglyphs! What pace?",
      expression: "excited",
    },
    {
      id: "luffy.lib.g.mystery.2",
      text: "Ooooh, secrets! I'm terrible at keeping them and GREAT at finding them. Kiite! (Listen!) — fast read or thoughtful one?",
      expression: "laughing",
    },
  ],
  "genre.picked.adventure": [
    {
      id: "luffy.lib.g.adventure.1",
      text: "ADVENTURE!! Bouken da!! (Adventure!!) That's not a genre, that's a LIFESTYLE! Okay okay — how fast do you want it?",
      expression: "excited",
    },
    {
      id: "luffy.lib.g.adventure.2",
      text: "YES! Journeys, storms, crews! Omae, wakatteru na! (You GET it!) Now pick your speed!",
      expression: "proud",
    },
  ],
  "genre.picked.realworld": [
    {
      id: "luffy.lib.g.realworld.1",
      text: "Real stuff! Honto no hanashi! (True stories!) Robin says real history is the biggest treasure — people literally burned Ohara over it. Heavy! What pace?",
      expression: "thinking",
    },
    {
      id: "luffy.lib.g.realworld.2",
      text: "Facts and real things! Smart pick — real maps beat fake ones, ask Nami. How fast a read?",
      expression: "neutral",
    },
  ],
  "genre.picked.fiction": [
    {
      id: "luffy.lib.g.fiction.1",
      text: "Stories! Made-up worlds with real feelings inside. Usopp does that daily and we love him anyway! What speed?",
      expression: "excited",
    },
    {
      id: "luffy.lib.g.fiction.2",
      text: "Fiction, ii ne! (nice!) Someone dreamed a whole world just so you could visit. Sugee! (Amazing!) Pace next!",
      expression: "laughing",
    },
  ],
  "genre.picked.other": [
    {
      id: "luffy.lib.g.other.1",
      text: "Going off the map! Sasuga! (That's my crew!) The best islands aren't on ANY chart — that's Grand Line rule number one! What pace?",
      expression: "excited",
    },
    {
      id: "luffy.lib.g.other.2",
      text: "A mystery course! Yosha, kaze ni makasero! (Alright, trust the wind!) Now — how fast a read do you want?",
      expression: "laughing",
    },
  ],

  "pace.picked": [
    {
      id: "luffy.lib.pace.1",
      text: "Got it! Saigo no shitsumon! (Last question!) Familiar waters, or a totally new island?",
      expression: "neutral",
    },
    {
      id: "luffy.lib.pace.2",
      text: "Noted! Now: more of what you love, or uncharted seas? Both have treasure, honto! (really!)",
      expression: "excited",
    },
    {
      id: "luffy.lib.pace.3",
      text: "Okay okay! One more — do we sail home waters or somewhere brand new?",
      expression: "thinking",
    },
  ],

  "novelty.picked": [
    {
      id: "luffy.lib.novelty.1",
      text: "YOSH! Gimme one second — treasure-sense, activate... kunkunkun... (sniff sniff sniff...)",
      expression: "thinking",
    },
    {
      id: "luffy.lib.novelty.2",
      text: "That's everything I need! Sagashiteru... (searching...) shishishi, I'm SO good at this part...",
      expression: "excited",
    },
  ],

  "pitch.frame": [
    {
      id: "luffy.lib.pitch.1",
      text: "MITSUKETA! (FOUND IT!) {bookTitle}! {genreStinger} If a book smells this good, you READ it!",
      expression: "excited",
    },
    {
      id: "luffy.lib.pitch.2",
      text: "OI, LISTEN UP! {bookTitle}. {genreStinger} I'd bet my hat on this one — and Shanks would come get me if I lost that hat!",
      expression: "excited",
    },
    {
      id: "luffy.lib.pitch.3",
      text: "Takara hakken! (Treasure spotted!) {bookTitle}. {genreStinger} Your next adventure's sitting RIGHT there!",
      expression: "proud",
    },
    {
      id: "luffy.lib.pitch.4",
      text: "Shishishi! {bookTitle}! {genreStinger} Hayaku! (Hurry!) Grab it before some other pirate does!",
      expression: "laughing",
    },
    {
      id: "luffy.lib.pitch.5",
      text: "Kore da!! (This is it!!) {bookTitle}. {genreStinger} My treasure-sense is NEVER wrong. Except that one time. And that other time. About BOOKS it's never wrong!",
      expression: "excited",
    },
    {
      id: "luffy.lib.pitch.6",
      text: "Here's the haul! Top prize: {bookTitle}. {genreStinger} Check the backups below too — a good senchou (captain) always gives the crew options!",
      expression: "proud",
    },
  ],

  "pitch.genreStinger.fantasy": [
    {
      id: "luffy.lib.st.fantasy.1",
      text: "It's got magic in it, which means ANYTHING can happen — best rule in any world!",
    },
    {
      id: "luffy.lib.st.fantasy.2",
      text: "A whole magic world folded up small, waiting for you to unfold it!",
    },
  ],
  "pitch.genreStinger.mystery": [
    {
      id: "luffy.lib.st.mystery.1",
      text: "Somebody in there is hiding something, and YOU get to catch 'em red-handed!",
    },
    {
      id: "luffy.lib.st.mystery.2",
      text: "There's a secret buried in this one — and secrets are just treasure wearing a disguise!",
    },
  ],
  "pitch.genreStinger.adventure": [
    {
      id: "luffy.lib.st.adventure.1",
      text: "It's a journey with danger and nakama in it — basically my whole life, in book form!",
    },
    {
      id: "luffy.lib.st.adventure.2",
      text: "This one MOVES — you'll be three islands deep before you even notice!",
    },
  ],
  "pitch.genreStinger.realworld": [
    {
      id: "luffy.lib.st.realworld.1",
      text: "And get this — it's REAL! Real people really did this stuff! No Devil Fruit required!",
    },
    {
      id: "luffy.lib.st.realworld.2",
      text: "True stories are the wildest ones — nobody could've made them up, not even Usopp!",
    },
  ],
  "pitch.genreStinger.fiction": [
    {
      id: "luffy.lib.st.fiction.1",
      text: "It's a made-up world with real heart in it — the good kind of trick!",
    },
    {
      id: "luffy.lib.st.fiction.2",
      text: "Someone dreamed this whole thing up just for readers like you. Take the gift!",
    },
  ],
  "pitch.genreStinger.other": [
    {
      id: "luffy.lib.st.other.1",
      text: "It's off the usual map — which is EXACTLY where the good stuff hides!",
    },
    {
      id: "luffy.lib.st.other.2",
      text: "Bit of a wildcard, this one — and wildcards win adventures!",
    },
  ],

  // --- Card voice: kickers ---------------------------------------------------
  "pick.first": [
    { id: "luffy.lib.pick1.1", text: "Senchou's Pick" },
    { id: "luffy.lib.pick1.2", text: "The Big Treasure" },
    { id: "luffy.lib.pick1.3", text: "Eat This One First" },
  ],
  "pick.backup": [
    { id: "luffy.lib.pick2.1", text: "Also Shiny" },
    { id: "luffy.lib.pick2.2", text: "Crew's Choice" },
    { id: "luffy.lib.pick2.3", text: "Second Helping" },
  ],

  // --- Card voice: why-you'll-like-it, per ranking reason --------------------
  "why.genreMatch": [
    { id: "luffy.lib.why.genre.1", text: "You asked for {genre} and this one's SOAKED in it. Direct hit!" },
    { id: "luffy.lib.why.genre.2", text: "This is exactly the {genre} island you pointed at. Nami-level navigation!" },
  ],
  "why.moodMatch": [
    { id: "luffy.lib.why.mood.1", text: "It's got that {vibe} taste you wanted — I checked. With my face." },
    { id: "luffy.lib.why.mood.2", text: "Smells strongly of {vibe}. My treasure-sense doesn't lie about flavors!" },
  ],
  "why.history": [
    { id: "luffy.lib.why.hist.1", text: "It's cousins with books you already loved. Same crew, new adventure!" },
    { id: "luffy.lib.why.hist.2", text: "You liked stuff like this before — and a pirate never forgets a good haul!" },
  ],
  "why.fiction": [
    { id: "luffy.lib.why.fic.1", text: "It's a story-story — a whole world someone built just for you to raid!" },
    { id: "luffy.lib.why.fic.2", text: "Made-up world, real feelings. The best kind of trap!" },
  ],
  "why.token": [
    { id: "luffy.lib.why.tok.1", text: "You said \"{token}\" and this book basically stood up and yelled OI, THAT'S ME!" },
    { id: "luffy.lib.why.tok.2", text: "It's got \"{token}\" written all over it. You summoned this one yourself!" },
  ],
  "why.fresh": [
    { id: "luffy.lib.why.fresh.1", text: "It's a new island — nobody in your logbook has been here yet. First landing rights!" },
    { id: "luffy.lib.why.fresh.2", text: "Fresh pick! Uncharted! That's where the BIG treasure hides!" },
  ],
  "why.fallback": [
    { id: "luffy.lib.why.fall.1", text: "My gut says yes. My gut found the Grand Line. Trust the gut!" },
    { id: "luffy.lib.why.fall.2", text: "No fancy reason — sometimes the wind just points at a book. Sail with it!" },
  ],

  "teaser.fallback": [
    { id: "luffy.lib.teaser.1", text: "Nobody's written the map for {bookTitle} yet — a real mystery island! You get to explore it FIRST and tell the crew what's inside!" },
    { id: "luffy.lib.teaser.2", text: "{bookTitle} is an unopened treasure chest. Could be gold, could be a Sea King. Only one way to find out!" },
  ],

  postStartReading: [
    {
      id: "luffy.lib.start.1",
      text: "IKE IKE IKE! (GO GO GO!) Read {bookTitle} and tell me EVERYTHING when you're done!",
      expression: "excited",
    },
    {
      id: "luffy.lib.start.2",
      text: "YOSHA! {bookTitle} is yours! First page is the hardest — after that it's all wind in the sails. Shuppatsu! (Set sail!)",
      expression: "proud",
    },
    {
      id: "luffy.lib.start.3",
      text: "Shishishi! New adventure begins! Don't stay up ALL night reading. Or do! I'm a pirate, not your bedtime!",
      expression: "laughing",
    },
    {
      id: "luffy.lib.start.4",
      text: "Takara GET! (Treasure GET!) I knew you'd pick a good one. Captain's instinct!",
      expression: "excited",
    },
    {
      id: "luffy.lib.start.5",
      text: "It's official — you and {bookTitle} are nakama now! (crewmates now!) Take care of each other!",
      expression: "proud",
    },
  ],

  noMatches: [
    {
      id: "luffy.lib.nomatch.1",
      text: "Nnn! Nai! (Nothing!) The treasure room's empty for that flavor. Turn the ship — pick another mood and I'll hunt again!",
      expression: "thinking",
    },
    {
      id: "luffy.lib.nomatch.2",
      text: "Oi, no islands in that direction yet! Even the Log Pose is shrugging. Ask your coach to stock more books, or let's try a new course!",
      expression: "neutral",
    },
    {
      id: "luffy.lib.nomatch.3",
      text: "Shishishi... hara hetta... (I'm hungry...) and the fridge is empty for that one! Change the search and we go again!",
      expression: "laughing",
    },
  ],

  browsing: [
    {
      id: "luffy.lib.browse.1",
      text: "Wakatta! (Got it!) When you want the good stuff, hit the bubbles — or name literally ANYTHING you love and I'll hunt it down!",
      expression: "neutral",
    },
    {
      id: "luffy.lib.browse.2",
      text: "Just browsing? Ii yo! (That's fine!) Robin browses for HOURS. The treasure will wait — it's very patient!",
      expression: "laughing",
    },
  ],
};
