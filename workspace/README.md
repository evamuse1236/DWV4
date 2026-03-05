# Workspace Area

Purpose: keep non-runtime artifacts out of the project root.

## Folders

- `workspace/manual-tests/`
  - `chat-test/`: Goal Chat parser harness.
  - `library-chat-test/`: Book Buddy parser harness.
  - `diagnostic-check/`: standalone diagnostic UI sandbox.
- `workspace/diagnostic-source/`
  - mirror/source diagnostic assets used to sync into `public/diagnostic_v2/`.
- `workspace/diagnostic-readable/`
  - `diagnostic-v2-readable.md`: full readable export.
  - `parts/`: split readable chunks and misconception reports.
- `workspace/legacy/`
  - old one-off files kept for reference only.

## Notes

- App runtime reads from `public/` and `src/`, not directly from this folder.
- Diagnostic scripts in `scripts/` now default to this workspace layout.
