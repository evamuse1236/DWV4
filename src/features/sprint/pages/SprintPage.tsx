import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@convex/_generated/api";
import { Modal } from "@/shared/paper";
import { GoalEditor, HabitTracker } from "@/features/sprint/components";
import { PlannerBuddy } from "@/features/sprint/components/PlannerBuddy";
import type { GoalSummary } from "@/shared/goalChat/parser";
import { TaskAssigner } from "@/features/student/components/TaskAssigner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { goalStatusLabels, type GoalStatus } from "@/shared/lib/status-utils";
import { cn } from "@/shared/lib/utils";
import styles from "@/features/sprint/styles/sprint.module.css";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
// Week runs Monday (index 0) to Sunday (index 6)
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Format a Date as YYYY-MM-DD in the user's local timezone */
function getLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Goal colors for visual distinction - Structured Serenity palette
const GOAL_COLORS = [
  { name: "sage", dot: "#7FAE8C", bg: "rgba(212, 224, 214, 0.25)", tint: "#D4E0D6", pillBg: "#D4E0D6" },
  { name: "clay", dot: "#C9A196", bg: "rgba(235, 205, 195, 0.25)", tint: "#EBCDC3", pillBg: "#EBCDC3" },
  { name: "mist", dot: "#8BA5B3", bg: "rgba(218, 228, 232, 0.25)", tint: "#DAE4E8", pillBg: "#DAE4E8" },
];

// Standalone task color (no goal association)
const STANDALONE_COLOR = {
  name: "standalone",
  dot: "#9CA3AF",  // gray-400
  bg: "rgba(156, 163, 175, 0.08)",
  tint: "rgba(156, 163, 175, 0.15)",
  pillBg: "rgba(156, 163, 175, 0.15)",
};

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

/**
 * Sprint Page - New Week View Design
 * Goals at top, 7-day week view in middle, habit tracker at bottom
 */
