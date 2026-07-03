import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { cn } from "@/shared/lib/utils";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function getLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseSprintDate(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Today — the first screen after check-in. The student's daily ritual:
 * how I feel, what my goals are, what I'm doing today, which habits I'm
 * keeping, and what's waiting on me.
 */
export function TodayPage() {
  const { user, token } = useAuth();
  const [newTask, setNewTask] = useState("");
  const [optimisticTasks, setOptimisticTasks] = useState<Record<string, boolean>>({});
  const [optimisticHabits, setOptimisticHabits] = useState<Record<string, boolean>>({});

  const userArgs = user && token ? { token, userId: user._id as any } : "skip";

  const activeSprint = useQuery(api.sprints.getActive);
  const todayCheckIn = useQuery(api.emotions.getTodayCheckIn, userArgs) as any;
  const goals = useQuery(
    api.goals.getByUserAndSprint,
    user && token && activeSprint
      ? { token, userId: user._id as any, sprintId: activeSprint._id }
      : "skip"
  ) as any[] | undefined;
  const habits = useQuery(
    api.habits.getByUserAndSprint,
    user && token && activeSprint
      ? { token, userId: user._id as any, sprintId: activeSprint._id }
      : "skip"
  ) as any[] | undefined;

  const [today] = useState(() => new Date());
  const todayStr = getLocalDateStr(today);

  // Where are we inside the sprint?
  const sprintDay = useMemo(() => {
    if (!activeSprint) return null;
    const start = parseSprintDate(activeSprint.startDate);
    const dayIndex = Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY);
    if (dayIndex < 0 || dayIndex > 13) return null;
    return {
      weekNumber: dayIndex < 7 ? 1 : 2,
      dayOfWeek: today.getDay(),
      dayIndex,
    };
  }, [activeSprint, today]);

  const todayTasks = useQuery(
    api.goals.getActionItemsByDay,
    user && token && sprintDay
      ? {
          token,
          userId: user._id as any,
          weekNumber: sprintDay.weekNumber,
          dayOfWeek: sprintDay.dayOfWeek,
        }
      : "skip"
  ) as any[] | undefined;

  const habitCompletions = useQuery(
    api.habits.getCompletionsInRange,
    user && token
      ? { token, userId: user._id as any, startDate: todayStr, endDate: todayStr }
      : "skip"
  ) as any[] | undefined;

  const treeData = useQuery(api.objectives.getTreeData, userArgs) as any;
  const currentBook = useQuery(api.books.getCurrentlyReading, userArgs) as any;

  const toggleActionItem = useMutation(api.goals.toggleActionItem);
  const addActionItem = useMutation(api.goals.addActionItem);
  const toggleHabit = useMutation(api.habits.toggleCompletion);

  const completedHabitIds = useMemo(() => {
    const set = new Set<string>();
    for (const completion of habitCompletions ?? []) {
      if (completion.completed) set.add(String(completion.habitId));
    }
    return set;
  }, [habitCompletions]);

  const assignmentNudges = useMemo(() => {
    const majorsByDomain = treeData?.majorsByDomain ?? {};
    const waiting: any[] = [];
    const sentBack: any[] = [];
    for (const domain of treeData?.domains ?? []) {
      for (const entry of majorsByDomain[domain._id] ?? []) {
        const status = entry.assignment?.status;
        if (status === "rejected") {
          sentBack.push({ domain, major: entry.majorObjective });
        } else if (status === "submitted" || status === "viva_requested") {
          waiting.push({ domain, major: entry.majorObjective });
        }
      }
    }
    return { waiting, sentBack };
  }, [treeData]);

  const isTaskDone = (task: any) =>
    task._id in optimisticTasks ? optimisticTasks[task._id] : task.isCompleted;
  const isHabitDone = (habitId: string) =>
    habitId in optimisticHabits
      ? optimisticHabits[habitId]
      : completedHabitIds.has(habitId);

  const handleToggleTask = (task: any) => {
    if (!token || !user) return;
    setOptimisticTasks((prev) => ({ ...prev, [task._id]: !isTaskDone(task) }));
    toggleActionItem({ token, itemId: task._id }).finally(() =>
      setOptimisticTasks((prev) => {
        const next = { ...prev };
        delete next[task._id];
        return next;
      })
    );
  };

  const handleToggleHabit = (habitId: string) => {
    if (!token || !user) return;
    setOptimisticHabits((prev) => ({ ...prev, [habitId]: !isHabitDone(habitId) }));
    toggleHabit({ token, habitId: habitId as any, userId: user._id as any, date: todayStr }).finally(
      () =>
        setOptimisticHabits((prev) => {
          const next = { ...prev };
          delete next[habitId];
          return next;
        })
    );
  };

  const handleAddTask = async () => {
    const title = newTask.trim();
    if (!title || !token || !user || !sprintDay) return;
    setNewTask("");
    await addActionItem({
      token,
      userId: user._id as any,
      title,
      weekNumber: sprintDay.weekNumber,
      dayOfWeek: sprintDay.dayOfWeek,
    });
  };

  const firstName = user?.displayName?.split(" ")[0] || "there";
  const doneCount = (todayTasks ?? []).filter((t) => isTaskDone(t)).length;

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div className="fade-in-up">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--color-taupe)]">
          The daily ritual ·{" "}
          {today.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="mt-1">
          {getGreeting()},<br />
          <span className="italic text-[var(--color-taupe)]">{firstName}.</span>
        </h1>
        {todayCheckIn?.category && (
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-1.5 text-sm text-[var(--color-espresso)] shadow-sm backdrop-blur"
            style={
              todayCheckIn.category.color
                ? { backgroundColor: `${todayCheckIn.category.color}33` }
                : undefined
            }
          >
            <span>{todayCheckIn.category.emoji}</span>
            <span>
              Feeling {todayCheckIn.subcategory?.name?.toLowerCase() ??
                todayCheckIn.category.name?.toLowerCase()}
            </span>
          </div>
        )}
      </div>

      {/* Sent-back assignments demand attention first */}
      {assignmentNudges.sentBack.length > 0 && (
        <div className="fade-in-up delay-1 space-y-2">
          {assignmentNudges.sentBack.map(({ major }) => (
            <Link
              key={major._id}
              to={`/deep-work/mastery/${major._id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-5 py-3.5 transition-transform hover:-translate-y-0.5"
            >
              <span className="text-sm text-rose-900">
                <span className="font-semibold">Your coach sent back</span> “{major.title}” —
                read the note and try again.
              </span>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.1em] text-rose-700">
                Open →
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Today's plan */}
        <div className="fade-in-up delay-1 glass-card flex flex-col p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-2xl italic text-[var(--color-espresso)]">
              Today&apos;s plan
            </h2>
            {sprintDay && (todayTasks?.length ?? 0) > 0 && (
              <span className="text-xs text-[var(--color-taupe)]">
                {doneCount}/{todayTasks!.length} done
              </span>
            )}
          </div>

          {!activeSprint ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
              <span className="text-3xl">🌤️</span>
              <p className="font-display text-lg italic text-[var(--color-taupe)]">
                Between sprints — a breath before the next cycle.
              </p>
              <p className="text-sm text-[var(--color-taupe)]/80">
                Your coach will open the next sprint soon.
              </p>
            </div>
          ) : !sprintDay ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
              <span className="text-3xl">📅</span>
              <p className="text-sm text-[var(--color-taupe)]">
                Today falls outside the current sprint —{" "}
                <Link to="/sprint" className="underline underline-offset-4">
                  open the planner
                </Link>{" "}
                to look ahead.
              </p>
            </div>
          ) : (
            <>
              <ul className="mt-4 flex-1 space-y-2">
                {(todayTasks ?? []).length === 0 && (
                  <li className="rounded-xl border border-dashed border-[var(--color-add-btn)] px-4 py-6 text-center text-sm text-[var(--color-taupe)]">
                    Nothing planned yet — what will you do today?
                  </li>
                )}
                {(todayTasks ?? []).map((task) => {
                  const done = isTaskDone(task);
                  return (
                    <li
                      key={task._id}
                      className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-2.5"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={done}
                        aria-label={`Mark ${task.title} as ${done ? "not done" : "done"}`}
                        onClick={() => handleToggleTask(task)}
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          done
                            ? "border-[var(--color-espresso)] bg-[var(--color-espresso)] text-white"
                            : "border-[var(--color-divider)] bg-white hover:border-[var(--color-taupe)]"
                        )}
                      >
                        {done && <span className="text-[10px] leading-none">✓</span>}
                      </button>
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-sm",
                          done
                            ? "text-[var(--color-taupe)] line-through"
                            : "text-[var(--color-espresso)]"
                        )}
                      >
                        {task.title}
                      </span>
                      {task.goal?.title && (
                        <span className="hidden shrink-0 rounded-full bg-[var(--color-ss-mist)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-espresso)] sm:inline">
                          {task.goal.title}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 flex items-center gap-2">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleAddTask();
                  }}
                  placeholder="Add something for today…"
                  className="flex-1 rounded-xl border border-[var(--color-divider)] bg-white/80 px-4 py-2.5 text-sm outline-none placeholder:text-[var(--color-add-btn)] focus:border-[var(--color-taupe)]"
                />
                <button
                  type="button"
                  onClick={() => void handleAddTask()}
                  disabled={!newTask.trim()}
                  className="rounded-xl bg-[var(--color-espresso)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-black disabled:opacity-40"
                >
                  Add
                </button>
              </div>
              <Link
                to="/sprint"
                className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-taupe)] underline-offset-4 hover:underline"
              >
                Open the full planner →
              </Link>
            </>
          )}
        </div>

        <div className="space-y-6">
          {/* Goals */}
          <div className="fade-in-up delay-2 glass-card p-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl italic text-[var(--color-espresso)]">
                My goals
              </h2>
              <Link
                to="/sprint"
                className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-taupe)] underline-offset-4 hover:underline"
              >
                {(goals ?? []).length > 0 ? "Edit" : "Set one"}
              </Link>
            </div>
            <ul className="mt-4 space-y-2">
              {(goals ?? []).length === 0 && (
                <li className="rounded-xl border border-dashed border-[var(--color-add-btn)] px-4 py-5 text-center text-sm text-[var(--color-taupe)]">
                  No goals for this sprint yet.
                </li>
              )}
              {(goals ?? []).map((goal) => (
                <li
                  key={goal._id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white/60 px-4 py-2.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--color-espresso)]">
                    {goal.title}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                      goal.status === "completed"
                        ? "bg-[var(--color-ss-sage)] text-[var(--color-espresso)]"
                        : goal.status === "in_progress"
                          ? "bg-[var(--color-ss-mist)] text-[var(--color-espresso)]"
                          : "bg-black/5 text-[var(--color-taupe)]"
                    )}
                  >
                    {goal.status === "completed"
                      ? "Done"
                      : goal.status === "in_progress"
                        ? "Going"
                        : "New"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Habits */}
          <div className="fade-in-up delay-3 glass-card p-6">
            <h2 className="font-display text-2xl italic text-[var(--color-espresso)]">
              Habits today
            </h2>
            <ul className="mt-4 space-y-2">
              {(habits ?? []).length === 0 && (
                <li className="rounded-xl border border-dashed border-[var(--color-add-btn)] px-4 py-5 text-center text-sm text-[var(--color-taupe)]">
                  No rituals yet —{" "}
                  <Link to="/sprint" className="underline underline-offset-4">
                    start one
                  </Link>
                  .
                </li>
              )}
              {(habits ?? []).map((habit) => {
                const done = isHabitDone(String(habit._id));
                return (
                  <li key={habit._id} className="flex items-center gap-3 rounded-xl bg-white/60 px-4 py-2.5">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={done}
                      aria-label={`Mark habit ${habit.name} as ${done ? "not done" : "done"} today`}
                      onClick={() => handleToggleHabit(String(habit._id))}
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all",
                        done
                          ? "border-[#8da4ef] bg-[#8da4ef] text-white"
                          : "border-[var(--color-divider)] bg-white hover:border-[#8da4ef]"
                      )}
                    >
                      {done && <span className="text-[11px] leading-none">✓</span>}
                    </button>
                    <span
                      className={cn(
                        "text-sm",
                        done ? "text-[var(--color-taupe)]" : "text-[var(--color-espresso)]"
                      )}
                    >
                      {habit.name}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Nudges */}
          <div className="fade-in-up delay-4 space-y-3">
            {assignmentNudges.waiting.length > 0 && (
              <div className="rounded-2xl border border-[var(--color-divider)] bg-white/60 px-5 py-3.5 text-sm text-[var(--color-taupe)]">
                <span className="mr-1">⏳</span>
                {assignmentNudges.waiting.length === 1
                  ? `“${assignmentNudges.waiting[0].major.title}” is waiting on your coach.`
                  : `${assignmentNudges.waiting.length} assignments are waiting on your coach.`}
              </div>
            )}
            <Link
              to="/deep-work"
              className="block rounded-2xl border border-[var(--color-divider)] bg-white/60 px-5 py-3.5 text-sm text-[var(--color-espresso)] transition-transform hover:-translate-y-0.5"
            >
              <span className="mr-1">🗺️</span> Continue your assignments →
            </Link>
            {currentBook?.book?.title && (
              <Link
                to="/reading"
                className="block rounded-2xl border border-[var(--color-divider)] bg-white/60 px-5 py-3.5 text-sm text-[var(--color-espresso)] transition-transform hover:-translate-y-0.5"
              >
                <span className="mr-1">📖</span> Keep reading{" "}
                <span className="font-display italic">{currentBook.book.title}</span> →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TodayPage;
