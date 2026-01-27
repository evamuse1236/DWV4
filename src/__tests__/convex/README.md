# Convex Backend Tests

This directory contains unit tests for the Convex backend functions.

## Overview

These tests use a **mock database approach** to test Convex mutation and query handlers in isolation, without needing a real Convex backend or network calls.

## Files

- **mockDb.ts** - Mock utilities that simulate Convex's `ctx.db` API
- **goals.test.ts** - Tests for goal CRUD operations and action items
- **habits.test.ts** - Tests for habit CRUD operations and completions
- **sprints.test.ts** - Tests for sprint management (only one active at a time)
- **emotions.test.ts** - Tests for emotion check-ins and history

## How It Works

### Mock Database

The `mockDb.ts` file provides:

1. **`createMockCtx()`** - Creates a mock Convex context with a fake database
2. **`createMockId(table)`** - Generates fake Convex document IDs
3. **`resetMockIdCounter()`** - Resets ID generation (call in `beforeEach`)

### Mock DB Methods

The mock `ctx.db` supports these Convex-like operations:

```typescript
// Get document by ID
await ctx.db.get(id);

// Insert new document
await ctx.db.insert("tableName", { ...data });

// Update document
await ctx.db.patch(id, { field: "newValue" });

// Delete document
await ctx.db.delete(id);

// Query with index
await ctx.db.query("tableName")
  .withIndex("indexName", (q) => q.eq("field", value))
  .collect();  // or .first()
```

### Test Pattern

Each test simulates the mutation/query handler logic:

```typescript
describe("create", () => {
  it("should create a goal with all SMART fields", async () => {
    // 1. Call the mock db methods like the real handler would
    const goalId = await mockCtx.db.insert("goals", {
      userId: mockUserId,
      sprintId: mockSprintId,
      title: "Learn TypeScript",
      // ... other fields
      status: "not_started",
      createdAt: Date.now(),
    });

    // 2. Verify the result
    const goal = await mockCtx.db.get(goalId);
    expect(goal?.title).toBe("Learn TypeScript");
  });
});
```

## Running Tests

```bash
# Run all Convex tests
npm run test:run -- src/__tests__/convex/

# Run specific test file
npm run test:run -- src/__tests__/convex/goals.test.ts

# Watch mode
npm run test -- src/__tests__/convex/
```

## What's Tested

### Goals (15 tests)
- Creating goals with SMART fields
- Updating goal title and status
- Deleting goals with cascading action item deletion
- Adding action items with auto-incrementing order
- Toggling action item completion
- Duplicating goals

### Habits (17 tests)
- Creating habits with required/optional fields
- Updating habit properties
- Deleting habits with cascading completion deletion
- Toggling habit completions (create new or toggle existing)
- Querying habits by user/sprint
- Calculating streaks

### Sprints (11 tests)
- Creating sprints (auto-activates new one)
- Updating sprint name and dates
- Setting active sprint (only one can be active)
- Deleting sprints

### Emotions (14 tests)
- Saving emotion check-ins
- Updating check-in journal entries
- Deleting today's check-in
- Querying today's check-in
- Getting check-in history (sorted, limited)
- Getting category statistics

## Limitations

- These tests verify the **handler logic**, not the full Convex integration
- Indexes are simulated (equality checks work, range queries are basic)
- No validation of Convex schema types at runtime
- No testing of authentication/authorization

## Future Improvements

Consider using [convex-test](https://github.com/get-convex/convex-test) for more realistic integration testing with a real Convex test environment.
