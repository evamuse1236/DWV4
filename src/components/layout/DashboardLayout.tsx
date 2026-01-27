import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { CheckInGate } from "./CheckInGate";
import { Changelog } from "./Changelog";

/**
 * Main dashboard layout with Paper UI sidebar and content area
 * Uses React Router's Outlet for nested routes
 * Wrapped in CheckInGate to enforce daily emotional check-in
 */
export function DashboardLayout() {
  const { pathname } = useLocation();
  const hideChangelog = pathname === "/vision-board";

  return (
    <CheckInGate>
      <div className="min-h-screen">
        {/* Sidebar - Uses CSS class from index.css */}
        <Sidebar />

        {/* Changelog notification - hidden on Vision Board (full-bleed immersive page) */}
        {!hideChangelog && <Changelog />}

        {/* Main content - Uses page-wrapper class */}
        <main className="page-wrapper">
          <div className="container">
            <Outlet />
          </div>
        </main>
      </div>
    </CheckInGate>
  );
}

export default DashboardLayout;
