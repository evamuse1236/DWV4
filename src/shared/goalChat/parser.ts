// Pure goal-input parsers, moved verbatim from convex/ai.ts when the LLM
// goal chat was replaced by the deterministic dialogue buddy. These run
// entirely client-side — no server round-trip, no AI.

export type GoalDraft = { what: string | null; when: string | null; howLong: string | null };
export type SuggestedTask = { title: string; weekNumber: number; dayOfWeek: number };
export type GoalSummary = { title: string; what: string; when: string; howLong: string };

const WORD_NUMBERS: Record<string, string> = {
  five: "5",
  ten: "10",
  fifteen: "15",
  twenty: "20",
  "twenty five": "25",
  thirty: "30",
  forty: "40",
  "forty five": "45",
  sixty: "60",
  ninety: "90",
};

export function normalizeInput(text: string): string {
  return text
    // Word-number durations: "ten minutes" -> "10 minutes"
    .replace(
      /\b(five|ten|fifteen|twenty(?:[\s-]five)?|thirty|forty(?:[\s-]five)?|sixty|ninety)\s+(minutes?|mins?|hours?|hrs?)\b/gi,
      (_match, word: string, unit: string) =>
        `${WORD_NUMBERS[word.toLowerCase().replace(/-/g, " ")] ?? word} ${unit}`
    )
    .replace(/\bevr?e?y\b/gi, "every")
    .replace(/\bdaiy\b/gi, "daily")
    .replace(/\b(mornign|moning|morining|mornig|mornng)\b/gi, "morning")
    .replace(/\bnite\b/gi, "night")
    .replace(/\bwek\b/gi, "week")
    .replace(/\btims?\b/gi, "times")
    .replace(/\b(\d+)\s*(?:minits?|minuts?|minz?|mins?|m)\b/gi, "$1 minutes")
    .replace(/\b(\d+)\s*(?:hours?|hrs?|hor|h)\b/gi, "$1 hours")
    .replace(/\bhalf\s+(?:an\s+)?hour\b/gi, "30 minutes")
    .replace(/\ban\s+hour\b/gi, "1 hour")
    .replace(/\b(\d+)x\/wk\b/gi, "$1 times a week")
    .replace(/\b(\d+)x\s*\/\s*week\b/gi, "$1 times a week");
}

