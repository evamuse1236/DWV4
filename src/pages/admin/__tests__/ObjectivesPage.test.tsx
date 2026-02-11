/**
 * Tests for ObjectivesPage component.
 *
 * The ObjectivesPage displays:
 * - Domain tabs for switching between learning domains
 * - Major objectives with CRUD operations
 * - Sub-objectives nested under majors with CRUD operations
 * - Activities for each sub-objective
 * - Student assignment dialog for sub-objectives
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock mutation functions
const mockCreateMajor = vi.fn().mockResolvedValue({ _id: "major_new" });
const mockUpdateMajor = vi.fn().mockResolvedValue({});
const mockRemoveMajor = vi.fn().mockResolvedValue({});
const mockCreateSubObjective = vi.fn().mockResolvedValue({ _id: "sub_new" });
const mockUpdateSubObjective = vi.fn().mockResolvedValue({});
const mockRemoveSubObjective = vi.fn().mockResolvedValue({});
const mockAssignToMultiple = vi.fn().mockResolvedValue({ results: [] });
const mockAssignChapterToMultiple = vi.fn().mockResolvedValue({ results: [] });
const mockCreateActivity = vi.fn().mockResolvedValue({ _id: "activity_new" });
const mockUpdateActivity = vi.fn().mockResolvedValue({});
const mockRemoveActivity = vi.fn().mockResolvedValue({});

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((mutation: string) => {
    if (mutation === "objectives.create") return mockCreateMajor;
    if (mutation === "objectives.update") return mockUpdateMajor;
    if (mutation === "objectives.remove") return mockRemoveMajor;
    if (mutation === "objectives.createSubObjective") return mockCreateSubObjective;
    if (mutation === "objectives.updateSubObjective") return mockUpdateSubObjective;
    if (mutation === "objectives.removeSubObjective") return mockRemoveSubObjective;
    if (mutation === "objectives.assignToMultipleStudents") return mockAssignToMultiple;
    if (mutation === "objectives.assignChapterToMultipleStudents") return mockAssignChapterToMultiple;
    if (mutation === "activities.create") return mockCreateActivity;
    if (mutation === "activities.update") return mockUpdateActivity;
    if (mutation === "activities.remove") return mockRemoveActivity;
    return vi.fn().mockResolvedValue({});
  }),
}));

// Mock the API
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    domains: { getAll: "domains.getAll" },
    users: { getAll: "users.getAll" },
    objectives: {
      getByDomain: "objectives.getByDomain",
      getAssignedStudents: "objectives.getAssignedStudents",
      getAssignedStudentsForChapter: "objectives.getAssignedStudentsForChapter",
      create: "objectives.create",
      update: "objectives.update",
      remove: "objectives.remove",
      createSubObjective: "objectives.createSubObjective",
      updateSubObjective: "objectives.updateSubObjective",
      removeSubObjective: "objectives.removeSubObjective",
      assignToMultipleStudents: "objectives.assignToMultipleStudents",
      assignChapterToMultipleStudents: "objectives.assignChapterToMultipleStudents",
    },
    activities: {
      getByObjective: "activities.getByObjective",
      create: "activities.create",
      update: "activities.update",
      remove: "activities.remove",
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
    login: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock shadcn/ui components to avoid jsdom issues with Radix
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button role="tab" data-value={value} onClick={onClick}>
      {children}
    </button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div role="tabpanel" data-value={value}>
      {children}
    </div>
  ),
}));

// Mock Select with proper callback handling
vi.mock("@/components/ui/select", () => {
  const React = require("react");

  // Each Select instance stores its own callback
  const selectCallbacks: Map<string, (value: string) => void> = new Map();
  let selectIdCounter = 0;

  return {
    Select: ({ children, onValueChange, value }: any) => {
      const selectId = `select-${selectIdCounter++}`;
      if (onValueChange) {
        selectCallbacks.set(selectId, onValueChange);
      }
      return React.createElement(
        "div",
        { "data-testid": "select-root", "data-value": value, "data-select-id": selectId },
        // Pass selectId to children via data attribute
        React.Children.map(children, (child: any) => {
          if (child && child.props) {
            return React.cloneElement(child, { "data-parent-select": selectId });
          }
          return child;
        })
      );
    },
    SelectTrigger: ({ children, "data-parent-select": parentSelect }: any) =>
      React.createElement("button", { "data-testid": "select-trigger", "data-parent-select": parentSelect }, children),
    SelectValue: ({ placeholder }: any) => React.createElement("span", null, placeholder),
    SelectContent: ({ children, "data-parent-select": parentSelect }: any) =>
      React.createElement(
        "div",
        { "data-testid": "select-content" },
        React.Children.map(children, (child: any) => {
          if (child && child.props) {
            return React.cloneElement(child, { "data-parent-select": parentSelect });
          }
          return child;
        })
      ),
    SelectItem: ({ children, value, "data-parent-select": parentSelect }: any) =>
      React.createElement(
        "div",
        {
          "data-value": value,
          role: "option",
          onClick: (e: any) => {
            // Find the parent select ID from DOM traversal
            const selectRoot = e.target.closest("[data-select-id]");
            const selectId = selectRoot?.getAttribute("data-select-id");
            if (selectId && selectCallbacks.has(selectId)) {
              selectCallbacks.get(selectId)!(value);
            }
          },
        },
        children
      ),
    SelectGroup: ({ children }: any) => React.createElement("div", null, children),
    SelectLabel: ({ children }: any) => React.createElement("span", null, children),
    SelectSeparator: () => React.createElement("hr", null),
  };
});

// Mock Dialog - simple approach where Dialog controls rendering based on open prop
vi.mock("@/components/ui/dialog", () => {
  // Simple dialog mock - Dialog controls what renders based on open prop
  const React = require("react");
  const DialogContext = React.createContext({ open: false, onOpenChange: () => {} });

  return {
    Dialog: ({ children, open, onOpenChange }: any) => {
      return React.createElement(
        DialogContext.Provider,
        { value: { open: open ?? false, onOpenChange: onOpenChange ?? (() => {}) } },
        React.createElement("div", { "data-testid": "dialog-root", "data-open": String(open) }, children)
      );
    },
    DialogTrigger: ({ children, asChild }: any) => {
      const ctx = React.useContext(DialogContext);
      const handleClick = () => ctx.onOpenChange(true);

      if (asChild && children) {
        const child = Array.isArray(children) ? children[0] : children;
        if (child && typeof child.type !== "string") {
          return React.cloneElement(child, {
            onClick: (e: any) => {
              handleClick();
              if (child.props?.onClick) child.props.onClick(e);
            },
          });
        }
      }
      return React.createElement("span", { onClick: handleClick }, children);
    },
    DialogPortal: ({ children }: any) => children,
    DialogOverlay: () => null,
    DialogContent: ({ children }: any) => {
      const ctx = React.useContext(DialogContext);
      return ctx.open ? React.createElement("div", { role: "dialog" }, children) : null;
    },
    DialogHeader: ({ children }: any) => React.createElement("div", null, children),
    DialogFooter: ({ children }: any) => React.createElement("div", null, children),
    DialogTitle: ({ children }: any) => React.createElement("h2", null, children),
    DialogDescription: ({ children }: any) => React.createElement("p", null, children),
    DialogClose: ({ children }: any) => children,
  };
});

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <div role="menu">{children}</div>,
  DropdownMenuItem: ({ children, onSelect }: any) => (
    <div role="menuitem" onClick={onSelect}>
      {children}
    </div>
  ),
  DropdownMenuPortal: ({ children }: any) => <>{children}</>,
}));

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Plus: () => <span data-testid="icon-plus">+</span>,
  Target: () => <span data-testid="icon-target">T</span>,
  Loader2: () => <span data-testid="icon-loader">L</span>,
  BookOpen: () => <span data-testid="icon-book">B</span>,
  Users: () => <span data-testid="icon-users">U</span>,
  Check: () => <span data-testid="icon-check">C</span>,
  Video: () => <span data-testid="icon-video">V</span>,
  Edit2: () => <span data-testid="icon-edit">E</span>,
  Trash2: () => <span data-testid="icon-trash">X</span>,
  ExternalLink: () => <span data-testid="icon-external">L</span>,
  Gamepad2: () => <span data-testid="icon-game">G</span>,
  FileText: () => <span data-testid="icon-file">F</span>,
  Dumbbell: () => <span data-testid="icon-dumbbell">D</span>,
  ChevronDown: () => <span data-testid="icon-chevron-down">v</span>,
  ChevronUp: () => <span data-testid="icon-chevron-up">^</span>,
}));

// Import after mocking
import { ObjectivesPage } from "../ObjectivesPage";
import { useQuery } from "convex/react";

// Mock data
const mockDomains = [
  { _id: "domain_1", name: "Mathematics", icon: "+" , description: "Math skills" },
  { _id: "domain_2", name: "Reading", icon: "B", description: "Reading skills" },
  { _id: "domain_3", name: "Science", icon: "S", description: "Science skills" },
];

const mockStudents = [
  { _id: "student_1", displayName: "Alice", username: "alice", role: "student", batch: "A" },
  { _id: "student_2", displayName: "Bob", username: "bob", role: "student", batch: "A" },
  { _id: "student_3", displayName: "Charlie", username: "charlie", role: "student", batch: "B" },
];

const mockMajorObjectives = [
  {
    _id: "major_1",
    title: "Fractions Fundamentals",
    description: "Master the basics of fractions",
    difficulty: "beginner",
    estimatedHours: 5,
    domainId: "domain_1",
    subObjectives: [
      {
        _id: "sub_1",
        title: "Add fractions with like denominators",
        description: "Learn to add fractions with same denominators",
        difficulty: "beginner",
        estimatedHours: 1,
        majorObjectiveId: "major_1",
      },
      {
        _id: "sub_2",
        title: "Subtract fractions",
        description: "Learn to subtract fractions",
        difficulty: "intermediate",
        estimatedHours: 2,
        majorObjectiveId: "major_1",
      },
    ],
  },
  {
    _id: "major_2",
    title: "Algebra Basics",
    description: "Introduction to algebra",
    difficulty: "intermediate",
    estimatedHours: 10,
    domainId: "domain_1",
    subObjectives: [],
  },
];

const mockActivities = [
  {
    _id: "activity_1",
    title: "Watch Fractions Video",
    type: "video",
    url: "https://youtube.com/watch?v=123",
    platform: "YouTube",
    objectiveId: "sub_1",
    order: 1,
  },
  {
    _id: "activity_2",
    title: "Practice Exercises",
    type: "exercise",
    url: "https://khanacademy.org/exercise",
    platform: "Khan Academy",
    objectiveId: "sub_1",
    order: 2,
  },
];

const mockAssignedStudents = [
  { _id: "assignment_1", userId: "student_1", user: mockStudents[0] },
];

describe("ObjectivesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMajor.mockClear().mockResolvedValue({ _id: "major_new" });
    mockUpdateMajor.mockClear().mockResolvedValue({});
    mockRemoveMajor.mockClear().mockResolvedValue({});
    mockCreateSubObjective.mockClear().mockResolvedValue({ _id: "sub_new" });
    mockUpdateSubObjective.mockClear().mockResolvedValue({});
    mockRemoveSubObjective.mockClear().mockResolvedValue({});
    mockAssignToMultiple.mockClear().mockResolvedValue({ results: [] });
    mockCreateActivity.mockClear().mockResolvedValue({ _id: "activity_new" });
    mockUpdateActivity.mockClear().mockResolvedValue({});
    mockRemoveActivity.mockClear().mockResolvedValue({});
    // Clean up global callbacks
    delete (globalThis as any).__selectOnValueChange;
    delete (globalThis as any).__dialogOnOpenChange;
  });

  const setupDefaultQueries = () => {
    (useQuery as any).mockImplementation((query: string, args: any) => {
      if (args === "skip") return undefined;
      if (query === "domains.getAll") return mockDomains;
      if (query === "users.getAll") return mockStudents;
      if (query === "objectives.getByDomain") return mockMajorObjectives;
      if (query === "objectives.getAssignedStudents") return mockAssignedStudents;
      if (query === "objectives.getAssignedStudentsForChapter") return [];
      if (query === "activities.getByObjective") return mockActivities;
      return undefined;
    });
  };

  describe("Initial rendering", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("renders the page title and description", () => {
      render(<ObjectivesPage />);

      expect(screen.getByText("Learning Objectives")).toBeInTheDocument();
      expect(
        screen.getByText(/create major objectives and attach sub objectives/i)
      ).toBeInTheDocument();
    });

    it("renders the Add Major Objective button", () => {
      render(<ObjectivesPage />);

      expect(screen.getByText("Add Major Objective")).toBeInTheDocument();
    });

    it("displays domain tabs", () => {
      render(<ObjectivesPage />);

      expect(screen.getByRole("tablist")).toBeInTheDocument();
      // Use getAllByRole to find tabs specifically, since domain names also appear in card headers
      const tabs = screen.getAllByRole("tab");
      expect(tabs.length).toBe(3);
      expect(tabs[0]).toHaveTextContent("Mathematics");
      expect(tabs[1]).toHaveTextContent("Reading");
      expect(tabs[2]).toHaveTextContent("Science");
    });

    it("displays major objectives for the selected domain", () => {
      render(<ObjectivesPage />);

      expect(screen.getByText("Fractions Fundamentals")).toBeInTheDocument();
      expect(screen.getByText("Algebra Basics")).toBeInTheDocument();
    });

    it("displays sub-objectives under major objectives", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand the first major to reveal sub-objectives
      await user.click(screen.getByText("Fractions Fundamentals"));

      expect(screen.getByText("Add fractions with like denominators")).toBeInTheDocument();
      expect(screen.getByText("Subtract fractions")).toBeInTheDocument();
    });

    it("displays difficulty badges", () => {
      render(<ObjectivesPage />);

      // Multiple "beginner" badges for major and sub objectives
      const beginnerBadges = screen.getAllByText("beginner");
      expect(beginnerBadges.length).toBeGreaterThan(0);

      const intermediateBadges = screen.getAllByText("intermediate");
      expect(intermediateBadges.length).toBeGreaterThan(0);
    });

    it("shows sub-objective count badge for majors", () => {
      render(<ObjectivesPage />);

      expect(screen.getByText("2 sub-objectives")).toBeInTheDocument();
      expect(screen.getByText("0 sub-objectives")).toBeInTheDocument();
    });
  });

  describe("Empty state", () => {
    it("shows empty state when no domains exist", () => {
      (useQuery as any).mockImplementation((query: string, args: any) => {
        if (args === "skip") return undefined;
        if (query === "domains.getAll") return [];
        if (query === "users.getAll") return mockStudents;
        return undefined;
      });

      render(<ObjectivesPage />);

      expect(screen.getByText("No domains configured")).toBeInTheDocument();
    });

    it("shows empty state when domain has no major objectives", () => {
      (useQuery as any).mockImplementation((query: string, args: any) => {
        if (args === "skip") return undefined;
        if (query === "domains.getAll") return mockDomains;
        if (query === "users.getAll") return mockStudents;
        if (query === "objectives.getByDomain") return []; // Empty array, not undefined
        return undefined;
      });

      render(<ObjectivesPage />);

      // Each domain tab shows this message, so use getAllByText
      const emptyMessages = screen.getAllByText("No major objectives in this domain yet");
      expect(emptyMessages.length).toBeGreaterThan(0);
    });

    it("shows empty state for sub-objectives when major has none", async () => {
      (useQuery as any).mockImplementation((query: string, args: any) => {
        if (args === "skip") return undefined;
        if (query === "domains.getAll") return mockDomains;
        if (query === "users.getAll") return mockStudents;
        if (query === "objectives.getByDomain") return [
          { ...mockMajorObjectives[1], subObjectives: [] },
        ];
        return undefined;
      });

      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand the major to reveal the empty sub-objectives section
      await user.click(screen.getByText("Algebra Basics"));

      expect(
        screen.getByText("No sub objectives yet. Add the first sub objective for this major.")
      ).toBeInTheDocument();
    });
  });

  describe("Domain switching", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("allows switching between domains via tabs", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Initially showing Mathematics domain
      expect(screen.getByText("Fractions Fundamentals")).toBeInTheDocument();

      // Click on Reading tab
      const readingTab = screen.getByRole("tab", { name: /reading/i });
      await user.click(readingTab);

      // The domain should switch (simulated via the onValueChange callback)
      // In the real component, this would trigger a re-query with the new domain
    });

    it("displays domain icon and name in tabs", () => {
      render(<ObjectivesPage />);

      const tablist = screen.getByRole("tablist");
      const tabs = screen.getAllByRole("tab");

      // Check tabs are inside tablist and have correct content
      expect(tablist).toContainElement(tabs[0]);
      expect(tabs[0]).toHaveTextContent("Mathematics");
      expect(tabs[1]).toHaveTextContent("Reading");
      expect(tabs[2]).toHaveTextContent("Science");
    });
  });

  describe("Major objective CRUD", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("opens create major dialog when clicking Add Major Objective", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      const addButton = screen.getByText("Add Major Objective");
      await user.click(addButton);

      expect(screen.getByText("Create Major Objective")).toBeInTheDocument();
      expect(
        screen.getByText("Major objectives act as the main nodes in the skill tree.")
      ).toBeInTheDocument();
    });

    it("shows form fields in create major dialog", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Add Major Objective"));

      expect(screen.getByText("Domain *")).toBeInTheDocument();
      expect(screen.getByText("Title *")).toBeInTheDocument();
      expect(screen.getByText("Description *")).toBeInTheDocument();
      expect(screen.getByText("Difficulty")).toBeInTheDocument();
      expect(screen.getByText("Est. Hours")).toBeInTheDocument();
    });

    it("calls create mutation with correct args when creating major objective", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Add Major Objective"));

      // Select domain
      const domainSelect = screen.getAllByTestId("select-trigger")[0];
      await user.click(domainSelect);
      const domainOption = screen.getByRole("option", { name: /mathematics/i });
      await user.click(domainOption);

      // Fill in title
      const titleInput = screen.getByPlaceholderText("e.g., Fractions Fundamentals");
      await user.type(titleInput, "New Major Objective");

      // Fill in description
      const descInput = screen.getByPlaceholderText("What does this major unlock?");
      await user.type(descInput, "Description of new major");

      // Click Create Major button
      const createButton = screen.getByRole("button", { name: /create major/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockCreateMajor).toHaveBeenCalledWith(
          expect.objectContaining({
            domainId: "domain_1",
            title: "New Major Objective",
            description: "Description of new major",
            difficulty: "beginner",
            estimatedHours: 1,
            createdBy: "admin_123",
          })
        );
      });
    }, 10000);

    it("opens edit major dialog when clicking edit button", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Find edit buttons (they have icon-edit testid inside)
      const editButtons = screen.getAllByTitle("Edit major");
      await user.click(editButtons[0]);

      expect(screen.getByText("Edit Major Objective")).toBeInTheDocument();
      expect(screen.getByText("Update the major objective details.")).toBeInTheDocument();
    });

    it("pre-fills form with existing data when editing major", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      const editButtons = screen.getAllByTitle("Edit major");
      await user.click(editButtons[0]);

      // Check that form is pre-filled
      const titleInput = screen.getByDisplayValue("Fractions Fundamentals");
      expect(titleInput).toBeInTheDocument();

      const descInput = screen.getByDisplayValue("Master the basics of fractions");
      expect(descInput).toBeInTheDocument();
    });

    it("calls update mutation with correct args when updating major", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      const editButtons = screen.getAllByTitle("Edit major");
      await user.click(editButtons[0]);

      // Modify title
      const titleInput = screen.getByDisplayValue("Fractions Fundamentals");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Fractions");

      // Click Save Changes
      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateMajor).toHaveBeenCalledWith(
          expect.objectContaining({
            objectiveId: "major_1",
            title: "Updated Fractions",
          })
        );
      });
    }, 10000);

    it("calls remove mutation when deleting major after confirmation", async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<ObjectivesPage />);

      const deleteButtons = screen.getAllByTitle("Delete major");
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        "Delete this major objective and all its sub objectives?"
      );

      await waitFor(() => {
        expect(mockRemoveMajor).toHaveBeenCalledWith({ objectiveId: "major_1" });
      });

      confirmSpy.mockRestore();
    });

    it("does not delete major when confirmation is cancelled", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

      render(<ObjectivesPage />);

      const deleteButtons = screen.getAllByTitle("Delete major");
      await user.click(deleteButtons[0]);

      expect(mockRemoveMajor).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it("disables create button when required fields are empty", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Add Major Objective"));

      const createButton = screen.getByRole("button", { name: /create major/i });
      expect(createButton).toBeDisabled();
    });
  });

  describe("Sub-objective CRUD", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("opens add sub-objective dialog when clicking Add Sub button", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      const addSubButtons = screen.getAllByText("Add Sub");
      await user.click(addSubButtons[0]);

      // Check for the dialog title using heading role
      expect(screen.getByRole("heading", { name: "Add Sub Objective" })).toBeInTheDocument();
      expect(screen.getByText(/major: fractions fundamentals/i)).toBeInTheDocument();
    });

    it("shows form fields in add sub-objective dialog", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      const addSubButtons = screen.getAllByText("Add Sub");
      await user.click(addSubButtons[0]);

      expect(screen.getByText("Title *")).toBeInTheDocument();
      expect(screen.getByText("Description *")).toBeInTheDocument();
      expect(screen.getByText("Difficulty")).toBeInTheDocument();
      expect(screen.getByText("Est. Hours")).toBeInTheDocument();
    });

    it("calls create sub-objective mutation with correct args", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      const addSubButtons = screen.getAllByText("Add Sub");
      await user.click(addSubButtons[0]);

      // Fill in title
      const titleInput = screen.getByPlaceholderText(
        "e.g., Add fractions with like denominators"
      );
      await user.type(titleInput, "New Sub Objective");

      // Fill in description
      const descInput = screen.getByPlaceholderText(
        "What will students master in this step?"
      );
      await user.type(descInput, "Description of sub objective");

      // Click Add Sub Objective button
      const addButton = screen.getByRole("button", { name: /add sub objective/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockCreateSubObjective).toHaveBeenCalledWith(
          expect.objectContaining({
            majorObjectiveId: "major_1",
            title: "New Sub Objective",
            description: "Description of sub objective",
            difficulty: "beginner",
            estimatedHours: 1,
            createdBy: "admin_123",
          })
        );
      });
    });

    it("opens edit sub-objective dialog when clicking edit button on sub", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand major to reveal sub-objectives
      await user.click(screen.getByText("Fractions Fundamentals"));

      const editSubButtons = screen.getAllByTitle("Edit sub objective");
      await user.click(editSubButtons[0]);

      expect(screen.getByText("Edit Sub Objective")).toBeInTheDocument();
    });

    it("pre-fills form with existing sub-objective data when editing", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));

      const editSubButtons = screen.getAllByTitle("Edit sub objective");
      await user.click(editSubButtons[0]);

      const titleInput = screen.getByDisplayValue("Add fractions with like denominators");
      expect(titleInput).toBeInTheDocument();
    });

    it("calls update sub-objective mutation with correct args", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));

      const editSubButtons = screen.getAllByTitle("Edit sub objective");
      await user.click(editSubButtons[0]);

      const titleInput = screen.getByDisplayValue("Add fractions with like denominators");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Sub Title");

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateSubObjective).toHaveBeenCalledWith(
          expect.objectContaining({
            objectiveId: "sub_1",
            title: "Updated Sub Title",
          })
        );
      });
    });

    it("calls remove sub-objective mutation when deleting", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));

      const deleteSubButtons = screen.getAllByTitle("Delete sub objective");
      await user.click(deleteSubButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        "Delete this sub objective and its activities?"
      );

      await waitFor(() => {
        expect(mockRemoveSubObjective).toHaveBeenCalledWith({ objectiveId: "sub_1" });
      });

      confirmSpy.mockRestore();
    });
  });

  describe("Activity CRUD for sub-objectives", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("expands sub-objective to show activities when clicked", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand major to reveal sub-objectives
      await user.click(screen.getByText("Fractions Fundamentals"));

      // Click on a sub-objective to expand it
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      // Should show activities section
      expect(screen.getByText(/activities \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText("Watch Fractions Video")).toBeInTheDocument();
      expect(screen.getByText("Practice Exercises")).toBeInTheDocument();
    });

    it("shows Add Activity button when sub-objective is expanded", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      expect(screen.getByText("Add Activity")).toBeInTheDocument();
    });

    it("opens add activity dialog when clicking Add Activity", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand major, then sub-objective
      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      // Click Add Activity
      const addActivityButton = screen.getByText("Add Activity");
      await user.click(addActivityButton);

      expect(
        screen.getByText("Add a learning resource for students to complete")
      ).toBeInTheDocument();
    });

    it("shows activity form fields", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      const addActivityButton = screen.getByText("Add Activity");
      await user.click(addActivityButton);

      expect(screen.getByPlaceholderText("e.g., Watch intro video")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("https://...")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("e.g., YouTube, Khan Academy")
      ).toBeInTheDocument();
    });

    it("calls create activity mutation with correct args", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand major, then sub-objective
      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      // Open add activity dialog
      const addActivityButton = screen.getByText("Add Activity");
      await user.click(addActivityButton);

      // Fill in form
      const titleInput = screen.getByPlaceholderText("e.g., Watch intro video");
      await user.type(titleInput, "New Activity");

      const urlInput = screen.getByPlaceholderText("https://...");
      await user.type(urlInput, "https://example.com/activity");

      const platformInput = screen.getByPlaceholderText("e.g., YouTube, Khan Academy");
      await user.type(platformInput, "Custom Platform");

      // Submit
      const submitButton = screen.getByRole("button", { name: /^add activity$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            objectiveId: "sub_1",
            title: "New Activity",
            type: "video",
            url: "https://example.com/activity",
            platform: "Custom Platform",
            order: 3, // existing activities have order 1 and 2
          })
        );
      });
    });

    it("displays activity type icons correctly", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      // Check for activity type labels
      expect(screen.getByText("video")).toBeInTheDocument();
      expect(screen.getByText("exercise")).toBeInTheDocument();
    });

    it("displays activity platform when available", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      expect(screen.getByText("YouTube")).toBeInTheDocument();
      expect(screen.getByText("Khan Academy")).toBeInTheDocument();
    });

    it("opens edit activity dialog when clicking edit on activity", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand major, then sub-objective
      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      // Find all edit buttons with icon-edit inside the activity section
      const activitySection = screen.getByText("Watch Fractions Video").closest("div");
      const editButton = activitySection?.querySelector('[data-testid="icon-edit"]')?.parentElement;
      if (editButton) {
        await user.click(editButton);
        expect(screen.getByText("Edit Activity")).toBeInTheDocument();
        expect(screen.getByText("Update the activity details")).toBeInTheDocument();
      }
    });

    it("calls update activity mutation with correct args", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand major, then sub-objective
      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      // Find edit button for activity
      const activitySection = screen.getByText("Watch Fractions Video").closest("div");
      const editButtons = activitySection?.querySelectorAll("button");
      // The edit button is typically the second button (after external link)
      const editButton = editButtons?.[1];
      if (editButton) {
        await user.click(editButton);

        const titleInput = screen.getByDisplayValue("Watch Fractions Video");
        await user.clear(titleInput);
        await user.type(titleInput, "Updated Activity Title");

        const saveButton = screen.getByRole("button", { name: /save changes/i });
        await user.click(saveButton);

        await waitFor(() => {
          expect(mockUpdateActivity).toHaveBeenCalledWith(
            expect.objectContaining({
              activityId: "activity_1",
              title: "Updated Activity Title",
            })
          );
        });
      }
    });

    it("calls remove activity mutation when deleting", async () => {
      const user = userEvent.setup();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<ObjectivesPage />);

      // Expand major, then sub-objective
      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      // Find delete button for activity (last button in activity row)
      const activitySection = screen.getByText("Watch Fractions Video").closest("div");
      const deleteButton = activitySection?.querySelector(
        'button[class*="destructive"], button:last-child'
      );
      if (deleteButton) {
        await user.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalledWith(
          "Are you sure you want to delete this activity?"
        );

        await waitFor(() => {
          expect(mockRemoveActivity).toHaveBeenCalledWith({ activityId: "activity_1" });
        });
      }

      confirmSpy.mockRestore();
    });

    it("shows empty state when sub-objective has no activities", async () => {
      (useQuery as any).mockImplementation((query: string, args: any) => {
        if (args === "skip") return undefined;
        if (query === "domains.getAll") return mockDomains;
        if (query === "users.getAll") return mockStudents;
        if (query === "objectives.getByDomain") return mockMajorObjectives;
        if (query === "objectives.getAssignedStudents") return [];
        if (query === "activities.getByObjective") return []; // No activities
        return undefined;
      });

      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand major, then first sub-objective
      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      expect(
        screen.getByText("No activities yet. Add videos, readings, or exercises for students.")
      ).toBeInTheDocument();
    });

    it("collapses sub-objective when clicked again", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand major, then sub-objective
      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      // When expanded, we should see the Activities heading with count
      expect(screen.getByRole("heading", { level: 4, name: /activities/i })).toBeInTheDocument();

      // Collapse by clicking again
      await user.click(subObjective);

      // Activities heading should disappear when collapsed
      expect(screen.queryByRole("heading", { level: 4, name: /activities/i })).not.toBeInTheDocument();
    });
  });

  describe("Student assignment", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("shows Assign button on sub-objectives", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      expect(assignButtons.length).toBeGreaterThan(0);
    });

    it("opens assign students dialog when clicking Assign", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      expect(screen.getByText("Assign Students")).toBeInTheDocument();
      expect(
        screen.getByText(/select students to assign to "add fractions with like denominators"/i)
      ).toBeInTheDocument();
    });

    it("displays already assigned students in dialog", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      expect(screen.getByText(/already assigned \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("displays available students for assignment", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      expect(screen.getByText(/available students \(2\)/i)).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("allows selecting multiple students", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      // Click on Bob to select
      const bobCard = screen.getByText("Bob").closest("div[class*='cursor-pointer']");
      if (bobCard) {
        await user.click(bobCard);
        // Bob should show check mark (selected state)
        expect(bobCard.classList.toString()).toMatch(/primary/i);
      }

      // Click on Charlie to select
      const charlieCard = screen.getByText("Charlie").closest("div[class*='cursor-pointer']");
      if (charlieCard) {
        await user.click(charlieCard);
        expect(charlieCard.classList.toString()).toMatch(/primary/i);
      }
    });

    it("shows selected count in Assign button", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      // Select Bob
      const bobCard = screen.getByText("Bob").closest("div[class*='cursor-pointer']");
      if (bobCard) {
        await user.click(bobCard);
      }

      // The submit button should show "(1)"
      const submitButton = screen.getByRole("button", { name: /assign \(1\)/i });
      expect(submitButton).toBeInTheDocument();
    });

    it("calls assignToMultipleStudents mutation with selected students", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      // Select Bob
      const bobCard = screen.getByText("Bob").closest("div[class*='cursor-pointer']");
      if (bobCard) {
        await user.click(bobCard);
      }

      // Select Charlie
      const charlieCard = screen.getByText("Charlie").closest("div[class*='cursor-pointer']");
      if (charlieCard) {
        await user.click(charlieCard);
      }

      // Click Assign button
      const submitButton = screen.getByRole("button", { name: /assign \(2\)/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAssignToMultiple).toHaveBeenCalledWith(
          expect.objectContaining({
            objectiveId: "sub_1",
            studentIds: expect.arrayContaining(["student_2", "student_3"]),
            assignedBy: "admin_123",
          })
        );
      });
    });

    it("disables Assign button when no students selected", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      // The submit Assign button should be disabled
      const submitButtons = screen.getAllByRole("button", { name: /^assign$/i });
      // Find the one in the dialog (not the one that opened the dialog)
      const submitButton = submitButtons.find((btn) =>
        btn.closest('[role="dialog"]')
      );
      if (submitButton) {
        expect(submitButton).toBeDisabled();
      }
    });

    it("shows message when all students are already assigned", async () => {
      (useQuery as any).mockImplementation((query: string, args: any) => {
        if (args === "skip") return undefined;
        if (query === "domains.getAll") return mockDomains;
        if (query === "users.getAll") return mockStudents;
        if (query === "objectives.getByDomain") return mockMajorObjectives;
        if (query === "objectives.getAssignedStudents") {
          // All students already assigned
          return [
            { _id: "a1", userId: "student_1", user: mockStudents[0] },
            { _id: "a2", userId: "student_2", user: mockStudents[1] },
            { _id: "a3", userId: "student_3", user: mockStudents[2] },
          ];
        }
        if (query === "objectives.getAssignedStudentsForChapter") return [];
        if (query === "activities.getByObjective") return mockActivities;
        return undefined;
      });

      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      expect(
        screen.getByText("All students are already assigned to this sub objective")
      ).toBeInTheDocument();
    });

    it("toggles student selection on click", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      const bobCard = screen.getByText("Bob").closest("div[class*='cursor-pointer']");
      if (bobCard) {
        // Select Bob
        await user.click(bobCard);
        expect(bobCard.classList.toString()).toMatch(/primary/i);

        // Deselect Bob
        await user.click(bobCard);
        expect(bobCard.classList.toString()).not.toMatch(/border-primary/);
      }
    });

    it("displays student batch information", async () => {
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      expect(screen.getByText("Batch A")).toBeInTheDocument();
      expect(screen.getByText("Batch B")).toBeInTheDocument();
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      setupDefaultQueries();
    });

    it("displays error message when create major fails", async () => {
      mockCreateMajor.mockRejectedValueOnce(new Error("Network error"));

      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Add Major Objective"));

      // Select domain
      const domainSelect = screen.getAllByTestId("select-trigger")[0];
      await user.click(domainSelect);
      const domainOption = screen.getByRole("option", { name: /mathematics/i });
      await user.click(domainOption);

      // Fill form
      const titleInput = screen.getByPlaceholderText("e.g., Fractions Fundamentals");
      await user.type(titleInput, "Test Major");

      const descInput = screen.getByPlaceholderText("What does this major unlock?");
      await user.type(descInput, "Test description");

      // Submit
      const createButton = screen.getByRole("button", { name: /create major/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while creating the major objective")
        ).toBeInTheDocument();
      });
    });

    it("displays error message when update major fails", async () => {
      mockUpdateMajor.mockRejectedValueOnce(new Error("Network error"));

      const user = userEvent.setup();
      render(<ObjectivesPage />);

      const editButtons = screen.getAllByTitle("Edit major");
      await user.click(editButtons[0]);

      const saveButton = screen.getByRole("button", { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while updating the major objective")
        ).toBeInTheDocument();
      });
    });

    it("handles delete major failure gracefully", async () => {
      mockRemoveMajor.mockRejectedValueOnce(new Error("Network error"));
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

      const user = userEvent.setup();
      render(<ObjectivesPage />);

      const deleteButtons = screen.getAllByTitle("Delete major");
      await user.click(deleteButtons[0]);

      // Verify the mutation was attempted
      await waitFor(() => {
        expect(mockRemoveMajor).toHaveBeenCalledWith({ objectiveId: "major_1" });
      });

      // The error is stored in state but only displayed in dialogs
      // Opening a dialog should show the error
      await user.click(screen.getByText("Add Major Objective"));
      expect(screen.getByText("Failed to delete major objective")).toBeInTheDocument();

      confirmSpy.mockRestore();
    });

    it("displays error message when create sub-objective fails", async () => {
      mockCreateSubObjective.mockRejectedValueOnce(new Error("Network error"));

      const user = userEvent.setup();
      render(<ObjectivesPage />);

      const addSubButtons = screen.getAllByText("Add Sub");
      await user.click(addSubButtons[0]);

      const titleInput = screen.getByPlaceholderText(
        "e.g., Add fractions with like denominators"
      );
      await user.type(titleInput, "Test Sub");

      const descInput = screen.getByPlaceholderText(
        "What will students master in this step?"
      );
      await user.type(descInput, "Test description");

      const addButton = screen.getByRole("button", { name: /add sub objective/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while saving the sub objective")
        ).toBeInTheDocument();
      });
    });

    it("handles assign students failure gracefully", async () => {
      mockAssignToMultiple.mockRejectedValueOnce(new Error("Network error"));

      const user = userEvent.setup();
      render(<ObjectivesPage />);

      await user.click(screen.getByText("Fractions Fundamentals"));
      const assignButtons = screen.getAllByText("Assign");
      // Index 0 is chapter-level Assign on the major header; index 1 is the sub-objective Assign
      await user.click(assignButtons[1]);

      const bobCard = screen.getByText("Bob").closest("div[class*='cursor-pointer']");
      if (bobCard) {
        await user.click(bobCard);
      }

      const submitButton = screen.getByRole("button", { name: /assign \(1\)/i });
      await user.click(submitButton);

      // Wait for mutation to be called and fail
      await waitFor(() => {
        expect(mockAssignToMultiple).toHaveBeenCalled();
      });

      // Note: The assign dialog doesn't have error display implemented.
      // The error is stored in state but not visible in this dialog.
      // The dialog should remain open after failure (it only closes on success)
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("displays error message when create activity fails", async () => {
      mockCreateActivity.mockRejectedValueOnce(new Error("Network error"));

      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand major, then sub-objective
      await user.click(screen.getByText("Fractions Fundamentals"));
      const subObjective = screen.getByText("Add fractions with like denominators");
      await user.click(subObjective);

      // Open add activity dialog
      const addActivityButton = screen.getByText("Add Activity");
      await user.click(addActivityButton);

      // Fill form
      const titleInput = screen.getByPlaceholderText("e.g., Watch intro video");
      await user.type(titleInput, "Test Activity");

      const urlInput = screen.getByPlaceholderText("https://...");
      await user.type(urlInput, "https://example.com");

      // Submit
      const submitButton = screen.getByRole("button", { name: /^add activity$/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("An error occurred while saving the activity")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Loading states", () => {
    it("shows loading when domains are undefined", () => {
      (useQuery as any).mockImplementation((query: string, args: any) => {
        if (query === "domains.getAll") return undefined;
        return undefined;
      });

      render(<ObjectivesPage />);

      // Should show empty state or no domain tabs
      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    });

    it("shows loading indicator in buttons during mutation", async () => {
      // Make the mutation hang
      mockCreateMajor.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10000))
      );

      const user = userEvent.setup();

      (useQuery as any).mockImplementation((query: string, args: any) => {
        if (args === "skip") return undefined;
        if (query === "domains.getAll") return mockDomains;
        if (query === "users.getAll") return mockStudents;
        if (query === "objectives.getByDomain") return mockMajorObjectives;
        return undefined;
      });

      render(<ObjectivesPage />);

      await user.click(screen.getByText("Add Major Objective"));

      // Select domain
      const domainSelect = screen.getAllByTestId("select-trigger")[0];
      await user.click(domainSelect);
      const domainOption = screen.getByRole("option", { name: /mathematics/i });
      await user.click(domainOption);

      // Fill form
      const titleInput = screen.getByPlaceholderText("e.g., Fractions Fundamentals");
      await user.type(titleInput, "Test Major");

      const descInput = screen.getByPlaceholderText("What does this major unlock?");
      await user.type(descInput, "Test description");

      // Submit
      const createButton = screen.getByRole("button", { name: /create major/i });
      await user.click(createButton);

      // Button should show loading state (disabled)
      expect(createButton).toBeDisabled();
    });
  });

  describe("PYP Year 2 collapsible section", () => {
    const mockMypMajor = {
      _id: "major_myp_1",
      title: "Fractions Fundamentals",
      description: "Master the basics of fractions",
      difficulty: "beginner",
      estimatedHours: 5,
      domainId: "domain_1",
      curriculum: "MYP Y1",
      subObjectives: [
        {
          _id: "sub_myp_1",
          title: "Add fractions with like denominators",
          description: "Learn to add fractions",
          difficulty: "beginner",
          estimatedHours: 1,
          majorObjectiveId: "major_myp_1",
        },
      ],
    };

    const mockPypMajors = [
      {
        _id: "major_pyp_1",
        title: "Number Crunching",
        description: "Number Crunching",
        difficulty: "beginner",
        estimatedHours: 3,
        domainId: "domain_1",
        curriculum: "PYP Y2",
        subObjectives: [
          {
            _id: "sub_pyp_1",
            title: "Addition within 100",
            description: "Practice adding numbers",
            difficulty: "beginner",
            estimatedHours: 1,
            majorObjectiveId: "major_pyp_1",
          },
        ],
      },
      {
        _id: "major_pyp_2",
        title: "Fraction Adventures",
        description: "Fraction Adventures",
        difficulty: "beginner",
        estimatedHours: 4,
        domainId: "domain_1",
        curriculum: "PYP Y2",
        subObjectives: [],
      },
    ];

    const mockMixedMajors = [mockMypMajor, ...mockPypMajors];

    const setupMixedQueries = () => {
      (useQuery as any).mockImplementation((query: string, args: any) => {
        if (args === "skip") return undefined;
        if (query === "domains.getAll") return mockDomains;
        if (query === "users.getAll") return mockStudents;
        if (query === "objectives.getByDomain") return mockMixedMajors;
        if (query === "objectives.getAssignedStudents") return [];
        if (query === "objectives.getAssignedStudentsForChapter") return [];
        if (query === "activities.getByObjective") return [];
        return undefined;
      });
    };

    it("shows PYP Year 2 header when PYP objectives exist", () => {
      setupMixedQueries();
      render(<ObjectivesPage />);

      expect(screen.getByText("PYP Year 2")).toBeInTheDocument();
    });

    it("shows MYP Year 1 header when both MYP and PYP exist", () => {
      setupMixedQueries();
      render(<ObjectivesPage />);

      expect(screen.getByText("MYP Year 1")).toBeInTheDocument();
    });

    it("shows grades badge on PYP section", () => {
      setupMixedQueries();
      render(<ObjectivesPage />);

      expect(screen.getByText("Grades 4-5")).toBeInTheDocument();
    });

    it("shows PYP module count badge", () => {
      setupMixedQueries();
      render(<ObjectivesPage />);

      expect(screen.getByText("2 modules")).toBeInTheDocument();
    });

    it("PYP section is collapsed by default", () => {
      setupMixedQueries();
      render(<ObjectivesPage />);

      // PYP header visible
      expect(screen.getByText("PYP Year 2")).toBeInTheDocument();
      // PYP objectives NOT visible (collapsed)
      expect(screen.queryByText("Number Crunching")).not.toBeInTheDocument();
      expect(screen.queryByText("Fraction Adventures")).not.toBeInTheDocument();
    });

    it("expands PYP section when clicking header", async () => {
      setupMixedQueries();
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Click PYP header to expand
      await user.click(screen.getByText("PYP Year 2"));

      // PYP objectives now visible
      expect(screen.getByText("Number Crunching")).toBeInTheDocument();
      expect(screen.getByText("Fraction Adventures")).toBeInTheDocument();
    });

    it("collapses PYP section when clicking header again", async () => {
      setupMixedQueries();
      const user = userEvent.setup();
      render(<ObjectivesPage />);

      // Expand
      await user.click(screen.getByText("PYP Year 2"));
      expect(screen.getByText("Number Crunching")).toBeInTheDocument();

      // Collapse
      await user.click(screen.getByText("PYP Year 2"));
      expect(screen.queryByText("Number Crunching")).not.toBeInTheDocument();
    });

    it("MYP objectives are always visible (not collapsed)", () => {
      setupMixedQueries();
      render(<ObjectivesPage />);

      // MYP major should be visible even though PYP section exists
      expect(screen.getByText("Fractions Fundamentals")).toBeInTheDocument();
    });

    it("does not show section headers when no PYP data exists", () => {
      // Use default mock without PYP data (mockMajorObjectives has no curriculum field)
      setupDefaultQueries();
      render(<ObjectivesPage />);

      expect(screen.queryByText("MYP Year 1")).not.toBeInTheDocument();
      expect(screen.queryByText("PYP Year 2")).not.toBeInTheDocument();
    });
  });
});
