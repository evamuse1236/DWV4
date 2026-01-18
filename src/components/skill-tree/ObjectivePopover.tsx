import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "convex/react";
import {
  Play,
  PencilLine,
  BookOpen,
  FolderOpen,
  GameController,
  Circle,
  Check,
} from "@phosphor-icons/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { getDomainConfig } from "../../lib/skill-tree-utils";
import { cn } from "../../lib/utils";
import styles from "./skill-tree.module.css";

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

interface SubObjectiveNode {
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

interface MajorNode {
  majorObjective: {
    _id: Id<"majorObjectives">;
    title: string;
    description: string;
  };
  assignment: {
    _id: Id<"studentMajorObjectives">;
    status: string;
  } | null;
  subObjectives: SubObjectiveNode[];
}

interface SubNode {
  majorObjective: {
    _id: Id<"majorObjectives">;
    title: string;
    description: string;
  };
  subObjective: SubObjectiveNode;
  majorAssignment: {
    _id: Id<"studentMajorObjectives">;
    status: string;
  } | null;
  allSubObjectives: SubObjectiveNode[];
}

type SelectedNode =
  | { type: "major"; data: MajorNode }
  | { type: "sub"; data: SubNode };

interface ObjectivePopoverProps {
  userId: Id<"users">;
  domainName: string | null;
  selectedNode: SelectedNode | null;
  onVivaRequested?: () => void;
  onSelectSubObjective?: (subObjectiveId: string) => void;
}

// Min and max panel widths in pixels
const MIN_WIDTH = 280;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 360;

// Check if a sub-objective is completed (all activities done, or no activities)
function isSubObjectiveCompleted(sub: SubObjectiveNode): boolean {
  if (sub.activities.length === 0) return true;
  return sub.activities.every((activity) => activity.progress?.completed);
}

export function ObjectivePopover({
  userId,
  domainName,
  selectedNode,
  onVivaRequested,
  onSelectSubObjective,
}: ObjectivePopoverProps) {
  const toggleActivity = useMutation(api.progress.toggleActivity);
  const updateStatus = useMutation(api.objectives.updateStatus);

  // Panel width state for resizing
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  // Optimistic state: track activities being toggled (activityId -> optimistic completed state)
  const [optimisticToggles, setOptimisticToggles] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle resize drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Panel is on right side, handle on left edge
      // Width = distance from mouse to right edge of viewport
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, window.innerWidth - e.clientX - 24));
      setPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Don't render if no node selected
  if (!selectedNode) return null;

  const domainConfig = domainName ? getDomainConfig(domainName) : null;

  const handleToggleActivity = (
    activityId: Id<"activities">,
    studentObjectiveId: Id<"studentObjectives">,
    currentCompleted: boolean
  ) => {
    // Optimistically update UI immediately
    setOptimisticToggles((prev) => ({
      ...prev,
      [activityId]: !currentCompleted,
    }));

    // Fire mutation (don't await - let it sync in background)
    toggleActivity({
      userId,
      activityId,
      studentObjectiveId,
    }).then(() => {
      // Clear optimistic state once server confirms (data will be fresh)
      setOptimisticToggles((prev) => {
        const next = { ...prev };
        delete next[activityId];
        return next;
      });
    });
  };

  // Helper to get effective completed state (optimistic or server)
  const getActivityCompleted = (activityId: string, serverCompleted: boolean) => {
    if (activityId in optimisticToggles) {
      return optimisticToggles[activityId];
    }
    return serverCompleted;
  };

  const handleCheckboxKeyDown = (
    e: React.KeyboardEvent,
    activityId: Id<"activities">,
    studentObjectiveId: Id<"studentObjectives">,
    currentCompleted: boolean
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggleActivity(activityId, studentObjectiveId, currentCompleted);
    }
  };

  if (selectedNode.type === "sub") {
    const { subObjective, majorAssignment, allSubObjectives } = selectedNode.data;
    const { objective, activities } = subObjective;
    const firstActivityType = activities[0]?.type || "default";
    const IconComponent = activityIcons[firstActivityType] || activityIcons.default;

    const allSiblingsCompleted = allSubObjectives.every(isSubObjectiveCompleted);
    const vivaRequested = majorAssignment?.status === "viva_requested";
    const mastered = majorAssignment?.status === "mastered";

    return (
      <div
        ref={panelRef}
        className={styles['right-panel']}
        style={{ width: `${panelWidth}px` }}
      >
        <div className={styles['panel-content']}>
          <div className={styles['popover-header']}>
            <div
              className={styles['popover-icon']}
              style={{ background: domainConfig?.color || "#f3f4f6" }}
            >
              <IconComponent size={24} weight="regular" />
            </div>
            <div>
              <h3 className={styles['popover-title']}>{objective.title}</h3>
              <p className={styles['popover-desc']}>{objective.description}</p>
            </div>
          </div>

          {activities.length > 0 && (
            <ul className={styles['task-list']}>
              {activities
                .sort((a, b) => a.order - b.order)
                .map((activity) => {
                  const serverCompleted = activity.progress?.completed ?? false;
                  const isCompleted = getActivityCompleted(activity._id, serverCompleted);
                  const ActivityIcon =
                    activityIcons[activity.type] || activityIcons.default;

                  return (
                    <li key={activity._id} className={styles['task-item']}>
                      <div
                        className={cn(
                          styles['task-checkbox'],
                          isCompleted && styles.checked
                        )}
                        onClick={() =>
                          handleToggleActivity(activity._id, subObjective._id, isCompleted)
                        }
                        onKeyDown={(e) =>
                          handleCheckboxKeyDown(e, activity._id, subObjective._id, isCompleted)
                        }
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={isCompleted}
                        aria-label={`Mark ${activity.title} as ${
                          isCompleted ? "incomplete" : "complete"
                        }`}
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

          {/* Show viva button when all sub-objectives complete */}
          {!mastered && majorAssignment && (allSiblingsCompleted || vivaRequested) && (
            <button
              type="button"
              className={cn(
                styles['viva-btn'],
                styles.active,
                vivaRequested && styles.requested
              )}
              onClick={() => {
                if (!vivaRequested) {
                  updateStatus({
                    studentMajorObjectiveId: majorAssignment._id,
                    status: "viva_requested",
                  });
                  onVivaRequested?.();
                }
              }}
              disabled={vivaRequested}
            >
              {vivaRequested ? "Viva Requested!" : "Request Viva for Major Objective"}
            </button>
          )}

          {mastered && (
            <div className="text-center py-2 text-green-600 font-medium font-display italic text-lg">
              Mastered
            </div>
          )}
        </div>

        {/* Resize handle */}
        <div
          className={cn(styles['resize-handle'], isResizing && styles.active)}
          onMouseDown={handleMouseDown}
        />
      </div>
    );
  }

  const { majorObjective, subObjectives, assignment } = selectedNode.data;
  const completedCount = subObjectives.filter(isSubObjectiveCompleted).length;
  const allSubsCompleted = subObjectives.length > 0 && completedCount === subObjectives.length;
  const vivaRequested = assignment?.status === "viva_requested";
  const mastered = assignment?.status === "mastered";

  return (
    <div
      ref={panelRef}
      className={styles['right-panel']}
      style={{ width: `${panelWidth}px` }}
    >
      <div className={styles['panel-content']}>
        <div className={styles['popover-header']}>
          <div
            className={styles['popover-icon']}
            style={{ background: domainConfig?.color || "#f3f4f6" }}
          >
            <Check size={22} weight="bold" />
          </div>
          <div>
            <h3 className={styles['popover-title']}>{majorObjective.title}</h3>
            <p className={styles['popover-desc']}>{majorObjective.description}</p>
          </div>
        </div>

        {subObjectives.length > 0 && (
          <ul className={styles['task-list']}>
            {subObjectives.map((sub) => (
              <li
                key={sub._id}
                className={cn(styles['task-item'], 'cursor-pointer hover:bg-gray-50 rounded -mx-2 px-2')}
                onClick={() => onSelectSubObjective?.(sub.objective._id)}
              >
                <div
                  className={cn(
                    styles['task-checkbox'],
                    isSubObjectiveCompleted(sub) && styles.checked
                  )}
                  aria-hidden="true"
                />
                <span className={styles['task-link']}>{sub.objective.title}</span>
              </li>
            ))}
          </ul>
        )}

        {!mastered && assignment && (allSubsCompleted || vivaRequested) && (
          <button
            type="button"
            className={cn(
              styles['viva-btn'],
              styles.active,
              vivaRequested && styles.requested
            )}
            onClick={() => {
              if (!vivaRequested) {
                updateStatus({
                  studentMajorObjectiveId: assignment._id,
                  status: "viva_requested",
                });
                onVivaRequested?.();
              }
            }}
            disabled={vivaRequested}
          >
            {vivaRequested ? "Viva Requested!" : "Request for Viva"}
          </button>
        )}

        {mastered && (
          <div className="text-center py-2 text-green-600 font-medium font-display italic text-lg">
            Mastered
          </div>
        )}
      </div>

      {/* Resize handle */}
      <div
        className={cn(styles['resize-handle'], isResizing && styles.active)}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
