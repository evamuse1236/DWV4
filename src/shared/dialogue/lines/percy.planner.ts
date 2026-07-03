import type { LinePack } from "../types";

/**
 * VOICE — Percy (Percy Jackson)
 * Wry first-person, mythology understatement, self-deprecating, loyal.
 * Every line is an easter egg: Riptide/Anaklusmos, blue food, Camp
 * Half-Blood, Chiron, Grover's enchiladas, Blackjack calling him "boss",
 * Mrs. O'Leary, capture the flag, the Lotus Casino, Tyson, dam jokes,
 * dyslexia-because-Ancient-Greek. Never mean, always has your back.
 * Default expression: neutral with laughing spikes.
 */
export const percyPlanner: LinePack = {
  greeting: [
    // Sprint ending soon — top priority.
    {
      id: "percy.pl.greet.end.1",
      text: "So, {sprintDaysLeft} days left. I once had until the summer solstice to find Zeus's master bolt or start World War Three. You've got homework. We're fine.",
      expression: "neutral",
      priority: 10,
      when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
    },
    {
      id: "percy.pl.greet.end.2",
      text: "{sprintDaysLeft} days on the clock. Deadlines used to freak me out. Then I met the actual Fates. THEY'RE a deadline. This is just a calendar.",
      expression: "laughing",
      priority: 10,
      when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
    },
    {
      id: "percy.pl.greet.end.3",
      text: "Final stretch — {sprintDaysLeft} days. This is the chapter where the hero digs deep. Uncap the pen. Metaphorically. Riptide stays capped indoors.",
      expression: "proud",
      priority: 10,
      when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
    },
    // First open of the day.
    {
      id: "percy.pl.greet.first.1",
      text: "Morning. Been up since dawn. Okay, that's a lie — Blackjack's been up since dawn, bugging me for donuts. Same thing. What's the plan, boss?",
      expression: "laughing",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "percy.pl.greet.first.2",
      text: "New day. At camp we'd start with sword drills before breakfast. Here we start with a plan. Statistically fewer stab wounds.",
      expression: "neutral",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "percy.pl.greet.first.3",
      text: "Hey, first check-in of the day. Chiron says how you start the morning decides the whole quest. He's a three-thousand-year-old horse-teacher, he'd know.",
      expression: "proud",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "percy.pl.greet.first.4",
      text: "Morning! Today's quest board is open. I checked it for hydras twice. Grover checked it a third time and then ate part of the board. It's clean.",
      expression: "laughing",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "percy.pl.greet.first.5",
      text: "You're up early-ish. Careful — that's how it starts. First you check your plan at dawn, next thing you know you're camp counselor of the year.",
      expression: "neutral",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    // Generic returns.
    {
      id: "percy.pl.greet.ret.1",
      text: "Back again? Good. Heroes check the map more than once. That's literally the only reason any of us are alive.",
      expression: "neutral",
    },
    {
      id: "percy.pl.greet.ret.2",
      text: "Hey. New goal, or just admiring your handiwork? Both count. Narcissus made a whole CAREER of the second one.",
      expression: "laughing",
    },
    {
      id: "percy.pl.greet.ret.3",
      text: "What's up? I was just standing here, heroically. Waiting. Like a statue in Medusa's garden, but with better circulation.",
      expression: "laughing",
    },
    {
      id: "percy.pl.greet.ret.4",
      text: "Welcome back. Annabeth says a plan reviewed twice is a plan half-done. She's annoyingly right about everything. Don't tell her I said either part.",
      expression: "thinking",
    },
  ],

  "offer.duplicateRoutine": [
    {
      id: "percy.pl.dup.offer.1",
      text: "Hold up — your last sprint's routine actually worked. When something works in my world, you do NOT question it. You laminate it. Run it back?",
      expression: "thinking",
    },
    {
      id: "percy.pl.dup.offer.2",
      text: "I kept your old plan. Like a quest trophy, but useful. Want the same routine this sprint?",
      expression: "neutral",
    },
    {
      id: "percy.pl.dup.offer.3",
      text: "New sprint, and your old routine's still solid. Reusing a winning strategy is what Athena kids call 'wisdom' and what I call 'obviously.' Want it?",
      expression: "proud",
    },
  ],

  "goal.askActivity": [
    {
      id: "percy.pl.act.1",
      text: "Alright, new quest. What's it going to be? Pick one below or tell me. And relax — no prophecy attached. I read the fine print this time.",
      expression: "laughing",
    },
    {
      id: "percy.pl.act.2",
      text: "So what are we training this sprint? Everyone at camp has their thing. Annabeth builds, Grover finds, I hit water at problems. What's yours?",
      expression: "neutral",
    },
    {
      id: "percy.pl.act.3",
      text: "Goal time. Pick something you'd actually enjoy — quests you hate go about as well as my first chariot race. There was a crash. There were harpies.",
      expression: "thinking",
    },
    {
      id: "percy.pl.act.4",
      text: "What's the mission? Small counts. My first quest started with 'get to the tree.' Then it escalated. Yours won't escalate. Probably.",
      expression: "laughing",
    },
  ],

  "goal.askActivityVague": [
    {
      id: "percy.pl.vague.1",
      text: "Okay, 'stuff' is what I tell my mom I'm doing when I'm actually fighting a manticore. It doesn't work on her either. What's the actual thing?",
      expression: "laughing",
    },
    {
      id: "percy.pl.vague.2",
      text: "The Oracle of Delphi speaks in riddles, and even SHE'S clearer than that. Straight answer, hero — what will you do?",
      expression: "thinking",
    },
    {
      id: "percy.pl.vague.3",
      text: "Hmm. I need specifics. Vague wording is how I ended up promising a god his flying shoes back. Long story. Specifics!",
      expression: "neutral",
    },
    {
      id: "percy.pl.vague.4",
      text: "Try it like this: 'I will ___.' One real thing in the blank. Even Tyson can do this one, and Tyson thinks peanut butter is a food group.",
      expression: "proud",
    },
  ],

  "goal.askDuration": [
    {
      id: "percy.pl.dur.1",
      text: "{activity} — solid. How long each time? Be honest. The gods respect honesty. Well, Hermes doesn't, but he's a thief, so.",
      expression: "neutral",
    },
    {
      id: "percy.pl.dur.2",
      text: "Nice, {activity}. Session length? Twenty focused minutes beat two distracted hours. Chiron said that. I stole it. Hermes would be proud.",
      expression: "thinking",
    },
    {
      id: "percy.pl.dur.3",
      text: "{activity}, good pick. How long per session? Pick something you can do even on a 'the Lotus Casino ate my week' kind of day.",
      expression: "laughing",
    },
  ],

  "goal.retryDuration": [
    {
      id: "percy.pl.retrydur.1",
      text: "Uh — my brain's hardwired for Ancient Greek, and that wasn't either language. Try a number, like '30 minutes'? Bubbles work too.",
      expression: "thinking",
    },
    {
      id: "percy.pl.retrydur.2",
      text: "That one got past me like Clarisse on a bad day. Say it like '15 minutes' — or just tap a bubble, zero shame in it.",
      expression: "laughing",
    },
  ],

  "goal.askSchedule": [
    {
      id: "percy.pl.sched.1",
      text: "Which days? Camp schedule taught me the days matter less than showing up on them. Also that Fridays are for capture the flag. Non-negotiable.",
      expression: "neutral",
    },
    {
      id: "percy.pl.sched.2",
      text: "Now the schedule. Pick your training rotation — even Mrs. O'Leary gets walked on a schedule, and she's a five-ton hellhound.",
      expression: "laughing",
    },
    {
      id: "percy.pl.sched.3",
      text: "When's this happening? Pick the days. Future you will either send you a thank-you card or an Iris-message full of complaints.",
      expression: "thinking",
    },
  ],

  "goal.retrySchedule": [
    {
      id: "percy.pl.retrysched.1",
      text: "Hm, didn't parse. And I once translated a prophecy mid-swordfight. Try 'weekdays' or 'mon wed fri' — or the bubbles are right there.",
      expression: "thinking",
    },
    {
      id: "percy.pl.retrysched.2",
      text: "That flew over my head like Blackjack after too many donuts. Which days — 'every day'? 'weekends'? Bubble-tap totally counts.",
      expression: "laughing",
    },
  ],

  "goal.confirmRecap": [
    {
      id: "percy.pl.confirm.1",
      text: "Here's the quest scroll: {activity}, {when}, {howLong} each. Clearer than any prophecy I've ever gotten, and mine usually rhyme ominously. Seal it?",
      expression: "proud",
    },
    {
      id: "percy.pl.confirm.2",
      text: "So — {activity} — {when} — {howLong} a session. No riddles, no fine print, no goat sacrifice required. Make it official?",
      expression: "neutral",
    },
    {
      id: "percy.pl.confirm.3",
      text: "The plan: {activity}, {when}, {howLong} each time. I've walked into Tartarus with worse plans. WAY worse. Lock it in?",
      expression: "laughing",
    },
    {
      id: "percy.pl.confirm.4",
      text: "Read it back: {activity} • {when} • {howLong}. Even Annabeth couldn't tighten this up. Okay, she could, but barely. Stamp it?",
      expression: "thinking",
    },
  ],

  "goal.created": [
    {
      id: "percy.pl.created.1",
      text: "Done. It's official. Somewhere on Olympus, Athena just nodded approvingly at your planning. Please never tell her I invoked her name. Or Annabeth.",
      expression: "laughing",
    },
    {
      id: "percy.pl.created.2",
      text: "Quest accepted. For the record: deciding is the scariest part, and you just did it. That's the stuff they burn shrouds about. In the GOOD way.",
      expression: "proud",
    },
    {
      id: "percy.pl.created.3",
      text: "Goal's on the board. Hey — if a kid with dyslexia and ADHD can save the world a couple times, you can absolutely do this. That's not a pep talk, it's math.",
      expression: "neutral",
    },
    {
      id: "percy.pl.created.4",
      text: "Locked in. This calls for blue cookies. My mom makes them blue because someone said it was impossible. That's the whole family philosophy, actually.",
      expression: "laughing",
    },
    {
      id: "percy.pl.created.5",
      text: "Sealed. New quest, clean scroll, zero monsters attached. I checked the fine print twice. I ALWAYS check the fine print now.",
      expression: "proud",
    },
  ],

  "goal.duplicated": [
    {
      id: "percy.pl.dupd.1",
      text: "Copied. A winning strategy, used twice. Athena kids call it wisdom. Ares kids call it cheating. Ares kids are wrong about most things.",
      expression: "laughing",
    },
    {
      id: "percy.pl.dupd.2",
      text: "Duplicate made. Same quest, fresh start — like round two of capture the flag, except this time you KNOW where the flag is.",
      expression: "neutral",
    },
    {
      id: "percy.pl.dupd.3",
      text: "Done — cloned it. And unlike everything else in Greek mythology that got duplicated, this one won't try to fight you.",
      expression: "laughing",
    },
  ],

  "goal.imported": [
    {
      id: "percy.pl.imp.1",
      text: "Brought it back from the archives. Old quests returning for a sequel — extremely on brand for my life. At least yours won't have a Titan in it.",
      expression: "laughing",
    },
    {
      id: "percy.pl.imp.2",
      text: "Imported. Your old goal swam back like it never left. Son-of-Poseidon privileges — things return to me. Mostly water. Sometimes goals.",
      expression: "neutral",
    },
  ],

  "goal.edited": [
    {
      id: "percy.pl.edit.1",
      text: "Updated. Adjusting mid-quest is what keeps heroes alive. The ones who didn't adjust are constellations now. Pretty, but dead.",
      expression: "thinking",
    },
    {
      id: "percy.pl.edit.2",
      text: "Changed and saved. Plans should bend like Riptide returns — automatically, and right when you need it.",
      expression: "proud",
    },
  ],

  "task.done.single": [
    {
      id: "percy.pl.done1.1",
      text: "One down. Clean strike. Riptide-approved.",
      expression: "proud",
    },
    {
      id: "percy.pl.done1.2",
      text: "Task complete. See? No monsters. I told you and I was right. Rare, but it happens.",
      expression: "laughing",
    },
    {
      id: "percy.pl.done1.3",
      text: "Done. One small win — that's how every quest snowballs. Trust the snowball.",
      expression: "neutral",
    },
    {
      id: "percy.pl.done1.4",
      text: "Nice. Straight into the 'actually did it' column. Grover would bleat with joy. That's high praise, satyr-wise.",
      expression: "laughing",
    },
    {
      id: "percy.pl.done1.5",
      text: "Checked off. Quiet wins add up. Ask anyone who's ever cleaned the Poseidon cabin. So... me. Ask me.",
      expression: "proud",
    },
    {
      id: "percy.pl.done1.6",
      text: "Boom. Done. I've watched actual gods procrastinate for centuries. You're beating gods right now.",
      expression: "laughing",
    },
  ],

  "task.done.multi": [
    {
      id: "percy.pl.donem.1",
      text: "{tasksDoneToday} tasks today? I fought the Minotaur in the rain with no sword, and honestly? Your Tuesday is more impressive.",
      expression: "laughing",
    },
    {
      id: "percy.pl.donem.2",
      text: "{tasksDoneToday} down. That's momentum. Guard it like it's the last blue cookie.",
      expression: "proud",
    },
    {
      id: "percy.pl.donem.3",
      text: "{tasksDoneToday} already? Somewhere, Ares just got nervous and pretended he didn't.",
      expression: "laughing",
    },
    {
      id: "percy.pl.donem.4",
      text: "That's {tasksDoneToday} today. At camp that earns you first pick at the campfire. Here it earns you my genuine respect, which is harder to get.",
      expression: "neutral",
    },
    {
      id: "percy.pl.donem.5",
      text: "{tasksDoneToday} tasks. Even the Hunters of Artemis would nod slightly. That's their version of a standing ovation.",
      expression: "proud",
    },
  ],

  "task.done.allToday": [
    {
      id: "percy.pl.doneall.1",
      text: "Everything. Done. The whole board. I've cleared actual Labyrinth levels less thoroughly than you just cleared this day.",
      expression: "laughing",
    },
    {
      id: "percy.pl.doneall.2",
      text: "Full clear. If this were Camp Half-Blood they'd burn a shroud in your honor. It sounds bad. It's a compliment. Camp is weird.",
      expression: "proud",
    },
    {
      id: "percy.pl.doneall.3",
      text: "All tasks done. Go rest, hero. Even Hercules took breaks. Mostly to cause new problems, but the breaks themselves? Solid idea.",
      expression: "neutral",
    },
    {
      id: "percy.pl.doneall.4",
      text: "Board's clean. Days like this are why Chiron keeps a 'ones to watch' list. You're on my version of it.",
      expression: "proud",
    },
  ],

  "streak.3": [
    {
      id: "percy.pl.streak3.1",
      text: "{streakDays} days in a row. That's a streak. Small — but so was the fire Prometheus stole, and that one worked out great for everyone except Prometheus.",
      expression: "thinking",
    },
    {
      id: "percy.pl.streak3.2",
      text: "Three straight days. Keep this up and I'm nominating you for senior counselor. The paperwork is one high-five.",
      expression: "laughing",
    },
  ],

  "streak.5": [
    {
      id: "percy.pl.streak5.1",
      text: "{streakDays}-day streak. Consistency like that is rarer than a quiet family dinner on Olympus. And those happen NEVER.",
      expression: "proud",
    },
    {
      id: "percy.pl.streak5.2",
      text: "Five days straight. The Hunters of Artemis are impressed, and they're impressed by nothing. Artemis herself checked twice.",
      expression: "laughing",
    },
  ],

  "streak.7": [
    {
      id: "percy.pl.streak7.1",
      text: "{streakDays} days. A full week, unbroken. That's not a streak anymore — that's the kind of thing they put in the camp orientation film.",
      expression: "proud",
    },
    {
      id: "percy.pl.streak7.2",
      text: "Seven straight days. If demigods got constellations for consistency, you'd be up there next to Zoë. That's the highest honor I know.",
      expression: "neutral",
    },
  ],

  "habit.created": [
    {
      id: "percy.pl.habit.1",
      text: "New habit, registered. Little daily rituals got me through camp. That and blue food. Mostly the rituals. Okay — fifty-fifty.",
      expression: "laughing",
    },
    {
      id: "percy.pl.habit.2",
      text: "Habit's set. Do it daily and one day it's just... who you are. Like Riptide coming back to my pocket. Automatic.",
      expression: "proud",
    },
    {
      id: "percy.pl.habit.3",
      text: "Done. A habit is a promise to tomorrow-you. Tomorrow-you is counting on it, and unlike the gods, you actually keep promises.",
      expression: "neutral",
    },
  ],

  "banter.betweenSteps": [
    {
      id: "percy.pl.banter.1",
      text: "You know what every quest taught me? Half of winning is deciding to show up. The other half is Annabeth. You've got the first half handled.",
      expression: "proud",
      modes: ["talkative"],
    },
    {
      id: "percy.pl.banter.2",
      text: "Annabeth plans EVERYTHING. Color-coded. Laminated. It's exhausting. It also works every single time, which is honestly worse.",
      expression: "laughing",
      modes: ["talkative"],
    },
    {
      id: "percy.pl.banter.3",
      text: "Fun fact: I did zero planning for my trip to the Underworld and nearly got dissolved. This is me formally endorsing plans. All of them. Even bad ones.",
      expression: "laughing",
      modes: ["talkative"],
    },
    {
      id: "percy.pl.banter.4",
      text: "Water break. Son of Poseidon thing — it literally recharges me. You should hydrate too. Non-negotiable. Okay, back to it.",
      expression: "neutral",
      modes: ["talkative"],
    },
    {
      id: "percy.pl.banter.5",
      text: "Between us? Heroes aren't braver than everyone else. They just keep going. Grover taught me that, usually while running away screaming. Still counts.",
      expression: "thinking",
      modes: ["talkative"],
    },
  ],

  "error.generic": [
    {
      id: "percy.pl.err.1",
      text: "Huh. Something glitched. Probably Hermes running his delivery service through the wires again. Try that once more?",
      expression: "thinking",
    },
    {
      id: "percy.pl.err.2",
      text: "That didn't go through. It's not an omen. I know omens — they smell worse. Just tech. One more time.",
      expression: "neutral",
    },
  ],
};
