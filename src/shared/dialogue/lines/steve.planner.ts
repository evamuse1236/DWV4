import type { LinePack } from "../types";

/**
 * VOICE — Steve Harrington (Stranger Things)
 * The world's best babysitter: cocky about the hair, soft about the kids.
 * Every line is an easter egg: Scoops Ahoy, the nail bat, Farrah Fawcett
 * spray, Family Video, walkie-talkies, demodogs, "I've kept six kids alive",
 * Dustin ("Henderson"), Robin, the Russian code, driving everyone everywhere.
 * Calls the kid: champ / shooter / buddy / rookie. Default: confident-warm.
 */
export const stevePlanner: LinePack = {
  greeting: [
    // Sprint ending soon — highest priority.
    {
      id: "steve.pl.greet.end.1",
      text: "Okay, listen up — {sprintDaysLeft} days left. This is a code red. Not a real code red, Henderson wore that phrase out. But it's crunch time, champ.",
      expression: "thinking",
      priority: 10,
      when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
    },
    {
      id: "steve.pl.greet.end.2",
      text: "{sprintDaysLeft} days on the clock. Hey — I once fought a demogorgon with a baseball bat and zero plan. You have a plan AND {sprintDaysLeft} days. You're winning.",
      expression: "proud",
      priority: 10,
      when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
    },
    {
      id: "steve.pl.greet.end.3",
      text: "Final stretch, {sprintDaysLeft} days. Time to swing the bat. Metaphorically. The actual bat stays in the trunk, we've talked about this.",
      expression: "excited",
      priority: 10,
      when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
    },
    // First open of the day.
    {
      id: "steve.pl.greet.first.1",
      text: "Morning, shooter! Hair looks great today. Mine too, obviously — four puffs of Farrah Fawcett spray, but that's between us. What's the plan?",
      expression: "proud",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "steve.pl.greet.first.2",
      text: "Hey hey, first one up! You know I've kept six kids alive through actual monsters, right? You showing up on your own? Makes my job SO easy.",
      expression: "excited",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "steve.pl.greet.first.3",
      text: "Ahoy! ...Sorry. Force of habit. You scoop ice cream for one summer and it never leaves you. Anyway — new day, clean slate. What are we doing?",
      expression: "laughing",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "steve.pl.greet.first.4",
      text: "There you are! Early check-in — that's varsity behavior, champ. I used to hit the court before anyone else too. King Steve days. We don't talk about King Steve.",
      expression: "laughing",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    {
      id: "steve.pl.greet.first.5",
      text: "Morning! Grabbed the walkie, checked the perimeter, no demodogs. Perfect conditions for getting stuff done. Over.",
      expression: "excited",
      priority: 5,
      when: (ctx) => ctx.isFirstOpenToday === true,
    },
    // Generic returns.
    {
      id: "steve.pl.greet.ret.1",
      text: "Back again? Good. The kids who check the plan twice are the ones I never have to rescue from a tunnel. What do you need?",
      expression: "neutral",
    },
    {
      id: "steve.pl.greet.ret.2",
      text: "Hey champ. Quick pit stop? I'm basically the designated driver of this whole operation anyway. Where to?",
      expression: "laughing",
    },
    {
      id: "steve.pl.greet.ret.3",
      text: "You rang? Robin says I have a 'weird sixth sense for when kids need help.' She's not wrong. What's up?",
      expression: "proud",
    },
    {
      id: "steve.pl.greet.ret.4",
      text: "Welcome back to Family Video— no wait, wrong job. Welcome back to your PLAN. Better selection here anyway.",
      expression: "laughing",
    },
  ],

  "offer.duplicateRoutine": [
    {
      id: "steve.pl.dup.offer.1",
      text: "Whoa, hold on — your last sprint's routine? That thing WORKED. And hey, I don't fix what isn't broken. Except my reputation. Want to run it back?",
      expression: "excited",
    },
    {
      id: "steve.pl.dup.offer.2",
      text: "Okay, real talk: your old routine was solid. Like, 'survived the season finale' solid. Same plan again, or something new?",
      expression: "thinking",
    },
    {
      id: "steve.pl.dup.offer.3",
      text: "I kept your old plan in the glove box, right next to the bat. Because I'm responsible like that. Want it back for this sprint?",
      expression: "proud",
    },
  ],

  "goal.askActivity": [
    {
      id: "steve.pl.act.1",
      text: "Alright, new goal. What's it gonna be, champ? Pick one below or type your own. And no, 'great hair' is not a goal, it's a lifestyle.",
      expression: "laughing",
    },
    {
      id: "steve.pl.act.2",
      text: "So what are we training this sprint? I went from swinging a bat at nothing to swinging it at ACTUAL monsters. Practice is real. Pick your thing.",
      expression: "proud",
    },
    {
      id: "steve.pl.act.3",
      text: "Goal time. One thing, done consistently. That's it. That's the whole secret. Well, that and the Fawcett spray. Pick!",
      expression: "neutral",
    },
    {
      id: "steve.pl.act.4",
      text: "Okay shooter, what's the mission? Don't overthink it — I once planned an entire rescue on the back of a Scoops Ahoy napkin.",
      expression: "excited",
    },
  ],

  "goal.askActivityVague": [
    {
      id: "steve.pl.vague.1",
      text: "'Stuff'? Buddy. I babysat Henderson for three years, I'm immune to vague. What's the ACTUAL thing you're gonna do?",
      expression: "thinking",
    },
    {
      id: "steve.pl.vague.2",
      text: "Okay that was less clear than the Russian code, and we needed a whole mall basement for that one. Give it to me straight — what will you do?",
      expression: "laughing",
    },
    {
      id: "steve.pl.vague.3",
      text: "Hey, I may be a pretty face, but even I need specifics. Say it like: 'I will ___.' One real thing. You got this.",
      expression: "neutral",
    },
    {
      id: "steve.pl.vague.4",
      text: "Nope, too foggy. This is like when the kids say 'it's complicated' and then I end up in a tunnel. Real words, champ. What's the thing?",
      expression: "thinking",
    },
  ],

  "goal.askDuration": [
    {
      id: "steve.pl.dur.1",
      text: "{activity} — solid pick. How long each time? And be honest. I can smell an overpromise from the parking lot.",
      expression: "neutral",
    },
    {
      id: "steve.pl.dur.2",
      text: "Okay, {activity}. Session length? Twenty real minutes beats two fake hours — babysitter wisdom, write it down.",
      expression: "thinking",
    },
    {
      id: "steve.pl.dur.3",
      text: "{activity}, nice. How long per session, shooter? Pick something you'd still do on a bad hair day. If those existed. For me.",
      expression: "laughing",
    },
  ],

  "goal.retryDuration": [
    {
      id: "steve.pl.retrydur.1",
      text: "Uhh, that didn't compute, and I've decoded actual Russian. Try a number — like '30 minutes' — or just tap a bubble, champ.",
      expression: "thinking",
    },
    {
      id: "steve.pl.retrydur.2",
      text: "Okay you lost me. And I don't get lost, I DRIVE everyone. Say it like '20 minutes', or the bubbles are right there.",
      expression: "laughing",
    },
  ],

  "goal.askSchedule": [
    {
      id: "steve.pl.sched.1",
      text: "Now the schedule. Which days? Consistency, champ — I showed up for those kids every single time, and look at me, beloved.",
      expression: "proud",
    },
    {
      id: "steve.pl.sched.2",
      text: "When's this happening? Pick your days. A plan without days is just a wish with good hair.",
      expression: "neutral",
    },
    {
      id: "steve.pl.sched.3",
      text: "Days of the week — go. Scheduled stuff actually happens. Unscheduled stuff becomes a Tuesday in Hawkins, and trust me, you don't want a Tuesday in Hawkins.",
      expression: "thinking",
    },
  ],

  "goal.retrySchedule": [
    {
      id: "steve.pl.retrysched.1",
      text: "Hm, didn't catch that. Try 'weekdays', 'every day', 'mon wed fri' — or tap a bubble. I believe in you, rookie.",
      expression: "thinking",
    },
    {
      id: "steve.pl.retrysched.2",
      text: "That flew past me like a demobat. Which days, champ — like 'weekends' or '3x per week'? Bubbles work too.",
      expression: "laughing",
    },
  ],

  "goal.confirmRecap": [
    {
      id: "steve.pl.confirm.1",
      text: "Mission brief: {activity}, {when}, {howLong} per session. I've reviewed it. It's clean. Cleaner than my car after the kids finally got out. Lock it in?",
      expression: "proud",
    },
    {
      id: "steve.pl.confirm.2",
      text: "Okay okay — {activity} — {when} — {howLong} each. That's a real plan, champ. Better than any plan the party ever made, and they made like forty. Stamp it?",
      expression: "excited",
    },
    {
      id: "steve.pl.confirm.3",
      text: "Final check: {activity}, {when}, {howLong} a pop. All clear on the walkie. Confirm? Over.",
      expression: "thinking",
    },
    {
      id: "steve.pl.confirm.4",
      text: "So the play is: {activity} • {when} • {howLong}. Nod and it's official. I'll even do the announcer voice in my head.",
      expression: "laughing",
    },
  ],

  "goal.created": [
    {
      id: "steve.pl.created.1",
      text: "BOOM. It's on the board! You know what the hardest part was? Deciding. You just did it. Varsity move, shooter.",
      expression: "excited",
    },
    {
      id: "steve.pl.created.2",
      text: "Goal locked! I'd ruffle your hair but A, you're a screen, and B, never touch the hair. Rule one. Proud of you though.",
      expression: "proud",
    },
    {
      id: "steve.pl.created.3",
      text: "Done! And hey — I've watched a bunch of scrappy kids pull off impossible stuff with worse plans than this. You're in great shape.",
      expression: "proud",
    },
    {
      id: "steve.pl.created.4",
      text: "It's official! This calls for ice cream. I know a guy. The guy is me. I was the guy at Scoops Ahoy. Ahoy!",
      expression: "laughing",
    },
    {
      id: "steve.pl.created.5",
      text: "Quest accepted — sorry, the nerds got that phrase stuck in my head. It's on the board, champ. Go be great.",
      expression: "excited",
    },
  ],

  "goal.duplicated": [
    {
      id: "steve.pl.dupd.1",
      text: "Copied! Same play, fresh season. The best coaches reuse the plays that win. I'd know, I peaked in— never mind. It's done!",
      expression: "laughing",
    },
    {
      id: "steve.pl.dupd.2",
      text: "Duplicated. If it worked before, it works again — like the bat. The bat ALWAYS works.",
      expression: "proud",
    },
    {
      id: "steve.pl.dupd.3",
      text: "Done, cloned it. And no, this is not like the Upside Down version. This copy is friendly.",
      expression: "neutral",
    },
  ],

  "goal.imported": [
    {
      id: "steve.pl.imp.1",
      text: "Pulled it out of storage! Your old goal's back, good as new. Family Video taught me one thing: the classics rent best.",
      expression: "excited",
    },
    {
      id: "steve.pl.imp.2",
      text: "Import complete. Welcome back, old goal. We saved your seat. It's the good seat. In MY car, they fight over it.",
      expression: "laughing",
    },
  ],

  "goal.edited": [
    {
      id: "steve.pl.edit.1",
      text: "Updated! Adjusting the plan mid-run isn't quitting — it's steering. I steer for six kids and a Robin. I know steering.",
      expression: "proud",
    },
    {
      id: "steve.pl.edit.2",
      text: "Changed and saved. Plans should flex. Like great hair in the wind. Still holds. Still fabulous.",
      expression: "laughing",
    },
  ],

  "task.done.single": [
    {
      id: "steve.pl.done1.1",
      text: "One down! Clean swing, champ!",
      expression: "excited",
    },
    {
      id: "steve.pl.done1.2",
      text: "Done! See, this is why you're my favorite. Don't tell Henderson.",
      expression: "laughing",
    },
    {
      id: "steve.pl.done1.3",
      text: "Task handled. No bat required. Love that for us.",
      expression: "proud",
    },
    {
      id: "steve.pl.done1.4",
      text: "Nice hit! That's going on your highlight reel.",
      expression: "excited",
    },
    {
      id: "steve.pl.done1.5",
      text: "Checked off! You make my babysitting record look even better.",
      expression: "proud",
    },
    {
      id: "steve.pl.done1.6",
      text: "Boom. Done. Somewhere, Robin is admitting I taught you that.",
      expression: "laughing",
    },
  ],

  "task.done.multi": [
    {
      id: "steve.pl.donem.1",
      text: "{tasksDoneToday} tasks today?! Okay, superstar, save some glory for the rest of Hawkins!",
      expression: "excited",
    },
    {
      id: "steve.pl.donem.2",
      text: "{tasksDoneToday} down. That's a hat trick and change. Varsity stuff, shooter.",
      expression: "proud",
    },
    {
      id: "steve.pl.donem.3",
      text: "{tasksDoneToday} already? I've guarded kids through two apocalypses and you might be the most productive one yet.",
      expression: "laughing",
    },
    {
      id: "steve.pl.donem.4",
      text: "{tasksDoneToday} tasks! You're on a heater! Keep swinging!",
      expression: "excited",
    },
    {
      id: "steve.pl.donem.5",
      text: "That's {tasksDoneToday} today. Free scoop if I still worked at Scoops. IOU one Ahoy.",
      expression: "laughing",
    },
  ],

  "task.done.allToday": [
    {
      id: "steve.pl.doneall.1",
      text: "FULL CLEAR! Every task! Today just got Harrington'd! ...We're workshopping that phrase. But YOU crushed it!",
      expression: "excited",
    },
    {
      id: "steve.pl.doneall.2",
      text: "All of it. Done. The whole board. Kid, I have never once cleared my whole list. This is genuinely elite.",
      expression: "proud",
    },
    {
      id: "steve.pl.doneall.3",
      text: "Everything?! Done?! Okay, you're officially the kid I brag about now. The others will cope.",
      expression: "laughing",
    },
    {
      id: "steve.pl.doneall.4",
      text: "Day = conquered. Go hydrate, touch grass, protect the streak. Babysitter's orders.",
      expression: "excited",
    },
  ],

  "streak.3": [
    {
      id: "steve.pl.streak3.1",
      text: "{streakDays}-day streak! That's a pattern forming, champ. Patterns beat monsters. Learned that the hard way.",
      expression: "thinking",
    },
    {
      id: "steve.pl.streak3.2",
      text: "Three days straight! Keep that up and I'll start telling people I coached you. Because I will absolutely take credit.",
      expression: "laughing",
    },
  ],

  "streak.5": [
    {
      id: "steve.pl.streak5.1",
      text: "{streakDays} days in a row! You're more reliable than my hair, and my hair has NEVER let me down.",
      expression: "proud",
    },
    {
      id: "steve.pl.streak5.2",
      text: "Five straight days. That's discipline. That's varsity. That's 'I don't even need a babysitter' energy. I'm a little emotional.",
      expression: "excited",
    },
  ],

  "streak.7": [
    {
      id: "steve.pl.streak7.1",
      text: "{streakDays} DAYS. A full week, unbroken. In Hawkins terms? You survived a whole season. MVP.",
      expression: "excited",
    },
    {
      id: "steve.pl.streak7.2",
      text: "Seven days straight! I've kept six kids alive, but YOU kept a whole week alive. We're even.",
      expression: "proud",
    },
  ],

  "habit.created": [
    {
      id: "steve.pl.habit.1",
      text: "New habit registered! Small thing, done daily — that's how I got the hair. Years of quiet, disciplined effort. Respect the process.",
      expression: "proud",
    },
    {
      id: "steve.pl.habit.2",
      text: "Habit's in! Do it every day and one morning it's just... who you are. Like me and heroically showing up in a station wagon.",
      expression: "laughing",
    },
    {
      id: "steve.pl.habit.3",
      text: "Done! A habit is a promise to tomorrow-you. And tomorrow-you has GREAT hair, so keep the promise.",
      expression: "excited",
    },
  ],

  "banter.betweenSteps": [
    {
      id: "steve.pl.banter.1",
      text: "You know what I've learned from years of unpaid heroics? Half of winning is just showing up with a plan and a good attitude. The bat's optional.",
      expression: "proud",
      modes: ["talkative"],
    },
    {
      id: "steve.pl.banter.2",
      text: "Between us? The nerds do the science, but SOMEBODY has to drive, keep everyone fed, and look good doing it. Planning is MY superpower.",
      expression: "laughing",
      modes: ["talkative"],
    },
    {
      id: "steve.pl.banter.3",
      text: "Robin bets me you'll finish this sprint strong. I took that bet. On your side. Obviously. Don't make me lose to Robin, she's insufferable when she wins.",
      expression: "laughing",
      modes: ["talkative"],
    },
    {
      id: "steve.pl.banter.4",
      text: "Fun fact: I once memorized a whole ice cream menu AND a Russian transmission. Your schedule? Child's play. Let's keep moving.",
      expression: "excited",
      modes: ["talkative"],
    },
    {
      id: "steve.pl.banter.5",
      text: "Pro tip from the world's best babysitter: kids who write the plan down actually do the plan. It's spooky. Spookier than the tunnels. Onward.",
      expression: "thinking",
      modes: ["talkative"],
    },
  ],

  "error.generic": [
    {
      id: "steve.pl.err.1",
      text: "Whoa — tech hiccup. Not you, definitely the walkie. Give it another shot? Over.",
      expression: "thinking",
    },
    {
      id: "steve.pl.err.2",
      text: "Huh. That bounced. Probably the Hawkins power grid again — it has a HISTORY. One more try, champ.",
      expression: "laughing",
    },
  ],
};
