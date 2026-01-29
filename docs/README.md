# Deep Work Tracker Documentation

## Quick Navigation

| Document | Description |
|----------|-------------|
| [CODEMAPS/INDEX.md](./CODEMAPS/INDEX.md) | High-level architecture maps (start here) |
| [USER-JOURNEYS.md](./USER-JOURNEYS.md) | Complete user flows for students and coaches |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture and component structure |
| [DATA-MODEL.md](./DATA-MODEL.md) | Convex database schema and relationships |
| [COMPONENTS.md](./COMPONENTS.md) | Quick component/file lookup guide |
| [PATTERNS.md](./PATTERNS.md) | Code patterns and conventions used |
| [CURRICULUM-MATH-MAPPING.md](./CURRICULUM-MATH-MAPPING.md) | How Math LO -> objective -> activity seeding works |

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

### Viva Request Flow (Jan 2026)
- Removed modal confirmation - button now directly updates status
- "Request for Viva" button only appears when ALL activities are complete
- Sub-objectives in major view are clickable (navigate to detail)
- Activity checkboxes have optimistic updates (instant UI feedback)

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
