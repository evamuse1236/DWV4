# Future Improvements Plan

## Skeleton Loading - Flash Issue [COMPLETED]

**Status:** Implemented Option A (Delayed Skeleton) on 2026-01-24

**Solution implemented:**
- Created `src/hooks/useDelayedLoading.ts` - reusable hook that delays showing skeleton by 200ms
- Updated all 4 components to use the hook:
  - `src/pages/student/StudentDashboard.tsx`
  - `src/pages/student/ReadingPage.tsx`
  - `src/pages/admin/AdminDashboard.tsx`
  - `src/components/layout/CheckInGate.tsx`

**How it works:**
```tsx
const isLoading = data === undefined;
const showSkeleton = useDelayedLoading(isLoading);

if (showSkeleton) return <Skeleton />;
if (isLoading) return null;  // Brief empty state under threshold
return <ActualContent />;
```

~~**Priority:** Low - cosmetic improvement~~
~~**Effort:** ~1-2 hours for Option A, longer for B/C~~

## Documentation Improvements [COMPLETED]

Created on 2026-01-24.

### AI System Documentation [DONE]
**File:** `docs/AI-SYSTEM.md`

Documented:
- Model configuration (Groq primary, OpenRouter fallback)
- Goal-setting chat (personas: Muse, Captain, Luna)
- Book Buddy (personalities: Luna, Flash, Hagrid)
- Project Data Entry feature
- How to add new AI features
- Debugging tips

### Component Quick Reference [DONE]
**File:** `docs/COMPONENTS.md`

Created quick lookup guide with:
- All UI components (shadcn and custom Paper UI)
- Feature components by area
- "Want to change X? Edit file Y" format
- Pages, hooks, utilities references

### Keep CLAUDE.md Updated
**Action:** Ongoing - add gotchas as discovered

When hitting gotchas or learning important patterns:
- Document them in `CLAUDE.md` for future reference
- Update TypeScript build rules section when discovering new rules
- Update database/configuration sections when they change

**Priority:** Low - ongoing maintenance
**Effort:** Continuous, ~5 minutes per gotcha
