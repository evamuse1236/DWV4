# AI System Documentation

**Last Updated:** 2026-02-06

Guide for understanding and modifying the AI features. For the technical codemap (internal functions, prompt builders), see [CODEMAPS/ai-system.md](./CODEMAPS/ai-system.md).

## Overview

Three AI features, all in `convex/ai.ts`:
1. **Goal-Setting Chat** -- SMART goals through conversation
2. **Book Buddy** -- Reading recommendations from history
3. **Project Data Entry** -- Admin data extraction via chat

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  React Component │ --> │ Convex Action│ --> │  AI Provider    │
│  (BookBuddy.tsx) │     │  (ai.ts)     │     │  (Groq/OpenRouter)
└─────────────────┘     └──────────────┘     └─────────────────┘
```

### Model Configuration

| Purpose | Provider | Model |
|---------|----------|-------|
| Primary (creative) | Groq | `moonshotai/kimi-k2-instruct` |
| Formatter (JSON) | Groq | `llama-3.1-8b-instant` |
| Fallback | OpenRouter | `xiaomi/mimo-v2-flash:free` |

**Fallback Logic:** The system tries Groq first. If Groq fails (rate limits, errors), it automatically falls back to OpenRouter.

### Environment Variables

Set in the Convex dashboard (see [RUNBOOK.md](./RUNBOOK.md#environment-variable-reference) for full details):
- `GROQ_API_KEY` (required) -- [console.groq.com](https://console.groq.com)
- `OPENROUTER_API_KEY` (optional fallback) -- [openrouter.ai](https://openrouter.ai)

## Feature 1: Goal-Setting Chat

**Component:** `src/components/sprint/GoalChatPalette.tsx`
**Action:** `api.ai.chat`

### Available Personas

| Persona | Style | Best For |
|---------|-------|----------|
| **Muse** (default) | Warm, curious, asks questions | Students who like to explore ideas |
| **Captain** | Direct, efficient, 2-3 turns max | Students who want it fast |
| **Luna** | Dreamy, whimsical, finds deeper meaning | Creative/imaginative students |

### How It Works

1. Student picks a persona
2. AI asks about their goal
3. After 3-4 exchanges, AI outputs a JSON block:
   ```json
   {
     "ready": true,
     "goal": { "title": "...", "specific": "...", ... },
     "suggestedTasks": [...]
   }
   ```
4. Component parses JSON and creates the goal

### Supported Actions

- **Create new goal** - `goal-ready` JSON block
- **Duplicate existing** - `duplicate-goal` JSON block
- **Import from previous sprint** - `import-goal` JSON block
- **Edit existing** - `edit-goal` JSON block

### Modifying Prompts

The prompts are in `convex/ai.ts`:
- `buildMusePrompt()` - Muse persona
- `buildCaptainPrompt()` - Captain persona
- `buildLunaPrompt()` - Luna persona

Key things to maintain:
- JSON output format must match what components expect
- Keep context sections (CURRENT SPRINT GOALS, PREVIOUS SPRINT GOALS)
- Task scheduling rules (weekNumber, dayOfWeek)

## Feature 2: Book Buddy

**Component:** `src/components/reading/BookBuddy.tsx`
**Action:** `api.ai.libraryChat`

### Personalities

| Personality | Style | Best For |
|-------------|-------|----------|
| **Luna** | Dreamy bookworm | Fantasy lovers, cozy reads |
| **Flash** | Energetic, text-style | Action seekers |
| **Hagrid** | Warm, HP-style speech | Harry Potter fans |

### Two-Stage Pipeline

1. **Creative Stage** (Kimi K2): Generates natural response with recommendations
2. **Formatter Stage** (Llama 8B): Converts to structured JSON

This separation lets the creative model focus on personality while ensuring consistent output format.

### Output Format

```json
{
  "message": "Character's response",
  "suggestedReplies": [
    {"label": "More like this!", "fullText": "Show me more books like this"}
  ],
  "books": [
    {
      "id": "book_id",
      "title": "Book Title",
      "author": "Author",
      "teaser": "Fun 2-sentence hook",
      "whyYoullLikeIt": "Personalized reason"
    }
  ]
}
```

### Modifying Personalities

Edit `PERSONALITY_PROMPTS` object in `convex/ai.ts`. Each entry defines:
- Speaking style
- Example phrases
- Target audience

## Feature 3: Project Data Entry

**Component:** `src/components/projects/ProjectDataChat.tsx`
**Action:** `api.ai.projectDataChat`

### How It Works

1. Admin tells AI about student work in natural language
2. The component sends a dedicated conversation history (`user`/`assistant` turns only) so repeated turns in one chat session stay stable
3. AI extracts: student names, links, reflections
4. Outputs structured JSON for database

### Frontend Safeguards

- `ProjectDataChat.tsx` passes the real project name from `ProjectDetailPage.tsx` to `api.ai.projectDataChat`
- Structured parsing is defensive:
  - If `project-data` JSON is valid, the UI shows a save preview panel
  - If JSON is malformed, the chat still renders the assistant text and continues normally
- Save/discard confirmation copy shown in the UI is intentionally not sent back to the model as context

### Output Format

```json
{
  "students": [
    {
      "studentName": "John Smith",
      "studentId": "abc123",
      "links": [
        { "url": "...", "title": "...", "type": "presentation" }
      ],
      "reflections": {
        "didWell": "...",
        "projectDescription": "...",
        "couldImprove": "..."
      }
    }
  ],
  "summary": "Captured data for 2 students"
}
```

## Adding New AI Features

### 1. Create the Prompt Function

```typescript
function buildMyFeaturePrompt(args: MyArgs): string {
  return `You are... [system instructions]

  OUTPUT FORMAT:
  \`\`\`my-feature-output
  { "key": "value" }
  \`\`\`
  `;
}
```

### 2. Create the Convex Action

```typescript
export const myFeatureChat = action({
  args: {
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
    // ... other args
  },
  handler: async (_ctx, args) => {
    const systemPrompt = buildMyFeaturePrompt(args);
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...args.messages,
    ];
    return callAIWithFallback(apiMessages, 0.7, "MyFeature");
  },
});
```

### 3. Create the React Component

```tsx
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

function MyFeatureChat() {
  const chat = useAction(api.ai.myFeatureChat);

  const handleSend = async (message: string) => {
    const result = await chat({
      messages: [...history, { role: "user", content: message }],
    });
    // Parse result.content for your JSON block
  };
}
```

### 4. Parse AI Response

```typescript
// Look for ```my-feature-output JSON blocks
const jsonMatch = response.match(/```my-feature-output\n([\s\S]*?)\n```/);
if (jsonMatch) {
  const data = JSON.parse(jsonMatch[1]);
  // Use structured data
}
```

## Debugging

### Logs

Check Convex dashboard logs (Functions > Logs). Look for:
- `[FeatureName] Calling Groq: model-name`
- `[FeatureName] Success, tokens: {...}`
- `[FeatureName] Falling back to OpenRouter`

### Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| "No API keys configured" | Missing env vars | Add GROQ_API_KEY to Convex |
| Rate limit errors | Too many requests | Wait, or switch to OpenRouter fallback |
| Invalid JSON output | Model didn't follow format | Adjust prompt, add examples |
| Wrong persona behavior | Prompt drift | Review and tighten persona instructions |

## Cost Optimization

1. **Use Llama 8B for formatting** - Cheaper than creative models
2. **Keep prompts concise** - Fewer input tokens = lower cost
3. **Use temperature wisely** - Lower = more predictable, less creative
4. **Limit max_tokens** - Currently set to 1000, adjust if needed
