// Hard test cases for goal parser

function normalizeInput(text) {
  return text
    // Typos
    .replace(/\bevr?e?y\b/gi, 'every')
    .replace(/\bdaiy\b/gi, 'daily')
    .replace(/\b(mornign|moning|morining|mornig|mornng)\b/gi, 'morning')
    .replace(/\bnite\b/gi, 'night')
    .replace(/\bwek\b/gi, 'week')
    .replace(/\btims?\b/gi, 'times')
    // Duration typos and abbreviations
    .replace(/\b(\d+)\s*(?:minits?|minuts?|minz?|mins?|m)\b/gi, '$1 minutes')
    .replace(/\b(\d+)\s*(?:hours?|hrs?|hor|h)\b/gi, '$1 hours')
    .replace(/\bhalf\s+(?:an\s+)?hour\b/gi, '30 minutes')
    .replace(/\ban\s+hour\b/gi, '1 hour')
    // Schedule abbreviations
    .replace(/\b(\d+)x\/wk\b/gi, '$1 times a week')
    .replace(/\b(\d+)x\s*\/\s*week\b/gi, '$1 times a week');
}

function removeFiller(text) {
  return text
    // Remove thinking sounds with variable letters (hmm, hmmm, umm, ummm, uhh, uhhh, etc.)
    .replace(/\b(h+m+|u+m+|u+h+|e+r+|a+h+)\b/gi, '')
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
  // Direct extraction as last resort
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

// ============================================
// HARD TEST CASES
// ============================================
const HARD_TESTS = {
  // Slang and contractions
  slang: [
    { input: 'gonna watch anime everyday for like 30 mins', expect: { what: /watch anime/, when: 'every day', howLong: '30 minutes' }, note: 'gonna + everyday (one word)' },
    { input: 'wanna practice guitar 2x a week for 1hr', expect: { what: /guitar/, when: '2x per week', howLong: '1 hour' }, note: 'wanna + 2x + 1hr' },
    { input: 'gotta do my homework after school 45min', expect: { what: /homework/, when: 'after school', howLong: '45 minutes' }, note: 'gotta + no "for"' },
  ],

  // Extreme typos
  extremeTypos: [
    { input: 'exerscise evry mornign for 20 minits', expect: { what: /exerscise/, when: 'every morning', howLong: '20 minutes' }, note: 'multiple typos' },
    { input: 'pracitce paino 3 tims a wek 1 hor', expect: { what: /paino/, when: '3x per week', howLong: '1 hour' }, note: 'severe typos' },
    { input: 'reed buks evry nite for 30 minz', expect: { what: /reed buks/, when: 'every night', howLong: '30 minutes' }, note: 'phonetic spelling' },
  ],

  // Word numbers (these should fail gracefully - parser doesn't handle)
  wordNumbers: [
    { input: 'read for thirty minutes every day', expect: { what: /read/, when: 'every day', howLong: null }, note: 'thirty not parsed (expected)' },
    { input: 'exercise twice a week for one hour', expect: { what: /exercise/, when: null, howLong: null }, note: 'twice/one not parsed (expected)' },
    { input: 'practice piano for a couple hours daily', expect: { what: /piano/, when: 'every day', howLong: null }, note: 'couple hours not parsed (expected)' },
  ],

  // Very verbose/chatty
  verbose: [
    { input: 'okay so like basically what i really want to do is maybe try to watch some anime or something every single day for about 30 minutes i guess',
      expect: { what: /watch.*anime|anime/, when: 'every day', howLong: '30 minutes' }, note: 'extremely verbose' },
    { input: 'um hey hi hello so i was thinking that maybe perhaps i could possibly practice piano like 3 times a week for around an hour or so yeah',
      expect: { what: /piano/, when: '3x per week', howLong: '1 hour' }, note: 'multiple greetings + hedging' },
  ],

  // Very terse
  terse: [
    { input: 'piano 3x/wk 1h', expect: { what: /piano/, when: '3x per week', howLong: '1 hour' }, note: '3x/wk now parsed!' },
    { input: 'run daily 30m', expect: { what: /run/, when: 'every day', howLong: '30 minutes' }, note: 'minimal input' },
    { input: 'read nightly 1hr', expect: { what: /read/, when: null, howLong: '1 hour' }, note: 'nightly not parsed' },
  ],

  // Special characters and emojis
  specialChars: [
    { input: 'watch anime 🎬 every day for 30 mins!!!', expect: { what: /watch anime/, when: 'every day', howLong: '30 minutes' }, note: 'emoji and exclamation' },
    { input: '📚 read books - daily - 45 minutes', expect: { what: /read books/, when: 'every day', howLong: '45 minutes' }, note: 'emoji prefix + dashes' },
    { input: 'exercise (cardio) every morning for ~30 mins', expect: { what: /exercise.*cardio|cardio/, when: 'every morning', howLong: '30 minutes' }, note: 'parens and tilde' },
  ],

  // Questions as goals
  questions: [
    { input: 'can i watch anime every day for 30 minutes?', expect: { what: /watch anime/, when: 'every day', howLong: '30 minutes' }, note: 'question format' },
    { input: 'is it okay to practice piano 3x a week for 1 hour?', expect: { what: /piano/, when: '3x per week', howLong: '1 hour' }, note: 'permission question' },
    { input: 'what if i read every night for 45 mins?', expect: { what: /read/, when: 'every night', howLong: '45 minutes' }, note: 'what if question' },
  ],

  // Multiple activities (parser keeps all - may need AI)
  multipleActivities: [
    { input: 'watch anime and play games every day for 1 hour', expect: { what: /anime.*games|games.*anime/, when: 'every day', howLong: '1 hour' }, note: 'two activities with and' },
    { input: 'read or draw every night for 30 mins', expect: { what: /read.*draw|draw.*read/, when: 'every night', howLong: '30 minutes' }, note: 'two activities with or' },
    { input: 'practice piano, guitar, and drums 3x a week', expect: { what: /piano.*guitar.*drums/, when: '3x per week', howLong: null }, note: 'three activities' },
  ],

  // Unusual time formats
  unusualTimes: [
    { input: 'exercise at 7am for 30 minutes', expect: { what: /exercise/, when: 'at 7am', howLong: '30 minutes' }, note: 'specific time' },
    { input: 'read at 9:30pm for 45 mins', expect: { what: /read/, when: 'at 9:30pm', howLong: '45 minutes' }, note: 'time with minutes' },
    { input: 'meditate in the morning and evening for 15 mins', expect: { what: /meditate/, when: 'in the morning', howLong: '15 minutes' }, note: 'two time periods (takes first)' },
  ],

  // Modification edge cases
  modificationHard: [
    { input: 'actually make it tuesday and thursday', pending: { what: 'piano', when: 'on Mon, Wed, Fri', howLong: '1 hour' }, expect: { when: /tue.*thu/i }, note: 'actually + two days' },
    { input: 'wait no just saturday', pending: { what: 'read', when: 'every day', howLong: '30 minutes' }, expect: { when: /sat/i }, note: 'wait no + day' },
    { input: 'hmm change it to 2 hours instead', pending: { what: 'exercise', when: 'daily', howLong: '1 hour' }, expect: { howLong: /2 hour/ }, note: 'hmm + change + instead' },
    { input: 'nope weekdays only', pending: { what: 'study', when: 'every day', howLong: '45 minutes' }, expect: { when: /weekday/i }, note: 'nope + only' },
  ],

  // Confirmation edge cases
  confirmationHard: [
    { input: 'yes please', isConfirm: true, note: 'yes with please' },
    { input: 'yeah that works', isConfirm: true, note: 'yeah with extra' },
    { input: 'yup yup', isConfirm: true, note: 'repeated yes' },
    { input: 'sounds good to me', isConfirm: false, note: 'sounds good (not exact match)' },
    { input: 'i guess so', isConfirm: false, note: 'hesitant yes' },
    { input: 'fine', isConfirm: false, note: 'reluctant (not in list)' },
    { input: 'lets do it', isConfirm: false, note: 'lets (not in list)' },
    { input: 'approved', isConfirm: false, note: 'formal (not in list)' },
  ],

  // Empty/whitespace variations
  emptyVariations: [
    { input: '\n\n', expect: { what: null, when: null, howLong: null }, note: 'newlines only' },
    { input: '\t  \t', expect: { what: null, when: null, howLong: null }, note: 'tabs and spaces' },
    { input: '     a     ', expect: { what: null, when: null, howLong: null }, note: 'single char (too short)' },
    { input: 'hmmm', expect: { what: null, when: null, howLong: null }, note: 'thinking sound hmmm' },
    { input: 'hmmmmmm', expect: { what: null, when: null, howLong: null }, note: 'long hmmm' },
    { input: 'ummm', expect: { what: null, when: null, howLong: null }, note: 'thinking sound ummm' },
    { input: 'uhhh', expect: { what: null, when: null, howLong: null }, note: 'thinking sound uhhh' },
    { input: 'errr', expect: { what: null, when: null, howLong: null }, note: 'thinking sound errr' },
    { input: 'ahh', expect: { what: null, when: null, howLong: null }, note: 'thinking sound ahh' },
  ],

  // Unicode and international
  unicode: [
    { input: 'practice café music every day for 30 mins', expect: { what: /café|cafe/, when: 'every day', howLong: '30 minutes' }, note: 'accented char' },
    { input: 'read naïve books daily for 1 hour', expect: { what: /naïve|naive/, when: 'every day', howLong: '1 hour' }, note: 'diaeresis' },
  ],
};

let passed = 0, failed = 0;
const failures = [];
const categories = {};

// Run parser tests
for (const [category, tests] of Object.entries(HARD_TESTS)) {
  if (category === 'modificationHard' || category === 'confirmationHard') continue;
  categories[category] = { passed: 0, failed: 0 };

  for (const test of tests) {
    const parsed = parseGoalInput(test.input);
    const pass = matchValue(parsed.what, test.expect.what) &&
                 matchValue(parsed.when, test.expect.when) &&
                 matchValue(parsed.howLong, test.expect.howLong);
    if (pass) { passed++; categories[category].passed++; }
    else {
      failed++;
      categories[category].failed++;
      failures.push({ cat: category, input: test.input, exp: test.expect, got: parsed, note: test.note });
    }
  }
}

// Run modification tests
categories['modificationHard'] = { passed: 0, failed: 0 };
for (const test of HARD_TESTS.modificationHard) {
  const modified = parseModification(test.input, test.pending);
  let pass = modified && Object.entries(test.expect).every(([k, v]) => matchValue(modified[k], v));
  if (pass) { passed++; categories['modificationHard'].passed++; }
  else {
    failed++;
    categories['modificationHard'].failed++;
    failures.push({ cat: 'modificationHard', input: test.input, exp: test.expect, got: modified, note: test.note });
  }
}

// Run confirmation tests
categories['confirmationHard'] = { passed: 0, failed: 0 };
for (const test of HARD_TESTS.confirmationHard) {
  const result = isConfirmation(test.input);
  if (result === test.isConfirm) { passed++; categories['confirmationHard'].passed++; }
  else {
    failed++;
    categories['confirmationHard'].failed++;
    failures.push({ cat: 'confirmationHard', input: test.input, exp: test.isConfirm, got: result, note: test.note });
  }
}

console.log('========== HARD TEST RESULTS ==========');
console.log('TOTAL:', passed + failed, '| PASSED:', passed, '| FAILED:', failed);
console.log('\n--- By Category ---');
for (const [cat, stats] of Object.entries(categories)) {
  const icon = stats.failed === 0 ? '✓' : '✗';
  console.log(icon, cat + ':', stats.passed + '/' + (stats.passed + stats.failed));
}

if (failures.length) {
  console.log('\n--- FAILURES ---');
  failures.forEach(f => {
    console.log('\n[' + f.cat + '] "' + f.input.substring(0, 60) + (f.input.length > 60 ? '...' : '') + '"');
    if (f.note) console.log('  Note:', f.note);
    console.log('  Expected:', JSON.stringify(f.exp));
    console.log('  Got:', JSON.stringify(f.got));
  });
}

console.log('\n========== SUMMARY ==========');
const passRate = Math.round(passed / (passed + failed) * 100);
console.log('Pass rate:', passRate + '%');
if (passRate >= 80) console.log('✓ Parser handles most hard cases well!');
else if (passRate >= 60) console.log('⚠ Parser needs improvement for edge cases');
else console.log('✗ Parser struggles with hard cases - consider AI fallback');
