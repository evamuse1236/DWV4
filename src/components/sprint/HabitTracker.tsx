import { motion } from "framer-motion";
import { Card } from "../paper";
import { cn } from "../../lib/utils";

interface HabitCompletion {
  date: string;
  completed: boolean;
}

interface HabitTrackerProps {
  name: string;
  description?: string;
  whatIsHabit: string;
  howToPractice: string;
  sprintStartDate: string;
  completions: HabitCompletion[];
  onToggle: (date: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

/**
 * 14-day habit tracker grid
 */
export function HabitTracker({
  name,
  description,
  whatIsHabit,
  howToPractice,
  sprintStartDate,
  completions,
  onToggle,
  onEdit,
  onDelete,
}: HabitTrackerProps) {
  // Generate 14 days from sprint start
  const days: { date: string; dayOfWeek: number; weekNum: number }[] = [];
  const startDate = new Date(sprintStartDate);

  for (let i = 0; i < 14; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push({
      date: d.toISOString().split("T")[0],
      dayOfWeek: d.getDay(),
      weekNum: i < 7 ? 1 : 2,
    });
  }

  // Create completion map for quick lookup
  const completionMap = new Map(
    completions.map((c) => [c.date, c.completed])
  );

  // Calculate streak
  const today = new Date().toISOString().split("T")[0];
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].date > today) continue;
    if (completionMap.get(days[i].date)) {
      streak++;
    } else {
      break;
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{name}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1 text-orange-500">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-medium">{streak} day streak!</span>
          </div>
        )}
      </div>

      {/* 14-day grid */}
      <div className="space-y-3">
        {/* Week 1 */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Week 1</p>
          <div className="flex gap-1">
            {days.slice(0, 7).map((day) => {
              const isCompleted = completionMap.get(day.date);
              const isToday = day.date === today;
              const isFuture = day.date > today;

              return (
                <motion.button
                  key={day.date}
                  whileHover={!isFuture ? { scale: 1.1 } : {}}
                  whileTap={!isFuture ? { scale: 0.95 } : {}}
                  onClick={() => !isFuture && onToggle(day.date)}
                  disabled={isFuture}
                  className={cn(
                    "w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs transition-colors",
                    isFuture && "opacity-40 cursor-not-allowed",
                    isToday && "ring-2 ring-primary-500 ring-offset-1",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <span className="font-medium">{dayLabels[day.dayOfWeek]}</span>
                  {isCompleted && <span className="text-[10px]">✓</span>}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Week 2 */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Week 2</p>
          <div className="flex gap-1">
            {days.slice(7, 14).map((day) => {
              const isCompleted = completionMap.get(day.date);
              const isToday = day.date === today;
              const isFuture = day.date > today;

              return (
                <motion.button
                  key={day.date}
                  whileHover={!isFuture ? { scale: 1.1 } : {}}
                  whileTap={!isFuture ? { scale: 0.95 } : {}}
                  onClick={() => !isFuture && onToggle(day.date)}
                  disabled={isFuture}
                  className={cn(
                    "w-9 h-9 rounded-lg flex flex-col items-center justify-center text-xs transition-colors",
                    isFuture && "opacity-40 cursor-not-allowed",
                    isToday && "ring-2 ring-primary-500 ring-offset-1",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <span className="font-medium">{dayLabels[day.dayOfWeek]}</span>
                  {isCompleted && <span className="text-[10px]">✓</span>}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Habit details */}
      <div className="mt-4 pt-4 border-t border-gray-100 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-xs mb-1">What is this habit?</p>
            <p className="text-gray-700">{whatIsHabit}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">How will I practice?</p>
            <p className="text-gray-700">{howToPractice}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-sm text-gray-500 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

export default HabitTracker;
