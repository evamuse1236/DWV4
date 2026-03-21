import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: {
      getAll: "users.getAll",
      getTodayCheckInCount: "users.getTodayCheckInCount",
    },
    sprints: {
      getActive: "sprints.getActive",
    },
    objectives: {
      getAll: "objectives.getAll",
    },
    mastery: {
      getAdminVivaQueue: "mastery.getAdminVivaQueue",
    },
    diagnostics: {
      getPendingUnlockRequests: "diagnostics.getPendingUnlockRequests",
    },
    emotions: {
      getTodayCheckIns: "emotions.getTodayCheckIns",
    },
    books: {
      getReviewSubmissions: "books.getReviewSubmissions",
    },
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "admin_123",
      username: "coach",
      displayName: "Coach Smith",
      role: "admin",
    },
  })),
}));

vi.mock("@/hooks/useDelayedLoading", () => ({
  useDelayedLoading: vi.fn(() => false),
}));

import { useQuery } from "convex/react";
import { AdminDashboard } from "../AdminDashboard";

const students = [
  { _id: "student_1", username: "alice", displayName: "Alice Johnson" },
  { _id: "student_2", username: "bob", displayName: "Bob Smith" },
];

const activeSprint = {
  _id: "sprint_1",
  name: "Spring Sprint",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
};

const vivaRequests = [
  {
    _id: "viva_1",
    userId: "student_1",
    user: { displayName: "Alice Johnson" },
    objective: { title: "Master fractions" },
    domain: { name: "Math" },
  },
];

const unlockRequests = [
  {
    _id: "unlock_1",
    user: { displayName: "Alice Johnson" },
    majorObjective: { title: "Fractions mastery" },
  },
];

const reviewSubmissions = [
  {
    _id: "studentBook_1",
    userId: "student_2",
    user: { displayName: "Bob Smith" },
    book: { title: "The Hobbit", author: "J.R.R. Tolkien" },
  },
];

const checkIns = [
  {
    _id: "check_1",
    userId: "student_1",
    timestamp: Date.now(),
    user: { displayName: "Alice Johnson" },
    category: { name: "Happy", emoji: "😊" },
    subcategory: { name: "Optimistic" },
    journalEntry: "Ready to learn",
  },
];

function setupQueries(overrides: Partial<Record<string, any>> = {}) {
  const data: Record<string, any> = {
    "users.getAll": students,
    "sprints.getActive": activeSprint,
    "mastery.getAdminVivaQueue": vivaRequests,
    "diagnostics.getPendingUnlockRequests": unlockRequests,
    "books.getReviewSubmissions": reviewSubmissions,
    "users.getTodayCheckInCount": 1,
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

  it("renders the calmer queue-first dashboard and removes the old student overview", () => {
    renderDashboard();

    expect(screen.getByText("Welcome back, Coach")).toBeInTheDocument();
    expect(screen.getByText("Pending vivas")).toBeInTheDocument();
    expect(screen.getAllByText("Diagnostics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Reviews").length).toBeGreaterThan(0);
    expect(screen.getByText("Check-ins today")).toBeInTheDocument();

    expect(screen.getByText("Needs attention now")).toBeInTheDocument();
    expect(screen.getByText("Open student")).toBeInTheDocument();
    expect(screen.getByText("Today's check-ins")).toBeInTheDocument();
    expect(screen.queryByText("Students Overview")).not.toBeInTheDocument();
  });

  it("opens core workspaces from the dashboard", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await user.click(screen.getByRole("button", { name: /open viva/i }));
    await user.click(screen.getByRole("button", { name: /open diagnostics/i }));
    await user.click(screen.getByRole("button", { name: /open reviews/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/admin/viva");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/diagnostics");
    expect(mockNavigate).toHaveBeenCalledWith("/admin/reviews");
  });

  it("links check-ins and student jump rows to student detail", async () => {
    const user = userEvent.setup();
    renderDashboard();

    const openStudentCard = screen.getByText("Open student").closest(".rounded-xl");
    expect(openStudentCard).toBeTruthy();
    await user.click(within(openStudentCard as HTMLElement).getByText("Alice Johnson"));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/students/student_1");
  });

  it("shows empty queue states when there is no pending work", () => {
    setupQueries({
      "mastery.getAdminVivaQueue": [],
      "diagnostics.getPendingUnlockRequests": [],
      "books.getReviewSubmissions": [],
      "emotions.getTodayCheckIns": [],
      "users.getTodayCheckInCount": 0,
    });

    renderDashboard();

    expect(screen.getByText("No viva decisions waiting.")).toBeInTheDocument();
    expect(screen.getByText("No retake requests waiting.")).toBeInTheDocument();
    expect(screen.getByText("No review decisions waiting.")).toBeInTheDocument();
    expect(screen.getByText("No check-ins yet today.")).toBeInTheDocument();
  });

  it("shows setup checklist when prerequisites are missing", () => {
    setupQueries({
      "users.getAll": [],
      "sprints.getActive": null,
      "objectives.getAll": [],
    });

    renderDashboard();

    expect(screen.getByText("Getting started")).toBeInTheDocument();
    expect(screen.getByText("Add students")).toBeInTheDocument();
    expect(screen.getByText("Create a sprint")).toBeInTheDocument();
    expect(screen.getByText("Add objectives")).toBeInTheDocument();
  });
});
