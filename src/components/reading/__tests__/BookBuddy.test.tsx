import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockLibraryChat = vi.fn();

vi.mock("convex/react", () => ({
  useAction: vi.fn(() => mockLibraryChat),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    ai: { libraryChat: "ai.libraryChat" },
  },
}));

// Mock framer-motion — strip animation props so DOM stays clean
vi.mock("framer-motion", () => {
  const strip = (props: Record<string, unknown>) => {
    const animKeys = [
      "initial",
      "animate",
      "exit",
      "variants",
      "transition",
      "whileHover",
      "whileTap",
      "whileFocus",
      "whileInView",
      "layout",
      "layoutId",
    ];
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(props)) {
      if (!animKeys.includes(k)) clean[k] = v;
    }
    return clean;
  };

  return {
    motion: {
      div: ({ children, ...rest }: any) => <div {...strip(rest)}>{children}</div>,
      button: ({ children, ...rest }: any) => (
        <button {...strip(rest)}>{children}</button>
      ),
      span: ({ children, ...rest }: any) => (
        <span {...strip(rest)}>{children}</span>
      ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Import component after mocks are wired
import { BookBuddy } from "../BookBuddy";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BuddyBooks {
  id: string;
  title: string;
  author: string;
  teaser: string;
  whyYoullLikeIt: string;
}

interface BuddySuggestion {
  label: string;
  fullText: string;
}

/**
 * Build the ```buddy-response JSON block that the AI action returns.
 */
function buildBuddyResponse(
  message: string,
  books: BuddyBooks[] = [],
  suggestedReplies: BuddySuggestion[] = [],
) {
  const payload = { message, books, suggestedReplies };
  return "```buddy-response\n" + JSON.stringify(payload) + "\n```";
}

const defaultBooks = [
  {
    id: "b1",
    title: "The Great Book",
    author: "Author A",
    genre: "fiction",
    description: "A great story",
    coverImageUrl: undefined,
  },
  {
    id: "b2",
    title: "Another Book",
    author: "Author B",
    genre: "adventure",
    description: "An adventure",
    coverImageUrl: undefined,
  },
];

const defaultProps = {
  readingHistory: [],
  availableBooks: defaultBooks,
  onStartReading: vi.fn(),
};

function renderBuddy(overrides: Partial<typeof defaultProps> & { disabled?: boolean } = {}) {
  const props = { ...defaultProps, onStartReading: vi.fn(), ...overrides };
  const result = render(<BookBuddy {...props} />);
  return { ...result, onStartReading: props.onStartReading };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BookBuddy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1) Successful response → AI message, book card, custom suggested replies
  describe("successful AI response", () => {
    it("renders AI message, book cards, and custom suggested replies", async () => {
      const user = userEvent.setup();

      mockLibraryChat.mockResolvedValueOnce({
        content: buildBuddyResponse(
          "Here are some books for you!",
          [
            {
              id: "b1",
              title: "The Great Book",
              author: "Author A",
              teaser: "An epic tale",
              whyYoullLikeIt: "You love fiction",
            },
          ],
          [
            { label: "More like this", fullText: "Show me more fiction" },
            { label: "Something else", fullText: "I want something different" },
          ],
        ),
      });

      renderBuddy();

      // Open the panel
      await user.click(screen.getByRole("button", { name: /open book buddy/i }));

      // Click a default suggestion chip to trigger a send
      await user.click(screen.getByRole("button", { name: /something funny/i }));

      // Wait for the AI message to appear
      expect(await screen.findByText("Here are some books for you!")).toBeInTheDocument();

      // Book card renders with title and author
      expect(screen.getByText("The Great Book")).toBeInTheDocument();
      expect(screen.getByText("Author A")).toBeInTheDocument();
      expect(screen.getByText("An epic tale")).toBeInTheDocument();

      // Custom suggested replies replace the defaults
      expect(screen.getByRole("button", { name: "More like this" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Something else" })).toBeInTheDocument();

      // Default chips should be gone
      expect(screen.queryByRole("button", { name: /big adventure/i })).not.toBeInTheDocument();
    });
  });

  // 2) Parse failure → error message, no book cards
  describe("parse failure", () => {
    it("shows error message and no book cards when AI returns unparseable content", async () => {
      const user = userEvent.setup();

      mockLibraryChat.mockResolvedValueOnce({
        content: "This is not valid buddy-response JSON at all",
      });

      renderBuddy();

      await user.click(screen.getByRole("button", { name: /open book buddy/i }));
      await user.click(screen.getByRole("button", { name: /something funny/i }));

      // Error message appears
      expect(
        await screen.findByText(/couldn't understand that response/i),
      ).toBeInTheDocument();

      // No book cards rendered — the "Start Reading" button lives inside cards
      expect(screen.queryByText("Start Reading")).not.toBeInTheDocument();
    });
  });

  // 3) Switching personality clears book cards and resets suggested replies
  describe("personality switch", () => {
    it("clears book cards and resets suggested replies to defaults", async () => {
      const user = userEvent.setup();

      mockLibraryChat.mockResolvedValueOnce({
        content: buildBuddyResponse(
          "Luna's picks",
          [
            {
              id: "b1",
              title: "The Great Book",
              author: "Author A",
              teaser: "A wonderful read",
              whyYoullLikeIt: "You'll love it",
            },
          ],
          [{ label: "Luna custom", fullText: "Luna custom reply" }],
        ),
      });

      renderBuddy();

      // Open and trigger a response with Luna (default)
      await user.click(screen.getByRole("button", { name: /open book buddy/i }));
      await user.click(screen.getByRole("button", { name: /something funny/i }));

      // Wait for book card
      expect(await screen.findByText("The Great Book")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Luna custom" })).toBeInTheDocument();

      // Cycle to Dash (Luna → Dash)
      await user.click(screen.getByRole("button", { name: /switch character/i }));

      // Book cards should be cleared
      expect(screen.queryByText("The Great Book")).not.toBeInTheDocument();

      // Suggested replies reset to defaults
      expect(screen.getByRole("button", { name: /something funny/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /big adventure/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /mystery/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /surprise me!/i })).toBeInTheDocument();

      // Custom reply is gone
      expect(screen.queryByRole("button", { name: "Luna custom" })).not.toBeInTheDocument();
    });
  });

  // 4) disabled prop prevents opening/sending and disables input/chips
  describe("disabled prop", () => {
    it("prevents opening the panel when disabled", async () => {
      const user = userEvent.setup();
      renderBuddy({ disabled: true });

      // The container is aria-hidden when disabled, so use hidden option to find the button
      await user.click(screen.getByRole("button", { name: /open book buddy/i, hidden: true }));

      // The container should still not have the expanded class (handleToggle returns early)
      const container = screen.getByRole("button", { name: /open book buddy/i, hidden: true }).closest(".muse-container");
      expect(container).not.toHaveClass("expanded");
    });

    it("disables input and chip buttons when disabled and panel is open", async () => {
      const user = userEvent.setup();

      // First render without disabled so we can open the panel
      const { rerender } = render(
        <BookBuddy {...defaultProps} onStartReading={vi.fn()} />,
      );

      // Open the panel
      await user.click(screen.getByRole("button", { name: /open book buddy/i }));

      // Verify panel is open — input should be visible
      expect(screen.getByPlaceholderText(/what kind of book/i)).toBeInTheDocument();

      // Now re-render with disabled — the component closes the panel via useEffect
      rerender(
        <BookBuddy {...defaultProps} onStartReading={vi.fn()} disabled />,
      );

      // The container should lose the expanded class and be aria-hidden
      const container = screen.getByPlaceholderText(/what kind of book/i).closest(".muse-container");
      expect(container).not.toHaveClass("expanded");
      expect(container).toHaveAttribute("aria-hidden", "true");

      // Input should be disabled
      expect(screen.getByPlaceholderText(/what kind of book/i)).toBeDisabled();
    });
  });

  // 5) Book card is keyboard-activatable (Enter triggers onStartReading)
  describe("keyboard activation", () => {
    it("triggers onStartReading with correct book id on Enter key", async () => {
      const user = userEvent.setup();

      mockLibraryChat.mockResolvedValueOnce({
        content: buildBuddyResponse("Pick one!", [
          {
            id: "b2",
            title: "Another Book",
            author: "Author B",
            teaser: "Great adventure",
            whyYoullLikeIt: "You love adventures",
          },
        ]),
      });

      const { onStartReading } = renderBuddy();

      // Open panel and trigger AI response
      await user.click(screen.getByRole("button", { name: /open book buddy/i }));
      await user.click(screen.getByRole("button", { name: /something funny/i }));

      // Wait for the book card to render
      const bookCard = await screen.findByText("Another Book");

      // The card is wrapped in a motion.div with role="button" — find it
      const cardButton = bookCard.closest('[role="button"]') as HTMLElement;
      expect(cardButton).not.toBeNull();

      // Focus the card and press Enter
      cardButton.focus();
      await user.keyboard("{Enter}");

      expect(onStartReading).toHaveBeenCalledWith("b2");
    });
  });
});
