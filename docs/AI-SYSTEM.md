# AI System Documentation

Last updated: 2026-02-17

AI logic lives in `convex/ai.ts` and is consumed by React components.

## Features

1. Goal Chat (`api.ai.chat`) from `GoalChatPalette.tsx`
2. Book Buddy (`api.ai.libraryChat`) from `BookBuddy.tsx`
3. Project Data Chat (`api.ai.projectDataChat`) from `ProjectDataChat.tsx`

## Provider strategy

- Primary provider: Groq
- Fallback provider: OpenRouter
- Formatter model is used to keep structured output stable

## Environment variables

Configure in Convex dashboard:
- `GROQ_API_KEY` (required for AI)
- `OPENROUTER_API_KEY` (optional fallback)

## Output contracts

All AI outputs must contain parseable fenced blocks used by UI:
- `goal-ready`
- `buddy-response`
- `project-data`

If parsing fails, UI should degrade safely to plain text.

## Change checklist

1. Update prompt builder in `convex/ai.ts`.
2. Keep response contract unchanged unless UI parser is updated too.
3. Verify consuming component parse logic.
4. Validate fallback behavior when provider fails.

## Common failure modes

- Missing API keys in target deployment
- Prompt drift causing malformed JSON blocks
- Persona/style changes that reduce extractable structure

## Related docs

- `docs/PATTERNS.md`
- `docs/RUNBOOK.md`
- `docs/CODEBASE-MAP.md`
