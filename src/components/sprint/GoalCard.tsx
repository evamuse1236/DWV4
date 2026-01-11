import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Badge, ProgressBar, Button } from "../paper";
import { cn } from "../../lib/utils";
import { goalStatusConfig, type GoalStatus } from "../../lib/status-utils";

interface ActionItem {
  _id: string;
  title: string;
  isCompleted: boolean;
  weekNumber: number;
  dayOfWeek: number;
}

interface GoalCardProps {
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  status: GoalStatus;
  actionItems?: ActionItem[];
  onStatusChange?: (status: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleAction?: (itemId: string) => void;
}

/**
 * Card displaying a SMART goal with expandable details
 */
export function GoalCard({
  title,
  specific,
  measurable,
  achievable,
  relevant,
  timeBound,
  status,
  actionItems = [],
  onStatusChange,
  onEdit,
  onDelete,
  onToggleAction,
}: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const completedActions = actionItems.filter((a) => a.isCompleted).length;
  const progress = actionItems.length > 0
    ? (completedActions / actionItems.length) * 100
    : 0;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
              <Badge variant={goalStatusConfig[status].variant as any} size="sm">
                {goalStatusConfig[status].label}
              </Badge>
            </div>
            {actionItems.length > 0 && (
              <div className="mt-2">
                <ProgressBar
                  value={progress}
                  size="sm"
                  variant={status === "completed" ? "success" : "default"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {completedActions} of {actionItems.length} actions completed
                </p>
              </div>
            )}
          </div>
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
              {/* SMART breakdown */}
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-primary-600">S</span>
                  <span className="text-gray-500"> - Specific: </span>
                  <span className="text-gray-700">{specific}</span>
                </div>
                <div>
                  <span className="font-medium text-primary-600">M</span>
                  <span className="text-gray-500"> - Measurable: </span>
                  <span className="text-gray-700">{measurable}</span>
                </div>
                <div>
                  <span className="font-medium text-primary-600">A</span>
                  <span className="text-gray-500"> - Achievable: </span>
                  <span className="text-gray-700">{achievable}</span>
                </div>
                <div>
                  <span className="font-medium text-primary-600">R</span>
                  <span className="text-gray-500"> - Relevant: </span>
                  <span className="text-gray-700">{relevant}</span>
                </div>
                <div>
                  <span className="font-medium text-primary-600">T</span>
                  <span className="text-gray-500"> - Time-bound: </span>
                  <span className="text-gray-700">{timeBound}</span>
                </div>
              </div>

              {/* Action items */}
              {actionItems.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Action Items
                  </h4>
                  <div className="space-y-2">
                    {actionItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleAction?.(item._id);
                          }}
                          className={cn(
                            "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                            item.isCompleted
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 hover:border-primary-500"
                          )}
                        >
                          {item.isCompleted && (
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>
                        <span className={item.isCompleted ? "line-through text-gray-400" : "text-gray-700"}>
                          {item.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                {onEdit && (
                  <Button size="sm" variant="secondary" onClick={onEdit}>
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button size="sm" variant="ghost" onClick={onDelete}>
                    Delete
                  </Button>
                )}
                {onStatusChange && status !== "completed" && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() =>
                      onStatusChange(
                        status === "not_started" ? "in_progress" : "completed"
                      )
                    }
                    className="ml-auto"
                  >
                    {status === "not_started" ? "Start Goal" : "Mark Complete"}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default GoalCard;
