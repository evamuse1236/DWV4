import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockStartReading = vi.fn().mockResolvedValue("studentBook_new");
const mockMarkAlreadyRead = vi.fn().mockResolvedValue("studentBook_marked");
const mockCreateStudentSubmission = vi.fn().mockResolvedValue({ bookId: "book_new" });
const mockFinishBook = vi.fn().mockResolvedValue({});
const mockSaveReviewDraft = vi.fn().mockResolvedValue({});
const mockSubmitReview = vi.fn().mockResolvedValue({});
const mockAddReviewComment = vi.fn().mockResolvedValue({});
const mockRemoveFromMyBooks = vi.fn().mockResolvedValue({});

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn((mutation: string) => {
    if (mutation === "books.startReading") return mockStartReading;
    if (mutation === "books.markAlreadyRead") return mockMarkAlreadyRead;
    if (mutation === "books.createStudentSubmission") return mockCreateStudentSubmission;
    if (mutation === "books.finishBook") return mockFinishBook;
    if (mutation === "books.saveReviewDraft") return mockSaveReviewDraft;
    if (mutation === "books.submitReview") return mockSubmitReview;
    if (mutation === "books.addReviewComment") return mockAddReviewComment;
    if (mutation === "books.removeFromMyBooks") return mockRemoveFromMyBooks;
    return vi.fn().mockResolvedValue({});
  }),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    books: {
      getAll: "books.getAll",
      getStudentBooks: "books.getStudentBooks",
      getReadingStats: "books.getReadingStats",
      getReadingHistory: "books.getReadingHistory",
      getApprovedReviews: "books.getApprovedReviews",
      getReviewComments: "books.getReviewComments",
      startReading: "books.startReading",
      markAlreadyRead: "books.markAlreadyRead",
      createStudentSubmission: "books.createStudentSubmission",
      finishBook: "books.finishBook",
      saveReviewDraft: "books.saveReviewDraft",
      submitReview: "books.submitReview",
      addReviewComment: "books.addReviewComment",
      removeFromMyBooks: "books.removeFromMyBooks",
    },
  },
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: {
      _id: "user_123",
      username: "test.student",
      displayName: "Test Student",
      role: "student",
    },
    token: "test-token",
  })),
}));

vi.mock("@/features/reading/components/LibraryBuddy", () => ({
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
    status: "reading",
    review: "Draft opening note.",
    rating: 4,
    book: mockAllBooks[1],
  },
  {
    _id: "studentBook_2",
    bookId: "book_3",
    status: "completed",
    review: "Loved it.",
    rating: 5,
    completedAt: Date.now() - 500,
    reviewSubmittedAt: Date.now() - 500,
    book: mockAllBooks[2],
  },
];

const mockApprovedReviews = [
  {
    _id: "studentBook_2",
    bookId: "book_3",
    status: "completed",
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
    "books.getReadingStats": { reading: 1, finished: 1, reviewed: 1 },
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

  it("shows unstarted books in Library and finished books in Finished", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText("The Hobbit")).toBeInTheDocument();
    expect(screen.queryByText("Dune")).not.toBeInTheDocument();

    await goToTab(user, "finished");
    expect(screen.getByText("Charlotte's Web")).toBeInTheDocument();
  });

  it("shows active reading books in Reading tab", async () => {
    const user = userEvent.setup();
    renderPage();
    await goToTab(user, "reading");
    expect(screen.getByText("Dune")).toBeInTheDocument();
    expect(screen.queryByText("Charlotte's Web")).not.toBeInTheDocument();
  });

  it("finishes a new book using startReading first", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("The Hobbit"));
    const stars = screen.getAllByRole("button", { name: "★" });
    await user.click(stars[3]);
    await user.type(screen.getByPlaceholderText("Write your review..."), "Great pacing and characters.");
    await user.click(screen.getByRole("button", { name: "Finish Book" }));

    await waitFor(() => {
      expect(mockStartReading).toHaveBeenCalledWith({
        token: "test-token",
        userId: "user_123",
        bookId: "book_1",
      });
    });
    await waitFor(() => {
      expect(mockFinishBook).toHaveBeenCalledWith({
        token: "test-token",
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
        token: "test-token",
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
        token: "test-token",
        studentBookId: "studentBook_2",
        userId: "user_123",
        message: "I agree",
      });
    });
  });

  it("lets a student share a review from a finished book", async () => {
    setupQueryMocks({
      "books.getStudentBooks": [
        {
          _id: "studentBook_finished",
          bookId: "book_2",
          status: "completed",
          rating: 3,
          review: "",
          completedAt: Date.now() - 1000,
          book: mockAllBooks[1],
        },
      ],
      "books.getReadingStats": { reading: 0, finished: 1, reviewed: 0 },
      "books.getApprovedReviews": [],
    });

    const user = userEvent.setup();
    renderPage();
    await goToTab(user, "finished");
    await user.click(screen.getByText("Dune"));
    await user.type(screen.getByPlaceholderText("Write your review..."), "Worth reading for the world-building.");
    await user.click(screen.getByRole("button", { name: "Share Review" }));

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith({
        token: "test-token",
        studentBookId: "studentBook_finished",
        rating: 3,
        review: "Worth reading for the world-building.",
      });
    });
  });

  it("renders Book Buddy", () => {
    renderPage();
    expect(screen.getByTestId("book-buddy")).toBeInTheDocument();
  });

  it("marks a library book as already read from the quick tick button", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: /mark the hobbit as already read/i }));

    await waitFor(() => {
      expect(mockMarkAlreadyRead).toHaveBeenCalledWith({
        token: "test-token",
        userId: "user_123",
        bookId: "book_1",
      });
    });
  });

  it("lets a student add a missing book and mark it as already read", async () => {
    const user = userEvent.setup();
    renderPage();

    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[1], "New Library Book");
    await user.type(textboxes[2], "New Author");
    await user.click(screen.getByRole("button", { name: /^mark already read$/i }));

    await waitFor(() => {
      expect(mockCreateStudentSubmission).toHaveBeenCalledWith({
        token: "test-token",
        userId: "user_123",
        title: "New Library Book",
        author: "New Author",
      });
    });

    await waitFor(() => {
      expect(mockMarkAlreadyRead).toHaveBeenCalledWith({
        token: "test-token",
        userId: "user_123",
        bookId: "book_new",
      });
    });
  });
});
