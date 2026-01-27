# Library Chat Test Interface

Test interface for the BookBuddy AI-powered book recommendation system.

## Architecture

### Two-Stage AI Pipeline

The BookBuddy uses a two-stage AI pipeline for optimal quality and formatting:

```
User Message → Stage 1: Kimi K2 (Creative) → Stage 2: Llama 8B (Formatter) → JSON Response
```

**Stage 1: Creative Response (Kimi K2)**
- High-quality creative writing model
- Temperature: 0.85 for varied, engaging responses
- Outputs natural language with book recommendations
- Maintains character personality throughout

**Stage 2: JSON Formatting (Llama 8B)**
- Fast, reliable formatting model
- Temperature: 0.1 for consistent JSON output
- Converts creative response to structured `buddy-response` format
- Validates book IDs against available books list

### Three Personalities

| Personality | Theme | Accent Color | Personality Traits |
|-------------|-------|--------------|-------------------|
| **Luna** | Dreamy, mystical | Purple (#7E22CE) | Soft, poetic, wonderous |
| **Dash** | Energetic, excited | Orange (#C2410C) | Fast-paced, enthusiastic, uses exclamation marks |
| **Hagrid** | Warm, folksy | Brown (#44403C) | Friendly, uses dialect, cozy |

### API Endpoint

```javascript
fetch(`${CONVEX_URL}/api/action`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: 'ai:libraryChat',
    args: {
      messages: [{ role: 'user', content: 'I want adventure books' }],
      personality: 'luna', // 'luna' | 'dash' | 'hagrid'
      readingHistory: [...], // optional
      availableBooks: [...]  // required
    },
    format: 'json'
  })
})
```

### Request Schema

```typescript
interface LibraryChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  personality: 'luna' | 'dash' | 'hagrid';
  readingHistory?: Array<{
    title: string;
    author: string;
    genre?: string;
    rating?: number;
    status: string;
  }>;
  availableBooks: Array<{
    id: string;
    title: string;
    author: string;
    genre?: string;
    description?: string;
  }>;
}
```

### Response Format

The AI returns a `buddy-response` JSON block:

```
```buddy-response
{
  "message": "Oh, how wonderful! Let me share some magical tales...",
  "suggestedReplies": [
    {"label": "More like this", "fullText": "Show me more books like these"},
    {"label": "Different genre", "fullText": "I want something different"}
  ],
  "books": [
    {
      "id": "book-001",
      "title": "The Dragon's Quest",
      "author": "Sarah Smith",
      "teaser": "A young girl discovers she can talk to dragons...",
      "whyYoullLikeIt": "Since you loved fantasy adventures!"
    }
  ]
}
```

## Files

| File | Purpose |
|------|---------|
| `library-chat-test.html` | Interactive browser test interface |
| `test-parser.js` | Basic parser test suite (~20 tests) |
| `test-parser-hard.js` | Advanced parser test suite (~30 tests) |
| `README.md` | This documentation |

## Usage

### Interactive Testing

1. Open `library-chat-test.html` in a browser
2. Select a personality (Luna/Dash/Hagrid)
3. Edit mock books or reading history in left panel
4. Type a message or click a suggestion chip
5. View AI response with book cards and debug logs

### Parser Testing

```bash
# Basic tests
node test-parser.js

# Advanced tests (edge cases, stress tests)
node test-parser-hard.js
```

## Parsing Logic

The parser tries multiple regex patterns to handle AI formatting variations:

```javascript
const patterns = [
  /```buddy-response\s*([\s\S]*?)\s*```/,  // Flexible whitespace
  /```buddy-response\n([\s\S]*?)\n```/,     // Strict newlines
  /```buddy-response([\s\S]*?)```/,          // Minimal
];
```

Fallback: If no pattern matches, tries to extract any JSON object containing `"message"`.

## Debug Panel

The debug panel shows:
- **Stage 1**: Raw creative response from Kimi K2
- **Stage 2**: Formatted JSON from Llama 8B
- **Parsing**: Whether JSON was parsed successfully
- **Timing**: Response latency for each stage
