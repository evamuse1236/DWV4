import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseAuth = vi.fn();
const mockUseSessionToken = vi.fn();
const mockUseQuery = vi.fn();
const mockChangeOwnUsername = vi.fn();
const mockChangeOwnPassword = vi.fn();
const mockUpdateOwnProfile = vi.fn();
const mockAdminUpdateUsername = vi.fn();
const mockAdminResetPassword = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: vi.fn((mutationRef: string) => {
    if (mutationRef === "auth.changeOwnUsername") return mockChangeOwnUsername;
    if (mutationRef === "auth.changeOwnPassword") return mockChangeOwnPassword;
    if (mutationRef === "auth.updateOwnProfile") return mockUpdateOwnProfile;
    if (mutationRef === "auth.adminUpdateUsername") return mockAdminUpdateUsername;
    if (mutationRef === "auth.adminResetPassword") return mockAdminResetPassword;
    return vi.fn();
  }),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    auth: {
      getCredentialSummaries: "auth.getCredentialSummaries",
      changeOwnUsername: "auth.changeOwnUsername",
      changeOwnPassword: "auth.changeOwnPassword",
      updateOwnProfile: "auth.updateOwnProfile",
      adminUpdateUsername: "auth.adminUpdateUsername",
      adminResetPassword: "auth.adminResetPassword",
    },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
  useSessionToken: () => mockUseSessionToken(),
}));

import { AdminSettingsPage } from "../SettingsPage";

describe("AdminSettingsPage avatar URL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        _id: "admin_1",
        username: "admin",
        displayName: "Admin One",
        avatarUrl: "",
      },
    });
    mockUseSessionToken.mockReturnValue("admin_token_123");
    mockUseQuery.mockReturnValue([]);
    mockUpdateOwnProfile.mockResolvedValue({ success: true, avatarUrl: "https://example.com/admin.gif" });
  });

  it("saves a GIF URL for the current admin profile", async () => {
    const user = userEvent.setup();
    render(<AdminSettingsPage />);

    const avatarInput = screen.getByPlaceholderText("https://example.com/profile.gif");
    await user.clear(avatarInput);
    await user.type(avatarInput, "https://example.com/admin.gif");
    await user.click(screen.getByRole("button", { name: "Save Photo" }));

    await waitFor(() => {
      expect(mockUpdateOwnProfile).toHaveBeenCalledWith({
        token: "admin_token_123",
        avatarUrl: "https://example.com/admin.gif",
      });
    });
  });

  it("saves a base64 data image URL for the current admin profile", async () => {
    const user = userEvent.setup();
    render(<AdminSettingsPage />);

    const dataUrl = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ";
    const avatarInput = screen.getByPlaceholderText("https://example.com/profile.gif");
    await user.clear(avatarInput);
    await user.type(avatarInput, dataUrl);
    await user.click(screen.getByRole("button", { name: "Save Photo" }));

    await waitFor(() => {
      expect(mockUpdateOwnProfile).toHaveBeenCalledWith({
        token: "admin_token_123",
        avatarUrl: dataUrl,
      });
    });
  });
});
