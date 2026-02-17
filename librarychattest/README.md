# Library Chat Test Harness

This folder contains an isolated Book Buddy test interface.

## Purpose

- test `buddy-response` parsing and rendering behavior
- validate personality prompt effects quickly
- inspect staged AI outputs during experimentation

## Files

- `library-chat-test.html`: browser test harness
- `test-parser.js`: parser sanity tests
- `test-parser-hard.js`: parser edge-case tests

## Run tests

```bash
node test-parser.js
node test-parser-hard.js
```

## Notes

This harness is for local experimentation only.
Production behavior is defined by `convex/ai.ts` and `src/components/reading/BookBuddy.tsx`.
