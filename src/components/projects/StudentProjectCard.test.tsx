import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { HTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";

const mockAddLink = vi.fn();
const mockUpdateLink = vi.fn();
const mockRemoveLink = vi.fn();
const mockUpdateReflection = vi.fn();

vi.mock("convex/react", () => ({
  useMutation: vi.fn((mutationRef: string) => {
    if (mutationRef === "projectLinks.add") return mockAddLink;
    if (mutationRef === "projectLinks.update") return mockUpdateLink;
    if (mutationRef === "projectLinks.remove") return mockRemoveLink;
    if (mutationRef === "projectReflections.update") return mockUpdateReflection;
    return vi.fn();
  }),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    projectLinks: {
      add: "projectLinks.add",
      update: "projectLinks.update",
      remove: "projectLinks.remove",
    },
    projectReflections: {
      update: "projectReflections.update",
    },
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>) => (
      <div {...(rest as HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

import { StudentProjectCard } from "./StudentProjectCard";

const defaultProps = {
  student: {
    _id: "user_1" as Id<"users">,
    displayName: "John Doe",
    username: "john",
    batch: "A1",
    links: [
      {
        _id: "link_1" as Id<"projectLinks">,
        title: "Initial deck",
        url: "https://example.com/deck",
        linkType: "presentation" as const,
      },
    ],
    reflection: null,
  },
  projectId: "project_1" as Id<"projects">,
  isExpanded: true,
  onToggleExpand: vi.fn(),
};

describe("StudentProjectCard link editing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateLink.mockResolvedValue({ success: true });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves inline link edits via projectLinks.update", async () => {
    const user = userEvent.setup();
    render(<StudentProjectCard {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Edit link" }));
    await user.clear(screen.getByLabelText("Edit link title"));
    await user.type(screen.getByLabelText("Edit link title"), "Updated deck");
    await user.clear(screen.getByLabelText("Edit link URL"));
    await user.type(screen.getByLabelText("Edit link URL"), "https://example.com/new-deck");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockUpdateLink).toHaveBeenCalledWith({
        linkId: "link_1",
        title: "Updated deck",
        url: "https://example.com/new-deck",
        linkType: "presentation",
      });
    });
  });

  it("shows an inline error when update fails", async () => {
    const user = userEvent.setup();
    mockUpdateLink.mockRejectedValueOnce(new Error("network"));
    render(<StudentProjectCard {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Edit link" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Failed to update link. Please try again.")
    ).toBeInTheDocument();
  });
});
