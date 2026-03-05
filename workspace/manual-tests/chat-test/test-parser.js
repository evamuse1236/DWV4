// Combined test suite for goal parser

function normalizeInput(text) {
  return text
    .replace(/\bevr?e?y\b/gi, 'every')
    .replace(/\bdaiy\b/gi, 'daily')
    .replace(/\b(mornign|moning|morining|mornig|mornng)\b/gi, 'morning')
    .replace(/\bnite\b/gi, 'night')
    .replace(/\bwek\b/gi, 'week')
    .replace(/\btims?\b/gi, 'times')
    .replace(/\b(\d+)\s*(?:minits?|minuts?|minz?|mins?|m)\b/gi, '$1 minutes')
    .replace(/\b(\d+)\s*(?:hours?|hrs?|hor|h)\b/gi, '$1 hours')
    .replace(/\bhalf\s+(?:an\s+)?hour\b/gi, '30 minutes')
    .replace(/\ban\s+hour\b/gi, '1 hour')
    .replace(/\b(\d+)x\/wk\b/gi, '$1 times a week')
    .replace(/\b(\d+)x\s*\/\s*week\b/gi, '$1 times a week');
}

function removeFiller(text) {
  return text
    // Remove thinking sounds with variable letters (hmm, hmmm, umm, ummm, uhh, uhhh, etc.)
    .replace(/\b(h+m+|u+m+|u+h+|e+r+|a+h+)\b/gi, '')
    // Remove longer filler phrases first
    .replace(/\b(was thinking of|thinking of|working on|getting better at|get better at|improve my|improve at)\b/gi, '')
    .replace(/\b(hey|hi|hello|okay|ok|like|so|basically|really|just|actually|i guess|i think|i want to|i need to|i'd like to|try to|maybe|probably|perhaps|around|about|approximately|or so|or something|single)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGoalInput(text) {
  const normalized = normalizeInput(text.toLowerCase().trim());
  const cleaned = removeFiller(normalized);
  const input = cleaned; // If only filler words, input is empty (that's correct)
  const result = { what: null, when: null, howLong: null, confidence: 0 };

  const durationPatterns = [
    /for\s+(\d+)\s*(minutes?|hours?)/i,
    /(\d+)\s*(minutes?|hours?)\s*(?:each|per|a)?\s*(?:time|day|session)?/i,
    /(\d+)\s*(minutes?|hours?)$/i,
    /(\d+)\s*(minutes?|hours?)/i,
  ];
  for (const pat of durationPatterns) {
    const match = input.match(pat);
    if (match) {
      const num = match[1];
      const unit = match[2].startsWith('h') ? 'hour' : 'minute';
      result.howLong = num + ' ' + unit + (num !== '1' ? 's' : '');
      result.confidence++;
      break;
    }
  }

  const schedulePatterns = [
    { pattern: /every\s+(morning|night|evening|afternoon|day)/i, extract: m => 'every ' + m[1] },
    { pattern: /every\s*day/i, extract: () => 'every day' },
    { pattern: /daily/i, extract: () => 'every day' },
    { pattern: /(\d+)\s*(?:times?|x)\s*(?:a|per)\s*week/i, extract: m => m[1] + 'x per week' },
    { pattern: /(?:on\s+)?(weekends?)/i, extract: m => 'on ' + m[1] },
    { pattern: /(?:on\s+)?(weekdays?)/i, extract: m => 'on ' + m[1] },
    { pattern: /(?:on\s+)?(mon(?:day)?s?|tue(?:sday)?s?|wed(?:nesday)?s?|thu(?:rsday)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?)/i, extract: m => 'on ' + m[1] },
    { pattern: /after\s+(school|work|dinner|lunch|breakfast)/i, extract: m => 'after ' + m[1] },
    { pattern: /before\s+(school|work|dinner|lunch|breakfast|bed)/i, extract: m => 'before ' + m[1] },
    { pattern: /in\s+the\s+(morning|evening|afternoon)/i, extract: m => 'in the ' + m[1] },
    { pattern: /at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i, extract: m => 'at ' + m[1] },
  ];
  for (const { pattern, extract } of schedulePatterns) {
    const match = input.match(pattern);
    if (match) {
      result.when = extract(match);
      result.confidence++;
      break;
    }
  }

  let activity = input
    .replace(/for\s+\d+\s*(?:minutes?|hours?)/gi, '')
    .replace(/\d+\s*(?:minutes?|hours?)\s*(?:each|per|a)?\s*(?:time|day|session)?/gi, '')
    .replace(/every\s+(?:morning|night|evening|afternoon|day)/gi, '')
    .replace(/every\s*day/gi, '')
    .replace(/daily/gi, '')
    .replace(/\d+\s*(?:times?|x)\s*(?:a|per)\s*week/gi, '')
    .replace(/(?:on\s+)?(?:weekends?|weekdays?)/gi, '')
    .replace(/(?:on\s+)?(?:mon(?:day)?s?|tue(?:sday)?s?|wed(?:nesday)?s?|thu(?:rsday)?s?|fri(?:day)?s?|sat(?:urday)?s?|sun(?:day)?s?)/gi, '')
    .replace(/(?:after|before)\s+(?:school|work|dinner|lunch|breakfast|bed)/gi, '')
    .replace(/in\s+the\s+(?:morning|evening|afternoon)/gi, '')
    .replace(/at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (activity.length > 2 && /[a-z]/i.test(activity)) {
    result.what = activity;
    result.confidence++;
  }
  return result;
}

function generateTitle(what) {
  if (!what) return 'New Goal';
  const text = what.toLowerCase().trim();
  const patterns = [
    [/^(watch|play|practice|study|learn|read|write|draw|paint|cook|bake|make|build|create)\s+(.+)$/i,
      (_, verb, noun) => {
        const verbMap = { watch: 'Watching', play: 'Playing', practice: 'Practice',
          study: 'Study', learn: 'Learning', read: 'Reading', write: 'Writing',
          draw: 'Drawing', paint: 'Painting', cook: 'Cooking', bake: 'Baking',
          make: 'Making', build: 'Building', create: 'Creating' };
        const n = noun.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return (n + ' ' + (verbMap[verb.toLowerCase()] || '')).trim();
      }],
    [/^eat\s+(breakfast|lunch|dinner)$/i, (_, meal) =>
      ({ breakfast: 'Morning Breakfast', lunch: 'Lunch Time', dinner: 'Evening Dinner' })[meal.toLowerCase()]],
    [/^(exercise|workout|run|jog|walk|swim|yoga|meditate)$/i, (_, act) =>
      ({ exercise: 'Daily Exercise', workout: 'Workout', run: 'Running', jog: 'Jogging',
         walk: 'Walking', swim: 'Swimming', yoga: 'Yoga', meditate: 'Meditation' })[act.toLowerCase()]],
    [/^do\s+(my\s+)?(homework|chores)$/i, (_, __, task) => task.charAt(0).toUpperCase() + task.slice(1)],
  ];
  for (const [regex, transform] of patterns) {
    const match = text.match(regex);
    if (match) return transform(...match);
  }
  return text.split(' ').slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function isConfirmation(text) {
  const lower = text.toLowerCase().trim();
  return /^(yes|yeah|yep|yup|sure|ok|okay|looks good|perfect|confirm|do it|go ahead|that's? (good|right|correct))/.test(lower);
}

function parseDaysFromText(text) {
  const lower = text.toLowerCase();
  const dayNames = [];
  if (/mon/.test(lower)) dayNames.push('Mon');
  if (/tue/.test(lower)) dayNames.push('Tue');
  if (/wed/.test(lower)) dayNames.push('Wed');
  if (/thu/.test(lower)) dayNames.push('Thu');
  if (/fri/.test(lower)) dayNames.push('Fri');
  if (/sat/.test(lower)) dayNames.push('Sat');
  if (/sun/.test(lower)) dayNames.push('Sun');
  if (/weekday/.test(lower)) return 'on weekdays';
  if (/weekend/.test(lower)) return 'on weekends';
  if (/every\s*day|daily/.test(lower)) return 'every day';
  if (dayNames.length > 0) return 'on ' + dayNames.join(', ');
  return null;
}

function parseModification(text, currentGoal) {
  let lower = text.toLowerCase().trim()
    .replace(/^(actually|wait|hmm|um|uh|well|nope)[,]?\s*/i, '')
    .replace(/\s*(instead|please|thanks)$/i, '');

  const onlyMatch = lower.match(/^(?:no[,]?\s*)?(?:just|only)\s+(.+)$/);
  if (onlyMatch) {
    const rest = onlyMatch[1];
    const newWhen = parseDaysFromText(rest);
    if (newWhen) return { ...currentGoal, when: newWhen };
    const durMatch = rest.match(/(\d+)\s*(min|hour|hr)/);
    if (durMatch) {
      const unit = durMatch[2].startsWith('h') ? 'hour' : 'minute';
      return { ...currentGoal, howLong: durMatch[1] + ' ' + unit + 's' };
    }
  }
  const noMatch = lower.match(/^no[,]?\s+(.+)$/);
  if (noMatch) {
    const rest = noMatch[1];
    const newWhen = parseDaysFromText(rest);
    if (newWhen) return { ...currentGoal, when: newWhen };
  }
  const changeMatch = lower.match(/^(?:change|switch|make it)\s+(?:to\s+)?(.+)$/);
  if (changeMatch) {
    const newValue = changeMatch[1];
    const newWhen = parseDaysFromText(newValue);
    if (newWhen) return { ...currentGoal, when: newWhen };
    const durMatch = newValue.match(/(\d+)\s*(min|hour|hr)/);
    if (durMatch) {
      const unit = durMatch[2].startsWith('h') ? 'hour' : 'minute';
      return { ...currentGoal, howLong: durMatch[1] + ' ' + unit + 's' };
    }
  }
  const directWhen = parseDaysFromText(lower);
  if (directWhen) return { ...currentGoal, when: directWhen };
  const directDur = lower.match(/(\d+)\s*(min|hour|hr)/);
  if (directDur) {
    const unit = directDur[2].startsWith('h') ? 'hour' : 'minute';
    return { ...currentGoal, howLong: directDur[1] + ' ' + unit + 's' };
  }
  return null;
}

function matchValue(actual, expected) {
  if (expected === null) return actual === null;
  if (expected instanceof RegExp) return expected.test(actual || '');
  if (typeof expected === 'string') return (actual || '').toLowerCase().includes(expected.toLowerCase());
  return actual === expected;
}

// BASIC TESTS
const BASIC_TESTS = {
  straightforward: [
    { input: 'watch anime every day for 30 minutes', expect: { what: 'watch anime', when: 'every day', howLong: '30 minutes' } },
    { input: 'practice piano 3 times a week for 1 hour', expect: { what: 'practice piano', when: '3x per week', howLong: '1 hour' } },
    { input: 'read books every night for 45 mins', expect: { what: 'read books', when: 'every night', howLong: '45 minutes' } },
    { input: 'exercise daily for 20 minutes', expect: { what: 'exercise', when: 'every day', howLong: '20 minutes' } },
    { input: 'study math after school for 1 hr', expect: { what: 'study math', when: 'after school', howLong: '1 hour' } },
    { input: 'do homework on weekends for 2 hours', expect: { what: 'do homework', when: /weekend/, howLong: '2 hours' } },
  ],
  vague: [
    { input: 'practice piano', expect: { what: 'practice piano', when: null, howLong: null } },
    { input: 'every morning', expect: { what: null, when: 'every morning', howLong: null } },
    { input: '30 minutes', expect: { what: null, when: null, howLong: '30 minutes' } },
    { input: 'something fun', expect: { what: 'something fun', when: null, howLong: null } },
  ],
  chatty: [
    { input: 'hey so like i want to watch anime every day for maybe 30 mins', expect: { what: /watch anime/, when: 'every day', howLong: '30 minutes' } },
    { input: 'um i guess practice piano would be cool like 3x a week for an hour', expect: { what: /piano/, when: '3x per week', howLong: '1 hour' } },
    { input: 'so basically i need to do homework after school for about 45 minutes or so', expect: { what: /homework/, when: 'after school', howLong: '45 minutes' } },
    { input: 'i think maybe read books every night for like half an hour', expect: { what: /read/, when: 'every night', howLong: '30 minutes' } },
  ],
  typos: [
    { input: 'wacth anime evrey day for 30 minuts', expect: { what: /wacth anime/, when: 'every day', howLong: '30 minutes' } },
    { input: 'practise piano 3 times a wek for 1 hour', expect: { what: /practi/, when: '3x per week', howLong: '1 hour' } },
    { input: 'exersize daily for 20 mins', expect: { what: /exersize/, when: 'every day', howLong: '20 minutes' } },
  ],
  edgeCases: [
    { input: '', expect: { what: null, when: null, howLong: null } },
    { input: 'hello', expect: { what: null, when: null, howLong: null } }, // greeting = filler
    { input: 'what can you do?', expect: { what: /what can you do/, when: null, howLong: null } },
    { input: '!!!???', expect: { what: null, when: null, howLong: null } },
    { input: '   ', expect: { what: null, when: null, howLong: null } },
  ],
  modifications: [
    { input: 'no wed and mon', pending: { what: 'piano', when: 'on Mon, Wed, Fri', howLong: '1 hour' }, expect: { when: /wed.*mon|mon.*wed/i } },
    { input: 'just friday', pending: { what: 'piano', when: 'on Mon, Wed, Fri', howLong: '1 hour' }, expect: { when: /fri/i } },
    { input: 'only weekends', pending: { what: 'piano', when: 'on Mon, Wed, Fri', howLong: '1 hour' }, expect: { when: /weekend/i } },
    { input: 'change to weekends', pending: { what: 'piano', when: 'on Mon, Wed, Fri', howLong: '1 hour' }, expect: { when: /weekend/i } },
    { input: 'make it 45 minutes', pending: { what: 'piano', when: 'every day', howLong: '1 hour' }, expect: { howLong: /45/ } },
  ],
  confirmations: [
    { input: 'yes', isConfirm: true },
    { input: 'yeah looks good', isConfirm: true },
    { input: 'yep', isConfirm: true },
    { input: 'sure', isConfirm: true },
    { input: 'ok', isConfirm: true },
    { input: 'okay', isConfirm: true },
    { input: 'perfect', isConfirm: true },
    { input: "that's good", isConfirm: true },
    { input: 'no', isConfirm: false },
    { input: 'wait', isConfirm: false },
    { input: 'change it', isConfirm: false },
    { input: 'actually', isConfirm: false },
  ],
};

let passed = 0, failed = 0;
const failures = [];

// Run basic tests
for (const [category, tests] of Object.entries(BASIC_TESTS)) {
  if (category === 'modifications' || category === 'confirmations') continue;
  for (const test of tests) {
    const parsed = parseGoalInput(test.input);
    const pass = matchValue(parsed.what, test.expect.what) &&
                 matchValue(parsed.when, test.expect.when) &&
                 matchValue(parsed.howLong, test.expect.howLong);
    if (pass) passed++;
    else { failed++; failures.push({ cat: category, input: test.input, exp: test.expect, got: parsed }); }
  }
}

for (const test of BASIC_TESTS.modifications) {
  const modified = parseModification(test.input, test.pending);
  let pass = modified && Object.entries(test.expect).every(([k, v]) => matchValue(modified[k], v));
  if (pass) passed++;
  else { failed++; failures.push({ cat: 'modifications', input: test.input, exp: test.expect, got: modified }); }
}

for (const test of BASIC_TESTS.confirmations) {
  const result = isConfirmation(test.input);
  if (result === test.isConfirm) passed++;
  else { failed++; failures.push({ cat: 'confirmations', input: test.input, exp: test.isConfirm, got: result }); }
}

const titleTests = [
  { what: 'watch anime', expect: /anime.*watch/i },
  { what: 'practice piano', expect: /piano.*practice/i },
  { what: 'eat breakfast', expect: /breakfast/i },
  { what: 'exercise', expect: /exercise/i },
  { what: 'do homework', expect: /homework/i },
];
for (const t of titleTests) {
  const title = generateTitle(t.what);
  if (t.expect.test(title)) passed++;
  else { failed++; failures.push({ cat: 'titles', input: t.what, exp: t.expect.toString(), got: title }); }
}

console.log('========== BASIC TEST RESULTS ==========');
console.log('TOTAL:', passed + failed, '| PASSED:', passed, '| FAILED:', failed);
if (failures.length) {
  console.log('\n--- FAILURES ---');
  failures.forEach(f => {
    console.log('[' + f.cat + '] "' + f.input + '"');
    console.log('  Expected:', JSON.stringify(f.exp));
    console.log('  Got:', JSON.stringify(f.got));
  });
}
if (!failed) console.log('✓ All basic tests passed!');
