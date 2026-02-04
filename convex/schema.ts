import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============ USERS & AUTH ============
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("student"), v.literal("admin")),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    batch: v.optional(v.string()), // Student class grouping: "2156", "2153", etc.
    createdAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_username", ["username"])
    .index("by_role", ["role"])
    .index("by_batch", ["batch"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  // ============ EMOTIONAL CHECK-INS ============
  emotionCategories: defineTable({
    name: v.string(),
    emoji: v.string(),
    color: v.string(),
    order: v.number(),
  }),

  emotionSubcategories: defineTable({
    categoryId: v.id("emotionCategories"),
    name: v.string(),
    emoji: v.string(),
    order: v.number(),
  }).index("by_category", ["categoryId"]),

  emotionCheckIns: defineTable({
    userId: v.id("users"),
    categoryId: v.id("emotionCategories"),
    subcategoryId: v.id("emotionSubcategories"),
    journalEntry: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "timestamp"]),

  // ============ SPRINTS ============
  sprints: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    isActive: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_active", ["isActive"])
    .index("by_dates", ["startDate", "endDate"]),

  // ============ GOALS ============
  goals: defineTable({
    userId: v.id("users"),
    sprintId: v.id("sprints"),
    title: v.string(),
    // SMART goal components
    specific: v.string(),
    measurable: v.string(),
    achievable: v.string(),
    relevant: v.string(),
    timeBound: v.string(),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_sprint", ["sprintId"])
    .index("by_user_sprint", ["userId", "sprintId"]),

  // ============ ACTION ITEMS ============
  actionItems: defineTable({
    goalId: v.optional(v.id("goals")), // Optional - null for standalone/quick tasks
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    weekNumber: v.number(),
    dayOfWeek: v.number(),
    scheduledTime: v.optional(v.string()),
    isCompleted: v.boolean(),
    completedAt: v.optional(v.number()),
    order: v.number(),
  })
    .index("by_goal", ["goalId"])
    .index("by_user", ["userId"])
    .index("by_user_day", ["userId", "weekNumber", "dayOfWeek"]),

  // ============ HABITS ============
  habits: defineTable({
    userId: v.id("users"),
    sprintId: v.id("sprints"),
    name: v.string(),
    description: v.optional(v.string()),
    whatIsHabit: v.string(),
    howToPractice: v.string(),
    cue: v.optional(v.string()),
    reward: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_sprint", ["sprintId"])
    .index("by_user_sprint", ["userId", "sprintId"]),

  habitCompletions: defineTable({
    habitId: v.id("habits"),
    userId: v.id("users"),
    date: v.string(),
    completed: v.boolean(),
  })
    .index("by_habit", ["habitId"])
    .index("by_habit_date", ["habitId", "date"])
    .index("by_user_date", ["userId", "date"]),

  // ============ DEEP WORK DOMAINS ============
  domains: defineTable({
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    description: v.string(),
    order: v.number(),
  }),

  majorObjectives: defineTable({
    domainId: v.id("domains"),
    title: v.string(),
    description: v.string(),
    curriculum: v.optional(v.string()), // "MYP Y1", "PYP Y2", etc.
    difficulty: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced")
      )
    ),
    estimatedHours: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_domain", ["domainId"]),

  learningObjectives: defineTable({
    domainId: v.id("domains"),
    majorObjectiveId: v.optional(v.id("majorObjectives")),
    title: v.string(),
    description: v.string(),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    ),
    estimatedHours: v.optional(v.number()),
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_domain", ["domainId"])
    .index("by_major_objective", ["majorObjectiveId"]),

  activities: defineTable({
    objectiveId: v.id("learningObjectives"),
    title: v.string(),
    type: v.union(
      v.literal("video"),
      v.literal("exercise"),
      v.literal("reading"),
      v.literal("project"),
      v.literal("game")
    ),
    url: v.string(),
    platform: v.optional(v.string()),
    estimatedMinutes: v.optional(v.number()),
    order: v.number(),
    instructions: v.optional(v.string()),
  }).index("by_objective", ["objectiveId"]),

  // Student assignments to learning objectives
  studentObjectives: defineTable({
    userId: v.id("users"),
    objectiveId: v.id("learningObjectives"),
    majorObjectiveId: v.optional(v.id("majorObjectives")),
    assignedBy: v.id("users"),
    assignedAt: v.number(),
    // Note: mastered/viva_requested are legacy - new logic uses studentMajorObjectives
    status: v.union(
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("mastered"),        // Legacy - kept for data compatibility
      v.literal("viva_requested")   // Legacy - kept for data compatibility
    ),
    vivaRequestedAt: v.optional(v.number()),
    masteredAt: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_objective", ["objectiveId"])
    .index("by_user_objective", ["userId", "objectiveId"])
    .index("by_user_major", ["userId", "majorObjectiveId"])
    .index("by_status", ["status"]),

  // Student assignments to major objectives (viva requests live here)
  studentMajorObjectives: defineTable({
    userId: v.id("users"),
    majorObjectiveId: v.id("majorObjectives"),
    assignedBy: v.id("users"),
    assignedAt: v.number(),
    status: v.union(
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("viva_requested"),
      v.literal("mastered")
    ),
    vivaRequestedAt: v.optional(v.number()),
    masteredAt: v.optional(v.number()),
    adminNotes: v.optional(v.string()),
    vivaRequestNotes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_major_objective", ["majorObjectiveId"])
    .index("by_user_major", ["userId", "majorObjectiveId"])
    .index("by_status", ["status"]),

  // Track individual activity completion
  activityProgress: defineTable({
    userId: v.id("users"),
    activityId: v.id("activities"),
    studentObjectiveId: v.id("studentObjectives"),
    completed: v.boolean(),
    completedAt: v.optional(v.number()),
    timeSpentMinutes: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_activity", ["activityId"])
    .index("by_student_objective", ["studentObjectiveId"]),

  // ============ DIAGNOSTICS ============
  diagnosticUnlockRequests: defineTable({
    userId: v.id("users"),
    majorObjectiveId: v.id("majorObjectives"),
    requestedAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("denied"),
      v.literal("canceled")
    ),
    handledBy: v.optional(v.id("users")),
    handledAt: v.optional(v.number()),
  })
    .index("by_status", ["status", "requestedAt"])
    .index("by_user_major", ["userId", "majorObjectiveId", "requestedAt"]),

  diagnosticUnlocks: defineTable({
    userId: v.id("users"),
    majorObjectiveId: v.id("majorObjectives"),
    approvedBy: v.id("users"),
    approvedAt: v.number(),
    expiresAt: v.number(),
    attemptsRemaining: v.number(),
    status: v.union(
      v.literal("approved"),
      v.literal("consumed"),
      v.literal("expired"),
      v.literal("revoked")
    ),
  })
    .index("by_user_major", ["userId", "majorObjectiveId", "approvedAt"])
    .index("by_status", ["status", "approvedAt"]),

  diagnosticAttempts: defineTable({
    userId: v.id("users"),
    domainId: v.id("domains"),
    majorObjectiveId: v.id("majorObjectives"),
    studentMajorObjectiveId: v.optional(v.id("studentMajorObjectives")),
    unlockId: v.optional(v.id("diagnosticUnlocks")),
    attemptType: v.union(v.literal("practice"), v.literal("mastery")),
    diagnosticModuleName: v.string(),
    diagnosticModuleIds: v.array(v.string()),
    questionCount: v.number(),
    score: v.number(),
    passed: v.boolean(),
    startedAt: v.number(),
    submittedAt: v.number(),
    durationMs: v.number(),
    results: v.array(
      v.object({
        questionId: v.string(),
        topic: v.string(),
        chosenLabel: v.string(),
        correctLabel: v.string(),
        correct: v.boolean(),
        misconception: v.string(),
        explanation: v.string(),
        visualHtml: v.optional(v.string()),
      })
    ),
  })
    .index("by_user_major", ["userId", "majorObjectiveId", "submittedAt"])
    .index("by_passed", ["passed", "submittedAt"])
    .index("by_major_passed", ["majorObjectiveId", "passed", "submittedAt"]),

  // ============ READING LIBRARY ============
  books: defineTable({
    title: v.string(),
    author: v.string(),
    coverImageUrl: v.optional(v.string()),
    readingUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    genre: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    isPrePopulated: v.boolean(),
    addedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_grade", ["gradeLevel"])
    .index("by_genre", ["genre"]),

  studentBooks: defineTable({
    userId: v.id("users"),
    bookId: v.id("books"),
    status: v.union(
      v.literal("reading"),
      v.literal("completed"), // Legacy status for existing data
      v.literal("presentation_requested"),
      v.literal("presented")
    ),
    startedAt: v.number(),
    completedAt: v.optional(v.number()), // Legacy field for existing data
    presentationRequestedAt: v.optional(v.number()),
    presentedAt: v.optional(v.number()),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_book", ["bookId"])
    .index("by_user_book", ["userId", "bookId"])
    .index("by_status", ["status"]),

  // ============ TRUST JAR ============
  trustJar: defineTable({
    batch: v.string(), // "2153" or "2156"
    count: v.number(), // Current marble count (0-50)
    timesCompleted: v.number(), // Number of times jar was filled and reset
    updatedAt: v.number(), // Last update timestamp
    updatedBy: v.optional(v.id("users")), // Who made the last change
  }).index("by_batch", ["batch"]),

  // ============ CLASS NORMS (STRIKES & PENALTIES) ============
  studentNorms: defineTable({
    userId: v.id("users"),
    strikes: v.number(),
    penalties: v.number(),
    penaltyPending: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_user", ["userId"]),

  // ============ PROJECTS (6-week learning cycles) ============
  projects: defineTable({
    name: v.string(), // "Project 3: Renewable Energy"
    description: v.optional(v.string()),
    startDate: v.string(), // ISO date
    endDate: v.string(),
    isActive: v.boolean(),
    cycleNumber: v.number(), // 1, 2, 3... for ordering
    createdBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_cycle", ["cycleNumber"]),

  projectLinks: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"), // Student
    url: v.string(),
    title: v.string(), // "Final Presentation"
    linkType: v.union(
      v.literal("presentation"),
      v.literal("document"),
      v.literal("video"),
      v.literal("other")
    ),
    addedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"]),

  projectReflections: defineTable({
    projectId: v.id("projects"),
    userId: v.id("users"),
    didWell: v.optional(v.string()), // Q1: What they did well
    projectDescription: v.optional(v.string()), // Q2: Describe their project
    couldImprove: v.optional(v.string()), // Q3: What could improve
    isComplete: v.boolean(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_user", ["projectId", "userId"]),

  // ============ AI CHAT LOGS (Dev) ============
  chatLogs: defineTable({
    type: v.string(),
    data: v.any(),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  // ============ VISION BOARD ============
  visionBoardAreas: defineTable({
    userId: v.id("users"),
    name: v.string(),
    emoji: v.string(),
    isPreset: v.boolean(),
  }).index("by_user", ["userId"]),

  visionBoardCards: defineTable({
    userId: v.id("users"),
    areaId: v.id("visionBoardAreas"),
    cardType: v.union(
      v.literal("image_hero"),
      v.literal("counter"),
      v.literal("progress"),
      v.literal("streak"),
      v.literal("habits"),
      v.literal("mini_tile"),
      v.literal("motivation"),
      v.literal("journal"),
    ),
    title: v.string(),
    subtitle: v.optional(v.string()),
    emoji: v.optional(v.string()),
    colorVariant: v.union(
      v.literal("green"),
      v.literal("blue"),
      v.literal("pink"),
      v.literal("purple"),
      v.literal("orange"),
      v.literal("yellow"),
    ),
    size: v.union(
      v.literal("sm"),
      v.literal("md"),
      v.literal("lg"),
      v.literal("tall"),
      v.literal("wide"),
      v.literal("hero"),
    ),
    order: v.number(),
    // image_hero
    imageUrl: v.optional(v.string()),
    progressPercent: v.optional(v.number()),
    // counter
    currentCount: v.optional(v.number()),
    targetCount: v.optional(v.number()),
    countLabel: v.optional(v.string()),
    // progress
    description: v.optional(v.string()),
    totalSteps: v.optional(v.number()),
    completedSteps: v.optional(v.number()),
    stepsLabel: v.optional(v.string()),
    // streak
    quote: v.optional(v.string()),
    streakCount: v.optional(v.number()),
    // habits
    habits: v.optional(
      v.array(v.object({ label: v.string(), done: v.boolean() })),
    ),
    dayCount: v.optional(v.number()),
    // journal
    textContent: v.optional(v.string()),
    entryDate: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_area", ["userId", "areaId"]),
});
