import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./useAuth";
import { ProtectedRoute, PublicOnlyRoute } from "../components/auth/ProtectedRoute";

// Storage key used by the auth module
const TOKEN_KEY = "deep-work-tracker-token";

// Mock user data for tests
const mockStudentUser = {
  _id: "user123",
  username: "teststudent",
  displayName: "Test Student",
  role: "student" as const,
  avatarUrl: undefined,
  createdAt: Date.now(),
  lastLoginAt: Date.now(),
};

const mockAdminUser = {
  _id: "admin456",
  username: "testadmin",
  displayName: "Test Admin",
  role: "admin" as const,
  avatarUrl: undefined,
  createdAt: Date.now(),
  lastLoginAt: Date.now(),
};

// Mock state that controls Convex behavior
let mockQueryResult: typeof mockStudentUser | null | undefined = undefined;
let mockLoginMutation = vi.fn();
let mockLogoutMutation = vi.fn();

// Mock Convex react hooks
// Using a factory function to track which mutation is being created
let mutationCallCount = 0;
vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => mockQueryResult),
  useMutation: vi.fn(() => {
    // First call is login, second is logout (based on order in useAuth.tsx)
    mutationCallCount++;
    if (mutationCallCount % 2 === 0) {
      return mockLogoutMutation;
    }
    return mockLoginMutation;
  }),
}));

// Helper component to display auth state for testing
function AuthStateDisplay() {
  const { user, isLoading, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? "loading" : "ready"}</div>
      <div data-testid="user">{user ? user.username : "no-user"}</div>
      <div data-testid="role">{user ? user.role : "no-role"}</div>
      <button onClick={() => login("testuser", "password123")}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
}

// Helper component for testing protected routes
function ProtectedContent() {
  return <div data-testid="protected-content">Protected Page</div>;
}

function LoginPage() {
  return <div data-testid="login-page">Login Page</div>;
}

function Dashboard() {
  return <div data-testid="dashboard">Dashboard</div>;
}

function AdminDashboard() {
  return <div data-testid="admin-dashboard">Admin Dashboard</div>;
}

describe("AuthProvider and useAuth hook", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset mock state
    mockQueryResult = undefined;
    mockLoginMutation = vi.fn();
    mockLogoutMutation = vi.fn();
    mutationCallCount = 0;
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ============ LOGIN FLOW TESTS ============
  describe("Login flow", () => {
    it("stores token in localStorage on successful login", async () => {
      const user = userEvent.setup();
      // Mock successful login
      mockLoginMutation.mockResolvedValue({ success: true, token: "new-session-token" });

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      // Click login button
      await user.click(screen.getByRole("button", { name: /login/i }));

      // Token should be stored
      await waitFor(() => {
        expect(localStorage.getItem(TOKEN_KEY)).toBe("new-session-token");
      });
    });

    it("does not store token when login fails", async () => {
      const user = userEvent.setup();
      // Mock failed login
      mockLoginMutation.mockResolvedValue({ success: false });

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      await user.click(screen.getByRole("button", { name: /login/i }));

      // Token should not be stored
      await waitFor(() => {
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      });
    });

    it("does not store token when login throws error", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Mock login throwing an error
      mockLoginMutation.mockRejectedValue(new Error("Network error"));

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      await user.click(screen.getByRole("button", { name: /login/i }));

      // Token should not be stored
      await waitFor(() => {
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      });

      consoleSpy.mockRestore();
    });
  });

  // ============ LOGOUT FLOW TESTS ============
  describe("Logout flow", () => {
    it("removes token from localStorage on logout", async () => {
      const user = userEvent.setup();
      // Start with a token in localStorage
      localStorage.setItem(TOKEN_KEY, "existing-token");
      mockQueryResult = mockStudentUser;
      mockLogoutMutation.mockResolvedValue(undefined);

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      // Verify user is logged in
      expect(screen.getByTestId("user")).toHaveTextContent("teststudent");

      // Click logout button
      await user.click(screen.getByRole("button", { name: /logout/i }));

      // Token should be removed
      await waitFor(() => {
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      });
    });

    it("removes token even when logout mutation fails", async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      localStorage.setItem(TOKEN_KEY, "existing-token");
      mockQueryResult = mockStudentUser;
      mockLogoutMutation.mockRejectedValue(new Error("Server error"));

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      await user.click(screen.getByRole("button", { name: /logout/i }));

      // Token should still be removed (finally block runs)
      await waitFor(() => {
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      });

      consoleSpy.mockRestore();
    });
  });

  // ============ SESSION PERSISTENCE TESTS ============
  describe("Session persistence", () => {
    it("initializes token from localStorage on mount and displays user", () => {
      // Set token before rendering
      localStorage.setItem(TOKEN_KEY, "persisted-token");
      mockQueryResult = mockStudentUser;

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      // User should be loaded from the persisted session
      expect(screen.getByTestId("user")).toHaveTextContent("teststudent");
      expect(screen.getByTestId("role")).toHaveTextContent("student");
    });

    it("shows loading state while session is being verified", () => {
      localStorage.setItem(TOKEN_KEY, "persisted-token");
      // Query returns undefined = loading
      mockQueryResult = undefined;

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      // Should show loading while token exists but query result is undefined
      expect(screen.getByTestId("loading")).toHaveTextContent("loading");
    });

    it("shows ready state when no token exists", () => {
      // No token in localStorage
      mockQueryResult = undefined;

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      // Should show ready (not loading) when there's no token
      expect(screen.getByTestId("loading")).toHaveTextContent("ready");
      expect(screen.getByTestId("user")).toHaveTextContent("no-user");
    });

    it("clears invalid session token when query returns null", async () => {
      // Set token in localStorage
      localStorage.setItem(TOKEN_KEY, "invalid-token");
      // Query returns null = session invalid/expired
      mockQueryResult = null;

      render(
        <AuthProvider>
          <AuthStateDisplay />
        </AuthProvider>
      );

      // The auth provider should clear the invalid token via useEffect
      await waitFor(() => {
        expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      });
    });
  });

  // ============ ERROR HANDLING TESTS ============
  describe("Error handling", () => {
    it("throws error when useAuth is used outside AuthProvider", () => {
      // Suppress console.error for this test since we expect an error
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<AuthStateDisplay />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });
});

