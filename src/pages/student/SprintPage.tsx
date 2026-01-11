import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { Modal } from "../../components/paper";
import { GoalEditor } from "../../components/sprint";
import { TaskAssigner } from "../../components/student/TaskAssigner";
import { useAuth } from "../../hooks/useAuth";
import { goalStatusColors, goalStatusLabels, type GoalStatus } from "../../lib/status-utils";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

/**
 * Sprint Page - Paper UI Kanban Design
 * 3-column layout: Rituals (habits), Objectives (goals), Flow (tasks)
 */
export function SprintPage() {
  const { user } = useAuth();
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showTaskAssigner, setShowTaskAssigner] = useState(false);
  const [newGoalId, setNewGoalId] = useState<string | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");

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
  const toggleActionItem = useMutation(api.goals.toggleActionItem);
  const createHabit = useMutation(api.habits.create);
  const toggleHabitCompletion = useMutation(api.habits.toggleCompletion);

  const handleCreateGoal = async (goalData: any) => {
    if (!user || !activeSprint) return;
    const result = await createGoal({
      userId: user._id as any,
      sprintId: activeSprint._id,
      ...goalData,
    });
    setShowGoalEditor(false);

    // After goal creation, show TaskAssigner
    if (result.goalId) {
      setNewGoalId(result.goalId);
      setNewGoalTitle(goalData.title);
      setShowTaskAssigner(true);
    }
  };

  const handleToggleAction = async (itemId: string) => {
    await toggleActionItem({ itemId: itemId as any });
  };

  const handleToggleHabit = async (habitId: string, date: string) => {
    if (!user) return;
    await toggleHabitCompletion({
      habitId: habitId as any,
      userId: user._id as any,
      date,
    });
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

  // Get all action items from goals
  const allActionItems = goals?.flatMap((goal: any) =>
    (goal.actionItems || []).map((item: any) => ({
      ...item,
      goalTitle: goal.title,
    }))
  ) || [];

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
            <h2 className="text-[24px] m-0">Rituals</h2>
            <svg className="w-5 h-5 opacity-40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          {habits && habits.length > 0 ? (
            habits.map((habit: any) => (
              <div key={habit._id} className="card-white">
                <strong className="font-display text-[20px] block mb-3">{habit.name}</strong>
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
                        {isCompleted && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
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
                + Add Ritual
              </button>
            </div>
          )}

          {habits && habits.length > 0 && (
            <button
              onClick={() => setShowHabitForm(true)}
              className="w-full mt-4 py-3 border border-dashed border-black/10 rounded-xl text-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              + Add Ritual
            </button>
          )}
        </div>

        {/* COLUMN 2: Objectives (Goals) */}
        <div className="pastel-card pastel-green p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[24px] m-0">Objectives</h2>
            <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {goals && goals.length > 0 ? (
            goals.map((goal: any) => {
              const completedItems = goal.actionItems?.filter((i: any) => i.completed).length || 0;
              const totalItems = goal.actionItems?.length || 0;
              const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

              return (
                <div key={goal._id} className="card-white p-6">
                  <span
                    className={`text-[10px] font-bold tracking-[0.1em] uppercase block mb-2 ${goalStatusColors[goal.status as GoalStatus]}`}
                  >
                    {goalStatusLabels[goal.status as GoalStatus]}
                  </span>
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
              <p className="opacity-60 text-sm mb-3">No objectives yet</p>
              <button
                onClick={() => setShowGoalEditor(true)}
                className="btn btn-secondary text-xs"
              >
                + Add Objective
              </button>
            </div>
          )}

          {goals && goals.length > 0 && (
            <button
              onClick={() => setShowGoalEditor(true)}
              className="w-full mt-4 py-3 border border-dashed border-black/10 rounded-xl text-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              + Add Objective
            </button>
          )}
        </div>

        {/* COLUMN 3: Flow (Tasks) */}
        <div className="pastel-card pastel-purple p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[24px] m-0">Flow</h2>
            <svg className="w-5 h-5 opacity-40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {allActionItems.length > 0 ? (
            allActionItems.slice(0, 5).map((item: any, index: number) => (
              <motion.div
                key={item._id || index}
                whileHover={{ x: 4 }}
                className={`card-white flex gap-4 items-center cursor-pointer ${
                  item.completed ? "opacity-60" : ""
                }`}
                onClick={() => handleToggleAction(item._id)}
              >
                <div
                  className={`w-6 h-6 rounded-full border flex-shrink-0 flex items-center justify-center transition-all ${
                    item.completed
                      ? "bg-[#1a1a1a] border-[#1a1a1a]"
                      : "border-black/20"
                  }`}
                >
                  {item.completed && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className={`text-[16px] ${item.completed ? "line-through" : ""}`}>
                    {item.text}
                  </div>
                  <div className="text-[10px] mt-1 uppercase tracking-[0.05em] opacity-50">
                    {item.goalTitle} • Today
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="card-white text-center py-6">
              <p className="opacity-60 text-sm">
                Add action items to your objectives to see tasks here.
              </p>
            </div>
          )}

          {allActionItems.length > 5 && (
            <p className="text-center text-sm opacity-50 mt-4">
              +{allActionItems.length - 5} more tasks
            </p>
          )}
        </div>
      </div>

      {/* Goal Editor Modal */}
      <Modal
        isOpen={showGoalEditor}
        onClose={() => setShowGoalEditor(false)}
        title="Create Objective"
        size="lg"
      >
        <GoalEditor
          onSave={handleCreateGoal}
          onCancel={() => setShowGoalEditor(false)}
        />
      </Modal>

      {/* Habit Form Modal */}
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
}: {
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [whatIsHabit, setWhatIsHabit] = useState("");
  const [howToPractice, setHowToPractice] = useState("");

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
          New Ritual
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
            <label className="input-label-floating">Ritual Name</label>
          </div>

          <div className="input-minimal-group">
            <input
              type="text"
              className="input-minimal"
              placeholder="What"
              value={whatIsHabit}
              onChange={(e) => setWhatIsHabit(e.target.value)}
            />
            <label className="input-label-floating">What is this ritual?</label>
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
            className="bg-transparent border-none text-[14px] opacity-50 text-[#1a1a1a] cursor-pointer hover:opacity-100 transition-opacity"
          >
            CANCEL
          </button>
          <button
            onClick={() => onSave({ name, whatIsHabit, howToPractice })}
            disabled={!name}
            className="btn btn-primary disabled:opacity-50"
            style={{ padding: "16px 48px" }}
          >
            ADD RITUAL
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default SprintPage;
