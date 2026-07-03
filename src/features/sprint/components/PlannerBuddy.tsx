import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import {
  createDialogueEngine,
  createLineHistory,
  createMemoryLineHistory,
  getLinePack,
  isBuddySoundEnabled,
  playVoice,
  voiceFor,
} from "@/shared/dialogue";
import type { DialogueContext, ResolvedLine } from "@/shared/dialogue";
import {
  BuddyBark,
  BuddyBlob,
  BuddyPicker,
  ChoiceList,
  DialogueStage,
  SuggestionBubbles,
  type BarkMessage,
  type Choice,
} from "@/shared/components/dialogue";
import { useBuddy } from "@/shared/hooks/useBuddy";
import {
  buildGoalSummary,
  generateTasks,
  isConfirmation,
  isModificationRequest,
  mergeDraft,
  parseDuration,
  parseGoalInput,
  parseModification,
  parseSchedule,
  resolveActivity,
  type GoalDraft,
  type GoalSummary,
  type SuggestedTask,
} from "@/shared/goalChat/parser";
import styles from "@/shared/styles/dialogue.module.css";

type Step =
  | "home"
  | "pickImport"
  | "pickCopy"
  | "pickRename"
  | "renameGoal"
  | "askActivity"
  | "askDuration"
  | "askSchedule"
  | "confirm"
  | "created";

interface GoalRef {
  id: string;
  title: string;
}

interface PreviousGoalRef extends GoalRef {
  sprintName: string;
}

interface PlannerBuddyProps {
  userId: string | null;
  kidName?: string;
  expanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  sprintDaysRemaining: number;
  onGoalComplete: (goal: GoalSummary, tasks: SuggestedTask[]) => Promise<void> | void;
  existingGoals: GoalRef[];
  previousSprintGoals: PreviousGoalRef[];
  onDuplicateGoal: (goalId: string) => Promise<void>;
  onImportGoal: (goalId: string) => Promise<void>;
  onRenameGoal: (goalId: string, title: string) => Promise<void>;
  /**
   * Blob-anchored reaction event (task done, streaks). The buddy resolves it
   * to an in-voice line, throttled so it stays charming rather than naggy.
   */
  barkEvent?: { id: string; key: string; vars?: Record<string, string | number> } | null;
}

const BARK_THROTTLE_MS = 20_000;

const STARTER_ACTIVITIES = ["Reading", "Math practice", "Drawing", "Writing", "Exercise", "Coding"];
const DURATION_BUBBLES = ["15 minutes", "30 minutes", "45 minutes", "1 hour"];
const SCHEDULE_BUBBLES = ["Every day", "Weekdays", "Weekends", "Mon/Wed/Fri", "Tue/Thu", "3x per week"];

const EMPTY_DRAFT: GoalDraft = { what: null, when: null, howLong: null };

function firstOpenKey(userId: string | null) {
  return `dw.buddy.firstOpen.${userId ?? "anon"}`;
}

function consumeFirstOpenToday(userId: string | null): boolean {
  try {
    const key = firstOpenKey(userId);
    const today = new Date().toDateString();
    const last = localStorage.getItem(key);
    localStorage.setItem(key, today);
    return last !== today;
  } catch {
    return false;
  }
}

/** SMART-goal recap presented as a stamped quest scroll. */
function GoalRecapCard({ draft }: { draft: GoalDraft }) {
  const summary = buildGoalSummary(draft);
  const taskCount = draft.what && draft.when ? generateTasks(summary.what, summary.when).length : 0;
  return (
    <div className={styles.card}>
      <div className={styles.cardSeal} aria-hidden="true" />
      <div className={styles.cardKicker}>Quest Scroll</div>
      <div className={styles.cardTitle}>{summary.title}</div>
      <div className={styles.cardRows}>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLabel}>Mission</span>
          <span>{summary.what}</span>
        </div>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLabel}>Days</span>
          <span>{summary.when}</span>
        </div>
        <div className={styles.cardRow}>
          <span className={styles.cardRowLabel}>Each time</span>
          <span>{summary.howLong}</span>
        </div>
      </div>
      {taskCount > 0 && (
        <div className={styles.cardFootnote}>
          {taskCount} task{taskCount === 1 ? "" : "s"} will land on your week grid.
        </div>
      )}
    </div>
  );
}

