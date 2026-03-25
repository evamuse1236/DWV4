import { Link } from "react-router-dom";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { getMasteryCopy, getVivaStatusLabel, type MasteryState } from "@/shared/lib/mastery";

interface MasteryStatusCardProps {
  state: MasteryState;
  variant?: "compact" | "full";
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  masteryHref?: string;
  className?: string;
}

function formatWhen(value?: number) {
  if (!value) return null;
  return new Date(value).toLocaleString();
}

export function MasteryStatusCard({
  state,
  variant = "compact",
  primaryAction,
  secondaryAction,
  masteryHref,
  className,
}: MasteryStatusCardProps) {
  const copy = getMasteryCopy(state);
  const progress = state.readiness.totalSubObjectives
    ? Math.round((state.readiness.completedSubObjectives / state.readiness.totalSubObjectives) * 100)
    : 0;
  const latestAttempt = state.latestAttempt;
  const coachNote =
    state.majorAssignment?.vivaDecisionNotes ?? state.retake.latestDecision?.decisionNotes ?? "";
  const unlockExpiry = state.retake.activeUnlock?.expiresAt;

  return (
    <Card className={cn("border-black/10 bg-white/80 shadow-none", className)}>
      <CardContent className={cn("space-y-5", variant === "compact" ? "p-4" : "p-6")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-black/10 bg-black/[0.03] text-[#5f5a53]">
                {copy.label}
              </Badge>
              {state.majorAssignment?.vivaStatus &&
              state.majorAssignment.vivaStatus !== "not_requested" ? (
                <Badge variant="secondary" className="bg-violet-100 text-violet-800 hover:bg-violet-100">
                  {getVivaStatusLabel(state.majorAssignment.vivaStatus)}
                </Badge>
              ) : null}
            </div>
            <div>
              <h2 className={cn("font-serif text-balance text-[#1f1a17]", variant === "compact" ? "text-xl" : "text-3xl")}>
                {copy.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6c655c]">{copy.body}</p>
            </div>
          </div>
          {masteryHref ? (
            <Button asChild variant="outline" className="border-black/10 bg-white/80">
              <Link to={masteryHref}>Open mastery</Link>
            </Button>
          ) : null}
        </div>

        <div className={cn("rounded-2xl border px-4 py-4", copy.accent)}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Readiness</p>
              <p className="mt-1 text-sm">
                {state.readiness.completedSubObjectives}/{state.readiness.totalSubObjectives} learning steps complete
              </p>
            </div>
            <div className="min-w-[160px]">
              <div className="h-2 overflow-hidden rounded-full bg-black/10">
                <div className="h-full rounded-full bg-current transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-right text-xs">{progress}% ready</p>
            </div>
          </div>
        </div>

        {latestAttempt ? (
          <div className="grid gap-3 rounded-2xl border border-black/10 bg-[#f7f3ee] p-4 text-sm text-[#4d453d] md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8178]">
                Latest diagnostic
              </p>
              <p className="font-medium text-[#1f1a17]">{latestAttempt.diagnosticModuleName || "Mastery attempt"}</p>
              <p>
                {latestAttempt.score}/{latestAttempt.questionCount}
                {typeof latestAttempt.scorePercent === "number"
                  ? ` • ${Math.round(latestAttempt.scorePercent)}%`
                  : ""}
                {latestAttempt.passed ? " • Passed" : " • Not passed"}
              </p>
            </div>
            <div className="space-y-1">
              {latestAttempt.submittedAt ? <p>Submitted {formatWhen(latestAttempt.submittedAt)}</p> : null}
              {typeof latestAttempt.durationMs === "number" ? (
                <p>Time {Math.round(latestAttempt.durationMs / 1000)}s</p>
              ) : null}
              {unlockExpiry ? <p>Retake window ends {formatWhen(unlockExpiry)}</p> : null}
            </div>
          </div>
        ) : null}

        {coachNote ? (
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a8178]">Coach note</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4d453d]">{coachNote}</p>
          </div>
        ) : null}

        {(primaryAction || secondaryAction) && (
          <div className="flex flex-wrap items-center gap-3">
            {primaryAction}
            {secondaryAction}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MasteryStatusCard;
