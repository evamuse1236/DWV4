import { v } from "convex/values";
import { action } from "./_generated/server";

// ============================================================================
// Types
// ============================================================================

type AIPersona = "muse" | "captain";
type BookBuddyPersonality = "luna" | "dash" | "hagrid";
type ChatMessage = { role: "user" | "assistant" | "system"; content: string };
type GoalDraft = { what: string | null; when: string | null; howLong: string | null };
type SuggestedTask = { title: string; weekNumber: number; dayOfWeek: number };
type GoalSummary = { title: string; what: string; when: string; howLong: string };

interface GoalInfo {
  id: string;
  title: string;
}

interface PreviousGoalInfo extends GoalInfo {
  sprintName: string;
}

const ACTIVITY_EXTRACTION_PROMPT = `You help kids set goals. Extract the SPECIFIC activity from what they say.

RULES:
- Return ONLY 1-4 words (the activity itself)
- If vague ("something", "stuff", "things"), ask what specifically
- No quotes, no explanation - just the activity or a question

GOOD:
"watch anime" → watch anime
"practice piano" → piano practice
"read books" → reading
"get better at math" → studying math

ASK (too vague):
"watch something" → What do you want to watch?
"do stuff" → What kind of stuff?
"work on things" → What things?`;

const PROMPT_CHIPS = {
  initial: [
    "eat breakfast every morning for 30 mins",
    "practice piano",
    "read every night",
    "exercise 3 times a week for 1 hour",
    "study math after school",
  ],
  confirmation: [
    "Yes, looks good!",
    "Change schedule",
    "Change duration",
    "Change activity",
    "Start over",
    "Make it fewer days",
    "Add more days",
  ],
  duration: ["15 minutes", "30 minutes", "45 minutes", "1 hour"],
  schedule: ["every day", "3 times a week", "weekdays", "on weekends", "weekdays after school"],
};

// ============================================================================
// Model Configuration
// ============================================================================

const GROQ_PRIMARY_MODEL = "moonshotai/kimi-k2-instruct";
const GROQ_FORMATTER_MODEL = "llama-3.1-8b-instant";
const OPENROUTER_FALLBACK_MODEL = "xiaomi/mimo-v2-flash:free";

// ============================================================================
// API Helpers
// ============================================================================

/**
 * Generic function to call any OpenAI-compatible chat API
 */
async function callChatAPI(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number,
  extraHeaders: Record<string, string> = {}
): Promise<{ content: string; usage: unknown }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Invalid response: no content");
  }

  return { content, usage: data.usage };
}

/**
 * Call AI with automatic fallback: Groq (primary) -> OpenRouter (fallback)
 */
