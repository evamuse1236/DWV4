import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Badge, ProgressBar, Button } from "../paper";
import {
  objectiveStatusConfig,
  difficultyConfig,
  type ObjectiveStatus,
  type Difficulty,
} from "../../lib/status-utils";

interface Activity {
  _id: string;
  title: string;
  type: "video" | "exercise" | "reading" | "project" | "game";
  url: string;
  platform?: string;
  progress?: {
    completed: boolean;
  };
}

interface LearningObjectiveCardProps {
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedHours: number;
  status: ObjectiveStatus;
  activities: Activity[];
  onActivityToggle?: (activityId: string) => void;
  onRequestViva?: () => void;
}

const activityTypeIcons = {
  video: "🎬",
  exercise: "✏️",
  reading: "📖",
  project: "🔧",
  game: "🎮",
};

/**
 * Card displaying a learning objective with activities
 */
export function LearningObjectiveCard({
  title,
  description,
  difficulty,
  estimatedHours,
  status,
  activities,
  onActivityToggle,
  onRequestViva,
}: LearningObjectiveCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedActivities = activities.filter((a) => a.progress?.completed).length;
  const progress = activities.length > 0
    ? (completedActivities / activities.length) * 100
    : 0;
  const allActivitiesComplete = activities.length > 0 && completedActivities === activities.length;
  const canRequestViva = allActivitiesComplete && status === "in_progress";

  const statusInfo = objectiveStatusConfig[status];
  const difficultyInfo = difficultyConfig[difficulty];

  return (
    <Card className={status === "mastered" ? "border-2 border-green-300 bg-green-50" : ""}>
      {/* Header */}
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xl">{statusInfo.emoji}</span>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <Badge variant={statusInfo.variant as any} size="sm">
                {statusInfo.label}
              </Badge>
            </div>

            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className={`px-2 py-0.5 rounded ${difficultyInfo.bg} ${difficultyInfo.color}`}>
                {difficultyInfo.label}
              </span>
              <span className="text-gray-500">~{estimatedHours}h</span>
              <span className="text-gray-500">
                {activities.length} activities
              </span>
            </div>

            {/* Progress bar */}
            {activities.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">
                    {completedActivities} of {activities.length} complete
                  </span>
                  <span className="text-primary-600">{Math.round(progress)}%</span>
                </div>
                <ProgressBar
                  value={progress}
                  size="sm"
                  variant={status === "mastered" ? "success" : "default"}
                />
              </div>
            )}
          </div>

          {/* Expand icon */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="pt-4 mt-4 border-t border-gray-100">
              {/* Activities list */}
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Activities Playlist
              </h4>
              <div className="space-y-2">
                {activities.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onActivityToggle?.(activity._id);
                      }}
                      disabled={status === "mastered"}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        activity.progress?.completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300 hover:border-primary-500"
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

                    <span className="text-lg">{activityTypeIcons[activity.type]}</span>

                    <div className="flex-1 min-w-0">
                      <a
                        href={activity.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`text-sm font-medium hover:text-primary-600 ${
                          activity.progress?.completed
                            ? "line-through text-gray-400"
                            : "text-gray-700"
                        }`}
                      >
                        {activity.title}
                      </a>
                      {activity.platform && (
                        <p className="text-xs text-gray-400">{activity.platform}</p>
                      )}
                    </div>

                    <a
                      href={activity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      Open →
                    </a>
                  </div>
                ))}
              </div>

              {/* Viva request button */}
              {status !== "mastered" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {canRequestViva ? (
                    <Button
                      variant="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestViva?.();
                      }}
                      className="w-full"
                    >
                      🎓 Request Viva (I'm Ready!)
                    </Button>
                  ) : status === "viva_requested" ? (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">
                        🙋 Viva requested! Your coach will review soon.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">
                        Complete all activities to request a viva
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Mastered celebration */}
              {status === "mastered" && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-4 pt-4 border-t border-green-200 text-center"
                >
                  <span className="text-4xl">🏆</span>
                  <p className="text-green-600 font-medium mt-2">
                    You've mastered this objective!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default LearningObjectiveCard;
