import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStartReading = vi.fn().mockResolvedValue("studentBook_new");
const mockSaveReviewDraft = vi.fn().mockResolvedValue({});
const mockSubmitReview = vi.fn().mockResolvedValue({});
const mockAddReviewComment = vi.fn().mockResolvedValue({});
const mockRemoveFromMyBooks = vi.fn().mockResolvedValue({});

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((mutation: string) => {
    if (mutation === "books.startReading") return mockStartReading;
    if (mutation === "books.saveReviewDraft") return mockSaveReviewDraft;
    if (mutation === "books.submitReview") return mockSubmitReview;
    if (mutation === "books.addReviewComment") return mockAddReviewComment;
    if (mutation === "books.removeFromMyBooks") return mockRemoveFromMyBooks;
    return vi.fn().mockResolvedValue({});
  }),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    books: {
      getAll: "books.getAll",
      getStudentBooks: "books.getStudentBooks",
      getReadingStats: "books.getReadingStats",
      getReadingHistory: "books.getReadingHistory",
      getApprovedReviews: "books.getApprovedReviews",
      getReviewComments: "books.getReviewComments",
      startReading: "books.startReading",
      saveReviewDraft: "books.saveReviewDraft",
      submitReview: "books.submitReview",
      addReviewComment: "books.addReviewComment",
      removeFromMyBooks: "books.removeFromMyBooks",
    },
  },
}));

vi.mock("../../../hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "user_123",
      username: "test.student",
      displayName: "Test Student",
      role: "student",
    },
  })),
}));

