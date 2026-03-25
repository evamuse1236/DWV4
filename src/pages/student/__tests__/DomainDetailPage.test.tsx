import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

const mockToggleActivity = vi.fn().mockResolvedValue({});

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((mutation: string) => {
    if (mutation === "progress.toggleActivity") return mockToggleActivity;
    return vi.fn().mockResolvedValue({});
  }),
}));

vi.mock("../@convex/_generated/api", () => ({
  api: {
    domains: { getById: "domains.getById" },
    objectives: { getAssignedByDomain: "objectives.getAssignedByDomain" },
    mastery: { getMajorMasteryState: "mastery.getMajorMasteryState" },
    progress: { toggleActivity: "progress.toggleActivity" },
  },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useParams: vi.fn(() => ({ domainId: "domain_123_valid_id" })),
    useNavigate: () => mockNavigate,
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
  };
});

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "user_123",
      username: "testuser",
      displayName: "Test User",
      role: "student",
    },
  })),
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

vi.mock("@/shared/lib/domain-utils", () => ({
  getDomainIcon: () => <svg data-testid="domain-icon" />,
  getDomainColorClass: () => "pastel-blue",
}));

import { useMutation, useQuery } from "convex/react";
import { DomainDetailPage } from "../DomainDetailPage";

const mockDomain = {
  _id: "domain_123",
  name: "Mathematics",
  description: "Build strong math foundations",
};

const assignedMajors = [
  {
    majorObjective: {
      _id: "major_1",
      title: "Algebra Basics",
      description: "Learn fundamental algebra concepts",
      difficulty: "intermediate",
    },
    assignment: {
      _id: "assignment_1",
      status: "in_progress",
      vivaStatus: "requested",
    },
    subObjectives: [
      {
        _id: "sub_obj_1",
        objectiveId: "obj_1",
        status: "in_progress",
        objective: {
          _id: "obj_1",
          title: "Linear Equations",
          description: "Solve linear equations in one variable",
          difficulty: "beginner",
        },
        activities: [
          {
            _id: "activity_1",
            title: "Watch video on linear equations",
            url: "https://example.com/video1",
            type: "video",
            order: 1,
            progress: { completed: false },
          },
        ],
      },
    ],
  },
];

const masteryState = {
  majorObjective: {
    _id: "major_1",
    title: "Algebra Basics",
  },
  domain: { _id: "domain_123", name: "Mathematics" },
  majorAssignment: {
    studentMajorObjectiveId: "assignment_1",
    status: "in_progress",
    vivaStatus: "requested",
    vivaDecisionNotes: "Bring a clearer explanation for equation balancing.",
  },
  readiness: {
    totalSubObjectives: 1,
    completedSubObjectives: 1,
    allSubObjectivesComplete: true,
  },
  latestAttempt: {
    attemptId: "attempt_1",
    passed: false,
    score: 6,
    questionCount: 10,
    scorePercent: 60,
    diagnosticModuleName: "Algebra",
  },
  retake: {
    pendingRequest: null,
    latestDecision: null,
    activeUnlock: null,
  },
  actions: {
    canStartDiagnostic: false,
    canRequestViva: false,
    canRequestRetake: true,
  },
  nextStep: "await_viva_decision",
};

describe("DomainDetailPage", () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <DomainDetailPage />
      </MemoryRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as any).mockImplementation((mutation: string) => {
      if (mutation === "progress.toggleActivity") return mockToggleActivity;
      return vi.fn().mockResolvedValue({});
    });
    (useQuery as any).mockImplementation((query: string, args: any) => {
      if (query === "domains.getById") return mockDomain;
      if (query === "objectives.getAssignedByDomain") return assignedMajors;
      if (query === "mastery.getMajorMasteryState" && args?.majorObjectiveId === "major_1") {
        return masteryState;
      }
      return undefined;
    });
  });

  it("renders domain details and mastery summary content", () => {
    renderPage();

    expect(screen.getByText("Mathematics")).toBeInTheDocument();
    expect(screen.getByText("Build strong math foundations")).toBeInTheDocument();
    expect(screen.getByText("Coach note")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open mastery/i })).toHaveAttribute(
      "href",
      "/deep-work/mastery/major_1"
    );
  });

  it("expands a sub-objective to show activities", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByText("Watch video on linear equations")).not.toBeInTheDocument();
    await user.click(screen.getByText("Linear Equations"));
    expect(screen.getByText("Watch video on linear equations")).toBeInTheDocument();
  });

  it("toggles activity progress", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("Linear Equations"));
    const activityRow = screen.getByText("Watch video on linear equations").closest(".flex.items-center");
    const toggle = activityRow?.querySelector("button");
    expect(toggle).toBeTruthy();

    await user.click(toggle!);
    expect(mockToggleActivity).toHaveBeenCalledWith({
      userId: "user_123",
      activityId: "activity_1",
      studentObjectiveId: "sub_obj_1",
    });
  });

  it("navigates back to deep work", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText(/back to deep work/i));
    expect(mockNavigate).toHaveBeenCalledWith("/deep-work");
  });

  it("redirects invalid ids back to deep work", async () => {
    const { useParams } = await import("react-router-dom");
    (useParams as any).mockReturnValue({ domainId: "abc" });
    renderPage();
    expect(screen.getByTestId("navigate-to")).toHaveTextContent("/deep-work");
  });
});
