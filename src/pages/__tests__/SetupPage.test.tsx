/**
 * Tests for SetupPage component.
 *
 * The SetupPage guides first-time setup through 3 steps:
 * - Step 1: Create admin account (validates displayName, password length, password match)
 * - Step 2: Seed starter data (or skip)
 * - Step 3: Complete - shows success and link to login
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Track navigate calls
const mockNavigate = vi.fn();

// Track mutation calls
const mockInitializeAdmin = vi.fn();
const mockSeedAll = vi.fn();

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((mutationName: string) => {
    if (mutationName === "auth.initializeAdmin") return mockInitializeAdmin;
    if (mutationName === "seed.seedAll") return mockSeedAll;
    return vi.fn();
  }),
}));

// Mock the API
vi.mock("../../../convex/_generated/api", () => ({
  api: {
    auth: {
      initializeAdmin: "auth.initializeAdmin",
    },
    seed: {
      seedAll: "seed.seedAll",
    },
  },
}));

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Mock framer-motion
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

// Mock paper components
vi.mock("../../components/paper", () => ({
  Button: ({
    children,
    onClick,
    type,
    disabled,
    isLoading,
    ...props
  }: any) => (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Loading..." : children}
    </button>
  ),
  Input: ({
    label,
    value,
    onChange,
    type,
    placeholder,
    disabled,
    ...props
  }: any) => (
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
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

// Import after mocking
import { SetupPage } from "../SetupPage";
import { useMutation } from "convex/react";

describe("SetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: mutations succeed
    mockInitializeAdmin.mockResolvedValue({ success: true });
    mockSeedAll.mockResolvedValue({});

    // Reset useMutation mock to return correct functions
    (useMutation as any).mockImplementation((mutationName: string) => {
      if (mutationName === "auth.initializeAdmin") return mockInitializeAdmin;
      if (mutationName === "seed.seedAll") return mockSeedAll;
      return vi.fn();
    });
  });

  describe("Step 1 - Create Admin", () => {
    it("renders the 'Welcome, Coach!' heading on step 1", () => {
      render(<SetupPage />);
      expect(screen.getByText(/welcome, coach!/i)).toBeInTheDocument();
    });

    it("renders all form inputs for admin creation", () => {
      render(<SetupPage />);
      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    describe("Validation", () => {
      it("shows error when displayName is empty", async () => {
        const user = userEvent.setup();
        render(<SetupPage />);

        // Fill other fields but not displayName
        const usernameInput = screen.getByLabelText(/^username$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(usernameInput, "admin");
        await user.type(passwordInput, "password123");
        await user.type(confirmPasswordInput, "password123");

        const submitButton = screen.getByRole("button", {
          name: /create my account/i,
        });
        await user.click(submitButton);

        expect(screen.getByText(/please enter your name/i)).toBeInTheDocument();
        expect(mockInitializeAdmin).not.toHaveBeenCalled();
      });

      it("shows error when username is empty", async () => {
        const user = userEvent.setup();
        render(<SetupPage />);

        const displayNameInput = screen.getByLabelText(/your name/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(displayNameInput, "Coach Vishwa");
        await user.type(passwordInput, "password123");
        await user.type(confirmPasswordInput, "password123");

        const submitButton = screen.getByRole("button", {
          name: /create my account/i,
        });
        await user.click(submitButton);

        expect(screen.getByText(/please enter a username/i)).toBeInTheDocument();
        expect(mockInitializeAdmin).not.toHaveBeenCalled();
      });

      it("shows error when password is less than 6 characters", async () => {
        const user = userEvent.setup();
        render(<SetupPage />);

        const displayNameInput = screen.getByLabelText(/your name/i);
        const usernameInput = screen.getByLabelText(/^username$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(displayNameInput, "Coach Vishwa");
        await user.type(usernameInput, "admin");
        await user.type(passwordInput, "12345"); // Only 5 characters
        await user.type(confirmPasswordInput, "12345");

        const submitButton = screen.getByRole("button", {
          name: /create my account/i,
        });
        await user.click(submitButton);

        expect(
          screen.getByText(/password must be at least 6 characters/i)
        ).toBeInTheDocument();
        expect(mockInitializeAdmin).not.toHaveBeenCalled();
      });

      it("shows error when passwords do not match", async () => {
        const user = userEvent.setup();
        render(<SetupPage />);

        const displayNameInput = screen.getByLabelText(/your name/i);
        const usernameInput = screen.getByLabelText(/^username$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(displayNameInput, "Coach Vishwa");
        await user.type(usernameInput, "admin");
        await user.type(passwordInput, "password123");
        await user.type(confirmPasswordInput, "differentpassword");

        const submitButton = screen.getByRole("button", {
          name: /create my account/i,
        });
        await user.click(submitButton);

        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
        expect(mockInitializeAdmin).not.toHaveBeenCalled();
      });
    });

    describe("Successful admin creation", () => {
      it("calls initializeAdmin with correct arguments", async () => {
        const user = userEvent.setup();
        render(<SetupPage />);

        const displayNameInput = screen.getByLabelText(/your name/i);
        const usernameInput = screen.getByLabelText(/^username$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(displayNameInput, "Coach Vishwa");
        await user.type(usernameInput, "admin");
        await user.type(passwordInput, "password123");
        await user.type(confirmPasswordInput, "password123");

        const submitButton = screen.getByRole("button", {
          name: /create my account/i,
        });
        await user.click(submitButton);

        await waitFor(() => {
          expect(mockInitializeAdmin).toHaveBeenCalledWith({
            username: "admin",
            password: "password123",
            displayName: "Coach Vishwa",
          });
        });
      });

      it("transitions to step 2 after successful admin creation", async () => {
        const user = userEvent.setup();
        mockInitializeAdmin.mockResolvedValue({ success: true });

        render(<SetupPage />);

        const displayNameInput = screen.getByLabelText(/your name/i);
        const usernameInput = screen.getByLabelText(/^username$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(displayNameInput, "Coach Vishwa");
        await user.type(usernameInput, "admin");
        await user.type(passwordInput, "password123");
        await user.type(confirmPasswordInput, "password123");

        const submitButton = screen.getByRole("button", {
          name: /create my account/i,
        });
        await user.click(submitButton);

        // Step 2 should be visible
        await waitFor(() => {
          expect(screen.getByText(/account created!/i)).toBeInTheDocument();
        });
      });
    });

    describe("Failed admin creation", () => {
      it("shows error message when initializeAdmin returns success: false", async () => {
        const user = userEvent.setup();
        mockInitializeAdmin.mockResolvedValue({
          success: false,
          error: "Username already exists",
        });

        render(<SetupPage />);

        const displayNameInput = screen.getByLabelText(/your name/i);
        const usernameInput = screen.getByLabelText(/^username$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(displayNameInput, "Coach Vishwa");
        await user.type(usernameInput, "admin");
        await user.type(passwordInput, "password123");
        await user.type(confirmPasswordInput, "password123");

        const submitButton = screen.getByRole("button", {
          name: /create my account/i,
        });
        await user.click(submitButton);

        await waitFor(() => {
          expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
        });

        // Should still be on step 1
        expect(screen.getByText(/welcome, coach!/i)).toBeInTheDocument();
      });

      it("shows generic error when initializeAdmin returns success: false without error message", async () => {
        const user = userEvent.setup();
        mockInitializeAdmin.mockResolvedValue({ success: false });

        render(<SetupPage />);

        const displayNameInput = screen.getByLabelText(/your name/i);
        const usernameInput = screen.getByLabelText(/^username$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(displayNameInput, "Coach Vishwa");
        await user.type(usernameInput, "admin");
        await user.type(passwordInput, "password123");
        await user.type(confirmPasswordInput, "password123");

        const submitButton = screen.getByRole("button", {
          name: /create my account/i,
        });
        await user.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText(/failed to create admin account/i)
          ).toBeInTheDocument();
        });
      });

      it("shows error message when initializeAdmin throws", async () => {
        const user = userEvent.setup();
        mockInitializeAdmin.mockRejectedValue(new Error("Network error"));

        render(<SetupPage />);

        const displayNameInput = screen.getByLabelText(/your name/i);
        const usernameInput = screen.getByLabelText(/^username$/i);
        const passwordInput = screen.getByLabelText(/^password$/i);
        const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

        await user.type(displayNameInput, "Coach Vishwa");
        await user.type(usernameInput, "admin");
        await user.type(passwordInput, "password123");
        await user.type(confirmPasswordInput, "password123");

        const submitButton = screen.getByRole("button", {
          name: /create my account/i,
        });
        await user.click(submitButton);

        await waitFor(() => {
          expect(
            screen.getByText(/something went wrong\. please try again\./i)
          ).toBeInTheDocument();
        });
      });
    });
  });

  describe("Step 2 - Seed Data", () => {
    // Helper to get to step 2
    const goToStep2 = async () => {
      const user = userEvent.setup();
      mockInitializeAdmin.mockResolvedValue({ success: true });

      render(<SetupPage />);

      const displayNameInput = screen.getByLabelText(/your name/i);
      const usernameInput = screen.getByLabelText(/^username$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(displayNameInput, "Coach Vishwa");
      await user.type(usernameInput, "admin");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", {
        name: /create my account/i,
      });
      await user.click(submitButton);

      // Wait for step 2
      await waitFor(() => {
        expect(screen.getByText(/account created!/i)).toBeInTheDocument();
      });

      return user;
    };

    it("shows 'Account Created!' heading on step 2", async () => {
      await goToStep2();
      expect(screen.getByText(/account created!/i)).toBeInTheDocument();
    });

    it("shows 'Add Starter Content' button on step 2", async () => {
      await goToStep2();
      expect(
        screen.getByRole("button", { name: /add starter content/i })
      ).toBeInTheDocument();
    });

    it("shows 'Skip for now' button on step 2", async () => {
      await goToStep2();
      expect(
        screen.getByRole("button", { name: /skip for now/i })
      ).toBeInTheDocument();
    });

    describe("Seeding success", () => {
      it("calls seedAll when 'Add Starter Content' is clicked", async () => {
        const user = await goToStep2();

        const seedButton = screen.getByRole("button", {
          name: /add starter content/i,
        });
        await user.click(seedButton);

        await waitFor(() => {
          expect(mockSeedAll).toHaveBeenCalledWith({});
        });
      });

      it("transitions to step 3 after successful seeding", async () => {
        const user = await goToStep2();
        mockSeedAll.mockResolvedValue({});

        const seedButton = screen.getByRole("button", {
          name: /add starter content/i,
        });
        await user.click(seedButton);

        await waitFor(() => {
          expect(screen.getByText(/all set!/i)).toBeInTheDocument();
        });
      });
    });

    describe("Seeding failure", () => {
      it("shows error message when seedAll throws", async () => {
        const user = await goToStep2();
        mockSeedAll.mockRejectedValue(new Error("Seed failed"));

        const seedButton = screen.getByRole("button", {
          name: /add starter content/i,
        });
        await user.click(seedButton);

        await waitFor(() => {
          expect(
            screen.getByText(/failed to seed data\. please try again\./i)
          ).toBeInTheDocument();
        });

        // Should still be on step 2 (allows retry)
        expect(screen.getByText(/account created!/i)).toBeInTheDocument();
      });

      it("allows retry after seed failure", async () => {
        const user = await goToStep2();
        // First call fails
        mockSeedAll.mockRejectedValueOnce(new Error("Seed failed"));
        // Second call succeeds
        mockSeedAll.mockResolvedValueOnce({});

        const seedButton = screen.getByRole("button", {
          name: /add starter content/i,
        });

        // First attempt fails
        await user.click(seedButton);
        await waitFor(() => {
          expect(
            screen.getByText(/failed to seed data\. please try again\./i)
          ).toBeInTheDocument();
        });

        // Retry - should work
        await user.click(seedButton);
        await waitFor(() => {
          expect(screen.getByText(/all set!/i)).toBeInTheDocument();
        });
      });
    });

    describe("Skip for now", () => {
      it("transitions to step 3 when 'Skip for now' is clicked", async () => {
        const user = await goToStep2();

        const skipButton = screen.getByRole("button", { name: /skip for now/i });
        await user.click(skipButton);

        await waitFor(() => {
          expect(screen.getByText(/all set!/i)).toBeInTheDocument();
        });

        // seedAll should not have been called
        expect(mockSeedAll).not.toHaveBeenCalled();
      });
    });
  });

  describe("Step 3 - Complete", () => {
    // Helper to get to step 3
    const goToStep3 = async () => {
      const user = userEvent.setup();
      mockInitializeAdmin.mockResolvedValue({ success: true });

      render(<SetupPage />);

      // Complete step 1
      const displayNameInput = screen.getByLabelText(/your name/i);
      const usernameInput = screen.getByLabelText(/^username$/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(displayNameInput, "Coach Vishwa");
      await user.type(usernameInput, "admin");
      await user.type(passwordInput, "password123");
      await user.type(confirmPasswordInput, "password123");

      const submitButton = screen.getByRole("button", {
        name: /create my account/i,
      });
      await user.click(submitButton);

      // Wait for step 2
      await waitFor(() => {
        expect(screen.getByText(/account created!/i)).toBeInTheDocument();
      });

      // Skip to step 3
      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      await user.click(skipButton);

      await waitFor(() => {
        expect(screen.getByText(/all set!/i)).toBeInTheDocument();
      });

      return user;
    };

    it("shows 'All Set!' heading on step 3", async () => {
      await goToStep3();
      expect(screen.getByText(/all set!/i)).toBeInTheDocument();
    });

    it("shows 'Go to Login' button on step 3", async () => {
      await goToStep3();
      expect(
        screen.getByRole("button", { name: /go to login/i })
      ).toBeInTheDocument();
    });

    it("navigates to /login when 'Go to Login' is clicked", async () => {
      const user = await goToStep3();

      const loginButton = screen.getByRole("button", { name: /go to login/i });
      await user.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("shows next steps guidance", async () => {
      await goToStep3();
      expect(screen.getByText(/next steps:/i)).toBeInTheDocument();
      expect(screen.getByText(/log in with your new account/i)).toBeInTheDocument();
    });
  });

  describe("Progress indicator", () => {
    it("shows 3 progress dots", () => {
      render(<SetupPage />);
      // There should be 3 progress indicator dots
      const progressDots = document.querySelectorAll(".rounded-full.w-2.h-2");
      expect(progressDots).toHaveLength(3);
    });
  });
});
