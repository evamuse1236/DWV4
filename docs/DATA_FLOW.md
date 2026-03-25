# Data Flow

Purpose: explain how `deep-work-data` feeds `deep-work-app`.

## Repo boundary

- `deep-work-data` (`C:\WProjects\01DWDATA`) owns source curriculum, student, coaching, and diagnostic data.
- `deep-work-app` (`C:\WProjects\DW`) owns the running app and the runtime-ready assets it serves.

## Rule of thumb

- Change `01DWDATA` when you are editing source truth.
- Change `DW` when you are editing the application or the runtime-ready export it consumes.

## Current handoff

Diagnostic content and related generated assets are prepared outside the app, then synced into runtime locations under `public/` in the app repo.

## Safe flow

1. Update source data in `01DWDATA`.
2. Run the relevant build or export tool there.
3. Move or sync the runtime-ready output into the app repo.
4. Verify the app still builds and the relevant screens still load.

## What should never happen

- Editing source truth inside `DW`
- Treating `DWV4` as an active app repo
- Leaving generated reports or one-off exports loose at the app root
