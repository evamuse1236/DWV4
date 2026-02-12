# Changelog

## [Unreleased]

### Added
- Sprint History: browse previous sprints via a sprint selector dropdown in read-only mode
- Sprint History: "Copy to Current Sprint" button to import goals (with action items) from past sprints
- Sprint History: read-only mode disables editing, task creation, keyboard shortcuts, habit tracker, and AI muse
- Deep Work Diagnostics: coach-approved diagnostic unlocks (24h, 1 attempt) and student diagnostic quiz page
- Deep Work Diagnostics: auto-complete + auto-master on 100% pass, and detailed failure review in the existing Viva Queue
- Diagnostic question bank export to `public/diagnostic/diagnostic-data.json` (derived from `diagnostic-check/`)
- Docs: diagnostics codemap + runbook updates for deployment/seeding
- Vision Board: rename areas (name + emoji) via pencil icon on hover in the FAB menu
- Vision Board: delete areas with two-step confirmation showing card count; cascade-deletes all cards in the area
- Active filter resets to "All Goals" when the currently-filtered area is deleted
- Profile settings: students and admins can set or clear their own avatar via image URL (including GIF URLs)
- Project detail: admin link rows now support inline edit (title, URL, link type) with save/cancel flow
- Settings page: students can change their own username, password, and avatar
- Admin settings: credential dashboard with ability to edit any user's username or reset their password
- Sidebar now shows @username with display name below instead of display name with role
- Student diagnostics: `Skip` action per question with guidance text ("if you don't know, skipping is better than guessing")

### Fixed
- Deep Work Diagnostics: retired legacy V1 quiz-bank fallback; diagnostics now require `public/diagnostic_v2/mastery_data.json` and fail loudly when V2 is unavailable or invalid
- Viva Queue UX: restructured to urgent-first triage with global filters, immediate action sections, and tabbed insights for failures vs attempts
- DeepWork page background color mismatch with sidebar — removed page-specific watercolor blobs that created a visible yellowish rectangle not extending into the sidebar; the body's ambient blobs now provide a seamless atmosphere across all pages
- Project AI data-entry chat now preserves turn history across consecutive messages in the same session
- Project AI chat now safely handles malformed `project-data` JSON blocks without breaking the chat flow
- Diagnostic math rendering: spaced slash expressions like `7 / 4` now render as division (not stacked fraction), while compact `7/4` still renders as a fraction
- Viva attempt review: clearer per-question evidence with question numbering and explicit "Student picked" vs "Correct answer" text
- Student diagnostic answer flow: selecting an option no longer auto-submits; answers are committed on `Next/Finish`, and `Skip` now correctly submits on the last question
