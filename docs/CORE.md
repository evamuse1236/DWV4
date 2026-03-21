# Core Product Guide

## What this app is

Deep Work Tracker is a learning platform with two interfaces:
- Student interface: daily learning rhythm (check-in, sprint work, deep work, reading).
- Admin interface: operational coaching (students, objectives, queues, projects).

Both interfaces share one Convex backend.

## Core loop

1. Student checks in.
2. Student works sprint and learning objectives.
3. Student uses one mastery flow per major objective to take a diagnostic, request a viva, or request a retake.
4. Admin reviews two separate queues: viva decisions and diagnostic retake decisions.

## Non-negotiable invariants

1. `studentMajorObjectives.status` is the authoritative major-objective state.
2. `studentObjectives.status` is legacy-compatible and not the source of truth.
3. Diagnostic scoring and pass/fail policy are backend-owned.
4. Student routes and admin routes are role-protected.
5. AI responses consumed by UI must include parseable fenced blocks.

## Product direction

1. Keep mastery transitions deterministic and auditable.
2. Keep student UX calm and guided.
3. Keep admin UX fast and operational.
4. Keep docs short, current, and non-overlapping.
5. Keep viva meaning coach mastery review everywhere; keep retake approval in diagnostics only.
