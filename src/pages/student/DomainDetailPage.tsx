import { useState } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { getDomainIcon, getDomainColorClass } from "../../lib/domain-utils";
import {
  getObjectiveStatusClass,
  objectiveStatusLabels,
  type ObjectiveStatus,
} from "../../lib/status-utils";

// Check if a string looks like a valid Convex ID (they're typically 20+ chars)
const isValidConvexId = (id: string | undefined): boolean => {
  if (!id) return false;
  // Convex IDs are typically alphanumeric and longer than simple slugs
  return id.length >= 15 && /^[a-zA-Z0-9_-]+$/.test(id);
};

// Activity type icons
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

/**
 * Domain Detail Page - Paper UI Design
 * Shows learning objectives with expandable activities
 */
export function DomainDetailPage() {
  const { domainId } = useParams<{ domainId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);

  // Check if domainId looks like a valid Convex ID before querying
  const validDomainId = isValidConvexId(domainId);

  // Get domain info - only query if ID looks valid
  const domain = useQuery(
    api.domains.getById,
    validDomainId ? { domainId: domainId as any } : "skip"
  );

  // Get student's assigned objectives for this domain
  const assignedObjectives = useQuery(
    api.objectives.getAssignedByDomain,
    user && validDomainId
      ? { userId: user._id as any, domainId: domainId as any }
      : "skip"
  );

  // Redirect if domainId is invalid (like a slug "coding" instead of a Convex ID)
  if (!validDomainId) {
    return <Navigate to="/deep-work" replace />;
  }

  // Mutations
  const toggleActivity = useMutation(api.progress.toggleActivity);
  const updateObjectiveStatus = useMutation(api.objectives.updateStatus);

  const handleActivityToggle = async (activityId: string, studentObjectiveId: string) => {
    if (!user) return;
    await toggleActivity({
      userId: user._id as any,
      activityId: activityId as any,
      studentObjectiveId: studentObjectiveId as any,
    });
  };

  const handleRequestViva = async (studentObjectiveId: string) => {
    await updateObjectiveStatus({
      studentObjectiveId: studentObjectiveId as any,
      status: "viva_requested",
    });
  };



  // Get activity icon
  const getActivityIcon = (type: string) => {
    const key = type.toLowerCase();
    if (key.includes("video") || key.includes("watch")) return ActivityIcons.video;
    if (key.includes("practice") || key.includes("exercise")) return ActivityIcons.practice;
    if (key.includes("quiz") || key.includes("test")) return ActivityIcons.quiz;
    if (key.includes("read")) return ActivityIcons.reading;
    return ActivityIcons.practice;
  };

  // Loading state
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

  // Calculate progress
  const completedObjectives = assignedObjectives?.filter(
    (obj: any) => obj.status === "mastered"
  ).length || 0;
  const totalObjectives = assignedObjectives?.length || 0;

  return (
    <div>
      {/* Back button */}
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

      {/* Domain Header */}
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
                <span className="font-display text-[40px] block leading-none">{completedObjectives}</span>
                <span className="text-[0.7rem] uppercase tracking-[0.15em] opacity-60">Mastered</span>
              </div>
              <div className="w-px h-10 bg-black/10" />
              <div>
                <span className="font-display text-[40px] block leading-none">{totalObjectives}</span>
                <span className="text-[0.7rem] uppercase tracking-[0.15em] opacity-60">Total</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Objectives Section */}
      <div className="fade-in-up delay-1">
        <div className="flex items-center justify-between mb-6">
          <div className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] font-body">
            My Learning Objectives
          </div>
          <span className="text-[0.75rem] uppercase tracking-[0.15em] text-[#888] font-body">
            {assignedObjectives?.length || 0} assigned
          </span>
        </div>

        {assignedObjectives && assignedObjectives.length > 0 ? (
          <div className="space-y-4">
            {assignedObjectives.map((item: any, index: number) => {
              const isExpanded = expandedObjective === item._id;
              const completedActivities = item.activities?.filter((a: any) => a.progress?.completed).length || 0;
              const totalActivities = item.activities?.length || 0;
              const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
              const canRequestViva = progress === 100 && item.status === "in_progress";

              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-white overflow-hidden"
                >
                  {/* Objective Header */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedObjective(isExpanded ? null : item._id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {/* Status badge */}
                          <span
                            className={`text-[10px] font-bold tracking-[0.1em] uppercase px-2 py-1 rounded-full ${getObjectiveStatusClass(item.status as ObjectiveStatus)}`}
                          >
                            {objectiveStatusLabels[item.status as ObjectiveStatus]}
                          </span>
                          {/* Difficulty badge */}
                          <span className="text-[10px] uppercase tracking-[0.1em] opacity-50">
                            {item.objective.difficulty}
                          </span>
                        </div>
                        <h3 className="font-display text-[24px] m-0">{item.objective.title}</h3>
                        {item.objective.description && (
                          <p className="font-body text-sm opacity-60 mt-2">
                            {item.objective.description}
                          </p>
                        )}
                      </div>
                      {/* Expand icon */}
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="opacity-40"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </motion.div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-[#15803d]/60 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-[10px] uppercase tracking-[0.1em] opacity-50">
                          {completedActivities}/{totalActivities} activities
                        </span>
                        {item.objective.estimatedHours && (
                          <span className="text-[10px] uppercase tracking-[0.1em] opacity-50">
                            ~{item.objective.estimatedHours}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Activities */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-black/5"
                      >
                        <div className="p-6 space-y-3">
                          {item.activities?.map((activity: any) => (
                            <motion.div
                              key={activity._id}
                              whileHover={{ x: 4 }}
                              className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                                activity.progress?.completed
                                  ? "bg-[#15803d]/5 opacity-60"
                                  : "bg-black/[0.02] hover:bg-black/[0.04]"
                              }`}
                            >
                              {/* Checkbox - only this toggles completion */}
                              <button
                                type="button"
                                onClick={() => handleActivityToggle(activity._id, item._id)}
                                className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${
                                  activity.progress?.completed
                                    ? "bg-[#15803d] border-[#15803d]"
                                    : "border-black/20 hover:border-black/40"
                                }`}
                                aria-label={activity.progress?.completed ? "Mark as incomplete" : "Mark as complete"}
                              >
                                {activity.progress?.completed && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>

                              {/* Activity icon */}
                              <div className="opacity-50">
                                {getActivityIcon(activity.type || "")}
                              </div>

                              {/* Activity info */}
                              <div className="flex-1">
                                <div className={`text-[15px] ${activity.progress?.completed ? "line-through" : ""}`}>
                                  {activity.title || activity.name}
                                </div>
                                {activity.type && (
                                  <div className="text-[10px] uppercase tracking-[0.05em] opacity-50 mt-1">
                                    {activity.type}
                                  </div>
                                )}
                              </div>

                              {/* External link if URL exists */}
                              {activity.url && (
                                <a
                                  href={activity.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="opacity-40 hover:opacity-100 transition-opacity p-2 -m-2"
                                  title="Open resource"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                </a>
                              )}
                            </motion.div>
                          ))}

                          {/* Request Viva Button */}
                          {canRequestViva && (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              onClick={() => handleRequestViva(item._id)}
                              className="w-full mt-4 btn btn-primary"
                            >
                              Request Viva
                            </motion.button>
                          )}

                          {item.status === "viva_requested" && (
                            <div className="mt-4 p-4 bg-[#7c3aed]/5 rounded-xl text-center">
                              <span className="text-[#7c3aed] font-display italic">
                                Waiting for your coach to schedule the viva...
                              </span>
                            </div>
                          )}

                          {item.status === "mastered" && (
                            <div className="mt-4 p-4 bg-[#15803d]/5 rounded-xl text-center">
                              <span className="text-[#15803d] font-display italic text-lg">
                                You've mastered this!
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-16 h-16 opacity-30 mb-6 mx-auto">
              {getDomainIcon(domain.name)}
            </div>
            <h3 className="font-display text-[2rem] italic mb-3">No Objectives Yet</h3>
            <p className="font-body opacity-60">
              Your coach will assign learning objectives for {domain.name} soon!
            </p>
            <p className="font-body text-sm opacity-40 mt-2">
              Check back later or ask your coach about what to learn next.
            </p>
          </div>
        )}
      </div>

      {/* Tips Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-8 mt-10 fade-in-up delay-2"
      >
        <h3 className="font-display text-[1.5rem] mb-5">Tips for Success</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#15803d]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#15803d]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-body text-sm">
                <strong>Complete activities in order</strong> — they build on each other
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#ca8a04]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#ca8a04]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              </svg>
            </div>
            <div>
              <p className="font-body text-sm">
                <strong>Take notes as you learn</strong> — you'll need them for the viva
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#7c3aed]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#7c3aed]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-body text-sm">
                <strong>Don't rush!</strong> Understanding is more important than speed
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-[#ec4899]/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-[#ec4899]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="font-body text-sm">
                <strong>Ask your coach</strong> if you get stuck on anything
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default DomainDetailPage;
