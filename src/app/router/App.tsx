import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { ProtectedRoute, PublicOnlyRoute } from "@/features/auth/components";
import { DashboardLayout, AdminLayout } from "@/app/shell";
import { Toaster } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";

// Pages
import LoginPage from "@/features/auth/pages/LoginPage";
import SetupPage from "@/features/auth/pages/SetupPage";
import { StudentDashboard } from "@/features/student/pages/StudentDashboard";
import { EmotionCheckInPage } from "@/features/check-in/pages/EmotionCheckInPage";
import { SprintPage } from "@/features/sprint/pages/SprintPage";
import { DeepWorkPage } from "@/features/deep-work/pages/DeepWorkPage";
import { DomainDetailPage } from "@/features/deep-work/pages/DomainDetailPage";
import { DiagnosticPage } from "@/features/diagnostics/pages/DiagnosticPage";
import { MasteryPage } from "@/features/mastery/pages/MasteryPage";
import { ReadingPage } from "@/features/reading/pages/ReadingPage";
import { TrustJarPage } from "@/features/trust-jar/pages/TrustJarPage";
import { VisionBoardPage } from "@/features/vision-board/pages/VisionBoardPage";
import { ReviewPage } from "@/features/reading/pages/ReviewPage";
import { CharacterPage } from "@/features/vision-board/pages/CharacterPage";
import { SettingsPage as StudentSettingsPage } from "@/features/settings/pages/SettingsPage";

// Admin pages
import {
  AdminDashboard,
  StudentsPage,
  SprintsPage,
  ObjectivesPage,
  DiagnosticsPage,
  VivaQueuePage,
  BooksPage,
  NormsPage,
  AdminSettingsPage,
} from "@/features/admin/pages";

import { StudentDetailPage } from "@/features/admin/pages/StudentDetailPage";
import { AdminTrustJarPage } from "@/features/admin/pages/TrustJarPage";
import { STUDENT_CHARACTER_SYSTEM_ENABLED } from "@/app/config/featureFlags";

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
              <Route path="/deep-work/mastery/:majorObjectiveId" element={<MasteryPage />} />
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
              <Route path="/admin/projects" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/projects/:projectId" element={<Navigate to="/admin" replace />} />
              <Route path="/admin/objectives" element={<ObjectivesPage />} />
              <Route path="/admin/viva" element={<VivaQueuePage />} />
              <Route path="/admin/diagnostics" element={<DiagnosticsPage />} />
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
            <Toaster />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}

export default App;
