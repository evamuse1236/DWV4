import { useState, useDeferredValue, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAuth } from "../../hooks/useAuth";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import { getBookBadgeClass, type BookStatus } from "../../lib/status-utils";
import BookBuddy from "../../components/reading/BookBuddy";
import { Skeleton } from "../../components/ui/skeleton";

type TabType = "library" | "reading" | "finished";
type StudentBookStatus = "reading" | "completed" | "presentation_requested" | "presented";

interface BookRecord {
  _id: Id<"books">;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  gradeLevel?: string | number;
  coverImageUrl?: string;
  readingUrl?: string;
}

interface StudentBookRecord {
  _id: Id<"studentBooks">;
  bookId: Id<"books">;
  status: StudentBookStatus;
  startedAt?: number;
  completedAt?: number;
  presentedAt?: number;
  presentationRequestedAt?: number;
  rating?: number;
  review?: string;
  book?: BookRecord | null;
}

interface ReadingStatsRecord {
  reading: number;
  pendingPresentation: number;
  presented: number;
}

interface ReadingHistoryRecord {
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  status?: string;
}

interface SelectedBook extends BookRecord {
  myBook: StudentBookRecord | null;
}

// Genre color mapping
const genreColors: Record<string, string> = {
  fiction: "pastel-purple",
  "non-fiction": "pastel-blue",
  adventure: "pastel-orange",
  fantasy: "pastel-pink",
  mystery: "pastel-green",
  science: "pastel-blue",
  biography: "pastel-yellow",
  history: "pastel-orange",
};

// SVG icon paths (extracted for reuse)
const BOOK_ICON_PATH = "M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25";
const SEARCH_ICON_PATH = "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z";
const CHECK_ICON_PATH = "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z";

/**
 * Skeleton loading state for book grids.
 * Shows 8 book card placeholders in a responsive grid.
 */
function BookGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="rounded-[30px] p-5 bg-white/40">
          <Skeleton className="w-full aspect-[3/4] rounded-xl mb-4" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Book cover image with fallback icon and lazy loading.
 * Uses native lazy loading for better performance on scroll.
 */
interface BookCoverProps {
  coverImageUrl?: string;
  className?: string;
  iconSize?: string;
}

function BookCover({ coverImageUrl, className = "w-full aspect-[3/4] rounded-xl", iconSize = "w-12 h-12" }: BookCoverProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !coverImageUrl || imgError;

  return (
    <div
      className={`${className} flex items-center justify-center overflow-hidden`}
      style={{
        background: showFallback
          ? "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.1))"
          : undefined,
      }}
    >
      {coverImageUrl && !imgError ? (
        <img
          src={coverImageUrl}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <svg className={`${iconSize} opacity-20`} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d={BOOK_ICON_PATH} />
        </svg>
      )}
    </div>
  );
}

/**
 * Star rating display
 */
interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
}

const STAR_SIZE_CLASSES = {
  sm: { text: "text-sm", gap: "gap-0.5" },
  md: { text: "text-xl", gap: "gap-1" },
  lg: { text: "text-4xl", gap: "gap-1" },
} as const;

