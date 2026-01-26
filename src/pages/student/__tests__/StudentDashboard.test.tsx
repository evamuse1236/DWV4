/**
 * Tests for StudentDashboard component.
 *
 * The dashboard displays:
 * - A greeting with the user's name
 * - A main "Deep Work" card showing mastered objectives count
 * - A Sprint card showing current sprint info and tasks left
 * - A Reading card showing the currently reading book
 * - Domain cards for each learning domain
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => (globalThis as any).__testQueryResults),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
}));

// Mock the API
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    domains: { getAll: "domains.getAll" },
    sprints: { getActive: "sprints.getActive" },
    goals: { getByUserAndSprint: "goals.getByUserAndSprint" },
    progress: { getDomainSummary: "progress.getDomainSummary" },
    books: { getCurrentlyReading: "books.getCurrentlyReading" },
    emotions: { deleteTodayCheckIn: "emotions.deleteTodayCheckIn" },
  },
}));

// Mock dependencies
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

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

vi.mock("../../../hooks/useDelayedLoading", () => ({
  useDelayedLoading: vi.fn((isLoading: boolean) => isLoading),
}));

// Mock framer-motion - filter out animation-specific props to avoid React warnings
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Import after mocking
import { StudentDashboard } from "../StudentDashboard";
import { useQuery } from "convex/react";
import { useDelayedLoading } from "../../../hooks/useDelayedLoading";

// Mock data
const mockDomains = [
  { _id: "domain_1", name: "Math", icon: "+" },
  { _id: "domain_2", name: "Reading", icon: "B" },
  { _id: "domain_3", name: "Writing", icon: "W" },
  { _id: "domain_4", name: "Coding", icon: "C" },
];

const mockActiveSprint = {
  _id: "sprint_1",
  name: "January Sprint",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  status: "active",
};

const mockGoals = [
  {
    _id: "goal_1",
    title: "Read 20 pages daily",
    status: "in_progress",
    actionItems: [
      { _id: "item_1", title: "Read chapter 1", isCompleted: true },
      { _id: "item_2", title: "Read chapter 2", isCompleted: false },
    ],
  },
];

const mockDomainProgress = [
  { domain: mockDomains[0], mastered: 5, inProgress: 2, assigned: 1, total: 8 },
  { domain: mockDomains[1], mastered: 3, inProgress: 1, assigned: 0, total: 4 },
];

const mockCurrentBook = {
  book: {
    _id: "book_1",
    title: "Harry Potter",
    author: "J.K. Rowling",
  },
};

// Mock query implementation that returns different values based on call order
const mockQueryValues = {
  domains: mockDomains,
  sprint: mockActiveSprint,
  goals: mockGoals,
  progress: mockDomainProgress,
  book: mockCurrentBook,
};

describe("StudentDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to return undefined by default (loading)
    (globalThis as any).__testQueryResults = undefined;
  });

  describe("Loading state", () => {
    it("shows skeleton when data is loading and delay threshold passed", () => {
      (useDelayedLoading as any).mockReturnValue(true);

      render(<StudentDashboard />);

      // Should render skeleton
      const skeleton = document.querySelector(".bento-grid");
      expect(skeleton).toBeInTheDocument();
    });

    it("renders nothing briefly when data is loading but under delay threshold", () => {
      (useDelayedLoading as any).mockReturnValue(false);

      const { container } = render(<StudentDashboard />);

      // Should render null
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Data display", () => {
    beforeEach(() => {
      // Set up to return mock data
      let callCount = 0;
      (useQuery as any).mockImplementation(() => {
        callCount++;
        // Return data in order: domains, sprint, goals, progress, book
        switch (callCount) {
          case 1: return mockDomains;
          case 2: return mockActiveSprint;
          case 3: return mockGoals;
          case 4: return mockDomainProgress;
          case 5: return mockCurrentBook;
          default: return undefined;
        }
      });
      (useDelayedLoading as any).mockReturnValue(false);
    });

    it("displays 'The Daily Overview' label", () => {
      render(<StudentDashboard />);
      expect(screen.getByText(/the daily overview/i)).toBeInTheDocument();
    });

    it("displays Deep Work card", () => {
      render(<StudentDashboard />);
      expect(screen.getByText(/deep work/i)).toBeInTheDocument();
    });

    it("displays mastered objectives count", () => {
      render(<StudentDashboard />);
      // Total mastered is 5 + 3 = 8
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText(/mastered/i)).toBeInTheDocument();
    });

    it("displays Sprint card with current sprint name", () => {
      render(<StudentDashboard />);
      expect(screen.getByText(/january sprint/i)).toBeInTheDocument();
    });

    it("displays Sprint card with day number", () => {
      render(<StudentDashboard />);
      expect(screen.getByText(/day 1/i)).toBeInTheDocument();
    });

    it("displays Reading card with current book title", () => {
      render(<StudentDashboard />);
      expect(screen.getByText(/harry potter/i)).toBeInTheDocument();
    });

    it("displays Reading card with current book author", () => {
      render(<StudentDashboard />);
      expect(screen.getByText(/j\.k\. rowling/i)).toBeInTheDocument();
    });

    it("displays domain cards", () => {
      render(<StudentDashboard />);
      expect(screen.getByText("Math")).toBeInTheDocument();
      expect(screen.getByText("Reading")).toBeInTheDocument();
    });

    it("shows domain progress as fraction", () => {
      render(<StudentDashboard />);
      // Math: 5/8
      expect(screen.getByText("5/8")).toBeInTheDocument();
    });
  });

  describe("No active sprint", () => {
    beforeEach(() => {
      let callCount = 0;
      (useQuery as any).mockImplementation(() => {
        callCount++;
        switch (callCount) {
          case 1: return mockDomains;
          case 2: return null; // No sprint
          case 3: return [];
          case 4: return mockDomainProgress;
          case 5: return null;
          default: return undefined;
        }
      });
      (useDelayedLoading as any).mockReturnValue(false);
    });

    it("shows 'No Sprint' when there is no active sprint", () => {
      render(<StudentDashboard />);
      expect(screen.getByText(/no sprint/i)).toBeInTheDocument();
    });
  });

  describe("No current book", () => {
    beforeEach(() => {
      let callCount = 0;
      (useQuery as any).mockImplementation(() => {
        callCount++;
        switch (callCount) {
          case 1: return mockDomains;
          case 2: return mockActiveSprint;
          case 3: return mockGoals;
          case 4: return mockDomainProgress;
          case 5: return null; // No book
          default: return undefined;
        }
      });
      (useDelayedLoading as any).mockReturnValue(false);
    });

    it("shows 'Start a Book' when user has no current book", () => {
      render(<StudentDashboard />);
      expect(screen.getByText(/start a book/i)).toBeInTheDocument();
    });
  });
});
