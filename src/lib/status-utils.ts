/**
 * Status configuration utilities
 * Shared status-to-style mappings used across the application
 */

export type ObjectiveStatus = "assigned" | "in_progress" | "viva_requested" | "mastered";
export type GoalStatus = "not_started" | "in_progress" | "completed";
export type BookStatus = "reading" | "completed" | "presentation_requested" | "presented";

/**
 * Learning objective status configuration
 */
export const objectiveStatusConfig: Record<ObjectiveStatus, { label: string; variant: string; emoji: string }> = {
  assigned: { label: "Not Started", variant: "default", emoji: "📋" },
  in_progress: { label: "In Progress", variant: "warning", emoji: "🔄" },
  viva_requested: { label: "Viva Requested", variant: "info", emoji: "🙋" },
  mastered: { label: "Mastered!", variant: "success", emoji: "🏆" },
};

/**
 * Goal status configuration
 */
export const goalStatusConfig: Record<GoalStatus, { label: string; variant: string }> = {
  not_started: { label: "Not Started", variant: "default" },
  in_progress: { label: "In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
};

/**
 * Book status configuration
 */
export const bookStatusConfig: Record<BookStatus, { label: string; variant: string; emoji: string }> = {
  reading: { label: "Reading", variant: "warning", emoji: "📖" },
  completed: { label: "Completed", variant: "success", emoji: "✅" }, // Legacy status
  presentation_requested: { label: "Pending Presentation", variant: "info", emoji: "🙋" },
  presented: { label: "Finished", variant: "success", emoji: "✅" },
};

/**
 * Difficulty configuration
 */
export const difficultyConfig = {
  beginner: { label: "Beginner", color: "text-green-600", bg: "bg-green-100" },
  intermediate: { label: "Intermediate", color: "text-yellow-600", bg: "bg-yellow-100" },
  advanced: { label: "Advanced", color: "text-red-600", bg: "bg-red-100" },
} as const;

export type Difficulty = keyof typeof difficultyConfig;

/**
 * Inline status styling for use in pages (raw CSS classes)
 * These are used when Badge components are not appropriate
 */

// Objective status colors for inline styling
export const objectiveStatusColors: Record<ObjectiveStatus, { bg: string; text: string }> = {
  assigned: { bg: "bg-black/5", text: "text-[#888]" },
  in_progress: { bg: "bg-[#ca8a04]/10", text: "text-[#ca8a04]" },
  viva_requested: { bg: "bg-[#7c3aed]/10", text: "text-[#7c3aed]" },
  mastered: { bg: "bg-[#15803d]/10", text: "text-[#15803d]" },
};

// Objective status labels for inline display
export const objectiveStatusLabels: Record<ObjectiveStatus, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  viva_requested: "Viva Requested",
  mastered: "Mastered",
};

// Goal status colors for inline styling
export const goalStatusColors: Record<GoalStatus, string> = {
  not_started: "opacity-50",
  in_progress: "text-[#ca8a04]",
  completed: "text-[#15803d]",
};

// Goal status labels for inline display
export const goalStatusLabels: Record<GoalStatus, string> = {
  not_started: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
};

// Book status indicator colors (solid dots)
export const bookStatusIndicatorColors: Record<BookStatus, string> = {
  reading: "bg-[#ca8a04]",
  completed: "bg-[#15803d]", // Legacy status
  presentation_requested: "bg-[#7c3aed]",
  presented: "bg-[#15803d]",
};

// Book status badge colors for inline styling
export const bookStatusBadgeColors: Record<BookStatus, { bg: string; text: string }> = {
  reading: { bg: "bg-[#ca8a04]/20", text: "text-[#ca8a04]" },
  completed: { bg: "bg-[#15803d]/20", text: "text-[#15803d]" }, // Legacy status
  presentation_requested: { bg: "bg-[#7c3aed]/20", text: "text-[#7c3aed]" },
  presented: { bg: "bg-[#15803d]/20", text: "text-[#15803d]" },
};

/**
 * Helper function to get objective status styling class
 */
export function getObjectiveStatusClass(status: ObjectiveStatus): string {
  const colors = objectiveStatusColors[status];
  return `${colors.bg} ${colors.text}`;
}

/**
 * Helper function to get book status indicator color
 */
export function getBookIndicatorColor(status: BookStatus): string {
  return bookStatusIndicatorColors[status];
}

/**
 * Helper function to get book status badge styling class
 */
export function getBookBadgeClass(status: BookStatus): string {
  const colors = bookStatusBadgeColors[status];
  return `${colors.bg} ${colors.text}`;
}