function StarRating({ rating, size = "sm" }: StarRatingProps) {
  const { text, gap } = STAR_SIZE_CLASSES[size];
  return (
    <div className={`flex items-center ${gap}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${text} ${star <= rating ? "text-[#ca8a04]" : "text-black/10"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

/**
 * Empty state card component
 */
interface EmptyStateProps {
  icon: "book" | "search" | "check";
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  buttonVariant?: "primary" | "secondary";
}

function EmptyState({ icon, title, description, actionLabel, onAction, buttonVariant = "primary" }: EmptyStateProps) {
  const iconPath = icon === "book" ? BOOK_ICON_PATH : icon === "search" ? SEARCH_ICON_PATH : CHECK_ICON_PATH;
  
  return (
    <div className="glass-card p-12 text-center">
      <svg className="w-16 h-16 mx-auto opacity-20 mb-6" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
      <h3 className="font-display text-[2rem] italic mb-3">{title}</h3>
      <p className="font-body opacity-60 mb-6">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className={`btn btn-${buttonVariant}`}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Reading Library Page - Paper UI Design
 * Browse books and track reading progress
 */
export function ReadingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("library");
  const [selectedBook, setSelectedBook] = useState<SelectedBook | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Deferred value for search - prevents jank during rapid typing
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Get all books
  const allBooks = useQuery(api.books.getAll) as BookRecord[] | undefined;

  // Get student's books
  const myBooks = useQuery(
    api.books.getStudentBooks,
    user ? { userId: user._id as any } : "skip"
  ) as StudentBookRecord[] | undefined;

  // Get reading stats
  const readingStats = useQuery(
    api.books.getReadingStats,
    user ? { userId: user._id as any } : "skip"
  ) as ReadingStatsRecord | undefined;

  // Get reading history for Book Buddy AI
  const readingHistory = useQuery(
    api.books.getReadingHistory,
    user ? { userId: user._id as any } : "skip"
  ) as ReadingHistoryRecord[] | undefined;

  // Mutations
  const startReading = useMutation(api.books.startReading);
  const updateStatus = useMutation(api.books.updateStatus);
  const addReview = useMutation(api.books.addReview);
  const removeFromMyBooks = useMutation(api.books.removeFromMyBooks);

  const handleStartReading = async (
    bookId: Id<"books">
  ): Promise<Id<"studentBooks"> | null> => {
    if (!user) return null;
    try {
      const studentBookId = await startReading({
        userId: user._id as any,
        bookId: bookId as any,
      });
      return studentBookId as Id<"studentBooks">;
    } catch (error) {
      console.error("Failed to start reading:", error);
      return null;
    }
  };

  const handleRemoveBook = async (studentBookId: Id<"studentBooks">) => {
    try {
      await removeFromMyBooks({ studentBookId: studentBookId as any });
    } catch (error) {
      console.error("Failed to remove book:", error);
    }
  };

  const handleOpenReviewForm = (existingRating?: number, existingReview?: string) => {
    setReviewRating(existingRating || 0);
    setReviewText(existingReview || "");
    setShowReviewForm(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBook?.myBook?._id || reviewRating === 0) return;
    
    setIsSubmittingReview(true);
    try {
      await addReview({
        studentBookId: selectedBook.myBook._id as any,
        rating: reviewRating,
        review: reviewText || undefined,
      });
      setShowReviewForm(false);
      // Update the selected book with new review data
      setSelectedBook({
        ...selectedBook,
        myBook: {
          ...selectedBook.myBook,
          rating: reviewRating,
          review: reviewText,
        },
      });
    } catch (error) {
      console.error("Failed to submit review:", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const updateSelectedBookStatus = (
    status: StudentBookStatus,
    studentBookId: Id<"studentBooks">
  ) => {
    setSelectedBook((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        myBook: {
          ...(prev.myBook ?? { book: prev }),
          _id: studentBookId,
          bookId: prev._id,
          status,
          startedAt: prev.myBook?.startedAt ?? Date.now(),
          presentationRequestedAt:
            status === "presentation_requested"
              ? Date.now()
              : prev.myBook?.presentationRequestedAt,
          book: prev,
        },
      };
    });
  };

  const handleRead = (book: SelectedBook) => {
    if (!book.readingUrl) return;
    window.open(book.readingUrl, "_blank", "noopener,noreferrer");
    if (!book.myBook) {
      void handleStartReading(book._id).then((studentBookId) => {
        if (!studentBookId) return;
        updateSelectedBookStatus("reading", studentBookId);
      });
    }
  };

  const handleRequestPresentation = async (book: SelectedBook) => {
    let studentBookId = book.myBook?._id ?? null;
    if (!studentBookId) {
      studentBookId = await handleStartReading(book._id);
    }
    if (!studentBookId) return;

    await updateStatus({
      studentBookId: studentBookId as any,
      status: "presentation_requested",
    });
    updateSelectedBookStatus("presentation_requested", studentBookId);
  };

  // Create a map of user's books for quick lookup
  const myBooksMap = useMemo(
    () =>
      new Map<Id<"books">, StudentBookRecord>(
        (myBooks ?? []).map((mb) => [mb.bookId, mb])
      ),
    [myBooks]
  );

  // Delayed skeleton - only show if loading takes >200ms to avoid flash
  const allBooksLoading = allBooks === undefined;
  const myBooksLoading = myBooks === undefined;
  const showAllBooksSkeleton = useDelayedLoading(allBooksLoading);
  const showMyBooksSkeleton = useDelayedLoading(myBooksLoading);

  // Get genre color class
  const getGenreColor = (genre: string) => {
    const key = genre?.toLowerCase() || "";
    for (const [genreKey, colorClass] of Object.entries(genreColors)) {
      if (key.includes(genreKey)) return colorClass;
    }
    return "pastel-blue";
  };

  // Filter books by search query (uses deferred value for smoother typing)
  const filterBooks = (
    books: Array<BookRecord | StudentBookRecord> | undefined,
    isMyBooks = false
  ) => {
    if (!books) return [];
    if (!deferredSearchQuery.trim()) return books;

    const query = deferredSearchQuery.toLowerCase();
    return books.filter((item) => {
      const book = isMyBooks
        ? (item as StudentBookRecord).book
        : (item as BookRecord);
      const title = (book?.title || "").toLowerCase();
      const author = (book?.author || "").toLowerCase();
      const genre = (book?.genre || "").toLowerCase();
      return title.includes(query) || author.includes(query) || genre.includes(query);
    });
  };

  // Library tab: books NOT in myBooks (not started yet)
  const libraryBooks = filterBooks(
    allBooks?.filter((book) => !myBooksMap.has(book._id)),
    false
  );
  
  // Reading tab: books with status "reading", "completed" (legacy), or "presentation_requested"
  const readingBooks = filterBooks(
    myBooks?.filter((item) =>
      item.status === "reading" || item.status === "completed" || item.status === "presentation_requested"
    ),
    true
  );
  
  // Finished tab: books with status "presented"
  const finishedBooks = filterBooks(
    myBooks?.filter((item) => item.status === "presented"),
    true
  );

  return (
    <div>
      {/* Header */}
      <div className="fade-in-up text-center mb-10">
        <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] block mb-3 font-body">
          The Library
        </span>
        <h1 className="text-[4rem] m-0 leading-none">Reading Journeys</h1>
      </div>

      {/* Stats Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="fade-in-up delay-1 mb-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.4))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.9)",
          borderRadius: "40px",
          padding: "50px",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)",
            opacity: 0.5,
          }}
        />

        <h2 className="font-display text-[28px] italic text-[#555] mb-8 relative z-10">
          My Reading Journey
        </h2>

        <div className="flex justify-center gap-12 relative z-10">
          <div>
            <span className="font-display text-[56px] block leading-none text-[#ca8a04]">
              {readingStats?.reading || 0}
            </span>
            <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888]">Reading</span>
          </div>
          <div className="w-px h-[70px] bg-black/10" />
          <div>
            <span className="font-display text-[56px] block leading-none text-[#7c3aed]">
              {readingStats?.pendingPresentation || 0}
            </span>
            <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888]">Pending</span>
          </div>
          <div className="w-px h-[70px] bg-black/10" />
          <div>
            <span className="font-display text-[56px] block leading-none text-[#15803d]">
              {readingStats?.presented || 0}
            </span>
            <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888]">Finished</span>
          </div>
        </div>
      </motion.div>

      {/* Search and Tab Navigation */}
      <div className="fade-in-up delay-2 mb-8">
        {/* Search Input */}
        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#888]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by title, author, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-full bg-white/60 backdrop-blur-sm border border-white/60 font-body text-sm placeholder:text-[#888] focus:outline-none focus:ring-2 focus:ring-black/10"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 p-1.5 bg-white/50 rounded-full w-fit mx-auto backdrop-blur-sm border border-white/60">
          {(["library", "reading", "finished"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-body transition-all ${
                activeTab === tab
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666] hover:text-[#1a1a1a]"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Library Tab - Books not yet started */}
        {activeTab === "library" && (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fade-in-up delay-3"
          >
            {/* Show skeleton while books are loading (delayed to avoid flash) */}
            {showAllBooksSkeleton ? (
              <BookGridSkeleton />
            ) : allBooksLoading ? null : libraryBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {libraryBooks.map((book, index: number) => {
                  const libraryBook = book as BookRecord;
                  const genreColor = getGenreColor(libraryBook.genre || "");

                  return (
                    <motion.button
                      type="button"
                      key={libraryBook._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`pastel-card ${genreColor} p-5 cursor-pointer relative overflow-hidden border-0 text-left`}
                      onClick={() => setSelectedBook({ ...libraryBook, myBook: null })}
                      aria-label={`Open ${libraryBook.title}`}
                    >
                      <BookCover coverImageUrl={libraryBook.coverImageUrl} className="w-full aspect-[3/4] rounded-xl mb-4" />

                      <h3 className="font-display text-[18px] leading-tight mb-1 line-clamp-2">
                        {libraryBook.title}
                      </h3>
                      <p className="font-body text-xs opacity-60 mb-2">{libraryBook.author}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        {libraryBook.genre && (
                          <span className="text-[9px] uppercase tracking-[0.1em] opacity-50 bg-black/5 px-2 py-0.5 rounded-full">
                            {libraryBook.genre}
                          </span>
                        )}
                        {libraryBook.gradeLevel && (
                          <span className="text-[9px] uppercase tracking-[0.1em] opacity-50 bg-black/5 px-2 py-0.5 rounded-full">
                            Grade {libraryBook.gradeLevel}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <EmptyState
                icon="search"
                title="No Results"
                description={`No books match "${searchQuery}"`}
                actionLabel="Clear Search"
                onAction={() => setSearchQuery("")}
                buttonVariant="secondary"
              />
            ) : (
              <EmptyState
                icon="book"
                title="All Caught Up!"
                description="You've started all available books. Check the Reading tab!"
              />
            )}
          </motion.div>
        )}

        {/* Reading Tab - Books in progress or pending presentation */}
        {activeTab === "reading" && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fade-in-up delay-3"
          >
            {showMyBooksSkeleton ? (
              <BookGridSkeleton />
            ) : myBooksLoading ? null : readingBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {readingBooks.map((item, index: number) => {
                  const readingBook = item as StudentBookRecord;
                  const genreColor = getGenreColor(readingBook.book?.genre || "");
                  const isPending =
                    readingBook.status === "presentation_requested" ||
                    readingBook.status === "completed";

                  return (
                    <motion.div
                      key={readingBook._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`pastel-card ${genreColor} p-5 cursor-pointer relative overflow-hidden group border-0 text-left`}
                      onClick={() =>
                        readingBook.book
                          ? setSelectedBook({ ...readingBook.book, myBook: readingBook })
                          : null
                      }
                      onKeyDown={(e) => {
                        if (!readingBook.book) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedBook({ ...readingBook.book, myBook: readingBook });
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open ${readingBook.book?.title || "book"}`}
                    >
                      {/* Remove button (X) - visible on hover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBook(readingBook._id);
                        }}
                        className="absolute top-2 left-2 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity
                                   bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6
                                    flex items-center justify-center text-sm font-bold shadow-md"
                        title="Remove from My Books"
                        aria-label={`Remove ${readingBook.book?.title || "book"} from My Books`}
                      >
                        ×
                      </button>

                      {/* Status badge */}
                      <div className="absolute top-4 right-4">
                        <span
                          className={`text-[8px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full ${getBookBadgeClass(readingBook.status as BookStatus)}`}
                        >
                          {isPending ? "Pending" : "Reading"}
                        </span>
                      </div>

                      <BookCover coverImageUrl={readingBook.book?.coverImageUrl} className="w-full aspect-[3/4] rounded-xl mb-4" />

                      <h3 className="font-display text-[18px] leading-tight mb-1 line-clamp-2">
                        {readingBook.book?.title || "Unknown"}
                      </h3>
                      <p className="font-body text-xs opacity-60">{readingBook.book?.author || "Unknown"}</p>

                      {readingBook.rating && <StarRating rating={readingBook.rating} size="sm" />}
                    </motion.div>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <EmptyState
                icon="search"
                title="No Results"
                description={`No books match "${searchQuery}"`}
                actionLabel="Clear Search"
                onAction={() => setSearchQuery("")}
                buttonVariant="secondary"
              />
            ) : (
              <EmptyState
                icon="book"
                title="No Books Yet"
                description="Start reading books from the library!"
                actionLabel="Browse Library"
                onAction={() => setActiveTab("library")}
              />
            )}
          </motion.div>
        )}

        {/* Finished Tab - Coach-approved books */}
        {activeTab === "finished" && (
          <motion.div
            key="finished"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fade-in-up delay-3"
          >
            {showMyBooksSkeleton ? (
              <BookGridSkeleton />
            ) : myBooksLoading ? null : finishedBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {finishedBooks.map((item, index: number) => {
                  const finishedBook = item as StudentBookRecord;
                  const genreColor = getGenreColor(finishedBook.book?.genre || "");

                  return (
                    <motion.button
                      type="button"
                      key={finishedBook._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`pastel-card ${genreColor} p-5 cursor-pointer relative overflow-hidden border-0 text-left`}
                      onClick={() =>
                        finishedBook.book
                          ? setSelectedBook({ ...finishedBook.book, myBook: finishedBook })
                          : null
                      }
                      aria-label={`Open ${finishedBook.book?.title || "book"}`}
                    >
                      {/* Finished badge */}
                      <div className="absolute top-4 right-4">
                        <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-[#15803d]/20 text-[#15803d]">
                          Finished
                        </span>
                      </div>

                      <BookCover coverImageUrl={finishedBook.book?.coverImageUrl} className="w-full aspect-[3/4] rounded-xl mb-4" />

                      <h3 className="font-display text-[18px] leading-tight mb-1 line-clamp-2">
                        {finishedBook.book?.title || "Unknown"}
                      </h3>
                      <p className="font-body text-xs opacity-60">{finishedBook.book?.author || "Unknown"}</p>

                      {finishedBook.rating && <StarRating rating={finishedBook.rating} size="sm" />}
                    </motion.button>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <EmptyState
                icon="search"
                title="No Results"
                description={`No finished books match "${searchQuery}"`}
                actionLabel="Clear Search"
                onAction={() => setSearchQuery("")}
                buttonVariant="secondary"
              />
            ) : (
              <EmptyState
                icon="check"
                title="No Finished Books Yet"
                description="Complete your readings and get coach approval to see them here!"
                actionLabel="View Reading"
                onAction={() => setActiveTab("reading")}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* How It Works */}
      <div className="fade-in-up delay-4 mt-16 max-w-[600px] mx-auto">
        <div className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] text-center mb-10 font-body">
          The Reading Journey
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(5px)" }}
            >
              <svg className="w-7 h-7 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h4 className="font-display text-[18px] mb-1">Read</h4>
            <p className="font-body text-xs opacity-50">Pick a book and enjoy!</p>
          </div>
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(5px)" }}
            >
              <svg className="w-7 h-7 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-display text-[18px] mb-1">Finish</h4>
            <p className="font-body text-xs opacity-50">Request to present</p>
          </div>
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(5px)" }}
            >
              <svg className="w-7 h-7 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <h4 className="font-display text-[18px] mb-1">Complete</h4>
            <p className="font-body text-xs opacity-50">Coach approves!</p>
          </div>
        </div>
      </div>

      {/* Book Detail Modal Overlay */}
      <AnimatePresence>
        {selectedBook && !showReviewForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(235, 241, 255, 0.95)" }}
            onClick={() => setSelectedBook(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card p-10 max-w-[600px] w-full max-h-[80vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelectedBook(null)}
                className="absolute top-6 right-6 opacity-40 hover:opacity-100 transition-opacity"
                aria-label="Close details"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex gap-6">
                <BookCover coverImageUrl={selectedBook.coverImageUrl} className="w-36 h-52 rounded-2xl flex-shrink-0" iconSize="w-16 h-16" />

                <div className="flex-1">
                  <h2 className="font-display text-[2rem] leading-tight mb-1">
                    {selectedBook.title}
                  </h2>
                  <p className="font-body opacity-60 mb-4">by {selectedBook.author}</p>

                  <div className="flex gap-2 flex-wrap mb-4">
                    {selectedBook.genre && (
                      <span className="text-[10px] uppercase tracking-[0.1em] bg-black/5 px-3 py-1 rounded-full">
                        {selectedBook.genre}
                      </span>
                    )}
                    {selectedBook.gradeLevel && (
                      <span className="text-[10px] uppercase tracking-[0.1em] bg-black/5 px-3 py-1 rounded-full">
                        Grade {selectedBook.gradeLevel}
                      </span>
                    )}
                  </div>

                  {selectedBook.myBook?.rating && (
                    <div className="flex items-center gap-2 mb-4">
                      <StarRating rating={selectedBook.myBook.rating} size="md" />
                      <button
                        type="button"
                        onClick={() => handleOpenReviewForm(selectedBook.myBook.rating, selectedBook.myBook.review)}
                        className="text-xs opacity-50 hover:opacity-100 transition-opacity underline"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedBook.description && (
                <div className="mt-6">
                  <h3 className="font-display text-lg mb-2">About this book</h3>
                  <p className="font-body text-sm opacity-70 leading-relaxed">
                    {selectedBook.description}
                  </p>
                </div>
              )}

              {/* Review section */}
              {selectedBook.myBook?.review && (
                <div className="mt-6 p-4 bg-black/5 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-display text-lg">My Review</h3>
                    <button
                      type="button"
                      onClick={() => handleOpenReviewForm(selectedBook.myBook.rating, selectedBook.myBook.review)}
                      className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                      aria-label="Edit review"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  </div>
                  <p className="font-body text-sm opacity-70 italic">
                    "{selectedBook.myBook.review}"
                  </p>
                </div>
              )}

              {/* Actions - Simplified: Read and Finish buttons */}
              <div className="mt-8 space-y-3">
                {/* Read button - opens book URL and auto-starts if not started */}
                {selectedBook.readingUrl && (
                  <button
                    type="button"
                    className="w-full btn btn-primary"
                    onClick={() => handleRead(selectedBook)}
                  >
                    Read
                  </button>
                )}

                {/* Show Finish button for not-started or reading status */}
                {(!selectedBook.myBook || selectedBook.myBook?.status === "reading") && (
                  <button
                    type="button"
                    onClick={async () => {
                      await handleRequestPresentation(selectedBook);
                    }}
                    className="w-full btn btn-secondary"
                  >
                    Finish
                  </button>
                )}

                {/* Pending presentation status */}
                {(selectedBook.myBook?.status === "presentation_requested" || selectedBook.myBook?.status === "completed") && (
                  <div className="p-6 bg-[#7c3aed]/5 rounded-2xl text-center">
                    <div className="text-[40px] mb-2">🙋</div>
                    <span className="text-[#7c3aed] font-display italic text-lg">
                      Waiting for coach approval...
                    </span>
                    <p className="font-body text-sm opacity-60 mt-2">
                      Your presentation request is pending
                    </p>
                  </div>
                )}

                {/* Finished status */}
                {selectedBook.myBook?.status === "presented" && (
                  <>
                    {!selectedBook.myBook.rating && (
                      <button
                        type="button"
                        onClick={() => handleOpenReviewForm()}
                        className="w-full btn btn-secondary mb-3"
                      >
                        Add Rating & Review
                      </button>
                    )}
                    <div className="p-6 bg-[#15803d]/5 rounded-2xl text-center">
                      <div className="text-[40px] mb-2">✨</div>
                      <span className="text-[#15803d] font-display italic text-lg">
                        You've completed this book journey!
                      </span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Form Overlay */}
      <AnimatePresence>
        {showReviewForm && selectedBook?.myBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(253, 245, 208, 0.95)" }}
            onClick={() => setShowReviewForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-[500px] p-10 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-display italic text-[2rem] mb-2">
                {selectedBook.myBook.rating ? "Edit Your Review" : "Rate & Review"}
              </h2>
              <p className="font-body opacity-60 mb-8">{selectedBook.title}</p>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="text-4xl transition-transform hover:scale-110"
                  >
                    <span className={star <= reviewRating ? "text-[#ca8a04]" : "text-black/20"}>
                      ★
                    </span>
                  </button>
                ))}
              </div>

              {/* Review Text */}
              <div className="mb-8">
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="What did you think about this book? (optional)"
                  className="w-full bg-transparent border-none outline-none resize-none text-center font-display text-[20px] leading-[1.4] italic text-[#333] placeholder:text-black/30"
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-center gap-8">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="bg-transparent border-none text-[14px] opacity-50 text-[#1a1a1a] cursor-pointer hover:opacity-100 transition-opacity"
                  disabled={isSubmittingReview}
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleSubmitReview}
                  disabled={reviewRating === 0 || isSubmittingReview}
                  className="btn btn-primary disabled:opacity-50"
                  style={{ padding: "16px 48px" }}
                >
                  {isSubmittingReview ? "SAVING..." : "SAVE REVIEW"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Buddy AI Chat */}
      {allBooks && (
        <BookBuddy
          readingHistory={readingHistory || []}
          availableBooks={
            allBooks
              .filter((book) => !myBooksMap.has(book._id))
              .map((book) => ({
                id: book._id,
                title: book.title,
                author: book.author,
                genre: book.genre,
                description: book.description,
                coverImageUrl: book.coverImageUrl,
              }))
          }
          onStartReading={(bookId) => {
            void handleStartReading(bookId as Id<"books">);
            setActiveTab("reading");
          }}
          disabled={Boolean(selectedBook || showReviewForm)}
        />
      )}
    </div>
  );
}

export default ReadingPage;
