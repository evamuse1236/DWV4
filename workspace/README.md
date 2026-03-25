# Workspace Area

Purpose: keep non-runtime artifacts out of the project root.

## Folders

- `workspace/manual-tests/`
  - `chat-test/`: Goal Chat parser harness.
  - `library-chat-test/`: Book Buddy parser harness.
  - `diagnostic-check/`: standalone diagnostic UI sandbox.
- `workspace/diagnostic-source-assets/`
  - mirror/source diagnostic assets used to sync into `public/diagnostic_v2/`.
- `workspace/diagnostic-reports/`
  - `diagnostic-v2-readable.md`: full readable export.
  - `parts/`: split readable chunks and misconception reports.
- `workspace/reports/`
  - generated reports and exports that are useful to read but not used by the runtime.
- `workspace/reference-projects/`
  - outside code kept only as reference material.
- `workspace/legacy-web-assets/`
  - old standalone web files that are no longer part of the app runtime.
- `workspace/legacy/`
  - old one-off files kept for reference only.

## Notes

- App runtime reads from `public/` and `src/`, not directly from this folder.
- Diagnostic scripts in `scripts/` now default to this workspace layout.
