import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockChangeOwnUsername = vi.fn();
const mockChangeOwnPassword = vi.fn();
const mockUpdateOwnProfile = vi.fn();
const mockUseQuery = vi.fn();
const mockUseAuth = vi.fn();
const mockUseSessionToken = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
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
      getFriendProfiles: "auth.getFriendProfiles",
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
    mockUseQuery.mockImplementation((queryRef: string) => {
      if (queryRef === "auth.getFriendProfiles") {
        return [
          {
            _id: "user_2",
            displayName: "Friend One",
            username: "friend1",
            avatarUrl: "https://example.com/friend1.gif",
            batch: "2156",
          },
          {
            _id: "user_3",
            displayName: "Friend Two",
            username: "friend2",
            avatarUrl: undefined,
            batch: "2156",
          },
        ];
      }
      return undefined;
    });
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

  it("shows friend profile GIFs and expands when clicked", async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(screen.getByText("Friends' Profile GIFs")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Friend One profile" })).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Friend Two profile" })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Friend One/i }));

    expect(
      screen.getByRole("img", { name: "Friend One expanded profile" })
    ).toBeInTheDocument();
    expect(screen.getByText("Friend One's Profile GIF")).toBeInTheDocument();
  });
});
