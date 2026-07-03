// Core types for the Hades-style deterministic dialogue system.
// Lines are hand-authored per character, keyed by contextKey, and selected
// by the engine based on mode, state predicates, priority, and no-repeat history.

export type CharacterId = "luffy" | "steve" | "percy";

export type DialogueArea = "planner" | "library";

export type Expression = "neutral" | "excited" | "thinking" | "proud" | "laughing";

export type BuddyMode = "quick" | "talkative";

export interface DialogueContext {
  kidName?: string;
  mode: BuddyMode;
  sprintDaysLeft?: number;
  tasksDoneToday?: number;
  streakDays?: number;
  hasPreviousSprintGoals?: boolean;
  isFirstOpenToday?: boolean;
  /** Interpolation payload: {activity}, {when}, {howLong}, {bookTitle}, {genreStinger}, ... */
  vars?: Record<string, string | number>;
}

export interface DialogueLine {
  /** Stable id, e.g. "luffy.planner.taskDone.multi.2" — used for no-repeat tracking. */
  id: string;
  /** Supports {token} interpolation from DialogueContext.vars and top-level ctx fields. */
  text: string;
  /** Portrait expression while this line is shown. Default: "neutral". */
  expression?: Expression;
  /** Weighted-random selection weight. Default: 1. */
  weight?: number;
  /** Higher priority tier wins outright (specific beats generic). Default: 0. */
  priority?: number;
  /** Restrict to modes. Default: both. Banter lines set ["talkative"]. */
  modes?: BuddyMode[];
  /** State predicate — the line is only a candidate when this returns true. */
  when?: (ctx: DialogueContext) => boolean;
}

/** contextKey -> pool of candidate lines */
export type LinePack = Record<string, DialogueLine[]>;

export interface ResolvedLine {
  id: string;
  text: string;
  expression: Expression;
}
