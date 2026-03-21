import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GoalStatus = "not_started" | "in_progress" | "completed";

type GoalEvidence = {
  sprintId: Id<"sprints">;
  sprintName: string;
  sprintStartDate: string;
  sprintEndDate: string;
  title: string;
  specific: string;
  measurable: string;
  relevant: string;
  status: GoalStatus;
  tasksTotal: number;
  tasksCompleted: number;
};

type HabitEvidence = {
  sprintId: Id<"sprints">;
  sprintName: string;
  sprintStartDate: string;
  sprintEndDate: string;
  name: string;
  whatIsHabit: string;
  howToPractice: string;
  completedCount: number;
  expectedCount: number;
  consistencyPercent: number;
};

type StudentEvidencePacket = {
  studentId: Id<"users">;
  displayName: string;
  username: string;
  batch: string;
  sprintNames: string[];
  goals: GoalEvidence[];
  habits: HabitEvidence[];
  derived: {
    totalGoals: number;
    completedGoals: number;
    inProgressGoals: number;
    totalTasks: number;
    completedTasks: number;
    taskCompletionPercent: number;
    totalHabits: number;
    totalHabitCompletions: number;
    totalHabitExpected: number;
    habitConsistencyPercent: number;
    focusCandidates: string[];
    strongestCompletedFocus: string | null;
    weakestFollowThrough: string | null;
  };
};

type DailyGoalDraft = {
  goalHabit: string;
  wentWell: string;
  couldImprove: string;
};

type StudentDailyGoalDraft = {
  batch: string;
  studentId: Id<"users">;
  displayName: string;
  username: string;
  evidence: StudentEvidencePacket;
  draft: DailyGoalDraft;
};

const GROQ_PRIMARY_MODEL = "moonshotai/kimi-k2-instruct";
const OPENROUTER_FALLBACK_MODEL = "xiaomi/mimo-v2-flash";

function toPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function titleCaseFocus(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function topFocusCandidates(goals: GoalEvidence[], habits: HabitEvidence[]) {
  const scores = new Map<string, number>();

  for (const goal of goals) {
    const normalized = normalizeKey(goal.title);
    if (!normalized) continue;
    const completionScore =
      goal.status === "completed" ? 4 : goal.status === "in_progress" ? 2 : 1;
    const taskScore =
      goal.tasksTotal > 0 ? goal.tasksCompleted / goal.tasksTotal : 0;
    const current = scores.get(normalized) ?? 0;
    scores.set(normalized, current + completionScore + taskScore * 2);
  }

  for (const habit of habits) {
    const normalized = normalizeKey(habit.name);
    if (!normalized) continue;
    const current = scores.get(normalized) ?? 0;
    scores.set(normalized, current + 2 + habit.consistencyPercent / 40);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => titleCaseFocus(label));
}

function pickStrongestCompletedFocus(goals: GoalEvidence[], habits: HabitEvidence[]) {
  const completedGoal = [...goals]
    .filter((goal) => goal.status === "completed")
    .sort((a, b) => {
      const aRate = a.tasksTotal > 0 ? a.tasksCompleted / a.tasksTotal : 0;
      const bRate = b.tasksTotal > 0 ? b.tasksCompleted / b.tasksTotal : 0;
      return bRate - aRate;
    })[0];

  if (completedGoal) return completedGoal.title;

  const consistentHabit = [...habits].sort(
    (a, b) => b.consistencyPercent - a.consistencyPercent
  )[0];
  return consistentHabit ? consistentHabit.name : null;
}

function pickWeakestFollowThrough(goals: GoalEvidence[], habits: HabitEvidence[]) {
  const weakGoal = [...goals]
    .filter((goal) => goal.status !== "completed")
    .sort((a, b) => {
      const aRate = a.tasksTotal > 0 ? a.tasksCompleted / a.tasksTotal : 0;
      const bRate = b.tasksTotal > 0 ? b.tasksCompleted / b.tasksTotal : 0;
      return aRate - bRate;
    })[0];

  if (weakGoal) return weakGoal.title;

  const weakHabit = [...habits].sort(
    (a, b) => a.consistencyPercent - b.consistencyPercent
  )[0];
  return weakHabit ? weakHabit.name : null;
}

async function callChatAPI(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number,
  extraHeaders: Record<string, string> = {}
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 700,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Invalid AI response: no content");
  return content as string;
}

async function callAIWithFallback(messages: ChatMessage[], logPrefix: string) {
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!groqKey && !openRouterKey) {
    throw new Error(
      "No AI keys configured. Set GROQ_API_KEY and/or OPENROUTER_API_KEY in Convex env."
    );
  }

  if (groqKey) {
    try {
      console.log(`[${logPrefix}] Calling Groq`);
      return await callChatAPI(
        "https://api.groq.com/openai/v1/chat/completions",
        groqKey,
        GROQ_PRIMARY_MODEL,
        messages,
        0.2
      );
    } catch (error) {
      console.warn(
        `[${logPrefix}] Groq failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  if (openRouterKey) {
    console.log(`[${logPrefix}] Falling back to OpenRouter`);
    return await callChatAPI(
      "https://openrouter.ai/api/v1/chat/completions",
      openRouterKey,
      OPENROUTER_FALLBACK_MODEL,
      messages,
      0.2,
      {
        "HTTP-Referer": "https://deepwork-tracker.app",
        "X-Title": "Deep Work Tracker",
      }
    );
  }

  throw new Error("All AI providers failed");
}

function parseDraft(raw: string): DailyGoalDraft {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`AI response was not valid JSON: ${raw}`);
  }

  const parsed = JSON.parse(raw.slice(start, end + 1));
  const goalHabit = String(parsed.goalHabit ?? "").trim();
  const wentWell = String(parsed.wentWell ?? "").trim();
  const couldImprove = String(parsed.couldImprove ?? "").trim();

  if (!goalHabit || !wentWell || !couldImprove) {
    throw new Error(`AI response missing fields: ${raw}`);
  }

  return { goalHabit, wentWell, couldImprove };
}

function buildFallbackDraft(evidence: StudentEvidencePacket): DailyGoalDraft {
  const primaryFocus =
    evidence.derived.focusCandidates[0] ??
    evidence.goals[0]?.title ??
    evidence.habits[0]?.name ??
    "building consistency with goals and routines";

  const taskSummary =
    evidence.derived.totalTasks > 0
      ? `${evidence.derived.completedTasks} of ${evidence.derived.totalTasks} planned tasks`
      : "their tracked goals";
  const habitSummary =
    evidence.derived.totalHabits > 0
      ? `Habit consistency was ${evidence.derived.habitConsistencyPercent}% across the tracked period.`
      : "The student has started tracking goals in the system.";
  const improvementFocus =
    evidence.derived.weakestFollowThrough ??
    evidence.derived.focusCandidates[1] ??
    primaryFocus;

  return {
    goalHabit: `The child worked on ${primaryFocus.toLowerCase()} during the quarter.`,
    wentWell: `The child stayed engaged with ${taskSummary} and showed follow-through in the areas they tracked. ${habitSummary}`.trim(),
    couldImprove: `The next step is building more consistency and closure around ${improvementFocus.toLowerCase()}, especially through stronger follow-through and reflection.`,
  };
}

async function generateDraft(evidence: StudentEvidencePacket) {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content:
        "You are writing teacher-facing quarterly report notes. Use ONLY the evidence provided. Do not invent facts, achievements, or habits. Return strict JSON with keys goalHabit, wentWell, couldImprove. Keep each value concise, constructive, and specific. goalHabit should identify one main goal or habit. wentWell should be 1-2 sentences. couldImprove should be 1 sentence. Refer to the child as 'the child' or 'the student'.",
    },
    {
      role: "user",
      content: JSON.stringify(evidence),
    },
  ];

  try {
    const raw = await callAIWithFallback(
      messages,
      `daily-goals:${evidence.batch}:${evidence.displayName}`
    );
    return parseDraft(raw);
  } catch (error) {
    console.warn(
      `[daily-goals:${evidence.batch}:${evidence.displayName}] Falling back to deterministic draft: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return buildFallbackDraft(evidence);
  }
}

export const generateQ3DailyGoalsDrafts = action({
  args: {
    batches: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args): Promise<{
    generatedAt: number;
    sprintWindow: { id: Id<"sprints">; name: string; startDate: string; endDate: string }[];
    students: StudentDailyGoalDraft[];
  }> => {
    const batches = args.batches && args.batches.length > 0 ? args.batches : ["2153", "2156"];
    const sprintWindow = (await ctx.runQuery(api.sprints.getAll, {}))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 3)
      .map((sprint) => ({
        id: sprint._id,
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      }));

    const students: StudentDailyGoalDraft[] = [];

    for (const batch of batches) {
      const batchStudents = await ctx.runQuery(api.users.getByBatch, { batch });

      for (const student of batchStudents) {
        const goals: GoalEvidence[] = [];
        const habits: HabitEvidence[] = [];

        for (const sprint of sprintWindow) {
          const sprintGoals = await ctx.runQuery(api.goals.getByUserAndSprint, {
            userId: student._id,
            sprintId: sprint.id,
          });
          const sprintHabits = await ctx.runQuery(api.habits.getByUserAndSprint, {
            userId: student._id,
            sprintId: sprint.id,
          });

          for (const goal of sprintGoals) {
            const tasksTotal = goal.actionItems.length;
            const tasksCompleted = goal.actionItems.filter(
              (item) => item.isCompleted
            ).length;
            goals.push({
              sprintId: sprint.id,
              sprintName: sprint.name,
              sprintStartDate: sprint.startDate,
              sprintEndDate: sprint.endDate,
              title: goal.title,
              specific: goal.specific,
              measurable: goal.measurable,
              relevant: goal.relevant,
              status: goal.status,
              tasksTotal,
              tasksCompleted,
            });
          }

          for (const habit of sprintHabits) {
            const completedCount = habit.completions.filter(
              (completion) =>
                completion.completed &&
                completion.date >= sprint.startDate &&
                completion.date <= sprint.endDate
            ).length;
            const expectedCount =
              Math.floor(
                (new Date(`${sprint.endDate}T00:00:00`).getTime() -
                  new Date(`${sprint.startDate}T00:00:00`).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) + 1;
            habits.push({
              sprintId: sprint.id,
              sprintName: sprint.name,
              sprintStartDate: sprint.startDate,
              sprintEndDate: sprint.endDate,
              name: habit.name,
              whatIsHabit: habit.whatIsHabit,
              howToPractice: habit.howToPractice,
              completedCount,
              expectedCount,
              consistencyPercent: toPercent(completedCount, expectedCount),
            });
          }
        }

        const completedGoals = goals.filter((goal) => goal.status === "completed").length;
        const inProgressGoals = goals.filter((goal) => goal.status === "in_progress").length;
        const totalTasks = goals.reduce((sum, goal) => sum + goal.tasksTotal, 0);
        const completedTasks = goals.reduce((sum, goal) => sum + goal.tasksCompleted, 0);
        const totalHabitCompletions = habits.reduce(
          (sum, habit) => sum + habit.completedCount,
          0
        );
        const totalHabitExpected = habits.reduce(
          (sum, habit) => sum + habit.expectedCount,
          0
        );

        const evidence: StudentEvidencePacket = {
          studentId: student._id,
          displayName: student.displayName,
          username: student.username,
          batch,
          sprintNames: sprintWindow.map((sprint) => sprint.name),
          goals,
          habits,
          derived: {
            totalGoals: goals.length,
            completedGoals,
            inProgressGoals,
            totalTasks,
            completedTasks,
            taskCompletionPercent: toPercent(completedTasks, totalTasks),
            totalHabits: habits.length,
            totalHabitCompletions,
            totalHabitExpected,
            habitConsistencyPercent: toPercent(totalHabitCompletions, totalHabitExpected),
            focusCandidates: topFocusCandidates(goals, habits),
            strongestCompletedFocus: pickStrongestCompletedFocus(goals, habits),
            weakestFollowThrough: pickWeakestFollowThrough(goals, habits),
          },
        };

        const draft = await generateDraft(evidence);
        students.push({
          batch,
          studentId: student._id,
          displayName: student.displayName,
          username: student.username,
          evidence,
          draft,
        });
      }
    }

    students.sort((a, b) => {
      if (a.batch !== b.batch) return a.batch.localeCompare(b.batch);
      return a.displayName.localeCompare(b.displayName);
    });

    return {
      generatedAt: Date.now(),
      sprintWindow,
      students,
    };
  },
});
