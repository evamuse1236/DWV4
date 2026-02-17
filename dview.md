# Admin Diagnostic V2: What The “Viva Queue” Is Showing (Visual Explainer)

Status: reference explainer (not a source-of-truth contract).
For implementation decisions, prioritize `convex/diagnostics.ts`, `src/pages/admin/VivaQueuePage.tsx`, and `docs/DATA-MODEL.md`.

This explains, in plain language, how the current Admin page displays and reviews **Diagnostic V2** attempts.

In the app, the Admin view for diagnostics lives in the **Viva Queue** page:
- UI: `src/pages/admin/VivaQueuePage.tsx`
- Data comes from Convex: `convex/diagnostics.ts`

---

## Quick Definitions (Human Terms)

- **Diagnostic V2**: The newer question bank shipped as a static JSON file in the app.
  - File: `public/diagnostic_v2/mastery_data.json`
- **Attempt**: One student’s submitted run through a diagnostic quiz (score, timing, and per-question evidence).
  - Stored in the `diagnosticAttempts` table by `convex/diagnostics.submitAttempt`.
- **Unlock request**: A student asking a coach to open a short window to take (or retake) a diagnostic.
- **Failure case**: A latest failed attempt (per student + objective) that the coach can triage quickly.

---

## The Big Picture (One Diagram)

```mermaid
flowchart TD
  S[Student starts Diagnostic] --> L[App loads question bank]
  L --> V2[public/diagnostic_v2/mastery_data.json (required)]
  V2 --> Q[Student answers questions]

  Q --> SUB[Submit attempt to backend]
  SUB --> DB[(Convex: diagnosticAttempts)]

  DB --> A[Admin Viva Queue loads lists]
  A --> LIST[Diagnostic Attempts list]
  A --> FAIL[Diagnostic Failures triage]
  LIST --> CLICK[Admin clicks an attempt]
  FAIL --> CLICK
  CLICK --> DIALOG[Attempt Review dialog]
  DIALOG --> EVID[Per-question evidence\n(stem, image, misconception, explanation)]
```

If you only remember one thing: **the Admin page does not “run” Diagnostic V2**. It **reads saved attempt results** from the database and formats them for review.

---

## Step 1: Where “Diagnostic V2” Questions Come From

When the student diagnostic screen loads, it calls `loadDiagnosticData()`:
- Code: `src/lib/diagnostic.ts`

It tries to load V2 first:
- `fetch("/diagnostic_v2/mastery_data.json")`

If that fails for any reason (missing file, bad JSON, empty module payload), it now throws an explicit error and stops.

What this means in practice:
- V2 is the only supported bank for student diagnostics.
- If V2 is broken, you will know immediately and can fix it fast.

---

## Step 2: How The App Chooses “Which Diagnostic” For A Student

The student’s diagnostic is tied to a **Deep Work major objective**, but the mapping is not a hard-coded lookup table.

Instead, the backend computes a “module index” by position:
- Code: `convex/diagnostics.getCurriculumModuleIndex`
- It finds the major objective inside its domain and curriculum, sorts by creation time, and assigns:
  - `moduleIndex = (position in that list) + 1`
  - `section = "dw"` or `"pyp"` (based on curriculum name)

Then the frontend matches that module index to a group of questions by name prefix:
- Code: `src/lib/diagnostic.findDiagnosticGroup`
- It looks for modules whose `module_name` starts with:
  - Deep Work: `Module {moduleIndex}:`
  - PYP: `PYP {moduleIndex}:`

Layman version:
- “Module 3 diagnostic” really means: “the diagnostic question bundle labeled like `Module 3:` in the dataset.”

---

## Step 3: What Gets Saved When A Student Submits An Attempt

The student diagnostic page (`src/pages/student/DiagnosticPage.tsx`) builds a “receipt” for each question:
- `stem` (the question text)
- `visualHtml` (any embedded visuals, often an `<img ...>` snippet)
- chosen answer label vs correct answer label
- misconception text (warm feedback)
- explanation text
- skipped questions are recorded as skipped/incorrect and still carry the correct label + explanation for review

