/**
 * Tests for Sidebar component.
 *
 * The Sidebar displays navigation items based on user role (admin vs student)
 * and highlights the active route using exact match for root paths (/admin, /dashboard)
 * and prefix match for other routes.
 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";

// Mock the useAuth hook before importing the component
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { role: "student", displayName: "Test Student", username: "test.student" },
    logout: vi.fn(),
  })),
}));

// Import after mocks are set up
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/hooks/useAuth";

// Type for the mocked useAuth
const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

/**
 * Helper to render Sidebar with a specific route
 * Uses MemoryRouter to control the current location
 */
const renderWithRouter = (
  ui: React.ReactElement,
  { route = "/" }: { route?: string } = {}
) => {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
};

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Student role navigation items", () => {
    beforeEach(() => {
      // Set up student user for these tests
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student", username: "test.student" },
        logout: vi.fn(),
      });
    });

    it("shows student navigation items when user is a student", () => {
      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      // Get the navigation element to scope our queries
      const nav = screen.getByRole("navigation");

      // Student nav items should be visible in the navigation
      expect(within(nav).getByText("Home")).toBeInTheDocument();
      expect(within(nav).getByText("Sprint")).toBeInTheDocument();
      expect(within(nav).getByText("DeepWork")).toBeInTheDocument();
      expect(within(nav).getByText("Library")).toBeInTheDocument();
      expect(within(nav).queryByText("Character")).not.toBeInTheDocument();
      expect(within(nav).getByText("Trust Jar")).toBeInTheDocument();
    });

    it("does not show admin navigation items for student users", () => {
      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      // Admin-only items should NOT be visible
      expect(screen.queryByText("Students")).not.toBeInTheDocument();
      expect(screen.queryByText("Sprints")).not.toBeInTheDocument();
      expect(screen.queryByText("Objectives")).not.toBeInTheDocument();
      expect(screen.queryByText("Viva Queue")).not.toBeInTheDocument();
      expect(screen.queryByText("Presentations")).not.toBeInTheDocument();
      expect(screen.queryByText("Books")).not.toBeInTheDocument();
      expect(screen.queryByText("Norms")).not.toBeInTheDocument();
    });

    it("displays student username and display name", () => {
      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      expect(screen.getByText("Test Student")).toBeInTheDocument();
      expect(screen.getByText("@test.student")).toBeInTheDocument();
    });

    it("displays avatar with first letter of display name", () => {
      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      // Look for the avatar div containing "T" (first letter of "Test Student")
      expect(screen.getByText("T")).toBeInTheDocument();
    });
  });

  describe("Admin role navigation items", () => {
    beforeEach(() => {
      // Set up admin user for these tests
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User", username: "admin.user" },
        logout: vi.fn(),
      });
    });

    it("shows admin navigation items when user is an admin", () => {
      renderWithRouter(<Sidebar />, { route: "/admin" });

      // Admin nav items should be visible
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Students")).toBeInTheDocument();
      expect(screen.getByText("Norms")).toBeInTheDocument();
      expect(screen.getByText("Sprints")).toBeInTheDocument();
      expect(screen.getByText("Objectives")).toBeInTheDocument();
      expect(screen.getByText("Viva Queue")).toBeInTheDocument();
      expect(screen.getByText("Presentations")).toBeInTheDocument();
      expect(screen.getByText("Books")).toBeInTheDocument();
      expect(screen.getByText("Trust Jar")).toBeInTheDocument();
    });

    it("does not show student-specific navigation items for admin users", () => {
      renderWithRouter(<Sidebar />, { route: "/admin" });

      // Get the navigation element to scope our queries
      const nav = screen.getByRole("navigation");

      // Student-only items (Home, DeepWork, Library) should NOT be visible in nav
      // Note: Dashboard exists for both, but with different paths
      expect(within(nav).queryByText("Home")).not.toBeInTheDocument();
      // DeepWork appears in logo too, so we check nav specifically
      expect(within(nav).queryByText("DeepWork")).not.toBeInTheDocument();
      expect(within(nav).queryByText("Library")).not.toBeInTheDocument();
    });

    it("displays admin username and display name", () => {
      renderWithRouter(<Sidebar />, { route: "/admin" });

      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("@admin.user")).toBeInTheDocument();
    });
  });

  describe("Exact match highlighting (root paths)", () => {
    it("/dashboard highlights only Dashboard for student, not other items", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      // Home (Dashboard) link should have active class
      const homeLink = screen.getByRole("link", { name: /home/i });
      expect(homeLink).toHaveClass("active");

      // Other links should NOT have active class
      const sprintLink = screen.getByRole("link", { name: /sprint/i });
      const deepWorkLink = screen.getByRole("link", { name: /deepwork/i });
      const libraryLink = screen.getByRole("link", { name: /library/i });
      const trustJarLink = screen.getByRole("link", { name: /trust jar/i });

      expect(sprintLink).not.toHaveClass("active");
      expect(deepWorkLink).not.toHaveClass("active");
      expect(libraryLink).not.toHaveClass("active");
      expect(trustJarLink).not.toHaveClass("active");
    });

    it("/admin highlights only Dashboard for admin, not other items", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/admin" });

      // Dashboard link should have active class
      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      expect(dashboardLink).toHaveClass("active");

      // Other links should NOT have active class
      const studentsLink = screen.getByRole("link", { name: /students/i });
      const sprintsLink = screen.getByRole("link", { name: /sprints/i });
      const objectivesLink = screen.getByRole("link", { name: /objectives/i });

      expect(studentsLink).not.toHaveClass("active");
      expect(sprintsLink).not.toHaveClass("active");
      expect(objectivesLink).not.toHaveClass("active");
    });

    it("/dashboards does NOT highlight Home because path must start with /dashboard", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      // A different route that doesn't match /dashboard exactly
      renderWithRouter(<Sidebar />, { route: "/dashboards" });

      const homeLink = screen.getByRole("link", { name: /home/i });
      // Should NOT be active because /dashboard requires exact match
      expect(homeLink).not.toHaveClass("active");
    });

    it("/admins does NOT highlight admin Dashboard because path must match /admin exactly", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: vi.fn(),
      });

      // A different route that starts with /admin but has more characters
      renderWithRouter(<Sidebar />, { route: "/admins" });

      const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
      // Should NOT be active because /admin requires exact match
      expect(dashboardLink).not.toHaveClass("active");
    });
  });

  describe("Prefix match highlighting (non-root paths)", () => {
    it("/admin/students highlights Students link", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/admin/students" });

      const studentsLink = screen.getByRole("link", { name: /students/i });
      expect(studentsLink).toHaveClass("active");
    });

    it("/admin/students/123 also highlights Students link (prefix match)", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: vi.fn(),
      });

      // Sub-route should still match via prefix
      renderWithRouter(<Sidebar />, { route: "/admin/students/123" });

      const studentsLink = screen.getByRole("link", { name: /students/i });
      expect(studentsLink).toHaveClass("active");
    });

    it("/admin/students/123/edit also highlights Students link (deep prefix match)", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/admin/students/123/edit" });

      const studentsLink = screen.getByRole("link", { name: /students/i });
      expect(studentsLink).toHaveClass("active");
    });

    it("/sprint highlights Sprint link for student", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/sprint" });

      const sprintLink = screen.getByRole("link", { name: /sprint/i });
      expect(sprintLink).toHaveClass("active");
    });

    it("/sprint/goals highlights Sprint link (prefix match)", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/sprint/goals" });

      const sprintLink = screen.getByRole("link", { name: /sprint/i });
      expect(sprintLink).toHaveClass("active");
    });

    it("/deep-work highlights DeepWork link for student", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/deep-work" });

      const deepWorkLink = screen.getByRole("link", { name: /deepwork/i });
      expect(deepWorkLink).toHaveClass("active");
    });

    it("/deep-work/domain-123 highlights DeepWork link (prefix match)", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/deep-work/domain-123" });

      const deepWorkLink = screen.getByRole("link", { name: /deepwork/i });
      expect(deepWorkLink).toHaveClass("active");
    });

    it("/reading highlights Library link for student", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/reading" });

      const libraryLink = screen.getByRole("link", { name: /library/i });
      expect(libraryLink).toHaveClass("active");
    });

    it("/admin/objectives highlights Objectives link", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/admin/objectives" });

      const objectivesLink = screen.getByRole("link", { name: /objectives/i });
      expect(objectivesLink).toHaveClass("active");
    });

    it("/admin/viva highlights Viva Queue link", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/admin/viva" });

      const vivaLink = screen.getByRole("link", { name: /viva queue/i });
      expect(vivaLink).toHaveClass("active");
    });
  });

  describe("Only one route is active at a time", () => {
    it("only one navigation item is active for student routes", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/sprint" });

      // Get all nav links
      const allLinks = screen.getAllByRole("link");
      const activeLinks = allLinks.filter((link) =>
        link.classList.contains("active")
      );

      // Only Sprint should be active
      expect(activeLinks).toHaveLength(1);
      expect(activeLinks[0]).toHaveTextContent(/sprint/i);
    });

    it("correct navigation item is active for admin routes", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: vi.fn(),
      });

      // Use /admin/objectives
      renderWithRouter(<Sidebar />, { route: "/admin/objectives" });

      // Get nav links from within the navigation element only
      const nav = screen.getByRole("navigation");
      const objectivesLink = within(nav).getByRole("link", {
        name: /objectives/i,
      });

      // The target link should be active
      expect(objectivesLink).toHaveClass("active");
    });

    it("no routes are active for unrecognized path", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/unknown-route" });

      // Get all nav links
      const allLinks = screen.getAllByRole("link");
      const activeLinks = allLinks.filter((link) =>
        link.classList.contains("active")
      );

      // No links should be active
      expect(activeLinks).toHaveLength(0);
    });

    it("different routes activate different navigation items", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: vi.fn(),
      });

      // First render at /admin/students
      const { unmount } = renderWithRouter(<Sidebar />, {
        route: "/admin/students",
      });

      let studentsLink = screen.getByRole("link", { name: /students/i });
      let sprintsLink = screen.getByRole("link", { name: /sprints/i });

      expect(studentsLink).toHaveClass("active");
      expect(sprintsLink).not.toHaveClass("active");

      // Unmount and re-render at /admin/sprints to test different route
      unmount();
      renderWithRouter(<Sidebar />, { route: "/admin/sprints" });

      studentsLink = screen.getByRole("link", { name: /students/i });
      sprintsLink = screen.getByRole("link", { name: /sprints/i });

      expect(studentsLink).not.toHaveClass("active");
      expect(sprintsLink).toHaveClass("active");
    });
  });

  describe("Logout button", () => {
    it("renders Sign Out button", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      expect(
        screen.getByRole("button", { name: /sign out/i })
      ).toBeInTheDocument();
    });

    it("calls logout function when Sign Out is clicked", async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn();

      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: mockLogout,
      });

      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      await user.click(signOutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it("calls logout for admin user", async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn();

      mockUseAuth.mockReturnValue({
        user: { role: "admin", displayName: "Admin User" },
        logout: mockLogout,
      });

      renderWithRouter(<Sidebar />, { route: "/admin" });

      const signOutButton = screen.getByRole("button", { name: /sign out/i });
      await user.click(signOutButton);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("Branding", () => {
    it("displays DeepWork logo in header", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: "Test Student" },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      // The logo appears in a div with specific styling, not in the nav
      // There are two instances of "DeepWork" - logo and nav link
      // We verify that at least one exists (the logo)
      const deepWorkElements = screen.getAllByText("DeepWork");
      expect(deepWorkElements.length).toBeGreaterThanOrEqual(1);

      // The logo should have the font-display class
      const logo = deepWorkElements.find((el) =>
        el.classList.contains("font-display")
      );
      expect(logo).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles user with no displayName gracefully", () => {
      mockUseAuth.mockReturnValue({
        user: { role: "student", displayName: undefined },
        logout: vi.fn(),
      });

      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      // Should show "?" as avatar fallback
      expect(screen.getByText("?")).toBeInTheDocument();
    });

    it("handles null user gracefully", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        logout: vi.fn(),
      });

      // This would typically be a case where the user is not logged in
      // The component should still render without crashing
      renderWithRouter(<Sidebar />, { route: "/dashboard" });

      // Student nav items should be shown (fallback to student)
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });
});
