import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { Modal } from "../../components/paper";
import { GoalChatPalette, GoalEditor } from "../../components/sprint";
import { TaskAssigner } from "../../components/student/TaskAssigner";
import { useAuth } from "../../hooks/useAuth";
import { goalStatusColors, goalStatusLabels, type GoalStatus } from "../../lib/status-utils";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Shared button style for transparent "ghost" buttons
const GHOST_BUTTON_STYLE =
  "bg-transparent border-none text-[14px] opacity-50 text-[#1a1a1a] cursor-pointer hover:opacity-100 transition-opacity";

// Get the appropriate border/background classes for habit tracking buttons
function getHabitButtonStyle(isCompleted: boolean, isToday: boolean): string {
  if (isCompleted) {
    return "bg-[#1a1a1a] border-[#1a1a1a] text-white";
  }
  if (isToday) {
    return "border-[#1a1a1a] border-2";
  }
  return "border-black/20";
}

// Edit icon SVG component
function EditIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

// Checkmark icon SVG component
function CheckIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

/**
 * Sprint Page - Paper UI Kanban Design
 * 3-column layout: Rituals (habits), Objectives (goals), Flow (tasks)
 */
export function SprintPage() {
  const { user } = useAuth();
  const [showGoalChat, setShowGoalChat] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showTaskAssigner, setShowTaskAssigner] = useState(false);
  const [newGoalId, setNewGoalId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");

  // Edit states
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  // Inline edit state for action items (stores item ID being edited)
  const [inlineEditItemId, setInlineEditItemId] = useState<string | null>(null);
  const [inlineEditTitle, setInlineEditTitle] = useState("");

  // Get active sprint
  const activeSprint = useQuery(api.sprints.getActive);

  // Get user's goals and habits for the sprint
  const goals = useQuery(
    api.goals.getByUserAndSprint,
    activeSprint && user
      ? { userId: user._id as any, sprintId: activeSprint._id }
      : "skip"
  );

  const habits = useQuery(
    api.habits.getByUserAndSprint,
    activeSprint && user
      ? { userId: user._id as any, sprintId: activeSprint._id }
      : "skip"
  );

  // Mutations
  const createGoal = useMutation(api.goals.create);
  const updateGoal = useMutation(api.goals.update);
  const toggleActionItem = useMutation(api.goals.toggleActionItem);
  const updateActionItem = useMutation(api.goals.updateActionItem);
  const createHabit = useMutation(api.habits.create);
  const updateHabit = useMutation(api.habits.update);
  const toggleHabitCompletion = useMutation(api.habits.toggleCompletion);

  const addActionItem = useMutation(api.goals.addActionItem);

  // Handle AI-generated goal with tasks
  const handleAIGoalComplete = async (
    goal: { title: string; specific: string; measurable: string; achievable: string; relevant: string; timeBound: string },
    tasks: { title: string; weekNumber: number; dayOfWeek: number }[]
  ) => {
    if (!user || !activeSprint) return;

    // Create the goal
    const result = await createGoal({
      userId: user._id as any,
      sprintId: activeSprint._id,
      ...goal,
    });

    // Create all action items
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

    setShowGoalChat(false);
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

  const handleUpdateActionItem = async () => {
    if (!inlineEditItemId || !inlineEditTitle.trim()) return;
    await updateActionItem({
      itemId: inlineEditItemId as any,
      title: inlineEditTitle.trim(),
    });
    setInlineEditItemId(null);
    setInlineEditTitle("");
  };

  const startInlineEdit = (item: any) => {
    setInlineEditItemId(item._id);
    setInlineEditTitle(item.title);
  };

  const cancelInlineEdit = () => {
    setInlineEditItemId(null);
    setInlineEditTitle("");
  };

  const handleToggleHabit = async (habitId: string, date: string) => {
    if (!user) return;
    await toggleHabitCompletion({
      habitId: habitId as any,
      userId: user._id as any,
      date,
    });
  };

  const handleUpdateHabit = async (data: any) => {
    if (!editingHabit) return;
    await updateHabit({
      habitId: editingHabit._id as any,
      ...data,
    });
    setEditingHabit(null);
  };

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

  // Get today's day index for habit tracking (0 = first day of sprint)
  const sprintStart = new Date(activeSprint.startDate);
  const today = new Date();
  const dayIndex = Math.floor(
    (today.getTime() - sprintStart.getTime()) / MS_PER_DAY
  );

  // Generate dates for the week
  const getWeekDates = () => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(sprintStart);
      date.setDate(date.getDate() + Math.max(0, dayIndex - 3) + i);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  // Calculate current week (1 or 2) and day of week for task filtering
  const currentWeek = dayIndex < 7 ? 1 : 2;
  const currentDayOfWeek = today.getDay(); // 0=Sunday through 6=Saturday

  // Get all action items from goals
  const allActionItems = goals?.flatMap((goal: any) =>
    (goal.actionItems || []).map((item: any) => ({
      ...item,
      goalTitle: goal.title,
    }))
  ) || [];

  // Filter to only show today's tasks
  const todayActionItems = allActionItems.filter(
    (item: any) => item.weekNumber === currentWeek && item.dayOfWeek === currentDayOfWeek
  );

  return (
    <div>
      {/* Header */}
      <div className="fade-in-up mb-[50px] flex justify-between items-end">
        <div>
          <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] block mb-[10px] font-body">
            Current Cycle
          </span>
          <h1 className="text-[3.5rem] m-0 leading-none">{activeSprint.name}</h1>
        </div>
        <div className="text-right">
          <div className="text-[32px] font-display italic">{String(sprintDaysLeft).padStart(2, "0")}</div>
          <div className="text-[11px] uppercase tracking-[0.1em] opacity-60">Days Left</div>
        </div>
      </div>

      {/* Kanban Grid */}
      <div className="kanban-grid fade-in-up delay-1">
        {/* COLUMN 1: Rituals (Habits) */}
        <div className="pastel-card pastel-blue p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[24px] m-0">Habits</h2>
            <svg className="w-5 h-5 opacity-40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          {habits && habits.length > 0 ? (
            habits.map((habit: any) => (
              <div key={habit._id} className="card-white group">
                <div className="flex justify-between items-start mb-3">
                  <strong className="font-display text-[20px] block">{habit.name}</strong>
                  <button
                    onClick={() => setEditingHabit(habit)}
                    className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1"
                    title="Edit habit"
                  >
                    <EditIcon />
                  </button>
                </div>
                <div className="flex gap-2">
                  {weekDates.map((date) => {
                    const isCompleted = habit.completions?.some(
                      (c: any) => c.date === date && c.completed
                    );
                    const isToday = date === today.toISOString().split("T")[0];

                    return (
                      <motion.button
                        key={date}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleHabit(habit._id, date)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center cursor-pointer transition-all ${getHabitButtonStyle(isCompleted, isToday)}`}
                      >
                        {isCompleted && <CheckIcon />}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="card-white text-center py-6">
              <p className="opacity-60 text-sm mb-3">No habits yet</p>
              <button
                onClick={() => setShowHabitForm(true)}
                className="btn btn-secondary text-xs"
              >
                + Add Habit
              </button>
            </div>
          )}

          {habits && habits.length > 0 && (
            <button
              onClick={() => setShowHabitForm(true)}
              className="w-full mt-4 py-3 border border-dashed border-black/10 rounded-xl text-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              + Add Habit
            </button>
          )}
        </div>

        {/* COLUMN 2: Objectives (Goals) */}
        <div className="pastel-card pastel-green p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[24px] m-0">Goals</h2>
            <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {goals && goals.length > 0 ? (
            goals.map((goal: any) => {
              const completedItems = goal.actionItems?.filter((i: any) => i.isCompleted).length || 0;
              const totalItems = goal.actionItems?.length || 0;
              const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

              return (
                <div key={goal._id} className="card-white p-6 group">
                  <div className="flex justify-between items-start mb-2">
                    <span
                      className={`text-[10px] font-bold tracking-[0.1em] uppercase ${goalStatusColors[goal.status as GoalStatus]}`}
                    >
                      {goalStatusLabels[goal.status as GoalStatus]}
                    </span>
                    <button
                      onClick={() => setEditingGoal(goal)}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1"
                      title="Edit goal"
                    >
                      <EditIcon />
                    </button>
                  </div>
                  <h3 className="font-display text-[24px] mb-4">{goal.title}</h3>
                  <div className="h-2 bg-black/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      className="h-full bg-[#15803d]/60 rounded-full"
                    />
                  </div>
                  {totalItems > 0 && (
                    <p className="text-[10px] mt-2 opacity-50 uppercase tracking-wide">
                      {completedItems}/{totalItems} tasks
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="card-white text-center py-6">
              <p className="opacity-60 text-sm mb-3">No goals yet</p>
              <button
                onClick={() => setShowGoalChat(true)}
                className="btn btn-secondary text-xs"
              >
                + Add Goal
              </button>
            </div>
          )}

          {goals && goals.length > 0 && (
            <button
              onClick={() => setShowGoalChat(true)}
              className="w-full mt-4 py-3 border border-dashed border-black/10 rounded-xl text-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              + Add Goal
            </button>
          )}
        </div>

        {/* COLUMN 3: Flow (Tasks) */}
        <div className="pastel-card pastel-purple p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[24px] m-0">Actions</h2>
            <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {todayActionItems.length > 0 ? (
            todayActionItems.slice(0, 5).map((item: any, index: number) => {
              const isEditing = inlineEditItemId === item._id;
              
              return (
                <motion.div
                  key={item._id || index}
                  whileHover={isEditing ? {} : { x: 4 }}
                  className={`card-white flex gap-4 items-center group ${
                    item.isCompleted ? "opacity-60" : ""
                  }`}
                >
                  <div
                    onClick={() => !isEditing && handleToggleAction(item._id)}
                    className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center cursor-pointer transition-all ${
                      item.isCompleted
                        ? "bg-[#1a1a1a] border-[#1a1a1a]"
                        : "border-black/20"
                    }`}
                  >
                    {item.isCompleted && <CheckIcon className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={inlineEditTitle}
                        onChange={(e) => setInlineEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleUpdateActionItem();
                          } else if (e.key === "Escape") {
                            cancelInlineEdit();
                          }
                        }}
                        onBlur={() => {
                          // Save on blur if there's a change
                          if (inlineEditTitle.trim() && inlineEditTitle !== item.title) {
                            handleUpdateActionItem();
                          } else {
                            cancelInlineEdit();
                          }
                        }}
                        autoFocus
                        className="w-full text-[16px] bg-transparent border-b border-[#1a1a1a]/30 focus:border-[#1a1a1a] outline-none py-1"
                      />
                    ) : (
                      <div className={`text-[16px] ${item.isCompleted ? "line-through" : ""}`}>
                        {item.title}
                      </div>
                    )}
                    <div className="text-[10px] mt-1 uppercase tracking-[0.05em] opacity-50">
                      {item.goalTitle} • Today
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startInlineEdit(item);
                      }}
                      className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 flex-shrink-0"
                      title="Edit task"
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </motion.div>
              );
            })
          ) : (
            <div className="card-white text-center py-6">
              <p className="opacity-60 text-sm">
                Add action items to your objectives to see tasks here.
              </p>
            </div>
          )}

          {todayActionItems.length > 5 && (
            <p className="text-center text-sm opacity-50 mt-4">
              +{todayActionItems.length - 5} more tasks
            </p>
          )}
        </div>
      </div>

      {/* AI Goal Chat */}
      <AnimatePresence>
        {showGoalChat && (
          <GoalChatPalette
            sprintDaysRemaining={sprintDaysLeft}
            onComplete={handleAIGoalComplete}
            onCancel={() => setShowGoalChat(false)}
          />
        )}
      </AnimatePresence>

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

      {/* Create Habit Form Modal */}
      <AnimatePresence>
        {showHabitForm && (
          <HabitFormOverlay
            onSave={async (data) => {
              if (!user || !activeSprint) return;
              await createHabit({
                userId: user._id as any,
                sprintId: activeSprint._id,
                ...data,
              });
              setShowHabitForm(false);
            }}
            onClose={() => setShowHabitForm(false)}
          />
        )}
      </AnimatePresence>

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

      {/* Task Assigner Modal - shown after goal creation */}
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

// Habit form as an overlay matching Paper UI style
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
          <button onClick={onClose} className={GHOST_BUTTON_STYLE}>
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
