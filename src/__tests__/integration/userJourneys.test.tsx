/**
 * Integration tests for P0 end-to-end user journeys from TEST-PLAN.md section 6.
 *
 * These tests mock at the Convex hook level to test full component interactions
 * across multiple pages and user flows.
 *
 * Key journeys covered:
 * 1. First-run bootstrap: LoginPage detects bootstrap -> SetupPage creates admin -> seeds -> returns to login
 * 2. Student login + gate: student hits /dashboard -> CheckInGate blocks until check-in -> dashboard renders
 * 3. Sprint loop: active sprint -> student creates goal + tasks -> completes tasks -> counters update
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { ReactNode } from "react";

// ============================================================
// MOCK SETUP - All external dependencies mocked at module level
// ============================================================

// Track navigation for testing route changes
const mockNavigate = vi.fn();
let mockLocationState: { from?: { pathname: string } } | null = null;
let mockLocationPathname = "/login";

// Track mutation calls
const mockMutations: Record<string, ReturnType<typeof vi.fn>> = {
  initializeAdmin: vi.fn(),
  seedAll: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  saveCheckIn: vi.fn(),
  createGoal: vi.fn(),
  addActionItem: vi.fn(),
  toggleActionItem: vi.fn(),
  updateGoal: vi.fn(),
  deleteTodayCheckIn: vi.fn(),
};

// Query results - controlled per test
let queryResults: Record<string, any> = {};

// Mock convex/react - we'll configure useQuery behavior in beforeEach
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useAction: vi.fn(() => vi.fn().mockResolvedValue({ content: "AI response" })),
  useConvex: vi.fn(() => ({})),
}));

// Mock the API module
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    auth: {
      checkNeedsBootstrap: "auth.checkNeedsBootstrap",
      initializeAdmin: "auth.initializeAdmin",
      getCurrentUser: "auth.getCurrentUser",
      login: "auth.login",
      logout: "auth.logout",
    },
    seed: {
      seedAll: "seed.seedAll",
    },
    emotions: {
      saveCheckIn: "emotions.saveCheckIn",
      getTodayCheckIn: "emotions.getTodayCheckIn",
      getCategories: "emotions.getCategories",
      deleteTodayCheckIn: "emotions.deleteTodayCheckIn",
    },
    domains: { getAll: "domains.getAll" },
    sprints: { getActive: "sprints.getActive" },
    goals: {
      getByUserAndSprint: "goals.getByUserAndSprint",
      getPreviousSprintGoals: "goals.getPreviousSprintGoals",
      create: "goals.create",
      update: "goals.update",
      remove: "goals.remove",
      toggleActionItem: "goals.toggleActionItem",
      addActionItem: "goals.addActionItem",
      removeActionItem: "goals.removeActionItem",
      duplicate: "goals.duplicate",
      importGoal: "goals.importGoal",
    },
    progress: { getDomainSummary: "progress.getDomainSummary" },
    character: { getMyCharacter: "character.getMyCharacter" },
    books: { getCurrentlyReading: "books.getCurrentlyReading" },
    habits: {
      getByUserAndSprint: "habits.getByUserAndSprint",
      update: "habits.update",
      getCompletionsInRange: "habits.getCompletionsInRange",
      toggleCompletion: "habits.toggleCompletion",
    },
    ai: { chat: "ai.chat" },
    chatLogs: { log: "chatLogs.log", clearAll: "chatLogs.clearAll", exportLogs: "chatLogs.exportLogs" },
  },
}));

// Mock react-router-dom navigation
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      state: mockLocationState,
      pathname: mockLocationPathname,
    }),
  };
});

// Mock framer-motion - filter out animation props
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    button: ({ children, whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
    textarea: ({ whileHover, whileTap, initial, animate, exit, variants, transition, layout, layoutId, ...props }: any) => (
      <textarea {...props} />
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock useDelayedLoading to avoid timer issues
vi.mock("../../hooks/useDelayedLoading", () => ({
  useDelayedLoading: vi.fn((isLoading: boolean) => isLoading),
}));

// Mock phosphor icons
vi.mock("@phosphor-icons/react", () => ({
  Sun: ({ className }: any) => <span className={className} data-testid="icon-sun">Sun</span>,
  Plant: ({ className }: any) => <span className={className} data-testid="icon-plant">Plant</span>,
  Drop: ({ className }: any) => <span className={className} data-testid="icon-drop">Drop</span>,
  CloudRain: ({ className }: any) => <span className={className} data-testid="icon-rain">CloudRain</span>,
}));

// Mock Radix UI components used across pages
vi.mock("@radix-ui/react-dialog", () => ({
  Root: ({ children, open }: any) => (open !== false ? <>{children}</> : null),
  Trigger: ({ children }: any) => <>{children}</>,
  Portal: ({ children }: any) => <>{children}</>,
  Overlay: () => null,
  Content: ({ children }: any) => <div role="dialog">{children}</div>,
  Title: ({ children }: any) => <h2>{children}</h2>,
  Close: ({ children }: any) => <>{children}</>,
}));

vi.mock("@radix-ui/react-tooltip", () => ({
  Provider: ({ children }: any) => <>{children}</>,
  Root: ({ children }: any) => <>{children}</>,
  Trigger: ({ children }: any) => <>{children}</>,
  Portal: ({ children }: any) => <>{children}</>,
  Content: ({ children }: any) => <div>{children}</div>,
}));

// Mock paper components for SetupPage
vi.mock("../../components/paper", () => ({
  Button: ({ children, onClick, type, disabled, isLoading, fullWidth: _fullWidth, ...props }: any) => (
    <button onClick={onClick} type={type} disabled={disabled || isLoading} {...props}>
      {isLoading ? "Loading..." : children}
    </button>
  ),
  Input: ({ label, value, onChange, type, placeholder, disabled, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input
        type={type || "text"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={label}
        {...props}
      />
    </div>
  ),
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  Modal: ({ children, isOpen, title }: any) =>
    isOpen ? (
      <div data-testid="modal" role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

// Mock sprint components
vi.mock("../../components/sprint", () => ({
  GoalEditor: ({ onSave, onCancel }: any) => (
    <div data-testid="goal-editor">
      <input data-testid="goal-title-input" placeholder="Goal title" />
      <button onClick={() => onSave({ title: "Test Goal", specific: "test", measurable: "test", achievable: "test", relevant: "test", timeBound: "test" })}>
        Save Goal
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
  HabitTracker: () => <div data-testid="habit-tracker">Habit Tracker</div>,
}));

// Mock TaskAssigner
vi.mock("../../components/student/TaskAssigner", () => ({
  TaskAssigner: () => <div data-testid="task-assigner">Task Assigner</div>,
}));

// Mock Skeleton UI component
vi.mock("../../components/ui/skeleton", () => ({
  Skeleton: ({ className }: any) => <div className={`skeleton ${className}`} data-testid="skeleton" />,
}));

// ============================================================
// Import components AFTER mocking
// ============================================================
import { LoginPage } from "../../pages/LoginPage";
import { SetupPage } from "../../pages/SetupPage";
import { StudentDashboard } from "../../pages/student/StudentDashboard";
import { SprintPage } from "../../pages/student/SprintPage";
import { CheckInGate } from "../../components/layout/CheckInGate";
import { useQuery, useMutation } from "convex/react";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";

// ============================================================
// MOCK USER DATA
// ============================================================

const mockAdminUser = {
  _id: "admin_123",
  username: "admin",
  displayName: "Coach Admin",
  role: "admin" as const,
  createdAt: Date.now(),
};

const mockStudentUser = {
  _id: "student_123",
  username: "student",
  displayName: "Test Student",
  role: "student" as const,
  createdAt: Date.now(),
};

const mockEmotionCategories = [
  {
    _id: "cat_1",
    name: "Happy",
    emoji: "H",
    color: "#FFD93D",
    subcategories: [
      { _id: "sub_1", name: "Excited", emoji: "E" },
      { _id: "sub_2", name: "Content", emoji: "C" },
    ],
  },
];

const mockDomains = [
  { _id: "domain_1", name: "Math", icon: "+" },
  { _id: "domain_2", name: "Reading", icon: "B" },
];

const mockActiveSprint = {
  _id: "sprint_1",
  name: "January Sprint",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  status: "active",
  isActive: true,
};

// Use today's day of week so task count test works regardless of when it runs
const todayDayOfWeek = new Date().getDay();

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
      { _id: "item_2", title: "Read chapter 2", isCompleted: false, weekNumber: 1, dayOfWeek: todayDayOfWeek }, // Task for today
    ],
  },
];

const mockDomainProgress = [
  { domain: mockDomains[0], mastered: 5, inProgress: 2, assigned: 1, total: 8 },
  { domain: mockDomains[1], mastered: 3, inProgress: 1, assigned: 0, total: 4 },
];

// ============================================================
// AUTH CONTEXT MOCK
// ============================================================

// Create a mock auth context that we can control
let mockAuthState = {
  user: null as typeof mockStudentUser | typeof mockAdminUser | null,
  isLoading: false,
};

// Mock useAuth at module level
vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: mockAuthState.user,
    isLoading: mockAuthState.isLoading,
    login: mockMutations.login,
    logout: mockMutations.logout,
  })),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// ============================================================
// TEST APP WRAPPER
// ============================================================

interface TestAppProps {
  initialRoute?: string;
  children?: ReactNode;
}

/**
 * Test wrapper that provides routing context for integration tests.
 * Uses MemoryRouter to simulate navigation without actual browser history.
 */