vi.mock("../../../components/reading/BookBuddy", () => ({
  default: () => <div data-testid="book-buddy">Book Buddy</div>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import { useQuery } from "convex/react";
import { ReadingPage } from "../ReadingPage";

const mockAllBooks = [
  {
    _id: "book_1",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    description: "A hobbit's adventure",
    readingUrl: "https://example.com/hobbit",
  },
  {
    _id: "book_2",
    title: "Dune",
    author: "Frank Herbert",
    genre: "Sci-Fi",
    description: "Arrakis and spice.",
  },
  {
    _id: "book_3",
    title: "Charlotte's Web",
    author: "E.B. White",
    genre: "Fiction",
    description: "A story of friendship",
  },
];

const mockStudentBooks = [
  {
    _id: "studentBook_1",
    bookId: "book_2",
    status: "review_submitted",
    review: "Good pacing and world building.",
    rating: 4,
    reviewSubmittedAt: Date.now() - 1000,
    book: mockAllBooks[1],
  },
  {
    _id: "studentBook_2",
    bookId: "book_3",
    status: "review_approved",
    review: "Loved it.",
    rating: 5,
    reviewApprovedAt: Date.now() - 500,
    book: mockAllBooks[2],
  },
];

const mockApprovedReviews = [
  {
    _id: "studentBook_2",
    bookId: "book_3",
    status: "review_approved",
    review: "Loved it.",
    rating: 5,
    book: mockAllBooks[2],
    user: { _id: "user_321", displayName: "Alice Reader", username: "alice" },
  },
];

function setupQueryMocks(overrides: Partial<Record<string, any>> = {}) {
  const data: Record<string, any> = {
    "books.getAll": mockAllBooks,
    "books.getStudentBooks": mockStudentBooks,
    "books.getReadingStats": { reading: 1, pendingReview: 1, approved: 1 },
    "books.getReadingHistory": [],
    "books.getApprovedReviews": mockApprovedReviews,
    "books.getReviewComments": [
      {
        _id: "comment_1",
        message: "Nice review!",
        createdAt: Date.now() - 1000,
        user: { displayName: "Bob", username: "bob" },
      },
    ],
    ...overrides,
  };

  (useQuery as any).mockImplementation((query: string, args: any) => {
    if (query === "books.getReviewComments" && args === "skip") return undefined;
    return data[query];
  });
}

function renderPage() {
  return render(<ReadingPage />);
}

async function goToTab(user: ReturnType<typeof userEvent.setup>, tab: TabTypeLike) {
  await user.click(screen.getByRole("button", { name: tab }));
}

type TabTypeLike = "library" | "reading" | "finished" | "community";

describe("ReadingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupQueryMocks();
  });

  it("renders review-driven tabs", () => {
    renderPage();
    for (const tab of ["library", "reading", "finished", "community"] as const) {
      expect(screen.getByRole("button", { name: tab })).toBeInTheDocument();
    }
  });

  it("shows unstarted books in Library and approved books in Finished", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("The Hobbit")).toBeInTheDocument();
    expect(screen.queryByText("Dune")).not.toBeInTheDocument();

    await goToTab(user, "finished");
    expect(screen.getByText("Charlotte's Web")).toBeInTheDocument();
  });

  it("shows pending review books in Reading tab", async () => {
    const user = userEvent.setup();
    renderPage();
    await goToTab(user, "reading");
    expect(screen.getByText("Dune")).toBeInTheDocument();
    expect(screen.queryByText("Charlotte's Web")).not.toBeInTheDocument();
  });

  it("submits a review for a new book using startReading first", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("The Hobbit"));
    const stars = screen.getAllByRole("button", { name: "★" });
    await user.click(stars[3]);
    await user.type(screen.getByPlaceholderText("Write your review..."), "Great pacing and characters.");
    await user.click(screen.getByRole("button", { name: "Submit For Approval" }));

    await waitFor(() => {
      expect(mockStartReading).toHaveBeenCalledWith({
        userId: "user_123",
        bookId: "book_1",
      });
    });
    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith({
        studentBookId: "studentBook_new",
        rating: 4,
        review: "Great pacing and characters.",
      });
    });
  });

  it("saves a draft for an existing reading item", async () => {
    const user = userEvent.setup();
    renderPage();
    await goToTab(user, "reading");
    await user.click(screen.getByText("Dune"));
    const textarea = screen.getByPlaceholderText("Write your review...");
    await user.clear(textarea);
    await user.type(textarea, "Draft update");
    await user.click(screen.getByRole("button", { name: "Save Draft" }));

    await waitFor(() => {
      expect(mockSaveReviewDraft).toHaveBeenCalledWith({
        studentBookId: "studentBook_1",
        rating: 4,
        review: "Draft update",
      });
    });
    expect(mockStartReading).not.toHaveBeenCalled();
  });

  it("shows community reviews and allows commenting", async () => {
    const user = userEvent.setup();
    renderPage();
    await goToTab(user, "community");
    expect(screen.getByText(/Alice Reader/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "View comments" }));

    expect(screen.getByText("Nice review!")).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Add a comment..."), "I agree");
    await user.click(screen.getByRole("button", { name: "Post Comment" }));

    await waitFor(() => {
      expect(mockAddReviewComment).toHaveBeenCalledWith({
        studentBookId: "studentBook_2",
        userId: "user_123",
        message: "I agree",
      });
    });
  });

  it("shows coach feedback banner for changes requested status", async () => {
    setupQueryMocks({
      "books.getStudentBooks": [
        {
          _id: "studentBook_changes",
          bookId: "book_2",
          status: "review_changes_requested",
          coachFeedback: "Add concrete examples.",
          rating: 3,
          review: "Initial pass",
          book: mockAllBooks[1],
        },
      ],
      "books.getReadingStats": { reading: 1, pendingReview: 0, approved: 0 },
      "books.getApprovedReviews": [],
    });

    const user = userEvent.setup();
    renderPage();
    await goToTab(user, "reading");
    await user.click(screen.getByText("Dune"));
    expect(screen.getByText(/Coach feedback/i)).toBeInTheDocument();
    expect(screen.getByText(/Add concrete examples\./)).toBeInTheDocument();
  });

  it("renders Book Buddy", () => {
    renderPage();
    expect(screen.getByTestId("book-buddy")).toBeInTheDocument();
  });
});
