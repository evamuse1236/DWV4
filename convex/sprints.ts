import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function getSprintDayCounts(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  const now = new Date();

  const totalDays = Math.max(
    1,
    Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
  );

  if (now < start) {
    return { totalDays, elapsedDays: 0 };
  }

  const elapsedEnd = now > end ? end : now;
  const elapsedDays = Math.max(
    1,
    Math.floor((elapsedEnd.getTime() - start.getTime()) / MS_PER_DAY) + 1
  );

  return { totalDays, elapsedDays };
}

/**
 * Get the currently active sprint
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const sprint = await ctx.db
      .query("sprints")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();
    return sprint;
  },
});

/**
 * Get all sprints
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const sprints = await ctx.db.query("sprints").collect();
    return sprints.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  },
});

/**
 * Get a one-stop student sprint insight view for admins.
 * Includes goals, goal tasks, habits, and completion metrics per student.
 */
export const getStudentInsights = query({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    const sprint = await ctx.db.get(args.sprintId);
    if (!sprint) {
      return null;
    }

    const { totalDays, elapsedDays } = getSprintDayCounts(
      sprint.startDate,
      sprint.endDate
    );

    const students = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .collect();

    const studentInsights = await Promise.all(
      students.map(async (student) => {
        const goals = await ctx.db
          .query("goals")
          .withIndex("by_user_sprint", (q) =>
            q.eq("userId", student._id).eq("sprintId", args.sprintId)
          )
          .collect();

        const goalsWithTasks = await Promise.all(
          goals.map(async (goal) => {
            const actionItems = await ctx.db
              .query("actionItems")
              .withIndex("by_goal", (q) => q.eq("goalId", goal._id))
              .collect();

            const sortedActionItems = actionItems.sort((a, b) => {
              if (a.weekNumber !== b.weekNumber) {
                return a.weekNumber - b.weekNumber;
              }
              if (a.dayOfWeek !== b.dayOfWeek) {
                return a.dayOfWeek - b.dayOfWeek;
              }
              return a.order - b.order;
            });

            const completedTasks = sortedActionItems.filter(
              (item) => item.isCompleted
            ).length;

            return {
              _id: goal._id,
              title: goal.title,
              status: goal.status,
              tasksTotal: sortedActionItems.length,
              tasksCompleted: completedTasks,
              actionItems: sortedActionItems.map((item) => ({
                _id: item._id,
                title: item.title,
                weekNumber: item.weekNumber,
                dayOfWeek: item.dayOfWeek,
                scheduledTime: item.scheduledTime,
                isCompleted: item.isCompleted,
                order: item.order,
              })),
            };
          })
        );

        const allActionItems = goalsWithTasks.flatMap((goal) =>
          goal.actionItems.map((item) => ({
            ...item,
            goalTitle: goal.title,
          }))
        );

        const tasksTotal = allActionItems.length;
        const tasksCompleted = allActionItems.filter((item) => item.isCompleted).length;
        const tasksIncomplete = allActionItems.filter((item) => !item.isCompleted);

        const habits = await ctx.db
          .query("habits")
          .withIndex("by_user_sprint", (q) =>
            q.eq("userId", student._id).eq("sprintId", args.sprintId)
          )
          .collect();

        const habitsWithStats = await Promise.all(
          habits.map(async (habit) => {
            const completions = await ctx.db
              .query("habitCompletions")
              .withIndex("by_habit", (q) => q.eq("habitId", habit._id))
              .collect();

            const completedInSprint = completions.filter(
              (completion) =>
                completion.completed &&
                completion.date >= sprint.startDate &&
                completion.date <= sprint.endDate
            ).length;

            return {
              _id: habit._id,
              name: habit.name,
              whatIsHabit: habit.whatIsHabit,
              howToPractice: habit.howToPractice,
              completedCount: completedInSprint,
              expectedCount: elapsedDays,
              consistencyPercent: toPercent(completedInSprint, elapsedDays),
            };
          })
        );

        const goalsTotal = goalsWithTasks.length;
        const goalsCompleted = goalsWithTasks.filter(
          (goal) => goal.status === "completed"
        ).length;
        const activeGoals = goalsWithTasks.filter(
          (goal) => goal.status !== "completed"
        );

        const habitCompletedTotal = habitsWithStats.reduce(
          (sum, habit) => sum + habit.completedCount,
          0
        );
        const habitExpectedTotal = habitsWithStats.length * elapsedDays;

        const goalCompletionPercent = toPercent(goalsCompleted, goalsTotal);
        const taskCompletionPercent = toPercent(tasksCompleted, tasksTotal);
        const habitConsistencyPercent = toPercent(
          habitCompletedTotal,
          habitExpectedTotal
        );

        const scores: number[] = [];
        if (goalsTotal > 0) scores.push(goalCompletionPercent);
        if (tasksTotal > 0) scores.push(taskCompletionPercent);
        if (habitExpectedTotal > 0) scores.push(habitConsistencyPercent);
        const engagementScore =
          scores.length > 0
            ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
            : 0;

        return {
          student: {
            _id: student._id,
            displayName: student.displayName,
            username: student.username,
            batch: student.batch,
          },
          metrics: {
            goalsTotal,
            goalsCompleted,
            goalCompletionPercent,
            tasksTotal,
            tasksCompleted,
            taskCompletionPercent,
            habitsTotal: habitsWithStats.length,
            habitCompletedTotal,
            habitExpectedTotal,
            habitConsistencyPercent,
            engagementScore,
          },
          currentFocus: {
            goals: activeGoals.slice(0, 3).map((goal) => goal.title),
            tasks: tasksIncomplete.slice(0, 5),
          },
          goals: goalsWithTasks,
          habits: habitsWithStats,
        };
      })
    );

    studentInsights.sort((a, b) =>
      a.student.displayName.localeCompare(b.student.displayName)
    );

    return {
      sprint: {
        _id: sprint._id,
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        totalDays,
        elapsedDays,
      },
      students: studentInsights,
    };
  },
});

/**
 * Create a new sprint
 */
export const create = mutation({
  args: {
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Deactivate any current active sprint
    const activeSprint = await ctx.db
      .query("sprints")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (activeSprint) {
      await ctx.db.patch(activeSprint._id, { isActive: false });
    }

    const sprintId = await ctx.db.insert("sprints", {
      name: args.name,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: true,
      createdBy: args.createdBy,
    });

    return { success: true, sprintId };
  },
});

/**
 * Update a sprint
 */
export const update = mutation({
  args: {
    sprintId: v.id("sprints"),
    name: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { sprintId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(sprintId, filteredUpdates);
    return { success: true };
  },
});

/**
 * Set active sprint
 */
export const setActive = mutation({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    // Deactivate all sprints
    const allSprints = await ctx.db.query("sprints").collect();
    for (const sprint of allSprints) {
      if (sprint.isActive) {
        await ctx.db.patch(sprint._id, { isActive: false });
      }
    }

    // Activate the selected sprint
    await ctx.db.patch(args.sprintId, { isActive: true });
    return { success: true };
  },
});

/**
 * Delete a sprint
 */
export const remove = mutation({
  args: {
    sprintId: v.id("sprints"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sprintId);
    return { success: true };
  },
});
