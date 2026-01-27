/**
 * Tests for AdminDashboard component.
 *
 * The admin dashboard displays:
 * - Welcome header with coach name
 * - Stats cards: students, pending vivas, active sprint, check-ins
 * - Viva queue with approve functionality
 * - Presentation queue with approve functionality
 * - Today's check-ins list with user/category/subcategory details
 * - Quick action buttons
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

// Mock Radix UI components that don't work in jsdom
vi.mock("@radix-ui/react-tooltip", () => ({
  Root: ({ children }: any) => <>{children}</>,
  Trigger: ({ children, asChild }: any) => <>{children}</>,
  Content: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
  Portal: ({ children }: any) => <>{children}</>,
  Provider: ({ children }: any) => <>{children}</>,
}));

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
}));

// Mock the API
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
      getPresentationRequests: "books.getPresentationRequests",
      approvePresentationRequest: "books.approvePresentationRequest",
    },
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "admin_123",
      username: "admin",
      displayName: "Coach Smith",
      role: "admin",
    },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock useDelayedLoading to return the loading state immediately (no delay in tests)
vi.mock("@/hooks/useDelayedLoading", () => ({
  useDelayedLoading: (isLoading: boolean) => isLoading,
}));

// Mock sonner for toast notifications
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocking
import { AdminDashboard } from "../AdminDashboard";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";

// Mock data
const mockStudents = [
  {
    _id: "student_1",
    username: "alice",
    displayName: "Alice Johnson",
    role: "student",
    avatarUrl: null,
  },
  {
    _id: "student_2",
    username: "bob",
    displayName: "Bob Smith",
    role: "student",
    avatarUrl: null,
  },
  {
    _id: "student_3",
    username: "charlie",
    displayName: "Charlie Brown",
    role: "student",
    avatarUrl: null,
  },
];

const mockActiveSprint = {
  _id: "sprint_1",
  name: "January Sprint",
  startDate: new Date().toISOString(),
  // End date 10 days from now
  endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true,
};

const mockVivaRequests = [
  {
    _id: "viva_1",
    userId: "student_1",
    majorObjectiveId: "obj_1",
    user: { displayName: "Alice Johnson" },
    objective: { title: "Master JavaScript Basics" },
    domain: { name: "Programming" },
  },
  {
    _id: "viva_2",
    userId: "student_2",
    majorObjectiveId: "obj_2",
    user: { displayName: "Bob Smith" },
    objective: { title: "Complete Math Fundamentals" },
    domain: { name: "Mathematics" },
  },
];

const mockPresentationRequests = [
  {
    _id: "pres_1",
    userId: "student_1",
    bookId: "book_1",
    user: { displayName: "Alice Johnson" },
    book: { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
  },
  {
    _id: "pres_2",
    userId: "student_3",
    bookId: "book_2",
    user: { displayName: "Charlie Brown" },
    book: { title: "1984", author: "George Orwell" },
  },
];

const mockTodayCheckIns = [
  {
    _id: "checkin_1",
    userId: "student_1",
    timestamp: Date.now() - 3600000, // 1 hour ago
    journalEntry: "Feeling good about today's learning",
    user: { displayName: "Alice Johnson", avatarUrl: null },
    category: { name: "Happy", emoji: "😊" },
    subcategory: { name: "Optimistic" },
  },
  {
    _id: "checkin_2",
    userId: "student_2",
    timestamp: Date.now() - 7200000, // 2 hours ago
    journalEntry: null,
    user: { displayName: "Bob Smith", avatarUrl: null },
    category: { name: "Focused", emoji: "🎯" },
    subcategory: { name: "Determined" },
  },
];

const mockObjectives = [
  { _id: "obj_1", title: "JavaScript Basics" },
  { _id: "obj_2", title: "Math Fundamentals" },
];

// Helper to setup mock query responses
function setupMockQueries(overrides: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    "users.getAll": mockStudents,
    "sprints.getActive": mockActiveSprint,
    "objectives.getVivaRequests": mockVivaRequests,
    "books.getPresentationRequests": mockPresentationRequests,
    "users.getTodayCheckInCount": 2,
    "emotions.getTodayCheckIns": mockTodayCheckIns,
    "objectives.getAll": mockObjectives,
  };

  const data = { ...defaults, ...overrides };

  (useQuery as any).mockImplementation((query: any) => {
    // query is the string we defined in the API mock (e.g., "users.getAll")
    if (query in data) {
      return data[query];
    }
    return undefined;
  });
}

describe("AdminDashboard", () => {
  // Mock mutation functions
  let mockUpdateStatus: ReturnType<typeof vi.fn>;
  let mockApprovePresentationRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mutation mocks
    mockUpdateStatus = vi.fn().mockResolvedValue({});
    mockApprovePresentationRequest = vi.fn().mockResolvedValue({});

    (useMutation as any).mockImplementation((mutation: any) => {
      if (mutation === "objectives.updateStatus") {
        return mockUpdateStatus;
      }
      if (mutation === "books.approvePresentationRequest") {
        return mockApprovePresentationRequest;
      }
      return vi.fn();
    });

    // Clear localStorage mock for setup banner
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Loading state", () => {
    it("shows skeleton when data is loading", () => {
      // Return undefined for all queries (loading state)
      (useQuery as any).mockReturnValue(undefined);

      render(<AdminDashboard />);

      // The skeleton uses animate-pulse class from Tailwind
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("Stats cards rendering", () => {
    beforeEach(() => {
      setupMockQueries();
    });

    it("renders Total Students card with correct count", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Total Students")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument(); // 3 mock students
    });

    it("renders Pending Vivas card with correct count", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Pending Vivas")).toBeInTheDocument();
      // The number 2 appears multiple times (vivas, check-ins)
      const pendingVivasCard = screen.getByText("Pending Vivas").closest(".rounded-xl");
      expect(pendingVivasCard).toHaveTextContent("2");
    });

    it("renders Active Sprint card with days remaining", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Active Sprint")).toBeInTheDocument();
      // Sprint has approximately 10 days left (could be 9 or 10 depending on timing)
      const sprintCard = screen.getByText("Active Sprint").closest(".rounded-xl");
      expect(sprintCard).toHaveTextContent(/\d+d left/);
      expect(sprintCard).toHaveTextContent("January Sprint");
    });

    it("renders Check-ins Today card with correct count", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Check-ins Today")).toBeInTheDocument();
      // The check-ins count card
      const checkInsCard = screen.getByText("Check-ins Today").closest(".rounded-xl");
      expect(checkInsCard).toHaveTextContent("2");
    });

    it("shows 'None' when no active sprint", () => {
      setupMockQueries({ "sprints.getActive": null });

      render(<AdminDashboard />);

      expect(screen.getByText("None")).toBeInTheDocument();
      expect(screen.getByText("No active sprint")).toBeInTheDocument();
    });
  });

  describe("Viva queue", () => {
    beforeEach(() => {
      setupMockQueries();
    });

    it("renders viva queue with pending count badge", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Viva Queue")).toBeInTheDocument();
      // Find the badge within the viva queue section specifically
      const vivaQueueHeader = screen.getByText("Viva Queue");
      const vivaQueueCard = vivaQueueHeader.closest(".rounded-xl");
      expect(vivaQueueCard).toHaveTextContent("2 pending");
    });

    it("displays viva request details (student name, objective, domain)", () => {
      render(<AdminDashboard />);

      // First viva request - Alice also appears elsewhere so check for at least one
      expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Master JavaScript Basics")).toBeInTheDocument();
      expect(screen.getByText("Programming")).toBeInTheDocument();

      // Second viva request - Bob also appears elsewhere
      expect(screen.getAllByText("Bob Smith").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Complete Math Fundamentals")).toBeInTheDocument();
      expect(screen.getByText("Mathematics")).toBeInTheDocument();
    });

    it("calls updateStatus mutation on double-click to approve viva", async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      // Find the viva queue section
      const vivaQueueHeader = screen.getByText("Viva Queue");
      const vivaQueueCard = vivaQueueHeader.closest(".rounded-xl");

      // Find buttons within viva queue (not including header buttons)
      const buttons = vivaQueueCard?.querySelectorAll('.p-3 button');
      expect(buttons?.length).toBeGreaterThanOrEqual(1);

      // Double-click the first approve button
      await user.dblClick(buttons![0]);

      await waitFor(() => {
        expect(mockUpdateStatus).toHaveBeenCalledWith({
          studentMajorObjectiveId: "viva_1",
          status: "mastered",
        });
      });

      expect(toast.success).toHaveBeenCalledWith("Viva approved for Alice Johnson");
    });

    it("shows error toast when viva approval fails", async () => {
      const user = userEvent.setup();
      mockUpdateStatus.mockRejectedValueOnce(new Error("Network error"));

      render(<AdminDashboard />);

      // Find the viva queue section
      const vivaQueueHeader = screen.getByText("Viva Queue");
      const vivaQueueCard = vivaQueueHeader.closest(".rounded-xl");
      const buttons = vivaQueueCard?.querySelectorAll('.p-3 button');

      await user.dblClick(buttons![0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to approve viva. Please try again.");
      });
    });

    it("shows empty state when no viva requests", () => {
      setupMockQueries({ "objectives.getVivaRequests": [] });

      render(<AdminDashboard />);

      expect(screen.getByText("No pending vivas.")).toBeInTheDocument();
      expect(screen.getByText("All caught up!")).toBeInTheDocument();
    });
  });

  describe("Presentation queue", () => {
    beforeEach(() => {
      setupMockQueries();
    });

    it("renders presentation queue with pending count badge", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Presentations")).toBeInTheDocument();
      // Find the badge within the presentation queue section specifically
      const presentationHeader = screen.getByText("Presentations");
      const presentationCard = presentationHeader.closest(".rounded-xl");
      expect(presentationCard).toHaveTextContent("2 pending");
    });

    it("displays presentation request details (student name, book title, author)", () => {
      render(<AdminDashboard />);

      // First presentation request
      expect(screen.getByText("The Great Gatsby")).toBeInTheDocument();
      expect(screen.getByText("by F. Scott Fitzgerald")).toBeInTheDocument();

      // Second presentation request
      expect(screen.getByText("1984")).toBeInTheDocument();
      expect(screen.getByText("by George Orwell")).toBeInTheDocument();
    });

    it("calls approvePresentationRequest mutation on double-click to approve", async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      // Find presentation queue card
      const presentationHeader = screen.getByText("Presentations");
      const presentationCard = presentationHeader.closest(".rounded-xl");
      const buttons = presentationCard?.querySelectorAll('.p-3 button');
      expect(buttons?.length).toBeGreaterThanOrEqual(1);

      await user.dblClick(buttons![0]);

      await waitFor(() => {
        expect(mockApprovePresentationRequest).toHaveBeenCalledWith({
          studentBookId: "pres_1",
          approved: true,
        });
      });

      expect(toast.success).toHaveBeenCalledWith("Presentation approved for Alice Johnson");
    });

    it("shows error toast when presentation approval fails", async () => {
      const user = userEvent.setup();
      mockApprovePresentationRequest.mockRejectedValueOnce(new Error("Network error"));

      render(<AdminDashboard />);

      // Find presentation queue card
      const presentationHeader = screen.getByText("Presentations");
      const presentationCard = presentationHeader.closest(".rounded-xl");
      const buttons = presentationCard?.querySelectorAll('.p-3 button');

      await user.dblClick(buttons![0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to approve presentation. Please try again.");
      });
    });

    it("shows empty state when no presentation requests", () => {
      setupMockQueries({ "books.getPresentationRequests": [] });

      render(<AdminDashboard />);

      expect(screen.getByText("No pending presentations.")).toBeInTheDocument();
    });
  });

  describe("Today's check-ins", () => {
    beforeEach(() => {
      setupMockQueries();
    });

    it("renders today's check-ins section with count badge", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Today's Check-ins")).toBeInTheDocument();
      expect(screen.getByText("2 check-ins")).toBeInTheDocument();
    });

    it("displays check-in with user name", () => {
      render(<AdminDashboard />);

      // Both Alice and Bob appear in check-ins (and elsewhere)
      expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Bob Smith").length).toBeGreaterThanOrEqual(1);
    });

    it("displays check-in with category name and emoji", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Happy")).toBeInTheDocument();
      expect(screen.getByText("😊")).toBeInTheDocument();
      expect(screen.getByText("Focused")).toBeInTheDocument();
      expect(screen.getByText("🎯")).toBeInTheDocument();
    });

    it("displays check-in with subcategory name", () => {
      render(<AdminDashboard />);

      expect(screen.getByText(/Optimistic/)).toBeInTheDocument();
      expect(screen.getByText(/Determined/)).toBeInTheDocument();
    });

    it("displays journal entry when present", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Feeling good about today's learning")).toBeInTheDocument();
    });

    it("shows empty state when no check-ins today", () => {
      setupMockQueries({ "emotions.getTodayCheckIns": [] });

      render(<AdminDashboard />);

      expect(screen.getByText("No check-ins yet today.")).toBeInTheDocument();
      expect(screen.getByText("Students will check in when they log in.")).toBeInTheDocument();
    });
  });

  describe("Students overview", () => {
    beforeEach(() => {
      setupMockQueries();
    });

    it("renders students overview section", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Students Overview")).toBeInTheDocument();
      expect(screen.getByText("Recent activity and progress")).toBeInTheDocument();
    });

    it("displays student names", () => {
      render(<AdminDashboard />);

      // Alice and Bob appear in multiple places, Charlie appears in presentations and students
      expect(screen.getAllByText("Alice Johnson").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Bob Smith").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Charlie Brown").length).toBeGreaterThanOrEqual(1);
    });

    it("shows empty state when no students", () => {
      setupMockQueries({ "users.getAll": [] });

      render(<AdminDashboard />);

      expect(screen.getByText("No students yet.")).toBeInTheDocument();
      expect(screen.getByText("Create student accounts to get started!")).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    beforeEach(() => {
      setupMockQueries();
    });

    it("navigates to students page when clicking Total Students card", async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      const studentsCard = screen.getByText("Total Students").closest(".cursor-pointer");
      await user.click(studentsCard!);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/students");
    });

    it("navigates to viva page when clicking Pending Vivas card", async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      const vivaCard = screen.getByText("Pending Vivas").closest(".cursor-pointer");
      await user.click(vivaCard!);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/viva");
    });

    it("navigates to sprints page when clicking Active Sprint card", async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      const sprintCard = screen.getByText("Active Sprint").closest(".cursor-pointer");
      await user.click(sprintCard!);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/sprints");
    });
  });

  describe("Quick actions", () => {
    beforeEach(() => {
      setupMockQueries();
    });

    it("renders quick action buttons", () => {
      render(<AdminDashboard />);

      // Find the Quick Actions section
      const quickActionsHeader = screen.getByText("Quick Actions");
      const quickActionsCard = quickActionsHeader.closest(".rounded-xl");

      expect(quickActionsCard).toHaveTextContent("Add Student");
      expect(quickActionsCard).toHaveTextContent("Manage Sprint");
      expect(quickActionsCard).toHaveTextContent("Add Objective");
      expect(quickActionsCard).toHaveTextContent("Add Book");
    });

    it("navigates to correct page when clicking quick actions", async () => {
      const user = userEvent.setup();
      render(<AdminDashboard />);

      // Find the Quick Actions section and click one of the buttons
      const quickActionsHeader = screen.getByText("Quick Actions");
      const quickActionsCard = quickActionsHeader.closest(".rounded-xl");
      const addStudentButton = quickActionsCard?.querySelector('button');
      await user.click(addStudentButton!);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/students");
    });
  });

  describe("Setup checklist", () => {
    it("shows setup checklist when system needs configuration", () => {
      setupMockQueries({
        "users.getAll": [], // No students
        "sprints.getActive": null, // No active sprint
        "objectives.getAll": [], // No objectives
      });

      render(<AdminDashboard />);

      expect(screen.getByText("Getting Started")).toBeInTheDocument();
      expect(screen.getByText("Add Students")).toBeInTheDocument();
      expect(screen.getByText("Create a Sprint")).toBeInTheDocument();
      expect(screen.getByText("Add Learning Objectives")).toBeInTheDocument();
    });

    it("does not show setup checklist when fully configured", () => {
      setupMockQueries();

      render(<AdminDashboard />);

      expect(screen.queryByText("Getting Started")).not.toBeInTheDocument();
    });
  });

  describe("Welcome message", () => {
    beforeEach(() => {
      setupMockQueries();
    });

    it("displays welcome message with coach name", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Welcome back, Coach")).toBeInTheDocument();
    });

    it("shows appropriate subtitle based on setup status", () => {
      render(<AdminDashboard />);

      expect(screen.getByText("Here's what's happening with your students today.")).toBeInTheDocument();
    });
  });
});
