# Task Completion Checklist

When completing a task, ensure the following:

## Before Committing

1. **Type Check**
   ```bash
   npm run build
   ```
   - Fixes any TypeScript errors

2. **Lint**
   ```bash
   npm run lint
   ```
   - Fix any linting errors/warnings

3. **Test** (if tests exist for modified code)
   ```bash
   npm run test:run
   ```

4. **Manual Verification**
   - Run the app: `npm run dev` (and `npx convex dev` if backend changed)
   - Test the feature/fix in browser

## Convex-Specific

- If schema changed: Convex dev will auto-sync
- If mutations/queries changed: Test via app or CLI
- New tables require seeding via `seed.ts` if needed

## Git Commit

```bash
git add .
git commit -m "feat/fix/refactor: description"
```

Follow conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code refactoring
- `docs:` documentation
- `style:` formatting
- `test:` tests
