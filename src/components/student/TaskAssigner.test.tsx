/**
 * Tests for TaskAssigner component.
 *
 * The TaskAssigner guides students through adding tasks to their SMART goals
 * with a weekly calendar view for day selection.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock convex/react
const mockAddActionItem = vi.fn().mockResolvedValue({});

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => mockAddActionItem),
}));

// Mock the API
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    goals: {
      addActionItem: "goals.addActionItem",
    },
  },
}));

// Mock framer-motion - filter out animation-specific props
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
      ...props
    }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
    button: ({
      children,
      onClick,
      className,
      initial,
      animate,
      exit,
      whileHover,
      whileTap,
      disabled,
      ...props
    }: any) => (
      <button onClick={onClick} className={className} disabled={disabled} {...props}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Import after mocks
import { TaskAssigner } from "./TaskAssigner";

describe("TaskAssigner", () => {
  const defaultProps = {
    goalId: "goal_123",
    userId: "user_456",
    goalTitle: "Learn Python Programming",
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddActionItem.mockResolvedValue({});
  });

  describe("Rendering", () => {
    it("renders the goal title", () => {
      render(<TaskAssigner {...defaultProps} />);

      expect(screen.getByText("Learn Python Programming")).toBeInTheDocument();
    });

    it("displays 'Add Tasks For' label", () => {
      render(<TaskAssigner {...defaultProps} />);

      expect(screen.getByText("Add Tasks For")).toBeInTheDocument();
    });

    it("renders week selector with Week 1 and Week 2 buttons", () => {
      render(<TaskAssigner {...defaultProps} />);

      expect(screen.getByRole("button", { name: "Week 1" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Week 2" })).toBeInTheDocument();
    });

    it("renders 7 day columns in the calendar", () => {
      render(<TaskAssigner {...defaultProps} />);

      // Check for day abbreviations
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("Tue")).toBeInTheDocument();
      expect(screen.getByText("Wed")).toBeInTheDocument();
      expect(screen.getByText("Thu")).toBeInTheDocument();
      expect(screen.getByText("Fri")).toBeInTheDocument();
      expect(screen.getByText("Sat")).toBeInTheDocument();
      expect(screen.getByText("Sun")).toBeInTheDocument();
    });

    it("shows 'Add a Task' button initially", () => {
      render(<TaskAssigner {...defaultProps} />);

      expect(screen.getByText("+ Add a Task")).toBeInTheDocument();
    });
  });

  describe("Week selection", () => {
    it("defaults to Week 1 selected", () => {
      render(<TaskAssigner {...defaultProps} />);

      const week1Button = screen.getByRole("button", { name: "Week 1" });
      // Week 1 should have selected styling (bg-[#1a1a1a] text-white)
      expect(week1Button).toHaveClass("bg-[#1a1a1a]");
    });

    it("switches to Week 2 when clicked", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      const week2Button = screen.getByRole("button", { name: "Week 2" });
      await user.click(week2Button);

      // Week 2 should now have selected styling
      expect(week2Button).toHaveClass("bg-[#1a1a1a]");

      // Header should show Week 2
      expect(screen.getByText("Week 2 Tasks")).toBeInTheDocument();
    });

    it("switches back to Week 1 when clicked", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // First switch to Week 2
      await user.click(screen.getByRole("button", { name: "Week 2" }));
      expect(screen.getByText("Week 2 Tasks")).toBeInTheDocument();

      // Then switch back to Week 1
      await user.click(screen.getByRole("button", { name: "Week 1" }));
      expect(screen.getByText("Week 1 Tasks")).toBeInTheDocument();
    });
  });

  describe("Day/week mapping edge cases", () => {
    it("adds task to correct week and day", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // Open add task form
      await user.click(screen.getByText("+ Add a Task"));

      // Type task
      const input = screen.getByPlaceholderText("e.g., Practice multiplication tables");
      await user.type(input, "Study variables");

      // Select Monday (index 0)
      await user.click(screen.getByRole("button", { name: "Mon" }));

      // Add the task
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Task should appear in Week 1, Monday
      expect(screen.getByText("Study variables")).toBeInTheDocument();
    });

    it("adds task to Week 2 when Week 2 is selected", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // Switch to Week 2
      await user.click(screen.getByRole("button", { name: "Week 2" }));

      // Open add task form
      await user.click(screen.getByText("+ Add a Task"));

      // Type task
      const input = screen.getByPlaceholderText("e.g., Practice multiplication tables");
      await user.type(input, "Review week 2");

      // Select Friday (index 4)
      await user.click(screen.getByRole("button", { name: "Fri" }));

      // Add the task
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Task should appear
      expect(screen.getByText("Review week 2")).toBeInTheDocument();
    });

    it("task appears in correct week when switching views", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // Add task to Week 1
      await user.click(screen.getByText("+ Add a Task"));
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Week 1 task"
      );
      await user.click(screen.getByRole("button", { name: "Mon" }));
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Switch to Week 2
      await user.click(screen.getByRole("button", { name: "Week 2" }));

      // Add task to Week 2
      await user.click(screen.getByText("+ Add a Task"));
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Week 2 task"
      );
      await user.click(screen.getByRole("button", { name: "Tue" }));
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Week 2 task should be visible
      expect(screen.getByText("Week 2 task")).toBeInTheDocument();
      // Week 1 task should not be visible (different week view)
      expect(screen.queryByText("Week 1 task")).not.toBeInTheDocument();

      // Switch back to Week 1
      await user.click(screen.getByRole("button", { name: "Week 1" }));

      // Now Week 1 task should be visible
      expect(screen.getByText("Week 1 task")).toBeInTheDocument();
      // Week 2 task should not be visible
      expect(screen.queryByText("Week 2 task")).not.toBeInTheDocument();
    });

    it("handles task added to multiple days", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // Open add task form
      await user.click(screen.getByText("+ Add a Task"));

      // Type task
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Daily practice"
      );

      // Select multiple days
      await user.click(screen.getByRole("button", { name: "Mon" }));
      await user.click(screen.getByRole("button", { name: "Wed" }));
      await user.click(screen.getByRole("button", { name: "Fri" }));

      // Add the task
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Should show task count (3 tasks added)
      expect(screen.getByText("3 tasks added")).toBeInTheDocument();
    });
  });

  describe("Empty state rendering", () => {
    it("shows empty calendar columns when no tasks", () => {
      render(<TaskAssigner {...defaultProps} />);

      // Calendar should render but be empty
      // The grid structure should exist
      const calendarContainer = document.querySelector(".grid.grid-cols-7");
      expect(calendarContainer).toBeInTheDocument();
    });

    it("shows 'DONE' button when no tasks are added", () => {
      render(<TaskAssigner {...defaultProps} />);

      // Should show "DONE" not "SKIP" when no tasks
      expect(screen.getByText("DONE")).toBeInTheDocument();
    });

    it("shows 'SKIP' button when tasks are added", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // Add a task
      await user.click(screen.getByText("+ Add a Task"));
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Test task"
      );
      await user.click(screen.getByRole("button", { name: "Mon" }));
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Should now show "SKIP" instead of "DONE"
      expect(screen.getByText("SKIP")).toBeInTheDocument();
      expect(screen.queryByText("DONE")).not.toBeInTheDocument();
    });

    it("hides save button when no tasks", () => {
      render(<TaskAssigner {...defaultProps} />);

      // Save button should not be present
      expect(screen.queryByText(/save.*tasks/i)).not.toBeInTheDocument();
    });
  });

  describe("Task form validation", () => {
    it("disables Add Task button when task title is empty", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      await user.click(screen.getByText("+ Add a Task"));

      // Select a day but don't type anything
      await user.click(screen.getByRole("button", { name: "Mon" }));

      const addButton = screen.getByRole("button", { name: "Add Task" });
      expect(addButton).toBeDisabled();
    });

    it("disables Add Task button when no days selected", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      await user.click(screen.getByText("+ Add a Task"));

      // Type something but don't select any day
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Test task"
      );

      const addButton = screen.getByRole("button", { name: "Add Task" });
      expect(addButton).toBeDisabled();
    });

    it("enables Add Task button when both title and days are provided", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      await user.click(screen.getByText("+ Add a Task"));

      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Test task"
      );
      await user.click(screen.getByRole("button", { name: "Mon" }));

      const addButton = screen.getByRole("button", { name: "Add Task" });
      expect(addButton).not.toBeDisabled();
    });
  });

  describe("Cancel functionality", () => {
    it("closes form when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // Open form
      await user.click(screen.getByText("+ Add a Task"));
      expect(
        screen.getByPlaceholderText("e.g., Practice multiplication tables")
      ).toBeInTheDocument();

      // Click cancel
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      // Form should close
      expect(
        screen.queryByPlaceholderText("e.g., Practice multiplication tables")
      ).not.toBeInTheDocument();
      expect(screen.getByText("+ Add a Task")).toBeInTheDocument();
    });

    it("clears input when Cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // Open form and type
      await user.click(screen.getByText("+ Add a Task"));
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Test task"
      );

      // Cancel
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      // Reopen form - should be empty
      await user.click(screen.getByText("+ Add a Task"));
      const input = screen.getByPlaceholderText("e.g., Practice multiplication tables");
      expect(input).toHaveValue("");
    });
  });

  describe("Task removal", () => {
    it("removes task when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // Add a task
      await user.click(screen.getByText("+ Add a Task"));
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Task to delete"
      );
      await user.click(screen.getByRole("button", { name: "Mon" }));
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Task should exist
      expect(screen.getByText("Task to delete")).toBeInTheDocument();

      // Find and click delete button (the x button)
      const deleteButton = screen.getByRole("button", { name: /\u00D7/ });
      await user.click(deleteButton);

      // Task should be removed
      expect(screen.queryByText("Task to delete")).not.toBeInTheDocument();
    });
  });

  describe("Save functionality", () => {
    it("calls addActionItem for each task when saving", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      // Add first task
      await user.click(screen.getByText("+ Add a Task"));
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Task 1"
      );
      await user.click(screen.getByRole("button", { name: "Mon" }));
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Add second task
      await user.click(screen.getByText("+ Add a Task"));
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Task 2"
      );
      await user.click(screen.getByRole("button", { name: "Tue" }));
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Click save button
      await user.click(screen.getByRole("button", { name: /save 2 tasks/i }));

      // Should call mutation for each task
      await waitFor(() => {
        expect(mockAddActionItem).toHaveBeenCalledTimes(2);
      });

      expect(mockAddActionItem).toHaveBeenCalledWith({
        goalId: "goal_123",
        userId: "user_456",
        title: "Task 1",
        weekNumber: 1,
        dayOfWeek: 0,
      });

      expect(mockAddActionItem).toHaveBeenCalledWith({
        goalId: "goal_123",
        userId: "user_456",
        title: "Task 2",
        weekNumber: 1,
        dayOfWeek: 1,
      });
    });

    it("calls onClose after successful save", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<TaskAssigner {...defaultProps} onClose={onClose} />);

      // Add a task
      await user.click(screen.getByText("+ Add a Task"));
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Test task"
      );
      await user.click(screen.getByRole("button", { name: "Mon" }));
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Save
      await user.click(screen.getByRole("button", { name: /save 1 task/i }));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("calls onClose when clicking DONE/SKIP without tasks", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<TaskAssigner {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText("DONE"));

      expect(onClose).toHaveBeenCalled();
    });

    it("shows SAVING... state during save", async () => {
      const user = userEvent.setup();
      // Make the mutation take a moment
      mockAddActionItem.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<TaskAssigner {...defaultProps} />);

      // Add a task
      await user.click(screen.getByText("+ Add a Task"));
      await user.type(
        screen.getByPlaceholderText("e.g., Practice multiplication tables"),
        "Test task"
      );
      await user.click(screen.getByRole("button", { name: "Mon" }));
      await user.click(screen.getByRole("button", { name: "Add Task" }));

      // Click save
      await user.click(screen.getByRole("button", { name: /save 1 task/i }));

      // Should show saving state
      expect(screen.getByText("SAVING...")).toBeInTheDocument();
    });
  });

  describe("Day toggle behavior", () => {
    it("toggles day selection on/off", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      await user.click(screen.getByText("+ Add a Task"));

      const mondayButton = screen.getByRole("button", { name: "Mon" });

      // Click to select
      await user.click(mondayButton);
      expect(mondayButton).toHaveClass("bg-[#1a1a1a]");

      // Click again to deselect
      await user.click(mondayButton);
      expect(mondayButton).not.toHaveClass("bg-[#1a1a1a]");
    });

    it("allows selecting multiple days", async () => {
      const user = userEvent.setup();
      render(<TaskAssigner {...defaultProps} />);

      await user.click(screen.getByText("+ Add a Task"));

      const mondayButton = screen.getByRole("button", { name: "Mon" });
      const wednesdayButton = screen.getByRole("button", { name: "Wed" });

      await user.click(mondayButton);
      await user.click(wednesdayButton);

      expect(mondayButton).toHaveClass("bg-[#1a1a1a]");
      expect(wednesdayButton).toHaveClass("bg-[#1a1a1a]");
    });
  });
});