async function callAIWithFallback(
  messages: ChatMessage[],
  temperature: number,
  logPrefix: string
): Promise<{ content: string; usage: unknown; provider: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!groqKey && !openRouterKey) {
    throw new Error(
      "No API keys configured. Set GROQ_API_KEY and/or OPENROUTER_API_KEY in Convex environment variables."
    );
  }

  // Try Groq first
  if (groqKey) {
    try {
      console.log(`[${logPrefix}] Calling Groq: ${GROQ_PRIMARY_MODEL}`);
      const result = await callChatAPI(
        "https://api.groq.com/openai/v1/chat/completions",
        groqKey,
        GROQ_PRIMARY_MODEL,
        messages,
        temperature
      );
      console.log(`[${logPrefix}] Groq success, tokens: ${JSON.stringify(result.usage)}`);
      return { ...result, provider: "groq" };
    } catch (error) {
      console.warn(`[${logPrefix}] Groq failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Fallback to OpenRouter
  if (openRouterKey) {
    console.log(`[${logPrefix}] Falling back to OpenRouter: ${OPENROUTER_FALLBACK_MODEL}`);
    const result = await callChatAPI(
      "https://openrouter.ai/api/v1/chat/completions",
      openRouterKey,
      OPENROUTER_FALLBACK_MODEL,
      messages,
      temperature,
      {
        "HTTP-Referer": "https://deepwork-tracker.app",
        "X-Title": "Deep Work Tracker",
      }
    );
    console.log(`[${logPrefix}] OpenRouter success, tokens: ${JSON.stringify(result.usage)}`);
    return { ...result, provider: "openrouter" };
  }

  throw new Error("All AI providers failed");
}

/**
 * Call Groq with a specific model and retry logic for rate limits
 */
async function callGroqWithRetry(
  model: string,
  messages: ChatMessage[],
  temperature: number,
  logPrefix: string,
  maxRetries = 2
): Promise<{ content: string; usage: unknown; provider: string }> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const attemptLabel = attempt > 0 ? ` (retry ${attempt})` : "";
      console.log(`[${logPrefix}] Calling Groq: ${model}${attemptLabel}`);

      const result = await callChatAPI(
        "https://api.groq.com/openai/v1/chat/completions",
        groqKey,
        model,
        messages,
        temperature
      );
      console.log(`[${logPrefix}] Success, tokens: ${JSON.stringify(result.usage)}`);
      return { ...result, provider: "groq" };
    } catch (error) {
      const isRateLimit = error instanceof Error && error.message.includes("429");
      if (isRateLimit && attempt < maxRetries) {
        console.log(`[${logPrefix}] Rate limited, waiting 3s...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

function normalizeInput(text: string): string {
  return text
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

function removeFiller(text: string): string {
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

function parseDayCodes(text: string): string[] {
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

function extractTimeQualifier(text: string): string | null {
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

function parseGoalInput(text: string): GoalDraft {
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
  
  let activity = input
    .replace(/for\s+\d+\s*(?:minutes?|hours?)/gi, "")
    .replace(/\d+\s*(?:minutes?|hours?)\s*(?:each|per|a)?\s*(?:time|day|session)?/gi, "")
    .replace(/every\s+(?:morning|night|evening|afternoon|day)/gi, "")
    .replace(/every\s*day/gi, "")
    .replace(/daily/gi, "")
    .replace(/\d+\s*(?:times?|x)\s*(?:a|per)\s*week/gi, "")
    .replace(/(?:on\s+)?(?:weekends?|weekdays?)/gi, "")
    .replace(dayNamePattern, "")
    // Also strip "to" when it appears between day references (e.g., "mon to fri")
    .replace(/\s+to\s+/gi, " ")
    .replace(/(?:after|before)\s+(?:school|work|dinner|lunch|breakfast|bed)/gi, "")
    .replace(/in\s+the\s+(?:morning|evening|afternoon)/gi, "")
    .replace(/at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (activity.length > 2 && /[a-z]/i.test(activity)) {
    result.what = activity;
  }

  return result;
}

function formatDuration(num: string, unit: string): string {
  const unitName = unit.startsWith("h") ? "hour" : "minute";
  return `${num} ${unitName}${num !== "1" ? "s" : ""}`;
}

function parseDuration(text: string): string | null {
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

function parseSchedule(text: string): string | null {
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

function deriveScheduleUpdate(text: string, currentWhen: string | null): string | null {
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
 * Used to exit confirm mode and re-ask the schedule question.
 */
function isScheduleEditRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  // "change the days", "change days", "change schedule", "change frequency", "number of days"
  if (/change\s+(the\s+)?(days?|schedule|frequency)/.test(lower)) return true;
  // "no, change the days" chip text
  if (/^no[,]?\s+(change\s+(the\s+)?(days?|schedule|frequency))/.test(lower)) return true;
  // "number of days", "no of days", "n of days"
  if (/(number|no|n)\s+of\s+days?/.test(lower)) return true;
  // "how many days", "which days"
  if (/(how\s+many|which)\s+days?/.test(lower)) return true;
  // "different days"
  if (/different\s+days?/.test(lower)) return true;
  return false;
}

/**
 * Detect requests to edit the duration specifically.
 */
function isDurationEditRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (/change\s+(the\s+)?(duration|time|length|how\s+long)/.test(lower)) return true;
  if (/(shorter|longer|more|less)\s+time/.test(lower)) return true;
  return false;
}


/**
 * Detect requests to edit the activity/what specifically.
 */
function isActivityEditRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (/change\s+(the\s+)?(activity|goal|what)/.test(lower)) return true;
  if (/different\s+(activity|goal)/.test(lower)) return true;
  return false;
}

/**
 * Detect requests to start over / reset the draft.
 */
function isStartOverRequest(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (/start\s+over|reset|clear|begin\s+again|from\s+scratch|new\s+goal/i.test(lower)) return true;
  return false;
}

function isModificationRequest(text: string): boolean {
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

function parseModification(text: string, currentGoal: GoalDraft): GoalDraft | null {
  let lower = text.toLowerCase().trim()
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

function generateTitle(what: string | null): string {
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

function generateTasks(what: string, when: string): SuggestedTask[] {
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

function buildGoalSummary(draft: GoalDraft): GoalSummary {
  return {
    title: generateTitle(draft.what || "goal"),
    what: draft.what || "goal",
    when: draft.when || "this sprint",
    howLong: draft.howLong || "each time",
  };
}

function formatPlan(goal: GoalSummary): string {
  return `Here's your plan so far:\n• ${goal.what}\n• ${goal.when}, ${goal.howLong} each\n\nTap "Yes, looks good!" or type yes to confirm.`;
}

function isConfirmation(text: string): boolean {
  const lower = text.toLowerCase().trim();
  return /^(yes|yeah|yep|yup|sure|ok|okay|looks good|perfect|confirm|do it|go ahead|that's? (good|right|correct))/.test(lower);
}

function mergeDraft(base: GoalDraft, update: GoalDraft): GoalDraft {
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

function isDraftComplete(draft: GoalDraft): boolean {
  return Boolean(draft.what && draft.when && draft.howLong);
}

async function extractActivity(userText: string) {
  const messages: ChatMessage[] = [
    { role: "system", content: ACTIVITY_EXTRACTION_PROMPT },
    { role: "user", content: userText },
  ];
  const result = await callAIWithFallback(messages, 0.2, "GoalChat:extract");
  const trimmed = result.content.trim().replace(/^["']|["']$/g, "");
  const isActivity = trimmed.length > 0 && trimmed.length < 50 && !trimmed.includes("?");
  return {
    activity: isActivity ? trimmed.toLowerCase() : null,
    question: isActivity ? null : trimmed,
    provider: result.provider,
    usage: result.usage,
  };
}

async function handleHybridGoalChatTurn(
  userText: string,
  draftInput: GoalDraft | null
): Promise<{
  content: string;
  draft: (GoalDraft & { awaitingConfirm?: boolean }) | null;
  promptChips: string[];
  goalReadyPayload?: { goal: GoalSummary; suggestedTasks: SuggestedTask[] };
  provider?: string;
  usage?: unknown;
}> {
  let draft: GoalDraft & { awaitingConfirm?: boolean } = draftInput ?? { what: null, when: null, howLong: null };

  // Handle "Start over" request - reset the entire draft
  if (isStartOverRequest(userText)) {
    return {
      content: "No problem, let's start fresh! What would you like to work on?",
      draft: { what: null, when: null, howLong: null },
      promptChips: PROMPT_CHIPS.initial,
    };
  }

  if (draft.awaitingConfirm && isDraftComplete(draft)) {
    if (isConfirmation(userText)) {
      const summary = buildGoalSummary(draft);
      return {
        content: "Goal created!",
        draft: null,
        promptChips: [],
        goalReadyPayload: { goal: summary, suggestedTasks: generateTasks(summary.what, summary.when) },
      };
    }

    // Handle specific schedule edit requests (e.g., "change the days", "no, change the days" chip)
    if (isScheduleEditRequest(userText)) {
      const updatedDraft = { ...draft, when: null, awaitingConfirm: false };
      return {
        content: "Got it — how often (or which days) work best for you?",
        draft: updatedDraft,
        promptChips: PROMPT_CHIPS.schedule,
      };
    }

    // Handle specific duration edit requests
    if (isDurationEditRequest(userText)) {
      const updatedDraft = { ...draft, howLong: null, awaitingConfirm: false };
      return {
        content: "Got it! How long each time?",
        draft: updatedDraft,
        promptChips: PROMPT_CHIPS.duration,
      };
    }

    // Handle specific activity edit requests
    if (isActivityEditRequest(userText)) {
      const updatedDraft = { ...draft, what: null, awaitingConfirm: false };
      return {
        content: "Got it! What would you like to work on instead?",
        draft: updatedDraft,
        promptChips: PROMPT_CHIPS.initial,
      };
    }

    if (isModificationRequest(userText)) {
      const modified = parseModification(userText, draft);
      if (modified) {
        const summary = buildGoalSummary(modified);
        return {
          content: formatPlan(summary),
          draft: { ...modified, awaitingConfirm: true },
          promptChips: PROMPT_CHIPS.confirmation,
        };
      }
      // Handle "fewer days", "more days" requests
      if (/(fewer|less|reduce)\s+days?|add\s+more\s+days?|more\s+days?/i.test(userText)) {
        const updatedDraft = { ...draft, when: null, awaitingConfirm: false };
        return {
          content: "How often (or which days) should it be?",
          draft: updatedDraft,
          promptChips: PROMPT_CHIPS.schedule,
        };
      }
      // Generic modification request but couldn't parse - ask what to change
      return {
        content: "Got it — want to change days, duration, or the activity?",
        draft: { ...draft, awaitingConfirm: false },
        promptChips: ["Change schedule", "Change duration", "Change activity", "Start over"],
      };
    }

    const directSchedule = deriveScheduleUpdate(userText, draft.when);
    const directDuration = parseDuration(userText);
    if (directSchedule || directDuration) {
      const updatedDraft = {
        ...draft,
        when: directSchedule ?? draft.when,
        howLong: directDuration ?? draft.howLong,
      };
      const summary = buildGoalSummary(updatedDraft);
      return {
        content: formatPlan(summary),
        draft: { ...updatedDraft, awaitingConfirm: true },
        promptChips: PROMPT_CHIPS.confirmation,
      };
    }
    // Updated copy for confirmation prompt
    return {
      content: 'Tap "Yes, looks good!" above or type yes to confirm.',
      draft,
      promptChips: PROMPT_CHIPS.confirmation,
    };
  }

  // Prevent `what` from being overwritten by edit intent text
  // When draft.what already exists and user sends a modification request,
  // do NOT run parseGoalInput which could overwrite `what`
  if (draft.what && isModificationRequest(userText)) {
    // Try to parse as a schedule or duration modification
    const modified = parseModification(userText, draft);
    if (modified) {
      draft = modified;
    } else if (isScheduleEditRequest(userText)) {
      // User wants to change schedule but didn't provide new value
      return {
        content: "How often (or which days) work best for you?",
        draft: { ...draft, when: null },
        promptChips: PROMPT_CHIPS.schedule,
      };
    } else if (isDurationEditRequest(userText)) {
      // User wants to change duration but didn't provide new value
      return {
        content: "How long each time?",
        draft: { ...draft, howLong: null },
        promptChips: PROMPT_CHIPS.duration,
      };
    } else if (isActivityEditRequest(userText)) {
      // User wants to change activity but didn't provide new value
      return {
        content: "What would you like to work on instead?",
        draft: { ...draft, what: null },
        promptChips: PROMPT_CHIPS.initial,
      };
    } else {
      // Unclear modification - ask for clarification without corrupting the draft
      return {
        content: "Got it — want to change days, duration, or the activity?",
        draft,
        promptChips: ["Change schedule", "Change duration", "Change activity", "Start over"],
      };
    }
  } else {
    // Only parse goal input if not a modification request (to protect draft.what)
    const parsed = parseGoalInput(userText);
    draft = mergeDraft(draft, parsed);
  }

  if (!draft.what) {
    const extraction = await extractActivity(userText);
    if (extraction.activity) {
      draft = { ...draft, what: extraction.activity };
      if (isDraftComplete(draft)) {
      const summary = buildGoalSummary(draft);
      return {
        content: formatPlan(summary),
        draft: { ...draft, awaitingConfirm: true },
        promptChips: PROMPT_CHIPS.confirmation,
        provider: extraction.provider,
        usage: extraction.usage,
      };
      }
      if (!draft.howLong) {
        return {
          content: `Got it - ${draft.what}! How long each time?`,
          draft,
          promptChips: PROMPT_CHIPS.duration,
          provider: extraction.provider,
          usage: extraction.usage,
        };
      }
      if (!draft.when) {
        return {
          content: "How often (or which days)?",
          draft,
          promptChips: PROMPT_CHIPS.schedule,
          provider: extraction.provider,
          usage: extraction.usage,
        };
      }
    }
    return {
      content: extraction.question || "What would you like to work on?",
      draft,
      promptChips: PROMPT_CHIPS.initial,
      provider: extraction.provider,
      usage: extraction.usage,
    };
  }

  const previousHowLong = draft.howLong;
  const previousWhen = draft.when;

  if (!draft.howLong) {
    const duration = parseDuration(userText);
    if (duration) draft = { ...draft, howLong: duration };
  }
  if (!draft.when) {
    const schedule = parseSchedule(userText);
    if (schedule) draft = { ...draft, when: schedule };
  }

  if (isDraftComplete(draft)) {
    const summary = buildGoalSummary(draft);
    return {
      content: formatPlan(summary),
      draft: { ...draft, awaitingConfirm: true },
      promptChips: PROMPT_CHIPS.confirmation,
    };
  }

  if (!draft.howLong) {
    return {
      content: draft.when && draft.when !== previousWhen
        ? `Got it — ${draft.when}. How long each time?`
        : "How long each time?",
      draft,
      promptChips: PROMPT_CHIPS.duration,
    };
  }

  if (!draft.when) {
    return {
      content: draft.howLong && draft.howLong !== previousHowLong
        ? `Got it — ${draft.howLong}. How often (or which days)?`
        : "How often (or which days)?",
      draft,
      promptChips: PROMPT_CHIPS.schedule,
    };
  }

  return {
    content: "What would you like to work on?",
    draft,
    promptChips: PROMPT_CHIPS.initial,
  };
}

function shouldUseGoalOpsAI(
  userText: string,
  draft: GoalDraft | null,
  existingGoals?: GoalInfo[],
  previousSprintGoals?: PreviousGoalInfo[]
): boolean {
  if (draft && (draft.what || draft.when || draft.howLong)) return false;
  const lower = userText.toLowerCase();
  const hasDuplicate = /\b(duplicate|copy|clone)\b/.test(lower);
  const hasImport = /\b(import|bring back|restore)\b/.test(lower);
  const hasEdit = /\b(edit|update|modify|revise|change)\b/.test(lower) && /goal/.test(lower);
  const goalTitles = [...(existingGoals || []), ...(previousSprintGoals || [])].map((g) => g.title.toLowerCase());
  const mentionsGoalTitle =
    goalTitles.some((title) => title && lower.includes(title)) &&
    /\b(goal|duplicate|copy|clone|import|bring back|restore|edit|update|modify|revise|change)\b/.test(lower);
  return hasDuplicate || hasImport || hasEdit || mentionsGoalTitle;
}

// ============================================================================
// Goal-Setting Chat Prompts
// ============================================================================

function buildGoalsContext(
  existingGoals?: GoalInfo[],
  previousSprintGoals?: PreviousGoalInfo[]
): string {
  const sections: string[] = [];

  if (existingGoals && existingGoals.length > 0) {
    const list = existingGoals.map((g, i) => `${i + 1}. "${g.title}" (id: ${g.id})`).join("\n");
    sections.push(`\nCURRENT SPRINT GOALS:\n${list}`);
  }

  if (previousSprintGoals && previousSprintGoals.length > 0) {
    const list = previousSprintGoals
      .map((g, i) => `${i + 1}. "${g.title}" from ${g.sprintName} (id: ${g.id})`)
      .join("\n");
    sections.push(`\nPREVIOUS SPRINT GOALS (available to import):\n${list}`);
  }

  return sections.join("\n");
}

function buildCaptainPrompt(sprintDays: number, goalsContext: string): string {
  return `You are Captain - a direct, efficient goal-setting assistant. You help students set goals FAST in 2-3 turns max.

STYLE:
- Brief, direct responses (1-2 sentences max)
- No small talk - get straight to the point
- If you have enough info, create the goal immediately
- Only ask ONE clarifying question if absolutely needed
${goalsContext}
AVAILABLE ACTIONS:
1. CREATE new goal → output \`\`\`goal-ready JSON
2. DUPLICATE existing goal → output \`\`\`duplicate-goal JSON
3. IMPORT goal from previous sprint → output \`\`\`import-goal JSON
4. EDIT existing goal → output \`\`\`edit-goal JSON

OPENING (first message only):
"What do you want to accomplish? Quick: (1) the goal, (2) how you'll know it's done."

IF USER WANTS TO DUPLICATE:
User: "duplicate my reading goal" or "copy [goal name]"
→ Find the matching goal from CURRENT SPRINT GOALS
→ Output:
\`\`\`duplicate-goal
{ "action": "duplicate", "sourceGoalId": "the_goal_id" }
\`\`\`

IF USER WANTS TO IMPORT FROM PREVIOUS SPRINT:
User: "bring back my exercise goal" or "import [goal name] from last sprint"
→ Find the matching goal from PREVIOUS SPRINT GOALS
→ Output:
\`\`\`import-goal
{ "action": "import", "sourceGoalId": "the_goal_id" }
\`\`\`

IF USER WANTS TO EDIT AN EXISTING GOAL:
User: "change my reading goal to 2 books" or "update [goal name]"
→ Find the matching goal, ask what to change if unclear
→ Output:
\`\`\`edit-goal
{ "action": "edit", "goalId": "the_goal_id", "updates": { "title": "new title", "specific": "new specific", "measurable": "new measurable" } }
\`\`\`
Only include fields that need to change.

IF USER WANTS TO CREATE A NEW GOAL:
When you have: (1) what they want to do, (2) how to measure success
→ Output immediately:
\`\`\`goal-ready
{
  "ready": true,
  "goal": {
    "title": "Short title (5 words max)",
    "specific": "What exactly will be done",
    "measurable": "How success is measured",
    "achievable": "Why this is realistic for ${sprintDays} days",
    "relevant": "Why this matters",
    "timeBound": "By end of this ${sprintDays}-day sprint"
  },
  "suggestedTasks": [
    { "title": "Task 1", "weekNumber": 1, "dayOfWeek": 1 },
    { "title": "Task 2", "weekNumber": 1, "dayOfWeek": 3 },
    { "title": "Task 3", "weekNumber": 2, "dayOfWeek": 1 }
  ]
}
\`\`\`

TASK RULES:
- weekNumber: 1 or 2
- dayOfWeek: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
- 3-6 tasks spread across days

Be decisive. If you can create a goal from what they said, do it. Don't over-ask.`;
}

function buildMusePrompt(sprintDays: number, goalsContext: string): string {
  return `You are a warm, friendly coach helping a student set ONE meaningful goal for their ${sprintDays}-day sprint. Think of yourself as a supportive friend who asks thoughtful questions.

CONVERSATION STYLE:
- Be genuinely curious about what they want to achieve
- Ask ONE clear question at a time, then wait
- Keep responses SHORT (1-2 sentences + your question)
- Use their words back to them to show you're listening
- Be encouraging but not over-the-top
${goalsContext}
AVAILABLE ACTIONS:
1. CREATE new goal → output \`\`\`goal-ready JSON
2. DUPLICATE existing goal → output \`\`\`duplicate-goal JSON
3. IMPORT goal from previous sprint → output \`\`\`import-goal JSON
4. EDIT existing goal → output \`\`\`edit-goal JSON

GUIDE THEM THROUGH THESE STEPS (one at a time):
1. "What's something you'd really like to accomplish in the next ${sprintDays} days?"
2. "Tell me more - what would that look like when it's done?"
3. "How will you know you've succeeded? What's a way to measure it?"
4. "That sounds great! What makes this goal meaningful to you right now?"
5. After 3-4 exchanges, say: "I think I've got a good picture! Let me put together your goal..."

EXAMPLE CONVERSATION:
User: "I want to read more"
You: "I love that! What kind of reading are you thinking - books, articles, something specific? And roughly how much would feel like a win for you?"

User: "Maybe finish one book"
You: "One book in ${sprintDays} days - totally doable! What book are you thinking, or what genre interests you?"

IF USER WANTS TO DUPLICATE:
User: "duplicate my reading goal" or "copy [goal name]"
Say: "Got it! Creating a copy of that goal..."
\`\`\`duplicate-goal
{ "action": "duplicate", "sourceGoalId": "the_goal_id" }
\`\`\`

IF USER WANTS TO IMPORT FROM PREVIOUS SPRINT:
User: "bring back my exercise goal" or "import from last sprint"
Say: "Bringing that one back for this sprint..."
\`\`\`import-goal
{ "action": "import", "sourceGoalId": "the_goal_id" }
\`\`\`

IF USER WANTS TO EDIT AN EXISTING GOAL:
User: "change my reading goal to 2 books"
Say: "Updating that goal for you..."
\`\`\`edit-goal
{ "action": "edit", "goalId": "the_goal_id", "updates": { "measurable": "Read 2 books" } }
\`\`\`

WHEN READY TO CREATE NEW GOAL:
When you have gathered enough information (usually after 3-5 exchanges), output:

\`\`\`goal-ready
{
  "ready": true,
  "goal": {
    "title": "Short goal title (5 words max)",
    "specific": "What exactly will be done",
    "measurable": "How success will be measured",
    "achievable": "Why this is realistic",
    "relevant": "Why this matters to the student",
    "timeBound": "By end of this ${sprintDays}-day sprint"
  },
  "suggestedTasks": [
    { "title": "Task 1 description", "weekNumber": 1, "dayOfWeek": 1 },
    { "title": "Task 2 description", "weekNumber": 1, "dayOfWeek": 3 },
    { "title": "Task 3 description", "weekNumber": 2, "dayOfWeek": 1 }
  ]
}
\`\`\`

TASK SCHEDULING RULES:
- weekNumber: 1 for first week, 2 for second week
- dayOfWeek: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
- Spread tasks across multiple days, not all on one day
- Suggest 3-6 realistic tasks

IMPORTANT: Only output the JSON when you've naturally gathered all the information through conversation. Don't rush - let the student express themselves. Before outputting JSON, say something like "Great! I think I have a good picture now. Let me put together a goal for you..."

HANDLING REVISIONS:
If the conversation contains a "[REVISION REQUEST]" message, it means the student reviewed a goal you previously created and wants changes. In this case:
1. Ask what they'd like to change (if not already specified)
2. When they tell you the changes, acknowledge them briefly
3. Output a NEW goal-ready JSON block with the updated goal
4. Always output the full JSON block again after revisions - don't just describe the changes`;
}

function buildSystemPrompt(
  sprintDays: number,
  persona: AIPersona,
  existingGoals?: GoalInfo[],
  previousSprintGoals?: PreviousGoalInfo[]
): string {
  const goalsContext = buildGoalsContext(existingGoals, previousSprintGoals);

  if (persona === "captain") {
    return buildCaptainPrompt(sprintDays, goalsContext);
  }
  return buildMusePrompt(sprintDays, goalsContext);
}

// ============================================================================
// Book Buddy Prompts
// ============================================================================

const PERSONALITY_PROMPTS: Record<BookBuddyPersonality, string> = {
  luna: `You are Luna, a dreamy bookworm who lives in the library. You speak in gentle, imaginative language and get genuinely excited about stories.

STYLE:
- Dreamy, speaks in gentle metaphors
- Gets genuinely excited about stories
- Use phrases like "Oh, this one's like stepping into a dream..." or "Picture this..." or "I just LOVE this one..."
- Best for: kids who love fantasy, imagination, cozy reads

Keep responses SHORT (1-2 sentences). Respond to what the user said - don't just give a generic greeting.`,

  dash: `You are Dash, an energetic book explorer! You text quick and get HYPED about good books.

STYLE:
- Quick, energetic, text-message style
- Uses short sentences, occasional caps for excitement
- Phrases like "Okay okay okay - I've got THE book!" or "Boom! You're gonna love this" or "THIS ONE"
- Best for: kids who want fast, action-packed recs

Keep it FAST - 1 question max, then recommend. Respond to what the user said - don't just give a generic greeting.`,

  hagrid: `You are Hagrid from Harry Potter - the friendly half-giant who loves magical creatures and good stories.

STYLE:
- Warm, enthusiastic, uses his distinctive speech patterns
- "Yer gonna love this one, I reckon!"
- "Blimey, this book's got everything!"
- "I shouldn' be tellin' yeh this, but..."
- Gentle giant energy, makes kids feel safe
- Best for: Harry Potter fans, kids who want a comforting guide

Be warm, enthusiastic, and make the child feel safe. Keep responses short. Respond to what the user said - don't just give a generic greeting.`,
};

interface ReadingHistoryItem {
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  status: string;
}

interface AvailableBook {
  id: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
}

function buildCreativeBookBuddyPrompt(
  personality: BookBuddyPersonality,
  readingHistory: ReadingHistoryItem[],
  availableBooks: AvailableBook[]
): string {
  const personalitySection = PERSONALITY_PROMPTS[personality];

  const historySection =
    readingHistory.length > 0
      ? `READING HISTORY:\n${readingHistory
          .map(
            (b) =>
              `- "${b.title}" by ${b.author}${b.genre ? ` (${b.genre})` : ""}${b.rating ? ` - rated ${b.rating}/5` : ""}`
          )
          .join("\n")}`
      : "READING HISTORY: None yet - first time reader!";

  const booksSection = `AVAILABLE BOOKS (use exact IDs when recommending):\n${availableBooks
    .map(
      (b) =>
        `- ID="${b.id}" "${b.title}" by ${b.author}${b.genre ? ` [${b.genre}]` : ""}${b.description ? ` - ${b.description.slice(0, 80)}` : ""}`
    )
    .join("\n")}`;

  return `${personalitySection}

${historySection}

${booksSection}

YOUR TASK:
1. Respond to what the user said in your character's voice
2. If they're asking for recommendations, suggest 1-3 books from the AVAILABLE BOOKS list
3. For each book, include: the exact ID, a fun 2-sentence teaser, and why they'll like it based on their history
4. End with 2-4 suggested follow-up options the kid might want to click

KEEP IT SHORT AND FUN! No lectures. Be the character.

When recommending books, use this format:
BOOK: id="X" title="..." author="..."
TEASER: [exciting 2 sentences]
WHY YOU'LL LOVE IT: [connection to their interests]

SUGGESTED REPLIES: [2-4 short options like "More like this!", "Different genre", etc.]`;
}

function buildFormatterPrompt(
  creativeResponse: string,
  availableBooks: Array<{ id: string; title: string; author: string }>
): string {
  const bookIds = availableBooks.map((b) => `"${b.id}"`).join(", ");

  return `Convert this book buddy response into valid JSON format.

CREATIVE RESPONSE:
${creativeResponse}

OUTPUT EXACTLY THIS FORMAT (start with \`\`\`buddy-response, end with \`\`\`):
\`\`\`buddy-response
{
  "message": "The conversational message from the response above",
  "suggestedReplies": [
    {"label": "Short label", "fullText": "Full message to send"},
    {"label": "Another option", "fullText": "Another full message"}
  ],
  "books": [
    {
      "id": "exact_id_from_response",
      "title": "Book Title",
      "author": "Author Name",
      "teaser": "The teaser from the response",
      "whyYoullLikeIt": "The why they'll love it reason"
    }
  ]
}
\`\`\`

RULES:
- Start with EXACTLY \`\`\`buddy-response (not \`\`\`json)
- Extract the message, keeping the character's voice
- Book IDs must be from this list: ${bookIds}
- If no books mentioned, use empty array: "books": []
- If no suggestions found, create 2-3 generic ones like "More books", "Different genre", "Surprise me"
- Output ONLY the code block, nothing before or after`;
}

// ============================================================================
// Project Data Entry Prompt
// ============================================================================

function buildProjectDataPrompt(
  projectName: string,
  students: Array<{ id: string; name: string; batch?: string }>
): string {
  const studentList = students
    .map((s) => `- ${s.name}${s.batch ? ` (Batch ${s.batch})` : ""} [id: ${s.id}]`)
    .join("\n");

  return `You are a helpful assistant for entering project data for "${projectName}". Your job is to extract structured data from admin messages about student work.

AVAILABLE STUDENTS:
${studentList}

YOUR TASK:
1. Listen to what the admin tells you about student work
2. Match student names mentioned (fuzzy match OK - "John", "John S.", "Smith" all match "John Smith")
3. Extract: links to work, what they did well, project description, areas to improve
4. Output structured data for saving

CONVERSATION STYLE:
- Be efficient and helpful
- Confirm what you understood
- Ask for clarification only if truly ambiguous
- You can handle multiple students in one message

WHEN YOU HAVE DATA TO SAVE, output:
\`\`\`project-data
{
  "students": [
    {
      "studentName": "matched student name",
      "studentId": "the_student_id_from_list",
      "links": [
        { "url": "https://...", "title": "Link title", "type": "presentation|document|video|other" }
      ],
      "reflections": {
        "didWell": "What they did well (or null if not mentioned)",
        "projectDescription": "Description of their project (or null)",
        "couldImprove": "Areas for improvement (or null)"
      }
    }
  ],
  "summary": "Brief summary of what was captured"
}
\`\`\`

LINK TYPE DETECTION:
- URLs containing "presentation", "slides", "ppt" → "presentation"
- URLs containing "doc", "pdf", "sheet" → "document"
- URLs containing "video", "youtube", "loom" → "video"
- Otherwise → "other"

IMPORTANT RULES:
1. Only output the JSON block when you have actual data to save
2. Use null for reflection fields not mentioned (don't make up content)
3. Always include a friendly message BEFORE the JSON block
4. If you can't match a student name, ask for clarification
5. Partial data is OK - admin can add more later

OPENING MESSAGE (first message only):
"Hi! I'm here to help you enter project data quickly. You can tell me about student work in natural language - like 'John's presentation is at [link], he did great research on solar panels.'

I'll extract the data and confirm before saving. Ready when you are!"`;
}

// ============================================================================
// Exported Actions
// ============================================================================

export const chat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    sprintDaysRemaining: v.number(),
    model: v.optional(v.string()),
    persona: v.optional(v.union(v.literal("muse"), v.literal("captain"))),
    existingGoals: v.optional(
      v.array(v.object({ id: v.string(), title: v.string() }))
    ),
    previousSprintGoals: v.optional(
      v.array(v.object({ id: v.string(), title: v.string(), sprintName: v.string() }))
    ),
    draft: v.optional(
      v.object({
        what: v.optional(v.string()),
        when: v.optional(v.string()),
        howLong: v.optional(v.string()),
        awaitingConfirm: v.optional(v.boolean()),
      })
    ),
  },
  handler: async (_ctx, args) => {
    const persona = args.persona ?? "muse";
    const lastUserMessage = args.messages[args.messages.length - 1]?.content ?? "";
    const draft: (GoalDraft & { awaitingConfirm?: boolean }) | null = args.draft
      ? {
          what: args.draft.what ?? null,
          when: args.draft.when ?? null,
          howLong: args.draft.howLong ?? null,
          awaitingConfirm: args.draft.awaitingConfirm ?? undefined,
        }
      : null;

    if (shouldUseGoalOpsAI(lastUserMessage, draft, args.existingGoals, args.previousSprintGoals)) {
      const systemPrompt = buildSystemPrompt(
        args.sprintDaysRemaining,
        persona,
        args.existingGoals,
        args.previousSprintGoals
      );

      const apiMessages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        ...args.messages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const temperature = persona === "captain" ? 0.5 : 0.7;

      return callAIWithFallback(apiMessages, temperature, `AI:${persona}`);
    }

    const hybridResult = await handleHybridGoalChatTurn(
      lastUserMessage,
      draft
    );

    if (hybridResult.goalReadyPayload) {
      const content = `${hybridResult.content}\n\n\`\`\`goal-ready\n${JSON.stringify(
        hybridResult.goalReadyPayload
      )}\n\`\`\``;
      return {
        content,
        promptChips: [],
        draft: null,
        provider: hybridResult.provider,
        usage: hybridResult.usage,
      };
    }

    return {
      content: hybridResult.content,
      promptChips: hybridResult.promptChips,
      draft: hybridResult.draft,
      provider: hybridResult.provider,
      usage: hybridResult.usage,
    };
  },
});

export const libraryChat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    personality: v.union(v.literal("luna"), v.literal("dash"), v.literal("hagrid")),
    readingHistory: v.optional(
      v.array(
        v.object({
          title: v.string(),
          author: v.string(),
          genre: v.optional(v.string()),
          rating: v.optional(v.number()),
          status: v.string(),
        })
      )
    ),
    availableBooks: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        author: v.string(),
        genre: v.optional(v.string()),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (_ctx, args) => {
    // Stage 1: Creative response from Kimi K2
    const creativePrompt = buildCreativeBookBuddyPrompt(
      args.personality,
      args.readingHistory ?? [],
      args.availableBooks
    );

    const creativeMessages: ChatMessage[] = [
      { role: "system", content: creativePrompt },
      ...args.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    console.log(`[BookBuddy:${args.personality}] Stage 1: Creative response`);
    const creativeResult = await callAIWithFallback(
      creativeMessages,
      0.85,
      `BookBuddy:${args.personality}:creative`
    );

    // Stage 2: JSON formatting with Llama 8B
    const formatterPrompt = buildFormatterPrompt(
      creativeResult.content,
      args.availableBooks.map((b) => ({ id: b.id, title: b.title, author: b.author }))
    );

    console.log(`[BookBuddy:${args.personality}] Stage 2: JSON formatting`);
    const formattedResult = await callGroqWithRetry(
      GROQ_FORMATTER_MODEL,
      [{ role: "user", content: formatterPrompt }],
      0.1,
      `BookBuddy:${args.personality}:formatter`
    );

    return {
      content: formattedResult.content,
      usage: {
        creative: creativeResult.usage,
        formatter: formattedResult.usage,
      },
      provider: `${creativeResult.provider}+groq-formatter`,
    };
  },
});

// Internal helpers for unit tests (not used by the app directly)
export const __goalChatTesting = {
  deriveScheduleUpdate,
  extractTimeQualifier,
  isModificationRequest,
  parseDuration,
  parseModification,
  parseSchedule,
};

export const projectDataChat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    projectName: v.string(),
    students: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        batch: v.optional(v.string()),
      })
    ),
  },
  handler: async (_ctx, args) => {
    const systemPrompt = buildProjectDataPrompt(args.projectName, args.students);

    const apiMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...args.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    return callAIWithFallback(apiMessages, 0.6, "ProjectData");
  },
});

/**
 * Test chat action - accepts a custom system prompt for testing new prompt designs.
 * Use this to iterate on prompts before updating the production versions.
 */
export const testChat = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      })
    ),
    systemPrompt: v.string(),
    temperature: v.optional(v.number()),
    model: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiMessages: ChatMessage[] = [
      { role: "system", content: args.systemPrompt },
      ...args.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const temperature = args.temperature ?? 0.7;
    const model = args.model ?? GROQ_PRIMARY_MODEL;

    // Use direct Groq call with specified model
    return callGroqWithRetry(model, apiMessages, temperature, "TestChat");
  },
});
