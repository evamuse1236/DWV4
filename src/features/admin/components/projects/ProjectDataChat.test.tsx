import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { HTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";

const mockChatAction = vi.fn();
const mockAddLink = vi.fn();
const mockUpdateReflection = vi.fn();
const mockCreateBook = vi.fn();

vi.mock("convex/react", () => ({
  useAction: vi.fn(() => mockChatAction),
  useMutation: vi.fn((mutationRef: string) => {
    if (mutationRef === "projectLinks.add") return mockAddLink;
    if (mutationRef === "projectReflections.update") return mockUpdateReflection;
    if (mutationRef === "books.create") return mockCreateBook;
    return vi.fn();
  }),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    ai: { projectDataChat: "ai.projectDataChat" },
    projectLinks: { add: "projectLinks.add" },
    projectReflections: { update: "projectReflections.update" },
    books: { create: "books.create" },
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
  adminToken: "test-admin-token",
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

  it("shows prompt bubbles and applies template when clicked", async () => {
    const user = userEvent.setup();
    render(<ProjectDataChat {...defaultProps} />);

    const addBookBubble = screen.getByRole("button", { name: "Add book" });
    await user.click(addBookBubble);

    const input = screen.getByPlaceholderText("Paste Google Drive link and book details...");
    expect((input as HTMLInputElement).value).toContain("Add book: title");
  });

  it("executes add-book commands from admin-commands block", async () => {
    const user = userEvent.setup();
    mockChatAction.mockResolvedValueOnce({
      content: `\`\`\`admin-commands
{
  "assistantText": "I parsed one book and it's ready to save.",
  "summary": "1 book ready",
  "commands": [
    {
      "type": "add_book",
      "book": {
        "title": "Sapiens Graphic Novel V1",
        "author": "Yuval Noah Harari",
        "readingUrl": "https://drive.google.com/file/d/abc123/view",
        "genre": "History"
      }
    }
  ]
}
\`\`\``,
    });

    render(<ProjectDataChat {...defaultProps} />);
    const input = screen.getByPlaceholderText("Tell me about student work...");
    await user.type(input, "Add this book from drive{enter}");

    expect(await screen.findByText("Ready to save:")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /save data/i }));

    await waitFor(() => {
      expect(mockCreateBook).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Sapiens Graphic Novel V1",
          author: "Yuval Noah Harari",
          readingUrl: "https://drive.google.com/file/d/abc123/view",
          genre: "History",
        })
      );
    });
  });
});
