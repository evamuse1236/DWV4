import { motion } from "framer-motion";
import { Card, Badge, ProgressBar } from "../paper";

interface DomainCardProps {
  name: string;
  icon: string;
  color: string;
  description: string;
  totalObjectives: number;
  masteredObjectives: number;
  inProgressObjectives: number;
  onClick?: () => void;
}

/**
 * Card displaying a deep work domain with progress
 */
export function DomainCard({
  name,
  icon,
  color,
  description,
  totalObjectives,
  masteredObjectives,
  inProgressObjectives,
  onClick,
}: DomainCardProps) {
  const progress = totalObjectives > 0
    ? (masteredObjectives / totalObjectives) * 100
    : 0;

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
    green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
    purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200" },
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`cursor-pointer border-2 ${colors.border} ${colors.bg} hover:shadow-lg transition-shadow`}
        onClick={onClick}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`text-4xl p-3 rounded-xl bg-white shadow-sm`}>
            {icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-bold text-lg ${colors.text}`}>{name}</h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>

            {/* Progress */}
            {totalObjectives > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">
                    {masteredObjectives} of {totalObjectives} mastered
                  </span>
                  <span className={colors.text}>{Math.round(progress)}%</span>
                </div>
                <ProgressBar
                  value={progress}
                  size="sm"
                  variant={progress === 100 ? "success" : "default"}
                />
              </div>
            )}

            {/* Status badges */}
            <div className="flex gap-2 mt-3">
              {masteredObjectives > 0 && (
                <Badge variant="success" size="sm">
                  {masteredObjectives} Mastered
                </Badge>
              )}
              {inProgressObjectives > 0 && (
                <Badge variant="warning" size="sm">
                  {inProgressObjectives} In Progress
                </Badge>
              )}
              {totalObjectives === 0 && (
                <Badge variant="default" size="sm">
                  No objectives yet
                </Badge>
              )}
            </div>
          </div>

          {/* Arrow */}
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </Card>
    </motion.div>
  );
}

export default DomainCard;
