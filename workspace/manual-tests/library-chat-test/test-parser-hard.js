/**
 * Advanced Parser Tests for BookBuddy buddy-response format
 * Covers edge cases, malformed AI outputs, stress tests
 * Run with: node test-parser-hard.js
 */

// Parser function (same as production)
function parseBuddyResponse(content) {
  const patterns = [
    /```buddy-response\s*([\s\S]*?)\s*```/,
    /```buddy-response\n([\s\S]*?)\n```/,
    /```buddy-response([\s\S]*?)```/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1].trim();
        return JSON.parse(jsonStr);
      } catch (e) {
        continue;
      }
    }
  }

  // Fallback: try to find any JSON object with "message"
  const jsonMatch = content.match(/\{[\s\S]*"message"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      return null;
    }
  }

  return null;
}

// Test runner with verbose output
function runTests(tests) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of tests) {
    const result = parseBuddyResponse(test.input);
    let success = false;

    if (test.expectNull) {
      success = result === null;
    } else if (test.validate) {
      try {
        success = test.validate(result);
      } catch (e) {
        success = false;
      }
    } else if (test.expectValid) {
      success = result !== null && typeof result.message === 'string';
    }

    if (success) {
      passed++;
      console.log(`✓ ${test.name}`);
    } else {
      failed++;
      failures.push({ test, result });
      console.log(`✗ ${test.name}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`Results: ${passed}/${passed + failed} passed`);

  if (failures.length > 0) {
    console.log('\n' + '-'.repeat(60));
    console.log('FAILURES:');
    for (const { test, result } of failures) {
      console.log(`\n  ${test.name}:`);
      const inputPreview = test.input.substring(0, 80).replace(/\n/g, '\\n');
      console.log(`    Input: ${inputPreview}...`);
      console.log(`    Result: ${JSON.stringify(result, null, 2).substring(0, 200)}`);
      if (test.note) console.log(`    Note: ${test.note}`);
    }
  }

  return { passed, failed };
}

// =============================================================================
// ADVANCED TEST CASES
// =============================================================================

const ADVANCED_TESTS = [
  // ==========================================================================
  // PERSONALITY-SPECIFIC RESPONSES
  // ==========================================================================
  {
    name: 'Luna personality - dreamy message',
    input: `\`\`\`buddy-response
{
  "message": "Ah, dear reader... let me guide you through realms of wonder and starlight...",
  "suggestedReplies": [
    {"label": "More magic", "fullText": "Show me more magical books"},
    {"label": "Something cozy", "fullText": "I want something cozy"}
  ],
  "books": []
}
\`\`\``,
    validate: (r) => r && r.message.includes('dear reader') && r.suggestedReplies.length === 2,
  },

  {
    name: 'Dash personality - energetic message',
    input: `\`\`\`buddy-response
{
  "message": "YOOO!! Check out these AWESOME books!! They're gonna blow your mind!!!",
  "suggestedReplies": [
    {"label": "MORE!!", "fullText": "Give me MORE books!!"},
    {"label": "Action!", "fullText": "I want action books!"}
  ],
  "books": []
}
\`\`\``,
    validate: (r) => r && r.message.includes('AWESOME') && r.message.includes('!!'),
  },

  {
    name: 'Hagrid personality - folksy dialect',
    input: `\`\`\`buddy-response
{
  "message": "Blimey! Yer gonna love these books, I reckon! Got some real good uns fer yeh!",
  "suggestedReplies": [
    {"label": "More like these", "fullText": "Got any more like these?"},
    {"label": "Creatures", "fullText": "Any books about magical creatures?"}
  ],
  "books": []
}
\`\`\``,
    validate: (r) => r && r.message.includes('yeh'),
  },

  // ==========================================================================
  // MALFORMED AI OUTPUTS
  // ==========================================================================
  {
    name: 'Missing closing fence (fallback extracts JSON)',
    input: '```buddy-response\n{"message": "No closing fence"}',
    validate: (r) => r && r.message === 'No closing fence',
    note: 'Parser fallback extracts naked JSON even without closing fence',
  },

  {
    name: 'Nested code blocks',
    input: '```buddy-response\n{"message": "Contains ```code``` blocks"}\n```',
    validate: (r) => r && r.message === 'Contains ```code``` blocks',
  },

  {
    name: 'AI added explanation before JSON',
    input: `Sure, here's the response in the requested format:

\`\`\`buddy-response
{"message": "Here are your books!"}
\`\`\`

I hope you enjoy these recommendations!`,
    validate: (r) => r && r.message === 'Here are your books!',
  },

  {
    name: 'Multiple buddy-response blocks (take first)',
    input: `\`\`\`buddy-response
{"message": "First block"}
\`\`\`

\`\`\`buddy-response
{"message": "Second block"}
\`\`\``,
    validate: (r) => r && r.message === 'First block',
    note: 'Should use first valid block',
  },

  {
    name: 'Trailing comma in JSON',
    input: '```buddy-response\n{"message": "Trailing comma", "books": [],}\n```',
    expectNull: true,
    note: 'Invalid JSON with trailing comma',
  },

  {
    name: 'Single quotes instead of double',
    input: "```buddy-response\n{'message': 'Single quotes'}\n```",
    expectNull: true,
    note: 'Invalid JSON with single quotes',
  },

  // ==========================================================================
  // BOOK ID VALIDATION
  // ==========================================================================
  {
    name: 'Valid book IDs',
    input: `\`\`\`buddy-response
{
  "message": "Found these!",
  "books": [
    {"id": "book-001", "title": "Test", "author": "A", "teaser": "T", "whyYoullLikeIt": "W"},
    {"id": "book-abc-123", "title": "Test2", "author": "B", "teaser": "T", "whyYoullLikeIt": "W"}
  ]
}
\`\`\``,
    validate: (r) => r && r.books.length === 2 && r.books[0].id === 'book-001',
  },

  {
    name: 'Empty book ID',
    input: `\`\`\`buddy-response
{
  "message": "Book with empty ID",
  "books": [
    {"id": "", "title": "Empty ID Book", "author": "A", "teaser": "T", "whyYoullLikeIt": "W"}
  ]
}
\`\`\``,
    validate: (r) => r && r.books.length === 1 && r.books[0].id === '',
    note: 'Parser accepts empty ID, validation happens elsewhere',
  },

  {
    name: 'Missing book fields',
    input: `\`\`\`buddy-response
{
  "message": "Partial book",
  "books": [
    {"id": "book-001", "title": "Only Title"}
  ]
}
\`\`\``,
    validate: (r) => r && r.books.length === 1 && r.books[0].author === undefined,
  },

  // ==========================================================================
  // STRESS TESTS
  // ==========================================================================
  {
    name: 'Very long message (2000 chars)',
    input: '```buddy-response\n{"message": "' + 'X'.repeat(2000) + '"}\n```',
    validate: (r) => r && r.message.length === 2000,
  },

  {
    name: 'Many books (10 books)',
    input: `\`\`\`buddy-response
{
  "message": "Here are 10 books!",
  "books": [
    ${Array.from({ length: 10 }, (_, i) =>
      `{"id": "book-${i}", "title": "Book ${i}", "author": "Author ${i}", "teaser": "T", "whyYoullLikeIt": "W"}`
    ).join(',\n    ')}
  ]
}
\`\`\``,
    validate: (r) => r && r.books.length === 10,
  },

  {
    name: 'Many suggested replies (8 replies)',
    input: `\`\`\`buddy-response
{
  "message": "Lots of options!",
  "suggestedReplies": [
    ${Array.from({ length: 8 }, (_, i) =>
      `{"label": "Option ${i}", "fullText": "Full text for option ${i}"}`
    ).join(',\n    ')}
  ],
  "books": []
}
\`\`\``,
    validate: (r) => r && r.suggestedReplies.length === 8,
  },

  {
    name: 'Unicode stress test',
    input: '```buddy-response\n{"message": "日本語 한국어 العربية 🎉🎊🎁 émojis ñ ü ö"}\n```',
    validate: (r) => r && r.message.includes('日本語') && r.message.includes('🎉'),
  },

  {
    name: 'Escaped characters',
    input: '```buddy-response\n{"message": "Tab:\\tNewline:\\nQuote:\\"Backslash:\\\\"}\n```',
    validate: (r) => r && r.message.includes('\t') && r.message.includes('\n'),
  },

  // ==========================================================================
  // SUGGESTED REPLIES VALIDATION
  // ==========================================================================
  {
    name: 'Suggested replies with special chars',
    input: `\`\`\`buddy-response
{
  "message": "Try these!",
  "suggestedReplies": [
    {"label": "More!!", "fullText": "I want more books!!"},
    {"label": "Sci-Fi?", "fullText": "Do you have sci-fi?"},
    {"label": "50 pages+", "fullText": "Books with 50+ pages"}
  ],
  "books": []
}
\`\`\``,
    validate: (r) => r && r.suggestedReplies.length === 3 && r.suggestedReplies[0].label === 'More!!',
  },

  {
    name: 'Empty suggested replies array',
    input: '```buddy-response\n{"message": "No suggestions", "suggestedReplies": []}\n```',
    validate: (r) => r && Array.isArray(r.suggestedReplies) && r.suggestedReplies.length === 0,
  },

  {
    name: 'Missing suggestedReplies field',
    input: '```buddy-response\n{"message": "No field"}\n```',
    validate: (r) => r && r.suggestedReplies === undefined,
  },

  // ==========================================================================
  // WHITESPACE VARIATIONS
  // ==========================================================================
  {
    name: 'Windows line endings (CRLF)',
    input: '```buddy-response\r\n{"message": "CRLF endings"}\r\n```',
    validate: (r) => r && r.message === 'CRLF endings',
  },

  {
    name: 'Mixed line endings',
    input: '```buddy-response\n{"message": "Mixed\\r\\nendings"}\r\n```',
    validate: (r) => r && r.message.includes('Mixed'),
    note: 'CRLF encoded in JSON string',
  },

  {
    name: 'Leading whitespace before fence (fallback extracts)',
    input: '   ```buddy-response\n{"message": "Indented fence"}\n```',
    validate: (r) => r && r.message === 'Indented fence',
    note: 'Parser fallback extracts JSON even with indented fence',
  },

  {
    name: 'Extra spaces inside fence name',
    input: '```buddy-response  \n{"message": "Spaces after"}\n```',
    validate: (r) => r && r.message === 'Spaces after',
  },

  // ==========================================================================
  // FALLBACK BEHAVIOR (parser intentionally permissive)
  // ==========================================================================
  {
    name: 'Fallback: naked JSON with message key (extracts)',
    input: '{"message": "Naked JSON", "books": []}',
    validate: (r) => r && r.message === 'Naked JSON',
    note: 'Parser fallback intentionally extracts naked JSON with "message" key',
  },

  {
    name: 'Fallback: naked JSON embedded in text (extracts)',
    input: 'Here is the response: {"message": "Embedded JSON"}',
    validate: (r) => r && r.message === 'Embedded JSON',
    note: 'Parser fallback extracts JSON from surrounding text',
  },

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================
  {
    name: 'Empty JSON object',
    input: '```buddy-response\n{}\n```',
    validate: (r) => r !== null && r.message === undefined,
  },

  {
    name: 'Only message field, null value',
    input: '```buddy-response\n{"message": null}\n```',
    validate: (r) => r && r.message === null,
  },

  {
    name: 'Message is number (type coercion)',
    input: '```buddy-response\n{"message": 12345}\n```',
    validate: (r) => r && r.message === 12345,
  },

  {
    name: 'Message is array (unusual but valid JSON)',
    input: '```buddy-response\n{"message": ["line1", "line2"]}\n```',
    validate: (r) => r && Array.isArray(r.message),
  },

  {
    name: 'Deeply nested object',
    input: `\`\`\`buddy-response
{
  "message": "Nested",
  "metadata": {
    "level1": {
      "level2": {
        "level3": "deep"
      }
    }
  }
}
\`\`\``,
    validate: (r) => r && r.metadata?.level1?.level2?.level3 === 'deep',
  },
];

// Run tests
console.log('BookBuddy Parser - Advanced Tests');
console.log('='.repeat(60));
const results = runTests(ADVANCED_TESTS);

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY:');
console.log(`  Total tests: ${ADVANCED_TESTS.length}`);
console.log(`  Passed: ${results.passed}`);
console.log(`  Failed: ${results.failed}`);
console.log(`  Success rate: ${((results.passed / ADVANCED_TESTS.length) * 100).toFixed(1)}%`);

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
