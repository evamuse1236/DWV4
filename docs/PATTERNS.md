# Patterns & Conventions

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Files (components) | PascalCase | `StudentDashboard.tsx` |
| Files (hooks) | camelCase with prefix | `useAuth.tsx`, `use-mobile.tsx` |
| Files (utilities) | camelCase | `utils.ts`, `domain-utils.tsx` |
| Files (Convex) | camelCase | `objectives.ts`, `auth.ts` |
| Components | PascalCase | `EmotionWheel`, `GoalEditor` |
| Functions | camelCase | `formatRelativeDate()`, `cn()` |
| Constants | camelCase or SCREAMING_SNAKE | `TOKEN_KEY` |
| Types/Interfaces | PascalCase | `User`, `AuthContextType` |
| CSS Modules | kebab-case | `sprint.module.css` |
| CSS classes | kebab-case | `emotion-wheel`, `goal-card` |

## File Organization

### Component Structure

Components are organized by feature domain:

```
src/components/
├── auth/           # Authentication-related
│   ├── LoginForm.tsx
│   ├── ProtectedRoute.tsx
│   └── index.ts    # Re-exports
├── emotions/       # Emotion check-in feature
│   ├── EmotionWheel.tsx
│   ├── EmotionCard.tsx
│   ├── EmotionJournal.tsx
│   ├── EmotionHistory.tsx
│   └── index.ts
├── paper/          # Paper UI design system
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   └── index.ts
└── ui/             # shadcn components
    ├── button.tsx
    ├── card.tsx
    └── index.ts
```

### Page Structure

Pages mirror the routing structure:

```
src/pages/
├── admin/
│   ├── AdminDashboard.tsx
│   ├── StudentsPage.tsx
│   ├── StudentDetailPage.tsx
│   └── index.ts    # Re-exports all admin pages
├── student/
│   ├── StudentDashboard.tsx
│   ├── SprintPage.tsx
│   ├── DeepWorkPage.tsx
│   └── sprint.module.css  # Page-specific styles
├── LoginPage.tsx
└── SetupPage.tsx
```

### Convex Structure

Backend functions organized by domain:

```
convex/
├── schema.ts       # All table definitions
├── auth.ts         # Authentication functions
├── users.ts        # User CRUD
├── emotions.ts     # Emotion check-ins
├── objectives.ts   # Learning objectives
├── progress.ts     # Progress tracking
└── seed.ts         # Database seeding
```

## Import Order

```typescript
// 1. React and external libraries
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";

// 2. Convex API (auto-generated)
import { api } from "../../convex/_generated/api";

// 3. Internal utilities and hooks
import { cn, formatRelativeDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// 4. Internal components
import { Button, Card } from "@/components/ui";
import { EmotionWheel } from "@/components/emotions";

// 5. Types (using `import type` for Convex)
import type { User, AuthContextType } from "@/types";
import type { Id } from "../../convex/_generated/dataModel";

// 6. Styles (last)
import styles from "./Component.module.css";
```

## Code Patterns

### Convex Query Pattern

```typescript
// Always use skip for conditional queries
const currentUser = useQuery(
  api.auth.getCurrentUser,
  token ? { token } : "skip"  // "skip" prevents query when no token
);

// Check loading state (undefined = loading, null = no result)
const isLoading = currentUser === undefined;
const hasUser = currentUser !== null;
```

### Convex Mutation Pattern

```typescript
// Define mutation hook
const createGoal = useMutation(api.goals.create);

// Call with proper error handling
const handleCreate = async () => {
  try {
    const goalId = await createGoal({
      userId: user._id,
      title: "My Goal",
      // ... other fields
    });
    // Handle success
  } catch (error) {
    console.error("Failed to create goal:", error);
    // Show user-friendly error
  }
};
```

### Auth Context Pattern

```typescript
// Provider wraps app
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize from localStorage
    return localStorage.getItem(TOKEN_KEY);
  });

  // ... auth logic

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook throws if used outside provider
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### Protected Route Pattern

```typescript
// Role-based route protection
<ProtectedRoute allowedRoles={["student"]}>
  <DashboardLayout />
</ProtectedRoute>

// Inside ProtectedRoute component
if (isLoading) return <LoadingSpinner />;
if (!user) return <Navigate to="/login" replace />;
if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
return children;
```

### CSS Utility Pattern

```typescript
// cn() combines clsx + tailwind-merge
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" ? "bg-blue" : "bg-gray"
)} />
```

## TypeScript Patterns

### Type-Only Imports (Required for Convex)

```typescript
// CORRECT - required by verbatimModuleSyntax
import type { Id } from "../../convex/_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

// WRONG - will cause build errors
import { Id } from "../../convex/_generated/dataModel";
```

### No JSX.Element Return Types

```typescript
// CORRECT - omit return type
export function MyComponent() {
  return <div>Hello</div>;
}

