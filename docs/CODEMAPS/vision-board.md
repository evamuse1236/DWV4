# Vision Board Codemap

**Last Updated:** 2026-01-30
**Backend:** `convex/visionBoard.ts`
**Frontend Page:** `src/pages/student/VisionBoardPage.tsx`
**Frontend Hook:** `src/hooks/useVisionBoard.ts`
**Frontend Components:** `src/components/visionboard/`

## Purpose

Vision Board is a personal goal visualization tool for students. Students organize cards into life areas (Fun, Health, Friends, Family, Academics) and track progress with different card types (counters, streaks, habits, progress bars, journals, etc.).

## Architecture

```
VisionBoardPage
  |
  +-- useVisionBoard() hook
  |     +-- useQuery(api.visionBoard.getAreas)
  |     +-- useQuery(api.visionBoard.getCards)
  |     +-- useMutation(api.visionBoard.*)
  |     +-- Auto-seeds preset areas on first load
  |
  +-- AreaFilter         (filter cards by area)
  +-- VisionBoardGrid    (renders card grid)
  |     +-- CardRenderer  (delegates to card type component)
  |           +-- CounterCard
  |           +-- HabitsCard
  |           +-- ImageHeroCard
  |           +-- JournalCard
  |           +-- MiniTileCard
  |           +-- MotivationCard
  |           +-- ProgressCard
  |           +-- StreakCard
  +-- VisionBoardFAB     (floating action button: add card, add/rename/delete area)
  +-- CardCreatorSheet   (create new card)
  +-- CardDetailSheet    (edit/view card details)
```

## Data Model

### `visionBoardAreas`
Each user has life areas (seeded with 5 presets on first load):
- Fun & Interests (Sparkle)
- Health & Fitness (Barbell)
- Friends (Users)
- Family (House)
- Academics & Career (GraduationCap)

Users can add custom areas or rename/delete existing ones.

### `visionBoardCards`
Cards belong to an area and have a type, size, and color variant.

**Card Types:**
| Type | Sizes | Purpose |
|------|-------|---------|
| `image_hero` | hero, lg, wide | Large image card with optional progress overlay |
| `counter` | sm, md | Count toward a target (e.g., "Books Read: 3/10") |
| `progress` | lg, md, wide | Step-based progress bar |
| `streak` | wide, md | Day streak counter with motivational quote |
| `habits` | tall, lg | Daily habit checklist |
| `mini_tile` | sm | Small emoji tile |
| `motivation` | md, wide | Motivational quote card |
| `journal` | wide, md, lg | Text journal entry |

**Size Grid:**
| Size | Grid Span |
|------|-----------|
| sm | 1 col |
| md | 1 col |
| lg | 2 col |
| tall | 1 col, 2 row |
| wide | 2 col |
| hero | full width |

**Color Variants:** green, blue, pink, purple, orange, yellow

## Backend Functions (`convex/visionBoard.ts`)

### Queries
| Function | Purpose |
|----------|---------|
| `getAreas` | All areas for user |
| `getCards` | All cards for user |

### Area Mutations
| Function | Purpose |
|----------|---------|
| `seedPresetAreas` | Idempotent: create 5 preset areas if user has none |
| `addArea` | Create custom area |
| `updateArea` | Rename/change emoji (marks as non-preset) |
| `deleteArea` | Delete area + cascade delete all cards in it |

### Card Mutations
| Function | Purpose |
|----------|---------|
| `createCard` | Create card with all type-specific fields |
| `updateCard` | Patch any card fields |
| `deleteCard` | Delete single card |

### Card Interaction Mutations
| Function | Purpose |
|----------|---------|
| `incrementCounter` | +1 currentCount (capped at targetCount) |
| `incrementProgress` | +1 completedSteps (capped at totalSteps) |
| `incrementStreak` | +1 streakCount |
| `toggleHabit` | Toggle done flag on habit at given index |

## Frontend Hook (`useVisionBoard`)

Returns:
- `cards` -- VisionBoardCard[] (mapped from Convex _id to id)
- `areas` -- VisionBoardArea[] (mapped from Convex _id to id)
- `addCard`, `updateCard`, `deleteCard` -- Card CRUD
- `addArea`, `updateArea`, `deleteArea` -- Area CRUD
- `incrementCounter`, `incrementProgress`, `incrementStreak`, `toggleHabit` -- Card interactions
- `cycleSize` -- Cycle through allowed sizes for a card type

The hook also auto-seeds preset areas when a user has no areas (first visit).

## Layout System

`src/components/visionboard/layout.ts` contains the grid layout calculation logic. Cards are arranged in a responsive grid based on their size property.

## PhIcon Component

`src/components/visionboard/PhIcon.tsx` dynamically renders Phosphor icons by name string, used for area emojis.
