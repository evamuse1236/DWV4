// Note: Once you run `npx convex dev`, replace these with proper Convex Id types
// import { Id } from "../../convex/_generated/dataModel";

// Temporary type until Convex generates types
type Id<T extends string> = string & { __tableName: T };

// ============ USER TYPES ============
export type UserRole = "student" | "admin";

export interface User {
  _id: Id<"users">;
  username: string;
  role: UserRole;
  displayName: string;
  avatarUrl?: string;
  createdAt: number;
  lastLoginAt?: number;
}

export interface Session {
  _id: Id<"sessions">;
  userId: Id<"users">;
  token: string;
  expiresAt: number;
}

// ============ EMOTION TYPES ============
export interface EmotionCategory {
  _id: Id<"emotionCategories">;
  name: string;
  emoji: string;
  color: string;
  order: number;
}

export interface EmotionSubcategory {
  _id: Id<"emotionSubcategories">;
  categoryId: Id<"emotionCategories">;
  name: string;
  emoji: string;
  order: number;
}

export interface EmotionCheckIn {
  _id: Id<"emotionCheckIns">;
  userId: Id<"users">;
  categoryId: Id<"emotionCategories">;
  subcategoryId: Id<"emotionSubcategories">;
  journalEntry?: string;
  timestamp: number;
}

// ============ SPRINT TYPES ============
export interface Sprint {
  _id: Id<"sprints">;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdBy: Id<"users">;
}

// ============ GOAL TYPES ============
export type GoalStatus = "not_started" | "in_progress" | "completed";

export interface Goal {
  _id: Id<"goals">;
  userId: Id<"users">;
  sprintId: Id<"sprints">;
  title: string;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  status: GoalStatus;
  createdAt: number;
  updatedAt: number;
}

export interface ActionItem {
  _id: Id<"actionItems">;
  goalId: Id<"goals">;
  userId: Id<"users">;
  title: string;
  description?: string;
  weekNumber: number;
  dayOfWeek: number;
  isCompleted: boolean;
  completedAt?: number;
  order: number;
}

// ============ HABIT TYPES ============
export interface Habit {
  _id: Id<"habits">;
  userId: Id<"users">;
  sprintId: Id<"sprints">;
  name: string;
  description?: string;
  whatIsHabit: string;
  howToPractice: string;
  cue?: string;
  reward?: string;
  createdAt: number;
}

export interface HabitCompletion {
  _id: Id<"habitCompletions">;
  habitId: Id<"habits">;
  userId: Id<"users">;
  date: string;
  completed: boolean;
}

// ============ DOMAIN TYPES ============
export interface Domain {
  _id: Id<"domains">;
  name: string;
  icon: string;
  color: string;
  description: string;
  order: number;
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface MajorObjective {
  _id: Id<"majorObjectives">;
  domainId: Id<"domains">;
  title: string;
  description: string;
  difficulty?: Difficulty;
  estimatedHours?: number;
  createdBy: Id<"users">;
  createdAt: number;
}

export interface LearningObjective {
  _id: Id<"learningObjectives">;
  domainId: Id<"domains">;
  majorObjectiveId?: Id<"majorObjectives">;
  title: string;
  description: string;
  difficulty: Difficulty;
  estimatedHours?: number;
  createdBy: Id<"users">;
  createdAt: number;
}

export type ActivityType = "video" | "exercise" | "reading" | "project" | "game";

export interface Activity {
  _id: Id<"activities">;
  objectiveId: Id<"learningObjectives">;
  title: string;
  type: ActivityType;
  url: string;
  platform?: string;
  estimatedMinutes?: number;
  order: number;
  instructions?: string;
}

export type ObjectiveStatus =
  | "assigned"
  | "in_progress"
  | "viva_requested"
  | "mastered";

export type SubObjectiveStatus =
  | "assigned"
  | "in_progress"
  | "completed";

export interface StudentObjective {
  _id: Id<"studentObjectives">;
  userId: Id<"users">;
  objectiveId: Id<"learningObjectives">;
  majorObjectiveId?: Id<"majorObjectives">;
  assignedBy: Id<"users">;
  assignedAt: number;
  status: SubObjectiveStatus;
  adminNotes?: string;
}

export interface StudentMajorObjective {
  _id: Id<"studentMajorObjectives">;
  userId: Id<"users">;
  majorObjectiveId: Id<"majorObjectives">;
  assignedBy: Id<"users">;
  assignedAt: number;
  status: ObjectiveStatus;
  vivaRequestedAt?: number;
  masteredAt?: number;
  adminNotes?: string;
}

export interface ActivityProgress {
  _id: Id<"activityProgress">;
  userId: Id<"users">;
  activityId: Id<"activities">;
  studentObjectiveId: Id<"studentObjectives">;
  completed: boolean;
  completedAt?: number;
  timeSpentMinutes?: number;
  notes?: string;
}

// ============ READING TYPES ============
export interface Book {
  _id: Id<"books">;
  title: string;
  author: string;
  coverImageUrl?: string;
  readingUrl?: string;
  description?: string;
  gradeLevel?: string;
  genre?: string;
  pageCount?: number;
  isPrePopulated: boolean;
  addedBy?: Id<"users">;
  createdAt: number;
}

export type BookStatus = "reading" | "completed" | "presented";

export interface StudentBook {
  _id: Id<"studentBooks">;
  userId: Id<"users">;
  bookId: Id<"books">;
  status: BookStatus;
  startedAt: number;
  completedAt?: number;
  presentedAt?: number;
  rating?: number;
  review?: string;
}

// ============ AUTH CONTEXT TYPES ============
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}
