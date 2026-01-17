import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { getBookBadgeClass, type BookStatus } from "../../lib/status-utils";
import BookBuddy from "../../components/reading/BookBuddy";

type TabType = "library" | "reading" | "finished";

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
 * Book cover image with fallback icon
 */
interface BookCoverProps {
  coverImageUrl?: string;
  className?: string;
  iconSize?: string;
}

function BookCover({ coverImageUrl, className = "w-full aspect-[3/4] rounded-xl", iconSize = "w-12 h-12" }: BookCoverProps) {
  return (
    <div
      className={`${className} flex items-center justify-center`}
      style={{
        background: coverImageUrl
          ? `url(${coverImageUrl})`
          : "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.1))",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {!coverImageUrl && (
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

function StarRating({ rating, size = "sm" }: StarRatingProps) {
  const sizeClass = size === "sm" ? "text-sm" : size === "md" ? "text-xl" : "text-4xl";
  return (
    <div className={`flex items-center ${size === "sm" ? "gap-0.5" : "gap-1"}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${sizeClass} ${star <= rating ? "text-[#ca8a04]" : "text-black/10"}`}
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
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Get all books
  const allBooks = useQuery(api.books.getAll);

  // Get student's books
  const myBooks = useQuery(
    api.books.getStudentBooks,
    user ? { userId: user._id as any } : "skip"
  );

  // Get reading stats
  const readingStats = useQuery(
    api.books.getReadingStats,
    user ? { userId: user._id as any } : "skip"
  );

  // Get reading history for Book Buddy AI
  const readingHistory = useQuery(
    api.books.getReadingHistory,
    user ? { userId: user._id as any } : "skip"
  );

  // Mutations
  const startReading = useMutation(api.books.startReading);
  const updateStatus = useMutation(api.books.updateStatus);
  const addReview = useMutation(api.books.addReview);
  const removeFromMyBooks = useMutation(api.books.removeFromMyBooks);

  const handleStartReading = async (bookId: string): Promise<string | null> => {
    if (!user) return null;
    try {
      const studentBookId = await startReading({
        userId: user._id as any,
        bookId: bookId as any,
      });
      return studentBookId;
    } catch (error) {
      console.error("Failed to start reading:", error);
      return null;
    }
  };

  const handleRemoveBook = async (studentBookId: string) => {
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

  // Create a map of user's books for quick lookup
  interface StudentBook {
    _id: string;
    bookId: string;
    status: "reading" | "completed" | "presentation_requested" | "presented";
    rating?: number;
    review?: string;
    book?: any;
  }
  const myBooksMap = new Map<string, StudentBook>(
    myBooks?.map((mb: any) => [mb.bookId, mb]) || []
  );

  // Get genre color class
  const getGenreColor = (genre: string) => {
    const key = genre?.toLowerCase() || "";
    for (const [genreKey, colorClass] of Object.entries(genreColors)) {
      if (key.includes(genreKey)) return colorClass;
    }
    return "pastel-blue";
  };

  // Filter books by search query
  const filterBooks = (books: any[] | undefined, isMyBooks = false) => {
    if (!books) return [];
    if (!searchQuery.trim()) return books;

    const query = searchQuery.toLowerCase();
    return books.filter((item: any) => {
      const book = isMyBooks ? item.book : item;
      const title = (book?.title || "").toLowerCase();
      const author = (book?.author || "").toLowerCase();
      const genre = (book?.genre || "").toLowerCase();
      return title.includes(query) || author.includes(query) || genre.includes(query);
    });
  };

  // Library tab: books NOT in myBooks (not started yet)
  const libraryBooks = filterBooks(
    allBooks?.filter((book: any) => !myBooksMap.has(book._id)),
    false
  );
  
  // Reading tab: books with status "reading", "completed" (legacy), or "presentation_requested"
  const readingBooks = filterBooks(
    myBooks?.filter((item: any) => 
      item.status === "reading" || item.status === "completed" || item.status === "presentation_requested"
    ),
    true
  );
  
  // Finished tab: books with status "presented"
  const finishedBooks = filterBooks(
    myBooks?.filter((item: any) => item.status === "presented"),
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
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity"
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
              {tab === "library" && "Library"}
              {tab === "reading" && "Reading"}
              {tab === "finished" && "Finished"}
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
            {libraryBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {libraryBooks.map((book: any, index: number) => {
                  const genreColor = getGenreColor(book.genre);

                  return (
                    <motion.div
                      key={book._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`pastel-card ${genreColor} p-5 cursor-pointer relative overflow-hidden`}
                      onClick={() => setSelectedBook({ ...book, myBook: null })}
                    >
                      <BookCover coverImageUrl={book.coverImageUrl} className="w-full aspect-[3/4] rounded-xl mb-4" />

                      <h3 className="font-display text-[18px] leading-tight mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="font-body text-xs opacity-60 mb-2">{book.author}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        {book.genre && (
                          <span className="text-[9px] uppercase tracking-[0.1em] opacity-50 bg-black/5 px-2 py-0.5 rounded-full">
                            {book.genre}
                          </span>
                        )}
                        {book.gradeLevel && (
                          <span className="text-[9px] uppercase tracking-[0.1em] opacity-50 bg-black/5 px-2 py-0.5 rounded-full">
                            Grade {book.gradeLevel}
                          </span>
                        )}
                      </div>
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
            {readingBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {readingBooks.map((item: any, index: number) => {
                  const genreColor = getGenreColor(item.book?.genre);
                  const isPending = item.status === "presentation_requested" || item.status === "completed";

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`pastel-card ${genreColor} p-5 cursor-pointer relative overflow-hidden group`}
                      onClick={() => setSelectedBook({ ...item.book, myBook: item })}
                    >
                      {/* Remove button (X) - visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBook(item._id);
                        }}
                        className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity
                                   bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6
                                   flex items-center justify-center text-sm font-bold shadow-md"
                        title="Remove from My Books"
                      >
                        ×
                      </button>

                      {/* Status badge */}
                      <div className="absolute top-4 right-4">
                        <span
                          className={`text-[8px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full ${getBookBadgeClass(item.status as BookStatus)}`}
                        >
                          {isPending ? "Pending" : "Reading"}
                        </span>
                      </div>

                      <BookCover coverImageUrl={item.book?.coverImageUrl} className="w-full aspect-[3/4] rounded-xl mb-4" />

                      <h3 className="font-display text-[18px] leading-tight mb-1 line-clamp-2">
                        {item.book?.title || "Unknown"}
                      </h3>
                      <p className="font-body text-xs opacity-60">{item.book?.author || "Unknown"}</p>

                      {item.rating && <StarRating rating={item.rating} size="sm" />}
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
            {finishedBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {finishedBooks.map((item: any, index: number) => {
                  const genreColor = getGenreColor(item.book?.genre);

                  return (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`pastel-card ${genreColor} p-5 cursor-pointer relative overflow-hidden`}
                      onClick={() => setSelectedBook({ ...item.book, myBook: item })}
                    >
                      {/* Finished badge */}
                      <div className="absolute top-4 right-4">
                        <span className="text-[8px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-[#15803d]/20 text-[#15803d]">
                          Finished
                        </span>
                      </div>

                      <BookCover coverImageUrl={item.book?.coverImageUrl} className="w-full aspect-[3/4] rounded-xl mb-4" />

                      <h3 className="font-display text-[18px] leading-tight mb-1 line-clamp-2">
                        {item.book?.title || "Unknown"}
                      </h3>
                      <p className="font-body text-xs opacity-60">{item.book?.author || "Unknown"}</p>

                      {item.rating && <StarRating rating={item.rating} size="sm" />}
                    </motion.div>
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
                onClick={() => setSelectedBook(null)}
                className="absolute top-6 right-6 opacity-40 hover:opacity-100 transition-opacity"
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
                      onClick={() => handleOpenReviewForm(selectedBook.myBook.rating, selectedBook.myBook.review)}
                      className="text-xs opacity-50 hover:opacity-100 transition-opacity"
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
                  <a
                    href={selectedBook.readingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    onClick={() => {
                      // Auto-start reading when opening book
                      if (!selectedBook.myBook) {
                        handleStartReading(selectedBook._id);
                        // Update local state
                        setSelectedBook({
                          ...selectedBook,
                          myBook: {
                            _id: "pending",
                            status: "reading",
                            startedAt: Date.now(),
                          },
                        });
                      }
                    }}
                  >
                    <button className="w-full btn btn-primary">
                      Read
                    </button>
                  </a>
                )}

                {/* Show Finish button for not-started or reading status */}
                {(!selectedBook.myBook || selectedBook.myBook?.status === "reading") && (
                  <button
                    onClick={async () => {
                      let studentBookId = selectedBook.myBook?._id;
                      
                      // If not started, start reading first and get the new ID
                      if (!selectedBook.myBook) {
                        studentBookId = await handleStartReading(selectedBook._id);
                      }
                      
                      // Then request presentation using the ID
                      if (studentBookId) {
                        await updateStatus({
                          studentBookId: studentBookId as any,
                          status: "presentation_requested",
                        });
                        // Update local state
                        setSelectedBook({
                          ...selectedBook,
                          myBook: {
                            _id: studentBookId,
                            status: "presentation_requested",
                            presentationRequestedAt: Date.now(),
                          },
                        });
                      }
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
                  onClick={() => setShowReviewForm(false)}
                  className="bg-transparent border-none text-[14px] opacity-50 text-[#1a1a1a] cursor-pointer hover:opacity-100 transition-opacity"
                  disabled={isSubmittingReview}
                >
                  CANCEL
                </button>
                <button
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
              .filter((book: any) => !myBooksMap.has(book._id))
              .map((book: any) => ({
                id: book._id,
                title: book.title,
                author: book.author,
                genre: book.genre,
                description: book.description,
                coverImageUrl: book.coverImageUrl,
              }))
          }
          onStartReading={(bookId) => {
            handleStartReading(bookId);
            setActiveTab("reading");
          }}
        />
      )}
    </div>
  );
}

export default ReadingPage;
