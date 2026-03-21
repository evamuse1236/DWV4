import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  ConvexProvider: ({ children }: any) => <>{children}</>,
  ConvexReactClient: class MockConvexReactClient {},
}));

vi.mock("./hooks/useAuth", () => ({
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock("./components/auth", () => ({
  ProtectedRoute: ({ children }: any) => <>{children}</>,
  PublicOnlyRoute: ({ children }: any) => <>{children}</>,
}));

vi.mock("./components/layout", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  const Outlet = actual.Outlet;
  return {
    DashboardLayout: () => <Outlet />,
    AdminLayout: () => <Outlet />,
  };
});

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock("./pages/LoginPage", () => ({
  default: () => <div>Login page</div>,
}));

vi.mock("./pages/SetupPage", () => ({
  default: () => <div>Setup page</div>,
}));

vi.mock("./pages/student/StudentDashboard", () => ({
  StudentDashboard: () => <div>Student dashboard</div>,
}));
vi.mock("./pages/student/EmotionCheckInPage", () => ({
  EmotionCheckInPage: () => <div>Check-in page</div>,
}));
vi.mock("./pages/student/SprintPage", () => ({
  SprintPage: () => <div>Sprint page</div>,
}));
vi.mock("./pages/student/DeepWorkPage", () => ({
  DeepWorkPage: () => <div>Deep work page</div>,
}));
vi.mock("./pages/student/DomainDetailPage", () => ({
  DomainDetailPage: () => <div>Domain detail page</div>,
}));
vi.mock("./pages/student/DiagnosticPage", () => ({
  DiagnosticPage: () => <div>Diagnostic page</div>,
}));
vi.mock("./pages/student/MasteryPage", () => ({
  MasteryPage: () => <div>Mastery page</div>,
}));
vi.mock("./pages/student/ReadingPage", () => ({
  ReadingPage: () => <div>Reading page</div>,
}));
vi.mock("./pages/student/TrustJarPage", () => ({
  TrustJarPage: () => <div>Trust jar page</div>,
}));
vi.mock("./pages/student/VisionBoardPage", () => ({
  VisionBoardPage: () => <div>Vision board page</div>,
}));
vi.mock("./pages/student/ReviewPage", () => ({
  ReviewPage: () => <div>Review page</div>,
}));
vi.mock("./pages/student/CharacterPage", () => ({
  CharacterPage: () => <div>Character page</div>,
}));
vi.mock("./pages/student/SettingsPage", () => ({
  SettingsPage: () => <div>Student settings page</div>,
}));

vi.mock("./pages/admin", () => ({
  AdminDashboard: () => <div>Admin dashboard</div>,
  StudentsPage: () => <div>Students page</div>,
  SprintsPage: () => <div>Sprints page</div>,
  ObjectivesPage: () => <div>Objectives page</div>,
  DiagnosticsPage: () => <div>Diagnostics page</div>,
  VivaQueuePage: () => <div>Viva page</div>,
  ReviewQueuePage: () => <div>Reviews page</div>,
  BooksPage: () => <div>Books page</div>,
  NormsPage: () => <div>Norms page</div>,
  AdminSettingsPage: () => <div>Admin settings page</div>,
}));

vi.mock("./pages/admin/StudentDetailPage", () => ({
  StudentDetailPage: () => <div>Student detail page</div>,
}));
vi.mock("./pages/admin/TrustJarPage", () => ({
  AdminTrustJarPage: () => <div>Admin trust jar page</div>,
}));

vi.mock("./lib/featureFlags", () => ({
  STUDENT_CHARACTER_SYSTEM_ENABLED: true,
}));

import App from "./App";

describe("App admin route redirects", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/admin");
  });

  it("redirects /admin/projects to the admin dashboard", () => {
    window.history.pushState({}, "", "/admin/projects");
    render(<App />);

    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
  });

  it("redirects /admin/comments to the admin dashboard", () => {
    window.history.pushState({}, "", "/admin/comments");
    render(<App />);

    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
  });

  it("redirects /admin/character to the admin dashboard", () => {
    window.history.pushState({}, "", "/admin/character");
    render(<App />);

    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
  });
});
