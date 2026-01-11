import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import {
  getBookIndicatorColor,
  getBookBadgeClass,
  type BookStatus,
} from "../../lib/status-utils";

type TabType = "all" | "my-books";

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

/**
 * Reading Library Page - Paper UI Design
 * Browse books and track reading progress
 */
export function ReadingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Mutations
  const startReading = useMutation(api.books.startReading);
  const updateStatus = useMutation(api.books.updateStatus);

  const handleStartReading = async (bookId: string) => {
    if (!user) return;
    await startReading({
      userId: user._id as any,
      bookId: bookId as any,
    });
    setSelectedBook(null);
  };

  const handleMarkComplete = async (studentBookId: string) => {
    await updateStatus({
      studentBookId: studentBookId as any,
      status: "completed",
    });
  };

  const handleMarkPresented = async (studentBookId: string) => {
    await updateStatus({
      studentBookId: studentBookId as any,
      status: "presented",
    });
  };

  // Create a map of user's books for quick lookup
  interface StudentBook {
    _id: string;
    bookId: string;
    status: "reading" | "completed" | "presented";
    rating?: number;
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

  const filteredAllBooks = filterBooks(allBooks, false);
  const filteredMyBooks = filterBooks(myBooks, true);

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
            <span className="font-display text-[56px] block leading-none text-[#15803d]">
              {readingStats?.completed || 0}
            </span>
            <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888]">Completed</span>
          </div>
          <div className="w-px h-[70px] bg-black/10" />
          <div>
            <span className="font-display text-[56px] block leading-none text-[#7c3aed]">
              {readingStats?.presented || 0}
            </span>
            <span className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888]">Presented</span>
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
          {(["all", "my-books"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full text-sm font-body transition-all ${
                activeTab === tab
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666] hover:text-[#1a1a1a]"
              }`}
            >
              {tab === "all" && "All Books"}
              {tab === "my-books" && "My Books"}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* All Books Tab */}
        {activeTab === "all" && (
          <motion.div
            key="all"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fade-in-up delay-3"
          >
            {filteredAllBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredAllBooks.map((book: any, index: number) => {
                  const myBook = myBooksMap.get(book._id);
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
                      onClick={() => setSelectedBook({ ...book, myBook })}
                    >
                      {/* Status indicator */}
                      {myBook && (
                        <div className="absolute top-4 right-4">
                          <div
                            className={`w-3 h-3 rounded-full ${getBookIndicatorColor(myBook.status as BookStatus)}`}
                          />
                        </div>
                      )}

                      {/* Book cover placeholder */}
                      <div
                        className="w-full aspect-[3/4] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden"
                        style={{
                          background: book.coverImageUrl
                            ? `url(${book.coverImageUrl})`
                            : "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.1))",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {!book.coverImageUrl && (
                          <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        )}
                      </div>

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
              <div className="glass-card p-12 text-center">
                <svg className="w-16 h-16 mx-auto opacity-20 mb-6" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <h3 className="font-display text-[2rem] italic mb-3">No Results</h3>
                <p className="font-body opacity-60 mb-4">
                  No books match "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="btn btn-secondary"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <svg className="w-16 h-16 mx-auto opacity-20 mb-6" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                <h3 className="font-display text-[2rem] italic mb-3">No Books Yet</h3>
                <p className="font-body opacity-60">
                  Your coach will add books to the library soon!
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* My Books Tab */}
        {activeTab === "my-books" && (
          <motion.div
            key="my-books"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fade-in-up delay-3"
          >
            {filteredMyBooks.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredMyBooks.map((item: any, index: number) => {
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
                      {/* Status badge */}
                      <div className="absolute top-4 right-4">
                        <span
                          className={`text-[8px] font-bold uppercase tracking-[0.1em] px-2 py-1 rounded-full ${getBookBadgeClass(item.status as BookStatus)}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {/* Book cover */}
                      <div
                        className="w-full aspect-[3/4] rounded-xl mb-4 flex items-center justify-center"
                        style={{
                          background: item.book?.coverImageUrl
                            ? `url(${item.book.coverImageUrl})`
                            : "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.1))",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {!item.book?.coverImageUrl && (
                          <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        )}
                      </div>

                      <h3 className="font-display text-[18px] leading-tight mb-1 line-clamp-2">
                        {item.book?.title || "Unknown"}
                      </h3>
                      <p className="font-body text-xs opacity-60">{item.book?.author || "Unknown"}</p>

                      {/* Rating stars */}
                      {item.rating && (
                        <div className="flex items-center gap-0.5 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-sm ${
                                star <= item.rating ? "text-[#ca8a04]" : "text-black/10"
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <div className="glass-card p-12 text-center">
                <svg className="w-16 h-16 mx-auto opacity-20 mb-6" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <h3 className="font-display text-[2rem] italic mb-3">No Results</h3>
                <p className="font-body opacity-60 mb-4">
                  No books in your collection match "{searchQuery}"
                </p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="btn btn-secondary"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="glass-card p-12 text-center">
                <svg className="w-16 h-16 mx-auto opacity-20 mb-6" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
                <h3 className="font-display text-[2rem] italic mb-3">No Books Yet</h3>
                <p className="font-body opacity-60 mb-6">
                  Start reading books from the library!
                </p>
                <button
                  onClick={() => setActiveTab("all")}
                  className="btn btn-primary"
                >
                  Browse Library
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* How It Works */}
      <div className="fade-in-up delay-4 mt-16 max-w-[800px] mx-auto">
        <div className="text-[0.75rem] uppercase tracking-[0.2em] text-[#888] text-center mb-10 font-body">
          The Reading Journey
        </div>

        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(5px)" }}
            >
              <svg className="w-7 h-7 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h4 className="font-display text-[18px] mb-1">Choose</h4>
            <p className="font-body text-xs opacity-50">Pick something interesting</p>
          </div>
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(5px)" }}
            >
              <svg className="w-7 h-7 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="font-display text-[18px] mb-1">Read</h4>
            <p className="font-body text-xs opacity-50">Take your time, enjoy!</p>
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
            <h4 className="font-display text-[18px] mb-1">Complete</h4>
            <p className="font-body text-xs opacity-50">Finished? Check it off!</p>
          </div>
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(5px)" }}
            >
              <svg className="w-7 h-7 opacity-50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h4 className="font-display text-[18px] mb-1">Present</h4>
            <p className="font-body text-xs opacity-50">Share with your class</p>
          </div>
        </div>
      </div>

      {/* Book Detail Modal Overlay */}
      <AnimatePresence>
        {selectedBook && (
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
              className="glass-card p-10 max-w-[600px] w-full max-h-[80vh] overflow-y-auto"
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
                {/* Book cover */}
                <div
                  className="w-36 h-52 rounded-2xl flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: selectedBook.coverImageUrl
                      ? `url(${selectedBook.coverImageUrl})`
                      : "linear-gradient(135deg, rgba(0,0,0,0.05), rgba(0,0,0,0.1))",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!selectedBook.coverImageUrl && (
                    <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  )}
                </div>

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

                  {/* Rating */}
                  {selectedBook.myBook?.rating && (
                    <div className="flex items-center gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-xl ${
                            star <= selectedBook.myBook.rating
                              ? "text-[#ca8a04]"
                              : "text-black/10"
                          }`}
                        >
                          ★
                        </span>
                      ))}
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

              {/* Actions */}
              <div className="mt-8 space-y-3">
                {!selectedBook.myBook && (
                  <button
                    onClick={() => handleStartReading(selectedBook._id)}
                    className="w-full btn btn-primary"
                  >
                    Start Reading This Book
                  </button>
                )}

                {selectedBook.myBook?.status === "reading" && (
                  <>
                    {selectedBook.readingUrl && (
                      <a
                        href={selectedBook.readingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <button className="w-full btn btn-secondary">
                          Open Book
                        </button>
                      </a>
                    )}
                    <button
                      onClick={() => handleMarkComplete(selectedBook.myBook._id)}
                      className="w-full btn btn-primary"
                    >
                      I Finished Reading!
                    </button>
                  </>
                )}

                {selectedBook.myBook?.status === "completed" && (
                  <button
                    onClick={() => handleMarkPresented(selectedBook.myBook._id)}
                    className="w-full btn btn-primary"
                  >
                    I Presented to My Class!
                  </button>
                )}

                {selectedBook.myBook?.status === "presented" && (
                  <div className="p-6 bg-[#15803d]/5 rounded-2xl text-center">
                    <div className="text-[40px] mb-2">✨</div>
                    <span className="text-[#15803d] font-display italic text-lg">
                      You've completed this book journey!
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ReadingPage;
