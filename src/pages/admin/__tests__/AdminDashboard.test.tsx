import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
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
      getVivaRequests: "objectives.getVivaRequests",
      updateStatus: "objectives.updateStatus",
    },
    emotions: {
      getTodayCheckIns: "emotions.getTodayCheckIns",
    },
    books: {
      getReviewSubmissions: "books.getReviewSubmissions",
      approveReview: "books.approveReview",
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

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipTrigger: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
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

const reviewSubmissions = [
  {
    _id: "studentBook_1",
    userId: "student_2",
    user: { displayName: "Bob Smith" },
    book: { title: "The Hobbit", author: "J.R.R. Tolkien" },
    review: "Great journey.",
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
    "objectives.getVivaRequests": vivaRequests,
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
  let mockUpdateStatus: ReturnType<typeof vi.fn>;
  let mockApproveReview: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateStatus = vi.fn().mockResolvedValue({});
    mockApproveReview = vi.fn().mockResolvedValue({});

    (useMutation as any).mockImplementation((mutation: string) => {
      if (mutation === "objectives.updateStatus") return mockUpdateStatus;
      if (mutation === "books.approveReview") return mockApproveReview;
      return vi.fn().mockResolvedValue({});
    });

    setupQueries();
  });

  it("renders dashboard summary with review queue", () => {
    renderDashboard();
    expect(screen.getByText("Welcome back, Coach")).toBeInTheDocument();
    for (const title of ["Total Students", "Pending Vivas", "Reviews"]) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
    expect(screen.getByText("The Hobbit")).toBeInTheDocument();
  });

  it("approves viva request on double-click", async () => {
    const user = userEvent.setup();
    renderDashboard();

    const vivaCard = screen.getByText("Viva Queue").closest(".rounded-xl");
    const approveButton = vivaCard?.querySelector(".p-3 button");
    expect(approveButton).toBeTruthy();

    await user.dblClick(approveButton!);
    await waitFor(() => {
      expect(mockUpdateStatus).toHaveBeenCalledWith({
        studentMajorObjectiveId: "viva_1",
        status: "mastered",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Viva approved for Alice Johnson");
  });

  it("approves review on double-click", async () => {
    const user = userEvent.setup();
    renderDashboard();

    const reviewsCard = screen.getByText("Reviews").closest(".rounded-xl");
    const approveButton = reviewsCard?.querySelector(".p-3 button");
    expect(approveButton).toBeTruthy();

    await user.dblClick(approveButton!);
    await waitFor(() => {
      expect(mockApproveReview).toHaveBeenCalledWith({
        studentBookId: "studentBook_1",
        approvedBy: "admin_123",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Review approved for Bob Smith");
  });

  it("shows empty review queue state when no submissions", () => {
    setupQueries({ "books.getReviewSubmissions": [] });
    renderDashboard();
    expect(screen.getByText("No pending reviews.")).toBeInTheDocument();
  });

  it("navigates to /admin/reviews from queue button", async () => {
    const user = userEvent.setup();
    setupQueries({
      "books.getReviewSubmissions": [
        ...reviewSubmissions,
        { ...reviewSubmissions[0], _id: "studentBook_2" },
        { ...reviewSubmissions[0], _id: "studentBook_3" },
        { ...reviewSubmissions[0], _id: "studentBook_4" },
      ],
    });

    renderDashboard();
    await user.click(screen.getByRole("button", { name: /view all \(4\)/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/admin/reviews");
  });

  it("shows setup checklist when prerequisites are missing", () => {
    setupQueries({
      "users.getAll": [],
      "sprints.getActive": null,
      "objectives.getAll": [],
    });
    renderDashboard();
    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    for (const text of ["Add Students", "Create a Sprint"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });
});
