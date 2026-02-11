import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { getDomainIcon, getDomainColorClass } from "../../lib/domain-utils";
import {
  getObjectiveStatusClass,
  objectiveStatusLabels,
  getSubObjectiveStatusClass,
  subObjectiveStatusLabels,
  type ObjectiveStatus,
  type SubObjectiveStatus,
} from "../../lib/status-utils";

const isValidConvexId = (id: string | undefined): boolean => {
  if (!id) return false;
  return id.length >= 15 && /^[a-zA-Z0-9_-]+$/.test(id);
};

const ActivityIcons = {
  video: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
    </svg>
  ),
  practice: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  ),
  quiz: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  ),
  reading: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
};

function MajorDiagnosticActions({
  userId,
  majorObjectiveId,
  studentMajorObjectiveId,
  majorStatus,
  majorReady: _majorReady,
}: {
  userId: string;
  majorObjectiveId: string;
  studentMajorObjectiveId: string;
  majorStatus: ObjectiveStatus;
  majorReady: boolean;
}) {
  const navigate = useNavigate();
  const requestUnlock = useMutation(api.diagnostics.requestUnlock);
  const updateMajorStatus = useMutation(api.objectives.updateStatus);
  const unlockState = useQuery(api.diagnostics.getUnlockState, {
    userId: userId as any,
    majorObjectiveId: majorObjectiveId as any,
  });

  const hasFailedDiagnostic = Boolean(
    unlockState?.latestAttempt && unlockState.latestAttempt.passed === false
  );
  const hasActiveUnlock = Boolean(unlockState?.activeUnlock);
  const hasPendingUnlockRequest = Boolean(unlockState?.pendingRequest);

  const vivaRequested = majorStatus === "viva_requested";
  const mastered = majorStatus === "mastered";

  if (mastered) {
    return (
      <div className="text-xs text-[#15803d] bg-[#15803d]/10 px-3 py-2 rounded-full">
        Mastered
      </div>
    );
  }

  if (hasFailedDiagnostic) {
    if (!vivaRequested) {
      return (
        <button
          type="button"
          onClick={() =>
            updateMajorStatus({
              studentMajorObjectiveId: studentMajorObjectiveId as any,
              status: "viva_requested",
            })
          }
          className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.1em] transition-colors bg-black text-white"
        >
          Request Viva
        </button>
      );
    }

    if (hasActiveUnlock) {
      return (
        <button
          type="button"
          onClick={() =>
            navigate(`/deep-work/diagnostic/${majorObjectiveId}?type=mastery`)
          }
          className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.1em] transition-colors bg-black text-white"
        >
          Start Diagnostic
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() =>
          requestUnlock({
            userId: userId as any,
            majorObjectiveId: majorObjectiveId as any,
          })
        }
        disabled={hasPendingUnlockRequest}
        className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.1em] transition-colors ${
          hasPendingUnlockRequest ? "bg-black/5 text-[#888]" : "bg-black text-white"
        }`}
      >
        {hasPendingUnlockRequest ? "Diagnostic Requested" : "Request Diagnostic"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => navigate(`/deep-work/diagnostic/${majorObjectiveId}?type=mastery`)}
      className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.1em] transition-colors bg-black text-white"
    >
      Start Diagnostic
    </button>
  );
}

export function DomainDetailPage() {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedSubObjective, setExpandedSubObjective] = useState<string | null>(null);

  const validDomainId = isValidConvexId(domainId);

  const domain = useQuery(
    api.domains.getById,
    validDomainId ? { domainId: domainId as any } : "skip"
  );

  const assignedMajors = useQuery(
    api.objectives.getAssignedByDomain,
    user && validDomainId
      ? { userId: user._id as any, domainId: domainId as any }
      : "skip"
  );

  if (!validDomainId) {
    return <Navigate to="/deep-work" replace />;
  }

  const toggleActivity = useMutation(api.progress.toggleActivity);

  const handleActivityToggle = async (activityId: string, studentObjectiveId: string) => {
    if (!user) return;
    await toggleActivity({
      userId: user._id as any,
      activityId: activityId as any,
      studentObjectiveId: studentObjectiveId as any,
    });
  };

  // Viva is now requested only after a failed diagnostic attempt.

  const getActivityIcon = (type: string) => {
    const key = type.toLowerCase();
    if (key.includes("video") || key.includes("watch")) return ActivityIcons.video;
    if (key.includes("practice") || key.includes("exercise")) return ActivityIcons.practice;
    if (key.includes("quiz") || key.includes("test")) return ActivityIcons.quiz;
    if (key.includes("read")) return ActivityIcons.reading;
    return ActivityIcons.practice;
  };

  if (!domain) {
    return (
      <div>
        <div className="text-center mb-10 fade-in-up">
          <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] block mb-3 font-body">
            Loading
          </span>
          <h1 className="text-[3rem] m-0 leading-none">Please wait...</h1>
        </div>
        <div className="glass-card p-10 text-center">
          <div className="animate-pulse text-[#888]">Loading domain...</div>
        </div>
      </div>
    );
  }

  const colorClass = getDomainColorClass(domain.name);

  const completedMajors = assignedMajors?.filter(
    (major: any) => major.assignment?.status === "mastered"
  ).length || 0;
  const totalMajors = assignedMajors?.length || 0;

  return (
    <div>
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate("/deep-work")}
        className="mb-8 flex items-center gap-2 text-[#888] hover:text-[#1a1a1a] transition-colors font-body text-sm uppercase tracking-wider"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Deep Work
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`pastel-card ${colorClass} p-10 mb-10`}
      >
        <div className="flex items-start gap-8">
          <div className="w-16 h-16 opacity-40">
            {getDomainIcon(domain.name)}
          </div>
          <div className="flex-1">
            <h1 className="text-[3.5rem] m-0 leading-none mb-3">{domain.name}</h1>
            <p className="font-body opacity-70 text-lg">{domain.description}</p>
            <div className="mt-6 flex items-center gap-6">
              <div>
                <span className="font-display text-[40px] block leading-none">{completedMajors}</span>
                <span className="text-[0.7rem] uppercase tracking-[0.15em] opacity-60">Mastered</span>
              </div>
              <div className="w-px h-10 bg-black/10" />
              <div>
                <span className="font-display text-[40px] block leading-none">{totalMajors}</span>
                <span className="text-[0.7rem] uppercase tracking-[0.15em] opacity-60">Total</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="fade-in-up delay-1">
        <div className="flex items-center justify-between mb-6">
          <div className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] font-body">
            Major Objectives
          </div>
          <span className="text-[0.75rem] uppercase tracking-[0.15em] text-[#888] font-body">
            {assignedMajors?.length || 0} assigned
          </span>
        </div>

        {assignedMajors && assignedMajors.length > 0 ? (
          <div className="space-y-6">
            {assignedMajors.map((major: any, index: number) => {
              const majorStatus = (major.assignment?.status || "assigned") as ObjectiveStatus;
              const completedSubs = major.subObjectives.filter((sub: any) =>
                sub.activities.length === 0
                  ? true
                  : sub.activities.every((activity: any) => activity.progress?.completed)
              ).length;
              const totalSubs = major.subObjectives.length;
              const majorReady = totalSubs > 0 && completedSubs === totalSubs;

              return (
                <motion.div
                  key={major.majorObjective._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-white overflow-hidden"
                >
                  <div className="p-6 border-b border-black/5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-1 rounded-full ${getObjectiveStatusClass(majorStatus)}`}
                          >
                            {objectiveStatusLabels[majorStatus]}
                          </span>
                          {major.majorObjective.difficulty && (
                            <span className="text-[10px] uppercase tracking-[0.1em] opacity-50">
                              {major.majorObjective.difficulty}
                            </span>
                          )}
                          <span className="text-[10px] uppercase tracking-[0.1em] opacity-50">
                            {completedSubs}/{totalSubs} completed
                          </span>
                        </div>
                        <h3 className="font-display text-[24px] m-0">{major.majorObjective.title}</h3>
                        {major.majorObjective.description && (
                          <p className="font-body opacity-60 mt-2">
                            {major.majorObjective.description}
                          </p>
                        )}
                      </div>
                      {major.assignment && user && (
                        <div className="flex items-center gap-2">
                          <MajorDiagnosticActions
                            userId={user._id as any}
                            majorObjectiveId={major.majorObjective._id}
                            studentMajorObjectiveId={major.assignment._id}
                            majorStatus={majorStatus}
                            majorReady={majorReady}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-black/5">
                    {major.subObjectives.map((sub: any) => {
                      const subStatus = (sub.activities.length === 0 ||
                        sub.activities.every((activity: any) => activity.progress?.completed)
                        ? "completed"
                        : sub.status) as SubObjectiveStatus;
                      const isExpanded = expandedSubObjective === sub._id;
                      const completedActivities = sub.activities?.filter((a: any) => a.progress?.completed).length || 0;
                      const totalActivities = sub.activities?.length || 0;
                      const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

                      return (
                        <div key={sub._id} className="p-6">
                          <div
                            className="flex items-start justify-between gap-4 cursor-pointer"
                            onClick={() => setExpandedSubObjective(isExpanded ? null : sub._id)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span
                                  className={`text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-1 rounded-full ${getSubObjectiveStatusClass(subStatus)}`}
                                >
                                  {subObjectiveStatusLabels[subStatus]}
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.1em] opacity-50">
                                  {sub.objective.difficulty}
                                </span>
                                {totalActivities > 0 && (
                                  <span className="text-[10px] uppercase tracking-[0.1em] opacity-50">
                                    {completedActivities}/{totalActivities} activities
                                  </span>
                                )}
                              </div>
                              <h4 className="font-display text-[20px] m-0">{sub.objective.title}</h4>
                              {sub.objective.description && (
                                <p className="font-body opacity-60 mt-2">
                                  {sub.objective.description}
                                </p>
                              )}
                            </div>
                            <div className="text-sm text-[#888]">
                              {isExpanded ? "−" : "+"}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4">
                              {totalActivities > 0 && (
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-[#888]">
                                      {completedActivities} of {totalActivities} complete
                                    </span>
                                    <span className="text-[#111]">{Math.round(progress)}%</span>
                                  </div>
                                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-black/70 rounded-full transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="space-y-2">
                                {sub.activities?.map((activity: any) => (
                                  <div
                                    key={activity._id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-black/5 hover:bg-black/10 transition-colors"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleActivityToggle(activity._id, sub._id);
                                      }}
                                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                        activity.progress?.completed
                                          ? "bg-black border-black text-white"
                                          : "border-black/20"
                                      }`}
                                    >
                                      {activity.progress?.completed && (
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      )}
                                    </button>

                                    <span className="text-lg">{getActivityIcon(activity.type)}</span>

                                    <div className="flex-1 min-w-0">
                                      <a
                                        href={activity.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className={`text-sm font-medium hover:text-black ${
                                          activity.progress?.completed
                                            ? "line-through text-[#999]"
                                            : "text-[#111]"
                                        }`}
                                      >
                                        {activity.title}
                                      </a>
                                    </div>

                                    <a
                                      href={activity.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-xs text-[#111]"
                                    >
                                      Open →
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <h3 className="font-display text-[2rem] italic mb-3">No Objectives Yet</h3>
            <p className="font-body opacity-60">
              Your coach will assign learning objectives for {domain.name} soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DomainDetailPage;
