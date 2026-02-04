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

### Fixed
- DeepWork page background color mismatch with sidebar — removed page-specific watercolor blobs that created a visible yellowish rectangle not extending into the sidebar; the body's ambient blobs now provide a seamless atmosphere across all pages
