import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AssignmentCard } from "@/features/assignments/components/AssignmentCard";
import { cn } from "@/shared/lib/utils";

/**
 * One assignment, one calm page: what the unit is, the parts to work
 * through (with links), and the mark-done → coach-confirm status.
 * Lives at /deep-work/mastery/:majorObjectiveId (path kept for old links).
 */
export function AssignmentPage() {
  const { majorObjectiveId } = useParams<{ majorObjectiveId: string }>();
  const { user, token } = useAuth();

  const state = useQuery(
    api.assignments.getAssignmentState,
    user && token && majorObjectiveId
      ? { token, userId: user._id as any, majorObjectiveId: majorObjectiveId as any }
      : "skip"
  ) as any;

  const domainData = useQuery(
    api.objectives.getAssignedByDomain,
    user && token && state?.domain?._id
      ? { token, userId: user._id as any, domainId: state.domain._id }
      : "skip"
  ) as any[] | undefined;

  const toggleActivity = useMutation(api.progress.toggleActivity);
  const [optimisticToggles, setOptimisticToggles] = useState<Record<string, boolean>>({});

  const unit = useMemo(
    () =>
      (domainData ?? []).find(
        (entry: any) => entry.majorObjective?._id === majorObjectiveId
      ) ?? null,
    [domainData, majorObjectiveId]
  );

  if (!majorObjectiveId) {
    return <Navigate to="/deep-work" replace />;
  }

  if (!user || state === undefined) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <span
          aria-hidden
          className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-divider)] border-t-[var(--color-espresso)]"
        />
        <span className="font-display text-lg italic text-[var(--color-taupe)]">
          Opening your assignment…
        </span>
      </div>
    );
  }

  if (!state) {
    return <Navigate to="/deep-work" replace />;
  }

  const handleToggle = (
    activityId: Id<"activities">,
    studentObjectiveId: Id<"studentObjectives">,
    current: boolean
  ) => {
    if (!token) return;
    setOptimisticToggles((prev) => ({ ...prev, [activityId]: !current }));
    toggleActivity({
      token,
      userId: user._id as any,
      activityId,
      studentObjectiveId,
    }).then(() =>
      setOptimisticToggles((prev) => {
        const next = { ...prev };
        delete next[activityId];
        return next;
      })
    );
  };

  const isDone = (activityId: string, server: boolean) =>
    activityId in optimisticToggles ? optimisticToggles[activityId] : server;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-taupe)]">
          Assignment · {state.domain?.name}
        </p>
        <h1 className="mt-2">{state.majorObjective.title}</h1>
        {state.majorObjective.description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-taupe)]">
            {state.majorObjective.description}
          </p>
        )}
      </div>

      <AssignmentCard
        token={token!}
        userId={user._id as any}
        majorObjectiveId={majorObjectiveId as any}
        variant="full"
      />

      {/* The parts */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl italic text-[var(--color-espresso)]">
          The work
        </h2>
        {unit === null && domainData === undefined ? (
          <p className="text-sm text-[var(--color-taupe)]">Loading the parts…</p>
        ) : !unit || unit.subObjectives.length === 0 ? (
          <p className="text-sm text-[var(--color-taupe)]">
            No parts are attached to this assignment yet — check with your coach.
          </p>
        ) : (
          <div className="space-y-3">
            {unit.subObjectives.map((sub: any) => {
              const activities = [...(sub.activities ?? [])].sort(
                (a: any, b: any) => a.order - b.order
              );
              const subComplete =
                activities.length === 0 ||
                activities.every((a: any) => isDone(a._id, a.progress?.completed ?? false));
              return (
                <div
                  key={sub._id}
                  className="rounded-2xl border border-[var(--color-divider)] bg-white/70 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--color-espresso)]">
                        {sub.objective.title}
                      </p>
                      {sub.objective.description && (
                        <p className="mt-0.5 text-sm text-[var(--color-taupe)]">
                          {sub.objective.description}
                        </p>
                      )}
                    </div>
                    {subComplete && (
                      <span className="shrink-0 rounded-full bg-[var(--color-ss-sage)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-espresso)]">
                        Done
                      </span>
                    )}
                  </div>
                  {activities.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {activities.map((activity: any) => {
                        const done = isDone(activity._id, activity.progress?.completed ?? false);
                        return (
                          <li key={activity._id} className="flex items-center gap-3">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={done}
                              aria-label={`Mark ${activity.title} as ${done ? "not done" : "done"}`}
                              onClick={() => handleToggle(activity._id, sub._id, done)}
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                                done
                                  ? "border-[var(--color-espresso)] bg-[var(--color-espresso)] text-white"
                                  : "border-[var(--color-divider)] bg-white hover:border-[var(--color-taupe)]"
                              )}
                            >
                              {done && <span className="text-[11px] leading-none">✓</span>}
                            </button>
                            <a
                              href={activity.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "text-sm underline-offset-4 hover:underline",
                                done
                                  ? "text-[var(--color-taupe)] line-through"
                                  : "text-[var(--color-espresso)]"
                              )}
                            >
                              {activity.title}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div>
        <Link
          to={state.domain?._id ? `/deep-work/${state.domain._id}` : "/deep-work"}
          className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-taupe)] underline-offset-4 hover:underline"
        >
          ← Back to {state.domain?.name ?? "subjects"}
        </Link>
      </div>
    </div>
  );
}

export default AssignmentPage;
