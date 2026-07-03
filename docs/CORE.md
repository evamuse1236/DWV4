# Core Product Guide

## What this app is

Deep Work Tracker is a daily learning planner with two interfaces:
- Student interface: daily rhythm (emotion check-in, Today planning, assignments, reading, vision board).
- Admin interface: the coach's operational console (morning moods, goals/habits pulse, units & assignments, confirmations, data collection).

Both interfaces share one Convex backend.

## Core loop

1. Student checks in with their emotions, then lands on Today: sets goals for the day, checks off habits, works today's tasks.
2. Student works teacher-assigned units per subject (assignments with links and descriptions).
3. When the work is finished, the student marks the assignment done.
4. The coach checks the work offline and either confirms it (complete, XP awarded) or sends it back with a note (student redoes and resubmits).

There are no diagnostic tests and no viva queue. That pipeline is archived: the backend functions and historical data remain (convex/diagnostics.ts, viva fields on studentMajorObjectives) but nothing in the UI reaches them.

## Non-negotiable invariants

1. `studentMajorObjectives.status` is the authoritative assignment state:
   `assigned | in_progress | submitted | approved | rejected` (legacy `mastered` renders as approved; legacy `viva_requested` renders as submitted).
2. `studentObjectives.status` is legacy-compatible and not the source of truth.
3. Rejections always carry a coach note the student can read.
4. Student routes and admin routes are role-protected.
5. AI responses consumed by UI must include parseable fenced blocks.

## Product direction

1. Keep the assignment loop simple and auditable: done → confirm, nothing more.
2. Keep student UX calm and guided; the vision board is theirs to shape (auto-adjusting collage).
3. Keep coach UX visual and glanceable: moods, pulse, and confirmations understood in one look.
4. End-of-cycle data collection (project reflections + links) must stay exportable.
5. Keep docs short, current, and non-overlapping.
