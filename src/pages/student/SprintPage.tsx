import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { Modal } from "../../components/paper";
import { GoalEditor, HabitTracker } from "../../components/sprint";
import { TaskAssigner } from "../../components/student/TaskAssigner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useAuth } from "../../hooks/useAuth";
import { goalStatusLabels, type GoalStatus } from "../../lib/status-utils";
import { cn } from "../../lib/utils";
import styles from "./sprint.module.css";
import museStyles from "../../styles/muse.module.css";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Week runs Monday (index 0) to Sunday (index 6)
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Goal icons (cycle through these)
const GOAL_ICONS = ["ph-plant", "ph-barbell", "ph-book-open", "ph-lightbulb", "ph-target", "ph-star"];

// Goal colors for visual distinction (with tint for corner accent)
const GOAL_COLORS = [
  { name: "sage", dot: "#a8c5b5", bg: "rgba(168, 197, 181, 0.15)", tint: "#88c999" },
  { name: "coral", dot: "#e8a598", bg: "rgba(232, 165, 152, 0.15)", tint: "#f2a5a5" },
  { name: "sky", dot: "#8cb4d4", bg: "rgba(140, 180, 212, 0.15)", tint: "#8da4ef" },
];

// Convert 24-hour time to 12-hour format (e.g., 14 -> "2pm")
function formatHourLabel(hour24: number): string {
  const suffix = hour24 < 12 ? "am" : "pm";
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${hour12}${suffix}`;
}

// Time options from 6am to 10pm
const TIME_OPTIONS = Array.from({ length: 17 }, (_, i) => formatHourLabel(6 + i));

// Sentinel value for "no time selected" in the dropdown
const NO_TIME_VALUE = "__no_time__";

// X icon for close button
function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// Send icon
function SendIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

/**
 * Sprint Page - New Week View Design
 * Goals at top, 7-day week view in middle, habit tracker at bottom
 */
export function SprintPage() {
  const { user } = useAuth();
  const [showTaskAssigner, setShowTaskAssigner] = useState(false);
  const [newGoalId, setNewGoalId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  // Muse (AI Chat) state
  const [museExpanded, setMuseExpanded] = useState(false);

  // Week toggle state (1 or 2)
  const [activeWeek, setActiveWeek] = useState(1);

  // Goal expansion state (track which goal ID is expanded)
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  // Selected task for keyboard navigation
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Edit states
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [openTimeSelectTaskId, setOpenTimeSelectTaskId] = useState<string | null>(null);

  // Inline editing state - tracks which item (by ID) is being edited and its current value
  // Each pair: [activeItemId, editValue] - null ID means nothing is being edited
  const [editingTaskTitle, setEditingTaskTitle] = useState<string | null>(null);
  const [taskTitleValue, setTaskTitleValue] = useState("");
  const [editingGoalTitle, setEditingGoalTitle] = useState<string | null>(null);
  const [goalTitleValue, setGoalTitleValue] = useState("");

  // State for quick-add task picker
  const [showingAddTaskForDay, setShowingAddTaskForDay] = useState<number | null>(null);

  // Time select optimistic UI state
  const [optimisticTaskTimes, setOptimisticTaskTimes] = useState<Record<string, string>>({});
  const [timeSaveErrorTaskId, setTimeSaveErrorTaskId] = useState<string | null>(null);

  // Get active sprint
  const activeSprint = useQuery(api.sprints.getActive);

  // Get user's goals and habits for the sprint
  const goals = useQuery(
    api.goals.getByUserAndSprint,
    activeSprint && user
      ? { userId: user._id as any, sprintId: activeSprint._id }
      : "skip"
  );

  // Query for previous sprint goals (for AI import feature)
  const previousSprintGoals = useQuery(
    api.goals.getPreviousSprintGoals,
    activeSprint && user
      ? { userId: user._id as any, currentSprintId: activeSprint._id }
      : "skip"
  );

  // Mutations
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const toggleActionItem = useMutation(api.goals.toggleActionItem);
  const updateActionItem = useMutation(api.goals.updateActionItem);
  const updateHabit = useMutation(api.habits.update);
  const addActionItem = useMutation(api.goals.addActionItem);
  const removeGoal = useMutation(api.goals.remove);
  const removeActionItem = useMutation(api.goals.removeActionItem);
  const duplicateGoal = useMutation(api.goals.duplicate);
  const importGoal = useMutation(api.goals.importGoal);

  // Handle AI-generated goal with tasks (called from Muse)
  const handleAIGoalComplete = async (
    goal: { title: string; specific: string; measurable: string; achievable: string; relevant: string; timeBound: string },
    tasks: { title: string; weekNumber: number; dayOfWeek: number }[]
  ) => {
    if (!user || !activeSprint) return;

    const result = await createGoal({
      userId: user._id as any,
      sprintId: activeSprint._id,
      ...goal,
    });

    if (result.goalId) {
      for (const task of tasks) {
        await addActionItem({
          goalId: result.goalId as any,
          userId: user._id as any,
          title: task.title,
          weekNumber: task.weekNumber,
          dayOfWeek: task.dayOfWeek,
        });
      }
    }

    setMuseExpanded(false);
  };

  // Handle AI duplicate goal action
  const handleAIDuplicateGoal = async (goalId: string) => {
    if (!activeSprint) return;
    await duplicateGoal({
      goalId: goalId as any,
      targetSprintId: activeSprint._id,
      includeActionItems: true,
    });
  };

  // Handle AI import goal action
  const handleAIImportGoal = async (goalId: string) => {
    if (!activeSprint) return;
    await importGoal({
      goalId: goalId as any,
      targetSprintId: activeSprint._id,
      includeActionItems: true,
    });
  };

  // Handle AI edit goal action
  const handleAIEditGoal = async (goalId: string, updates: Partial<{ title: string; specific: string; measurable: string; achievable: string; relevant: string; timeBound: string }>) => {
    await updateGoal({
      goalId: goalId as any,
      ...updates,
    });
  };

  const handleUpdateGoal = async (goalData: any) => {
    if (!editingGoal) return;
    await updateGoal({
      goalId: editingGoal._id,
      ...goalData,
    });
    setEditingGoal(null);
  };

  const handleToggleAction = async (itemId: string) => {
    await toggleActionItem({ itemId: itemId as any });
  };

  const handleUpdateHabit = async (data: any) => {
    if (!editingHabit) return;
    await updateHabit({
      habitId: editingHabit._id as any,
      ...data,
    });
    setEditingHabit(null);
  };

  // Handle task title update (inline edit)
  const handleTaskTitleUpdate = async (taskId: string) => {
    if (!taskTitleValue.trim()) {
      setEditingTaskTitle(null);
      return;
    }
    await updateActionItem({
      itemId: taskId as any,
      title: taskTitleValue.trim(),
    });
    setEditingTaskTitle(null);
    setTaskTitleValue("");
  };

  // Handle goal title update (inline edit)
  const handleGoalTitleUpdate = async (goalId: string) => {
    if (!goalTitleValue.trim()) {
      setEditingGoalTitle(null);
      return;
    }
    await updateGoal({
      goalId: goalId as any,
      title: goalTitleValue.trim(),
    });
    setEditingGoalTitle(null);
    setGoalTitleValue("");
  };

  // Quick add task with goal color selection
  const handleQuickAddTask = async (dayOfWeek: number, goalId: string) => {
    if (!user || !activeSprint) return;
    await addActionItem({
      goalId: goalId as any,
      userId: user._id as any,
      title: "New task",
      weekNumber: activeWeek,
      dayOfWeek,
    });
    setShowingAddTaskForDay(null);
  };

  // Keyboard handler for task navigation - must be before any early returns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable global shortcuts while any inline editor/dropdown is active
      if (openTimeSelectTaskId || editingTaskTitle || editingGoalTitle) return;

      // Ignore if typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest("input, textarea, [contenteditable='true']")
      ) {
        return;
      }

      if (!selectedTaskId || !activeSprint || !goals) return;

      // Get all action items for current week
      const allItems = goals.flatMap((goal: any) =>
        (goal.actionItems || []).map((item: any) => ({
          ...item,
          goalId: goal._id,
        }))
      );
      const weekItems = allItems.filter((item: any) => item.weekNumber === activeWeek);
      const task = weekItems.find((t: any) => t._id === selectedTaskId);
      if (!task) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        // In display order: Mon(1) Tue(2) Wed(3) Thu(4) Fri(5) Sat(6) Sun(0)
        // Moving left from Monday (JS day 1) goes to Sunday of previous week
        if (task.dayOfWeek === 1 && activeWeek > 1) {
          // Go to Sunday (day 0) of previous week
          updateActionItem({ itemId: task._id as any, dayOfWeek: 0, weekNumber: activeWeek - 1 });
          setActiveWeek(activeWeek - 1);
        } else {
          // Normal left movement: Mon→Sun wrap, otherwise decrement
          // JS days: Sun=0, Mon=1, Tue=2... Sat=6
          // Display order: Mon(1)→Sat(6)→Sun(0)
          let newDay: number;
          if (task.dayOfWeek === 1) newDay = 0; // Mon→Sun (can't go prev week)
          else if (task.dayOfWeek === 0) newDay = 6; // Sun→Sat
          else newDay = task.dayOfWeek - 1; // Normal decrement
          updateActionItem({ itemId: task._id as any, dayOfWeek: newDay });
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        // Moving right from Sunday (JS day 0) goes to Monday of next week
        if (task.dayOfWeek === 0 && activeWeek < 2) {
          // Go to Monday (day 1) of next week
          updateActionItem({ itemId: task._id as any, dayOfWeek: 1, weekNumber: activeWeek + 1 });
          setActiveWeek(activeWeek + 1);
        } else {
          // Normal right movement: Sun→Mon wrap, otherwise increment
          let newDay: number;
          if (task.dayOfWeek === 0) newDay = 1; // Sun→Mon (can't go next week)
          else if (task.dayOfWeek === 6) newDay = 0; // Sat→Sun
          else newDay = task.dayOfWeek + 1; // Normal increment
          updateActionItem({ itemId: task._id as any, dayOfWeek: newDay });
        }
      } else if (e.key === "Escape") {
        setSelectedTaskId(null);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleActionItem({ itemId: task._id as any });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (confirm("Delete this task?")) {
          removeActionItem({ itemId: task._id as any });
          setSelectedTaskId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedTaskId,
    activeSprint,
    goals,
    activeWeek,
    updateActionItem,
    toggleActionItem,
    openTimeSelectTaskId,
    editingTaskTitle,
    editingGoalTitle,
  ]);

  // No active sprint
  if (!activeSprint) {
    return (
      <div>
        <div className="text-center mb-20 fade-in-up">
          <span className="font-display italic text-[24px] text-[#888]">
            No Active Cycle
          </span>
          <h1 className="text-[4rem] mt-[10px]">
            Waiting for a<br />
            <span className="text-[#a8c5b5] italic">new sprint</span>
          </h1>
        </div>
        <div className="max-w-md mx-auto text-center">
          <div className="pastel-card pastel-blue p-10">
            <div className="text-[48px] mb-4">📅</div>
            <p className="font-body opacity-70">
              Ask your coach to create a sprint so you can start setting goals!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sprintDaysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(activeSprint.endDate).getTime() - Date.now()) / MS_PER_DAY
    )
  );

  // Calculate dates for the sprint
  const sprintStart = new Date(activeSprint.startDate);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Calculate which day of the sprint we're on (0-indexed)
  const dayIndex = Math.floor(
    (today.getTime() - sprintStart.getTime()) / MS_PER_DAY
  );

  // Determine current week based on day index
  const currentWeek = dayIndex < 7 ? 1 : 2;

  // Convert JS day (0=Sun) to display index (0=Mon, 6=Sun)
  const jsToDisplayDay = (jsDay: number) => (jsDay + 6) % 7;

  // Generate week dates based on activeWeek toggle, ordered Mon-Sun
  const getWeekDates = () => {
    const dates: { date: string; dayOfWeek: number; dayNum: number; displayIndex: number }[] = [];
    const weekOffset = (activeWeek - 1) * 7;

    for (let i = 0; i < 7; i++) {
      const date = new Date(sprintStart);
      date.setDate(date.getDate() + weekOffset + i);
      const jsDay = date.getDay();
      dates.push({
        date: date.toISOString().split("T")[0],
        dayOfWeek: jsDay, // Keep JS convention for data lookup
        dayNum: date.getDate(),
        displayIndex: jsToDisplayDay(jsDay), // For ordering Mon-Sun
      });
    }
    // Sort by display index (Mon=0 to Sun=6)
    return dates.sort((a, b) => a.displayIndex - b.displayIndex);
  };

  const weekDates = getWeekDates();

  // Get all action items from goals, with goal index for color coding
  const allActionItems = goals?.flatMap((goal: any, goalIndex: number) =>
    (goal.actionItems || []).map((item: any) => ({
      ...item,
      goalTitle: goal.title,
      goalId: goal._id,
      goalIndex, // For color coding
    }))
  ) || [];

  // Filter action items by selected week
  const weekActionItems = allActionItems.filter(
    (item: any) => item.weekNumber === activeWeek
  );

  // Group tasks by day of week
  const tasksByDay: { [key: number]: any[] } = {};
  for (let i = 0; i < 7; i++) {
    tasksByDay[i] = weekActionItems.filter((item: any) => item.dayOfWeek === i);
  }

  // Toggle goal expansion
  const handleGoalClick = (goalId: string) => {
    setExpandedGoalId(expandedGoalId === goalId ? null : goalId);
  };

  // Open Muse for goal creation
  const handleOpenGoalChat = () => {
    setMuseExpanded(true);
  };

  // Render the goals container (3 slots) - FIXED to match inspo exactly
  const renderGoalsContainer = () => {
    const goalSlots = [];
    const maxGoals = 3;

    for (let i = 0; i < maxGoals; i++) {
      const goal = goals?.[i];

      if (goal) {
        const isExpanded = expandedGoalId === goal._id;
        const completedItems = goal.actionItems?.filter((item: any) => item.isCompleted).length || 0;
        const totalItems = goal.actionItems?.length || 0;
        const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
        const iconClass = GOAL_ICONS[i % GOAL_ICONS.length];

        const goalColor = GOAL_COLORS[i % GOAL_COLORS.length];

        goalSlots.push(
          <motion.div
            key={goal._id}
            className={cn(styles['goal-slot'], styles.filled, isExpanded && styles.expanded)}
            onClick={() => handleGoalClick(goal._id)}
            layout
            style={{ position: "relative", "--goal-tint": goalColor.tint } as React.CSSProperties}
          >
            {/* Color dot indicator */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "12px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: goalColor.dot,
              }}
            />
            {/* Goal header - matching inspo structure exactly */}
            <div>
              <i
                className={cn('ph', iconClass, styles['goal-icon'])}
                style={{
                  color: goalColor.dot,
                }}
              />
              {/* Goal title (inline editable) */}
              {editingGoalTitle === goal._id ? (
                <input
                  type="text"
                  value={goalTitleValue}
                  onChange={(e) => setGoalTitleValue(e.target.value)}
                  onBlur={() => handleGoalTitleUpdate(goal._id)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") {
                      e.preventDefault();
                      (e.target as HTMLInputElement).blur();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setGoalTitleValue("");
                      setEditingGoalTitle(null);
                    }
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-display)",
                    fontSize: "24px",
                    fontStyle: "italic",
                    padding: "4px 8px",
                    border: "1px solid rgba(168, 197, 181, 0.5)",
                    borderRadius: "6px",
                    background: "transparent",
                    margin: 0,
                  }}
                />
              ) : (
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingGoalTitle(goal._id);
                    setGoalTitleValue(goal.title);
                  }}
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "24px",
                    fontStyle: "italic",
                    margin: 0,
                    cursor: "text",
                  }}
                  title="Click to edit"
                >
                  {goal.title}
                </h3>
              )}
              <div
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  opacity: 0.5,
                  marginTop: "8px",
                }}
              >
                {goalStatusLabels[goal.status as GoalStatus]}
              </div>
            </div>

            {/* Goal Details (revealed on click) */}
            <div className={styles['goal-details']}>
              <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, opacity: 0.5 }}>
                Progress
              </div>
              <div className={styles['goal-progress-mini']}>
                <motion.div
                  className={styles['goal-progress-fill']}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>

              <div style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 700, opacity: 0.5, marginTop: "16px" }}>
                Daily Actions
              </div>
              <ul className={styles['action-list']}>
                {goal.actionItems?.slice(0, 5).map((item: any) => (
                  <li
                    key={item._id}
                    className={cn(styles['action-item'], item.isCompleted && styles.done)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAction(item._id);
                    }}
                  >
                    <i className={`ph ${item.isCompleted ? "ph-check-circle" : "ph-circle"}`} />
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>

              <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingGoal(goal);
                  }}
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: 0.5,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  className="hover:opacity-100 transition-opacity"
                >
                  Edit Goal
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${goal.title}" and all its tasks?`)) {
                      removeGoal({ goalId: goal._id as any });
                      setExpandedGoalId(null);
                    }
                  }}
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    opacity: 0.5,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#c44",
                  }}
                  className="hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        );
      } else {
        // Empty slot - matching inspo structure exactly
        const emptySlotColor = GOAL_COLORS[i % GOAL_COLORS.length];
        goalSlots.push(
          <div
            key={`empty-${i}`}
            className={styles['goal-slot']}
            onClick={handleOpenGoalChat}
            style={{ "--goal-tint": emptySlotColor.tint } as React.CSSProperties}
          >
            <div style={{ opacity: 0.4 }}>
              <i className="ph ph-plus" style={{ fontSize: "24px", display: "block", color: emptySlotColor.dot }} />
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "18px",
                  fontStyle: "italic",
                  marginTop: "8px",
                }}
              >
                Set Goal
              </div>
            </div>
          </div>
        );
      }
    }

    return <div className={cn(styles['goals-container'], "fade-in-up delay-1")}>{goalSlots}</div>;
  };

  // Render the week view
  const renderWeekView = () => (
    <div className={cn(styles['week-view-container'], "fade-in-up delay-2")}>
      <div className={styles['week-view']}>
        {weekDates.map((dayInfo) => {
          const isToday = dayInfo.date === todayStr && activeWeek === currentWeek;
          const dayTasks = tasksByDay[dayInfo.dayOfWeek] || [];

          return (
            <div
              key={dayInfo.date}
              className={cn(styles['day-column'], isToday && styles.active)}
            >
              <div className={styles['day-header']}>
                <div className={styles['day-name']}>{DAY_NAMES[dayInfo.displayIndex]}</div>
                <div className={styles['day-date']}>{dayInfo.dayNum}</div>
              </div>

              <AnimatePresence mode="popLayout">
              {dayTasks.map((task: any) => {
                const isSelected = selectedTaskId === task._id;
                const isTimeSelectOpen = openTimeSelectTaskId === task._id;
                const taskColor = GOAL_COLORS[task.goalIndex % GOAL_COLORS.length];
                // Use optimistic value if pending, otherwise use server value
                const serverTimeValue = task.scheduledTime || "";
                const displayTimeValue = optimisticTaskTimes[task._id] ?? serverTimeValue;
                const selectValue = displayTimeValue || undefined;
                const hasCustomTime = displayTimeValue && !TIME_OPTIONS.includes(displayTimeValue);

                return (
                  <motion.div
                    key={task._id}
                    layoutId={task._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className={cn(styles['task-card'], task.isCompleted && styles.completed, isSelected && styles.selected)}
                      style={{ background: taskColor.bg }}
                    whileHover={{ y: -2 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isTimeSelectOpen || editingTaskTitle === task._id) return;
                      // If clicking on an already selected task, toggle its completion
                      if (isSelected) {
                        handleToggleAction(task._id);
                      } else {
                          // Otherwise, select it
                          setSelectedTaskId(task._id);
                        }
                      }}
                      layout
                    >
                      {/* Header row with goal label and time */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <div className={styles['task-time-pill']} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: taskColor.dot,
                              flexShrink: 0,
                            }}
                          />
                          {task.goalTitle}
                      </div>
                      {/* Editable time field */}
                      <div onClick={(e) => e.stopPropagation()} title="Set time">
                        <Select
                          value={selectValue}
                          open={isTimeSelectOpen}
                          onOpenChange={(open) => setOpenTimeSelectTaskId(open ? task._id : null)}
                          onValueChange={async (selectedValue) => {
                            const newTime = selectedValue === NO_TIME_VALUE ? "" : selectedValue;
                            if (newTime === displayTimeValue) return;

                            // Optimistically update UI
                            setTimeSaveErrorTaskId(null);
                            setOptimisticTaskTimes((prev) => ({ ...prev, [task._id]: newTime }));

                            // Persist to server
                            try {
                              await updateActionItem({
                                itemId: task._id as any,
                                scheduledTime: newTime,
                              });
                            } catch (err) {
                              console.error("Failed to update scheduled time:", err);
                              setTimeSaveErrorTaskId(task._id);
                            }
                          }}
                        >
                          <SelectTrigger
                            className={[
                              "h-5 min-w-[56px] px-2 py-0 text-[10px] font-body shadow-none",
                              "bg-transparent border-[rgba(168,197,181,0.5)]",
                              "focus:ring-0 focus:ring-offset-0",
                              displayTimeValue ? "opacity-70" : "opacity-30",
                              timeSaveErrorTaskId === task._id ? "border-red-400" : "",
                            ].join(" ")}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <SelectValue placeholder="time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_TIME_VALUE}>time</SelectItem>
                            {hasCustomTime && (
                              <SelectItem value={displayTimeValue}>{displayTimeValue}</SelectItem>
                            )}
                            {TIME_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                      {/* Task title (inline editable) */}
                      {editingTaskTitle === task._id ? (
                        <input
                          type="text"
                          value={taskTitleValue}
                          onChange={(e) => setTaskTitleValue(e.target.value)}
                          onBlur={() => handleTaskTitleUpdate(task._id)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") {
                              e.preventDefault();
                              (e.target as HTMLInputElement).blur();
                            }
                            if (e.key === "Escape") {
                              e.preventDefault();
                              setTaskTitleValue("");
                              setEditingTaskTitle(null);
                            }
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: "100%",
                            fontFamily: "var(--font-display)",
                            fontSize: "16px",
                            padding: "2px 4px",
                            border: "1px solid rgba(168, 197, 181, 0.5)",
                            borderRadius: "4px",
                            background: "transparent",
                          }}
                        />
                      ) : (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTaskTitle(task._id);
                            setTaskTitleValue(task.title);
                          }}
                          style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "16px",
                            textDecoration: task.isCompleted ? "line-through" : "none",
                            cursor: "text",
                          }}
                          title="Click to edit"
                        >
                          {task.title}
                        </div>
                      )}
                      {/* Selection hint */}
                      {isSelected && (
                        <div style={{ fontSize: "9px", opacity: 0.5, marginTop: "6px" }}>
                          ← → move • Enter complete • Del delete • Esc deselect
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {dayTasks.length === 0 && (
                <div className="text-center text-[12px] opacity-30 mt-8">
                  No tasks
                </div>
              )}

              {/* Quick add task button */}
              {goals && goals.length > 0 && (
                <div style={{ marginTop: "auto", paddingTop: "12px" }}>
                  {showingAddTaskForDay === dayInfo.dayOfWeek ? (
                    <div className={styles['quick-add-goals']}>
                      {goals.map((goal: any, idx: number) => (
                        <motion.button
                          key={goal._id}
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleQuickAddTask(dayInfo.dayOfWeek, goal._id)}
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            background: GOAL_COLORS[idx % GOAL_COLORS.length].dot,
                            border: "none",
                            cursor: "pointer",
                          }}
                          title={goal.title}
                        />
                      ))}
                      <button
                        onClick={() => setShowingAddTaskForDay(null)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          opacity: 0.4,
                          fontSize: "14px",
                        }}
                      >
                        <i className="ph ph-x" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowingAddTaskForDay(dayInfo.dayOfWeek)}
                      className={styles['quick-add-btn']}
                    >
                      <i className="ph ph-plus" style={{ fontSize: "14px" }} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="fade-in-up" style={{ marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <span
            style={{
              display: "block",
              marginBottom: "10px",
              opacity: 0.6,
              fontFamily: "var(--font-body)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "11px",
              fontWeight: 700,
            }}
          >
            Sprint Cycle
          </span>
          <h1 style={{ fontSize: "3.5rem", margin: 0, lineHeight: 1 }}>{activeSprint.name}</h1>
        </div>

        {/* Week Toggle */}
        <div className={styles['week-toggle']}>
          <div
            className={cn(styles['toggle-btn'], activeWeek === 1 && styles.active)}
            onClick={() => setActiveWeek(1)}
          >
            Week 1
          </div>
          <div
            className={cn(styles['toggle-btn'], activeWeek === 2 && styles.active)}
            onClick={() => setActiveWeek(2)}
          >
            Week 2
          </div>
        </div>
      </div>

      {/* Goals Container */}
      {renderGoalsContainer()}

      {/* Week View */}
      {renderWeekView()}

      {/* Habit Tracker */}
      {user && activeSprint && (
        <HabitTracker
          userId={user._id as any}
          sprintId={activeSprint._id}
          weekDates={weekDates}
        />
      )}

      {/* The Muse: AI Chatbox */}
      <TheMuse
        expanded={museExpanded}
        onToggle={() => setMuseExpanded(!museExpanded)}
        onClose={() => setMuseExpanded(false)}
        sprintDaysRemaining={sprintDaysLeft}
        onGoalComplete={handleAIGoalComplete}
        existingGoals={goals?.map((g: any) => ({ id: g._id, title: g.title })) || []}
        previousSprintGoals={previousSprintGoals?.map((g: any) => ({ id: g._id, title: g.title, sprintName: g.sprintName })) || []}
        onDuplicateGoal={handleAIDuplicateGoal}
        onImportGoal={handleAIImportGoal}
        onEditGoal={handleAIEditGoal}
      />

      {/* Edit Goal Modal */}
      <Modal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        title="Edit Goal"
        size="lg"
      >
        {editingGoal && (
          <GoalEditor
            onSave={handleUpdateGoal}
            onCancel={() => setEditingGoal(null)}
            initialData={{
              title: editingGoal.title,
              specific: editingGoal.specific,
              measurable: editingGoal.measurable,
              achievable: editingGoal.achievable,
              relevant: editingGoal.relevant,
              timeBound: editingGoal.timeBound,
            }}
          />
        )}
      </Modal>


      {/* Edit Habit Form Modal */}
      <AnimatePresence>
        {editingHabit && (
          <HabitFormOverlay
            onSave={handleUpdateHabit}
            onClose={() => setEditingHabit(null)}
            initialData={{
              name: editingHabit.name,
              whatIsHabit: editingHabit.whatIsHabit || "",
              howToPractice: editingHabit.howToPractice || "",
            }}
            isEditing
          />
        )}
      </AnimatePresence>

      {/* Task Assigner Modal */}
      <AnimatePresence>
        {showTaskAssigner && newGoalId && user && (
          <TaskAssigner
            goalId={newGoalId}
            userId={user._id as string}
            goalTitle={newGoalTitle}
            onClose={() => {
              setShowTaskAssigner(false);
              setNewGoalId(null);
              setNewGoalTitle("");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// THE MUSE: Floating AI Chat Companion
// =============================================================================

interface MuseMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ExtractedGoal {
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

interface SuggestedTask {
  title: string;
  weekNumber: number;
  dayOfWeek: number;
}

const AI_MODELS = [
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3" },
  { id: "xiaomi/mimo-v2-flash:free", name: "MiMo Flash" },
  { id: "tngtech/deepseek-r1t2-chimera:free", name: "DeepSeek" },
];

type AIPersona = "muse" | "captain";

function TheMuse({
  expanded,
  onToggle,
  onClose,
  sprintDaysRemaining,
  onGoalComplete,
  existingGoals,
  previousSprintGoals,
  onDuplicateGoal,
  onImportGoal,
  onEditGoal,
}: {
  expanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  sprintDaysRemaining: number;
  onGoalComplete: (goal: ExtractedGoal, tasks: SuggestedTask[]) => void;
  existingGoals?: { id: string; title: string }[];
  previousSprintGoals?: { id: string; title: string; sprintName: string }[];
  onDuplicateGoal?: (goalId: string) => Promise<void>;
  onImportGoal?: (goalId: string) => Promise<void>;
  onEditGoal?: (goalId: string, updates: Partial<ExtractedGoal>) => Promise<void>;
}) {
  const [messages, setMessages] = useState<MuseMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel] = useState(AI_MODELS[0].id);
  const [extractedGoal, setExtractedGoal] = useState<ExtractedGoal | null>(null);
  const [tasks, setTasks] = useState<SuggestedTask[]>([]);
  const [phase, setPhase] = useState<"chatting" | "reviewing">("chatting");
  const [persona, setPersona] = useState<AIPersona>("muse");

  const chatAction = useAction(api.ai.chat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting when expanded or persona changes
  useEffect(() => {
    if (expanded && messages.length === 0) {
      const greeting = persona === "captain"
        ? `What do you want to accomplish? Quick: (1) the goal, (2) how you'll know it's done.`
        : `Hi! I'm here to help you set a goal for your sprint. What would you like to accomplish in the next ${sprintDaysRemaining} days?`;
      setMessages([
        {
          id: "initial",
          role: "assistant",
          content: greeting,
        },
      ]);
    }
  }, [expanded, sprintDaysRemaining, persona]);

  // Reset conversation when persona changes
  const handlePersonaChange = (newPersona: AIPersona) => {
    if (newPersona !== persona) {
      setPersona(newPersona);
      setMessages([]);
      setExtractedGoal(null);
      setTasks([]);
      setPhase("chatting");
    }
  };

  // Focus input when expanded
  useEffect(() => {
    if (expanded && phase === "chatting") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [expanded, phase]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessage: MuseMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const apiMessages = messages
        .filter((m) => m.id !== "initial")
        .concat(userMessage)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await chatAction({
        messages: apiMessages,
        sprintDaysRemaining,
        model: selectedModel,
        persona,
        existingGoals,
        previousSprintGoals,
      });

      // Helper to parse AI action blocks and extract text before them
      function parseActionBlock(blockType: string): { data: any; textBefore: string } | null {
        const match = response.content.match(new RegExp(`\`\`\`${blockType}\\n([\\s\\S]*?)\\n\`\`\``));
        if (!match) return null;
        try {
          return {
            data: JSON.parse(match[1]),
            textBefore: response.content.split(`\`\`\`${blockType}`)[0].trim(),
          };
        } catch {
          return null;
        }
      }

      // Helper to add AI message
      function addAIMessage(content: string) {
        setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "assistant", content }]);
      }

      // Handle goal creation
      const goalAction = parseActionBlock("goal-ready");
      if (goalAction) {
        setExtractedGoal(goalAction.data.goal);
        setTasks(goalAction.data.suggestedTasks || []);
        setPhase("reviewing");
        addAIMessage(goalAction.textBefore || "Here's your goal!");
        return;
      }

      // Handle duplicate goal
      const duplicateAction = parseActionBlock("duplicate-goal");
      if (duplicateAction && onDuplicateGoal) {
        addAIMessage(duplicateAction.textBefore || "Duplicating your goal...");
        try {
          await onDuplicateGoal(duplicateAction.data.sourceGoalId);
          addAIMessage("Done! Your goal has been duplicated.");
        } catch (e) {
          console.error("Duplicate failed:", e);
        }
        return;
      }

      // Handle import goal
      const importAction = parseActionBlock("import-goal");
      if (importAction && onImportGoal) {
        addAIMessage(importAction.textBefore || "Importing your goal...");
        try {
          await onImportGoal(importAction.data.sourceGoalId);
          addAIMessage("Done! Your goal has been imported from the previous sprint.");
        } catch (e) {
          console.error("Import failed:", e);
        }
        return;
      }

      // Handle edit goal
      const editAction = parseActionBlock("edit-goal");
      if (editAction && onEditGoal) {
        addAIMessage(editAction.textBefore || "Updating your goal...");
        try {
          await onEditGoal(editAction.data.goalId, editAction.data.updates);
          addAIMessage("Done! Your goal has been updated.");
        } catch (e) {
          console.error("Edit failed:", e);
        }
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "assistant", content: response.content },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: "assistant", content: "Sorry, I had trouble responding. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
      // Re-focus input after AI responds
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGoBack = () => {
    setPhase("chatting");
    setExtractedGoal(null);
    setTasks([]);
    setMessages((prev) => [
      ...prev,
      { id: `ai-${Date.now()}`, role: "assistant", content: "No problem! What would you like to change?" },
    ]);
  };

  const handleConfirm = () => {
    if (extractedGoal) {
      onGoalComplete(extractedGoal, tasks);
      // Reset state
      setMessages([]);
      setExtractedGoal(null);
      setTasks([]);
      setPhase("chatting");
    }
  };

  return (
    <div className={cn(museStyles['muse-container'], expanded && museStyles.expanded)}>
      {/* Floating Blob Trigger */}
      <div className={museStyles['muse-blob-wrapper']}>
        <div className={museStyles['muse-blob']} onClick={onToggle} />
      </div>

      {/* Expanded Chat Panel */}
      <div className={museStyles['muse-panel']}>
        <div className={museStyles['muse-header']}>
          <div>
            <span style={{ fontFamily: "var(--font-body)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.5 }}>
              AI Companion
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontStyle: "italic", margin: 0, lineHeight: 1 }}>
                {persona === "captain" ? "The Captain" : "The Muse"}
              </h3>
              <div className={museStyles['persona-toggle']}>
                <button
                  className={cn(museStyles['persona-btn'], persona === "muse" && museStyles.active)}
                  onClick={() => handlePersonaChange("muse")}
                  title="Friendly, conversational (3-5 turns)"
                >
                  Muse
                </button>
                <button
                  className={cn(museStyles['persona-btn'], persona === "captain" && museStyles.active)}
                  onClick={() => handlePersonaChange("captain")}
                  title="Fast, direct (2-3 turns)"
                >
                  Captain
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", opacity: 0.5, padding: "4px" }}
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {phase === "chatting" ? (
          <>
            <div className={museStyles['muse-body']}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(museStyles['chat-message'], msg.role === "user" ? museStyles.user : museStyles.ai)}
                >
                  {msg.content}
                </motion.div>
              ))}
              {isLoading && (
                <div className={cn(museStyles['chat-message'], museStyles.ai)} style={{ display: "flex", gap: "4px" }}>
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={museStyles['muse-input-area']}>
              <input
                ref={inputRef}
                type="text"
                className={museStyles['muse-input']}
                placeholder="Tell me about your goal..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button className={museStyles['muse-send-btn']} onClick={handleSend} disabled={isLoading || !inputValue.trim()}>
                <SendIcon />
              </button>
            </div>
          </>
        ) : (
          <div className={museStyles['muse-body']} style={{ padding: "24px" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.5 }}>
                Your Goal
              </span>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontStyle: "italic", margin: "8px 0" }}>
                {extractedGoal?.title}
              </h3>
            </div>

            <div style={{ fontSize: "13px", lineHeight: 1.6, opacity: 0.8 }}>
              <p><strong>Specific:</strong> {extractedGoal?.specific}</p>
              <p style={{ marginTop: "8px" }}><strong>Measurable:</strong> {extractedGoal?.measurable}</p>
            </div>

            {tasks.length > 0 && (
              <div style={{ marginTop: "16px" }}>
                <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5 }}>
                  {tasks.length} Tasks
                </span>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", marginTop: "auto", paddingTop: "20px" }}>
              <button
                onClick={handleGoBack}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  border: "1px solid rgba(0,0,0,0.1)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Edit
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 2,
                  padding: "12px",
                  background: "var(--color-text)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  cursor: "pointer",
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Create Goal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Habit Form Overlay
// =============================================================================

function HabitFormOverlay({
  onSave,
  onClose,
  initialData,
  isEditing = false,
}: {
  onSave: (data: any) => void;
  onClose: () => void;
  initialData?: { name: string; whatIsHabit: string; howToPractice: string };
  isEditing?: boolean;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [whatIsHabit, setWhatIsHabit] = useState(initialData?.whatIsHabit || "");
  const [howToPractice, setHowToPractice] = useState(initialData?.howToPractice || "");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="journal-overlay active"
      style={{ background: "rgba(235, 241, 255, 0.95)" }}
    >
      <div className="w-full max-w-[500px] p-10">
        <h2 className="font-display italic text-[2rem] text-center mb-10">
          {isEditing ? "Edit Habit" : "New Habit"}
        </h2>

        <div className="space-y-6">
          <div className="input-minimal-group">
            <input
              type="text"
              className="input-minimal"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label className="input-label-floating">Habit Name</label>
          </div>

          <div className="input-minimal-group">
            <input
              type="text"
              className="input-minimal"
              placeholder="What"
              value={whatIsHabit}
              onChange={(e) => setWhatIsHabit(e.target.value)}
            />
            <label className="input-label-floating">What is this habit?</label>
          </div>

          <div className="input-minimal-group">
            <input
              type="text"
              className="input-minimal"
              placeholder="How"
              value={howToPractice}
              onChange={(e) => setHowToPractice(e.target.value)}
            />
            <label className="input-label-floating">How will you practice?</label>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-8">
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "14px",
              opacity: 0.5,
              cursor: "pointer",
            }}
            className="hover:opacity-100 transition-opacity"
          >
            CANCEL
          </button>
          <button
            onClick={() => onSave({ name, whatIsHabit, howToPractice })}
            disabled={!name}
            className="btn btn-primary disabled:opacity-50"
            style={{ padding: "16px 48px" }}
          >
            {isEditing ? "SAVE CHANGES" : "ADD HABIT"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default SprintPage;
