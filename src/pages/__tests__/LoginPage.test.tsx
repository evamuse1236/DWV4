/**
 * Tests for LoginPage component.
 *
 * The LoginPage:
 * - Shows a "Begin Setup" banner when system needs bootstrap (no users exist)
 * - Validates username/password inputs
 * - Disables inputs while submitting
 * - Redirects after successful login based on role and location.state.from
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Track navigate calls
const mockNavigate = vi.fn();

// Track login calls
const mockLogin = vi.fn();

// Track location state - can be modified per test
let mockLocationState: { from?: { pathname: string } } | null = null;

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
}));

// Mock the API
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    auth: {
      checkNeedsBootstrap: "auth.checkNeedsBootstrap",
    },
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({
    state: mockLocationState,
    pathname: "/login",
  }),
}));

// Mock useAuth
vi.mock("../../hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isLoading: false,
    login: mockLogin,
    logout: vi.fn(),
  })),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      variants,
      transition,
      layout,
      layoutId,
      ...props
    }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Import after mocking
import { LoginPage } from "../LoginPage";
import { useQuery } from "convex/react";
import { useAuth } from "../../hooks/useAuth";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no bootstrap needed
    (useQuery as any).mockReturnValue(false);
    // Default: login returns false (failure)
    mockLogin.mockResolvedValue(false);
    // Default: no location state
    mockLocationState = null;
  });

  describe("Begin Setup banner", () => {
    it("shows 'Begin Setup' banner when checkNeedsBootstrap returns true", () => {
      // System needs bootstrap (no users exist)
      (useQuery as any).mockReturnValue(true);

      render(<LoginPage />);

      expect(
        screen.getByText(/welcome! let's set up your first admin account/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/begin setup/i)).toBeInTheDocument();
    });

    it("does NOT show 'Begin Setup' banner when checkNeedsBootstrap returns false", () => {
      // System already has users
      (useQuery as any).mockReturnValue(false);

      render(<LoginPage />);

      expect(
        screen.queryByText(/welcome! let's set up your first admin account/i)
      ).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /begin setup/i })).not.toBeInTheDocument();
    });

    it("does NOT show 'Begin Setup' banner when checkNeedsBootstrap is loading (undefined)", () => {
      // Query still loading
      (useQuery as any).mockReturnValue(undefined);

      render(<LoginPage />);

      expect(
        screen.queryByText(/welcome! let's set up your first admin account/i)
      ).not.toBeInTheDocument();
    });

    it("navigates to /setup when 'Begin Setup' button is clicked", async () => {
      const user = userEvent.setup();
      (useQuery as any).mockReturnValue(true);

      render(<LoginPage />);

      const setupButton = screen.getByText(/begin setup/i);
      await user.click(setupButton);

      expect(mockNavigate).toHaveBeenCalledWith("/setup");
    });
  });

  describe("Validation", () => {
    it("shows error message when username is empty", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      // Submit without entering username
      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      expect(screen.getByText(/please enter your username/i)).toBeInTheDocument();
      // Login should not be called
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("shows error message when password is empty", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      // Enter username but not password
      const usernameInput = screen.getByPlaceholderText(/username/i);
      await user.type(usernameInput, "testuser");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      expect(screen.getByText(/please enter your password/i)).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("shows error message when username is only whitespace", async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      await user.type(usernameInput, "   ");
      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      expect(screen.getByText(/please enter your username/i)).toBeInTheDocument();
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe("Submitting state", () => {
    it("disables inputs while submitting", async () => {
      const user = userEvent.setup();
      // Make login hang (never resolve)
      mockLogin.mockImplementation(() => new Promise(() => {}));

      render(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(usernameInput, "testuser");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      // Inputs should be disabled while loading
      await waitFor(() => {
        expect(usernameInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
    });

    it("shows 'Logging in...' on button while submitting", async () => {
      const user = userEvent.setup();
      // Make login hang
      mockLogin.mockImplementation(() => new Promise(() => {}));

      render(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(usernameInput, "testuser");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/logging in\.\.\./i)).toBeInTheDocument();
      });
    });

    it("disables submit button while submitting", async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(() => new Promise(() => {}));

      render(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(usernameInput, "testuser");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe("Login failure", () => {
    it("shows error message when login fails", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(false);

      render(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(usernameInput, "testuser");
      await user.type(passwordInput, "wrongpassword");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/oops! wrong username or password/i)
        ).toBeInTheDocument();
      });
    });

    it("shows error message when login throws an error", async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error("Network error"));

      render(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(usernameInput, "testuser");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/something went wrong\. please try again\./i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Redirect logic", () => {
    it("redirects to /admin when admin user logs in successfully", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(true);
      // Mock user as admin
      (useAuth as any).mockReturnValue({
        user: {
          _id: "admin_123",
          username: "admin",
          displayName: "Admin User",
          role: "admin",
        },
        isLoading: false,
        login: mockLogin,
        logout: vi.fn(),
      });

      render(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(usernameInput, "admin");
      await user.type(passwordInput, "adminpass");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true });
      });
    });

    it("redirects to location.state.from when student logs in successfully", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(true);

      // Set location with state.from
      mockLocationState = { from: { pathname: "/sprint" } };

      // Mock user as student (no role or student role)
      (useAuth as any).mockReturnValue({
        user: {
          _id: "student_123",
          username: "student",
          displayName: "Student User",
          role: "student",
        },
        isLoading: false,
        login: mockLogin,
        logout: vi.fn(),
      });

      render(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(usernameInput, "student");
      await user.type(passwordInput, "studentpass");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/sprint", { replace: true });
      });
    });

    it("redirects to /dashboard when student logs in with no location.state.from", async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(true);

      // Set location without state.from (default)
      mockLocationState = null;

      // Mock user as student
      (useAuth as any).mockReturnValue({
        user: {
          _id: "student_123",
          username: "student",
          displayName: "Student User",
          role: "student",
        },
        isLoading: false,
        login: mockLogin,
        logout: vi.fn(),
      });

      render(<LoginPage />);

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      await user.type(usernameInput, "student");
      await user.type(passwordInput, "studentpass");

      const submitButton = screen.getByRole("button", { name: /login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
          replace: true,
        });
      });
    });
  });

  describe("Rendering", () => {
    it("renders the DeepWork title", () => {
      render(<LoginPage />);
      expect(screen.getByText(/deepwork/i)).toBeInTheDocument();
    });

    it("renders username and password inputs", () => {
      render(<LoginPage />);
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });

    it("renders the login button", () => {
      render(<LoginPage />);
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });
  });
});