export function SprintPage() {
  const { user, token } = useAuth();
  const [showTaskAssigner, setShowTaskAssigner] = useState(false);
  const [newGoalId, setNewGoalId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  // Muse (AI Chat) state
  const [museExpanded, setMuseExpanded] = useState(false);

  // Week toggle state (1 or 2)
  const [activeWeek, setActiveWeek] = useState(1);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [copyingGoalId, setCopyingGoalId] = useState<string | null>(null);

  // Goal expansion state - all goals expand/collapse together
  const [goalsExpanded, setGoalsExpanded] = useState(false);

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

  // Optimistic completion state for instant checkbox feedback
  const [optimisticCompletions, setOptimisticCompletions] = useState<Record<string, boolean>>({});

  // Buddy reaction bubble events (task-done celebrations)
  const [barkEvent, setBarkEvent] = useState<{
    id: string;
    key: string;
    vars?: Record<string, string | number>;
  } | null>(null);

  // Get active sprint
  const activeSprint = useQuery(api.sprints.getActive);
  const allSprints = useQuery(api.sprints.getAll);

  // Keep selected sprint in sync with available sprint data
  useEffect(() => {
    if (!activeSprint) return;
    setSelectedSprintId((prev) => {
      if (!prev) return activeSprint._id as string;
      if (prev === (activeSprint._id as string)) return prev;
      if (!allSprints || allSprints.some((s: any) => s._id === prev)) return prev;
      return activeSprint._id as string;
    });
  }, [activeSprint?._id, allSprints]);

  const availableSprints = (allSprints && allSprints.length > 0)
    ? allSprints
    : (activeSprint ? [activeSprint] : []);

  const displayedSprint = (
    availableSprints.find((s: any) => s._id === selectedSprintId)
    || activeSprint
  );
  const isHistoryView = !!(displayedSprint && activeSprint && displayedSprint._id !== activeSprint._id);

  // Default to current week when sprint loads
  useEffect(() => {
    if (!displayedSprint) return;
    if (isHistoryView) {
      setActiveWeek(1);
      return;
    }
    const sprintStart = new Date(displayedSprint.startDate);
    const dayIndex = Math.floor((Date.now() - sprintStart.getTime()) / MS_PER_DAY);
    setActiveWeek(dayIndex < 7 ? 1 : 2);
  }, [displayedSprint?._id, isHistoryView]);

  // Get user's goals and habits for the sprint
  const goals = useQuery(
    api.goals.getByUserAndSprint,
    displayedSprint && user && token
      ? { token, userId: user._id as any, sprintId: displayedSprint._id }
      : "skip"
  );

  // Query for previous sprint goals (for AI import feature)
  const previousSprintGoals = useQuery(
    api.goals.getPreviousSprintGoals,
    activeSprint && user && token
      ? { token, userId: user._id as any, currentSprintId: activeSprint._id }
      : "skip"
  );

  // Query for standalone tasks (tasks without a goal)
  const standaloneTasksWeek1 = useQuery(
    api.goals.getStandaloneActionItems,
    user && token ? { token, userId: user._id as any, weekNumber: 1 } : "skip"
  );
  const standaloneTasksWeek2 = useQuery(
    api.goals.getStandaloneActionItems,
    user && token ? { token, userId: user._id as any, weekNumber: 2 } : "skip"
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

  const buildSmartGoalFromSummary = (goal: GoalSummary) => {
    const whenLower = goal.when.toLowerCase();
    const timesMatch = whenLower.match(/(\d+)\s*x\s*per\s*week/);
    const measurable = timesMatch
      ? `Complete ${timesMatch[1]} sessions per week.`
      : whenLower.includes("every day")
        ? "Complete the habit every day."
        : whenLower.includes("weekdays")
          ? "Complete the habit on weekdays."
          : whenLower.includes("weekends")
            ? "Complete the habit on weekends."
            : whenLower.startsWith("on ")
              ? `Complete the habit ${goal.when}.`
              : "Complete the scheduled sessions.";

    return {
      title: goal.title,
      specific: `${goal.what} — ${goal.when}, ${goal.howLong} each`,
      measurable,
      achievable: `This fits in a ${sprintDaysLeft}-day sprint.`,
      relevant: "Builds consistency toward your goals.",
      timeBound: `By the end of this ${sprintDaysLeft}-day sprint`,
    };
  };

  // Handle AI-generated goal with tasks (called from Muse)
  const handleAIGoalComplete = async (
    goal: GoalSummary,
    tasks: { title: string; weekNumber: number; dayOfWeek: number }[]
  ) => {
    if (!user || !token || !activeSprint) return;

    const smartGoal = buildSmartGoalFromSummary(goal);
    const result = await createGoal({
      token,
      userId: user._id as any,
      sprintId: activeSprint._id,
      ...smartGoal,
    });

    if (result.goalId) {
      for (const task of tasks) {
        await addActionItem({
          token,
          goalId: result.goalId as any,
          userId: user._id as any,
          title: task.title,
          weekNumber: task.weekNumber,
          dayOfWeek: task.dayOfWeek,
        });
      }
    }
  };

  // Handle AI duplicate goal action
  const handleAIDuplicateGoal = async (goalId: string) => {
    if (!activeSprint || !token) return;
    await duplicateGoal({
      token,
      goalId: goalId as any,
      targetSprintId: activeSprint._id,
      includeActionItems: true,
    });
  };

  // Handle AI import goal action
  const handleAIImportGoal = async (goalId: string) => {
    if (!activeSprint || !token) return;
    await importGoal({
      token,
      goalId: goalId as any,
      targetSprintId: activeSprint._id,
      includeActionItems: true,
    });
  };

  // Handle buddy rename-goal action
  const handleRenameGoal = async (goalId: string, title: string) => {
    if (!token) return;
    await updateGoal({
      token,
      goalId: goalId as any,
      title,
    });
  };

  const handleUpdateGoal = async (goalData: any) => {
    if (!editingGoal || !token) return;
    await updateGoal({
      token,
      goalId: editingGoal._id,
      ...goalData,
    });
    setEditingGoal(null);
  };

  const handleToggleAction = async (itemId: string, currentCompleted: boolean) => {
    if (!token) return;
    // Optimistically toggle immediately for instant feedback
    setOptimisticCompletions((prev) => ({ ...prev, [itemId]: !currentCompleted }));

    // Celebrate completions (never un-completions) with a buddy bark.
    if (!currentCompleted && !isHistoryView && displayedSprint) {
      const now = new Date();
      const jsDay = now.getDay();
      const sprintStartDate = new Date(displayedSprint.startDate);
      const sprintDayIndex = Math.floor((now.getTime() - sprintStartDate.getTime()) / MS_PER_DAY);
      const week = sprintDayIndex < 7 ? 1 : 2;
      const goalItems = (goals || []).flatMap((g: any) => g.actionItems || []);
      const standalone = [...(standaloneTasksWeek1 || []), ...(standaloneTasksWeek2 || [])];
      const todayTasks = [...goalItems, ...standalone].filter(
        (t: any) => t.weekNumber === week && t.dayOfWeek === jsDay
      );
      const doneCount = todayTasks.filter((t: any) => t.isCompleted || t._id === itemId).length;
      // "ALL OF THEM?!" needs at least a couple of tasks to feel earned.
      const allDone = todayTasks.length >= 2 && doneCount >= todayTasks.length;
      const key = allDone
        ? "task.done.allToday"
        : doneCount >= 3
          ? "task.done.multi"
          : "task.done.single";
      setBarkEvent({ id: `${itemId}-${Date.now()}`, key, vars: { tasksDoneToday: doneCount } });
    }

    try {
      await toggleActionItem({ token, itemId: itemId as any });
    } finally {
      // Clear optimistic state after server responds (real data takes over)
      setOptimisticCompletions((prev) => {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleUpdateHabit = async (data: any) => {
    if (!editingHabit || !token) return;
    await updateHabit({
      token,
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
    if (!token) return;
    await updateActionItem({
      token,
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
    if (!token) return;
    await updateGoal({
      token,
      goalId: goalId as any,
      title: goalTitleValue.trim(),
    });
    setEditingGoalTitle(null);
    setGoalTitleValue("");
  };

  // Quick add task with goal color selection (or standalone if goalId is null)
  const handleQuickAddTask = async (dayOfWeek: number, goalId: string | null) => {
    if (!user || !token || !activeSprint || isHistoryView) return;
    await addActionItem({
      token,
      goalId: goalId ? (goalId as any) : undefined,
      userId: user._id as any,
      title: goalId ? "New task" : "Quick task",
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
      if (isHistoryView) return;
      if (!token) return;

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

      if (!selectedTaskId || !activeSprint) return;

      // Get all action items for current week (from goals + standalone)
      const goalItems = (goals || []).flatMap((goal: any) =>
        (goal.actionItems || []).map((item: any) => ({
          ...item,
          goalId: goal._id,
        }))
      );
      const currentStandaloneTasks = (activeWeek === 1 ? standaloneTasksWeek1 : standaloneTasksWeek2) || [];
      const allItems = [...goalItems, ...currentStandaloneTasks];
      const weekItems = allItems.filter((item: any) => item.weekNumber === activeWeek);
      const task = weekItems.find((t: any) => t._id === selectedTaskId);
      if (!task) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        // In display order: Mon(1) Tue(2) Wed(3) Thu(4) Fri(5) Sat(6) Sun(0)
        // Moving left from Monday (JS day 1) goes to Sunday of previous week
        if (task.dayOfWeek === 1 && activeWeek > 1) {
          // Go to Sunday (day 0) of previous week
          updateActionItem({ token, itemId: task._id as any, dayOfWeek: 0, weekNumber: activeWeek - 1 });
          setActiveWeek(activeWeek - 1);
        } else {
          // Normal left movement: Mon→Sun wrap, otherwise decrement
          // JS days: Sun=0, Mon=1, Tue=2... Sat=6
          // Display order: Mon(1)→Sat(6)→Sun(0)
          let newDay: number;
          if (task.dayOfWeek === 1) newDay = 0; // Mon→Sun (can't go prev week)
          else if (task.dayOfWeek === 0) newDay = 6; // Sun→Sat
          else newDay = task.dayOfWeek - 1; // Normal decrement
          updateActionItem({ token, itemId: task._id as any, dayOfWeek: newDay });
        }
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        // Moving right from Sunday (JS day 0) goes to Monday of next week
        if (task.dayOfWeek === 0 && activeWeek < 2) {
          // Go to Monday (day 1) of next week
          updateActionItem({ token, itemId: task._id as any, dayOfWeek: 1, weekNumber: activeWeek + 1 });
          setActiveWeek(activeWeek + 1);
        } else {
          // Normal right movement: Sun→Mon wrap, otherwise increment
          let newDay: number;
          if (task.dayOfWeek === 0) newDay = 1; // Sun→Mon (can't go next week)
          else if (task.dayOfWeek === 6) newDay = 0; // Sat→Sun
          else newDay = task.dayOfWeek + 1; // Normal increment
          updateActionItem({ token, itemId: task._id as any, dayOfWeek: newDay });
        }
      } else if (e.key === "Escape") {
        setSelectedTaskId(null);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        toggleActionItem({ token, itemId: task._id as any });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (confirm("Delete this task?")) {
          removeActionItem({ token, itemId: task._id as any });
          setSelectedTaskId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedTaskId,
    activeSprint,
    isHistoryView,
    goals,
    activeWeek,
    updateActionItem,
    toggleActionItem,
    openTimeSelectTaskId,
    editingTaskTitle,
    editingGoalTitle,
    standaloneTasksWeek1,
    standaloneTasksWeek2,
    token,
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

  if (!displayedSprint) {
    return null;
  }

  const sprintDaysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(activeSprint.endDate).getTime() - Date.now()) / MS_PER_DAY
    )
  );

  // Calculate dates for the sprint
  const sprintStart = new Date(displayedSprint.startDate);
  const today = new Date();
  const todayStr = getLocalDateStr(today);

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
        date: getLocalDateStr(date),
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
  const goalActionItems = goals?.flatMap((goal: any, goalIndex: number) =>
    (goal.actionItems || []).map((item: any) => ({
      ...item,
      goalTitle: goal.title,
      goalId: goal._id,
      goalIndex, // For color coding
    }))
  ) || [];

  // Get standalone tasks for the active week
  const standaloneTasks = isHistoryView
    ? []
    : ((activeWeek === 1 ? standaloneTasksWeek1 : standaloneTasksWeek2) || []);
  const standaloneActionItems = standaloneTasks.map((item: any) => ({
    ...item,
    goalTitle: null,
    goalId: null,
    goalIndex: -1, // Marker for standalone
  }));

  // Combine goal tasks and standalone tasks
  const allActionItems = [...goalActionItems, ...standaloneActionItems];

  // Filter action items by selected week
  const weekActionItems = allActionItems.filter(
    (item: any) => item.weekNumber === activeWeek
  );

  // Group tasks by day of week
  const tasksByDay: { [key: number]: any[] } = {};
  for (let i = 0; i < 7; i++) {
    tasksByDay[i] = weekActionItems.filter((item: any) => item.dayOfWeek === i);
  }

  // Toggle all goals expansion together
  const handleGoalClick = () => {
    setGoalsExpanded((prev) => !prev);
  };

  // Open Muse for goal creation
  const handleOpenGoalChat = () => {
    setMuseExpanded(true);
  };

  const handleCopyGoalToCurrentSprint = async (goalId: string) => {
    if (!activeSprint || !token || !isHistoryView) return;
    setCopyingGoalId(goalId);
    try {
      await importGoal({
        token,
        goalId: goalId as any,
        targetSprintId: activeSprint._id,
        includeActionItems: true,
      });
    } finally {
      setCopyingGoalId(null);
    }
  };

  // Render the goals container (scrollable)
  const renderGoalsContainer = () => {
    const goalSlots = (goals || []).map((goal: any, i: number) => {
      const isExpanded = goalsExpanded;
      const isCopying = copyingGoalId === goal._id;
      const completedItems = goal.actionItems?.filter((item: any) => item.isCompleted).length || 0;
      const totalItems = goal.actionItems?.length || 0;
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      const goalColor = GOAL_COLORS[i % GOAL_COLORS.length];

      return (
        <div
          key={goal._id}
          className={cn(styles['goal-slot'], styles.filled, isExpanded && styles.expanded)}
          onClick={handleGoalClick}
          style={{ position: "relative", "--goal-tint": goalColor.tint } as React.CSSProperties}
        >
            {/* Status pill - top right */}
            <div
              style={{
                position: "absolute",
                top: "14px",
                right: "16px",
                fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                fontSize: "10px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                padding: "4px 10px",
                borderRadius: "10px",
                background: goalColor.pillBg,
                color: "#2D2420",
              }}
            >
              {goalStatusLabels[goal.status as GoalStatus]}
            </div>
            {/* Goal header - HUD style: title top left */}
            <div style={{ width: "100%", paddingRight: "80px" }}>
              {/* Goal title (inline editable) - Sans-serif, bold */}
              {!isHistoryView && editingGoalTitle === goal._id ? (
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
                    fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                    fontSize: "15px",
                    fontWeight: 600,
                    padding: "4px 8px",
                    border: "1px solid rgba(168, 197, 181, 0.5)",
                    borderRadius: "6px",
                    background: "transparent",
                    margin: 0,
                    color: "#2D2420",
                  }}
                />
              ) : (
                <h3
                  onClick={(e) => {
                    if (isHistoryView) return;
                    e.stopPropagation();
                    setEditingGoalTitle(goal._id);
                    setGoalTitleValue(goal.title);
                  }}
                  style={{
                    fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                    fontSize: "15px",
                    fontWeight: 600,
                    fontStyle: "normal",
                    margin: 0,
                    cursor: "text",
                    color: "#2D2420",
                    lineHeight: 1.3,
                  }}
                  title="Click to edit"
                >
                  {goal.title}
                </h3>
              )}
              {/* Progress bar - mini version below title */}
              {totalItems > 0 && (
                <div className={styles['goal-progress-mini']} style={{ marginTop: "10px", marginBottom: 0 }}>
                  <motion.div
                    className={styles['goal-progress-fill']}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    style={{ background: goalColor.dot }}
                  />
                </div>
              )}
            </div>

            {/* Goal Details (revealed on click) */}
            <div className={styles['goal-details']}>
              <div style={{
                fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                fontSize: "10px",
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: "#786B62",
              }}>
                Daily Actions
              </div>
              <ul className={cn(styles['action-list'], styles['action-list-scrollable'])}>
                {goal.actionItems?.map((item: any) => (
                  <ActionListItem
                    key={item._id}
                    item={item}
                    isCompleted={optimisticCompletions[item._id] ?? item.isCompleted}
                    onToggle={() => {
                      if (isHistoryView) return;
                      handleToggleAction(item._id, item.isCompleted);
                    }}
                  />
                ))}
              </ul>

              {isHistoryView ? (
                <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyGoalToCurrentSprint(goal._id);
                    }}
                    disabled={isCopying}
                    style={{
                      fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                      fontSize: "11px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#2D2420",
                      background: "transparent",
                      border: "none",
                      cursor: isCopying ? "wait" : "pointer",
                      opacity: isCopying ? 0.5 : 1,
                    }}
                    className="hover:opacity-100 transition-opacity"
                  >
                    {isCopying ? "Copying..." : "Copy to Current Sprint"}
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingGoal(goal);
                    }}
                    style={{
                      fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                      fontSize: "11px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#786B62",
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
                      if (token && confirm(`Delete "${goal.title}" and all its tasks?`)) {
                        removeGoal({ token, goalId: goal._id as any });
                      }
                    }}
                    style={{
                      fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                      fontSize: "11px",
                      fontWeight: 500,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#c44",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                    className="hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
      );
    });

    if (goalSlots.length === 0 && isHistoryView) {
      return (
        <div className={cn(styles['goals-container'], "fade-in-up delay-1")}>
          <div className={styles['goal-slot']} style={{ opacity: 0.7 }}>
            No goals were set in this sprint.
          </div>
        </div>
      );
    }

    if (!isHistoryView) {
      goalSlots.push(
        <div
          key="add-goal"
          className={styles['goal-slot']}
          onClick={handleOpenGoalChat}
          style={{
            border: "2px dashed #C0B5AD",
            background: "transparent",
            justifyContent: "center",
            alignItems: "center",
          } as React.CSSProperties}
        >
          <div style={{ opacity: 0.5, textAlign: "center" }}>
            <i className="ph ph-plus" style={{ fontSize: "20px", display: "block", color: "#786B62" }} />
            <div
              style={{
                fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                fontSize: "13px",
                fontWeight: 500,
                marginTop: "6px",
                color: "#786B62",
              }}
            >
              Set Goal
            </div>
          </div>
        </div>
      );
    }

    return <div className={cn(styles['goals-container'], "fade-in-up delay-1")}>{goalSlots}</div>;
  };

  // Render the week view
  const renderWeekView = () => (
    <div className={cn(styles['week-view-container'], "fade-in-up delay-2")}>
      <div className={styles['week-view']}>
        {weekDates.map((dayInfo) => {
          const isToday = !isHistoryView && dayInfo.date === todayStr && activeWeek === currentWeek;
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
                // Use standalone color for tasks without a goal
                const isStandalone = task.goalId === undefined || task.goalId === null;
                const taskColor = isStandalone
                  ? STANDALONE_COLOR
                  : GOAL_COLORS[task.goalIndex % GOAL_COLORS.length];
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
                      if (isHistoryView) return;
                      e.stopPropagation();
                      if (isTimeSelectOpen || editingTaskTitle === task._id) return;
                      // Select the task (completion handled by checkbox)
                      setSelectedTaskId(task._id);
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
                          {isStandalone ? "Quick Task" : task.goalTitle}
                      </div>
                      {isHistoryView ? (
                        <div
                          style={{
                            fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "#786B62",
                            opacity: displayTimeValue ? 0.8 : 0.4,
                          }}
                        >
                          {displayTimeValue || "time"}
                        </div>
                      ) : (
                        /* Editable time field */
                        <div onClick={(e) => e.stopPropagation()} title="Set time">
                          <Select
                            value={selectValue}
                            open={isTimeSelectOpen}
                            onOpenChange={(open) => setOpenTimeSelectTaskId(open ? task._id : null)}
                            onValueChange={async (selectedValue) => {
                              if (!token) return;
                              const newTime = selectedValue === NO_TIME_VALUE ? "" : selectedValue;
                              if (newTime === displayTimeValue) return;

                              // Optimistically update UI
                              setTimeSaveErrorTaskId(null);
                              setOptimisticTaskTimes((prev) => ({ ...prev, [task._id]: newTime }));

                              // Persist to server
                              try {
                                await updateActionItem({
                                  token,
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
                      )}
                    </div>
                      {/* Task title (inline editable) - Sans-serif, no strikethrough */}
                      {!isHistoryView && editingTaskTitle === task._id ? (
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
                            fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                            fontSize: "14px",
                            fontWeight: 500,
                            padding: "2px 4px",
                            border: "1px solid rgba(168, 197, 181, 0.5)",
                            borderRadius: "4px",
                            background: "transparent",
                            color: "#2D2420",
                          }}
                        />
                      ) : isHistoryView ? (
                        <div
                          style={{
                            fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                            fontSize: "14px",
                            fontWeight: 500,
                            color: task.isCompleted ? "#786B62" : "#2D2420",
                            textDecoration: task.isCompleted ? "line-through" : "none",
                            lineHeight: 1.4,
                          }}
                        >
                          {task.title}
                        </div>
                      ) : (
                        <TaskTitleDisplay
                          task={task}
                          isCompleted={optimisticCompletions[task._id] ?? task.isCompleted}
                          onToggle={() => handleToggleAction(task._id, task.isCompleted)}
                          onEditStart={() => {
                            setEditingTaskTitle(task._id);
                            setTaskTitleValue(task.title);
                          }}
                        />
                      )}
                      {/* Selection hint */}
                      {isSelected && !isHistoryView && (
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

              {/* Quick add task button - always show (can add standalone tasks even without goals) */}
              {user && !isHistoryView && (
                <div style={{ marginTop: "auto", paddingTop: "12px" }}>
                  {showingAddTaskForDay === dayInfo.dayOfWeek ? (
                    <div className={styles['quick-add-goals']}>
                      {goals?.map((goal: any, idx: number) => (
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
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#fff",
                          }}
                          title={goal.title}
                        >
                          {idx + 1}
                        </motion.button>
                      ))}
                      {/* Standalone task button (gray "+") */}
                      <motion.button
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleQuickAddTask(dayInfo.dayOfWeek, null)}
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: STANDALONE_COLOR.dot,
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#fff",
                        }}
                        title="Quick task (no goal)"
                      >
                        +
                      </motion.button>
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
      {/* Header - Serif title with sans-serif label */}
      <div className="fade-in-up" style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <span
            style={{
              display: "block",
              marginBottom: "8px",
              fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontSize: "11px",
              fontWeight: 600,
              color: "#786B62",
            }}
          >
            {isHistoryView ? "Sprint Archive" : "Sprint Cycle"}
          </span>
          <h1 style={{
            fontFamily: "var(--font-display, 'Fraunces', serif)",
            fontSize: "2.75rem",
            fontWeight: 400,
            fontStyle: "italic",
            margin: 0,
            lineHeight: 1,
            color: "#2D2420",
          }}>
            {displayedSprint.name}
          </h1>
        </div>

        {/* Sprint picker + Week Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Select
            value={displayedSprint._id}
            onValueChange={(value) => {
              setSelectedTaskId(null);
              setSelectedSprintId(value);
            }}
          >
            <SelectTrigger className="min-w-[220px] h-10">
              <SelectValue placeholder="Choose sprint" />
            </SelectTrigger>
            <SelectContent>
              {availableSprints.map((sprint: any) => (
                <SelectItem key={sprint._id} value={sprint._id}>
                  {sprint.name}
                  {sprint._id === activeSprint._id ? " (Current)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      {isHistoryView && (
        <div
          className="fade-in-up"
          style={{
            marginTop: "-14px",
            marginBottom: "20px",
            fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
            fontSize: "12px",
            letterSpacing: "0.02em",
            color: "#786B62",
          }}
        >
          Read-only view. Use "Copy to Current Sprint" inside a goal to bring it into {activeSprint.name}.
        </div>
      )}

      {/* Goals Container */}
      {renderGoalsContainer()}

      {/* Week View */}
      {renderWeekView()}

      {/* Habit Tracker */}
      {user && !isHistoryView && activeSprint && (
        <HabitTracker
          token={token}
          userId={user._id as any}
          sprintId={activeSprint._id}
          weekDates={weekDates}
        />
      )}

      {/* The Buddy: character dialogue companion */}
      {!isHistoryView && (
        <PlannerBuddy
          userId={user ? (user._id as string) : null}
          kidName={user?.displayName}
          expanded={museExpanded}
          onToggle={() => setMuseExpanded(!museExpanded)}
          onClose={() => setMuseExpanded(false)}
          sprintDaysRemaining={sprintDaysLeft}
          onGoalComplete={handleAIGoalComplete}
          existingGoals={goals?.map((g: any) => ({ id: g._id, title: g.title })) || []}
          previousSprintGoals={previousSprintGoals?.map((g: any) => ({ id: g._id, title: g.title, sprintName: g.sprintName })) || []}
          onDuplicateGoal={handleAIDuplicateGoal}
          onImportGoal={handleAIImportGoal}
          onRenameGoal={handleRenameGoal}
          barkEvent={barkEvent}
        />
      )}

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
        {showTaskAssigner && newGoalId && user && token && (
          <TaskAssigner
            token={token}
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
// ActionListItem: Checkbox item in goal's expanded action list
// =============================================================================

interface ActionListItemProps {
  item: { _id: string; title: string };
  isCompleted: boolean;
  onToggle: () => void;
}

function ActionListItem({ item, isCompleted, onToggle }: ActionListItemProps) {
  return (
    <li className={cn(styles['action-item'], isCompleted && styles.done)}>
      <motion.div
        className={cn(styles['task-checkbox'], styles['checkbox-sm'], isCompleted && styles.completed)}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        whileTap={{ scale: 0.9 }}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <span style={{ textDecoration: isCompleted ? "line-through" : "none" }}>{item.title}</span>
    </li>
  );
}

// =============================================================================
// TaskTitleDisplay: Extracted component for task title with checkbox
// =============================================================================

interface TaskTitleDisplayProps {
  task: { _id: string; title: string };
  isCompleted: boolean;
  onToggle: () => void;
  onEditStart: () => void;
}

function TaskTitleDisplay({ task, isCompleted, onToggle, onEditStart }: TaskTitleDisplayProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <motion.div
        className={cn(styles['task-checkbox'], isCompleted && styles.completed)}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        whileTap={{ scale: 0.9 }}
        title={isCompleted ? "Mark incomplete" : "Mark complete"}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          onEditStart();
        }}
        style={{
          fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
          fontSize: "14px",
          fontWeight: 500,
          color: isCompleted ? "#786B62" : "#2D2420",
          textDecoration: isCompleted ? "line-through" : "none",
          cursor: "text",
          lineHeight: 1.4,
        }}
        title="Click to edit"
      >
        {task.title}
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
