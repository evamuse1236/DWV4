# AI Goal Chat Test Harness

This folder contains an isolated browser harness for testing goal-chat parsing behavior.

## What it is for

- validating local parsing behavior
- reproducing conversational edge cases
- testing confirmation/scheduling extraction without touching app runtime

## Files

- `ai-chat-test.html`: manual browser harness
- `test-parser.js`: base parser test suite
- `test-parser-hard.js`: harder parser edge cases

## Run tests

```bash
node test-parser.js
node test-parser-hard.js
```

## Notes

This harness is a sandbox utility and not the production chat implementation.
Production AI chat behavior lives under `convex/ai.ts` and app components.
