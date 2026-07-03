import type { LinePack } from "../types";

/**
 * VOICE — Luffy (One Piece)
 * Loud, simple, hungry, zero doubt. Every line is an easter egg for fans:
 * Gomu Gomu, the crew (Zoro getting lost, Sanji's cooking, Nami's maps,
 * Usopp's tall tales, Chopper's wiggle), Shanks' hat, the Grand Line, niku.
 * Dialogue lines carry romaji Japanese with the English right after —
 * "Yosha! (Alright!)" — like watching subs. Choice labels stay plain.
 * Default expression: excited.
 */
export const luffyPlanner: LinePack = {
  greeting: [
    // Sprint ending soon — highest priority, fires over everything else.
    {
      id: "luffy.pl.greet.end.1",
      text: "Oi!! Only {sprintDaysLeft} days left! Ikuzo! (Let's go!) This is like the last stretch of the Grand Line — you don't slow down, you SPEED UP!",
      expression: "excited",
      priority: 10,
      when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
    },
    {
      id: "luffy.pl.greet.end.2",
      text: "{sprintDaysLeft} days to go! Akiramenai! (Never give up!) Even when Crocodile beat me twice, I came back for round three. Finish this!",
      expression: "proud",
      priority: 10,
      when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
    },
    {
      id: "luffy.pl.greet.end.3",
      text: "Final {sprintDaysLeft} days!! Gear Second time! Shuuuu... okay I can't actually do the steam thing. But YOU can go fast!",
      expression: "excited",
      priority: 10,
      when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
    },
    // First open of the day — beats generic return greetings.
    {
      id: "luffy.pl.greet.first.1",
      text: "Ohayou! (Morning!) I already ate three breakfasts waiting for you. Sanji would be proud. Or angry. Probably angry. What's the plan?!",
      expression: "laughing",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "luffy.pl.greet.first.2",
      text: "OI! First one on deck! Yosha! (Alright!) A new day is like a new island — nobody knows what treasure's on it yet!",
      expression: "excited",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "luffy.pl.greet.first.3",
      text: "You're up! Shishishi! Nami says a good navigator checks the map before sailing. I never do it. That's why we need YOU to.",
      expression: "laughing",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "luffy.pl.greet.first.4",
      text: "Morning, nakama! (crewmate!) Today smells like adventure. Or meat. Adventure-meat! Let's plan it!",
      expression: "excited",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "luffy.pl.greet.first.5",
      text: "Yoosh, you made it! Zoro left to find this page an hour ago. He's still lost. You? Right on time! Sasuga! (As expected!)",
      expression: "laughing",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    // Generic return greetings.
    {
      id: "luffy.pl.greet.ret.1",
      text: "Oi, okaeri! (Welcome back!) Checking the map twice — you're more navigator than me already. What's next?",
      expression: "laughing",
    },
    {
      id: "luffy.pl.greet.ret.2",
      text: "You again! Yokatta! (Great!) A captain who shows up is already halfway to the One Piece. Whatcha need?",
      expression: "excited",
    },
    {
      id: "luffy.pl.greet.ret.3",
      text: "Yo! Back on deck! New goal? Marking stuff done? Ore ni makasero! (Leave it to me!)",
      expression: "neutral",
    },
    {
      id: "luffy.pl.greet.ret.4",
      text: "Shishishi, hisashiburi! (Long time no see!) ...It's been like an hour. Felt long. I got hungry twice.",
      expression: "laughing",
    },
  ],

  "offer.duplicateRoutine": [
    {
      id: "luffy.pl.dup.offer.1",
      text: "Oi, matte! (Wait!) Your last voyage's routine was GOOD. Same crew, same course? Usopp says only fools change a winning plan, and he's lied about everything except that.",
      expression: "excited",
    },
    {
      id: "luffy.pl.dup.offer.2",
      text: "I kept your old treasure map! Mou ikkai? (One more time?) A course that worked once sails even smoother the second time!",
      expression: "thinking",
    },
    {
      id: "luffy.pl.dup.offer.3",
      text: "Shishishi, I remember last sprint's plan! It was strong, like Sanji's curry. Wanna run it back for this voyage?",
      expression: "laughing",
    },
  ],

  "goal.askActivity": [
    {
      id: "luffy.pl.act.1",
      text: "So! Nani o suru? (What'll you do?) Pick your adventure below or shout your own — I'm not picky. Except about meat. Meat I'm picky about.",
      expression: "excited",
    },
    {
      id: "luffy.pl.act.2",
      text: "New goal time! When Shanks gave me this hat, I made ONE promise and never let go. What's YOUR one thing this sprint?",
      expression: "proud",
    },
    {
      id: "luffy.pl.act.3",
      text: "Okay okay — pick the thing you wanna get great at! Zoro swings swords 10,000 times a day. You just need to pick YOUR swing!",
      expression: "neutral",
    },
    {
      id: "luffy.pl.act.4",
      text: "Every legend starts with someone deciding. Kimeta? (Decided?) Point at one below or tell me straight!",
      expression: "excited",
    },
  ],

  "goal.askActivityVague": [
    {
      id: "luffy.pl.vague.1",
      text: "Eeeh?? 'Stuff' isn't on any treasure map I've seen! Motto hakkiri! (Be clearer!) What's the ACTUAL thing you'll do?",
      expression: "thinking",
    },
    {
      id: "luffy.pl.vague.2",
      text: "Oi, that's foggier than the Florian Triangle! Even Brook couldn't see through that. Gimme the real thing — what will you DO?",
      expression: "thinking",
    },
    {
      id: "luffy.pl.vague.3",
      text: "Shishishi, wakaranai! (I don't get it!) My brain's rubber, not psychic! Say it like a battle cry: 'I will ____!'",
      expression: "laughing",
    },
    {
      id: "luffy.pl.vague.4",
      text: "Nnn? Usopp tells clearer stories and his are all made up! Pick one below or say it plain, captain!",
      expression: "neutral",
    },
  ],

  "goal.askDuration": [
    {
      id: "luffy.pl.dur.1",
      text: "{activity}! Umai choice! (Tasty choice!) How long each time? Even I sat still for two years to train. Okay, that was Ace's idea. Still counts!",
      expression: "excited",
    },
    {
      id: "luffy.pl.dur.2",
      text: "Yosha, {activity} da! (It's {activity}!) How much time per go? Pick one!",
      expression: "neutral",
    },
    {
      id: "luffy.pl.dur.3",
      text: "Ooooh, {activity}! Chopper trains a little every day and he turned into a doctor AND a reindeer tank. Small and steady! How long per session?",
      expression: "proud",
    },
  ],

  "goal.retryDuration": [
    {
      id: "luffy.pl.retrydur.1",
      text: "Eeeh? Wakannai! (I don't get it!) My rubber brain needs it simple — say it like '30 minutes' or just poke a bubble!",
      expression: "thinking",
    },
    {
      id: "luffy.pl.retrydur.2",
      text: "Nnn?? That went straight over my hat! Try a number, like '20 minutes' — or tap one below, that always works!",
      expression: "laughing",
    },
  ],

  "goal.askSchedule": [
    {
      id: "luffy.pl.sched.1",
      text: "Now — which days? Mainichi! (Every day!) is the pirate way, but Nami says pace yourself or you end up owing her money somehow.",
      expression: "excited",
    },
    {
      id: "luffy.pl.sched.2",
      text: "When do we do this thing? Pick your battle days! Itsu yaru? (When will you do it?)",
      expression: "neutral",
    },
    {
      id: "luffy.pl.sched.3",
      text: "Days, days, days... a plan without days is like the Going Merry without a rudder! Which ones?",
      expression: "thinking",
    },
  ],

  "goal.retrySchedule": [
    {
      id: "luffy.pl.retrysched.1",
      text: "Muzukashii! (Too hard!) Say it like 'weekdays' or 'mon wed fri' — or just smack one of the bubbles!",
      expression: "thinking",
    },
    {
      id: "luffy.pl.retrysched.2",
      text: "Oi oi, even Nami's maps are easier to read than that! Which days — like 'every day' or 'weekends'? Bubbles work too!",
      expression: "laughing",
    },
  ],

  "goal.confirmRecap": [
    {
      id: "luffy.pl.confirm.1",
      text: "HERE'S THE PLAN: {activity}, {when}, {howLong} each time. Kanpeki! (Perfect!) I'd bet my hat on it — and Shanks TRUSTED me with this hat!",
      expression: "proud",
    },
    {
      id: "luffy.pl.confirm.2",
      text: "So: {activity} — {when} — {howLong} a go. Shishishi, ii ne! (Nice!) Shall we stamp it with the Jolly Roger?",
      expression: "laughing",
    },
    {
      id: "luffy.pl.confirm.3",
      text: "Check it: {activity}, {when}, {howLong} each. Say the word, senchou! (captain!) and it's official!",
      expression: "excited",
    },
    {
      id: "luffy.pl.confirm.4",
      text: "One treasure map, ready! {activity} • {when} • {howLong}. Kore da! (This is it!) Nail it to the mast?",
      expression: "proud",
    },
  ],

  "goal.created": [
    {
      id: "luffy.pl.created.1",
      text: "YOSHA!! It's on the board! Omae wa {goalTitle} no ou ni naru! (You're gonna be the Ruler of {goalTitle}!) I officially declared it, so it's real now!",
      expression: "excited",
    },
    {
      id: "luffy.pl.created.2",
      text: "Goal set! Shishishi! Yatta ne! (You did it!) I believe in you more than I believe in dessert. And I ONCE FOUGHT A WHOLE CREW for dessert.",
      expression: "laughing",
    },
    {
      id: "luffy.pl.created.3",
      text: "Locked in! Now the fun part — DOING it! Tanoshimi da na~! (I can't wait!) That's my favorite part after eating!",
      expression: "excited",
    },
    {
      id: "luffy.pl.created.4",
      text: "It's official! Nakama da! (We're crew!) And when someone on my crew has a dream, that dream is mine to protect too. Corny? Don't care!",
      expression: "proud",
    },
    {
      id: "luffy.pl.created.5",
      text: "New goal on the map! Ganbarou! (Let's do our best!) The hardest part was deciding. The rest is just adventure!",
      expression: "proud",
    },
  ],

  "goal.duplicated": [
    {
      id: "luffy.pl.dupd.1",
      text: "Copied! Mou ichido! (Once more!) If a course worked once, it'll work TWICE as hard this time!",
      expression: "excited",
    },
    {
      id: "luffy.pl.dupd.2",
      text: "Shishishi! Futatsu! (Two of them!) Your goal's been cloned — and unlike the fake Straw Hats, this copy is legit!",
      expression: "laughing",
    },
    {
      id: "luffy.pl.dupd.3",
      text: "Done! A good map's worth sailing twice. Sou darou? (Right?)",
      expression: "proud",
    },
  ],

  "goal.imported": [
    {
      id: "luffy.pl.imp.1",
      text: "Brought it back! Okaeri, goal! (Welcome back, goal!) Old nakama make the best nakama!",
      expression: "excited",
    },
    {
      id: "luffy.pl.imp.2",
      text: "Yosh — your old goal's back on deck! It waited for you like the Merry waited at Water 7. ...Okay, happier ending this time!",
      expression: "laughing",
    },
  ],

  "goal.edited": [
    {
      id: "luffy.pl.edit.1",
      text: "Fixed! Naoshita! (Fixed it!) A captain who adjusts the sails beats a captain who sinks. Franky built that wisdom into the Sunny. SUPER!",
      expression: "proud",
    },
    {
      id: "luffy.pl.edit.2",
      text: "Changed! Shishishi, plans bend so YOU don't break. Gomu gomu no... wisdom! (Rubber rubber wisdom!) I just invented that!",
      expression: "laughing",
    },
  ],

  "task.done.single": [
    {
      id: "luffy.pl.done1.1",
      text: "Oi! One down! Yosha! (Alright!)",
      expression: "excited",
    },
    {
      id: "luffy.pl.done1.2",
      text: "Shishishi! Owatta! (Done!) You made that look easy!",
      expression: "laughing",
    },
    {
      id: "luffy.pl.done1.3",
      text: "Gomu Gomu no... CHECKMARK! (Rubber rubber checkmark!) Direct hit!",
      expression: "excited",
    },
    {
      id: "luffy.pl.done1.4",
      text: "One more win for the crew! Sono chōshi! (Keep it up!)",
      expression: "proud",
    },
    {
      id: "luffy.pl.done1.5",
      text: "Umai! (Nice!) My Haki tingled. That's how I know it was good.",
      expression: "excited",
    },
    {
      id: "luffy.pl.done1.6",
      text: "Nice!! Doing beats planning — Zoro's been 'planning' his way back to the ship for three hours.",
      expression: "laughing",
    },
  ],

  "task.done.multi": [
    {
      id: "luffy.pl.donem.1",
      text: "OI!! {tasksDoneToday} tasks?! Sugee!! (Amazing!!) You're gonna be King of the Productivity!",
      expression: "excited",
    },
    {
      id: "luffy.pl.donem.2",
      text: "{tasksDoneToday} down! Shishishi! Save some victories for the rest of the crew!",
      expression: "laughing",
    },
    {
      id: "luffy.pl.donem.3",
      text: "{tasksDoneToday} tasks?! That's a full-course feast! Sanji-level! Umai!! (Delicious!!)",
      expression: "excited",
    },
    {
      id: "luffy.pl.donem.4",
      text: "Whoa, {tasksDoneToday} already! Tsuyoi! (Strong!) That's Conqueror's-Haki-level focus!",
      expression: "proud",
    },
    {
      id: "luffy.pl.donem.5",
      text: "{tasksDoneToday}! I'd make you first mate, but you're clearly senchou (captain) material!",
      expression: "proud",
    },
  ],

  "task.done.allToday": [
    {
      id: "luffy.pl.doneall.1",
      text: "ZENBU?! (ALL OF THEM?!) Today is CONQUERED! BANQUET TONIGHT! Sanji, fire up the kitchen!!",
      expression: "excited",
    },
    {
      id: "luffy.pl.doneall.2",
      text: "Clean sweep!! Shishishi!! Not one task survived! Kaizoku-ou ni omae wa naru! (YOU'RE gonna be the Pirate King!) Wait, that's my line. Borrow it today!",
      expression: "laughing",
    },
    {
      id: "luffy.pl.doneall.3",
      text: "Everything done! You know what that means: NIKU! (MEAT!) Victory meat for the champion!",
      expression: "excited",
    },
    {
      id: "luffy.pl.doneall.4",
      text: "The whole board — beaten! When they write your wanted poster, the bounty's gonna be HUGE. Yakusoku da! (That's a promise!)",
      expression: "proud",
    },
  ],

  "streak.3": [
    {
      id: "luffy.pl.streak3.1",
      text: "{streakDays} days in a row! A streak! Mamore! (Protect it!) It's little, like Chopper — and just like Chopper, it'll grow into a MONSTER!",
      expression: "excited",
    },
    {
      id: "luffy.pl.streak3.2",
      text: "Three days straight! Shishishi, mikka! (three days!) Now it's a habit-shaped adventure!",
      expression: "laughing",
    },
  ],

  "streak.5": [
    {
      id: "luffy.pl.streak5.1",
      text: "{streakDays}-day streak?! Sugoi! (Incredible!) That's not luck — that's CREW DISCIPLINE!",
      expression: "proud",
    },
    {
      id: "luffy.pl.streak5.2",
      text: "Five days! Even Zoro's training schedule is jealous, and that guy lifts BUILDINGS!",
      expression: "excited",
    },
  ],

  "streak.7": [
    {
      id: "luffy.pl.streak7.1",
      text: "A WHOLE WEEK?! {streakDays} days! Isshuukan! (One week!) You're a legend of the seas now. I officialed it. Officially.",
      expression: "excited",
    },
    {
      id: "luffy.pl.streak7.2",
      text: "{streakDays} days straight! Shishishi!! When they tell YOUR story at Sabaody, I want to be in chapter one!",
      expression: "laughing",
    },
  ],

  "habit.created": [
    {
      id: "luffy.pl.habit.1",
      text: "New habit aboard! Do it enough and it does itself — like my stomach at dinnertime. Hara hetta... (I'm hungry...) see, it's doing it now!",
      expression: "laughing",
    },
    {
      id: "luffy.pl.habit.2",
      text: "Habit set! Chiisai koto mo mainichi! (Small things, every day!) That's how Zoro got scary and how Sanji got tasty. I mean his FOOD got tasty!",
      expression: "proud",
    },
    {
      id: "luffy.pl.habit.3",
      text: "Yosh, a new habit! I'll be watching. Like Robin watches everything. In a friendly way! Mostly!",
      expression: "excited",
    },
  ],

  "banter.betweenSteps": [
    {
      id: "luffy.pl.banter.1",
      text: "You know what I like about you? You show up and DO stuff. Sonna yatsu suki da! (I like people like that!) Rare treasure.",
      expression: "proud",
      modes: ["talkative"],
    },
    {
      id: "luffy.pl.banter.2",
      text: "One time I planned a whole week ahead. Then I ate the plan. Honto da yo! (It's true!) It was written on a meat wrapper. Anyway — onward!",
      expression: "laughing",
      modes: ["talkative"],
    },
    {
      id: "luffy.pl.banter.3",
      text: "Planning's like picking your crew — get it right and even the Grand Line feels easy. Sanji said that. While kicking someone.",
      expression: "neutral",
      modes: ["talkative"],
    },
    {
      id: "luffy.pl.banter.4",
      text: "Shishishi, tanoshii! (This is fun!) Goal-setting is secretly an adventure. Don't tell Zoro, he'll say it's boring and then get lost on the way out.",
      expression: "laughing",
      modes: ["talkative"],
    },
    {
      id: "luffy.pl.banter.5",
      text: "Rayleigh told me: the scariest sea is the one you never sail. Fukai! (Deep!) Okay — onward!",
      expression: "excited",
      modes: ["talkative"],
    },
  ],

  "error.generic": [
    {
      id: "luffy.pl.err.1",
      text: "Oi, something hiccuped! Gomen! (Sorry!) Not your fault — even the Sunny hits weird waves. One more time?",
      expression: "thinking",
    },
    {
      id: "luffy.pl.err.2",
      text: "Nnn? That didn't stick. Shishishi... mou ikkai! (One more time!) Hit it again, harder!",
      expression: "laughing",
    },
  ],
};