// WRONG - don't use JSX.Element
export function MyComponent(): JSX.Element {
  return <div>Hello</div>;
}
```

### Branded ID Types

```typescript
// Pattern used in src/types/index.ts
type Id<T extends string> = string & { __tableName: T };

// Usage
interface User {
  _id: Id<"users">;
  // ...
}
```

## Error Handling

### Convex Error Pattern

```typescript
// In Convex functions
export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }
    await ctx.db.delete(args.userId);
  },
});
```

### Frontend Error Pattern

```typescript
// Try-catch with user feedback
try {
  await mutation(args);
  // Show success toast or update UI
} catch (error) {
  console.error("[functionName]", error);
  // Show error message to user
  setError("Something went wrong. Please try again.");
}
```

### Session Expiry Pattern

```typescript
// Clear token if session is invalid
useEffect(() => {
  if (token && currentUser === null) {
    // Token exists but user is null - session expired
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }
}, [token, currentUser]);
```

## Component Patterns

### Dual Design System

```typescript
// Student pages use Paper UI components
import { Button, Card } from "@/components/paper";

// Admin pages use shadcn components
import { Button, Card } from "@/components/ui";
```

### Index Re-exports

```typescript
// src/components/emotions/index.ts
export { EmotionWheel } from "./EmotionWheel";
export { EmotionCard } from "./EmotionCard";
export { EmotionJournal } from "./EmotionJournal";

// Usage - clean imports
import { EmotionWheel, EmotionCard } from "@/components/emotions";
```

### Layout Wrapper Pattern

```typescript
// Layout with outlet for nested routes
function DashboardLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        <CheckInGate>  {/* Enforces daily check-in */}
          <Outlet />   {/* Renders child route */}
        </CheckInGate>
      </main>
    </div>
  );
}
```

## Testing Approach

| Test Type | Location | Naming | Runner |
|-----------|----------|--------|--------|
| Unit | Same folder | `*.test.ts` | Vitest |
| Component | Same folder | `*.test.tsx` | Vitest + Testing Library |

### Test Pattern

```typescript
// src/components/paper/Button.test.tsx
import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies variant styles", () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("btn-primary");
  });
});
```

### Test Setup

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
// Additional setup here
```

## Gotchas & Anti-Patterns

### DO NOT: Use wrong localStorage key

```typescript
// WRONG
localStorage.getItem("auth_token");

// CORRECT
localStorage.getItem("deep-work-tracker-token");
```

### DO NOT: Import types without `type` keyword in Convex

```typescript
// WRONG - breaks build
import { MutationCtx } from "./_generated/server";

// CORRECT
import type { MutationCtx } from "./_generated/server";
```

### DO NOT: Use JSX.Element as return type

```typescript
// WRONG
function Component(): JSX.Element { ... }

// CORRECT
function Component() { ... }
```

### DO NOT: Forget to handle loading states

```typescript
// WRONG - undefined check missing
if (!data) return <Empty />;

// CORRECT - distinguish loading from empty
if (data === undefined) return <Loading />;
if (data === null || data.length === 0) return <Empty />;
```

### DO NOT: Run mutations on wrong database

```bash
# WRONG - might hit prod
npx convex run users:create

# CORRECT - explicitly target dev
npx convex run users:create  # (dev is default with `convex dev`)

# CORRECT - explicitly target prod
npx convex run users:create --prod
```

## Project-Specific Rules

1. **Two Databases**: Dev (`ardent-penguin-515`) and Prod (`greedy-marten-449`). Always know which you're targeting.

2. **Token Key**: Use `"deep-work-tracker-token"` for localStorage auth token.

3. **Type Imports**: Use `import type` for all type-only imports in Convex files.

4. **Student vs Admin UI**: Student pages use Paper UI (calm aesthetic), Admin pages use shadcn (functional).

5. **Check-in Gate**: Students must complete daily emotion check-in before accessing content.

6. **Session Expiry**: Sessions last 7 days. Handle `null` user gracefully.

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npx convex dev` | Start Convex dev backend |
| `npm run build` | Production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run lint` | Check code style |
| `npx convex run <function>` | Run Convex function (dev) |
| `npx convex run <function> --prod` | Run Convex function (prod) |
| `npx convex deploy` | Deploy to production |

## Design Principles

### Student Pages
- Calm, spacious, minimal choices
- Soft pastel colors
- Paper UI components
- Flow-state inducing

### Admin Pages
- Functional, data-dense, action-oriented
- Standard shadcn components
- Tables, forms, queues

### Error Handling
- Always guide forward, never dead-end
- Show retry buttons on failures
- Clear error messages

### Confirmations
- High-stakes actions (delete, approve) require explicit confirmation
- Use dialogs for destructive actions
