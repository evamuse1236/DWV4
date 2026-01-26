/**
 * Tests for DomainDetailPage component.
 *
 * The DomainDetailPage displays:
 * - Loading UI when domain data is loading
 * - Redirect to /deep-work for invalid domainId
 * - Domain header with stats (mastered/total)
 * - List of major objectives with expandable sub-objectives
 * - Activity toggles that call api.progress.toggleActivity
 * - Viva request button that enables only when conditions are met
 * - Status labels for major and sub objectives
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock convex/react
const mockToggleActivity = vi.fn().mockResolvedValue({});
const mockUpdateObjectiveStatus = vi.fn().mockResolvedValue({});

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((mutation: string) => {
    if (mutation === "progress.toggleActivity") return mockToggleActivity;
    if (mutation === "objectives.updateStatus") return mockUpdateObjectiveStatus;
    return vi.fn().mockResolvedValue({});
  }),
}));

// Mock the API
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    domains: {
      getById: "domains.getById",
    },
    objectives: {
      getAssignedByDomain: "objectives.getAssignedByDomain",
      updateStatus: "objectives.updateStatus",
    },
    progress: {
      toggleActivity: "progress.toggleActivity",
    },
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useParams: vi.fn(() => ({ domainId: "domain_123" })),
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate-to">{to}</div>,
}));

// Mock useAuth hook
vi.mock("../../../hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "user_123",
      username: "testuser",
      displayName: "Test User",
      role: "student",
    },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, className, style, ...props }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, disabled, ...props }: any) => (
      <button onClick={onClick} className={className} disabled={disabled} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock domain utils
vi.mock("../../../lib/domain-utils", () => ({
  getDomainIcon: () => <svg data-testid="domain-icon" />,
  getDomainColorClass: () => "pastel-blue",
}));

// Import after mocking
import { DomainDetailPage } from "../DomainDetailPage";
import { useQuery, useMutation } from "convex/react";
import { useParams } from "react-router-dom";

// Mock data
const mockDomain = {
  _id: "domain_123",
  name: "Mathematics",
  description: "Build strong math foundations",
};

const createMockAssignedMajors = (options: {
  majorStatus?: string;
  subStatus?: string;
  allSubsCompleted?: boolean;
  hasActivities?: boolean;
  activitiesCompleted?: boolean;
} = {}) => {
  const {
    majorStatus = "in_progress",
    subStatus = "in_progress",
    allSubsCompleted = false,
    hasActivities = true,
    activitiesCompleted = false,
  } = options;

  const activities = hasActivities
    ? [
        {
          _id: "activity_1",
          title: "Watch video on linear equations",
          url: "https://example.com/video1",
          type: "video",
          order: 1,
          progress: { completed: activitiesCompleted },
        },
        {
          _id: "activity_2",
          title: "Practice problems",
          url: "https://example.com/practice1",
          type: "practice",
          order: 2,
          progress: { completed: activitiesCompleted },
        },
      ]
    : [];

  return [
    {
      majorObjective: {
        _id: "major_1",
        title: "Algebra Basics",
        description: "Learn fundamental algebra concepts",
        difficulty: "intermediate",
      },
      assignment: {
        _id: "assignment_1",
        status: majorStatus,
      },
      subObjectives: [
        {
          _id: "sub_obj_1",
          objectiveId: "obj_1",
          status: allSubsCompleted ? "completed" : subStatus,
          objective: {
            _id: "obj_1",
            title: "Linear Equations",
            description: "Solve linear equations in one variable",
            difficulty: "beginner",
          },
          activities: allSubsCompleted
            ? activities.map((a) => ({
                ...a,
                progress: { completed: true },
              }))
            : activities,
        },
        {
          _id: "sub_obj_2",
          objectiveId: "obj_2",
          status: allSubsCompleted ? "completed" : "assigned",
          objective: {
            _id: "obj_2",
            title: "Quadratic Equations",
            description: "Solve quadratic equations",
            difficulty: "intermediate",
          },
          activities: allSubsCompleted
            ? activities.map((a) => ({
                ...a,
                _id: a._id + "_2",
                progress: { completed: true },
              }))
            : activities.map((a) => ({
                ...a,
                _id: a._id + "_2",
                progress: { completed: false },
              })),
        },
      ],
    },
  ];
};

describe("DomainDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToggleActivity.mockClear();
    mockUpdateObjectiveStatus.mockClear();
  });

  describe("Guards and redirects", () => {
    it("redirects to /deep-work when domainId is invalid (too short)", () => {
      (useParams as any).mockReturnValue({ domainId: "abc" });

      render(<DomainDetailPage />);

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/deep-work");
    });

    it("redirects to /deep-work when domainId is undefined", () => {
      (useParams as any).mockReturnValue({ domainId: undefined });

      render(<DomainDetailPage />);

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/deep-work");
    });

    it("redirects to /deep-work when domainId contains invalid characters", () => {
      (useParams as any).mockReturnValue({ domainId: "domain@#$%invalid" });

      render(<DomainDetailPage />);

      expect(screen.getByTestId("navigate-to")).toHaveTextContent("/deep-work");
    });

    it("shows loading UI when domain is missing (loading)", () => {
      (useParams as any).mockReturnValue({ domainId: "domain_123_valid_id" });
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return undefined;
        if (query === "objectives.getAssignedByDomain") return undefined;
        return undefined;
      });

      render(<DomainDetailPage />);

      // When domain is loading, should show "Loading domain..." message
      expect(screen.getByText(/loading domain/i)).toBeInTheDocument();
      expect(screen.getByText(/please wait/i)).toBeInTheDocument();
    });
  });

  describe("Domain display", () => {
    beforeEach(() => {
      (useParams as any).mockReturnValue({ domainId: "domain_123_valid_id" });
    });

    it("displays domain name and description", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors();
        return undefined;
      });

      render(<DomainDetailPage />);

      expect(screen.getByText("Mathematics")).toBeInTheDocument();
      expect(
        screen.getByText("Build strong math foundations")
      ).toBeInTheDocument();
    });

    it("displays mastered and total counts correctly", () => {
      const majorsWithMastered = [
        ...createMockAssignedMajors({ majorStatus: "mastered" }),
        {
          majorObjective: {
            _id: "major_2",
            title: "Geometry",
            description: "Learn geometry",
          },
          assignment: {
            _id: "assignment_2",
            status: "in_progress",
          },
          subObjectives: [],
        },
      ];

      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain") return majorsWithMastered;
        return undefined;
      });

      render(<DomainDetailPage />);

      // Should show 1 mastered and 2 total
      expect(screen.getByText("1")).toBeInTheDocument(); // Mastered count
      expect(screen.getByText("2")).toBeInTheDocument(); // Total count
    });

    it("shows empty state when no objectives are assigned", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain") return [];
        return undefined;
      });

      render(<DomainDetailPage />);

      expect(screen.getByText(/no objectives yet/i)).toBeInTheDocument();
    });
  });

  describe("Activity toggle", () => {
    beforeEach(() => {
      (useParams as any).mockReturnValue({ domainId: "domain_123_valid_id" });
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({ hasActivities: true });
        return undefined;
      });
    });

    it("calls api.progress.toggleActivity with correct args when activity is toggled", async () => {
      const user = userEvent.setup();
      render(<DomainDetailPage />);

      // First, expand the sub-objective to see activities
      const subObjectiveHeader = screen.getByText("Linear Equations");
      await user.click(subObjectiveHeader);

      // Wait for activities to be visible
      await waitFor(() => {
        expect(screen.getByText("Watch video on linear equations")).toBeInTheDocument();
      });

      // Find the activity row and its toggle button
      // The button is the first button in the activity row (the circular checkbox)
      const activityRow = screen.getByText("Watch video on linear equations").closest(".flex.items-center");
      expect(activityRow).toBeInTheDocument();

      const activityToggle = activityRow?.querySelector("button");
      expect(activityToggle).toBeInTheDocument();
      await user.click(activityToggle!);

      expect(mockToggleActivity).toHaveBeenCalledWith({
        userId: "user_123",
        activityId: "activity_1",
        studentObjectiveId: "sub_obj_1",
      });
    });
  });

  describe("Viva request button", () => {
    beforeEach(() => {
      (useParams as any).mockReturnValue({ domainId: "domain_123_valid_id" });
    });

    it("enables viva button only when all sub-objectives are complete and major is in_progress", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({
            majorStatus: "in_progress",
            allSubsCompleted: true,
          });
        return undefined;
      });

      render(<DomainDetailPage />);

      const vivaButton = screen.getByRole("button", { name: /request viva/i });
      expect(vivaButton).toBeEnabled();
    });

    it("disables viva button when not all sub-objectives are complete", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({
            majorStatus: "in_progress",
            allSubsCompleted: false,
          });
        return undefined;
      });

      render(<DomainDetailPage />);

      const vivaButton = screen.getByRole("button", { name: /request viva/i });
      expect(vivaButton).toBeDisabled();
    });

    it("disables viva button when major is not in_progress", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({
            majorStatus: "assigned",
            allSubsCompleted: true,
          });
        return undefined;
      });

      render(<DomainDetailPage />);

      const vivaButton = screen.getByRole("button", { name: /request viva/i });
      expect(vivaButton).toBeDisabled();
    });

    it("shows 'Viva requested' indicator when viva is already requested", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({
            majorStatus: "viva_requested",
            allSubsCompleted: true,
          });
        return undefined;
      });

      render(<DomainDetailPage />);

      // The component shows both "Viva Requested" in the status badge and "Viva requested" indicator
      const vivaIndicators = screen.getAllByText(/viva requested/i);
      expect(vivaIndicators.length).toBeGreaterThan(0);
    });

    it("shows 'Mastered' indicator when major is mastered", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({
            majorStatus: "mastered",
            allSubsCompleted: true,
          });
        return undefined;
      });

      render(<DomainDetailPage />);

      // The component shows both "Mastered" in the status badge and "Mastered" indicator
      const masteredIndicators = screen.getAllByText("Mastered");
      expect(masteredIndicators.length).toBeGreaterThan(0);
    });

    it("calls updateStatus with correct args when viva is requested", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({
            majorStatus: "in_progress",
            allSubsCompleted: true,
          });
        return undefined;
      });

      render(<DomainDetailPage />);

      const vivaButton = screen.getByRole("button", { name: /request viva/i });
      await user.click(vivaButton);

      expect(mockUpdateObjectiveStatus).toHaveBeenCalledWith({
        studentMajorObjectiveId: "assignment_1",
        status: "viva_requested",
      });
    });
  });

  describe("Status rendering", () => {
    beforeEach(() => {
      (useParams as any).mockReturnValue({ domainId: "domain_123_valid_id" });
    });

    it("displays correct label for 'assigned' major status", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({ majorStatus: "assigned" });
        return undefined;
      });

      render(<DomainDetailPage />);

      // "Assigned" appears in the major status badge
      const assignedLabels = screen.getAllByText("Assigned");
      expect(assignedLabels.length).toBeGreaterThan(0);
    });

    it("displays correct label for 'in_progress' major status", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({ majorStatus: "in_progress" });
        return undefined;
      });

      render(<DomainDetailPage />);

      // "In Progress" appears in the major status badge
      const inProgressLabels = screen.getAllByText("In Progress");
      expect(inProgressLabels.length).toBeGreaterThan(0);
    });

    it("displays correct label for 'viva_requested' major status", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({ majorStatus: "viva_requested" });
        return undefined;
      });

      render(<DomainDetailPage />);

      // "Viva Requested" appears in the major status badge
      expect(screen.getByText("Viva Requested")).toBeInTheDocument();
    });

    it("displays correct label for 'mastered' major status", () => {
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({ majorStatus: "mastered" });
        return undefined;
      });

      render(<DomainDetailPage />);

      // "Mastered" appears in the major status badge and as an indicator
      const masteredLabels = screen.getAllByText("Mastered");
      expect(masteredLabels.length).toBeGreaterThan(0);
    });

    it("displays sub-objective status labels correctly", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({
            subStatus: "in_progress",
            allSubsCompleted: false,
          });
        return undefined;
      });

      render(<DomainDetailPage />);

      // Sub-objective statuses are visible in the list
      // "In Progress" for first sub, "Assigned" for second
      const statusLabels = screen.getAllByText(/in progress|assigned/i);
      expect(statusLabels.length).toBeGreaterThan(0);
    });
  });

  describe("Sub-objective expansion", () => {
    beforeEach(() => {
      (useParams as any).mockReturnValue({ domainId: "domain_123_valid_id" });
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors({ hasActivities: true });
        return undefined;
      });
    });

    it("expands sub-objective on click to show activities", async () => {
      const user = userEvent.setup();
      render(<DomainDetailPage />);

      // Activities should not be visible initially
      expect(
        screen.queryByText("Watch video on linear equations")
      ).not.toBeInTheDocument();

      // Click sub-objective to expand
      await user.click(screen.getByText("Linear Equations"));

      // Activities should now be visible
      expect(
        screen.getByText("Watch video on linear equations")
      ).toBeInTheDocument();
      expect(screen.getByText("Practice problems")).toBeInTheDocument();
    });

    it("collapses sub-objective on second click", async () => {
      const user = userEvent.setup();
      render(<DomainDetailPage />);

      // Click to expand
      await user.click(screen.getByText("Linear Equations"));
      expect(
        screen.getByText("Watch video on linear equations")
      ).toBeInTheDocument();

      // Click again to collapse
      await user.click(screen.getByText("Linear Equations"));
      expect(
        screen.queryByText("Watch video on linear equations")
      ).not.toBeInTheDocument();
    });

    it("shows activity progress percentage", async () => {
      const user = userEvent.setup();

      // Create majors with one activity completed
      const majorsWithProgress = [
        {
          ...createMockAssignedMajors({ hasActivities: true })[0],
          subObjectives: [
            {
              _id: "sub_obj_1",
              objectiveId: "obj_1",
              status: "in_progress",
              objective: {
                _id: "obj_1",
                title: "Linear Equations",
                description: "Solve linear equations",
                difficulty: "beginner",
              },
              activities: [
                {
                  _id: "activity_1",
                  title: "Watch video",
                  url: "https://example.com/video1",
                  type: "video",
                  order: 1,
                  progress: { completed: true },
                },
                {
                  _id: "activity_2",
                  title: "Practice",
                  url: "https://example.com/practice",
                  type: "practice",
                  order: 2,
                  progress: { completed: false },
                },
              ],
            },
          ],
        },
      ];

      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain") return majorsWithProgress;
        return undefined;
      });

      render(<DomainDetailPage />);

      // Expand sub-objective
      await user.click(screen.getByText("Linear Equations"));

      // Should show 50% (1 of 2 complete)
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText(/1 of 2 complete/i)).toBeInTheDocument();
    });
  });

  describe("Back navigation", () => {
    beforeEach(() => {
      (useParams as any).mockReturnValue({ domainId: "domain_123_valid_id" });
      (useQuery as any).mockImplementation((query: string) => {
        if (query === "domains.getById") return mockDomain;
        if (query === "objectives.getAssignedByDomain")
          return createMockAssignedMajors();
        return undefined;
      });
    });

    it("navigates back to /deep-work when back button is clicked", async () => {
      const user = userEvent.setup();
      render(<DomainDetailPage />);

      const backButton = screen.getByText(/back to deep work/i);
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith("/deep-work");
    });
  });
});