export function removeFiller(text: string): string {
  return text
    .replace(/\b(h+m+|u+m+|u+h+|e+r+|a+h+)\b/gi, "")
    .replace(/\b(was thinking of|thinking of|working on|getting better at|get better at|improve my|improve at)\b/gi, "")
    .replace(/\b(hey|hi|hello|okay|ok|like|so|basically|really|just|actually|i guess|i think|i want to|i need to|i'd like to|try to|maybe|probably|perhaps|around|about|approximately|or so|or something|single)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

const DURATION_PATTERNS = [
  /for\s+(\d+)\s*(minutes?|hours?)/i,
  /(\d+)\s*(minutes?|hours?)\s*(?:each|per|a)?\s*(?:time|day|session)?/i,
  /(\d+)\s*(minutes?|hours?)$/i,
  /(\d+)\s*(minutes?|hours?)/i,
];

const SCHEDULE_PATTERNS = [
  { pattern: /every\s*day/i, extract: () => "every day" },
  { pattern: /daily/i, extract: () => "every day" },
  { pattern: /(?:on\s+)?(weekdays?)/i, extract: (m: RegExpMatchArray) => `on ${m[1]}` },
  { pattern: /(?:on\s+)?(weekends?)/i, extract: (m: RegExpMatchArray) => `on ${m[1]}` },
  { pattern: /every\s+(morning|night|evening|afternoon)/i, extract: (m: RegExpMatchArray) => `every ${m[1]}` },
  { pattern: /\b(mornings?|evenings?|afternoons?|nights?)\b/i, extract: (m: RegExpMatchArray) => `every ${m[1].replace(/s$/, "")}` },
  { pattern: /after\s+(school|work)/i, extract: (m: RegExpMatchArray) => `on weekdays after ${m[1]}` },
  { pattern: /before\s+(school|work)/i, extract: (m: RegExpMatchArray) => `on weekdays before ${m[1]}` },
  { pattern: /after\s+(dinner|lunch|breakfast)/i, extract: (m: RegExpMatchArray) => `every day after ${m[1]}` },
  { pattern: /before\s+(dinner|lunch|breakfast|bed)/i, extract: (m: RegExpMatchArray) => `every day before ${m[1]}` },
  { pattern: /in\s+the\s+(morning|evening|afternoon)/i, extract: (m: RegExpMatchArray) => `in the ${m[1]}` },
  { pattern: /at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i, extract: (m: RegExpMatchArray) => `at ${m[1]}` },
];

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 } as const;

const DAY_PATTERN = /\b(mon|tues?|tue|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)(day)?s?\b/gi;

export function parseDayCodes(text: string): string[] {
  const matches = text.toLowerCase().match(DAY_PATTERN) ?? [];
  if (matches.length === 0) return [];

  const dayMap: Record<string, string> = {
    mon: "mon",
    tue: "tue",
    tues: "tue",
    wed: "wed",
    thu: "thu",
    thur: "thu",
    thurs: "thu",
    fri: "fri",
    sat: "sat",
    sun: "sun",
  };

  const days = matches.map((day) => {
    const lower = day.toLowerCase();
    for (const [prefix, code] of Object.entries(dayMap)) {
      if (lower.startsWith(prefix)) return code;
    }
    return lower.slice(0, 3);
  });
  return [...new Set(days)];
}

export function extractTimeQualifier(text: string): string | null {
  const lower = text.toLowerCase();
  const after = lower.match(/\bafter\s+(school|work|dinner|lunch|breakfast)\b/i);
  if (after) return `after ${after[1].toLowerCase()}`;
  const before = lower.match(/\bbefore\s+(school|work|dinner|lunch|breakfast|bed)\b/i);
  if (before) return `before ${before[1].toLowerCase()}`;
  const inThe = lower.match(/\bin\s+the\s+(morning|evening|afternoon)\b/i);
  if (inThe) return `in the ${inThe[1].toLowerCase()}`;
  const atTime = lower.match(/\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/i);
  if (atTime) return `at ${atTime[1].toLowerCase().replace(/\s+/g, " ")}`;
  const simple = lower.match(/\b(morning|evening|afternoon|night)s?\b/i);
  if (simple) {
    const value = simple[1].toLowerCase();
    return value === "night" ? "at night" : `in the ${value}`;
  }
  return null;
}

function withTimeQualifier(base: string, timeQualifier: string | null): string {
  if (!timeQualifier) return base;
  const baseLower = base.toLowerCase();
  const timeLower = timeQualifier.toLowerCase();
  if (baseLower.includes(timeLower)) return base;
  const timeWord = timeLower.match(/\b(morning|evening|afternoon|night)\b/)?.[1];
  if (timeWord && baseLower.includes(timeWord)) return base;
  return `${base} ${timeQualifier}`.replace(/\s+/g, " ").trim();
}

function parseTimesPerWeek(text: string): number | null {
  const lower = text.toLowerCase();
  const digitMatch = lower.match(/\b(\d+)\s*(?:times?|x|days?)\s*(?:a|per)\s*week\b/i);
  if (digitMatch) return Math.max(1, Math.min(7, parseInt(digitMatch[1], 10)));

  if (/\bonce\s*(?:a|per)?\s*week\b/i.test(lower)) return 1;
  if (/\btwice\s*(?:a|per)?\s*week\b/i.test(lower)) return 2;

  const wordMatch = lower.match(/\b(one|two|three|four|five|six|seven)\s*(?:times?|x|days?)\s*(?:a|per)?\s*week\b/i);
  if (wordMatch) return NUMBER_WORDS[wordMatch[1] as keyof typeof NUMBER_WORDS];

  // Common short-hands when we're explicitly asking "how often"
  if (/^\s*(one|1)\s+day\s*$/i.test(lower)) return 1;
  if (/^\s*(two|2)\s+days?\s*$/i.test(lower)) return 2;
  if (/^\s*(three|3)\s+days?\s*$/i.test(lower)) return 3;
  if (/^\s*(four|4)\s+days?\s*$/i.test(lower)) return 4;
  if (/^\s*(five|5)\s+days?\s*$/i.test(lower)) return 5;
  return null;
}

export function parseGoalInput(text: string): GoalDraft {
  const normalized = normalizeInput(text.toLowerCase().trim());
  const cleaned = removeFiller(normalized);
  const input = cleaned;
  const result: GoalDraft = { what: null, when: null, howLong: null };

  for (const pattern of DURATION_PATTERNS) {
    const match = input.match(pattern);
    if (match) {
      const num = match[1];
      const unit = match[2].startsWith("h") ? "hour" : "minute";
      result.howLong = `${num} ${unit}${num !== "1" ? "s" : ""}`;
      break;
    }
  }

  result.when = parseSchedule(input);

  // Day name regex that handles common abbreviations:
  // mon, monday, tue, tues, tuesday, wed, wednesday, thu, thur, thurs, thursday,
  // fri, friday, sat, saturday, sun, sunday (and plural forms)
  const dayNamePattern = /(?:on\s+)?(?:mon(?:day)?s?|tue(?:s(?:day)?)?s?|wed(?:nesday)?s?|thu(?:rs?(?:day)?)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?)/gi;

  const activity = stripScheduleAndDuration(input, dayNamePattern);

  if (activity.length > 2 && /[a-z]/i.test(activity)) {
    result.what = activity;
  }

  return result;
}

function stripScheduleAndDuration(input: string, dayNamePattern?: RegExp): string {
  const dayPattern =
    dayNamePattern ??
    /(?:on\s+)?(?:mon(?:day)?s?|tue(?:s(?:day)?)?s?|wed(?:nesday)?s?|thu(?:rs?(?:day)?)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?)/gi;
  return input
    .replace(/for\s+\d+\s*(?:minutes?|hours?)/gi, "")
    .replace(/\d+\s*(?:minutes?|hours?)\s*(?:each|per|a)?\s*(?:time|day|session)?/gi, "")
    .replace(/every\s+(?:morning|night|evening|afternoon|day)/gi, "")
    .replace(/every\s*day/gi, "")
    .replace(/daily/gi, "")
    .replace(/\d+\s*(?:times?|x)\s*(?:a|per)\s*week/gi, "")
    .replace(/(?:on\s+)?(?:weekends?|weekdays?)/gi, "")
    .replace(dayPattern, "")
    // Also strip "to" when it appears between day references (e.g., "mon to fri")
    .replace(/\s+to\s+/gi, " ")
    .replace(/(?:after|before)\s+(?:school|work|dinner|lunch|breakfast|bed)/gi, "")
    .replace(/in\s+the\s+(?:morning|evening|afternoon)/gi, "")
    .replace(/at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDuration(num: string, unit: string): string {
  const unitName = unit.startsWith("h") ? "hour" : "minute";
  return `${num} ${unitName}${num !== "1" ? "s" : ""}`;
}

export function parseDuration(text: string): string | null {
  const normalized = normalizeInput(text.toLowerCase().trim());
  const cleaned = removeFiller(normalized);
  const input = cleaned || normalized;

  if (/half\s+(?:an?\s+)?hour/i.test(input)) return "30 minutes";
  if (/^an?\s+hour$/i.test(input)) return "1 hour";

  const match = input.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)/i);
  if (match) {
    return formatDuration(match[1], match[2]);
  }
  return null;
}

export function parseSchedule(text: string): string | null {
  const normalized = normalizeInput(text.toLowerCase().trim());
  const cleaned = removeFiller(normalized);
  const input = cleaned || normalized;

  const timeQualifier = extractTimeQualifier(input);

  const dayCodes = parseDayCodes(input);
  if (dayCodes.length > 0) {
    return withTimeQualifier(`on ${dayCodes.join(", ")}`, timeQualifier);
  }

  // Times per week (including "one day" shorthand)
  const times = parseTimesPerWeek(input);
  if (times) {
    return withTimeQualifier(`${times}x per week`, timeQualifier);
  }

  for (const { pattern, extract } of SCHEDULE_PATTERNS) {
    const match = input.match(pattern);
    if (match) return withTimeQualifier(extract(match), timeQualifier);
  }

  // If we only got a time qualifier, infer a sensible default
  if (timeQualifier) {
    if (/after\s+(school|work)|before\s+(school|work)/i.test(timeQualifier)) {
      return withTimeQualifier("on weekdays", timeQualifier);
    }
    return withTimeQualifier("every day", timeQualifier);
  }
  return null;
}

export function deriveScheduleUpdate(text: string, currentWhen: string | null): string | null {
  const normalized = normalizeInput(text.toLowerCase().trim());
  const cleaned = removeFiller(normalized);
  const input = cleaned || normalized;

  const timeQualifier = extractTimeQualifier(input);
  const dayCodes = parseDayCodes(input);
  const times = parseTimesPerWeek(input);
  const hasBase =
    dayCodes.length > 0 ||
    times !== null ||
    /\b(weekdays?|weekends?|every\s*day|daily|every\s+(morning|evening|afternoon|night))\b/i.test(input);

  if (!hasBase && timeQualifier && currentWhen) {
    return withTimeQualifier(currentWhen, timeQualifier);
  }

  return parseSchedule(input);
}

/**
 * Detect requests to edit the schedule/days specifically (not just any modification).
 */
export function isScheduleEditRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (/change\s+(the\s+)?(days?|schedule|frequency)/.test(lower)) return true;
  if (/^no[,]?\s+(change\s+(the\s+)?(days?|schedule|frequency))/.test(lower)) return true;
  if (/(number|no|n)\s+of\s+days?/.test(lower)) return true;
  if (/(how\s+many|which)\s+days?/.test(lower)) return true;
  if (/different\s+days?/.test(lower)) return true;
  return false;
}

/** Detect requests to edit the duration specifically. */
export function isDurationEditRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (/change\s+(the\s+)?(duration|time|length|how\s+long)/.test(lower)) return true;
  if (/(shorter|longer|more|less)\s+time/.test(lower)) return true;
  return false;
}

