import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    users: {
      getAll: "users.getAll",
    },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "admin_1",
      displayName: "Admin User",
      username: "admin.user",
      role: "admin",
    },
    logout: vi.fn(),
  })),
}));

import { useQuery } from "convex/react";
import { AdminLayout } from "./AdminLayout";

function renderLayout(route = "/admin") {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<div>Admin home</div>} />
          <Route path="/admin/students" element={<div>Students page</div>} />
          <Route path="/admin/objectives" element={<div>Objectives page</div>} />
          <Route path="/admin/viva" element={<div>Viva page</div>} />
          <Route path="/admin/diagnostics" element={<div>Diagnostics page</div>} />
          <Route path="/admin/reviews" element={<div>Reviews page</div>} />
          <Route path="/admin/sprints" element={<div>Sprints page</div>} />
          <Route path="/admin/books" element={<div>Books page</div>} />
          <Route path="/admin/norms" element={<div>Norms page</div>} />
          <Route path="/admin/trust-jar" element={<div>Trust jar page</div>} />
          <Route path="/admin/settings" element={<div>Settings page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    (useQuery as any).mockReturnValue([
      { _id: "student_1", displayName: "Alice Johnson", username: "alice" },
    ]);
  });

  it("groups navigation into coach work and manage", () => {
    renderLayout();

    expect(screen.getByText("Coach Work")).toBeInTheDocument();
    expect(screen.getByText("Manage")).toBeInTheDocument();

    for (const label of ["Dashboard", "Students", "Objectives", "Viva", "Diagnostics", "Reviews"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    for (const label of ["Sprints", "Books", "Norms", "Trust Jar", "Settings"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("removes projects, character, and comments from the admin shell", () => {
    renderLayout();

    expect(screen.queryByText("Projects")).not.toBeInTheDocument();
    expect(screen.queryByText("Character")).not.toBeInTheDocument();
    expect(screen.queryByText("Comments")).not.toBeInTheDocument();
  });

  it("shows the embedded student search entry point", () => {
    renderLayout();

    expect(screen.getByRole("button", { name: /open student/i })).toBeInTheDocument();
  });
});