// ============ PROTECTED ROUTE TESTS ============
describe("ProtectedRoute component", () => {
  beforeEach(() => {
    localStorage.clear();
    mockQueryResult = undefined;
    mockLoginMutation = vi.fn();
    mockLogoutMutation = vi.fn();
    mutationCallCount = 0;
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("redirects to login when not authenticated", async () => {
    // No token, query returns null (not authenticated)
    mockQueryResult = null;

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Should redirect to login page
    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    // Protected content should not be visible
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  it("renders protected content when authenticated", async () => {
    localStorage.setItem(TOKEN_KEY, "valid-token");
    mockQueryResult = mockStudentUser;

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Protected content should be visible
    await waitFor(() => {
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });
  });

  it("redirects students without admin role to dashboard", async () => {
    localStorage.setItem(TOKEN_KEY, "valid-token");
    mockQueryResult = mockStudentUser; // Student trying to access admin route

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Student should be redirected to their dashboard, not admin
    await waitFor(() => {
      expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("admin-dashboard")).not.toBeInTheDocument();
  });

  it("allows admins to access admin-only routes", async () => {
    localStorage.setItem(TOKEN_KEY, "admin-token");
    mockQueryResult = mockAdminUser;

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <AuthProvider>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Admin should see admin dashboard
    await waitFor(() => {
      expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
    });
  });

  it("shows loading spinner while checking authentication", () => {
    localStorage.setItem(TOKEN_KEY, "some-token");
    // Query is still loading (returns undefined)
    mockQueryResult = undefined;

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/protected"
              element={
                <ProtectedRoute>
                  <ProtectedContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Neither login nor protected content should show during loading
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });
});

// ============ PUBLIC ONLY ROUTE TESTS ============
describe("PublicOnlyRoute component", () => {
  beforeEach(() => {
    localStorage.clear();
    mockQueryResult = undefined;
    mockLoginMutation = vi.fn();
    mockLogoutMutation = vi.fn();
    mutationCallCount = 0;
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders login page for unauthenticated users", async () => {
    mockQueryResult = null;

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Login page should be visible
    await waitFor(() => {
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });
  });

  it("redirects authenticated students to dashboard", async () => {
    localStorage.setItem(TOKEN_KEY, "valid-token");
    mockQueryResult = mockStudentUser;

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Student should be redirected to dashboard
    await waitFor(() => {
      expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });

  it("redirects authenticated admins to admin dashboard", async () => {
    localStorage.setItem(TOKEN_KEY, "admin-token");
    mockQueryResult = mockAdminUser;

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Admin should be redirected to admin dashboard
    await waitFor(() => {
      expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
  });

  it("shows loading spinner while checking authentication", () => {
    localStorage.setItem(TOKEN_KEY, "some-token");
    // Query is still loading
    mockQueryResult = undefined;

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Login page should not show during loading
    expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
  });
});
