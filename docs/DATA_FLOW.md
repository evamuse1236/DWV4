# Data Flow

This file explains how the data repo feeds the app repo.

## Repo Boundary

- `deep-work-data` (`C:\WProjects\01DWDATA`) owns source curriculum, student, coaching, and diagnostic data
- `deep-work-app` (`C:\WProjects\DW`) owns the running app and the runtime-ready files it serves

## Simple Rule

- change `01DWDATA` when you are editing source truth
- change `DW` when you are editing the app or the app-ready export it consumes

## Current Handoff

Diagnostic content is built outside the app, then synced into runtime locations under `public/` inside the app repo.

## Safe Flow

1. update source data in `01DWDATA`
2. run the needed build or export tool there
3. sync the app-ready output into `DW`
4. verify the app still builds and the affected screens still load

## Never Do This

- edit source truth inside `DW`
- treat `DWV4` as an active app repo
- leave one-off exports or reports loose at the app root