/** Detect requests to edit the activity/what specifically. */
export function isActivityEditRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (/change\s+(the\s+)?(activity|goal|what)/.test(lower)) return true;
  if (/different\s+(activity|goal)/.test(lower)) return true;
  return false;
}

/** Detect requests to start over / reset the draft. */
export function isStartOverRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (/start\s+over|reset|clear|begin\s+again|from\s+scratch|new\s+goal/i.test(lower)) return true;
  return false;
}

export function isModificationRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (/^(no|nope|change|switch|make it|instead|actually|but|wait|not|only|just|add|remove|drop|delete|skip)/.test(lower)) return true;
  if (/(instead of|change to|switch to|rather than|not .+, |fewer|more|less|different|add|remove|drop|delete|skip)/.test(lower)) return true;
  return false;
}

function parseWhenToDayCodes(when: string): Set<string> {
  const whenLower = (when || "").toLowerCase();

  if (whenLower.includes("every day") || whenLower.includes("daily")) {
    return new Set(["sun", "mon", "tue", "wed", "thu", "fri", "sat"]);
  }
  if (whenLower.includes("weekday")) {
    return new Set(["mon", "tue", "wed", "thu", "fri"]);
  }
  if (whenLower.includes("weekend")) {
    return new Set(["sun", "sat"]);
  }
  if (/(after|before)\s+(school|work)/i.test(whenLower)) {
    return new Set(["mon", "tue", "wed", "thu", "fri"]);
  }
  const timesMatch = whenLower.match(/(\d+)\s*x\s*per\s*week/i);
  if (timesMatch) {
    const times = Math.max(1, Math.min(7, parseInt(timesMatch[1], 10)));
    const dayNumbers = selectDayNumbersForTimesPerWeek(times);
    const numToCode: Record<number, string> = { 0: "sun", 1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat" };
    return new Set(dayNumbers.map((d) => numToCode[d]));
  }

  const codes = parseDayCodes(whenLower);
  if (codes.length > 0) return new Set(codes);

  return new Set(["mon", "wed", "fri"]);
}

function formatWhenFromDayCodes(dayCodes: Set<string>, timeQualifier: string | null): string {
  const sorted = Array.from(dayCodes);
  const order: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
  sorted.sort((a, b) => (order[a] ?? 99) - (order[b] ?? 99));

  const set = new Set(sorted);
  const isWeekdays =
    set.size === 5 && ["mon", "tue", "wed", "thu", "fri"].every((d) => set.has(d));
  const isWeekends = set.size === 2 && set.has("sat") && set.has("sun");
  const isEveryDay = set.size === 7;

  let base: string;
  if (isEveryDay) base = "every day";
  else if (isWeekdays) base = "on weekdays";
  else if (isWeekends) base = "on weekends";
  else base = `on ${sorted.join(", ")}`;

  return withTimeQualifier(base, timeQualifier);
}

function removeDaysFromWhen(currentWhen: string, daysToRemove: string[]): string | null {
  const existing = parseWhenToDayCodes(currentWhen);
  const beforeSize = existing.size;
  for (const day of daysToRemove) existing.delete(day);

  if (existing.size === 0) return null;
  if (existing.size === beforeSize) return null;

  const timeQualifier = extractTimeQualifier(currentWhen);
  return formatWhenFromDayCodes(existing, timeQualifier);
}

function addDaysToWhen(currentWhen: string | null, daysToAdd: string[]): string | null {
  if (!currentWhen) {
    return formatWhenFromDayCodes(new Set(daysToAdd), null);
  }

  const existing = parseWhenToDayCodes(currentWhen);
  const beforeSize = existing.size;
  for (const day of daysToAdd) existing.add(day);

  if (existing.size === beforeSize) return null;

  const timeQualifier = extractTimeQualifier(currentWhen);
  return formatWhenFromDayCodes(existing, timeQualifier);
}

export function parseModification(text: string, currentGoal: GoalDraft): GoalDraft | null {
  const lower = text.toLowerCase().trim()
    .replace(/^(actually|wait|hmm|um|uh|well|nope)[,]?\s*/i, "")
    .replace(/\s*(instead|please|thanks)$/i, "");

  // Remove specific day(s): "remove tuesday", "skip fri", "not on wed"
  if (/\b(remove|drop|delete|skip|without|except)\b/.test(lower) || /\bnot\s+on\b/.test(lower)) {
    const daysToRemove = parseDayCodes(lower);
    if (daysToRemove.length > 0 && currentGoal.when) {
      const updatedWhen = removeDaysFromWhen(currentGoal.when, daysToRemove);
      if (updatedWhen) return { ...currentGoal, when: updatedWhen };
    }
  }

  // Add specific day(s): "add tuesday", "also fri"
  if (/\b(add|include|also|plus)\b/.test(lower)) {
    const daysToAdd = parseDayCodes(lower);
    if (daysToAdd.length > 0) {
      const updatedWhen = addDaysToWhen(currentGoal.when, daysToAdd);
      if (updatedWhen) return { ...currentGoal, when: updatedWhen };
    }
  }

  const onlyMatch = lower.match(/^(?:no[,]?\s*)?(?:just|only)\s+(.+)$/);
  if (onlyMatch) {
    const rest = onlyMatch[1];
    const newWhen = deriveScheduleUpdate(rest, currentGoal.when);
    if (newWhen) return { ...currentGoal, when: newWhen };
    const newDuration = parseDuration(rest);
    if (newDuration) return { ...currentGoal, howLong: newDuration };
  }

  const noMatch = lower.match(/^no[,]?\s+(.+)$/);
  if (noMatch) {
    const newWhen = deriveScheduleUpdate(noMatch[1], currentGoal.when);
    if (newWhen) return { ...currentGoal, when: newWhen };
    const newDuration = parseDuration(noMatch[1]);
    if (newDuration) return { ...currentGoal, howLong: newDuration };
  }

  const changeMatch = lower.match(/^(?:change|switch|make it)\s+(?:to\s+)?(.+)$/);
  if (changeMatch) {
    const newValue = changeMatch[1];
    const newWhen = deriveScheduleUpdate(newValue, currentGoal.when);
    const newDuration = parseDuration(newValue);
    if (newWhen && newDuration) return { ...currentGoal, when: newWhen, howLong: newDuration };
    if (newWhen) return { ...currentGoal, when: newWhen };
    if (newDuration) return { ...currentGoal, howLong: newDuration };
  }

  const directWhen = deriveScheduleUpdate(lower, currentGoal.when);
  const directDuration = parseDuration(lower);
  if (directWhen && directDuration) return { ...currentGoal, when: directWhen, howLong: directDuration };
  if (directWhen) return { ...currentGoal, when: directWhen };
  if (directDuration) return { ...currentGoal, howLong: directDuration };
  return null;
}

export function generateTitle(what: string | null): string {
  if (!what) return "New Goal";
  const text = what.toLowerCase().trim();

  const verbMap: Record<string, string> = {
    watch: "Watching",
    play: "Playing",
    practice: "Practice",
    study: "Study",
    learn: "Learning",
    read: "Reading",
    write: "Writing",
    draw: "Drawing",
    paint: "Painting",
    cook: "Cooking",
    bake: "Baking",
    make: "Making",
    build: "Building",
    create: "Creating",
  };

  const mealMap: Record<string, string> = {
    breakfast: "Morning Breakfast",
    lunch: "Lunch Time",
    dinner: "Evening Dinner",
  };

  const activityMap: Record<string, string> = {
    exercise: "Daily Exercise",
    workout: "Workout",
    run: "Running",
    jog: "Jogging",
    walk: "Walking",
    swim: "Swimming",
    yoga: "Yoga",
    meditate: "Meditation",
  };

  const verbMatch = text.match(/^(watch|play|practice|study|learn|read|write|draw|paint|cook|bake|make|build|create)\s+(.+)$/i);
  if (verbMatch) {
    const noun = verbMatch[2].split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    return `${noun} ${verbMap[verbMatch[1].toLowerCase()] || ""}`.trim();
  }

  const mealMatch = text.match(/^eat\s+(breakfast|lunch|dinner)$/i);
  if (mealMatch) return mealMap[mealMatch[1].toLowerCase()];

  const actMatch = text.match(/^(exercise|workout|run|jog|walk|swim|yoga|meditate)$/i);
  if (actMatch) return activityMap[actMatch[1].toLowerCase()];

  const taskMatch = text.match(/^do\s+(my\s+)?(homework|chores)$/i);
  if (taskMatch) return taskMatch[2].charAt(0).toUpperCase() + taskMatch[2].slice(1);

  return text.split(" ").slice(0, 3).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function generateTasks(what: string, when: string): SuggestedTask[] {
  const tasks: SuggestedTask[] = [];
  const days: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const whenLower = (when || "").toLowerCase();

  let selectedDays: number[] = [];
  if (
    whenLower.includes("every day") ||
    whenLower.includes("daily") ||
    whenLower.includes("every night") ||
    whenLower.includes("every morning") ||
    whenLower.includes("every evening") ||
    whenLower.includes("every afternoon")
  ) {
    selectedDays = [0, 1, 2, 3, 4, 5, 6];
  } else if (whenLower.includes("weekday")) {
    selectedDays = [1, 2, 3, 4, 5];
  } else if (whenLower.includes("weekend")) {
    selectedDays = [0, 6];
  } else if (whenLower.includes("after school") || whenLower.includes("before school") || whenLower.includes("after work") || whenLower.includes("before work")) {
    selectedDays = [1, 2, 3, 4, 5];
  } else if (/(\d+)x?\s*per\s*week/.test(whenLower)) {
    const times = parseInt(whenLower.match(/(\d+)/)?.[1] || "0", 10);
    selectedDays = selectDayNumbersForTimesPerWeek(times);
  } else {
    for (const [day, num] of Object.entries(days)) {
      if (whenLower.includes(day)) selectedDays.push(num);
    }
    if (selectedDays.length === 0) selectedDays = [1, 3, 5];
  }

  for (const week of [1, 2]) {
    for (const day of selectedDays) {
      tasks.push({ title: what, weekNumber: week, dayOfWeek: day });
    }
  }
  return tasks;
}

function selectDayNumbersForTimesPerWeek(times: number): number[] {
  const count = Math.max(1, Math.min(7, Math.floor(times)));
  const presets: Record<number, number[]> = {
    1: [1], // Mon
    2: [2, 4], // Tue, Thu
    3: [1, 3, 5], // Mon, Wed, Fri
    4: [1, 2, 4, 5], // Mon, Tue, Thu, Fri
    5: [1, 2, 3, 4, 5], // Weekdays
    6: [1, 2, 3, 4, 5, 6], // Mon-Sat
    7: [0, 1, 2, 3, 4, 5, 6], // Every day
  };
  return presets[count] ?? presets[3];
}

export function buildGoalSummary(draft: GoalDraft): GoalSummary {
  return {
    title: generateTitle(draft.what || "goal"),
    what: draft.what || "goal",
    when: draft.when || "this sprint",
    howLong: draft.howLong || "each time",
  };
}

export function isConfirmation(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return /^(yes|yeah|yep|yup|sure|ok|okay|looks good|perfect|confirm|do it|go ahead|that's? (good|right|correct))/.test(lower);
}

export function mergeDraft(base: GoalDraft, update: GoalDraft): GoalDraft {
  return {
    // CRITICAL: Never overwrite existing 'what' from parsed input.
    // This prevents schedule/duration text like "mon to thurs" from
    // corrupting the goal activity. Users must explicitly use "Change activity"
    // or "Start over" to change the activity.
    what: base.what ?? update.what,
    when: update.when ?? base.when,
    howLong: update.howLong ?? base.howLong,
  };
}

export function isDraftComplete(draft: GoalDraft): boolean {
  return Boolean(draft.what && draft.when && draft.howLong);
}

const VAGUE_WORDS = /\b(something|stuff|things?|anything|whatever|idk|dunno|not sure)\b/i;

export type ResolvedActivity =
  | { kind: "activity"; activity: string }
  | { kind: "ask"; prefill: string };

/**
 * Deterministic replacement for the old LLM `extractActivity` call.
 * Strips schedule/duration noise; if what's left looks like a real
 * activity we take it, otherwise the character asks the kid directly
 * (with their raw text pre-filled for editing).
 */
export function resolveActivity(raw: string): ResolvedActivity {
  const normalized = normalizeInput(raw.toLowerCase().trim());
  const cleaned = removeFiller(normalized);
  const leftover = stripScheduleAndDuration(cleaned);

  if (leftover.length >= 3 && /[a-z]/i.test(leftover) && !VAGUE_WORDS.test(leftover)) {
    return { kind: "activity", activity: leftover };
  }
  return { kind: "ask", prefill: leftover || raw.trim() };
}
