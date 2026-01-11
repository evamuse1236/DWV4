import { useState } from "react";
import { useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";

interface Task {
  title: string;
  weekNumber: number;
  dayOfWeek: number;
}

interface TaskAssignerProps {
  goalId: string;
  userId: string;
  goalTitle: string;
  onClose: () => void;
}

const DAYS_OF_WEEK = [
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
  { short: "Sun", full: "Sunday" },
];

/**
 * TaskAssigner - Guides students through adding tasks to their SMART goals
 * Shows a weekly calendar view with day selection
 */
export function TaskAssigner({
  goalId,
  userId,
  goalTitle,
  onClose,
}: TaskAssignerProps) {
  const addActionItem = useMutation(api.goals.addActionItem);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function handleToggleDay(dayIndex: number): void {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex]);
    }
  }

  function handleAddTask(): void {
    const trimmedTask = currentTask.trim();
    if (!trimmedTask || selectedDays.length === 0) return;

    const newTasks: Task[] = selectedDays.map((day) => ({
      title: trimmedTask,
      weekNumber: selectedWeek,
      dayOfWeek: day,
    }));

    setTasks([...tasks, ...newTasks]);
    setCurrentTask("");
    setSelectedDays([]);
    setIsAdding(false);
  }

  function handleRemoveTask(index: number): void {
    setTasks(tasks.filter((_, i) => i !== index));
  }

  async function handleSaveAll(): Promise<void> {
    if (tasks.length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      for (const task of tasks) {
        await addActionItem({
          goalId: goalId as any,
          userId: userId as any,
          title: task.title,
          weekNumber: task.weekNumber,
          dayOfWeek: task.dayOfWeek,
        });
      }
      onClose();
    } catch (error) {
      console.error("Failed to save tasks:", error);
    } finally {
      setIsSaving(false);
    }
  }

  // Group tasks by week and day for display
  const tasksByWeekDay = tasks.reduce(
    (acc, task, index) => {
      const key = `${task.weekNumber}-${task.dayOfWeek}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push({ ...task, index });
      return acc;
    },
    {} as Record<string, (Task & { index: number })[]>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="journal-overlay active"
      style={{ background: "rgba(243, 229, 245, 0.95)" }}
    >
      <div className="w-full max-w-[700px] p-10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[0.7rem] uppercase tracking-[0.2em] text-[#888] block mb-2">
            Add Tasks For
          </span>
          <h2 className="font-display italic text-[1.8rem]">{goalTitle}</h2>
        </div>

        {/* Week Selector */}
        <div className="flex justify-center gap-4 mb-8">
          {[1, 2].map((week) => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-6 py-3 rounded-xl font-body text-sm transition-all ${
                selectedWeek === week
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white border border-black/10 hover:border-black/30"
              }`}
            >
              Week {week}
            </button>
          ))}
        </div>

        {/* Weekly Calendar View */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h3 className="font-display text-lg mb-4">Week {selectedWeek} Tasks</h3>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day, dayIndex) => {
              const dayTasks = tasksByWeekDay[`${selectedWeek}-${dayIndex}`] || [];
              return (
                <div key={day.short} className="text-center">
                  <div className="text-[10px] uppercase tracking-wide text-black/50 mb-2">
                    {day.short}
                  </div>
                  <div className="min-h-[100px] bg-black/5 rounded-lg p-2 space-y-1">
                    {dayTasks.map((task) => (
                      <motion.div
                        key={task.index}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded px-2 py-1 text-[10px] shadow-sm relative group"
                      >
                        <span className="line-clamp-2">{task.title}</span>
                        <button
                          onClick={() => handleRemoveTask(task.index)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Task Form */}
        <AnimatePresence mode="wait">
          {isAdding ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl p-6 shadow-sm mb-6"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-wide text-black/50 block mb-2">
                    What task will you do?
                  </label>
                  <input
                    type="text"
                    value={currentTask}
                    onChange={(e) => setCurrentTask(e.target.value)}
                    placeholder="e.g., Practice multiplication tables"
                    className="w-full px-4 py-3 border border-black/10 rounded-xl focus:outline-none focus:border-black/30"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wide text-black/50 block mb-2">
                    Which days? (Select one or more)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {DAYS_OF_WEEK.map((day, index) => (
                      <button
                        key={day.short}
                        onClick={() => handleToggleDay(index)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                          selectedDays.includes(index)
                            ? "bg-[#1a1a1a] text-white"
                            : "bg-black/5 hover:bg-black/10"
                        }`}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setCurrentTask("");
                      setSelectedDays([]);
                    }}
                    className="flex-1 py-3 border border-black/10 rounded-xl text-sm hover:border-black/30 transition-colors"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    disabled={!currentTask.trim() || selectedDays.length === 0}
                    className="flex-1 py-3 bg-[#1a1a1a] text-white rounded-xl text-sm disabled:opacity-40 transition-opacity"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="add-button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => setIsAdding(true)}
              className="w-full py-4 border-2 border-dashed border-black/20 rounded-2xl text-sm text-black/50 hover:border-black/40 hover:text-black/70 transition-colors mb-6"
            >
              + Add a Task
            </motion.button>
          )}
        </AnimatePresence>

        {/* Task Count Summary */}
        {tasks.length > 0 && (
          <div className="text-center mb-6">
            <span className="text-sm text-black/50">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} added
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onClose}
            className="bg-transparent border-none text-[14px] opacity-50 text-[#1a1a1a] cursor-pointer hover:opacity-100 transition-opacity"
          >
            {tasks.length > 0 ? "SKIP" : "DONE"}
          </button>
          {tasks.length > 0 && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="btn btn-primary disabled:opacity-50"
              style={{ padding: "16px 48px" }}
            >
              {isSaving ? "SAVING..." : `SAVE ${tasks.length} TASKS`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default TaskAssigner;
