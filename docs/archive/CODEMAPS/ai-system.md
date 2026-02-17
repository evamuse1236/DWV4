# AI System Codemap

**Last Updated:** 2026-02-06
**Backend File:** `convex/ai.ts`
**Frontend Components:** `GoalChatPalette.tsx`, `BookBuddy.tsx`, `ProjectDataChat.tsx`

## Architecture

```
Frontend Component
  |
  | useAction(api.ai.chat / libraryChat / projectDataChat)
  |
  v
convex/ai.ts (Convex Action)
  |
  | callAIWithFallback()
  |   |
  |   +-- Try Groq (primary) -- Kimi K2
  |   |     rate limit? retry up to 2x
  |   |
  |   +-- Fallback to OpenRouter -- Xiaomi MiMo Flash
  |
  v
Response -> parsed for JSON blocks -> returned to frontend
```

## AI Models

| Model | Provider | Role | Used By |
|-------|----------|------|---------|
| `moonshotai/kimi-k2-instruct` | Groq | Primary creative | Goal chat, Book Buddy Stage 1, Project data |
| `llama-3.1-8b-instant` | Groq | JSON formatter | Book Buddy Stage 2 |
| `xiaomi/mimo-v2-flash:free` | OpenRouter | Fallback (any) | All actions when Groq fails |

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | At least one | Primary AI provider |
| `OPENROUTER_API_KEY` | At least one | Fallback AI provider |

## Three AI Features

### 1. Goal Chat (`api.ai.chat`)

**Frontend:** `src/components/sprint/GoalChatPalette.tsx`

**Two modes:**
- **Hybrid goal chat** (default): Deterministic parsing for what/when/howLong, AI only for activity extraction. Runs through `handleHybridGoalChatTurn()`.
- **Full AI** (goal ops): Used when user wants to duplicate, import, or edit existing goals. Runs through full Groq/OpenRouter call.

**Goal draft state machine:**
```
1. Ask "what" (activity) -> AI extracts if ambiguous
2. Ask "howLong" (duration) -> parsed locally
3. Ask "when" (schedule) -> parsed locally
4. Show plan, await confirmation
5. On confirm -> emit goal-ready JSON block
```

**Personas:**
- `muse` (default): Warm, conversational, 3-5 exchanges
- `captain`: Direct, 2-3 exchanges max

**JSON output blocks:**
- `` ```goal-ready `` -- New goal with SMART fields + suggested tasks
- `` ```duplicate-goal `` -- Clone existing goal
- `` ```import-goal `` -- Import from previous sprint
- `` ```edit-goal `` -- Modify existing goal

**Prompt chips:** The action returns `promptChips` array for the UI to show as quick-reply buttons.

### 2. Book Buddy (`api.ai.libraryChat`)

**Frontend:** `src/components/reading/BookBuddy.tsx`

**Two-stage pipeline:**
```
Stage 1: Creative response (Kimi K2, temp 0.85)
  Input: personality prompt + reading history + available books + conversation
  Output: Free-form character response with book recommendations

Stage 2: JSON formatting (Llama 8B, temp 0.1)
  Input: Creative response + available book IDs
  Output: buddy-response JSON block
```

**Personalities:**
- `luna` -- Dreamy bookworm, gentle metaphors
- `dash` -- Energetic, text-message style
- `hagrid` -- Harry Potter's Hagrid character

**JSON output:** `` ```buddy-response `` -- Message + suggested replies + book recommendations (with IDs)

### 3. Project Data Chat (`api.ai.projectDataChat`)

**Frontend:** `src/components/projects/ProjectDataChat.tsx`

**Single-stage call** (Kimi K2, temp 0.6):
- Admin describes student work in natural language
- AI extracts structured data: links, reflections, student IDs
- Returns `` ```project-data `` JSON block

**Frontend state behavior (important):**
- API requests use a dedicated chat history state, not raw rendered message state
- History includes only user/assistant turns sent to the model
- UI-only confirmation messages (save/discard) are excluded from model context
- Malformed `project-data` JSON is handled safely by falling back to plain assistant text

### 4. Test Chat (`api.ai.testChat`)

Development-only action that accepts a custom system prompt for iterating on prompt designs.

## Shared Internal Functions

| Function | Purpose |
|----------|---------|
| `callChatAPI()` | Generic OpenAI-compatible API call |
| `callAIWithFallback()` | Groq -> OpenRouter fallback chain |
| `callGroqWithRetry()` | Groq with rate-limit retry (up to 2 retries, 3s delay) |
| `normalizeInput()` | Fix typos: "evry" -> "every", "30 minits" -> "30 minutes" |
| `removeFiller()` | Strip filler words: "umm", "like", "just" |
| `parseGoalInput()` | Extract what/when/howLong from free text |
| `parseDuration()` | Parse "30 minutes", "1 hour", "half an hour" |
| `parseSchedule()` | Parse "every day", "weekdays", "mon, wed, fri", "3x per week" |
| `generateTitle()` | Convert activity to title: "watch anime" -> "Anime Watching" |
| `generateTasks()` | Convert schedule to weekly task array |

## Chat Logging

All AI interactions can be logged via `convex/chatLogs.ts`:
- `chatLogs.log` -- Store log entry
- `chatLogs.getRecent` -- Read recent logs
- `chatLogs.exportLogs` -- Export as JSON (action)
- `chatLogs.clearAll` -- Delete all logs
