import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute, PublicOnlyRoute } from "./components/auth";
import { DashboardLayout, AdminLayout } from "./components/layout";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Pages
import LoginPage from "./pages/LoginPage";
import SetupPage from "./pages/SetupPage";
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { EmotionCheckInPage } from "./pages/student/EmotionCheckInPage";
import { SprintPage } from "./pages/student/SprintPage";
import { DeepWorkPage } from "./pages/student/DeepWorkPage";
import { DomainDetailPage } from "./pages/student/DomainDetailPage";
import { DiagnosticPage } from "./pages/student/DiagnosticPage";
import { ReadingPage } from "./pages/student/ReadingPage";
import { TrustJarPage } from "./pages/student/TrustJarPage";
import { VisionBoardPage } from "./pages/student/VisionBoardPage";
import { ReviewPage } from "./pages/student/ReviewPage";
import { CharacterPage } from "./pages/student/CharacterPage";
import { SettingsPage as StudentSettingsPage } from "./pages/student/SettingsPage";

// Admin pages
import {
  AdminDashboard,
  StudentsPage,
  SprintsPage,
  ProjectsPage,
  ObjectivesPage,
  VivaQueuePage,
  PresentationQueuePage,
  BooksPage,
  NormsPage,
  CommentsPage,
  AdminSettingsPage,
} from "./pages/admin";

import { ProjectDetailPage } from "./pages/admin/ProjectDetailPage";
import { StudentDetailPage } from "./pages/admin/StudentDetailPage";
import { AdminTrustJarPage } from "./pages/admin/TrustJarPage";
import { CharacterCatalogPage } from "./pages/admin/CharacterCatalogPage";
import { STUDENT_CHARACTER_SYSTEM_ENABLED } from "./lib/featureFlags";

// Initialize Convex client
// Note: Replace with your actual Convex URL after running `npx convex dev`
const convexUrl = import.meta.env.VITE_CONVEX_URL || "https://placeholder.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

function App() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
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
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/check-in" element={<EmotionCheckInPage />} />
              <Route path="/sprint" element={<SprintPage />} />
              <Route path="/deep-work" element={<DeepWorkPage />} />
              <Route path="/deep-work/:domainId" element={<DomainDetailPage />} />
              <Route path="/deep-work/diagnostic/:majorObjectiveId" element={<DiagnosticPage />} />
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
              <Route path="/admin/viva" element={<VivaQueuePage />} />
              <Route path="/admin/presentations" element={<PresentationQueuePage />} />
              <Route path="/admin/books" element={<BooksPage />} />
              <Route path="/admin/norms" element={<NormsPage />} />
              <Route path="/admin/comments" element={<CommentsPage />} />
              <Route path="/admin/character" element={<CharacterCatalogPage />} />
              <Route path="/admin/trust-jar" element={<AdminTrustJarPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}

export default App;
