# Deep Work Tracker Documentation

## Quick Navigation

| Document | Description |
|----------|-------------|
| [CODEMAPS/INDEX.md](./CODEMAPS/INDEX.md) | High-level architecture maps (start here) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and design rationale |
| [DATA-MODEL.md](./DATA-MODEL.md) | Convex database schema and relationships |
| [COMPONENTS.md](./COMPONENTS.md) | Quick component/file lookup guide |
| [PATTERNS.md](./PATTERNS.md) | Code patterns and conventions |
| [USER-JOURNEYS.md](./USER-JOURNEYS.md) | Complete user flows for students and coaches |
| [CONTRIB.md](./CONTRIB.md) | Setup, development workflow, scripts |
| [RUNBOOK.md](./RUNBOOK.md) | Deployment, seeding, troubleshooting |
| [AI-SYSTEM.md](./AI-SYSTEM.md) | AI features guide (goal chat, book buddy, project data) |
| [TEST-PLAN.md](./TEST-PLAN.md) | Test plan and priorities |
| [plan.md](./plan.md) | Diagnostic integration plan (implementation status) |
| [CURRICULUM-MATH-MAPPING.md](./CURRICULUM-MATH-MAPPING.md) | Math LO -> objective -> activity seeding |

### Codemaps (architecture maps by area)

| Codemap | Covers |
|---------|--------|
| [CODEMAPS/frontend.md](./CODEMAPS/frontend.md) | Pages, components, hooks, routing |
| [CODEMAPS/backend.md](./CODEMAPS/backend.md) | All Convex functions |
| [CODEMAPS/data-model.md](./CODEMAPS/data-model.md) | 26 tables, relationships, indexes |
| [CODEMAPS/ai-system.md](./CODEMAPS/ai-system.md) | AI chat, models, prompts |
| [CODEMAPS/diagnostics.md](./CODEMAPS/diagnostics.md) | Diagnostic quiz system |
| [CODEMAPS/vision-board.md](./CODEMAPS/vision-board.md) | Vision board areas + cards |
| [CODEMAPS/scripts.md](./CODEMAPS/scripts.md) | Curriculum data scripts |

## Recent Changes

### Diagnostic Pre-Built Sets (Jan 2026)
- Question selection now uses **pre-built deterministic sets** (10 per module group, 30 questions each)
- Set cycling via Convex `getAttemptCount` query (replaces localStorage-based random selection)
- Build pipeline: `build_ka_diagnostic.py` generates sets, `export-diagnostic-data.mjs` exports to `public/diagnostic/`
- See [CODEMAPS/diagnostics.md](./CODEMAPS/diagnostics.md) for architecture details

### Viva Request Flow (Jan 2026)
- Removed modal confirmation -- button directly updates status
- "Request for Viva" button only appears when ALL activities are complete
- Sub-objectives in major view are clickable (navigate to detail)
- Activity checkboxes have optimistic updates

## Key Concepts

### User Roles
- **Students**: Learn through gamified skill trees, track emotions, set goals
- **Coaches/Admins**: Manage curriculum, approve vivas, monitor progress

### Core Features
1. **Deep Work (Skill Tree)** - Gamified learning objectives
2. **Sprint Planning** - Goal setting with AI companion
3. **Reading Journey** - Book tracking and presentations
4. **Palette of Presence** - Daily emotional check-in

### Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Convex (real-time database)
- **Styling**: Tailwind CSS + CSS Modules
- **Icons**: Phosphor Icons
