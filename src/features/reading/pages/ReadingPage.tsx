import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { bookStatusConfig, getBookBadgeClass, type BookStatus } from "@/shared/lib/status-utils";
import LibraryBuddy from "@/features/reading/components/LibraryBuddy";

type TabType = "library" | "reading" | "finished" | "community";
type StudentBookStatus =
  | "reading"
  | "already_read"
  | "completed"
  | "review_draft"
  | "review_submitted"
  | "review_changes_requested"
  | "review_approved"
  | "presentation_requested"
  | "presented";

type BookRecord = {
  _id: Id<"books">;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  coverImageUrl?: string;
  readingUrl?: string;
  source?: "seed" | "admin" | "student";
  libraryStatus?: "draft" | "curated";
  needsAdminReview?: boolean;
};

type StudentBookRecord = {
  _id: Id<"studentBooks">;
  bookId: Id<"books">;
  status: StudentBookStatus;
  review?: string;
  rating?: number;
  coachFeedback?: string;
  completedAt?: number;
  reviewSubmittedAt?: number;
  reviewApprovedAt?: number;
  book?: BookRecord | null;
};

type SelectedBook = BookRecord & { myBook: StudentBookRecord | null };

const DONE_STATUSES = new Set<StudentBookStatus>([
  "already_read",
  "completed",
  "review_submitted",
  "review_changes_requested",
  "review_approved",
  "presentation_requested",
  "presented",
]);

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-[#ca8a04]" : "text-black/20"}>
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(timestamp?: number) {
  if (!timestamp) return "Unknown";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function BookCover({
  title,
  coverImageUrl,
  variant = "grid",
}: {
  title: string;
  coverImageUrl?: string;
  variant?: "grid" | "modal";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(coverImageUrl) && !imageFailed;
  const sizeClass = variant === "modal" ? "h-[360px] md:h-[440px]" : "h-44";
  const wrapperClass = variant === "modal" ? "" : "mb-3";

  return (
    <div className={`${wrapperClass} ${sizeClass} w-full overflow-hidden rounded-xl bg-gradient-to-br from-[var(--color-pastel-orange)] via-[var(--color-pastel-purple)] to-[var(--color-pastel-green)]`}>
      {showImage ? (
        <img
          src={coverImageUrl}
          alt={`${title} cover`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-4xl">📚</div>
      )}
    </div>
  );
}

export function ReadingPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("library");
  const [handledDeepLink, setHandledDeepLink] = useState(false);
  const [optimisticBookIds, setOptimisticBookIds] = useState<Set<Id<"books">>>(new Set());
  const [removedBookIds, setRemovedBookIds] = useState<Set<Id<"books">>>(new Set());
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null);
  const [activeReviewId, setActiveReviewId] = useState<Id<"studentBooks"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [missingBookTitle, setMissingBookTitle] = useState("");
  const [missingBookAuthor, setMissingBookAuthor] = useState("");
  const [isSavingMissingBook, setIsSavingMissingBook] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const allBooks = useQuery(api.books.getAll) as BookRecord[] | undefined;
  const myBooks = useQuery(api.books.getStudentBooks, user && token ? { token, userId: user._id as any } : "skip") as StudentBookRecord[] | undefined;
  const readingStats = useQuery(api.books.getReadingStats, user && token ? { token, userId: user._id as any } : "skip") as
    | { reading: number; finished?: number; reviewed?: number; approved?: number; presented?: number }
    | undefined;
  const approvedReviews = useQuery(api.books.getApprovedReviews) as Array<StudentBookRecord & { user?: any }> | undefined;
  const readingHistory = useQuery(api.books.getReadingHistory, user && token ? { token, userId: user._id as any } : "skip") as
    | Array<{ title: string; author: string; genre?: string; rating?: number; status?: string }>
    | undefined;
  const reviewComments = useQuery(
    api.books.getReviewComments,
    activeReviewId ? { studentBookId: activeReviewId as any } : "skip"
  ) as Array<{ _id: Id<"bookReviewComments">; message: string; createdAt: number; user?: any }> | undefined;

  const startReading = useMutation(api.books.startReading);
  const markAlreadyRead = useMutation(api.books.markAlreadyRead);
  const createStudentSubmission = useMutation(api.books.createStudentSubmission);
  const finishBook = useMutation(api.books.finishBook);
  const saveReviewDraft = useMutation(api.books.saveReviewDraft);
  const submitReview = useMutation(api.books.submitReview);
  const addReviewComment = useMutation(api.books.addReviewComment);
  const removeFromMyBooks = useMutation(api.books.removeFromMyBooks);

  const myBooksMap = useMemo(() => new Map((myBooks || []).map((b) => [b.bookId, b])), [myBooks]);

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const filterText = (text?: string) => (text || "").toLowerCase().includes(normalizedQuery);
  const visibleLibrary = (allBooks || []).filter((book) => !myBooksMap.has(book._id) && !optimisticBookIds.has(book._id) && !removedBookIds.has(book._id)).filter((book) =>
    !normalizedQuery || filterText(book.title) || filterText(book.author) || filterText(book.genre)
  );
  const optimisticReadingItems: StudentBookRecord[] = (allBooks || [])
    .filter((book) => optimisticBookIds.has(book._id) && !myBooksMap.has(book._id) && !removedBookIds.has(book._id))
    .map((book) => ({
      _id: `optimistic-${book._id}` as unknown as Id<"studentBooks">,
      bookId: book._id,
      status: "reading" as StudentBookStatus,
      book,
    }));
  const visibleReading = [...optimisticReadingItems, ...(myBooks || [])]
    .filter((book) => !removedBookIds.has(book.bookId))
    .filter((book) => !DONE_STATUSES.has(book.status))
    .filter((book) => !normalizedQuery || filterText(book.book?.title) || filterText(book.book?.author) || filterText(book.book?.genre));
  const visibleFinished = (myBooks || [])
    .filter((book) => !removedBookIds.has(book.bookId))
    .filter((book) => DONE_STATUSES.has(book.status))
    .filter((book) => !normalizedQuery || filterText(book.book?.title) || filterText(book.book?.author));
  const visibleCommunity = (approvedReviews || []).filter(
    (review) =>
      !normalizedQuery ||
      filterText(review.book?.title) ||
      filterText(review.book?.author) ||
      filterText(review.review) ||
      filterText(review.user?.displayName)
  );

  const finishedCount = readingStats?.finished ?? readingStats?.approved ?? readingStats?.presented ?? 0;
  const reviewedCount = readingStats?.reviewed ?? 0;
  const selectedCommunityReview = (approvedReviews || []).find((review) => review._id === activeReviewId) || null;
  const hasMissingBookDraft = missingBookTitle.trim().length > 0 && missingBookAuthor.trim().length > 0;

  const openBook = (book: BookRecord) => {
    const myBook = myBooksMap.get(book._id) || null;
    setSelectedBook({ ...book, myBook });
    setReviewText(myBook?.review || "");
    setReviewRating(myBook?.rating || 0);
  };

  useEffect(() => {
    if (handledDeepLink) return;
    if (typeof window === "undefined") {
      setHandledDeepLink(true);
      return;
    }

    const url = new URL(window.location.href);
    const openBookId = url.searchParams.get("openBook");
    if (!openBookId) {
      setHandledDeepLink(true);
      return;
    }
    if (!allBooks) return;

    const linkedBook = allBooks.find((book) => String(book._id) === openBookId);
    if (linkedBook) {
      setActiveTab("library");
      openBook(linkedBook);
    }

    url.searchParams.delete("openBook");
    url.searchParams.delete("view");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
    setHandledDeepLink(true);
  }, [handledDeepLink, allBooks, openBook]);

  const ensureBookStarted = async () => {
    if (!selectedBook || !user || !token) return null;
    if (selectedBook.myBook?._id) return selectedBook.myBook._id;
    const studentBookId = (await startReading({ token, userId: user._id as any, bookId: selectedBook._id as any })) as Id<"studentBooks">;
    setSelectedBook((prev) =>
      prev
        ? { ...prev, myBook: { _id: studentBookId, bookId: prev._id, status: "reading", book: prev } as StudentBookRecord }
        : prev
    );
    return studentBookId;
  };

  const handleMarkAlreadyRead = async (book: BookRecord) => {
    if (!user || !token) return;
    setRemovedBookIds((previous) => new Set(previous).add(book._id));
    const studentBookId = (await markAlreadyRead({
      token,
      userId: user._id as any,
      bookId: book._id as any,
    })) as Id<"studentBooks">;

    setSelectedBook((previous) =>
      previous && previous._id === book._id
        ? {
            ...previous,
            myBook: {
              _id: studentBookId,
              bookId: book._id,
              status: "already_read",
              review: previous.myBook?.review,
              rating: previous.myBook?.rating,
              completedAt: Date.now(),
              book,
            },
          }
        : previous
    );
    setActiveTab("finished");
  };

  const handleCreateMissingBook = async (mode: "reading" | "already_read") => {
    if (!user || !token || !hasMissingBookDraft || isSavingMissingBook) return;

    setIsSavingMissingBook(true);
    try {
      const result = (await createStudentSubmission({
        token,
        userId: user._id as any,
        title: missingBookTitle.trim(),
        author: missingBookAuthor.trim(),
      })) as { bookId: Id<"books"> };

      if (mode === "reading") {
        setOptimisticBookIds((previous) => new Set(previous).add(result.bookId));
        await startReading({ token, userId: user._id as any, bookId: result.bookId as any });
        setActiveTab("reading");
      } else {
        setRemovedBookIds((previous) => new Set(previous).add(result.bookId));
        await markAlreadyRead({ token, userId: user._id as any, bookId: result.bookId as any });
        setActiveTab("finished");
      }

      setMissingBookTitle("");
      setMissingBookAuthor("");
    } finally {
      setIsSavingMissingBook(false);
    }
  };

  const onSaveDraft = async () => {
    const studentBookId = await ensureBookStarted();
    if (!studentBookId || !selectedBook || !token) return;
    await saveReviewDraft({ token, studentBookId: studentBookId as any, rating: reviewRating || undefined, review: reviewText });
    setSelectedBook((prev) =>
      prev && prev.myBook
        ? { ...prev, myBook: { ...prev.myBook, status: prev.myBook.status === "reading" ? "review_draft" : prev.myBook.status, rating: reviewRating || undefined, review: reviewText } }
        : prev
    );
  };

  const onSubmitReview = async () => {
    const text = reviewText.trim();
    if (!text) return;
    if (!token || !selectedBook?.myBook?._id || !selectedBook) return;
    if (!DONE_STATUSES.has(selectedBook.myBook.status)) return;
    await submitReview({
      token,
      studentBookId: selectedBook.myBook._id as any,
      rating: reviewRating || undefined,
      review: text,
    });
    setSelectedBook((prev) =>
      prev && prev.myBook
        ? {
            ...prev,
            myBook: {
              ...prev.myBook,
              status: prev.myBook.status === "presented" ? "presented" : "completed",
              review: text,
              rating: reviewRating || undefined,
              reviewSubmittedAt: Date.now(),
              completedAt: prev.myBook.completedAt ?? Date.now(),
            },
          }
        : prev
    );
  };

  const onFinishBook = async () => {
    const studentBookId = await ensureBookStarted();
    if (!studentBookId || !selectedBook || !token) return;
    await finishBook({
      token,
      studentBookId: studentBookId as any,
      rating: reviewRating || undefined,
      review: reviewText || undefined,
    });
    setSelectedBook((prev) =>
      prev
        ? {
            ...prev,
            myBook: {
              ...(prev.myBook ?? { _id: studentBookId, bookId: prev._id, status: "completed" as StudentBookStatus, book: prev }),
              status: "completed",
              review: reviewText || undefined,
              rating: reviewRating || undefined,
              reviewSubmittedAt: reviewText.trim() ? Date.now() : prev.myBook?.reviewSubmittedAt,
              completedAt: Date.now(),
            },
          }
        : prev
    );
    setActiveTab("finished");
    setSelectedBook(null);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-[3rem]">Reading Journeys</h1>
        <p className="opacity-60">Read, finish books freely, and share a review at the end if you want.</p>
      </div>

      <div className="glass-card p-6 mb-8 flex justify-center gap-12 text-center">
        <div><div className="text-4xl text-[#ca8a04]">{readingStats?.reading || 0}</div><div className="text-xs uppercase opacity-60">Reading</div></div>
        <div><div className="text-4xl text-[#15803d]">{finishedCount}</div><div className="text-xs uppercase opacity-60">Finished</div></div>
        <div><div className="text-4xl text-[#0f766e]">{reviewedCount}</div><div className="text-xs uppercase opacity-60">Shared Reviews</div></div>
      </div>

      <div className="mb-6">
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search books or reviews..."
          className="w-full max-w-md mx-auto block rounded-full border px-4 py-2 bg-white/70"
        />
      </div>

      <details className="glass-card group mb-6 max-w-3xl mx-auto overflow-hidden">
        <summary className="flex cursor-pointer items-center justify-between gap-3 p-5 list-none [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-sm font-semibold text-[var(--color-espresso)]">
              Can&apos;t find your book? Add it
            </p>
            <p className="text-sm opacity-60">
              Just the title and author — an admin fills in the rest later.
            </p>
          </div>
          <span
            aria-hidden
            className="shrink-0 text-[var(--color-taupe)] transition-transform group-open:rotate-45"
          >
            ＋
          </span>
        </summary>
        <div className="flex flex-col gap-3 px-5 pb-5">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={missingBookTitle}
              onChange={(event) => setMissingBookTitle(event.target.value)}
              placeholder="Book title"
              className="rounded-2xl border px-4 py-3 bg-white/80"
            />
            <input
              value={missingBookAuthor}
              onChange={(event) => setMissingBookAuthor(event.target.value)}
              placeholder="Author"
              className="rounded-2xl border px-4 py-3 bg-white/80"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              className="btn btn-secondary whitespace-nowrap disabled:opacity-50"
              disabled={!token || !hasMissingBookDraft || isSavingMissingBook}
              onClick={() => void handleCreateMissingBook("reading")}
            >
              Add To Reading
            </button>
            <button
              className="btn btn-primary whitespace-nowrap disabled:opacity-50"
              disabled={!token || !hasMissingBookDraft || isSavingMissingBook}
              onClick={() => void handleCreateMissingBook("already_read")}
            >
              Mark Already Read
            </button>
          </div>
        </div>
      </details>

      <div className="flex gap-2 mb-6">
        {(["library", "reading", "finished", "community"] as TabType[]).map((tab) => (
          <button
            key={tab}
            className={`btn capitalize ${activeTab === tab ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "library" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleLibrary.map((book) => (
            <div key={book._id} className="pastel-card p-4 relative group">
              <button
                aria-label={`Mark ${book.title} as already read`}
                className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full bg-[var(--color-card-active)]/95 border border-[var(--color-divider)] text-sm font-semibold text-[var(--color-espresso)] shadow-sm opacity-95 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-all hover:bg-[var(--color-pastel-green)]"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleMarkAlreadyRead(book);
                }}
              >
                ✓
              </button>
              <button className="text-left w-full" onClick={() => openBook(book)}>
                <BookCover title={book.title} coverImageUrl={book.coverImageUrl} />
                <p className="font-semibold">{book.title}</p>
                <p className="text-xs opacity-60">{book.author}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {book.genre ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-black/5 text-black/55 uppercase tracking-wider">
                      {book.genre}
                    </span>
                  ) : null}
                  {book.libraryStatus === "draft" || book.needsAdminReview ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-pastel-orange)] text-[var(--color-espresso)] uppercase tracking-wider">
                      Needs details
                    </span>
                  ) : null}
                  {book.source === "student" ? (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-pastel-blue)] text-[var(--color-espresso)] uppercase tracking-wider">
                      Student added
                    </span>
                  ) : null}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "reading" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleReading.map((item) => (
            <div key={item._id} className="pastel-card p-4 relative group">
              <button
                aria-label="Remove book"
                className="absolute top-2 right-2 z-10 h-10 w-10 min-h-[2.5rem] min-w-[2.5rem] rounded-full bg-[var(--color-card-active)]/95 border border-[var(--color-divider)] text-[var(--color-espresso)] text-xl leading-none flex items-center justify-center shadow-sm opacity-95 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 hover:bg-red-100 hover:text-red-600 active:bg-red-200 transition-all"
                onClick={async (event) => {
                  event.stopPropagation();
                  if (!token) return;
                  setRemovedBookIds((previous) => new Set(previous).add(item.bookId));
                  setOptimisticBookIds((previous) => {
                    if (!previous.has(item.bookId)) return previous;
                    const next = new Set(previous);
                    next.delete(item.bookId);
                    return next;
                  });
                  if (!String(item._id).startsWith("optimistic-")) {
                    await removeFromMyBooks({ token, studentBookId: item._id as any });
                  }
                }}
              >
                ×
              </button>
              <button className="text-left w-full" onClick={() => (item.book ? openBook(item.book) : null)}>
                <BookCover title={item.book?.title || "Unknown"} coverImageUrl={item.book?.coverImageUrl} />
                <p className="font-semibold">{item.book?.title || "Unknown"}</p>
                <p className="text-xs opacity-60">{item.book?.author || "Unknown"}</p>
                <span className={`text-[10px] px-2 py-1 rounded-full ${getBookBadgeClass(item.status as BookStatus)}`}>
                  {bookStatusConfig[item.status as BookStatus]?.label || item.status}
                </span>
              </button>
            </div>
          ))}
        </div>
      )}

      {activeTab === "finished" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleFinished.map((item) => (
            <button key={item._id} className="pastel-card p-4 text-left" onClick={() => (item.book ? openBook(item.book) : null)}>
              <BookCover title={item.book?.title || "Unknown"} coverImageUrl={item.book?.coverImageUrl} />
              <p className="font-semibold">{item.book?.title || "Unknown"}</p>
              <p className="text-xs opacity-60">{item.book?.author || "Unknown"}</p>
              <div className="mt-2">
                <span className={`text-[10px] px-2 py-1 rounded-full ${getBookBadgeClass(item.status as BookStatus)}`}>
                  {bookStatusConfig[item.status as BookStatus]?.label || item.status}
                </span>
              </div>
              {item.rating ? <StarRating rating={item.rating} /> : null}
            </button>
          ))}
        </div>
      )}

      {activeTab === "community" && (
        <div className="space-y-4">
          {visibleCommunity.map((review) => (
            <div key={review._id} className="glass-card p-5">
              <p className="font-semibold">{review.book?.title || "Unknown Book"} · {review.user?.displayName || "Student"}</p>
              {review.rating ? <StarRating rating={review.rating} /> : null}
              <p className="text-sm mt-2 whitespace-pre-wrap">{review.review}</p>
              <button className="btn btn-secondary mt-3" onClick={() => setActiveReviewId(review._id)}>View comments</button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedBook && (
          <motion.div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 md:p-6 flex items-center justify-center" onClick={() => setSelectedBook(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="relative bg-[var(--color-canvas)] rounded-[var(--radius-xl)] shadow-[var(--glass-shadow)] border border-[var(--glass-border)] w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()} initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}>
              {/* Close button */}
              <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-divider)] hover:bg-[var(--color-add-btn)] transition-colors text-[var(--color-taupe)] hover:text-[var(--color-espresso)] text-lg">&times;</button>

              <div className="flex flex-col md:flex-row">
                {/* Portrait cover */}
                <div className="flex-shrink-0 md:w-[280px] p-6 pb-0 md:p-8 md:pr-0">
                  <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-black/5">
                    <BookCover title={selectedBook.title} coverImageUrl={selectedBook.coverImageUrl} variant="modal" />
                  </div>
                  {selectedBook.genre && (
                    <p className="mt-3 text-center text-xs font-medium uppercase tracking-wider text-black/40">{selectedBook.genre}</p>
                  )}
                </div>

                {/* Details & review controls */}
                <div className="flex-1 min-w-0 p-6 md:p-8 space-y-5">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">{selectedBook.title}</h2>
                    <p className="text-lg text-[var(--color-taupe)] mt-1">by {selectedBook.author}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedBook.genre ? (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-black/5 text-black/55 uppercase tracking-wider">
                          {selectedBook.genre}
                        </span>
                      ) : null}
                      {selectedBook.libraryStatus === "draft" || selectedBook.needsAdminReview ? (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-[var(--color-pastel-orange)] text-[var(--color-espresso)] uppercase tracking-wider">
                          Details still being filled in
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Read Book button */}
                  <div className="flex flex-wrap gap-3">
                    {selectedBook.readingUrl ? (
                      <button
                        className="btn btn-primary inline-flex items-center gap-2"
                        onClick={async () => {
                          if (!selectedBook || !user || !token) return;
                          const book = selectedBook;
                          window.open(book.readingUrl, "_blank", "noopener,noreferrer");
                          const alreadyStarted = Boolean(book.myBook?._id);
                          if (!alreadyStarted) {
                            setOptimisticBookIds((prev) => new Set(prev).add(book._id));
                          }
                          setRemovedBookIds((previous) => {
                            if (!previous.has(book._id)) return previous;
                            const next = new Set(previous);
                            next.delete(book._id);
                            return next;
                          });
                          setActiveTab("reading");
                          setSelectedBook(null);
                          if (!alreadyStarted) {
                            await startReading({ token, userId: user._id as any, bookId: book._id as any });
                          }
                        }}
                      >
                        <span className="text-lg">📖</span> Read Book
                      </button>
                    ) : null}
                    {(!selectedBook.myBook || !DONE_STATUSES.has(selectedBook.myBook.status)) ? (
                      <button
                        className="btn btn-secondary inline-flex items-center gap-2"
                        onClick={() => void handleMarkAlreadyRead(selectedBook)}
                      >
                        <span className="text-lg">✓</span> Mark Already Read
                      </button>
                    ) : null}
                  </div>

                  {/* Status banners */}
                  {selectedBook.myBook && DONE_STATUSES.has(selectedBook.myBook.status) ? (
                    <div className="p-3 rounded-xl bg-[var(--color-pastel-green)] border border-[var(--color-divider)] text-[var(--color-espresso)] text-sm">
                      {selectedBook.myBook.status === "already_read"
                        ? "Marked as already read. You can still leave a review later if you want to share it."
                        : reviewText.trim()
                          ? "Finished. Your review is saved and visible in Community."
                          : "Finished. Add a review anytime if you want to share your thoughts."}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-[var(--color-pastel-blue)] border border-[var(--color-divider)] text-[var(--color-espresso)] text-sm">
                      Start reading when you're ready, or mark it as already read if you finished it before adding it here.
                    </div>
                  )}

                  {/* Star rating */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-taupe)] mb-1.5">Your Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewRating(star)} className={`text-2xl transition-colors ${star <= reviewRating ? "text-[#ca8a04]" : "text-[var(--color-add-btn)] hover:text-[var(--color-taupe)]"}`}>&#9733;</button>
                      ))}
                    </div>
                  </div>

                  {/* Review textarea */}
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider text-[var(--color-taupe)] mb-1.5">Your Review</label>
                    <textarea className="w-full border border-[var(--color-divider)] rounded-xl p-3 min-h-[160px] bg-white/50 focus:bg-white focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-colors outline-none resize-y" value={reviewText} onChange={(event) => setReviewText(event.target.value)} placeholder="Write your review..." />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-1">
                    {!selectedBook.myBook || !DONE_STATUSES.has(selectedBook.myBook.status) ? (
                      <>
                        <button className="btn btn-secondary flex-1" onClick={onSaveDraft}>Save Draft</button>
                        <button className="btn btn-primary flex-1" onClick={onFinishBook}>Finish Book</button>
                      </>
                    ) : (
                      <button className="btn btn-primary flex-1 disabled:opacity-50" onClick={onSubmitReview} disabled={!reviewText.trim()}>
                        {selectedBook.myBook.review?.trim() ? "Update Review" : "Share Review"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeReviewId && selectedCommunityReview && (
          <motion.div className="fixed inset-0 z-50 bg-black/50 p-6 flex items-center justify-center" onClick={() => setActiveReviewId(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(event) => event.stopPropagation()} initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}>
              <h3 className="text-2xl font-semibold">{selectedCommunityReview.book?.title}</h3>
              <p className="text-sm opacity-60 mb-2">by {selectedCommunityReview.user?.displayName || "Student"}</p>
              <p className="text-sm whitespace-pre-wrap mb-4">{selectedCommunityReview.review}</p>
              <h4 className="font-semibold mb-2">Comments</h4>
              <div className="space-y-2 mb-3">
                {(reviewComments || []).length === 0 ? <p className="text-sm opacity-60">No comments yet.</p> : null}
                {(reviewComments || []).map((comment) => (
                  <div key={comment._id} className="rounded border p-3">
                    <p className="text-xs opacity-60">{comment.user?.displayName || "Student"} · {formatDate(comment.createdAt)}</p>
                    <p className="text-sm">{comment.message}</p>
                  </div>
                ))}
              </div>
              <textarea className="w-full border rounded-lg p-3 min-h-[90px]" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment..." />
              <button
                className="btn btn-primary mt-3 disabled:opacity-50"
                disabled={!commentText.trim() || !user || !token}
                onClick={async () => {
                  if (!user || !token || !activeReviewId || !commentText.trim()) return;
                  await addReviewComment({ token, studentBookId: activeReviewId as any, userId: user._id as any, message: commentText });
                  setCommentText("");
                }}
              >
                Post Comment
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {allBooks ? (
        <LibraryBuddy
          userId={user ? (user._id as string) : null}
          kidName={user?.displayName}
          readingHistory={(readingHistory || []).map((item) => ({ ...item, status: item.status || "unknown" }))}
          availableBooks={(allBooks || [])
            .filter((book) => !myBooksMap.has(book._id))
            .map((book) => ({ id: book._id, title: book.title, author: book.author, genre: book.genre, description: book.description, coverImageUrl: book.coverImageUrl }))}
          onStartReading={(bookId) => {
            if (!user || !token) return;
            void startReading({ token, userId: user._id as any, bookId: bookId as any });
            setActiveTab("reading");
          }}
          disabled={Boolean(selectedBook || activeReviewId) || !token}
        />
      ) : null}
    </div>
  );
}

export default ReadingPage;
