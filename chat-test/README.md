# AI Chat Test - Goal Setting Interface

A hybrid AI + rule-based chat interface for helping kids set goals.

## Architecture

```
User Input
    │
    ▼
┌─────────────────────────────────────┐
│ PHASE 1: Confirmation Check         │
│ - "yes" / "no" detection            │
│ - Modification requests             │
│ (LOCAL - no AI)                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ PHASE 2: Duration/Schedule Parsing  │
│ - Fuzzy time matching               │
│ - Day name extraction               │
│ (LOCAL - no AI)                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ PHASE 3: Activity Extraction        │
│ - Llama 3.1 8B Instant (Groq)       │
│ - Only used for complex NLP         │
│ (AI - only when needed)             │
└─────────────────────────────────────┘
```

## Key Features

### AI (Llama 3.1 8B)
- Extracts activity from natural language
- Handles vague/chatty input
- Asks clarifying questions when needed

### Local Parsing (No AI)
- **Duration:** `30 mins`, `1 hour`, `half an hour`, `45 minutes`
- **Schedule:** `every day`, `3x a week`, `mon wed fri`, `weekends`
- **Typo correction:** `evry` → `every`, `mornign` → `morning`
- **Filler removal:** `um`, `like`, `basically`, `I want to`

### Autocomplete
- Type 2+ characters to see suggestions
- Press **Tab** or **Right Arrow** to accept
- Words: days, durations, activities, confirmations

## Files

| File | Purpose |
|------|---------|
| `ai-chat-test.html` | Main chat interface |
| `test-parser.js` | Basic test suite (44 tests) |
| `test-parser-hard.js` | Hard test suite (49 tests) |

## Usage

1. Open `ai-chat-test.html` in a browser
2. Type what you want to work on (e.g., "practice piano")
3. AI extracts the activity
4. Enter duration (e.g., "30 minutes")
5. Enter schedule (e.g., "every day")
6. Confirm the plan

## Example Flow

```
User: "i wanna get better at drawing"
AI:   "Got it - drawing! How long each time?"

User: "30 mins"
Bot:  "How often?"

User: "mon wed fri"
Bot:  "Here's your plan:
       • drawing
       • on mon, wed, fri, 30 minutes each
       Say 'yes' to confirm!"

User: "yes"
Bot:  "Goal created! 🎯"
```

## Running Tests

```bash
node test-parser.js      # Basic tests
node test-parser-hard.js # Hard tests
```

## Configuration

Edit `DEFAULT_PROMPT` in the HTML to customize AI behavior.

Available models (via Groq):
- `llama-3.1-8b-instant` (default, fastest)
- `llama-3.1-70b-versatile` (balanced)
- `llama-3.3-70b-versatile` (best quality)
