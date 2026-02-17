# Deep Work Tracker -- Codemap Index

**Last Updated:** 2026-01-30

## What are Codemaps?

Codemaps are high-level architectural maps of the codebase. They show file paths, module boundaries, key exports, and data flow -- but NOT implementation details. Use them to quickly find where things live and how they connect.

## Codemap Files

| Codemap | What it covers |
|---------|----------------|
| [frontend.md](./frontend.md) | React pages, components, hooks, routing |
| [backend.md](./backend.md) | Convex functions (queries, mutations, actions) |
| [data-model.md](./data-model.md) | Database tables, relationships, indexes |
| [ai-system.md](./ai-system.md) | AI chat actions, prompts, providers |
| [diagnostics.md](./diagnostics.md) | Diagnostic quiz system (unlock, attempt, auto-master) |
| [vision-board.md](./vision-board.md) | Vision board areas, cards, interactions |
| [scripts.md](./scripts.md) | Curriculum seeding, data maintenance scripts |

## System Overview

```
Browser (React 19 + Vite)
  |
  | ConvexReactClient
  | useQuery / useMutation / useAction
  |
  v
Convex Backend
  |
  +-- schema.ts (26 tables)
  +-- 15 function files (queries/mutations)
  +-- ai.ts (actions -> external LLMs)
  +-- diagnostics.ts (quiz engine)
  +-- visionBoard.ts (personal boards)
  |
  v
Convex DB + External Services
  +-- Groq (Kimi K2, Llama 8B)
  +-- OpenRouter (fallback)
  +-- Static diagnostic JSON (/public/diagnostic/diagnostic-data.json, diagnostic-sets.json)
```

## Two User Roles, Two UIs

| Role | Layout | UI System | Routes |
|------|--------|-----------|--------|
| Student | `DashboardLayout` + `CheckInGate` | Paper UI (`src/components/paper/`) | `/dashboard`, `/sprint`, `/deep-work`, `/reading`, etc. |
| Admin | `AdminLayout` | shadcn/ui (`src/components/ui/`) | `/admin/*` |

## Two Databases

| Environment | Convex Slug | Used By |
|-------------|-------------|---------|
| Dev | `ardent-penguin-515` | `npx convex dev`, local frontend |
| Prod | `greedy-marten-449` | `npx convex deploy`, Netlify |

## Key Entry Points

| Purpose | File |
|---------|------|
| React app mount | `src/main.tsx` |
| Router + providers | `src/App.tsx` |
| Database schema | `convex/schema.ts` |
| Auth context | `src/hooks/useAuth.tsx` |
| Seed data | `convex/seed.ts` (2841 lines) |

## Related Documentation

See [docs/README.md](../README.md) for the full documentation index. Key references:
- [ARCHITECTURE.md](../ARCHITECTURE.md) -- Narrative architecture
- [DATA-MODEL.md](../DATA-MODEL.md) -- Full table field reference
- [PATTERNS.md](../PATTERNS.md) -- Coding conventions
