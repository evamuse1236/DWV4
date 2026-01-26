/**
 * Tests for SprintPage component.
 *
 * The sprint page displays:
 * - Sprint header with name and week toggle
 * - Goals container with up to 3 goal slots
 * - Week view with 7 day columns
 * - Habit tracker at the bottom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock scrollIntoView before any component imports
beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
  useAction: vi.fn(() => vi.fn().mockResolvedValue({ content: "AI response" })),
}));

// Mock the API
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    sprints: { getActive: "sprints.getActive" },
    goals: {
      getByUserAndSprint: "goals.getByUserAndSprint",
      getPreviousSprintGoals: "goals.getPreviousSprintGoals",
      create: "goals.create",
      update: "goals.update",
      remove: "goals.remove",
      toggleActionItem: "goals.toggleActionItem",
      updateActionItem: "goals.updateActionItem",
      addActionItem: "goals.addActionItem",
      removeActionItem: "goals.removeActionItem",
      duplicate: "goals.duplicate",
      importGoal: "goals.importGoal",
    },
    habits: { update: "habits.update" },
    ai: { chat: "ai.chat" },
    chatLogs: { log: "chatLogs.log", clearAll: "chatLogs.clearAll", exportLogs: "chatLogs.exportLogs" },
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

// Mock framer-motion - filter out animation-specific props
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, className, style, layout, layoutId, whileHover, whileTap, initial, animate, exit, variants, transition, ...props }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
    button: ({ children, onClick, className, whileHover, whileTap, initial, animate, exit, variants, transition, ...props }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock child components
vi.mock("../../../components/sprint", () => ({
  GoalEditor: ({ onSave, onCancel }: any) => (
    <div data-testid="goal-editor">
      <button onClick={() => onSave({ title: "Test Goal" })}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  HabitTracker: () => <div data-testid="habit-tracker">Habit Tracker</div>,
}));

vi.mock("../../../components/student/TaskAssigner", () => ({
  TaskAssigner: () => <div data-testid="task-assigner">Task Assigner</div>,
}));

vi.mock("../../../components/paper", () => ({
  Modal: ({ children, isOpen, title }: any) =>
    isOpen ? (
      <div data-testid="modal" role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

// Import after mocking
import { SprintPage } from "../SprintPage";
import { useQuery } from "convex/react";

// Mock data
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
    specific: "Read 20 pages every day",
    measurable: "Track pages in journal",
    achievable: "Yes",
    relevant: "Improve reading skills",
    timeBound: "This sprint",
    actionItems: [
      { _id: "item_1", title: "Read chapter 1", isCompleted: true, weekNumber: 1, dayOfWeek: 1 },
      { _id: "item_2", title: "Read chapter 2", isCompleted: false, weekNumber: 1, dayOfWeek: 2 },
    ],
  },
  {
    _id: "goal_2",
    title: "Practice math problems",
    status: "not_started",
    specific: "Solve 10 problems daily",
    measurable: "Complete workbook",
    achievable: "Yes",
    relevant: "Better at math",
    timeBound: "This sprint",
    actionItems: [],
  },
];

describe("SprintPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("No active sprint", () => {
    beforeEach(() => {
      // Return null for sprint query
      (useQuery as any).mockImplementation((_query: any, args: any) => {
        if (args === "skip") return undefined;
        return null;
      });
    });

    it("shows 'No Active Cycle' message when no sprint exists", () => {
      render(<SprintPage />);
      expect(screen.getByText(/no active cycle/i)).toBeInTheDocument();
    });

    it("shows 'Waiting for a new sprint' message", () => {
      render(<SprintPage />);
      expect(screen.getByText(/waiting for a/i)).toBeInTheDocument();
    });

    it("shows guidance message to ask coach for a sprint", () => {
      render(<SprintPage />);
      expect(screen.getByText(/ask your coach/i)).toBeInTheDocument();
    });
  });

  describe("With active sprint", () => {
    beforeEach(() => {
      // Use query name to return appropriate data
      (useQuery as any).mockImplementation((query: any, args: any) => {
        if (args === "skip") return undefined;
        if (query === "sprints.getActive") return mockActiveSprint;
        if (query === "goals.getByUserAndSprint") return mockGoals;
        if (query === "goals.getPreviousSprintGoals") return [];
        return undefined;
      });
    });

    it("displays the sprint name", () => {
      render(<SprintPage />);
      expect(screen.getByText(/january sprint/i)).toBeInTheDocument();
    });

    it("displays 'Sprint Cycle' label", () => {
      render(<SprintPage />);
      expect(screen.getByText(/sprint cycle/i)).toBeInTheDocument();
    });

    it("shows week toggle with Week 1 and Week 2 options", () => {
      render(<SprintPage />);
      expect(screen.getByText(/week 1/i)).toBeInTheDocument();
      expect(screen.getByText(/week 2/i)).toBeInTheDocument();
    });

    it("displays existing goals", () => {
      render(<SprintPage />);
      // Goal titles appear in h3 tags within goal cards
      const goalTitles = screen.getAllByRole("heading", { level: 3 });
      const titles = goalTitles.map(h => h.textContent);
      expect(titles).toContain("Read 20 pages daily");
      expect(titles).toContain("Practice math problems");
    });

    it("shows goal status labels", () => {
      render(<SprintPage />);
      // The SprintPage shows "Planned" instead of "Not Started"
      expect(screen.getByText(/in progress/i)).toBeInTheDocument();
      expect(screen.getByText(/planned/i)).toBeInTheDocument();
    });

    it("displays 'Set Goal' button for empty slot", () => {
      render(<SprintPage />);
      // With 2 goals, there should be 1 empty slot
      expect(screen.getByText(/set goal/i)).toBeInTheDocument();
    });

    it("renders the habit tracker component", () => {
      render(<SprintPage />);
      expect(screen.getByTestId("habit-tracker")).toBeInTheDocument();
    });
  });

  describe("Week view", () => {
    beforeEach(() => {
      (useQuery as any).mockImplementation((query: any, args: any) => {
        if (args === "skip") return undefined;
        if (query === "sprints.getActive") return mockActiveSprint;
        if (query === "goals.getByUserAndSprint") return mockGoals;
        if (query === "goals.getPreviousSprintGoals") return [];
        return undefined;
      });
    });

    it("displays all 7 days of the week", () => {
      render(<SprintPage />);
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("Tue")).toBeInTheDocument();
      expect(screen.getByText("Wed")).toBeInTheDocument();
      expect(screen.getByText("Thu")).toBeInTheDocument();
      expect(screen.getByText("Fri")).toBeInTheDocument();
      expect(screen.getByText("Sat")).toBeInTheDocument();
      expect(screen.getByText("Sun")).toBeInTheDocument();
    });

    it("displays tasks in the week view", () => {
      render(<SprintPage />);
      // Tasks appear in the week grid
      const tasks = screen.getAllByText(/read chapter/i);
      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("No goals state", () => {
    beforeEach(() => {
      (useQuery as any).mockImplementation((query: any, args: any) => {
        if (args === "skip") return undefined;
        if (query === "sprints.getActive") return mockActiveSprint;
        if (query === "goals.getByUserAndSprint") return []; // No goals
        if (query === "goals.getPreviousSprintGoals") return [];
        return undefined;
      });
    });

    it("shows all empty goal slots when user has no goals", () => {
      render(<SprintPage />);
      // Single "Set Goal" add-slot is shown when there are no goals
      const setGoalButtons = screen.getAllByText(/set goal/i);
      expect(setGoalButtons).toHaveLength(1);
    });
  });

  describe("Goal interaction", () => {
    beforeEach(() => {
      (useQuery as any).mockImplementation((query: any, args: any) => {
        if (args === "skip") return undefined;
        if (query === "sprints.getActive") return mockActiveSprint;
        if (query === "goals.getByUserAndSprint") return mockGoals;
        if (query === "goals.getPreviousSprintGoals") return [];
        return undefined;
      });
    });

    it("expands goal on click to add expanded class", async () => {
      const user = userEvent.setup();
      render(<SprintPage />);

      // Find goal card (has goal-slot class)
      const goalSlots = document.querySelectorAll("._goal-slot_d0d5e3._filled_d0d5e3");
      expect(goalSlots.length).toBe(2);

      // First goal should not be expanded initially
      expect(goalSlots[0].classList.contains("_expanded_d0d5e3")).toBe(false);

      // Click the goal (clicking the card should toggle expansion)
      await user.click(goalSlots[0]);

      // Now it should have expanded class
      expect(goalSlots[0].classList.contains("_expanded_d0d5e3")).toBe(true);
    });

    it("toggles goal expansion on click", async () => {
      const user = userEvent.setup();
      render(<SprintPage />);

      const goalSlots = document.querySelectorAll("._goal-slot_d0d5e3._filled_d0d5e3");

      // Click to expand
      await user.click(goalSlots[0]);
      expect(goalSlots[0].classList.contains("_expanded_d0d5e3")).toBe(true);

      // Click again to collapse
      await user.click(goalSlots[0]);
      expect(goalSlots[0].classList.contains("_expanded_d0d5e3")).toBe(false);
    });
  });
});
