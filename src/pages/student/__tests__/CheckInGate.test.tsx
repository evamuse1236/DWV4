/**
 * Tests for CheckInGate component.
 *
 * The CheckInGate wraps the student dashboard and enforces that students
 * complete an emotional check-in before accessing the main app.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock convex/react
vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
}));

// Mock the API
vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    emotions: {
      saveCheckIn: "emotions.saveCheckIn",
      getTodayCheckIn: "emotions.getTodayCheckIn",
      getCategories: "emotions.getCategories",
    },
  },
}));

// Mock dependencies
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

vi.mock("../../../hooks/useDelayedLoading", () => ({
  useDelayedLoading: vi.fn((isLoading: boolean) => isLoading),
}));

// Mock framer-motion - filter out animation-specific props to avoid React warnings
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, onClick, className, style, layout, layoutId, whileHover, whileTap, initial, animate, exit, variants, transition, ...props }: any) => (
      <div onClick={onClick} className={className} style={style} {...props}>
        {children}
      </div>
    ),
    button: ({
      children,
      onClick,
      className,
      layout,
      layoutId,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      variants,
      transition,
      ...props
    }: any) => (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    ),
    textarea: ({
      className,
      placeholder,
      value,
      onChange,
      layout,
      layoutId,
      whileHover,
      whileTap,
      initial,
      animate,
      exit,
      variants,
      transition,
      ...props
    }: any) => (
      <textarea
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        {...props}
      />
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock phosphor icons
vi.mock("@phosphor-icons/react", () => ({
  Sun: ({ className }: any) => <span className={className}>Sun</span>,
  Plant: ({ className }: any) => <span className={className}>Plant</span>,
  Drop: ({ className }: any) => <span className={className}>Drop</span>,
  CloudRain: ({ className }: any) => <span className={className}>CloudRain</span>,
}));

// Import after mocking
import { CheckInGate } from "../../../components/layout/CheckInGate";
import { useQuery, useMutation } from "convex/react";
import { useDelayedLoading } from "../../../hooks/useDelayedLoading";

// Mock data
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

const mockTodayCheckIn = {
  _id: "checkin_1",
  userId: "user_123",
  categoryId: "cat_1",
  subcategoryId: "sub_1",
  journalEntry: "Feeling great today!",
  createdAt: Date.now(),
};

// Test child component
function MockDashboard() {
  return <div data-testid="dashboard">Dashboard Content</div>;
}

describe("CheckInGate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading state", () => {
    beforeEach(() => {
      // Return undefined for loading state
      (useQuery as any).mockReturnValue(undefined);
    });

    it("shows skeleton when data is loading and delay threshold passed", () => {
      (useDelayedLoading as any).mockReturnValue(true);

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      // Should show skeleton container
      const container = document.querySelector(".min-h-screen");
      expect(container).toBeInTheDocument();
    });

    it("renders nothing when data is loading but under threshold", () => {
      (useDelayedLoading as any).mockReturnValue(false);

      const { container } = render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Already checked in", () => {
    beforeEach(() => {
      // Use query name matching for reliability across re-renders
      (useQuery as any).mockImplementation((query: any) => {
        if (query === "emotions.getCategories") return mockEmotionCategories;
        if (query === "emotions.getTodayCheckIn") return mockTodayCheckIn;
        return undefined;
      });
      (useDelayedLoading as any).mockReturnValue(false);
    });

    it("renders children when user has already checked in today", () => {
      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      expect(screen.getByTestId("dashboard")).toBeInTheDocument();
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });

    it("does not show check-in UI when already checked in", () => {
      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      expect(screen.queryByText(/palette of presence/i)).not.toBeInTheDocument();
    });
  });

  describe("Check-in required", () => {
    beforeEach(() => {
      // Use query name matching for reliability across re-renders
      (useQuery as any).mockImplementation((query: any, args: any) => {
        if (args === "skip") return undefined;
        if (query === "emotions.getCategories") return mockEmotionCategories;
        if (query === "emotions.getTodayCheckIn") return null; // Not checked in
        return undefined;
      });
      (useDelayedLoading as any).mockReturnValue(false);
    });

    it("shows 'Palette of Presence' title", () => {
      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      expect(screen.getByText(/the palette of presence/i)).toBeInTheDocument();
    });

    it("shows 'Reflecting' subtitle", () => {
      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      expect(screen.getByText(/reflecting/i)).toBeInTheDocument();
    });

    it("displays 4 mood quadrant cards", () => {
      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      const quadrantCards = document.querySelectorAll(".mood-card");
      expect(quadrantCards.length).toBe(4);
    });

    it("does not render children when check-in is required", () => {
      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      expect(screen.queryByTestId("dashboard")).not.toBeInTheDocument();
    });

    it("shows emotion shades when clicking a quadrant", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      // Click on first quadrant (Good + High Energy)
      const quadrantCards = document.querySelectorAll(".mood-card");
      await user.click(quadrantCards[0]);

      // Should show shades from the internal shadesData
      await waitFor(() => {
        expect(screen.getByText(/excited/i)).toBeInTheDocument();
      });
    });

    it("shows sleepy in bad + low energy options", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      const quadrantCards = document.querySelectorAll(".mood-card");
      await user.click(quadrantCards[2]);

      await waitFor(() => {
        expect(screen.getByText(/sleepy/i)).toBeInTheDocument();
      });
    });

    it("shows back button when quadrant is expanded", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      const quadrantCards = document.querySelectorAll(".mood-card");
      await user.click(quadrantCards[0]);

      await waitFor(() => {
        const backButton = screen.getByRole("button", { name: /go back/i });
        expect(backButton).toBeInTheDocument();
      });
    });

    it("shows PROCEED button after selecting an emotion", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

      const quadrantCards = document.querySelectorAll(".mood-card");
      await user.click(quadrantCards[0]);

      await waitFor(() => {
        expect(screen.getByText(/excited/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/excited/i));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /proceed/i })).toBeInTheDocument();
      });
    });

    it("shows journal entry screen after clicking proceed", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

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
        expect(screen.getByPlaceholderText(/why do you feel this way/i)).toBeInTheDocument();
      });
    });

    it("shows CONTINUE and START OVER buttons on journal screen", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

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
        expect(screen.getByRole("button", { name: /start over/i })).toBeInTheDocument();
      });
    });

    it("allows entering optional journal text", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

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

      const textarea = await screen.findByPlaceholderText(/why do you feel this way/i);
      await user.type(textarea, "I had a great morning!");

      expect(textarea).toHaveValue("I had a great morning!");
    });
  });

  describe("Save functionality", () => {
    let mockSave: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockSave = vi.fn().mockResolvedValue({});
      (useMutation as any).mockReturnValue(mockSave);

      (useQuery as any).mockImplementation((query: any, args: any) => {
        if (args === "skip") return undefined;
        if (query === "emotions.getCategories") return mockEmotionCategories;
        if (query === "emotions.getTodayCheckIn") return null;
        return undefined;
      });
      (useDelayedLoading as any).mockReturnValue(false);
    });

    it("calls saveCheckIn when clicking CONTINUE", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

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

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalled();
      });
    });
  });

  describe("Reset functionality", () => {
    beforeEach(() => {
      (useQuery as any).mockImplementation((query: any, args: any) => {
        if (args === "skip") return undefined;
        if (query === "emotions.getCategories") return mockEmotionCategories;
        if (query === "emotions.getTodayCheckIn") return null;
        return undefined;
      });
      (useDelayedLoading as any).mockReturnValue(false);
    });

    it("resets state when clicking START OVER", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

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
        expect(screen.getByRole("button", { name: /start over/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole("button", { name: /start over/i }));

      await waitFor(() => {
        expect(screen.getByText(/palette of presence/i)).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/why do you feel this way/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      // Make save fail
      const failingSave = vi.fn().mockRejectedValue(new Error("Save failed"));
      (useMutation as any).mockReturnValue(failingSave);

      (useQuery as any).mockImplementation((query: any, args: any) => {
        if (args === "skip") return undefined;
        if (query === "emotions.getCategories") return mockEmotionCategories;
        if (query === "emotions.getTodayCheckIn") return null;
        return undefined;
      });
      (useDelayedLoading as any).mockReturnValue(false);
    });

    it("shows error message when save fails", async () => {
      const user = userEvent.setup();

      render(
        <CheckInGate>
          <MockDashboard />
        </CheckInGate>
      );

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

      await waitFor(() => {
        expect(screen.getByText(/couldn't save/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      });
    });
  });
});
