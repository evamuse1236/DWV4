import type {
  BuddyMode,
  DialogueContext,
  DialogueLine,
  LinePack,
  ResolvedLine,
} from "./types";
import { interpolate } from "./interpolate";
import type { LineHistory } from "./history";

export interface DialogueEngine {
  /**
   * Pick the best line for a context key: filter by mode + `when(ctx)`,
   * keep only the highest priority tier present, exclude recently used
   * (unless that would empty the pool — then fall back to least-recent),
   * weighted-random pick, record in history, interpolate.
   *
   * Returns null only when the context key has no lines that pass filters —
   * callers should treat that as "say nothing".
   */
  next(contextKey: string, ctx: DialogueContext): ResolvedLine | null;
}

interface EngineOptions {
  /** Injectable RNG for deterministic tests. Defaults to Math.random. */
  random?: () => number;
}

function lineMatchesMode(line: DialogueLine, mode: BuddyMode): boolean {
  return !line.modes || line.modes.includes(mode);
}

function weightedPick(
  candidates: DialogueLine[],
  random: () => number
): DialogueLine {
  const totalWeight = candidates.reduce((sum, line) => sum + (line.weight ?? 1), 0);
  let roll = random() * totalWeight;
  for (const line of candidates) {
    roll -= line.weight ?? 1;
    if (roll <= 0) return line;
  }
  return candidates[candidates.length - 1];
}

export function createDialogueEngine(
  pack: LinePack,
  history: LineHistory,
  options: EngineOptions = {}
): DialogueEngine {
  const random = options.random ?? Math.random;

  return {
    next(contextKey, ctx) {
      const pool = pack[contextKey];
      if (!pool || pool.length === 0) {
        if (import.meta.env?.DEV) {
          console.warn(`[dialogue] No lines for context key "${contextKey}"`);
        }
        return null;
      }

      const eligible = pool.filter(
        (line) => lineMatchesMode(line, ctx.mode) && (!line.when || line.when(ctx))
      );
      if (eligible.length === 0) return null;

      const topPriority = Math.max(...eligible.map((line) => line.priority ?? 0));
      const tier = eligible.filter((line) => (line.priority ?? 0) === topPriority);

      // Exclude the most recently used lines, but never so many that the pool
      // empties — with a pool of N we exclude at most min(N - 1, 6).
      const excludeLimit = Math.min(tier.length - 1, 6);
      const recent = history.recentIds(contextKey, excludeLimit);
      let candidates = tier.filter((line) => !recent.has(line.id));

      if (candidates.length === 0) {
        // Everything eligible was recent (tiny pool) — pick the least recent.
        candidates = [...tier].sort(
          (a, b) => history.lastShownAt(a.id) - history.lastShownAt(b.id)
        );
        candidates = [candidates[0]];
      }

      const chosen = weightedPick(candidates, random);
      history.record(contextKey, chosen.id);

      return {
        id: chosen.id,
        text: interpolate(chosen.text, ctx),
        expression: chosen.expression ?? "neutral",
      };
    },
  };
}
