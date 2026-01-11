# Suggested Commands

## Development
```bash
# Start Vite dev server (frontend)
npm run dev

# Start Convex dev server (backend) - run in separate terminal
npx convex dev

# Run both together (two terminals needed)
# Terminal 1: npx convex dev
# Terminal 2: npm run dev
```

## Build & Preview
```bash
# Type-check and build for production
npm run build

# Preview production build
npm run preview
```

## Code Quality
```bash
# Run ESLint
npm run lint

# Run tests (watch mode)
npm run test

# Run tests once
npm run test:run
```

## Convex (Backend)
```bash
# Start Convex development server
npx convex dev

# Deploy to production
npx convex deploy

# Run a mutation/query from CLI (example)
npx convex run seed:seedAll

# Generate types after schema changes
npx convex dev  # auto-generates _generated/ folder
```

## System Utilities
```bash
# Git operations
git status
git add .
git commit -m "message"
git push

# File operations
ls -la
find . -name "*.tsx"
grep -r "pattern" src/
```