/**
 * The planner's dialogue buddy — a Hades-style character conversation that
 * replaces the old LLM chat. Fully deterministic and choices-first: a kid
 * can create a complete goal without typing once.
 */
export function PlannerBuddy({
  userId,
  kidName,
  expanded,
  onToggle,
  onClose,
  sprintDaysRemaining,
  onGoalComplete,
  existingGoals,
  previousSprintGoals,
  onDuplicateGoal,
  onImportGoal,
  onRenameGoal,
  barkEvent,
}: PlannerBuddyProps) {
  const { character, mode, setCharacter, setMode } = useBuddy();
  const [showPicker, setShowPicker] = useState(false);
  const [step, setStep] = useState<Step>("home");
  const [draft, setDraft] = useState<GoalDraft>(EMPTY_DRAFT);
  const [line, setLine] = useState<ResolvedLine | null>(null);
  const [ghost, setGhost] = useState<string | null>(null);
  const [queue, setQueue] = useState<ResolvedLine[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [renameTarget, setRenameTarget] = useState<GoalRef | null>(null);
  const [bark, setBark] = useState<BarkMessage | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const lastBarkAt = useRef(0);

  const engine = useMemo(() => {
    if (!character) return null;
    const history = userId ? createLineHistory(userId) : createMemoryLineHistory();
    return createDialogueEngine(getLinePack(character, "planner"), history);
  }, [character, userId]);

  const buildCtx = useCallback(
    (vars?: Record<string, string | number>, isFirstOpenToday?: boolean): DialogueContext => ({
      kidName,
      mode,
      sprintDaysLeft: sprintDaysRemaining,
      hasPreviousSprintGoals: previousSprintGoals.length > 0,
      isFirstOpenToday,
      vars,
    }),
    [kidName, mode, sprintDaysRemaining, previousSprintGoals.length]
  );

  /** Speak one or more lines in sequence (talkative-only keys resolve to nothing in quick mode). */
  const speak = useCallback(
    (keys: string[], vars?: Record<string, string | number>, isFirstOpenToday?: boolean) => {
      if (!engine) return;
      const ctx = buildCtx(vars, isFirstOpenToday);
      const lines = keys
        .map((key) => engine.next(key, ctx))
        .filter((resolved): resolved is ResolvedLine => resolved !== null);
      if (lines.length === 0) return;
      setGhost(line?.text ?? null);
      setLine(lines[0]);
      setQueue(lines.slice(1));
    },
     
    [engine, buildCtx, line?.text]
  );

  // Chain queued lines: brief beat after each finishes typing.
  const handleLineDone = useCallback(() => {
    if (queue.length === 0) return;
    if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => {
      const [next, ...remaining] = queue;
      setGhost(line?.text ?? null);
      setLine(next);
      setQueue(remaining);
    }, 750);
  }, [queue, line]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current !== null) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  const offerRoutine = previousSprintGoals.length > 0 && existingGoals.length === 0;

  const greet = useCallback(() => {
    setStep("home");
    setDraft(EMPTY_DRAFT);
    setInputValue("");
    const isFirst = consumeFirstOpenToday(userId);
    if (offerRoutine) {
      speak(["offer.duplicateRoutine"], undefined, isFirst);
    } else {
      speak(["greeting"], undefined, isFirst);
    }
  }, [offerRoutine, speak, userId]);

  // Greet when the stage opens or the character changes while open.
  const greetedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!expanded || !character || !engine) {
      if (!expanded) greetedFor.current = null;
      return;
    }
    const greetKey = `${character}`;
    if (greetedFor.current === greetKey) return;
    greetedFor.current = greetKey;
    greet();
     
  }, [expanded, character, engine]);

  // First-run: no character picked yet — open straight into the picker.
  useEffect(() => {
    if (expanded && !character) setShowPicker(true);
  }, [expanded, character]);

  // Resolve bark events to in-voice lines (only while minimized, throttled).
  useEffect(() => {
    if (!barkEvent || !engine || expanded) return;
    const now = Date.now();
    if (now - lastBarkAt.current < BARK_THROTTLE_MS) return;
    const resolved = engine.next(barkEvent.key, buildCtx(barkEvent.vars));
    if (!resolved) return;
    lastBarkAt.current = now;
    setBark({ id: barkEvent.id, text: resolved.text });
    if (character && isBuddySoundEnabled()) {
      const clip = voiceFor(character, resolved.id);
      if (clip) playVoice(clip, 0.5);
    }
     
  }, [barkEvent?.id]);

  // --- Flow transitions -----------------------------------------------------

  const askForMissing = useCallback(
    (nextDraft: GoalDraft) => {
      setDraft(nextDraft);
      if (!nextDraft.what) {
        setStep("askActivity");
        speak(["goal.askActivity"]);
      } else if (!nextDraft.howLong) {
        setStep("askDuration");
        speak(
          mode === "talkative" ? ["banter.betweenSteps", "goal.askDuration"] : ["goal.askDuration"],
          { activity: nextDraft.what }
        );
      } else if (!nextDraft.when) {
        setStep("askSchedule");
        speak(["goal.askSchedule"], { activity: nextDraft.what });
      } else {
        setStep("confirm");
        speak(["goal.confirmRecap"], {
          activity: nextDraft.what,
          when: nextDraft.when,
          howLong: nextDraft.howLong,
        });
      }
    },
    [mode, speak]
  );

  const lockItIn = useCallback(async () => {
    if (!draft.what || !draft.when || !draft.howLong) return;
    const summary = buildGoalSummary(draft);
    const tasks = generateTasks(summary.what, summary.when);
    setBusy(true);
    try {
      await onGoalComplete(summary, tasks);
      setStep("created");
      speak(["goal.created"], { goalTitle: summary.title });
      setDraft(EMPTY_DRAFT);
    } catch {
      speak(["error.generic"]);
    } finally {
      setBusy(false);
    }
  }, [draft, onGoalComplete, speak]);

  const runAction = useCallback(
    async (action: () => Promise<void>, successKey: string) => {
      setBusy(true);
      try {
        await action();
        setStep("created");
        speak([successKey]);
      } catch {
        speak(["error.generic"]);
      } finally {
        setBusy(false);
      }
    },
    [speak]
  );

  // --- Choice + input handling ----------------------------------------------

  const handleChoice = useCallback(
    (id: string) => {
      if (busy) return;
      switch (id) {
        case "newGoal":
          askForMissing(EMPTY_DRAFT);
          break;
        case "runItBack":
          void runAction(async () => {
            for (const goal of previousSprintGoals) {
              await onImportGoal(goal.id);
            }
          }, "goal.imported");
          break;
        case "pickWhich":
          setStep("pickImport");
          break;
        case "copyGoal":
          setStep("pickCopy");
          break;
        case "importGoal":
          setStep("pickImport");
          break;
        case "renameGoal":
          setStep("pickRename");
          break;
        case "importAll":
          void runAction(async () => {
            for (const goal of previousSprintGoals) {
              await onImportGoal(goal.id);
            }
          }, "goal.imported");
          break;
        case "lockIn":
          void lockItIn();
          break;
        case "changeDays":
          setDraft((d) => ({ ...d, when: null }));
          setStep("askSchedule");
          speak(["goal.askSchedule"], { activity: draft.what ?? "" });
          break;
        case "changeTime":
          setDraft((d) => ({ ...d, howLong: null }));
          setStep("askDuration");
          speak(["goal.askDuration"], { activity: draft.what ?? "" });
          break;
        case "changeActivity":
          // Keep the schedule/duration the kid already chose — only the
          // activity changes.
          setDraft((d) => ({ ...d, what: null }));
          setStep("askActivity");
          speak(["goal.askActivity"]);
          break;
        case "startOver":
          askForMissing(EMPTY_DRAFT);
          break;
        case "anotherGoal":
          askForMissing(EMPTY_DRAFT);
          break;
        case "allDone":
          onClose();
          break;
        case "backHome":
          greet();
          break;
        default: {
          // Goal-scoped choices: "import:<id>", "copy:<id>", "rename:<id>"
          if (id.startsWith("import:")) {
            const goalId = id.slice("import:".length);
            void runAction(() => onImportGoal(goalId), "goal.imported");
          } else if (id.startsWith("copy:")) {
            const goalId = id.slice("copy:".length);
            void runAction(() => onDuplicateGoal(goalId), "goal.duplicated");
          } else if (id.startsWith("rename:")) {
            const goal = existingGoals.find((g) => g.id === id.slice("rename:".length));
            if (goal) {
              setRenameTarget(goal);
              setInputValue(goal.title);
              setStep("renameGoal");
            }
          }
        }
      }
    },
    [busy, askForMissing, runAction, previousSprintGoals, onImportGoal, onDuplicateGoal, existingGoals, lockItIn, draft.what, speak, onClose, greet]
  );

  const handleActivityPick = useCallback(
    (activity: string) => {
      // Merge with the current draft so any schedule/duration the kid
      // already provided (typed or picked) survives the bubble tap.
      askForMissing(mergeDraft(draft, { what: activity.toLowerCase(), when: null, howLong: null }));
    },
    [askForMissing, draft]
  );

  const handleDurationPick = useCallback(
    (label: string) => {
      const howLong = parseDuration(label);
      if (howLong) askForMissing({ ...draft, howLong });
    },
    [askForMissing, draft]
  );

  const handleSchedulePick = useCallback(
    (label: string) => {
      const when = parseSchedule(label);
      if (when) askForMissing({ ...draft, when });
    },
    [askForMissing, draft]
  );

  const handleSubmit = useCallback(() => {
    const text = inputValue.trim();
    if (!text || busy) return;
    setInputValue("");

    if (step === "renameGoal" && renameTarget) {
      const target = renameTarget;
      setRenameTarget(null);
      void runAction(() => onRenameGoal(target.id, text), "goal.edited");
      return;
    }

    if (step === "askActivity") {
      // Accept a full utterance: "read manga 30 min weekdays" fills everything.
      const parsed = parseGoalInput(text);
      if (!parsed.what) {
        const resolved = resolveActivity(text);
        if (resolved.kind === "activity") {
          parsed.what = resolved.activity;
        } else {
          // Keep whatever schedule/duration DID parse so the kid doesn't
          // lose it when they pick an activity bubble next.
          setDraft((d) => mergeDraft(d, parsed));
          setInputValue(resolved.prefill);
          speak(["goal.askActivityVague"]);
          return;
        }
      }
      askForMissing(mergeDraft(draft, parsed));
      return;
    }

    if (step === "askDuration" || step === "askSchedule") {
      const howLong = parseDuration(text);
      const when = parseSchedule(text);
      if (!howLong && !when) {
        // In-character "didn't catch that" with an example format.
        speak([step === "askDuration" ? "goal.retryDuration" : "goal.retrySchedule"]);
        return;
      }
      askForMissing({
        ...draft,
        howLong: howLong ?? draft.howLong,
        when: when ?? draft.when,
      });
      return;
    }

    if (step === "confirm") {
      if (isConfirmation(text)) {
        void lockItIn();
        return;
      }
      if (isModificationRequest(text)) {
        const modified = parseModification(text, draft);
        if (modified) {
          askForMissing(modified);
          return;
        }
      }
      const when = parseSchedule(text);
      const howLong = parseDuration(text);
      if (when || howLong) {
        askForMissing({ ...draft, when: when ?? draft.when, howLong: howLong ?? draft.howLong });
        return;
      }
      speak(["goal.confirmRecap"], {
        activity: draft.what ?? "",
        when: draft.when ?? "",
        howLong: draft.howLong ?? "",
      });
    }
  }, [inputValue, busy, step, renameTarget, runAction, onRenameGoal, askForMissing, speak, draft, lockItIn]);

  // --- Render helpers ---------------------------------------------------------

  const activitySuggestions = useMemo(() => {
    const fromGoals = [...previousSprintGoals, ...existingGoals].map((g) => g.title);
    return [...new Set([...fromGoals, ...STARTER_ACTIVITIES])].slice(0, 8);
  }, [previousSprintGoals, existingGoals]);

  const homeChoices: Choice[] = useMemo(() => {
    if (offerRoutine) {
      return [
        { id: "runItBack", label: "Run it back! Same routine." },
        { id: "pickWhich", label: "Let me pick which ones" },
        { id: "newGoal", label: "New goal instead" },
      ];
    }
    const choices: Choice[] = [{ id: "newGoal", label: "Set a new goal" }];
    if (existingGoals.length > 0) {
      choices.push({ id: "copyGoal", label: "Copy one of my goals" });
      choices.push({ id: "renameGoal", label: "Rename a goal" });
    }
    if (previousSprintGoals.length > 0) {
      choices.push({ id: "importGoal", label: "Bring back an old goal" });
    }
    return choices;
  }, [offerRoutine, existingGoals.length, previousSprintGoals.length]);

  const showInput =
    step === "askActivity" ||
    step === "askDuration" ||
    step === "askSchedule" ||
    step === "confirm" ||
    step === "renameGoal";

  const inputPlaceholder =
    step === "renameGoal"
      ? "New name for this goal…"
      : step === "askActivity"
        ? "…or type your own (e.g. read manga 30 min weekdays)"
        : step === "confirm"
          ? "…or type a change (e.g. remove tuesday)"
          : "…or type it your way";

  const stageChildren = showPicker ? (
    <BuddyPicker
      current={character}
      mode={mode}
      onPick={(picked) => {
        setCharacter(picked);
        setShowPicker(false);
      }}
      onModeChange={setMode}
    />
  ) : (
    <>
      {step === "home" && <ChoiceList choices={homeChoices} onChoose={handleChoice} disabled={busy} />}

      {step === "pickImport" && (
        <ChoiceList
          choices={[
            ...previousSprintGoals.map((goal) => ({
              id: `import:${goal.id}`,
              label: goal.title,
              hint: goal.sprintName,
            })),
            ...(previousSprintGoals.length > 1
              ? [{ id: "importAll", label: "All of them!" }]
              : []),
            { id: "backHome", label: "← Back" },
          ]}
          onChoose={handleChoice}
          disabled={busy}
        />
      )}

      {step === "pickCopy" && (
        <ChoiceList
          choices={[
            ...existingGoals.map((goal) => ({ id: `copy:${goal.id}`, label: goal.title })),
            { id: "backHome", label: "← Back" },
          ]}
          onChoose={handleChoice}
          disabled={busy}
        />
      )}

      {step === "pickRename" && (
        <ChoiceList
          choices={[
            ...existingGoals.map((goal) => ({ id: `rename:${goal.id}`, label: goal.title })),
            { id: "backHome", label: "← Back" },
          ]}
          onChoose={handleChoice}
          disabled={busy}
        />
      )}

      {step === "askActivity" && (
        <SuggestionBubbles
          label="Pick one, or type below"
          suggestions={activitySuggestions}
          onPick={handleActivityPick}
          disabled={busy}
        />
      )}

      {step === "askDuration" && (
        <SuggestionBubbles suggestions={DURATION_BUBBLES} onPick={handleDurationPick} disabled={busy} />
      )}

      {step === "askSchedule" && (
        <SuggestionBubbles suggestions={SCHEDULE_BUBBLES} onPick={handleSchedulePick} disabled={busy} />
      )}

      {step === "confirm" && (
        <>
          <GoalRecapCard draft={draft} />
          <ChoiceList
            choices={[
              { id: "lockIn", label: "Lock it in!" },
              { id: "changeDays", label: "Change the days" },
              { id: "changeTime", label: "Change the time" },
              { id: "changeActivity", label: "Different activity" },
            ]}
            onChoose={handleChoice}
            disabled={busy}
          />
        </>
      )}

      {step === "created" && (
        <ChoiceList
          choices={[
            { id: "anotherGoal", label: "Another goal!" },
            { id: "allDone", label: "All done — back to my week" },
          ]}
          onChoose={handleChoice}
          disabled={busy}
        />
      )}

      {showInput && (
        <div className={styles.inputRow}>
          <input
            className={styles.input}
            value={inputValue}
            placeholder={inputPlaceholder}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSubmit();
            }}
            disabled={busy}
          />
          <button
            type="button"
            className={styles.sendBtn}
            onClick={handleSubmit}
            disabled={busy || !inputValue.trim()}
            aria-label="Send"
          >
            <Send size={15} />
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={styles.container}>
      <BuddyBlob
        character={character}
        hidden={expanded}
        onClick={onToggle}
        ariaLabel={character ? `Talk to ${character}` : "Meet your buddy"}
      >
        {!expanded && bark && character && (
          <BuddyBark character={character} message={bark} onDismiss={() => setBark(null)} />
        )}
      </BuddyBlob>

      <DialogueStage
        character={showPicker ? null : character}
        open={expanded}
        onClose={onClose}
        line={showPicker ? null : line}
        ghostLine={showPicker ? null : ghost}
        mode={mode}
        onModeToggle={() => setMode(mode === "quick" ? "talkative" : "quick")}
        onNameplateClick={() => setShowPicker((value) => !value)}
        onLineDone={handleLineDone}
        data-testid="planner-buddy-stage"
      >
        {stageChildren}
      </DialogueStage>
    </div>
  );
}