function TestApp({ initialRoute = "/login", children }: TestAppProps) {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      {children || (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/setup" element={<SetupPage />} />
          <Route
            path="/dashboard"
            element={
              <CheckInGate>
                <StudentDashboard />
              </CheckInGate>
            }
          />
          <Route
            path="/sprint"
            element={
              <CheckInGate>
                <SprintPage />
              </CheckInGate>
            }
          />
        </Routes>
      )}
    </MemoryRouter>
  );
}

// ============================================================
// TESTS
// ============================================================

describe("Integration Tests: User Journeys", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock scrollIntoView which is used by SprintPage
    Element.prototype.scrollIntoView = vi.fn();

    // Reset all state
    queryResults = {};
    mockAuthState = { user: null, isLoading: false };
    mockLocationState = null;
    mockLocationPathname = "/login";

    // Reset mutation mocks to default success behavior
    mockMutations.initializeAdmin.mockResolvedValue({ success: true });
    mockMutations.seedAll.mockResolvedValue({});
    mockMutations.login.mockResolvedValue(true);
    mockMutations.saveCheckIn.mockResolvedValue({});
    mockMutations.createGoal.mockResolvedValue({ _id: "new_goal_1" });
    mockMutations.addActionItem.mockResolvedValue({ _id: "new_item_1" });
    mockMutations.toggleActionItem.mockResolvedValue({});

    // Configure useQuery mock - this is critical for the tests to work
    (useQuery as any).mockImplementation((queryName: string, args?: any) => {
      // Skip pattern for conditional queries
      if (args === "skip") return undefined;
      // Return result based on query name (extract last part of path)
      const name = typeof queryName === "string" ? queryName.split(".").pop() : "";
      return queryResults[name!] ?? queryResults[queryName] ?? undefined;
    });

    // Configure useMutation mock
    (useMutation as any).mockImplementation((mutationName: string) => {
      const name = typeof mutationName === "string" ? mutationName.split(".").pop() : "";
      return mockMutations[name!] ?? vi.fn().mockResolvedValue({});
    });

    // Default: don't show skeleton
    (useDelayedLoading as any).mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // JOURNEY 1: First-run Bootstrap
  // ============================================================
  describe("Journey 1: First-run Bootstrap", () => {
    it("LoginPage shows 'Begin Setup' banner when checkNeedsBootstrap returns true", () => {
      // System needs bootstrap (no users exist)
      queryResults.checkNeedsBootstrap = true;

      render(<TestApp initialRoute="/login" />);

      expect(screen.getByText(/welcome! let's set up your first admin account/i)).toBeInTheDocument();
      expect(screen.getByText(/begin setup/i)).toBeInTheDocument();
    });

    it("clicking 'Begin Setup' navigates to /setup", async () => {
      const user = userEvent.setup();
      queryResults.checkNeedsBootstrap = true;

      render(<TestApp initialRoute="/login" />);

      const setupButton = screen.getByText(/begin setup/i);
      await user.click(setupButton);

      expect(mockNavigate).toHaveBeenCalledWith("/setup");
    });

    it("SetupPage completes full admin creation flow", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={["/setup"]}>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Step 1: Should see welcome message
      expect(screen.getByText(/welcome, coach!/i)).toBeInTheDocument();

      // Fill in admin creation form
      const displayNameInput = screen.getByLabelText(/your name/i);
      const usernameInput = screen.getByLabelText(/^username$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(displayNameInput, "Coach Vishwa");
      await user.type(usernameInput, "admin");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /create my account/i });
      await user.click(submitButton);

      // Verify initializeAdmin was called with correct args
      await waitFor(() => {
        expect(mockMutations.initializeAdmin).toHaveBeenCalledWith({
          username: "admin",
          password: "password123",
          displayName: "Coach Vishwa",
        });
      });

      // Step 2: Should see "Account Created!" and seed options
      await waitFor(() => {
        expect(screen.getByText(/account created!/i)).toBeInTheDocument();
      });

      // Click "Add Starter Content" to seed data
      const seedButton = screen.getByRole("button", { name: /add starter content/i });
      await user.click(seedButton);

      await waitFor(() => {
        expect(mockMutations.seedAll).toHaveBeenCalledWith({});
      });

      // Step 3: Should see "All Set!" message
      await waitFor(() => {
        expect(screen.getByText(/all set!/i)).toBeInTheDocument();
      });

      // Click "Go to Login"
      const loginButton = screen.getByRole("button", { name: /go to login/i });
      await user.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("SetupPage handles validation errors correctly", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={["/setup"]}>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Try to submit without filling form
      const submitButton = screen.getByRole("button", { name: /create my account/i });
      await user.click(submitButton);

      // Should show validation error
      expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();

      // initializeAdmin should not be called
      expect(mockMutations.initializeAdmin).not.toHaveBeenCalled();
    });

    it("SetupPage shows password mismatch error", async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter initialEntries={["/setup"]}>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
          </Routes>
        </MemoryRouter>
      );

      const displayNameInput = screen.getByLabelText(/your name/i);
      const usernameInput = screen.getByLabelText(/^username$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(displayNameInput, "Coach");
      await user.type(usernameInput, "admin");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "differentpassword");

      const submitButton = screen.getByRole("button", { name: /create my account/i });
      await user.click(submitButton);

      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      expect(mockMutations.initializeAdmin).not.toHaveBeenCalled();
    });

    it("SetupPage allows skipping seed step", async () => {
      const user = userEvent.setup();
      mockMutations.initializeAdmin.mockResolvedValue({ success: true });

      render(
        <MemoryRouter initialEntries={["/setup"]}>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Complete step 1
      await user.type(screen.getByLabelText(/your name/i), "Coach");
      await user.type(screen.getByLabelText(/^username$/i), "admin");
      await user.type(screen.getByLabelText(/^password$/i), "password123");
      await user.type(screen.getByLabelText(/confirm password/i), "password123");
      await user.click(screen.getByRole("button", { name: /create my account/i }));

      // Wait for step 2
      await waitFor(() => {
        expect(screen.getByText(/account created!/i)).toBeInTheDocument();
      });

      // Click "Skip for now"
      await user.click(screen.getByRole("button", { name: /skip for now/i }));

      // Should go to step 3 without calling seedAll
      await waitFor(() => {
        expect(screen.getByText(/all set!/i)).toBeInTheDocument();
      });
      expect(mockMutations.seedAll).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // JOURNEY 2: Student Login + Gate
  // ============================================================
  describe("Journey 2: Student Login + CheckInGate", () => {
    it("CheckInGate blocks dashboard until check-in is complete", async () => {
      // Set up as logged-in student
      mockAuthState.user = mockStudentUser;

      // Set up query results - no check-in yet
      queryResults.getCategories = mockEmotionCategories;
      queryResults.getTodayCheckIn = null; // Not checked in - explicitly null (not undefined)

      // Reconfigure useQuery for this test - need to handle the userId argument pattern
      (useQuery as any).mockImplementation((queryName: string, args?: any) => {
        if (args === "skip") return undefined;
        const name = typeof queryName === "string" ? queryName.split(".").pop() : "";

        // Handle getTodayCheckIn specially - it passes { userId } as args
        if (name === "getTodayCheckIn") {
          // Return null to indicate no check-in today
          return null;
        }

        return queryResults[name!] ?? queryResults[queryName] ?? undefined;
      });

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show CheckInGate UI, not dashboard
      expect(screen.getByText(/the palette of presence/i)).toBeInTheDocument();
      expect(screen.queryByText(/the daily overview/i)).not.toBeInTheDocument();
    });

    it("CheckInGate allows access after completing check-in", async () => {
      const user = userEvent.setup();

      // Set up as logged-in student with completed check-in
      mockAuthState.user = mockStudentUser;

      // Set up query results - already checked in
      queryResults.getCategories = mockEmotionCategories;
      queryResults.getTodayCheckIn = {
        _id: "checkin_1",
        userId: "student_123",
        categoryId: "cat_1",
        subcategoryId: "sub_1",
        journalEntry: "Feeling good!",
        createdAt: Date.now(),
      };
      queryResults.getAll = mockDomains;
      queryResults.getDomainSummary = mockDomainProgress;
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = mockGoals;
      queryResults.getCurrentlyReading = null;

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show dashboard, not check-in gate
      expect(screen.queryByText(/the palette of presence/i)).not.toBeInTheDocument();
      expect(screen.getByText(/the daily overview/i)).toBeInTheDocument();
    });

    it("CheckInGate flow: select emotion -> journal -> save -> dashboard renders", async () => {
      const user = userEvent.setup();

      // Set up as logged-in student
      mockAuthState.user = mockStudentUser;

      // Initially not checked in
      let hasCheckedIn = false;

      // Dynamic query results based on check-in state
      (useQuery as any).mockImplementation((queryName: string, args: any) => {
        if (args === "skip") return undefined;
        const name = typeof queryName === "string" ? queryName.split(".").pop() : queryName;

        if (name === "getCategories") return mockEmotionCategories;
        if (name === "getTodayCheckIn") {
          return hasCheckedIn
            ? { _id: "checkin_1", userId: "student_123", categoryId: "cat_1", subcategoryId: "sub_1" }
            : null;
        }
        if (name === "getAll") return mockDomains;
        if (name === "getDomainSummary") return mockDomainProgress;
        if (name === "getActive") return mockActiveSprint;
        if (name === "getByUserAndSprint") return mockGoals;
        if (name === "getCurrentlyReading") return null;
        return undefined;
      });

      // Mock saveCheckIn to update check-in state
      mockMutations.saveCheckIn.mockImplementation(async () => {
        hasCheckedIn = true;
        return {};
      });

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show check-in gate
      expect(screen.getByText(/the palette of presence/i)).toBeInTheDocument();

      // Click on first quadrant (Good + High Energy)
      const quadrantCards = document.querySelectorAll(".mood-card");
      expect(quadrantCards.length).toBe(4);
      await user.click(quadrantCards[0]);

      // Wait for emotion shades to appear
      await waitFor(() => {
        expect(screen.getByText(/excited/i)).toBeInTheDocument();
      });

      // Select an emotion
      await user.click(screen.getByText(/excited/i));

      // Wait for PROCEED button
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /proceed/i })).toBeInTheDocument();
      });

      // Click PROCEED
      await user.click(screen.getByRole("button", { name: /proceed/i }));

      // Wait for journal screen
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/why do you feel this way/i)).toBeInTheDocument();
      });

      // Enter optional journal entry
      const textarea = screen.getByPlaceholderText(/why do you feel this way/i);
      await user.type(textarea, "Had a great morning!");

      // Click CONTINUE to save
      await user.click(screen.getByRole("button", { name: /continue/i }));

      // Verify saveCheckIn was called
      await waitFor(() => {
        expect(mockMutations.saveCheckIn).toHaveBeenCalled();
      });
    });

    it("CheckInGate shows error when save fails and allows retry", async () => {
      const user = userEvent.setup();

      mockAuthState.user = mockStudentUser;
      queryResults.getCategories = mockEmotionCategories;
      queryResults.getTodayCheckIn = null;

      // Reconfigure useQuery for this test - need to handle the userId argument pattern
      (useQuery as any).mockImplementation((queryName: string, args?: any) => {
        if (args === "skip") return undefined;
        const name = typeof queryName === "string" ? queryName.split(".").pop() : "";

        // Handle getTodayCheckIn specially - it passes { userId } as args
        if (name === "getTodayCheckIn") {
          return null;
        }

        return queryResults[name!] ?? queryResults[queryName] ?? undefined;
      });

      // Make save fail
      mockMutations.saveCheckIn.mockRejectedValueOnce(new Error("Network error"));

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Go through check-in flow
      const quadrantCards = document.querySelectorAll(".mood-card");
      await user.click(quadrantCards[0]);

      await waitFor(() => {
        expect(screen.getByText(/excited/i)).toBeInTheDocument();
      });
      await user.click(screen.getByText(/excited/i));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /proceed/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /proceed/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /continue/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/couldn't save/i)).toBeInTheDocument();
      });

      // Retry button should be visible
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });

  // ============================================================
  // JOURNEY 3: Sprint Loop
  // ============================================================
  describe("Journey 3: Sprint Loop", () => {
    beforeEach(() => {
      // Set up as logged-in student with completed check-in
      mockAuthState.user = mockStudentUser;
      queryResults.getCategories = mockEmotionCategories;
      queryResults.getTodayCheckIn = { _id: "checkin_1" };
      // Add habits query results (needed by HabitTracker)
      queryResults.getByUserAndSprint = mockGoals;
      queryResults.getCompletionsInRange = [];
    });

    it("SprintPage displays active sprint with goals", async () => {
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = mockGoals;
      queryResults.getPreviousSprintGoals = [];
      queryResults.getCompletionsInRange = [];

      render(
        <MemoryRouter initialEntries={["/sprint"]}>
          <Routes>
            <Route
              path="/sprint"
              element={
                <CheckInGate>
                  <SprintPage />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show sprint name
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /january sprint/i })
        ).toBeInTheDocument();
      });

      // Should show existing goal (may appear in multiple places - goal card + task pills)
      const goalTitles = screen.getAllByText(/read 20 pages daily/i);
      expect(goalTitles.length).toBeGreaterThan(0);

      // Should show week toggle
      expect(screen.getByText(/week 1/i)).toBeInTheDocument();
      expect(screen.getByText(/week 2/i)).toBeInTheDocument();
    });

    it("SprintPage shows 'No Active Cycle' when no sprint exists", () => {
      queryResults.getActive = null;
      queryResults.getByUserAndSprint = [];
      queryResults.getPreviousSprintGoals = [];

      render(
        <MemoryRouter initialEntries={["/sprint"]}>
          <Routes>
            <Route
              path="/sprint"
              element={
                <CheckInGate>
                  <SprintPage />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/no active cycle/i)).toBeInTheDocument();
    });

    it("SprintPage shows empty goal slots when user has no goals", () => {
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = [];
      queryResults.getPreviousSprintGoals = [];

      render(
        <MemoryRouter initialEntries={["/sprint"]}>
          <Routes>
            <Route
              path="/sprint"
              element={
                <CheckInGate>
                  <SprintPage />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Single "Set Goal" add-slot is shown when there are no goals
      const setGoalButtons = screen.getAllByText(/set goal/i);
      expect(setGoalButtons).toHaveLength(1);
    });

    it("StudentDashboard displays correct task counts from goals", () => {
      queryResults.getAll = mockDomains;
      queryResults.getDomainSummary = mockDomainProgress;
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = mockGoals; // 1 in_progress goal
      queryResults.getCurrentlyReading = null;

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show "1 Tasks Left" (1 incomplete task for today)
      expect(screen.getByText(/1 tasks left/i)).toBeInTheDocument();

      // Should show sprint name
      expect(screen.getByText(/january sprint/i)).toBeInTheDocument();

      // Should show Day 1
      expect(screen.getByText(/day 1/i)).toBeInTheDocument();
    });

    it("StudentDashboard displays mastered objectives count", () => {
      queryResults.getAll = mockDomains;
      queryResults.getDomainSummary = mockDomainProgress; // 5 + 3 = 8 mastered
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = mockGoals;
      queryResults.getCurrentlyReading = null;

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Total mastered should be 5 + 3 = 8
      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText(/mastered/i)).toBeInTheDocument();
    });

    it("SprintPage renders all day columns in week view", async () => {
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = mockGoals;
      queryResults.getPreviousSprintGoals = [];
      queryResults.getCompletionsInRange = [];

      render(
        <MemoryRouter initialEntries={["/sprint"]}>
          <Routes>
            <Route
              path="/sprint"
              element={
                <CheckInGate>
                  <SprintPage />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Wait for sprint page to render
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /january sprint/i })
        ).toBeInTheDocument();
      });

      // All 7 days should be visible
      expect(screen.getByText("Mon")).toBeInTheDocument();
      expect(screen.getByText("Tue")).toBeInTheDocument();
      expect(screen.getByText("Wed")).toBeInTheDocument();
      expect(screen.getByText("Thu")).toBeInTheDocument();
      expect(screen.getByText("Fri")).toBeInTheDocument();
      expect(screen.getByText("Sat")).toBeInTheDocument();
      expect(screen.getByText("Sun")).toBeInTheDocument();
    });

    it("SprintPage renders habit tracker component", async () => {
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = mockGoals;
      queryResults.getPreviousSprintGoals = [];
      queryResults.getCompletionsInRange = [];

      render(
        <MemoryRouter initialEntries={["/sprint"]}>
          <Routes>
            <Route
              path="/sprint"
              element={
                <CheckInGate>
                  <SprintPage />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Wait for sprint page to render
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /january sprint/i })
        ).toBeInTheDocument();
      });

      expect(screen.getByTestId("habit-tracker")).toBeInTheDocument();
    });

    it("StudentDashboard shows domain progress correctly", () => {
      queryResults.getAll = mockDomains;
      queryResults.getDomainSummary = mockDomainProgress;
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = mockGoals;
      queryResults.getCurrentlyReading = null;

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show domain names
      expect(screen.getByText("Math")).toBeInTheDocument();
      expect(screen.getByText("Reading")).toBeInTheDocument();

      // Should show progress fractions
      expect(screen.getByText("5/8")).toBeInTheDocument(); // Math: 5 mastered / 8 total
      expect(screen.getByText("3/4")).toBeInTheDocument(); // Reading: 3 mastered / 4 total
    });

    it("StudentDashboard shows 'Start a Book' when no book is being read", () => {
      queryResults.getAll = mockDomains;
      queryResults.getDomainSummary = mockDomainProgress;
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = mockGoals;
      queryResults.getCurrentlyReading = null;

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/start a book/i)).toBeInTheDocument();
    });

    it("StudentDashboard shows current book when reading", () => {
      queryResults.getAll = mockDomains;
      queryResults.getDomainSummary = mockDomainProgress;
      queryResults.getActive = mockActiveSprint;
      queryResults.getByUserAndSprint = mockGoals;
      queryResults.getCurrentlyReading = {
        book: {
          _id: "book_1",
          title: "Harry Potter",
          author: "J.K. Rowling",
        },
      };

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/harry potter/i)).toBeInTheDocument();
      expect(screen.getByText(/j\.k\. rowling/i)).toBeInTheDocument();
    });

    it("StudentDashboard shows 'No Sprint' when no active sprint exists", () => {
      queryResults.getAll = mockDomains;
      queryResults.getDomainSummary = mockDomainProgress;
      queryResults.getActive = null;
      queryResults.getByUserAndSprint = [];
      queryResults.getCurrentlyReading = null;

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText(/no sprint/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // LOADING STATES
  // ============================================================
  describe("Loading States", () => {
    it("StudentDashboard shows skeleton when data is loading", () => {
      mockAuthState.user = mockStudentUser;
      queryResults.getTodayCheckIn = { _id: "checkin_1" };
      queryResults.getCategories = mockEmotionCategories;

      // Data is loading (undefined)
      queryResults.getAll = undefined;
      queryResults.getDomainSummary = undefined;

      // Show skeleton when loading
      (useDelayedLoading as any).mockReturnValue(true);

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show skeleton elements
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("CheckInGate shows skeleton when categories are loading", () => {
      mockAuthState.user = mockStudentUser;

      // Data is loading
      queryResults.getCategories = undefined;
      queryResults.getTodayCheckIn = undefined;

      (useDelayedLoading as any).mockReturnValue(true);

      render(
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <CheckInGate>
                  <StudentDashboard />
                </CheckInGate>
              }
            />
          </Routes>
        </MemoryRouter>
      );

      // Should show skeleton
      const skeletons = screen.getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // LOGIN FLOW
  // ============================================================
  describe("Login Flow", () => {
    it("LoginPage validates empty username", async () => {
      const user = userEvent.setup();
      queryResults.checkNeedsBootstrap = false;

      render(<TestApp initialRoute="/login" />);

      // Click login without entering username
      await user.click(screen.getByRole("button", { name: /login/i }));

      expect(screen.getByText(/please enter your username/i)).toBeInTheDocument();
    });

    it("LoginPage validates empty password", async () => {
      const user = userEvent.setup();
      queryResults.checkNeedsBootstrap = false;

      render(<TestApp initialRoute="/login" />);

      // Enter username but not password
      await user.type(screen.getByPlaceholderText(/username/i), "testuser");
      await user.click(screen.getByRole("button", { name: /login/i }));

      expect(screen.getByText(/please enter your password/i)).toBeInTheDocument();
    });

    it("LoginPage shows error on failed login", async () => {
      const user = userEvent.setup();
      queryResults.checkNeedsBootstrap = false;
      mockMutations.login.mockResolvedValue(false);

      render(<TestApp initialRoute="/login" />);

      await user.type(screen.getByPlaceholderText(/username/i), "testuser");
      await user.type(screen.getByPlaceholderText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(screen.getByText(/oops! wrong username or password/i)).toBeInTheDocument();
      });
    });

    it("LoginPage disables inputs while submitting", async () => {
      const user = userEvent.setup();
      queryResults.checkNeedsBootstrap = false;

      // Make login hang
      mockMutations.login.mockImplementation(() => new Promise(() => {}));

      render(<TestApp initialRoute="/login" />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      await user.type(usernameInput, "testuser");
      await user.type(passwordInput, "password123");
      await user.click(screen.getByRole("button", { name: /login/i }));

      await waitFor(() => {
        expect(usernameInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
    });
  });
});
