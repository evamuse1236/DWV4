# Project Notes

## Convex Database

This project has **two separate databases**:
- **Dev**: `ardent-penguin-515` (used by `npx convex dev` and local development)
- **Prod**: `greedy-marten-449` (used by `npx convex deploy`)

The frontend uses the **dev database** (see `VITE_CONVEX_URL` in `.env.local`).

When running Convex mutations:
- `npx convex run <function>` → runs on **dev**
- `npx convex run <function> --prod` → runs on **prod**

Always check which database you're targeting before running mutations!
