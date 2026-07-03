import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { ProtectedRoute, PublicOnlyRoute } from "@/features/auth/components";
import { DashboardLayout, AdminLayout } from "@/app/shell";
import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { STUDENT_CHARACTER_SYSTEM_ENABLED } from "@/app/config/featureFlags";

const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const SetupPage = lazy(() => import("@/features/auth/pages/SetupPage"));
const TodayPage = lazy(() =>
  import("@/features/today/pages/TodayPage").then((module) => ({ default: module.TodayPage }))
);
const EmotionCheckInPage = lazy(() =>
  import("@/features/check-in/pages/EmotionCheckInPage").then((module) => ({ default: module.EmotionCheckInPage }))
);
const SprintPage = lazy(() =>
  import("@/features/sprint/pages/SprintPage").then((module) => ({ default: module.SprintPage }))
);
const DeepWorkPage = lazy(() =>
  import("@/features/deep-work/pages/DeepWorkPage").then((module) => ({ default: module.DeepWorkPage }))
);
const DomainDetailPage = lazy(() =>
  import("@/features/deep-work/pages/DomainDetailPage").then((module) => ({ default: module.DomainDetailPage }))
);
const AssignmentPage = lazy(() =>
  import("@/features/assignments/pages/AssignmentPage").then((module) => ({ default: module.AssignmentPage }))
);
const ReadingPage = lazy(() =>
  import("@/features/reading/pages/ReadingPage").then((module) => ({ default: module.ReadingPage }))
);
const ReviewPage = lazy(() =>
  import("@/features/reading/pages/ReviewPage").then((module) => ({ default: module.ReviewPage }))
);
const TrustJarPage = lazy(() =>
  import("@/features/trust-jar/pages/TrustJarPage").then((module) => ({ default: module.TrustJarPage }))
);
const VisionBoardPage = lazy(() =>
  import("@/features/vision-board/pages/VisionBoardPage").then((module) => ({ default: module.VisionBoardPage }))
);
const CharacterPage = lazy(() =>
  import("@/features/vision-board/pages/CharacterPage").then((module) => ({ default: module.CharacterPage }))
);
const StudentSettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);

const AdminDashboard = lazy(() =>
  import("@/features/admin/pages/AdminDashboard").then((module) => ({ default: module.AdminDashboard }))
);
const StudentsPage = lazy(() =>
  import("@/features/admin/pages/StudentsPage").then((module) => ({ default: module.StudentsPage }))
);
const StudentDetailPage = lazy(() =>
  import("@/features/admin/pages/StudentDetailPage").then((module) => ({ default: module.StudentDetailPage }))
);
const SprintsPage = lazy(() =>
  import("@/features/admin/pages/SprintsPage").then((module) => ({ default: module.SprintsPage }))
);
const ObjectivesPage = lazy(() =>
  import("@/features/admin/pages/ObjectivesPage").then((module) => ({ default: module.ObjectivesPage }))
);
const ConfirmationsPage = lazy(() =>
  import("@/features/admin/pages/ConfirmationsPage").then((module) => ({ default: module.ConfirmationsPage }))
);
const ProjectsPage = lazy(() =>
  import("@/features/admin/pages/ProjectsPage").then((module) => ({ default: module.ProjectsPage }))
);
const ProjectDetailPage = lazy(() =>
  import("@/features/admin/pages/ProjectDetailPage").then((module) => ({ default: module.ProjectDetailPage }))
);
const BooksPage = lazy(() =>
  import("@/features/admin/pages/BooksPage").then((module) => ({ default: module.BooksPage }))
);
const NormsPage = lazy(() =>
  import("@/features/admin/pages/NormsPage").then((module) => ({ default: module.NormsPage }))
);
const AdminTrustJarPage = lazy(() =>
  import("@/features/admin/pages/TrustJarPage").then((module) => ({ default: module.AdminTrustJarPage }))
);
const AdminSettingsPage = lazy(() =>
  import("@/features/admin/pages/SettingsPage").then((module) => ({ default: module.AdminSettingsPage }))
);

// Initialize Convex client
// Note: Replace with your actual Convex URL after running `npx convex dev`
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://placeholder.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

function RouteFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-divider)] border-t-[var(--color-espresso)]"
      />
      <span className="font-display text-lg italic text-[var(--color-taupe)]">
        Setting the page…
      </span>
    </div>
  );
}

function App() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/setup" element={<SetupPage />} />

            {/* Student routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["student"]}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<TodayPage />} />
              <Route path="/check-in" element={<EmotionCheckInPage />} />
              <Route path="/sprint" element={<SprintPage />} />
              <Route path="/deep-work" element={<DeepWorkPage />} />
              <Route path="/deep-work/:domainId" element={<DomainDetailPage />} />
              <Route path="/deep-work/mastery/:majorObjectiveId" element={<AssignmentPage />} />
              <Route
                path="/deep-work/diagnostic/:majorObjectiveId"
                element={<Navigate to="/deep-work" replace />}
              />
              <Route path="/reading" element={<ReadingPage />} />
              <Route path="/review" element={<ReviewPage />} />
              <Route path="/trust-jar" element={<TrustJarPage />} />
              <Route path="/vision-board" element={<VisionBoardPage />} />
              <Route
                path="/character"
                element={
                  STUDENT_CHARACTER_SYSTEM_ENABLED ? (
                    <CharacterPage />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route path="/settings" element={<StudentSettingsPage />} />
            </Route>

            {/* Admin routes */}
            <Route
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentsPage />} />
              <Route path="/admin/students/:studentId" element={<StudentDetailPage />} />
              <Route path="/admin/sprints" element={<SprintsPage />} />
              <Route path="/admin/projects" element={<ProjectsPage />} />
              <Route path="/admin/projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="/admin/objectives" element={<ObjectivesPage />} />
              <Route path="/admin/confirmations" element={<ConfirmationsPage />} />
              <Route path="/admin/viva" element={<Navigate to="/admin/confirmations" replace />} />
              <Route path="/admin/diagnostics" element={<Navigate to="/admin/confirmations" replace />} />
              <Route path="/admin/reviews" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/presentations" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/books" element={<BooksPage />} />
              <Route path="/admin/norms" element={<NormsPage />} />
              <Route path="/admin/comments" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/character" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/trust-jar" element={<AdminTrustJarPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}

export default App;
