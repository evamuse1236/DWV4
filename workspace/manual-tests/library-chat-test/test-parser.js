/**
 * Basic Parser Tests for BookBuddy buddy-response format
 * Run with: node test-parser.js
 */

// Parser function (same as in BookBuddy.tsx and library-chat-test.html)
function parseBuddyResponse(content) {
  const patterns = [
    /```buddy-response\s*([\s\S]*?)\s*```/,  // Flexible whitespace
    /```buddy-response\n([\s\S]*?)\n```/,     // Strict newlines
    /```buddy-response([\s\S]*?)```/,          // Minimal
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1].trim();
        return JSON.parse(jsonStr);
      } catch (e) {
        // Try next pattern
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

// Test runner
function runTests(tests) {
  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const test of tests) {
    const result = parseBuddyResponse(test.input);
    let success = false;

    if (test.expectNull) {
      success = result === null;
    } else if (test.expectMessage) {
      success = result !== null && result.message === test.expectMessage;
    } else if (test.expectBooks !== undefined) {
      success = result !== null &&
        Array.isArray(result.books) &&
        result.books.length === test.expectBooks;
    } else if (test.expectValid) {
      success = result !== null && typeof result.message === 'string';
    } else if (test.validate) {
      success = test.validate(result);
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

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed}/${passed + failed} passed`);

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const { test, result } of failures) {
      console.log(`\n  ${test.name}:`);
      console.log(`    Input: ${test.input.substring(0, 100)}...`);
      console.log(`    Got: ${JSON.stringify(result)}`);
      if (test.expectMessage) console.log(`    Expected message: ${test.expectMessage}`);
      if (test.expectBooks !== undefined) console.log(`    Expected books: ${test.expectBooks}`);
    }
  }

  return { passed, failed };
}

// =============================================================================
// TEST CASES
// =============================================================================

const BASIC_TESTS = [
  // 1. Valid basic format
  {
    name: 'Basic valid format',
    input: '```buddy-response\n{"message": "Hello there!"}\n```',
    expectMessage: 'Hello there!',
  },

  // 2. Valid with books array
  {
    name: 'Format with empty books array',
    input: '```buddy-response\n{"message": "No books yet", "books": []}\n```',
    expectBooks: 0,
  },

  // 3. Format with one book
  {
    name: 'Format with one book',
    input: `\`\`\`buddy-response
{
  "message": "Here's a book!",
  "books": [
    {"id": "book-001", "title": "Test Book", "author": "Author", "teaser": "Great book!", "whyYoullLikeIt": "You'll love it"}
  ]
}
\`\`\``,
    expectBooks: 1,
  },

  // 4. Multiple books
  {
    name: 'Format with multiple books',
    input: `\`\`\`buddy-response
{
  "message": "Found some books!",
  "books": [
    {"id": "b1", "title": "Book 1", "author": "A1", "teaser": "T1", "whyYoullLikeIt": "W1"},
    {"id": "b2", "title": "Book 2", "author": "A2", "teaser": "T2", "whyYoullLikeIt": "W2"},
    {"id": "b3", "title": "Book 3", "author": "A3", "teaser": "T3", "whyYoullLikeIt": "W3"}
  ]
}
\`\`\``,
    expectBooks: 3,
  },

  // 5. With suggested replies
  {
    name: 'Format with suggested replies',
    input: `\`\`\`buddy-response
{
  "message": "What kind of book?",
  "suggestedReplies": [
    {"label": "Adventure", "fullText": "I want adventure books"},
    {"label": "Mystery", "fullText": "Show me mystery books"}
  ],
  "books": []
}
\`\`\``,
    validate: (r) => r && r.suggestedReplies && r.suggestedReplies.length === 2,
  },

  // 6. No newlines after fence
  {
    name: 'No newline after opening fence',
    input: '```buddy-response{"message": "Compact format"}\n```',
    expectMessage: 'Compact format',
  },

  // 7. Extra whitespace
  {
    name: 'Extra whitespace around JSON',
    input: '```buddy-response\n\n  {"message": "Spaced out"}  \n\n```',
    expectMessage: 'Spaced out',
  },

  // 8. Tabs instead of spaces
  {
    name: 'Tabs in JSON',
    input: '```buddy-response\n{\t"message":\t"Tabbed"}\n```',
    expectMessage: 'Tabbed',
  },

  // 9. Invalid JSON should return null
  {
    name: 'Invalid JSON returns null',
    input: '```buddy-response\n{message: "missing quotes"}\n```',
    expectNull: true,
  },

  // 10. Missing code fence - fallback extracts naked JSON (intentional)
  {
    name: 'Missing code fence (fallback extracts it)',
    input: '{"message": "No fence"}',
    validate: (r) => r && r.message === 'No fence',
    note: 'Parser fallback intentionally extracts naked JSON with "message" key',
  },

  // 11. Wrong fence type - fallback extracts JSON
  {
    name: 'Wrong fence type (json) - fallback extracts',
    input: '```json\n{"message": "Wrong type"}\n```',
    validate: (r) => r && r.message === 'Wrong type',
    note: 'Parser fallback extracts JSON even from wrong fence type',
  },

  // 12. Empty content
  {
    name: 'Empty content returns null',
    input: '',
    expectNull: true,
  },

  // 13. Only whitespace
  {
    name: 'Whitespace only returns null',
    input: '   \n\t\n   ',
    expectNull: true,
  },

  // 14. Partial fence
  {
    name: 'Partial fence returns null',
    input: '```buddy-response\n{"message": "unclosed',
    expectNull: true,
  },

  // 15. Special characters in message
  {
    name: 'Special characters in message',
    input: '```buddy-response\n{"message": "Hello! \\"Quotes\\" & <tags>"}\n```',
    expectMessage: 'Hello! "Quotes" & <tags>',
  },

  // 16. Unicode in message
  {
    name: 'Unicode characters',
    input: '```buddy-response\n{"message": "Hello 👋 世界!"}\n```',
    expectMessage: 'Hello 👋 世界!',
  },

  // 17. Newlines in message
  {
    name: 'Newlines in message',
    input: '```buddy-response\n{"message": "Line 1\\nLine 2"}\n```',
    expectMessage: 'Line 1\nLine 2',
  },

  // 18. Very long message
  {
    name: 'Long message (500 chars)',
    input: '```buddy-response\n{"message": "' + 'A'.repeat(500) + '"}\n```',
    validate: (r) => r && r.message && r.message.length === 500,
  },

  // 19. Mixed valid and extra content before
  {
    name: 'Extra content before fence',
    input: 'Some preamble text\n```buddy-response\n{"message": "After preamble"}\n```',
    expectMessage: 'After preamble',
  },

  // 20. Extra content after
  {
    name: 'Extra content after fence',
    input: '```buddy-response\n{"message": "Before postamble"}\n```\nSome extra text',
    expectMessage: 'Before postamble',
  },
];

// Run tests
console.log('BookBuddy Parser - Basic Tests');
console.log('='.repeat(50));
const results = runTests(BASIC_TESTS);

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
