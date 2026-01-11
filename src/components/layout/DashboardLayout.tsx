import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { CheckInGate } from "./CheckInGate";

/**
 * Main dashboard layout with Paper UI sidebar and content area
 * Uses React Router's Outlet for nested routes
 * Wrapped in CheckInGate to enforce daily emotional check-in
 */
export function DashboardLayout() {
  return (
    <CheckInGate>
      <div className="min-h-screen">
        {/* Sidebar - Uses CSS class from index.css */}
        <Sidebar />

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
