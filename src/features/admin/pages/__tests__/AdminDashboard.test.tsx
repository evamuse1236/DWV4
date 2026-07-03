import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    users: {
      getAll: "users.getAll",
    },
    sprints: {
      getActive: "sprints.getActive",
      getStudentInsights: "sprints.getStudentInsights",
    },
    objectives: {
      getAll: "objectives.getAll",
    },
    assignments: {
      getConfirmationQueue: "assignments.getConfirmationQueue",
    },
    emotions: {
      getTodayCheckIns: "emotions.getTodayCheckIns",
    },
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "admin_123",
      username: "coach",
      displayName: "Coach Smith",
      role: "admin",
    },
    token: "test-admin-token",
  })),
}));

vi.mock("@/shared/hooks/useDelayedLoading", () => ({
  useDelayedLoading: vi.fn(() => false),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useQuery } from "convex/react";
import { AdminDashboard } from "../AdminDashboard";

const students = [
  { _id: "student_1", username: "alice", displayName: "Alice Johnson", lastLoginAt: Date.now() },
  { _id: "student_2", username: "bob", displayName: "Bob Smith" },
];

const activeSprint = {
  _id: "sprint_1",
  name: "Spring Sprint",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
};

const confirmations = [
  {
    _id: "conf_1",
    userId: "student_1",
    user: { displayName: "Alice Johnson" },
    objective: { title: "Master fractions" },
    domain: { name: "Math" },
    work: { totalSubObjectives: 2, completedSubObjectives: 2, allWorkComplete: true },
    submittedAt: Date.now(),
  },
];

const checkIns = [
  {
    _id: "check_1",
    userId: "student_1",
    timestamp: Date.now(),
    user: { displayName: "Alice Johnson" },
    category: { name: "Happy", emoji: "😊", color: "#4ade80" },
    subcategory: { name: "Optimistic" },
  },
];

const insights = {
  sprint: {
    _id: "sprint_1",
    name: "Spring Sprint",
    startDate: "2026-06-29",
    endDate: "2026-07-12",
    totalDays: 14,
    elapsedDays: 4,
  },
  students: [
    {
      student: { _id: "student_1", displayName: "Alice Johnson", username: "alice" },
      metrics: {
        goalsTotal: 2,
        goalsCompleted: 1,
        goalCompletionPercent: 50,
        tasksTotal: 10,
        tasksCompleted: 8,
        taskCompletionPercent: 80,
        habitsTotal: 1,
        habitCompletedTotal: 3,
        habitExpectedTotal: 5,
        habitConsistencyPercent: 60,
        engagementScore: 63,
      },
      currentFocus: { goals: [], tasks: [] },
      goals: [],
      habits: [],
    },
  ],
};

function setupQueries(overrides: Partial<Record<string, any>> = {}) {
  const data: Record<string, any> = {
    "users.getAll": students,
    "sprints.getActive": activeSprint,
    "sprints.getStudentInsights": insights,
    "assignments.getConfirmationQueue": confirmations,
    "emotions.getTodayCheckIns": checkIns,
    "objectives.getAll": [{ _id: "objective_1", title: "Fractions" }],
    ...overrides,
  };

  (useQuery as any).mockImplementation((query: string) => data[query]);
}

function renderDashboard() {
  return render(<AdminDashboard />);
}

describe("AdminDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupQueries();
  });

  it("renders the morning console sections", () => {
    renderDashboard();

    expect(screen.getByText("Good day, Coach")).toBeInTheDocument();
    expect(screen.getAllByText("To confirm").length).toBeGreaterThan(0);
    expect(screen.getByText("Checked in")).toBeInTheDocument();
    expect(screen.getByText("Quiet this week")).toBeInTheDocument();
    expect(screen.getByText("This morning's moods")).toBeInTheDocument();
    expect(screen.getByText("Goals & habits pulse")).toBeInTheDocument();
    expect(screen.getByText("Sprint pulse")).toBeInTheDocument();
  });

  it("shows mood tiles for checked-in students and lists the missing", () => {
    renderDashboard();

    const wall = screen.getByText("This morning's moods").closest(".rounded-xl");
    expect(wall).toBeTruthy();
    expect(within(wall as HTMLElement).getByText("Alice")).toBeInTheDocument();
    expect(within(wall as HTMLElement).getByText("Bob")).toBeInTheDocument();
    expect(within(wall as HTMLElement).getByText(/Not checked in:/)).toBeInTheDocument();
    expect(within(wall as HTMLElement).getByText(/Bob Smith/)).toBeInTheDocument();
    expect(
      within(wall as HTMLElement).getByRole("button", { name: /copy names/i })
    ).toBeInTheDocument();
  });

  it("renders pulse rows with task and habit percentages", () => {
    renderDashboard();

    const pulse = screen.getByText("Goals & habits pulse").closest(".rounded-xl");
    expect(pulse).toBeTruthy();
    expect(within(pulse as HTMLElement).getByText("Alice Johnson")).toBeInTheDocument();
    expect(within(pulse as HTMLElement).getByText("80%")).toBeInTheDocument();
    expect(within(pulse as HTMLElement).getByText("60%")).toBeInTheDocument();
    expect(within(pulse as HTMLElement).getByText("1/2")).toBeInTheDocument();
  });

  it("shows the confirmations strip and opens the workspace", async () => {
    const user = userEvent.setup();
    renderDashboard();

    const strip = screen
      .getAllByText("To confirm")
      .map((el) => el.closest(".rounded-xl"))
      .find((el) => el && within(el as HTMLElement).queryByText("Master fractions"));
    expect(strip).toBeTruthy();

    await user.click(within(strip as HTMLElement).getByText("Master fractions"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/confirmations");
  });

  it("celebrates when nothing needs confirmation", () => {
    setupQueries({
      "assignments.getConfirmationQueue": [],
      "emotions.getTodayCheckIns": [],
    });

    renderDashboard();

    expect(screen.getByText("All confirmed. Nothing waiting.")).toBeInTheDocument();
  });

  it("shows setup checklist when prerequisites are missing", () => {
    setupQueries({
      "users.getAll": [],
      "sprints.getActive": null,
      "objectives.getAll": [],
      "sprints.getStudentInsights": undefined,
    });

    renderDashboard();

    expect(screen.getByText("Getting started")).toBeInTheDocument();
    expect(screen.getByText("Add students")).toBeInTheDocument();
    expect(screen.getByText("Create a sprint")).toBeInTheDocument();
    expect(screen.getByText("Add assignments")).toBeInTheDocument();
  });
});
