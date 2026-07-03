import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  ConvexProvider: ({ children }: any) => <>{children}</>,
  ConvexReactClient: class MockConvexReactClient {},
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/features/auth/components", () => ({
  ProtectedRoute: ({ children }: any) => <>{children}</>,
  PublicOnlyRoute: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/app/shell", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  const Outlet = actual.Outlet;
  return {
    DashboardLayout: () => <Outlet />,
    AdminLayout: () => <Outlet />,
  };
});

vi.mock("@/shared/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/shared/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock("@/features/auth/pages/LoginPage", () => ({
  default: () => <div>Login page</div>,
}));

vi.mock("@/features/auth/pages/SetupPage", () => ({
  default: () => <div>Setup page</div>,
}));

vi.mock("@/features/student/pages/StudentDashboard", () => ({
  StudentDashboard: () => <div>Student dashboard</div>,
}));
vi.mock("@/features/check-in/pages/EmotionCheckInPage", () => ({
  EmotionCheckInPage: () => <div>Check-in page</div>,
}));
vi.mock("@/features/sprint/pages/SprintPage", () => ({
  SprintPage: () => <div>Sprint page</div>,
}));
vi.mock("@/features/deep-work/pages/DeepWorkPage", () => ({
  DeepWorkPage: () => <div>Deep work page</div>,
}));
vi.mock("@/features/deep-work/pages/DomainDetailPage", () => ({
  DomainDetailPage: () => <div>Domain detail page</div>,
}));
vi.mock("@/features/assignments/pages/AssignmentPage", () => ({
  AssignmentPage: () => <div>Assignment page</div>,
}));
vi.mock("@/features/reading/pages/ReadingPage", () => ({
  ReadingPage: () => <div>Reading page</div>,
}));
vi.mock("@/features/trust-jar/pages/TrustJarPage", () => ({
  TrustJarPage: () => <div>Trust jar page</div>,
}));
vi.mock("@/features/vision-board/pages/VisionBoardPage", () => ({
  VisionBoardPage: () => <div>Vision board page</div>,
}));
vi.mock("@/features/reading/pages/ReviewPage", () => ({
  ReviewPage: () => <div>Review page</div>,
}));
vi.mock("@/features/vision-board/pages/CharacterPage", () => ({
  CharacterPage: () => <div>Character page</div>,
}));
vi.mock("@/features/settings/pages/SettingsPage", () => ({
  SettingsPage: () => <div>Student settings page</div>,
}));

vi.mock("@/features/admin/pages/AdminDashboard", () => ({
  AdminDashboard: () => <div>Admin dashboard</div>,
}));

vi.mock("@/features/admin/pages", () => ({
  AdminDashboard: () => <div>Admin dashboard</div>,
  StudentsPage: () => <div>Students page</div>,
  SprintsPage: () => <div>Sprints page</div>,
  ObjectivesPage: () => <div>Objectives page</div>,
  ConfirmationsPage: () => <div>Confirmations page</div>,
  ReviewQueuePage: () => <div>Reviews page</div>,
  BooksPage: () => <div>Books page</div>,
  NormsPage: () => <div>Norms page</div>,
  AdminSettingsPage: () => <div>Admin settings page</div>,
}));

vi.mock("@/features/admin/pages/StudentDetailPage", () => ({
  StudentDetailPage: () => <div>Student detail page</div>,
}));
vi.mock("@/features/admin/pages/TrustJarPage", () => ({
  AdminTrustJarPage: () => <div>Admin trust jar page</div>,
}));
vi.mock("@/features/admin/pages/ConfirmationsPage", () => ({
  ConfirmationsPage: () => <div>Confirmations page</div>,
}));
vi.mock("@/features/admin/pages/ProjectsPage", () => ({
  ProjectsPage: () => <div>Projects page</div>,
}));
vi.mock("@/features/admin/pages/ProjectDetailPage", () => ({
  ProjectDetailPage: () => <div>Project detail page</div>,
}));

vi.mock("@/app/config/featureFlags", () => ({
  STUDENT_CHARACTER_SYSTEM_ENABLED: true,
}));

import App from "./App";

describe("App admin route redirects", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/admin");
  });

  it.each([
    "/admin/comments",
    "/admin/character",
    "/admin/reviews",
    "/admin/presentations",
  ])("redirects %s to the admin dashboard", async (path) => {
    window.history.pushState({}, "", path);
    render(<App />);

    expect(await screen.findByText("Admin dashboard")).toBeInTheDocument();
  });

  it.each(["/admin/viva", "/admin/diagnostics"])(
    "redirects retired queue route %s to confirmations",
    async (path) => {
      window.history.pushState({}, "", path);
      render(<App />);

      expect(await screen.findByText("Confirmations page")).toBeInTheDocument();
    }
  );

  it("routes /admin/projects to the data collection workspace", async () => {
    window.history.pushState({}, "", "/admin/projects");
    render(<App />);

    expect(await screen.findByText("Projects page")).toBeInTheDocument();
  });
});
