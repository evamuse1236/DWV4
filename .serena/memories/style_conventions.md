# Code Style & Conventions

## TypeScript
- Strict mode enabled
- Use explicit types for function parameters and return values
- Prefer `interface` for object shapes, `type` for unions/aliases
- Use `as any` sparingly (currently used for Convex ID types)

## React Components
- Functional components with hooks only
- Named exports preferred (e.g., `export function ComponentName()`)
- Props interface defined above component
- JSDoc comments for component documentation

## File Naming
- Components: PascalCase (e.g., `LoginForm.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`)
- Utilities: camelCase (e.g., `utils.ts`)
- Index files for re-exports in component folders

## Component Structure
```typescript
// 1. Imports
import { useState } from "react";
import { useQuery } from "convex/react";

// 2. Types/Interfaces
interface Props {
  title: string;
}

// 3. Component with JSDoc
/**
 * Description of the component
 */
export function MyComponent({ title }: Props) {
  // 4. Hooks first
  const [state, setState] = useState();
  
  // 5. Derived state / handlers
  const handleClick = () => {};
  
  // 6. Early returns (loading, error states)
  if (!data) return <Loading />;
  
  // 7. Main render
  return <div>{title}</div>;
}

// 8. Default export (optional)
export default MyComponent;
```

## Styling (Tailwind v4)
- Use Tailwind utility classes directly
- Custom theme in `index.css` using `@theme` directive
- Use `cn()` utility from `lib/utils.ts` for conditional classes
- Component-level styles in `@layer components`

## Convex Backend
- Each table has its own file (e.g., `goals.ts`, `habits.ts`)
- Schema defined in `schema.ts`
- Use `v.id("tableName")` for ID validators
- Queries use `.withIndex()` when filtering by indexed fields
