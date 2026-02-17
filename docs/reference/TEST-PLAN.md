# Test Plan

Purpose: prioritize test coverage by user risk and regression cost.

## Priority model

- P0: core learning and auth flows; regressions are release blockers.
- P1: major admin and student workflow breadth; should be covered before wider rollout.
- P2: lower-risk utilities, polish paths, and long-tail edge cases.

## P0 scope

1. Authentication and role-based routing
2. Check-in gate behavior
3. Objective/activity status propagation
4. Diagnostic attempt scoring and mastery transitions
5. Reading and presentation queue critical transitions
6. Core admin queue actions (viva/presentation)

## P1 scope

1. Sprint and habits authoring/edit flows
2. Project links/reflections workflow
3. Student/admin settings and profile updates
4. Curriculum seed and migration safety checks

## P2 scope

1. Display-only components
2. Minor utility helpers
3. Non-critical UI states

## Execution guidance

- Unit/component tests: `npm run test:run`
- Focused runs: `npm run test:run -- <path>`
- Lint gate: `npm run lint`

## Suggested ownership split

- Backend logic tests: `src/__tests__/convex/`
- Page-level behavior tests: `src/pages/**/__tests__/`
- Component behavior tests: colocated `*.test.tsx`

## Living-document rule

Update this file when:
1. New high-risk flows are introduced.
2. Existing P0 behavior changes.
3. A production bug reveals a missing coverage class.