How answer submission now works:
- Clicking an option only selects it (it does not immediately lock or submit).
- The selected answer is committed only when the student clicks **Next** (or **Finish** on the last question).
- Clicking **Skip** commits that question as skipped immediately and moves on.
- On the last question, **Skip** also submits the full attempt correctly.

When the attempt is submitted, it calls:
- Backend mutation: `convex/diagnostics.submitAttempt`

Important behavior:
- The backend re-computes pass/fail using a fixed threshold:
  - `PASS_THRESHOLD_PERCENT = 90`
- So the Admin page will reflect the backend’s decision, even if the frontend tried to send a different `passed` value.
- Students now see a clear hint during the quiz: if they are unsure, skipping is better than guessing.

---

## Step 4: What The Admin “Viva Queue” Page Loads

In `src/pages/admin/VivaQueuePage.tsx`, diagnostics are now organized into an urgent-first layout:

1. **Global Filters**
- One filter bar at top controls student search, module filter, and pass/fail filter across the whole page.

2. **Immediate Action**
- **Diagnostic Unlock Requests**
- Data: `api.diagnostics.getPendingUnlockRequests`
- Actions:
  - Approve: gives a time window and attempt count (currently 24 hours, 1 attempt)
  - Deny: marks request denied

- **Pending Viva Requests**
- Data: `api.objectives.getVivaRequests`
- Actions:
  - Not Yet (set back to in-progress)
  - Approve (set mastered)

3. **Insights & Review (Tabbed)**
- **Failures tab**
- Data: `api.diagnostics.getFailuresForQueue`
- It shows only the latest failed attempt per (student, objective), and hides ones already mastered.

- **Attempts tab**
- Data: `api.diagnostics.getAllAttemptsForAdmin`
- Shows pass + fail attempts with fast drill-down into the review dialog.

---

## Step 5: What The Attempt Review Dialog Actually Shows (And How)

When an admin clicks an attempt:
- It loads details via `api.diagnostics.getAttemptDetails`
- Then it renders `attempt.results[]` directly

For each question result, the UI shows:
- **Question title**
  - If `stem` exists, it renders the stem (using `MathText`)
  - Otherwise it falls back to the `topic` string
- **Question number + correctness badge**
  - Example: `Question 4 of 30`
  - Badge is now simply “Correct” or “Incorrect” for faster scanning
- **Answer evidence**
  - For incorrect attempts: explicit “Student picked: X …” and “Correct answer: Y …”
  - The UI also looks up answer text from the diagnostic bank so labels are shown with real choice content
- **Image**
  - It calls `extractImageSrc(result.visualHtml)` from `src/lib/diagnostic.ts`
  - That function looks for `src="..."` inside the HTML and extracts just the URL
  - If it finds a URL, the Admin view renders an `<img>` tag
- **Misconception** (if present)
- **Explanation** (if present)

### Subtle but important difference vs the Student view

The student page can render raw HTML visuals if there is no `<img src="...">`:
- Student: uses `dangerouslySetInnerHTML` as a fallback for `visual_html`

The admin dialog does **not** render arbitrary HTML:
- Admin: only displays an image if `extractImageSrc()` finds a `src="..."` attribute

Layman consequence:
- If a question’s “visual” is complex HTML (not a simple image), a student might see it, but the admin might see **no visual** in the review dialog.

---

## “Approve Mastery” In The Dialog: What It Does (And Doesn’t Do)

In the review dialog, “Approve Mastery”:
- Updates the student’s objective status to `mastered` via `api.objectives.updateStatus`

It does not:
- Edit the diagnostic attempt
- Re-grade or re-run any questions
- Change the question bank

It’s a coach decision based on the saved evidence.

---

## If Something Looks Off (Common Causes)

- Missing images in Admin review:
  - The stored `visualHtml` did not include an `<img src="...">`, or
  - The `src` points to a file that is not available in `public/` at runtime.
- “Wrong module” shown for a student:
  - The module index comes from the ordering of major objectives (creation-time order within domain+curriculum).
  - Reordering objectives (or seeding in a different order) changes which “Module N” an objective maps to.
