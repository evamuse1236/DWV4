import { useMutation } from "convex/react";
import {
  Books,
  Play,
  PencilLine,
  BookOpen,
  FolderOpen,
  GameController,
  Circle,
} from "@phosphor-icons/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getDomainConfig } from "../../lib/skill-tree-utils";
import { cn } from "../../lib/utils";
import styles from "./skill-tree.module.css";

/**
 * Icon components mapped by activity type
 */
const activityIcons: Record<string, typeof Circle> = {
  video: Play,
  exercise: PencilLine,
  reading: BookOpen,
  project: FolderOpen,
  game: GameController,
  default: Circle,
};

interface Activity {
  _id: Id<"activities">;
  title: string;
  url: string;
  type: string;
  order: number;
  progress?: {
    completed: boolean;
  };
}

interface SelectedObjective {
  _id: Id<"studentObjectives">;
  objectiveId: Id<"learningObjectives">;
  status: string;
  objective: {
    _id: Id<"learningObjectives">;
    title: string;
    description: string;
    difficulty: string;
  };
  activities: Activity[];
}

interface DetailsPanelProps {
  userId: Id<"users">;
  domainName: string | null;
  selectedObjective: SelectedObjective | null;
  onVivaRequested?: () => void;
}

/**
 * DetailsPanel - Right sidebar showing selected skill details
 *
 * Shows:
 * - Welcome message when no skill selected
 * - Skill title, description, icon when selected
 * - Activity checklist with completion tracking
 * - Viva request button (enabled when all activities done)
 */
export function DetailsPanel({
  userId,
  domainName,
  selectedObjective,
  onVivaRequested,
}: DetailsPanelProps) {
  const toggleActivity = useMutation(api.progress.toggleActivity);
  const updateStatus = useMutation(api.objectives.updateStatus);

  // Get domain config for colors
  const domainConfig = domainName ? getDomainConfig(domainName) : null;

  // Check if all activities are completed
  const allActivitiesCompleted = selectedObjective?.activities.every(
    a => a.progress?.completed
  ) ?? false;

  // Check if viva already requested
  const vivaRequested = selectedObjective?.status === "viva_requested";
  const mastered = selectedObjective?.status === "mastered";

  // Handle activity toggle
  const handleToggleActivity = async (activityId: Id<"activities">) => {
    if (!selectedObjective) return;

    await toggleActivity({
      userId,
      activityId,
      studentObjectiveId: selectedObjective._id,
    });
  };

  // Handle viva request
  const handleVivaRequest = async () => {
    if (!selectedObjective || !allActivitiesCompleted) return;

    await updateStatus({
      studentObjectiveId: selectedObjective._id,
      status: "viva_requested",
    });

    onVivaRequested?.();
  };

  // Handle keyboard for checkboxes
  const handleCheckboxKeyDown = (
    e: React.KeyboardEvent,
    activityId: Id<"activities">
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggleActivity(activityId);
    }
  };

  // Default welcome state
  if (!selectedObjective) {
    return (
      <aside className={styles['details-panel']}>
        <div className={styles['panel-header']}>NeoSchool Curriculum</div>
        <div
          className={styles['mood-large-icon']}
          style={{ background: "#f3f4f6" }}
        >
          <Books size={32} weight="regular" />
        </div>
        <h1 className={styles['mood-title']}>Welcome</h1>
        <p className={styles['mood-manifest']}>
          Select a subject to begin your learning journey.
        </p>
      </aside>
    );
  }

  const { objective, activities } = selectedObjective;

  // Get icon based on first activity type or default
  const firstActivityType = activities[0]?.type || "default";
  const IconComponent = activityIcons[firstActivityType] || activityIcons.default;

  return (
    <aside className={styles['details-panel']}>
      <div className={styles['panel-header']}>NeoSchool Curriculum</div>

      {/* Skill Icon */}
      <div
        className={styles['mood-large-icon']}
        style={{ background: domainConfig?.color || "#f3f4f6" }}
      >
        <IconComponent size={32} weight="regular" />
      </div>

      {/* Skill Title & Description */}
      <h1 className={styles['mood-title']}>{objective.title}</h1>
      <p className={styles['mood-manifest']}>{objective.description}</p>

      {/* Activity Checklist */}
      {activities.length > 0 && (
        <ul className={styles['task-list']}>
          {activities
            .sort((a, b) => a.order - b.order)
            .map(activity => {
              const isCompleted = activity.progress?.completed ?? false;
              const ActivityIcon =
                activityIcons[activity.type] || activityIcons.default;

              return (
                <li key={activity._id} className={styles['task-item']}>
                  <div
                    className={cn(styles['task-checkbox'], isCompleted && styles.checked)}
                    onClick={() => handleToggleActivity(activity._id)}
                    onKeyDown={e => handleCheckboxKeyDown(e, activity._id)}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={isCompleted}
                    aria-label={`Mark ${activity.title} as ${isCompleted ? "incomplete" : "complete"}`}
                  />
                  <a
                    href={activity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles['task-link']}
                  >
                    <span className="mr-2 opacity-50">
                      <ActivityIcon size={16} weight="regular" className="inline" />
                    </span>
                    {activity.title}
                  </a>
                </li>
              );
            })}
        </ul>
      )}

      {/* Viva Button */}
      {!mastered && (
        <button
          className={cn(styles['viva-btn'], allActivitiesCompleted && styles.active, vivaRequested && styles.requested)}
          onClick={handleVivaRequest}
          disabled={!allActivitiesCompleted || vivaRequested}
        >
          {vivaRequested ? "Viva Requested!" : "Request for Viva"}
        </button>
      )}

      {mastered && (
        <div className="text-center py-4 text-green-600 font-medium">
          Mastered!
        </div>
      )}
    </aside>
  );
}

export default DetailsPanel;
