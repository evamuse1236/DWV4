import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockChangeOwnUsername = vi.fn();
const mockChangeOwnPassword = vi.fn();
const mockUpdateOwnProfile = vi.fn();
const mockUseAuth = vi.fn();
const mockUseSessionToken = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn((mutationRef: string) => {
    if (mutationRef === "auth.changeOwnUsername") return mockChangeOwnUsername;
    if (mutationRef === "auth.changeOwnPassword") return mockChangeOwnPassword;
    if (mutationRef === "auth.updateOwnProfile") return mockUpdateOwnProfile;
    return vi.fn();
  }),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    auth: {
      changeOwnUsername: "auth.changeOwnUsername",
      changeOwnPassword: "auth.changeOwnPassword",
      updateOwnProfile: "auth.updateOwnProfile",
    },
  },
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
  useSessionToken: () => mockUseSessionToken(),
}));

import { SettingsPage } from "../SettingsPage";

describe("Student Settings avatar URL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: {
        _id: "user_1",
        username: "student",
        displayName: "Student One",
        avatarUrl: "https://example.com/current.gif",
      },
    });
    mockUseSessionToken.mockReturnValue("token_123");
    mockUpdateOwnProfile.mockResolvedValue({ success: true, avatarUrl: "https://example.com/new.gif" });
  });

  it("saves a GIF URL via updateOwnProfile", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const avatarInput = screen.getByLabelText("Avatar URL");
    await user.clear(avatarInput);
    await user.type(avatarInput, "https://example.com/new.gif");
    await user.click(screen.getByRole("button", { name: "Save Photo" }));

    await waitFor(() => {
      expect(mockUpdateOwnProfile).toHaveBeenCalledWith({
        token: "token_123",
        avatarUrl: "https://example.com/new.gif",
      });
    });
  });

  it("saves a base64 data image URL via updateOwnProfile", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA";
    const avatarInput = screen.getByLabelText("Avatar URL");
    await user.clear(avatarInput);
    await user.type(avatarInput, dataUrl);
    await user.click(screen.getByRole("button", { name: "Save Photo" }));

    await waitFor(() => {
      expect(mockUpdateOwnProfile).toHaveBeenCalledWith({
        token: "token_123",
        avatarUrl: dataUrl,
      });
    });
  });

  it("clears avatar URL via updateOwnProfile", async () => {
    const user = userEvent.setup();
    mockUpdateOwnProfile.mockResolvedValueOnce({ success: true, avatarUrl: undefined });
    render(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: "Clear Photo" }));

    await waitFor(() => {
      expect(mockUpdateOwnProfile).toHaveBeenCalledWith({
        token: "token_123",
        avatarUrl: undefined,
      });
    });
  });
});
