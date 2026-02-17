# Convex Backend Tests

This directory contains mock-db tests for backend logic.

## Purpose

- validate mutation/query behavior without network calls
- protect status transition logic and data-shape assumptions

## Key files

- `mockDb.ts`: mock Convex context and DB helpers
- `goals.test.ts`
- `habits.test.ts`
- `sprints.test.ts`
- `emotions.test.ts`

## Run tests

```bash
npm run test:run -- src/__tests__/convex/
npm run test:run -- src/__tests__/convex/goals.test.ts
```

## Scope boundaries

These tests cover handler logic only.
They do not fully replace integration tests against a real Convex runtime.
