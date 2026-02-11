/**
 * Tests for StudentsPage component.
 *
 * The StudentsPage allows admins to:
 * - List students with search and batch filtering
 * - Create new students via a dialog form
 * - Update student batch assignments
 * - Remove students with confirmation
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import React from "react";

// Mock ALL Radix components to avoid jsdom issues
vi.mock("@radix-ui/react-select", () => {
  const Label = ({ children }: any) => <span>{children}</span>;
  Label.displayName = "SelectLabel";

  return {
    Root: ({ children, onValueChange, value }: any) => {
      return (
        <div data-testid="select-root" data-value={value}>
          {typeof children === "function"
            ? children({ onValueChange })
            : children}
        </div>
      );
    },
    Trigger: ({ children, ...props }: any) => (
      <button data-testid="select-trigger" {...props}>
        {children}
      </button>
    ),
    Value: ({ placeholder, children }: any) => (
      <span>{children || placeholder}</span>
    ),
    Content: ({ children }: any) => (
      <div data-testid="select-content">{children}</div>
    ),
    Item: ({ children, value, onSelect }: any) => (
      <div
        data-testid={`select-item-${value}`}
        data-value={value}
        role="option"
        onClick={() => onSelect?.(value)}
      >
        {children}
      </div>
    ),
    ItemText: ({ children }: any) => <span>{children}</span>,
    ItemIndicator: ({ children }: any) => <span>{children}</span>,
    Portal: ({ children }: any) => <>{children}</>,
    Viewport: ({ children }: any) => <>{children}</>,
    Icon: () => null,
    Group: ({ children }: any) => <>{children}</>,
    Label,
    Separator: () => <hr />,
    ScrollUpButton: () => null,
    ScrollDownButton: () => null,
  };
});

vi.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: any) => (
    <div data-testid="dropdown-root">{children}</div>
  ),
  Trigger: ({ children, asChild, onClick, ...props }: any) => {
    if (asChild) {
      // Clone the child and add the click handler
      return React.cloneElement(React.Children.only(children), {
        ...props,
        "data-testid": "dropdown-trigger",
        onClick: (e: any) => {
          e.stopPropagation();
          onClick?.(e);
        },
      });
    }
    return (
      <button data-testid="dropdown-trigger" {...props}>
        {children}
      </button>
    );
  },
  Content: ({ children }: any) => (
    <div role="menu" data-testid="dropdown-content">
      {children}
    </div>
  ),
  Item: ({ children, onSelect, onClick, className }: any) => (
    <div
      role="menuitem"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
        onSelect?.();
      }}
    >
      {children}
    </div>
  ),
  Portal: ({ children }: any) => <>{children}</>,
  Group: ({ children }: any) => <>{children}</>,
  Sub: ({ children }: any) => <>{children}</>,
  RadioGroup: ({ children }: any) => <>{children}</>,
  SubTrigger: ({ children }: any) => <>{children}</>,
  SubContent: ({ children }: any) => <>{children}</>,
  CheckboxItem: ({ children }: any) => <>{children}</>,
  RadioItem: ({ children }: any) => <>{children}</>,
  Label: ({ children }: any) => <>{children}</>,
  Separator: () => <hr />,
  ItemIndicator: ({ children }: any) => <>{children}</>,
}));

// Mock the shadcn Dialog component at the UI level
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => {
    // Render dialog content when open
    return (
      <div data-testid="dialog-root" data-open={open}>
        {React.Children.map(children, (child: any) => {
          if (!React.isValidElement(child)) return child;
          // Pass open state and handler to children
          return React.cloneElement(child as React.ReactElement<any>, {
            open,
            onOpenChange,
          });
        })}
      </div>
    );
  },
  DialogTrigger: ({ children, asChild, onOpenChange }: any) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: any) => {
          (children as any).props?.onClick?.(e);
          onOpenChange?.(true);
        },
      });
    }
    return (
      <button onClick={() => onOpenChange?.(true)} data-testid="dialog-trigger">
        {children}
      </button>
    );
  },
  DialogContent: ({ children, open }: any) =>
    open ? (
      <div role="dialog" data-testid="dialog-content">
        {children}
      </div>
    ) : null,
  DialogHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  DialogFooter: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogClose: ({ children }: any) => <>{children}</>,
  DialogPortal: ({ children }: any) => <>{children}</>,
  DialogOverlay: ({ children }: any) => <>{children}</>,
}));

// Mock convex/react
const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useMutation: (...args: any[]) => mockUseMutation(...args),
}));

// Mock the API
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: {
      getAll: "users.getAll",
      getBatches: "users.getBatches",
      updateBatch: "users.updateBatch",
      remove: "users.remove",
    },
    auth: {
      createUser: "auth.createUser",
    },
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useSessionToken
vi.mock("@/hooks/useAuth", () => ({
  useSessionToken: () => "test-admin-token",
}));

// Import after mocking
import { StudentsPage } from "../StudentsPage";

// Mock data
const mockStudents = [
  {
    _id: "student_1",
    displayName: "Alice Smith",
    username: "alice.smith",
    batch: "2156",
    role: "student",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    lastLoginAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    avatarUrl: null,
  },
  {
    _id: "student_2",
    displayName: "Bob Jones",
    username: "bob.jones",
    batch: "2153",
    role: "student",
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
    lastLoginAt: null,
    avatarUrl: null,
  },
  {
    _id: "student_3",
    displayName: "Charlie Brown",
    username: "charlie.brown",
    batch: null,
    role: "student",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    lastLoginAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    avatarUrl: null,
  },
];

const mockBatches = ["2156", "2153"];

// Mock mutation functions
let mockCreateUser: Mock;
let mockUpdateBatch: Mock;
let mockRemoveUser: Mock;

describe("StudentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock mutation functions
    mockCreateUser = vi.fn().mockResolvedValue({ success: true });
    mockUpdateBatch = vi.fn().mockResolvedValue({});
    mockRemoveUser = vi.fn().mockResolvedValue({});

    // Setup useMutation mock to return the appropriate function
    mockUseMutation.mockImplementation((mutationName: string) => {
      if (mutationName === "auth.createUser") return mockCreateUser;
      if (mutationName === "users.updateBatch") return mockUpdateBatch;
      if (mutationName === "users.remove") return mockRemoveUser;
      return vi.fn().mockResolvedValue({});
    });
  });

  describe("Student list display", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });
    });

    it("lists all students in a table", () => {
      render(<StudentsPage />);

      // Check that all student names are displayed
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
    });

    it("displays student usernames with @ prefix", () => {
      render(<StudentsPage />);

      expect(screen.getByText("@alice.smith")).toBeInTheDocument();
      expect(screen.getByText("@bob.jones")).toBeInTheDocument();
      expect(screen.getByText("@charlie.brown")).toBeInTheDocument();
    });

    it("displays student batch as badge in table", () => {
      render(<StudentsPage />);

      // Find the table body and check for batch badges within rows
      const table = screen.getByRole("table");
      const aliceRow = screen.getByText("Alice Smith").closest("tr");

      // Alice should have batch 2156 in her row
      expect(within(aliceRow!).getByText("2156")).toBeInTheDocument();
    });

    it("displays correct student count", () => {
      render(<StudentsPage />);

      expect(screen.getByText("3 students")).toBeInTheDocument();
    });

    it("shows 'Never' for students who haven't logged in", () => {
      render(<StudentsPage />);

      expect(screen.getByText("Never")).toBeInTheDocument();
    });

    it("navigates to student detail when row is clicked", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Click on Alice's row (but not on the dropdown trigger)
      const aliceRow = screen.getByText("Alice Smith").closest("tr");
      // Click directly on the name cell
      const nameCell = screen.getByText("Alice Smith");
      await user.click(nameCell);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/students/student_1");
    });
  });

  describe("Batch filter", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });
    });

    it("shows all students when 'all' filter is selected", () => {
      render(<StudentsPage />);

      expect(screen.getByText("3 students")).toBeInTheDocument();
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
    });

    it("filters students by search query", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Type in search box
      const searchInput = screen.getByPlaceholderText("Search students...");
      await user.type(searchInput, "alice");

      // Only Alice should be visible
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.queryByText("Bob Jones")).not.toBeInTheDocument();
      expect(screen.queryByText("Charlie Brown")).not.toBeInTheDocument();
      expect(screen.getByText("1 students")).toBeInTheDocument();
    });

    it("filters students by username search", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      const searchInput = screen.getByPlaceholderText("Search students...");
      await user.type(searchInput, "bob.jones");

      expect(screen.queryByText("Alice Smith")).not.toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
      expect(screen.queryByText("Charlie Brown")).not.toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("renders empty state when no students exist", () => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return [];
        if (query === "users.getBatches") return [];
        return undefined;
      });

      render(<StudentsPage />);

      expect(screen.getByText("No students yet")).toBeInTheDocument();
      expect(
        screen.getByText("Add your first student to get started")
      ).toBeInTheDocument();
    });

    it("shows 'No students found' when filters match nothing", async () => {
      const user = userEvent.setup();
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });

      render(<StudentsPage />);

      // Search for non-existent student
      const searchInput = screen.getByPlaceholderText("Search students...");
      await user.type(searchInput, "nonexistent");

      expect(screen.getByText("No students found")).toBeInTheDocument();
    });

    it("shows clear filters button when filters are active and no results", async () => {
      const user = userEvent.setup();
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });

      render(<StudentsPage />);

      // Search for non-existent student
      const searchInput = screen.getByPlaceholderText("Search students...");
      await user.type(searchInput, "nonexistent");

      const clearButton = screen.getByText("Clear filters");
      expect(clearButton).toBeInTheDocument();

      // Click clear filters
      await user.click(clearButton);

      // All students should be visible again
      expect(screen.getByText("3 students")).toBeInTheDocument();
    });
  });

  describe("Create student form", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });
    });

    it("shows Add Student button in header", () => {
      render(<StudentsPage />);

      const addButton = screen.getByRole("button", { name: /add student/i });
      expect(addButton).toBeInTheDocument();
    });

    it("validates that displayName is required", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Click Add Student to open dialog
      const addButton = screen.getByRole("button", { name: /add student/i });
      await user.click(addButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText("Add New Student")).toBeInTheDocument();
      });

      // Fill only username and password, leave displayName empty
      await user.type(
        screen.getByPlaceholderText("e.g., john.smith"),
        "new.student"
      );
      await user.type(
        screen.getByPlaceholderText("Set a password"),
        "password123"
      );

      // Create button should be disabled
      const createButton = screen.getByRole("button", {
        name: /create student/i,
      });
      expect(createButton).toBeDisabled();
    }, 10000);

    it("validates that username is required", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      const addButton = screen.getByRole("button", { name: /add student/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New Student")).toBeInTheDocument();
      });

      // Fill displayName and password, leave username empty
      await user.type(
        screen.getByPlaceholderText("e.g., John Smith"),
        "New Student"
      );
      await user.type(
        screen.getByPlaceholderText("Set a password"),
        "password123"
      );

      const createButton = screen.getByRole("button", {
        name: /create student/i,
      });
      expect(createButton).toBeDisabled();
    }, 10000);

    it("validates that password is required", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      const addButton = screen.getByRole("button", { name: /add student/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New Student")).toBeInTheDocument();
      });

      // Fill displayName and username, leave password empty
      await user.type(
        screen.getByPlaceholderText("e.g., John Smith"),
        "New Student"
      );
      await user.type(
        screen.getByPlaceholderText("e.g., john.smith"),
        "new.student"
      );

      const createButton = screen.getByRole("button", {
        name: /create student/i,
      });
      expect(createButton).toBeDisabled();
    });

    it("enables Create button when all required fields are filled", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      const addButton = screen.getByRole("button", { name: /add student/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New Student")).toBeInTheDocument();
      });

      // Fill all required fields
      await user.type(
        screen.getByPlaceholderText("e.g., John Smith"),
        "New Student"
      );
      await user.type(
        screen.getByPlaceholderText("e.g., john.smith"),
        "new.student"
      );
      await user.type(
        screen.getByPlaceholderText("Set a password"),
        "password123"
      );

      const createButton = screen.getByRole("button", {
        name: /create student/i,
      });
      expect(createButton).not.toBeDisabled();
    });

    it("calls api.auth.createUser with correct parameters", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      const addButton = screen.getByRole("button", { name: /add student/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New Student")).toBeInTheDocument();
      });

      // Fill all fields
      await user.type(
        screen.getByPlaceholderText("e.g., John Smith"),
        "New Student"
      );
      await user.type(
        screen.getByPlaceholderText("e.g., john.smith"),
        "new.student"
      );
      await user.type(
        screen.getByPlaceholderText("Set a password"),
        "password123"
      );

      const createButton = screen.getByRole("button", {
        name: /create student/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalledWith({
          username: "new.student",
          password: "password123",
          displayName: "New Student",
          role: "student",
          adminToken: "test-admin-token",
          batch: undefined,
        });
      });
    });

    it("handles 'username exists' error", async () => {
      // Mock createUser to return error
      mockCreateUser.mockResolvedValue({
        success: false,
        error: "Username already exists",
      });

      const user = userEvent.setup();
      render(<StudentsPage />);

      const addButton = screen.getByRole("button", { name: /add student/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New Student")).toBeInTheDocument();
      });

      // Fill form
      await user.type(
        screen.getByPlaceholderText("e.g., John Smith"),
        "New Student"
      );
      await user.type(
        screen.getByPlaceholderText("e.g., john.smith"),
        "alice.smith"
      );
      await user.type(
        screen.getByPlaceholderText("Set a password"),
        "password123"
      );

      const createButton = screen.getByRole("button", {
        name: /create student/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText("Username already exists")).toBeInTheDocument();
      });
    });

    it("closes dialog on successful student creation", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      const addButton = screen.getByRole("button", { name: /add student/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText("Add New Student")).toBeInTheDocument();
      });

      // Fill form
      await user.type(
        screen.getByPlaceholderText("e.g., John Smith"),
        "New Student"
      );
      await user.type(
        screen.getByPlaceholderText("e.g., john.smith"),
        "new.student"
      );
      await user.type(
        screen.getByPlaceholderText("Set a password"),
        "password123"
      );

      const createButton = screen.getByRole("button", {
        name: /create student/i,
      });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockCreateUser).toHaveBeenCalled();
      });

      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText("Add New Student")).not.toBeInTheDocument();
      });
    });
  });

  describe("Update batch", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });
    });

    it("opens edit batch dialog from dropdown menu", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Find Alice's row and the dropdown trigger
      const aliceRow = screen.getByText("Alice Smith").closest("tr");
      const dropdownTriggers = within(aliceRow!).getAllByRole("button");
      // The last button should be the dropdown trigger (with MoreHorizontal icon)
      const menuButton = dropdownTriggers[dropdownTriggers.length - 1];
      await user.click(menuButton);

      // Click Edit Batch menu item - scope to Alice's row dropdown
      const editBatchItems = within(aliceRow!).getAllByText("Edit Batch");
      await user.click(editBatchItems[0]);

      // Dialog should open
      await waitFor(() => {
        expect(screen.getByText(/Update batch/i)).toBeInTheDocument();
      });
    });
  });

  describe("Remove student", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });
    });

    it("shows confirmation dialog when clicking remove", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Find Alice's row and the dropdown trigger
      const aliceRow = screen.getByText("Alice Smith").closest("tr");
      const dropdownTriggers = within(aliceRow!).getAllByRole("button");
      const menuButton = dropdownTriggers[dropdownTriggers.length - 1];
      await user.click(menuButton);

      // Click Remove Student menu item - scope to Alice's row
      const removeItems = within(aliceRow!).getAllByText("Remove Student");
      await user.click(removeItems[0]);

      // Confirmation dialog should appear
      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to remove alice smith/i)
        ).toBeInTheDocument();
      });
    });

    it("calls api.users.remove when confirmed", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Open dropdown and click remove
      const aliceRow = screen.getByText("Alice Smith").closest("tr");
      const dropdownTriggers = within(aliceRow!).getAllByRole("button");
      const menuButton = dropdownTriggers[dropdownTriggers.length - 1];
      await user.click(menuButton);

      const removeItems = within(aliceRow!).getAllByText("Remove Student");
      await user.click(removeItems[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to remove/i)
        ).toBeInTheDocument();
      });

      // Find and click confirm button (the button in the dialog, not the menu item)
      const confirmButton = screen.getByRole("button", {
        name: /remove student/i,
      });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockRemoveUser).toHaveBeenCalledWith({ userId: "student_1" });
      });
    });

    it("shows warning about data deletion in confirmation dialog", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Open dropdown and click remove
      const aliceRow = screen.getByText("Alice Smith").closest("tr");
      const dropdownTriggers = within(aliceRow!).getAllByRole("button");
      const menuButton = dropdownTriggers[dropdownTriggers.length - 1];
      await user.click(menuButton);

      const removeItems = within(aliceRow!).getAllByText("Remove Student");
      await user.click(removeItems[0]);

      // Check for warning text
      await waitFor(() => {
        expect(
          screen.getByText(/goals and action items/i)
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText(/habits and tracking history/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/emotion check-ins/i)).toBeInTheDocument();
      expect(
        screen.getByText(/learning progress and viva requests/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/reading history/i)).toBeInTheDocument();
    });

    it("closes dialog when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Open dropdown and click remove
      const aliceRow = screen.getByText("Alice Smith").closest("tr");
      const dropdownTriggers = within(aliceRow!).getAllByRole("button");
      const menuButton = dropdownTriggers[dropdownTriggers.length - 1];
      await user.click(menuButton);

      const removeItems = within(aliceRow!).getAllByText("Remove Student");
      await user.click(removeItems[0]);

      // Wait for dialog
      await waitFor(() => {
        expect(
          screen.getByText(/are you sure you want to remove/i)
        ).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should close
      await waitFor(() => {
        expect(
          screen.queryByText(/are you sure you want to remove/i)
        ).not.toBeInTheDocument();
      });
    });

    it("shows permanent deletion warning", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Open dropdown and click remove
      const aliceRow = screen.getByText("Alice Smith").closest("tr");
      const dropdownTriggers = within(aliceRow!).getAllByRole("button");
      const menuButton = dropdownTriggers[dropdownTriggers.length - 1];
      await user.click(menuButton);

      const removeItems = within(aliceRow!).getAllByText("Remove Student");
      await user.click(removeItems[0]);

      await waitFor(() => {
        expect(
          screen.getByText(/this action cannot be undone/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading state", () => {
    it("handles undefined students query (loading)", () => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return undefined;
        if (query === "users.getBatches") return undefined;
        return undefined;
      });

      render(<StudentsPage />);

      // Should show 0 students count when loading
      expect(screen.getByText("0 students")).toBeInTheDocument();
    });
  });

  describe("Page header", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });
    });

    it("displays page title", () => {
      render(<StudentsPage />);

      expect(
        screen.getByRole("heading", { name: "Students" })
      ).toBeInTheDocument();
    });

    it("displays page description", () => {
      render(<StudentsPage />);

      expect(
        screen.getByText("Manage student accounts and track their progress")
      ).toBeInTheDocument();
    });
  });

  describe("View details action", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });
    });

    it("navigates to student detail page via menu item", async () => {
      const user = userEvent.setup();
      render(<StudentsPage />);

      // Open dropdown for Alice
      const aliceRow = screen.getByText("Alice Smith").closest("tr");
      const dropdownTriggers = within(aliceRow!).getAllByRole("button");
      const menuButton = dropdownTriggers[dropdownTriggers.length - 1];
      await user.click(menuButton);

      // Click View Details - scope to Alice's row
      const viewItems = within(aliceRow!).getAllByText("View Details");
      await user.click(viewItems[0]);

      expect(mockNavigate).toHaveBeenCalledWith("/admin/students/student_1");
    });
  });

  describe("Table display", () => {
    beforeEach(() => {
      mockUseQuery.mockImplementation((query: string) => {
        if (query === "users.getAll") return mockStudents;
        if (query === "users.getBatches") return mockBatches;
        return undefined;
      });
    });

    it("displays table headers", () => {
      render(<StudentsPage />);

      expect(screen.getByText("Student")).toBeInTheDocument();
      expect(screen.getByText("Username")).toBeInTheDocument();
      expect(screen.getByText("Batch")).toBeInTheDocument();
      expect(screen.getByText("Joined")).toBeInTheDocument();
      expect(screen.getByText("Last Active")).toBeInTheDocument();
    });

    it("shows dash for students without batch", () => {
      render(<StudentsPage />);

      // Charlie has no batch, should show dash
      const charlieRow = screen.getByText("Charlie Brown").closest("tr");
      expect(within(charlieRow!).getByText("-")).toBeInTheDocument();
    });
  });
});
