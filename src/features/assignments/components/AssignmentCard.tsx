import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  ASSIGNMENT_COPY,
  deriveAssignmentPhase,
  type AssignmentPhase,
} from "@/shared/lib/assignment";
import { cn } from "@/shared/lib/utils";

interface AssignmentCardProps {
  token: string;
  userId: Id<"users">;
  majorObjectiveId: Id<"majorObjectives">;
  /** compact = inside the deep-work drawer; full = the assignment page */
  variant?: "compact" | "full";
  /** Link target for "open the full assignment" (compact variant) */
  assignmentHref?: string;
  className?: string;
}

/**
 * The one card that tells a student where an assignment stands and what to
 * do next. Fetches its own state and owns the "Mark as done" action.
 */
export function AssignmentCard({
  token,
  userId,
  majorObjectiveId,
  variant = "compact",
  assignmentHref,
  className,
}: AssignmentCardProps) {
  const state = useQuery(api.assignments.getAssignmentState, {
    token,
    userId,
    majorObjectiveId,
  }) as any;
  const submitWork = useMutation(api.assignments.submitWork);

  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (state === undefined) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-2xl border border-[var(--color-divider)] bg-white/50 p-4",
          className
        )}
      >
        <div className="h-4 w-2/3 rounded bg-black/5" />
        <div className="mt-3 h-3 w-full rounded bg-black/5" />
      </div>
    );
  }
  if (!state) return null;

  const phase: AssignmentPhase = deriveAssignmentPhase(state);
  const copy = ASSIGNMENT_COPY[phase];
  const { work } = state;
  const progressPercent =
    work.totalSubObjectives > 0
      ? Math.round((work.completedSubObjectives / work.totalSubObjectives) * 100)
      : 100;

  const handleMarkDone = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitWork({
        token,
        studentMajorObjectiveId: state.studentMajorObjectiveId,
        notes: note.trim() || undefined,
      });
      setNote("");
      setShowNote(false);
    } catch (err: any) {
      setError(err?.message?.replace(/^.*Uncaught Error:\s*/, "") || "Could not mark as done.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        copy.accent,
        variant === "full" && "p-6",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-70">
        {copy.label}
      </p>
      <p className={cn("mt-1 font-display italic", variant === "full" ? "text-2xl" : "text-lg")}>
        {copy.title}
      </p>
      <p className="mt-1.5 text-sm leading-6 opacity-80">{copy.body}</p>

      {/* Work progress */}
      {work.totalSubObjectives > 0 && phase !== "approved" && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between text-xs opacity-70">
            <span>
              {work.completedSubObjectives}/{work.totalSubObjectives} parts finished
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-current opacity-60 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Coach note on reject/approve */}
      {state.confirmationNotes && (phase === "rejected" || phase === "approved") && (
        <div className="mt-4 rounded-xl bg-white/60 p-3 text-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-60">
            Coach note
          </p>
          <p className="mt-1 whitespace-pre-wrap">{state.confirmationNotes}</p>
        </div>
      )}

      {/* Mark as done */}
      {(phase === "ready" || phase === "rejected") && (
        <div className="mt-4 space-y-2">
          {showNote && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything your coach should know? (optional)"
              className="min-h-[70px] w-full rounded-xl border border-black/10 bg-white/80 p-3 text-sm outline-none focus:border-black/30"
            />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={handleMarkDone}
              className="rounded-full bg-[var(--color-espresso)] px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-black disabled:opacity-50"
            >
              {phase === "rejected" ? "Mark done again" : "Mark as done"}
            </button>
            {!showNote && (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="text-xs underline-offset-2 opacity-70 hover:underline"
              >
                add a note
              </button>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}

      {variant === "compact" && assignmentHref && (
        <div className="mt-4">
          <Link
            to={assignmentHref}
            className="text-xs font-semibold uppercase tracking-[0.1em] underline-offset-4 opacity-70 hover:underline"
          >
            Open assignment →
          </Link>
        </div>
      )}
    </div>
  );
}

export default AssignmentCard;
