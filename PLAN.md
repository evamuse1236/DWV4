# Deep Work Tracker — Physical Plan (React + Tailwind + Convex + Framer Motion)

This is an execution-ready plan with concrete deliverables, file touchpoints, and “done” criteria.

## 0) Current State (Repo Reality Check)

Before building features, unblock the basics so the app can run reliably.

**Blockers / correctness gaps to fix first**
- Build currently fails due to Tailwind v4 PostCSS plugin migration (`postcss.config.js` must use `@tailwindcss/postcss`).
- `tailwind.config.js` is ESM (`"type": "module"`) but uses `require(...)`.
- Emotion check-in UI uses local keys (`happy`, `sad`, …) but backend expects real Convex `Id`s for categories/subcategories.
- Some Convex mutations don’t match schema requirements (e.g., missing `createdAt`, `createdBy`).
- `convex/` contains both `.ts` and emitted `.js` duplicates; pick one source of truth (prefer TS).

**“Done” for Phase 0**
- `npm run dev` runs without Tailwind errors.
- `npm run build` succeeds.
- `npx convex dev` generates real `convex/_generated/*` and app uses it.

## 1) Product Decisions (Answer Once, Then Build)

These choices reduce rework.

1. **Single coach/admin only?** (assumed yes)
2. **Students are parent-managed accounts** (coach creates + resets passwords).
3. **One active sprint at a time** (already modeled).
4. **Deep Work source of truth**
   - Coach-assigned learning objectives (already modeled).
   - Optional “kid-chosen daily focus” (new table if desired).
5. **Reading**
   - Book can be “library-only” OR “student-selected” with a start action (already modeled).
   - “Presented” is a final state (already modeled).

## 2) Milestones (Vertical Slices)

Each milestone ends with something a kid/coach can actually do end-to-end.

### Milestone A — Setup + Auth + Navigation (Coach + Student)

**Goal**
- Coach can create student accounts; students can login and see the student dashboard.

**Deliverables**
- Convex auth/session functions + UI login working.
- Role-based routing: student routes + admin routes.
- Setup flow: create first coach account + seed starter content.

**Acceptance**
- Coach: can login; sees admin dashboard.
- Student: can login; sees student dashboard.
- Sessions persist across refresh; logout works.

**Primary files**
- `convex/schema.ts`, `convex/auth.ts`, `src/hooks/useAuth.tsx`, `src/App.tsx`
- `src/pages/LoginPage.tsx`, `src/pages/SetupPage.tsx`
- `src/components/layout/*`, `src/components/auth/*`

---

### Milestone B — Emotional Check-In (Wheel → Journal → History)

**Goal**
- Each morning, kid selects emotion → optional journal → saved; student dashboard shows today’s status; coach can see check-in counts.

**Deliverables**
- Emotion wheel driven by seeded Convex categories/subcategories (real `Id`s).
- Save check-in with category/subcategory IDs; “already checked in today” state.
- History view (last N check-ins).

**Acceptance**
- Student can complete check-in and see it reflected immediately.
- “Already checked in” appears after one submission.

**Primary files**
- `convex/emotions.ts`, `convex/seed.ts`
- `src/pages/student/EmotionCheckInPage.tsx`
- `src/components/emotions/*`

---

### Milestone C — Sprint System (SMART Goals + Action Items + Habits)

**Goal**
- Kids set SMART goals at sprint start, add action items by day/week, and check habits daily.

**Deliverables**
- Coach creates/activates sprint.
- Student creates SMART goals.
- Student adds action items (week 1/2 × day of week) and toggles completion.
- Habit tracker shows correct completion state (fetch + render completions).
- “Tasks” tab shows action items organized by day (day selector + list).

**Acceptance**
- Student can (1) create goal, (2) add action items for specific days, (3) complete them, (4) track habit ticks over the 14-day sprint.

**Primary files**
- `convex/sprints.ts`, `convex/goals.ts`, `convex/habits.ts`
- `src/pages/student/SprintPage.tsx`
- `src/components/sprint/*`

---

### Milestone D — Deep Work (Assigned Objectives → Playlist → Viva → Mastery)

**Goal**
- Coach assigns objectives; kid completes playlist; kid requests viva; coach approves mastery.

**Deliverables**
- Coach CRUD: objectives + activities, assign to student.
- Student sees assigned objectives per domain.
- Activity completion tracked per assigned objective.
- Viva request transitions status; admin dashboard shows queue; approve sets mastered.

**Acceptance**
- End-to-end flow works on one objective with 2 activities.

**Primary files**
- `convex/domains.ts`, `convex/objectives.ts`, `convex/activities.ts`, `convex/progress.ts`
- `src/pages/student/DeepWorkPage.tsx`, `src/pages/student/DomainDetailPage.tsx`
- `src/pages/admin/*` (objective manager + viva queue)

---

### Milestone E — Reading Library (Start → Complete → Present)

**Goal**
- Kid browses library, starts a book, marks it complete, then “presented”.

**Deliverables**
- Coach can add/edit books.
- Student can start reading; status changes tracked; current book shown on dashboard.

**Acceptance**
- Student can move a book through `reading → completed → presented`.

**Primary files**
- `convex/books.ts`, `src/pages/student/ReadingPage.tsx`, `src/components/reading/*`

---

### Milestone F — Polish + Delight

**Goal**
- Kid-friendly UX: fast, fun, celebratory.

**Deliverables**
- Framer Motion transitions (route + cards), loading/empty/error states, responsive layout.
- Celebration moments (mastery confetti, streak celebrations).

**Acceptance**
- Works well on a tablet/phone; no confusing dead ends.

## 3) Implementation Order (What To Do Next)

1. Fix Tailwind build config (Tailwind v4 + PostCSS + ESM config).
2. Run `npx convex dev` and replace stub `_generated` types with real generated ones.
3. Convert emotion wheel to use Convex-seeded ids (or add a “key” field to emotion tables and resolve in backend).
4. Close schema/mutation mismatches (required fields and authorization paths).
5. Build admin CRUD pages (students, sprints, objectives/activities, books, viva queue).

## 4) Definition of Done (Per Feature)

For every feature above:
- UI: empty/loading states, basic validation, friendly copy for kids.
- Data: Convex tables/mutations are schema-correct and role-checked.
- Flow: student + coach can complete the full loop.
- Regression: reloading the page preserves state (session, current sprint, etc.).

