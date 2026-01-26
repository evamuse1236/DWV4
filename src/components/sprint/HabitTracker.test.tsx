/**
 * Tests for HabitTracker component.
 *
 * The HabitTracker displays daily rituals with a date grid,
 * allowing students to toggle completion and view streaks.
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock mutations
const mockToggleCompletion = vi.fn().mockResolvedValue({});
const mockCreateHabit = vi.fn().mockResolvedValue({});
const mockUpdateHabit = vi.fn().mockResolvedValue({});
const mockRemoveHabit = vi.fn().mockResolvedValue({});

// Mock query results
let mockHabitsData: any[] | undefined = [];

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockHabitsData),
  useMutation: vi.fn((mutationName) => {
    if (mutationName === "habits.toggleCompletion") return mockToggleCompletion;
    if (mutationName === "habits.create") return mockCreateHabit;
    if (mutationName === "habits.update") return mockUpdateHabit;
    if (mutationName === "habits.remove") return mockRemoveHabit;
    return vi.fn().mockResolvedValue({});
  }),
}));

// Mock the API
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    habits: {
      getByUserAndSprint: "habits.getByUserAndSprint",
      toggleCompletion: "habits.toggleCompletion",
      create: "habits.create",
      update: "habits.update",
      remove: "habits.remove",
    },
  },
}));

// Mock CSS module
vi.mock("../../pages/student/sprint.module.css", () => ({
  default: {
    "habit-section-title": "habit-section-title",
    "habits-container": "habits-container",
    "art-habit-card": "art-habit-card",
    "habit-header": "habit-header",
    "habit-info": "habit-info",
    "habit-icon-trigger": "habit-icon-trigger",
    "habit-edit-input": "habit-edit-input",
    "habit-streak": "habit-streak",
    "icon-picker-inline": "icon-picker-inline",
    "icon-grid-inline": "icon-grid-inline",
    "icon-option": "icon-option",
    selected: "selected",
    "habit-week-visual": "habit-week-visual",
    "day-orb-container": "day-orb-container",
    "day-label": "day-label",
    "day-orb": "day-orb",
    completed: "completed",
    "habit-delete-btn": "habit-delete-btn",
    "add-new-card": "add-new-card",
    "new-habit-form": "new-habit-form",
    "new-habit-input": "new-habit-input",
    "new-habit-actions": "new-habit-actions",
    "btn-cancel": "btn-cancel",
    "btn-create": "btn-create",
    "add-new-content": "add-new-content",
    "add-new-label": "add-new-label",
  },
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      onClick,
      className,
      style,
      initial,
      animate,
      exit,
      layout,
      whileHover,
      whileTap,
      transition,
      ...props
    }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock cn utility
vi.mock("../../lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// Import after mocks
import { HabitTracker } from "./HabitTracker";

describe("HabitTracker", () => {
  const defaultProps = {
    userId: "user_123" as any,
    sprintId: "sprint_456" as any,
    weekDates: [
      { date: "2024-01-08", dayOfWeek: 0, dayNum: 8, displayIndex: 0 },
      { date: "2024-01-09", dayOfWeek: 1, dayNum: 9, displayIndex: 1 },
      { date: "2024-01-10", dayOfWeek: 2, dayNum: 10, displayIndex: 2 },
      { date: "2024-01-11", dayOfWeek: 3, dayNum: 11, displayIndex: 3 },
      { date: "2024-01-12", dayOfWeek: 4, dayNum: 12, displayIndex: 4 },
      { date: "2024-01-13", dayOfWeek: 5, dayNum: 13, displayIndex: 5 },
      { date: "2024-01-14", dayOfWeek: 6, dayNum: 14, displayIndex: 6 },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHabitsData = [];
    // Mock window.confirm
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  describe("Rendering", () => {
    it("renders section title 'Daily Rituals'", () => {
      render(<HabitTracker {...defaultProps} />);

      expect(screen.getByText("Daily Rituals")).toBeInTheDocument();
    });

    it("renders 'New Ritual' add button when no habits", () => {
      render(<HabitTracker {...defaultProps} />);

      expect(screen.getByText("New Ritual")).toBeInTheDocument();
    });

    it("renders habits when data is available", () => {
      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Morning Meditation",
          whatIsHabit: "10 minutes of mindfulness",
          description: "ph-sun",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      expect(screen.getByText("Morning Meditation")).toBeInTheDocument();
      expect(screen.getByText("10 minutes of mindfulness")).toBeInTheDocument();
    });

    it("renders day labels for the week", () => {
      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // Day labels: M, T, W, T, F, S, S
      expect(screen.getByText("M")).toBeInTheDocument();
      expect(screen.getAllByText("T")).toHaveLength(2); // Tuesday and Thursday
      expect(screen.getByText("W")).toBeInTheDocument();
      expect(screen.getByText("F")).toBeInTheDocument();
      expect(screen.getAllByText("S")).toHaveLength(2); // Saturday and Sunday
    });
  });

  describe("Date grid - toggling completion", () => {
    it("calls toggleCompletion when clicking a day orb", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // Find the day orb containers
      const dayOrbContainers = document.querySelectorAll(".day-orb-container");
      expect(dayOrbContainers.length).toBe(7);

      // Click the first day
      await user.click(dayOrbContainers[0]);

      expect(mockToggleCompletion).toHaveBeenCalledWith({
        habitId: "habit_1",
        userId: "user_123",
        date: "2024-01-08",
      });
    });

    it("shows completed state for completed days", () => {
      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          completions: [
            { date: "2024-01-08", completed: true },
            { date: "2024-01-09", completed: true },
          ],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // Find completed orbs
      const completedOrbs = document.querySelectorAll(".day-orb.completed");
      expect(completedOrbs.length).toBe(2);
    });

    it("shows uncompleted state for incomplete days", () => {
      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          completions: [{ date: "2024-01-08", completed: true }],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // First orb should be completed
      const completedOrbs = document.querySelectorAll(".day-orb.completed");
      expect(completedOrbs.length).toBe(1);

      // Other 6 orbs should not have completed class
      const allOrbs = document.querySelectorAll(".day-orb");
      expect(allOrbs.length).toBe(7);
    });

    it("toggles completion for a specific date", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          completions: [{ date: "2024-01-08", completed: true }],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // Click the third day (index 2)
      const dayOrbContainers = document.querySelectorAll(".day-orb-container");
      await user.click(dayOrbContainers[2]);

      expect(mockToggleCompletion).toHaveBeenCalledWith({
        habitId: "habit_1",
        userId: "user_123",
        date: "2024-01-10",
      });
    });
  });

  describe("Weekly completion count", () => {
    it("displays 0 when no completions", () => {
      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("/7")).toBeInTheDocument();
    });

    it("counts completions within the displayed week", () => {
      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          completions: [
            { date: "2024-01-08", completed: true },
            { date: "2024-01-09", completed: true },
            { date: "2024-01-10", completed: true },
          ],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("ignores completions outside the displayed week", () => {
      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          completions: [
            { date: "2024-01-08", completed: true },
            { date: "2024-01-01", completed: true }, // previous week
            { date: "2024-01-15", completed: true }, // next week
          ],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // Only 1 completion falls within the displayed week dates
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("does not count uncompleted entries", () => {
      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          completions: [
            { date: "2024-01-08", completed: true },
            { date: "2024-01-09", completed: false },
            { date: "2024-01-10", completed: true },
          ],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  describe("Creating habits", () => {
    it("shows form when clicking New Ritual", async () => {
      const user = userEvent.setup();

      render(<HabitTracker {...defaultProps} />);

      await user.click(screen.getByText("New Ritual"));

      expect(screen.getByPlaceholderText("Habit name...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    });

    it("calls createHabit when submitting form", async () => {
      const user = userEvent.setup();

      render(<HabitTracker {...defaultProps} />);

      await user.click(screen.getByText("New Ritual"));
      await user.type(
        screen.getByPlaceholderText("Habit name..."),
        "New Morning Routine"
      );
      await user.click(screen.getByRole("button", { name: "Create" }));

      expect(mockCreateHabit).toHaveBeenCalledWith({
        userId: "user_123",
        sprintId: "sprint_456",
        name: "New Morning Routine",
        whatIsHabit: "Define what this habit is",
        howToPractice: "How you'll practice it",
        description: expect.any(String), // Icon
      });
    });

    it("cancels form when clicking Cancel", async () => {
      const user = userEvent.setup();

      render(<HabitTracker {...defaultProps} />);

      await user.click(screen.getByText("New Ritual"));
      await user.type(screen.getByPlaceholderText("Habit name..."), "Test");
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByPlaceholderText("Habit name...")).not.toBeInTheDocument();
      expect(screen.getByText("New Ritual")).toBeInTheDocument();
    });

    it("disables Create button when name is empty", async () => {
      const user = userEvent.setup();

      render(<HabitTracker {...defaultProps} />);

      await user.click(screen.getByText("New Ritual"));

      const createButton = screen.getByRole("button", { name: "Create" });
      expect(createButton).toBeDisabled();
    });

    it("enables Create button when name is provided", async () => {
      const user = userEvent.setup();

      render(<HabitTracker {...defaultProps} />);

      await user.click(screen.getByText("New Ritual"));
      await user.type(screen.getByPlaceholderText("Habit name..."), "Test");

      const createButton = screen.getByRole("button", { name: "Create" });
      expect(createButton).not.toBeDisabled();
    });
  });

  describe("Editing habits", () => {
    it("allows editing habit name by clicking", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Original Name",
          whatIsHabit: "Description",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // Click on the habit name to edit
      await user.click(screen.getByText("Original Name"));

      // Should show input
      const input = screen.getByDisplayValue("Original Name");
      expect(input).toBeInTheDocument();
    });

    it("saves edited name on blur", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Original Name",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // Click to edit
      await user.click(screen.getByText("Original Name"));

      const input = screen.getByDisplayValue("Original Name");
      await user.clear(input);
      await user.type(input, "New Name");
      await user.tab(); // Blur

      expect(mockUpdateHabit).toHaveBeenCalledWith({
        habitId: "habit_1",
        name: "New Name",
      });
    });

    it("saves edited name on Enter", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Original Name",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      await user.click(screen.getByText("Original Name"));

      const input = screen.getByDisplayValue("Original Name");
      await user.clear(input);
      await user.type(input, "New Name{Enter}");

      expect(mockUpdateHabit).toHaveBeenCalledWith({
        habitId: "habit_1",
        name: "New Name",
      });
    });

    it("cancels edit on Escape", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Original Name",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      await user.click(screen.getByText("Original Name"));

      const input = screen.getByDisplayValue("Original Name");
      await user.type(input, "Changed{Escape}");

      // Should not call update
      expect(mockUpdateHabit).not.toHaveBeenCalled();
    });
  });

  describe("Deleting habits", () => {
    it("calls removeHabit when delete button is clicked and confirmed", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Habit to Delete",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      const deleteButton = document.querySelector(".habit-delete-btn");
      expect(deleteButton).toBeInTheDocument();

      await user.click(deleteButton!);

      expect(window.confirm).toHaveBeenCalledWith('Delete "Habit to Delete"?');
      expect(mockRemoveHabit).toHaveBeenCalledWith({ habitId: "habit_1" });
    });

    it("does not delete when confirmation is cancelled", async () => {
      const user = userEvent.setup();
      vi.spyOn(window, "confirm").mockReturnValue(false);

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Habit to Keep",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      const deleteButton = document.querySelector(".habit-delete-btn");
      await user.click(deleteButton!);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockRemoveHabit).not.toHaveBeenCalled();
    });
  });

  describe("Icon picker", () => {
    it("opens icon picker when clicking habit icon", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          description: "ph-sun",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      const iconTrigger = document.querySelector(".habit-icon-trigger");
      await user.click(iconTrigger!);

      // Icon picker should be visible
      expect(document.querySelector(".icon-picker-inline")).toBeInTheDocument();
    });

    it("updates habit icon when selecting from picker", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Test Habit",
          description: "ph-sun",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // Open icon picker
      const iconTrigger = document.querySelector(".habit-icon-trigger");
      await user.click(iconTrigger!);

      // Select a different icon
      const iconOptions = document.querySelectorAll(".icon-option");
      await user.click(iconOptions[0]);

      expect(mockUpdateHabit).toHaveBeenCalledWith({
        habitId: "habit_1",
        description: expect.any(String),
      });
    });
  });

  describe("Multiple habits", () => {
    it("renders multiple habits correctly", () => {
      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Habit One",
          completions: [],
        },
        {
          _id: "habit_2",
          name: "Habit Two",
          completions: [],
        },
        {
          _id: "habit_3",
          name: "Habit Three",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      expect(screen.getByText("Habit One")).toBeInTheDocument();
      expect(screen.getByText("Habit Two")).toBeInTheDocument();
      expect(screen.getByText("Habit Three")).toBeInTheDocument();
    });

    it("tracks completions independently for each habit", async () => {
      const user = userEvent.setup();

      mockHabitsData = [
        {
          _id: "habit_1",
          name: "Habit One",
          completions: [{ date: "2024-01-08", completed: true }],
        },
        {
          _id: "habit_2",
          name: "Habit Two",
          completions: [],
        },
      ];

      render(<HabitTracker {...defaultProps} />);

      // First habit should have 1 completion
      const habitCards = document.querySelectorAll(".art-habit-card");
      const firstHabitCompletedOrbs =
        habitCards[0].querySelectorAll(".day-orb.completed");
      expect(firstHabitCompletedOrbs.length).toBe(1);

      // Second habit should have no completions
      const secondHabitCompletedOrbs =
        habitCards[1].querySelectorAll(".day-orb.completed");
      expect(secondHabitCompletedOrbs.length).toBe(0);
    });
  });
});
