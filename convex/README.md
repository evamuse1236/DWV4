# Convex Backend Notes

This project uses Convex for schema, functions, and deployment.

## Key files in this directory

- `schema.ts`: table/index contracts
- `seed.ts`: setup and curriculum seed entry points
- `ai.ts`: external AI actions
- domain modules (`*.ts`): queries/mutations by feature area

## Development commands

```bash
npx convex dev
npx convex deploy -y
npx convex run <function>
npx convex run <function> --prod
```

Use `--prod` only when explicitly targeting production.

## References

- `docs/DATA-MODEL.md`
- `docs/RUNBOOK.md`
- `docs/CODEBASE-MAP.md`
