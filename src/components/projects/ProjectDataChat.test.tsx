import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { HTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "../../../convex/_generated/dataModel";

const mockChatAction = vi.fn();
const mockAddLink = vi.fn();
const mockUpdateReflection = vi.fn();

vi.mock("convex/react", () => ({
  useAction: vi.fn(() => mockChatAction),
  useMutation: vi.fn((mutationRef: string) => {
    if (mutationRef === "projectLinks.add") return mockAddLink;
    if (mutationRef === "projectReflections.update") return mockUpdateReflection;
    return vi.fn();
  }),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    ai: { projectDataChat: "ai.projectDataChat" },
    projectLinks: { add: "projectLinks.add" },
    projectReflections: { update: "projectReflections.update" },
  },
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>) => (
      <div {...(rest as HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
    span: ({ children, ...rest }: { children?: ReactNode } & Record<string, unknown>) => (
      <span {...(rest as HTMLAttributes<HTMLSpanElement>)}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
}));

import { ProjectDataChat } from "./ProjectDataChat";

const defaultProps = {
  projectId: "project_1" as Id<"projects">,
  projectName: "Science Expo",
  students: [
    {
      _id: "user_1" as Id<"users">,
      displayName: "John Doe",
      batch: "A1",
    },
  ],
  onClose: vi.fn(),
};

describe("ProjectDataChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("sends prior turns in second request", async () => {
    const user = userEvent.setup();
    mockChatAction
      .mockResolvedValueOnce({ content: "Thanks, captured first turn." })
      .mockResolvedValueOnce({ content: "Got the second one too." });

    render(<ProjectDataChat {...defaultProps} />);

    const input = screen.getByPlaceholderText("Tell me about student work...");

    await user.type(input, "John shared a presentation link{enter}");
    expect(await screen.findByText("Thanks, captured first turn.")).toBeInTheDocument();

    await user.type(input, "He can improve pacing{enter}");
    expect(await screen.findByText("Got the second one too.")).toBeInTheDocument();

    expect(mockChatAction).toHaveBeenCalledTimes(2);
    expect(mockChatAction).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        projectName: "Science Expo",
        messages: [{ role: "user", content: "John shared a presentation link" }],
      })
    );
    expect(mockChatAction).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        messages: [
          { role: "user", content: "John shared a presentation link" },
          { role: "assistant", content: "Thanks, captured first turn." },
          { role: "user", content: "He can improve pacing" },
        ],
      })
    );
  });

  it("handles malformed project-data blocks without opening save preview", async () => {
    const user = userEvent.setup();
    mockChatAction.mockResolvedValueOnce({
      content: "I found this:\n```project-data\n{bad json}\n```",
    });

    render(<ProjectDataChat {...defaultProps} />);
    const input = screen.getByPlaceholderText("Tell me about student work...");

    await user.type(input, "John project update{enter}");

    expect(await screen.findByText(/project-data/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Ready to save:")).not.toBeInTheDocument();
    });
  });
});
