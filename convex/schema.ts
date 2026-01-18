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
    goalId: v.id("goals"),
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
    count: v.number(), // Current marble count (0-50)
    timesCompleted: v.number(), // Number of times jar was filled and reset
    updatedAt: v.number(), // Last update timestamp
    updatedBy: v.optional(v.id("users")), // Who made the last change
  }),

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
});
