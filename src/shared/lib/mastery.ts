export type MasteryNextStep =
  | "continue_work"
  | "start_first_diagnostic"
  | "request_viva"
  | "await_viva_decision"
  | "request_retake"
  | "await_retake_decision"
  | "start_retake"
  | "mastered";

export type MasteryState = {
  majorObjective?: {
    _id: string;
    title?: string;
    description?: string;
    difficulty?: string;
  } | null;
  domain?: { _id: string; name?: string } | null;
  majorAssignment?: {
    studentMajorObjectiveId: string;
    status: "assigned" | "in_progress" | "mastered" | "viva_requested";
    vivaStatus?: "not_requested" | "requested" | "approved" | "not_ready";
    vivaRequestedAt?: number;
    vivaDecisionAt?: number;
    vivaRequestNotes?: string;
    vivaDecisionNotes?: string;
    masteredAt?: number;
  } | null;
  readiness: {
    totalSubObjectives: number;
    completedSubObjectives: number;
    allSubObjectivesComplete: boolean;
  };
  latestAttempt?: {
    attemptId: string;
    passed: boolean;
    score: number;
    questionCount: number;
    scorePercent?: number;
    submittedAt?: number;
    durationMs?: number;
    diagnosticModuleName?: string;
  } | null;
  retake: {
    pendingRequest?: { requestId: string; requestedAt: number } | null;
    latestDecision?: {
      status: string;
      handledAt?: number;
      decisionNotes?: string;
    } | null;
    activeUnlock?: {
      unlockId: string;
      expiresAt: number;
      attemptsRemaining: number;
    } | null;
  };
  actions: {
    canStartDiagnostic: boolean;
    canRequestViva: boolean;
    canRequestRetake: boolean;
  };
  nextStep: MasteryNextStep;
};

const NEXT_STEP_COPY: Record<
  MasteryNextStep,
  { label: string; title: string; body: string; accent: string }
> = {
  continue_work: {
    label: "Continue work",
    title: "Finish the assigned work first",
    body: "Complete every learning step for this objective before moving into mastery checks.",
    accent: "text-amber-800 bg-amber-50 border-amber-200",
  },
  start_first_diagnostic: {
    label: "Start diagnostic",
    title: "You are ready for a first mastery check",
    body: "Take the diagnostic now, or ask your coach for a viva instead if you want a live review.",
    accent: "text-slate-900 bg-slate-50 border-slate-200",
  },
  request_viva: {
    label: "Request viva",
    title: "Ask for a coach review",
    body: "Use a viva when you want your coach to review your understanding directly instead of waiting on another diagnostic.",
    accent: "text-violet-900 bg-violet-50 border-violet-200",
  },
  await_viva_decision: {
    label: "Awaiting viva",
    title: "Your viva request is waiting on a coach decision",
    body: "Hold here for coach feedback. If they approve, you may be marked mastered or sent forward with a clearer next step.",
    accent: "text-violet-900 bg-violet-50 border-violet-200",
  },
  request_retake: {
    label: "Request retake",
    title: "Review, then ask for another attempt",
    body: "You did not pass the latest diagnostic. Revisit the mistakes and request a retake when you are ready.",
    accent: "text-orange-900 bg-orange-50 border-orange-200",
  },
  await_retake_decision: {
    label: "Awaiting retake",
    title: "Your retake request is pending",
    body: "A coach needs to approve the next diagnostic window before you can start another attempt.",
    accent: "text-orange-900 bg-orange-50 border-orange-200",
  },
  start_retake: {
    label: "Start retake",
    title: "Your next diagnostic window is open",
    body: "Your coach has unlocked another attempt. Start it while the window is still active.",
    accent: "text-emerald-900 bg-emerald-50 border-emerald-200",
  },
  mastered: {
    label: "Mastered",
    title: "This objective is complete",
    body: "You have already cleared mastery here. Use the review history if you want to revisit the work.",
    accent: "text-emerald-900 bg-emerald-50 border-emerald-200",
  },
};

export function getMasteryCopy(state: MasteryState) {
  return NEXT_STEP_COPY[state.nextStep];
}

export function getVivaStatusLabel(
  vivaStatus?: "not_requested" | "requested" | "approved" | "not_ready"
) {
  switch (vivaStatus) {
    case "requested":
      return "Viva Requested";
    case "approved":
      return "Viva Approved";
    case "not_ready":
      return "Needs More Work";
    default:
      return "No Viva";
  }
}
