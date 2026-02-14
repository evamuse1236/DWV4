/**
 * Tests for admin SprintsPage component.
 *
 * The page allows admins to:
 * - Create, edit, and delete sprints
 * - View the active sprint indicator
 * - Set a sprint as active
 *
 * Test cases from TEST-PLAN.md section 3:
 * - Create/edit/delete sprint
 * - Active sprint indicator
 * - Set active calls api.sprints.setActive
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import React from "react";

// Store dialog open states for our mock
let dialogStates: Record<string, boolean> = {};

// Mock Radix UI DropdownMenu to avoid jsdom issues
vi.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: any) => <>{children}</>,
  Trigger: ({ children, asChild }: any) =>
    asChild ? children : <button>{children}</button>,
  Content: ({ children }: any) => <div role="menu">{children}</div>,
  Item: ({ children, onSelect, onClick, className }: any) => (
    <div
      role="menuitem"
      className={className}
      onClick={() => {
        onSelect?.();
        onClick?.();
      }}
    >
      {children}
    </div>
  ),
  Portal: ({ children }: any) => <>{children}</>,
  Separator: () => <hr />,
  Group: ({ children }: any) => <>{children}</>,
  Sub: ({ children }: any) => <>{children}</>,
  SubTrigger: ({ children }: any) => <>{children}</>,
  SubContent: ({ children }: any) => <>{children}</>,
  RadioGroup: ({ children }: any) => <>{children}</>,
  RadioItem: ({ children }: any) => <>{children}</>,
  CheckboxItem: ({ children }: any) => <>{children}</>,
  ItemIndicator: ({ children }: any) => <>{children}</>,
  Label: ({ children }: any) => <>{children}</>,
}));

// Mock Radix UI Dialog - needs to track open state properly
vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ children, open, onOpenChange }: any) => {
    // Use a context-like approach via data attributes
    return (
      <div data-dialog-open={open ? "true" : "false"}>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;
          // Pass open state to children via cloning
          return React.cloneElement(child as React.ReactElement<any>, {
            "data-parent-open": open,
            onOpenChange,
          });
        })}
      </div>
    );
  },
  Trigger: ({ children, asChild, "data-parent-open": parentOpen, onOpenChange }: any) => {
    if (asChild) {
      // Clone the child and add onClick
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: any) => {
          children.props?.onClick?.(e);
          onOpenChange?.(true);
        },
      });
    }
    return <button onClick={() => onOpenChange?.(true)}>{children}</button>;
  },
  Portal: ({ children }: any) => <>{children}</>,
  Overlay: () => <div data-testid="dialog-overlay" />,
  Content: ({ children, "data-parent-open": parentOpen }: any) => {
    // Only render content if parent is open
    if (parentOpen === false) return null;
    return <div role="dialog">{children}</div>;
  },
  Title: ({ children }: any) => <h2>{children}</h2>,
  Description: ({ children }: any) => <p>{children}</p>,
  Close: ({ children, asChild }: any) =>
    asChild ? children : <button>{children}</button>,
}));

// Mock convex/react
const mockCreateSprint = vi.fn();
const mockUpdateSprint = vi.fn();
const mockSetActive = vi.fn();
const mockDeleteSprint = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((mutationName: string) => {
    if (mutationName === "sprints.create") return mockCreateSprint;
    if (mutationName === "sprints.update") return mockUpdateSprint;
    if (mutationName === "sprints.setActive") return mockSetActive;
    if (mutationName === "sprints.remove") return mockDeleteSprint;
    return vi.fn().mockResolvedValue({});
  }),
}));

// Mock the API
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    sprints: {
      getAll: "sprints.getAll",
      getActive: "sprints.getActive",
      getStudentInsights: "sprints.getStudentInsights",
      create: "sprints.create",
      update: "sprints.update",
      setActive: "sprints.setActive",
      remove: "sprints.remove",
    },
  },
}));

// Mock useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "admin_123",
      username: "admin",
      displayName: "Admin User",
      role: "admin",
    },
    isLoading: false,
  })),
}));

// Import after mocks
import { SprintsPage } from "../SprintsPage";
import { useQuery, useMutation } from "convex/react";

// Mock data - use dates relative to now for accurate status detection
const now = new Date();
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
const threeWeeksFromNow = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

const formatDateForInput = (date: Date) => date.toISOString().split("T")[0];

const mockActiveSprint = {
  _id: "sprint_1",
  name: "January Sprint",
  startDate: formatDateForInput(oneWeekAgo),
  endDate: formatDateForInput(oneWeekFromNow),
  isActive: true,
};

const mockInactiveSprint = {
  _id: "sprint_2",
  name: "December Sprint",
  startDate: formatDateForInput(twoWeeksAgo),
  endDate: formatDateForInput(oneWeekAgo),
  isActive: false,
};

const mockFutureSprint = {
  _id: "sprint_3",
  name: "February Sprint",
  startDate: formatDateForInput(twoWeeksFromNow),
  endDate: formatDateForInput(threeWeeksFromNow),
  isActive: false,
};

const mockSprints = [mockActiveSprint, mockInactiveSprint, mockFutureSprint];

const mockStudentInsights = {
  sprint: {
    _id: "sprint_1",
    name: "January Sprint",
    startDate: mockActiveSprint.startDate,
    endDate: mockActiveSprint.endDate,
    totalDays: 14,
    elapsedDays: 7,
  },
  students: [
    {
      student: {
        _id: "student_1",
        displayName: "Alex Carter",
        username: "alex.carter",
        batch: "2156",
      },
      metrics: {
        goalsTotal: 2,
        goalsCompleted: 1,
        goalCompletionPercent: 50,
        tasksTotal: 6,
        tasksCompleted: 3,
        taskCompletionPercent: 50,
        habitsTotal: 2,
        habitCompletedTotal: 8,
        habitExpectedTotal: 14,
        habitConsistencyPercent: 57,
        engagementScore: 52,
      },
      currentFocus: {
        goals: ["Improve math fluency"],
        tasks: [
          {
            _id: "task_1",
            title: "Practice equations",
            weekNumber: 1,
            dayOfWeek: 2,
            scheduledTime: "4pm",
            isCompleted: false,
          },
        ],
      },
      goals: [
        {
          _id: "goal_1",
          title: "Improve math fluency",
          status: "in_progress",
          tasksTotal: 4,
          tasksCompleted: 2,
          actionItems: [],
        },
      ],
      habits: [
        {
          _id: "habit_1",
          name: "Daily reflection",
          completedCount: 5,
          expectedCount: 7,
          consistencyPercent: 71,
        },
      ],
    },
  ],
};

describe("SprintsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dialogStates = {};

    // Default mock implementation
    (useQuery as Mock).mockImplementation((query: string) => {
      if (query === "sprints.getAll") return mockSprints;
      if (query === "sprints.getActive") return mockActiveSprint;
      if (query === "sprints.getStudentInsights") return mockStudentInsights;
      return undefined;
    });

    // Reset mutation mocks
    mockCreateSprint.mockResolvedValue({ _id: "new_sprint" });
    mockUpdateSprint.mockResolvedValue({ success: true });
    mockSetActive.mockResolvedValue({ success: true });
    mockDeleteSprint.mockResolvedValue({ success: true });

    // Update useMutation mock
    (useMutation as Mock).mockImplementation((mutationName: string) => {
      if (mutationName === "sprints.create") return mockCreateSprint;
      if (mutationName === "sprints.update") return mockUpdateSprint;
      if (mutationName === "sprints.setActive") return mockSetActive;
      if (mutationName === "sprints.remove") return mockDeleteSprint;
      return vi.fn().mockResolvedValue({});
    });
  });

  describe("Sprint listing", () => {
    it("renders the page header with title", () => {
      render(<SprintsPage />);
      expect(screen.getByText("Sprints")).toBeInTheDocument();
      expect(
        screen.getByText("Manage learning sprints and time-boxed goals")
      ).toBeInTheDocument();
    });

    it("displays all sprints in the table", () => {
      render(<SprintsPage />);
      // Use getAllByText since sprint names appear in both the active card and table
      expect(screen.getAllByText("January Sprint").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("December Sprint")).toBeInTheDocument();
      expect(screen.getByText("February Sprint")).toBeInTheDocument();
    });

    it("shows empty state when no sprints exist", () => {
      (useQuery as Mock).mockImplementation((query: string) => {
        if (query === "sprints.getAll") return [];
        if (query === "sprints.getActive") return null;
        return undefined;
      });

      render(<SprintsPage />);
      expect(screen.getByText("No sprints yet")).toBeInTheDocument();
      expect(
        screen.getByText("Create your first sprint to get started")
      ).toBeInTheDocument();
    });
  });

  describe("Student insights", () => {
    it("renders one-stop student goal insights section", () => {
      render(<SprintsPage />);

      expect(screen.getByText("Student Goal Insights")).toBeInTheDocument();
      expect(
        screen.getByText(
          "One place to review each student's goals, tasks, habits, and sprint progress."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Alex Carter")).toBeInTheDocument();
      expect(screen.getByText(/engagement 52%/i)).toBeInTheDocument();
    });

    it("filters student insight cards by search query", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const searchInput = screen.getByPlaceholderText(
        "Search by name, username, or batch"
      );
      await user.type(searchInput, "not-a-student");

      expect(screen.getByText("No students match this search.")).toBeInTheDocument();
      expect(screen.queryByText("Alex Carter")).not.toBeInTheDocument();
    });
  });

  describe("Active sprint indicator", () => {
    it("displays the active sprint card with Active badge", () => {
      render(<SprintsPage />);

      // Find all Active badges - one in card header, one in table
      const activeBadges = screen.getAllByText("Active");
      expect(activeBadges.length).toBeGreaterThanOrEqual(1);
    });

    it("shows Active badge on the active sprint row in the table", () => {
      render(<SprintsPage />);

      // Find the table and check for Active badge in January Sprint row
      const table = screen.getByRole("table");
      // Find the row containing January Sprint
      const rows = within(table).getAllByRole("row");
      const januaryRow = rows.find((row) =>
        within(row).queryByText("January Sprint")
      );
      expect(januaryRow).toBeDefined();
      expect(within(januaryRow!).getByText("Active")).toBeInTheDocument();
    });

    it("shows Completed badge for past sprints", () => {
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const decemberRow = rows.find((row) =>
        within(row).queryByText("December Sprint")
      );
      expect(decemberRow).toBeDefined();
      expect(within(decemberRow!).getByText("Completed")).toBeInTheDocument();
    });

    it("shows Upcoming badge for future sprints", () => {
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const februaryRow = rows.find((row) =>
        within(row).queryByText("February Sprint")
      );
      expect(februaryRow).toBeDefined();
      expect(within(februaryRow!).getByText("Upcoming")).toBeInTheDocument();
    });

    it("displays days left in the active sprint card", () => {
      render(<SprintsPage />);
      expect(screen.getByText("days left")).toBeInTheDocument();
    });
  });

  describe("Create sprint", () => {
    it("shows New Sprint button in header", () => {
      render(<SprintsPage />);
      expect(
        screen.getByRole("button", { name: /new sprint/i })
      ).toBeInTheDocument();
    });

    it("opens create dialog when New Sprint button is clicked", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      await user.click(screen.getByRole("button", { name: /new sprint/i }));

      // Dialog should be open - look for dialog content
      await waitFor(() => {
        expect(screen.getByText("Create New Sprint")).toBeInTheDocument();
      });
    });

    it("has Create Sprint button disabled when form is incomplete", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      await user.click(screen.getByRole("button", { name: /new sprint/i }));

      await waitFor(() => {
        const createButton = screen.getByRole("button", { name: /^create sprint$/i });
        expect(createButton).toBeDisabled();
      });
    });

    it("enables Create Sprint button when form is complete", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      await user.click(screen.getByRole("button", { name: /new sprint/i }));

      await waitFor(() => {
        expect(screen.getByText("Create New Sprint")).toBeInTheDocument();
      });

      // Fill in the form - find the input in the create dialog
      const dialogs = screen.getAllByRole("dialog");
      const createDialog = dialogs.find((d) =>
        within(d).queryByText("Create New Sprint")
      );
      expect(createDialog).toBeDefined();

      const nameInput = within(createDialog!).getByPlaceholderText(
        "e.g., Spring 2024 Sprint"
      );
      await user.type(nameInput, "New Test Sprint");

      // Fill in dates
      const dateInputs = within(createDialog!).getAllByRole("textbox");
      const startDateInput = createDialog!.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      const endDateInput = createDialog!.querySelectorAll(
        'input[type="date"]'
      )[1] as HTMLInputElement;

      // Use fireEvent for date inputs since userEvent.type has issues with date inputs
      await user.clear(startDateInput);
      await user.type(startDateInput, "2024-02-01");
      await user.clear(endDateInput);
      await user.type(endDateInput, "2024-02-14");

      const createButton = within(createDialog!).getByRole("button", {
        name: /^create sprint$/i,
      });
      expect(createButton).not.toBeDisabled();
    });

    it("calls createSprint mutation with correct data", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      await user.click(screen.getByRole("button", { name: /new sprint/i }));

      await waitFor(() => {
        expect(screen.getByText("Create New Sprint")).toBeInTheDocument();
      });

      const dialogs = screen.getAllByRole("dialog");
      const createDialog = dialogs.find((d) =>
        within(d).queryByText("Create New Sprint")
      );

      const nameInput = within(createDialog!).getByPlaceholderText(
        "e.g., Spring 2024 Sprint"
      );
      await user.type(nameInput, "New Test Sprint");

      const startDateInput = createDialog!.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      const endDateInput = createDialog!.querySelectorAll(
        'input[type="date"]'
      )[1] as HTMLInputElement;

      await user.clear(startDateInput);
      await user.type(startDateInput, "2024-02-01");
      await user.clear(endDateInput);
      await user.type(endDateInput, "2024-02-14");

      const createButton = within(createDialog!).getByRole("button", {
        name: /^create sprint$/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockCreateSprint).toHaveBeenCalledWith({
          name: "New Test Sprint",
          startDate: "2024-02-01",
          endDate: "2024-02-14",
          createdBy: "admin_123",
        });
      });
    });

    it("shows error message when creation fails", async () => {
      mockCreateSprint.mockRejectedValueOnce(new Error("Creation failed"));

      const user = userEvent.setup();
      render(<SprintsPage />);

      await user.click(screen.getByRole("button", { name: /new sprint/i }));

      await waitFor(() => {
        expect(screen.getByText("Create New Sprint")).toBeInTheDocument();
      });

      const dialogs = screen.getAllByRole("dialog");
      const createDialog = dialogs.find((d) =>
        within(d).queryByText("Create New Sprint")
      );

      const nameInput = within(createDialog!).getByPlaceholderText(
        "e.g., Spring 2024 Sprint"
      );
      await user.type(nameInput, "New Test Sprint");

      const startDateInput = createDialog!.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      const endDateInput = createDialog!.querySelectorAll(
        'input[type="date"]'
      )[1] as HTMLInputElement;

      await user.clear(startDateInput);
      await user.type(startDateInput, "2024-02-01");
      await user.clear(endDateInput);
      await user.type(endDateInput, "2024-02-14");

      const createButton = within(createDialog!).getByRole("button", {
        name: /^create sprint$/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while creating the sprint")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Edit sprint", () => {
    it("opens edit dialog when Edit menu item is clicked", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      // Find and click the menu button for January Sprint
      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const januaryRow = rows.find((row) =>
        within(row).queryByText("January Sprint")
      );
      const menuButton = within(januaryRow!).getByRole("button");

      await user.click(menuButton);

      // Click Edit in the dropdown - use the one in the same row
      const editItem = within(januaryRow!).getByRole("menuitem", { name: /edit/i });
      await user.click(editItem);

      // Check that edit dialog is shown
      await waitFor(() => {
        expect(screen.getByText("Edit Sprint")).toBeInTheDocument();
      });
    });

    it("pre-fills edit form with sprint data", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const januaryRow = rows.find((row) =>
        within(row).queryByText("January Sprint")
      );
      const menuButton = within(januaryRow!).getByRole("button");

      await user.click(menuButton);
      await user.click(within(januaryRow!).getByRole("menuitem", { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText("Edit Sprint")).toBeInTheDocument();
      });

      // Find the edit dialog
      const dialogs = screen.getAllByRole("dialog");
      const editDialog = dialogs.find((d) =>
        within(d).queryByText("Edit Sprint")
      );

      // Check that name is pre-filled
      const nameInput = within(editDialog!).getByPlaceholderText(
        "e.g., Spring 2024 Sprint"
      );
      expect(nameInput).toHaveValue("January Sprint");
    });

    it("calls updateSprint mutation with correct data", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const januaryRow = rows.find((row) =>
        within(row).queryByText("January Sprint")
      );
      const menuButton = within(januaryRow!).getByRole("button");

      await user.click(menuButton);
      await user.click(within(januaryRow!).getByRole("menuitem", { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText("Edit Sprint")).toBeInTheDocument();
      });

      const dialogs = screen.getAllByRole("dialog");
      const editDialog = dialogs.find((d) =>
        within(d).queryByText("Edit Sprint")
      );

      // Update the name
      const nameInput = within(editDialog!).getByPlaceholderText(
        "e.g., Spring 2024 Sprint"
      );
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Sprint Name");

      // Save changes
      const saveButton = within(editDialog!).getByRole("button", {
        name: /save changes/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSprint).toHaveBeenCalledWith({
          sprintId: "sprint_1",
          name: "Updated Sprint Name",
          startDate: mockActiveSprint.startDate,
          endDate: mockActiveSprint.endDate,
        });
      });
    });

    it("shows error message when update fails", async () => {
      mockUpdateSprint.mockRejectedValueOnce(new Error("Update failed"));

      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const januaryRow = rows.find((row) =>
        within(row).queryByText("January Sprint")
      );
      const menuButton = within(januaryRow!).getByRole("button");

      await user.click(menuButton);
      await user.click(within(januaryRow!).getByRole("menuitem", { name: /edit/i }));

      await waitFor(() => {
        expect(screen.getByText("Edit Sprint")).toBeInTheDocument();
      });

      const dialogs = screen.getAllByRole("dialog");
      const editDialog = dialogs.find((d) =>
        within(d).queryByText("Edit Sprint")
      );

      const saveButton = within(editDialog!).getByRole("button", {
        name: /save changes/i,
      });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while updating the sprint")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Delete sprint", () => {
    it("opens delete confirmation dialog when Delete is clicked", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const decemberRow = rows.find((row) =>
        within(row).queryByText("December Sprint")
      );
      const menuButton = within(decemberRow!).getByRole("button");

      await user.click(menuButton);
      await user.click(within(decemberRow!).getByRole("menuitem", { name: /delete/i }));

      await waitFor(() => {
        // Check for the dialog title (h2)
        expect(screen.getByRole("heading", { name: "Delete Sprint" })).toBeInTheDocument();
        expect(
          screen.getByText(/are you sure you want to delete/i)
        ).toBeInTheDocument();
      });
    });

    it("shows warning when deleting the active sprint", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const januaryRow = rows.find((row) =>
        within(row).queryByText("January Sprint")
      );
      const menuButton = within(januaryRow!).getByRole("button");

      await user.click(menuButton);
      await user.click(within(januaryRow!).getByRole("menuitem", { name: /delete/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/this is the currently active sprint/i)
        ).toBeInTheDocument();
      });
    });

    it("calls deleteSprint mutation when confirmed", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const decemberRow = rows.find((row) =>
        within(row).queryByText("December Sprint")
      );
      const menuButton = within(decemberRow!).getByRole("button");

      await user.click(menuButton);
      await user.click(within(decemberRow!).getByRole("menuitem", { name: /delete/i }));

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Delete Sprint" })).toBeInTheDocument();
      });

      const dialogs = screen.getAllByRole("dialog");
      const deleteDialog = dialogs.find((d) =>
        within(d).queryByRole("heading", { name: "Delete Sprint" })
      );

      const deleteButton = within(deleteDialog!).getByRole("button", {
        name: /^delete sprint$/i,
      });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteSprint).toHaveBeenCalledWith({
          sprintId: "sprint_2",
        });
      });
    });

    it("does not call mutation when deletion is cancelled", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const decemberRow = rows.find((row) =>
        within(row).queryByText("December Sprint")
      );
      const menuButton = within(decemberRow!).getByRole("button");

      await user.click(menuButton);
      await user.click(within(decemberRow!).getByRole("menuitem", { name: /delete/i }));

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Delete Sprint" })).toBeInTheDocument();
      });

      const dialogs = screen.getAllByRole("dialog");
      const deleteDialog = dialogs.find((d) =>
        within(d).queryByRole("heading", { name: "Delete Sprint" })
      );

      // Click Cancel
      const cancelButton = within(deleteDialog!).getByRole("button", {
        name: /cancel/i,
      });
      await user.click(cancelButton);

      // Mutation should not have been called
      expect(mockDeleteSprint).not.toHaveBeenCalled();
    });
  });

  describe("Set active sprint", () => {
    it("shows Set Active option for inactive sprints", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const decemberRow = rows.find((row) =>
        within(row).queryByText("December Sprint")
      );
      const menuButton = within(decemberRow!).getByRole("button");

      await user.click(menuButton);

      // Check within the December row's menu
      expect(within(decemberRow!).getByText("Set Active")).toBeInTheDocument();
    });

    it("does not show Set Active option for already active sprint", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const januaryRow = rows.find((row) =>
        within(row).queryByText("January Sprint")
      );
      const menuButton = within(januaryRow!).getByRole("button");

      await user.click(menuButton);

      // The menu is now open - Set Active should NOT be there for the active sprint
      // Check within the January row's menu
      const menu = within(januaryRow!).getByRole("menu");
      expect(within(menu).queryByText("Set Active")).not.toBeInTheDocument();
    });

    it("calls setActive mutation with correct sprint ID", async () => {
      const user = userEvent.setup();
      render(<SprintsPage />);

      const table = screen.getByRole("table");
      const rows = within(table).getAllByRole("row");
      const decemberRow = rows.find((row) =>
        within(row).queryByText("December Sprint")
      );
      const menuButton = within(decemberRow!).getByRole("button");

      await user.click(menuButton);
      await user.click(within(decemberRow!).getByText("Set Active"));

      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledWith({
          sprintId: "sprint_2",
        });
      });
    });
  });

  describe("Date formatting", () => {
    it("formats sprint dates in the table", () => {
      render(<SprintsPage />);

      // Dates should be formatted as "Mon Day, Year" (e.g., "Jan 15, 2024")
      // The exact dates depend on our mock data which uses relative dates
      const table = screen.getByRole("table");
      // Just verify the table shows date ranges with the dash separator
      const tableText = table.textContent;
      expect(tableText).toContain("-");
    });

    it("displays the active sprint card with date range", () => {
      render(<SprintsPage />);

      // The active sprint card should show formatted dates
      const primaryCard = document.querySelector(".bg-primary\\/5");
      expect(primaryCard).not.toBeNull();
      expect(primaryCard?.textContent).toContain("-");
    });
  });

  describe("Loading state", () => {
    it("disables Create Sprint button during submission", async () => {
      // Make the mutation take time
      mockCreateSprint.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ _id: "new" }), 100)
          )
      );

      const user = userEvent.setup();
      render(<SprintsPage />);

      await user.click(screen.getByRole("button", { name: /new sprint/i }));

      await waitFor(() => {
        expect(screen.getByText("Create New Sprint")).toBeInTheDocument();
      });

      const dialogs = screen.getAllByRole("dialog");
      const createDialog = dialogs.find((d) =>
        within(d).queryByText("Create New Sprint")
      );

      const nameInput = within(createDialog!).getByPlaceholderText(
        "e.g., Spring 2024 Sprint"
      );
      await user.type(nameInput, "Test Sprint");

      const startDateInput = createDialog!.querySelector(
        'input[type="date"]'
      ) as HTMLInputElement;
      const endDateInput = createDialog!.querySelectorAll(
        'input[type="date"]'
      )[1] as HTMLInputElement;

      await user.clear(startDateInput);
      await user.type(startDateInput, "2024-02-01");
      await user.clear(endDateInput);
      await user.type(endDateInput, "2024-02-14");

      const createButton = within(createDialog!).getByRole("button", {
        name: /^create sprint$/i,
      });
      await user.click(createButton);

      // Button should be disabled during loading
      expect(createButton).toBeDisabled();

      // Wait for mutation to complete
      await waitFor(() => {
        expect(mockCreateSprint).toHaveBeenCalled();
      });
    });
  });
});
