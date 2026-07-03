/**
 * Assignment flow vocabulary (2026 pivot).
 *
 * A unit assignment moves through a single simple loop:
 *   doing → ready → submitted → approved
 *                       └────→ rejected → doing …
 *
 * "doing/ready" are derived on the client from work progress; the backend
 * stores assigned/in_progress/submitted/approved/rejected (legacy
 * mastered/viva_requested rows are folded in by convex/assignments.ts).
 */

export type AssignmentPhase =
  | "doing"
  | "ready"
  | "submitted"
  | "approved"
  | "rejected";

export interface AssignmentStateLike {
  status: string; // folded backend status
  work: {
    totalSubObjectives: number;
    completedSubObjectives: number;
    allWorkComplete: boolean;
  };
}

export function deriveAssignmentPhase(state: AssignmentStateLike): AssignmentPhase {
  if (state.status === "approved") return "approved";
  if (state.status === "submitted") return "submitted";
  if (state.status === "rejected") return "rejected";
  return state.work.allWorkComplete ? "ready" : "doing";
}

export const ASSIGNMENT_COPY: Record<
  AssignmentPhase,
  { label: string; title: string; body: string; accent: string }
> = {
  doing: {
    label: "In progress",
    title: "Work through each part",
    body: "Open the activities, do the work, and tick them off as you go.",
    accent: "text-amber-800 bg-amber-50 border-amber-200",
  },
  ready: {
    label: "Ready",
    title: "All parts finished — mark it done",
    body: "When you mark it done, your coach will check the work with you and confirm it.",
    accent: "text-emerald-900 bg-emerald-50 border-emerald-200",
  },
  submitted: {
    label: "Waiting for coach",
    title: "Marked done — waiting for your coach",
    body: "Your coach will check the work and confirm it. You can keep going on other assignments meanwhile.",
    accent: "text-violet-900 bg-violet-50 border-violet-200",
  },
  approved: {
    label: "Confirmed",
    title: "Confirmed — nice work",
    body: "Your coach checked this and confirmed it. It counts toward your progress.",
    accent: "text-emerald-900 bg-emerald-50 border-emerald-200",
  },
  rejected: {
    label: "Sent back",
    title: "Your coach sent this back",
    body: "Read the note below, fix what is needed, and mark it done again.",
    accent: "text-rose-900 bg-rose-50 border-rose-200",
  },
};

/** Node/status colors shared by the skill tree and lists. */
export const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  assigned: "#E5DED6",
  in_progress: "#DAE4E8",
  submitted: "#F5DFB8",
  approved: "#D4E0D6",
  rejected: "#F3CFC9",
  // legacy
  mastered: "#D4E0D6",
  viva_requested: "#F5DFB8",
};
