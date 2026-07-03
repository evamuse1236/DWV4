import type { DialogueContext } from "./types";

const TOKEN_PATTERN = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

/**
 * Replace {token} placeholders from ctx.vars plus a few well-known
 * top-level context fields. Unknown tokens resolve to "" (never show
 * `{undefined}` to a kid) with a dev-only warning.
 */
export function interpolate(text: string, ctx: DialogueContext): string {
  return text.replace(TOKEN_PATTERN, (_match, token: string) => {
    const fromVars = ctx.vars?.[token];
    if (fromVars !== undefined) return String(fromVars);

    switch (token) {
      case "kidName":
        return ctx.kidName ?? "";
      case "sprintDaysLeft":
        return ctx.sprintDaysLeft !== undefined ? String(ctx.sprintDaysLeft) : "";
      case "tasksDoneToday":
        return ctx.tasksDoneToday !== undefined ? String(ctx.tasksDoneToday) : "";
      case "streakDays":
        return ctx.streakDays !== undefined ? String(ctx.streakDays) : "";
      default:
        if (import.meta.env?.DEV) {
          console.warn(`[dialogue] Unknown interpolation token {${token}}`);
        }
        return "";
    }
  });
}
