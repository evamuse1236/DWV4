import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";

type Personality = "luna" | "dash" | "hagrid";

interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  teaser: string;
  whyYoullLikeIt: string;
}

interface ReadingHistoryItem {
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  status: string;
}

interface AvailableBook {
  id: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  coverImageUrl?: string;
}

interface BookBuddyProps {
  readingHistory: ReadingHistoryItem[];
  availableBooks: AvailableBook[];
  onStartReading: (bookId: string) => void;
}

// Personality configuration
const personalities: Record<Personality, {
  name: string;
  icon: string;
  intro: string;  // Brief intro shown in empty state
  gradient: string;
  accentColor: string;
  bgColor: string;
}> = {
  luna: {
    name: "Luna",
    icon: "moon-icon",
    intro: "Hello, dear reader... What kind of adventure calls to you today?",
    gradient: "from-purple-300 via-indigo-200 to-blue-200",
    accentColor: "#7E22CE",
    bgColor: "#E9D5FF",
  },
  dash: {
    name: "Dash",
    icon: "bolt-icon",
    intro: "Hey!! Ready to find your next favorite book? Let's GO!",
    gradient: "from-orange-300 via-amber-200 to-yellow-200",
    accentColor: "#C2410C",
    bgColor: "#FDBA74",
  },
  hagrid: {
    name: "Hagrid",
    icon: "tree-icon",
    intro: "Well, hello there! Lookin' fer somethin' good ter read, are yeh?",
    gradient: "from-stone-400 via-amber-700/40 to-emerald-900/40",
    accentColor: "#44403C",
    bgColor: "#D6D3D1",
  },
};

// Suggested reply from AI - what the child can click to respond
interface SuggestedReply {
  label: string;     // Short label shown on chip (2-4 words)
  fullText: string;  // Full message sent when clicked
}

// Structured response from AI with dynamic suggestions
interface BuddyResponse {
  message: string;
  suggestedReplies?: SuggestedReply[];
  books?: BookRecommendation[];
}

// Default suggestions for first open (before AI responds)
const defaultSuggestions: SuggestedReply[] = [
  { label: "Something funny", fullText: "I want something funny" },
  { label: "Big adventure", fullText: "Show me adventure books" },
  { label: "Mystery", fullText: "I like mysteries" },
  { label: "Surprise me!", fullText: "Surprise me with something good!" },
];

/**
 * Parse the AI's buddy-response JSON block
 * Returns null if parsing fails (fallback to raw text)
 * Handles variations in whitespace and formatting
 */
function parseBuddyResponse(content: string): BuddyResponse | null {
  // Try multiple regex patterns to handle AI formatting variations
  const patterns = [
    /```buddy-response\s*([\s\S]*?)\s*```/,  // Flexible whitespace
    /```buddy-response\n([\s\S]*?)\n```/,     // Strict newlines
    /```buddy-response([\s\S]*?)```/,          // Minimal (no whitespace requirement)
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        const jsonStr = match[1].trim();
        return JSON.parse(jsonStr);
      } catch (e) {
        // Try next pattern
        console.warn("Failed to parse with pattern, trying next...", e);
      }
    }
  }

  // Last resort: try to find any JSON object in the content
  const jsonMatch = content.match(/\{[\s\S]*"message"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      console.warn("Failed to parse extracted JSON object");
    }
  }

  return null;
}

// Book recommendation card - larger format to show full teaser
function BookRecCard({
  book,
  personality,
  coverUrl,
  onStartReading
}: {
  book: BookRecommendation;
  personality: Personality;
  coverUrl?: string;
  onStartReading: () => void;
}) {
  const config = personalities[personality];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="book-rec-card"
      style={{
        borderColor: `${config.bgColor}80`,
      }}
      onClick={onStartReading}
    >
      {/* Cover - larger */}
      <div
        className="book-rec-cover"
        style={{
          background: coverUrl
            ? `url(${coverUrl}) center/cover`
            : `linear-gradient(135deg, ${config.bgColor}60, ${config.bgColor}90)`,
        }}
      >
        {!coverUrl && (
          <svg className="w-8 h-8 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        )}
      </div>

      {/* Info - more space for teaser */}
      <div className="book-rec-info">
        <h4 className="font-display font-bold text-[15px] leading-tight">{book.title}</h4>
        <span className="text-[11px] text-black/50">{book.author}</span>

        {/* Teaser - full display */}
        <p className="book-rec-teaser">{book.teaser}</p>

        {/* Why you'll like it */}
        {book.whyYoullLikeIt && (
          <p className="text-[10px] text-black/40 italic mt-1">{book.whyYoullLikeIt}</p>
        )}

        {/* Start button */}
        <button
          className="book-rec-start-btn"
          style={{ backgroundColor: config.accentColor }}
        >
          Start Reading
        </button>
      </div>
    </motion.div>
  );
}

/**
 * BookBuddy - AI-powered book recommendation panel
 * Simplified design: no chat history, just book cards
 * Character voice lives in the book teasers, not chat messages
 */
export function BookBuddy({
  readingHistory,
  availableBooks,
  onStartReading,
}: BookBuddyProps) {
  const [expanded, setExpanded] = useState(false);
  const [personality, setPersonality] = useState<Personality>("luna");
  const [currentBooks, setCurrentBooks] = useState<BookRecommendation[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasWaved, setHasWaved] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>(defaultSuggestions);
  const [lastRequest, setLastRequest] = useState<string>("");

  const libraryChat = useAction(api.ai.libraryChat);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = personalities[personality];

  // Focus input when panel opens
  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  // Wave animation on mount (only once)
  useEffect(() => {
    const timer = setTimeout(() => setHasWaved(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Reset books and suggestions when personality changes
  const handlePersonalityChange = (newPersonality: Personality) => {
    setPersonality(newPersonality);
    setCurrentBooks([]);  // Clear books when switching character
    setSuggestedReplies(defaultSuggestions);
    setLastRequest("");
  };

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isLoading) return;

    setInputValue("");
    setIsLoading(true);
    setLastRequest(messageText);

    try {
      // Prepare available books for AI
      const booksForAI = availableBooks.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        genre: b.genre,
        description: b.description,
      }));

      // Single-turn: just user message, no history
      const response = await libraryChat({
        messages: [{ role: "user", content: messageText }],
        personality,
        readingHistory,
        availableBooks: booksForAI,
      });

      // Try to parse as structured buddy-response JSON
      const parsed = parseBuddyResponse(response.content);

      if (parsed) {
        // AI returned proper JSON format
        setCurrentBooks(parsed.books || []);

        // Update suggested replies from AI
        if (parsed.suggestedReplies && parsed.suggestedReplies.length > 0) {
          setSuggestedReplies(parsed.suggestedReplies);
        } else {
          // Fallback if AI didn't provide suggestions
          setSuggestedReplies(defaultSuggestions);
        }
      } else {
        // JSON parsing failed - log for debugging
        console.warn("BookBuddy: Failed to parse buddy-response JSON. Raw content:", response.content.substring(0, 200));
        setSuggestedReplies(defaultSuggestions);
      }
    } catch (err) {
      console.error("BookBuddy error:", err);
      // Keep current books on error, just show error state could be added here
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle click on a suggested reply chip
  const handleChipClick = (reply: SuggestedReply) => {
    handleSend(reply.fullText);
  };

  // Get cover URL for a book recommendation
  const getCoverUrl = (bookId: string): string | undefined => {
    const book = availableBooks.find((b) => b.id === bookId);
    return book?.coverImageUrl;
  };

  // Show empty state (intro) when no books yet
  const showEmptyState = currentBooks.length === 0 && !isLoading;

  return (
    <>
      {/* Floating Bubble Trigger */}
      <motion.button
        className="book-buddy-blob"
        onClick={handleToggle}
        animate={{
          scale: hasWaved ? 1 : [1, 1.1, 1],
          rotate: hasWaved ? 0 : [0, -10, 10, 0],
        }}
        transition={{
          duration: hasWaved ? 0.2 : 1.5,
          repeat: hasWaved ? 0 : 2,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        style={{
          background: `linear-gradient(135deg, ${config.bgColor}, ${config.bgColor}aa)`,
        }}
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </motion.button>

      {/* Card Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="book-buddy-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="book-buddy-header">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: config.bgColor }}
                >
                  <svg className="w-4 h-4" fill="none" stroke={config.accentColor} strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <span className="text-[0.6rem] uppercase tracking-[0.15em] text-[#888]">
                    Book Buddy
                  </span>
                  <h3 className="font-display text-base leading-tight">{config.name}</h3>
                </div>
              </div>

              <button
                onClick={() => setExpanded(false)}
                className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Personality Toggle */}
            <div className="book-buddy-personality-toggle">
              {(["luna", "dash", "hagrid"] as Personality[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePersonalityChange(p)}
                  className={`personality-btn ${personality === p ? "active" : ""}`}
                  style={{
                    backgroundColor: personality === p ? personalities[p].bgColor : "transparent",
                    color: personality === p ? personalities[p].accentColor : "#666",
                  }}
                >
                  {personalities[p].name}
                </button>
              ))}
            </div>

            {/* Book Cards Area */}
            <div className="book-buddy-cards-area">
              {/* Loading Overlay */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    className="book-buddy-loading-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="loading-spinner">
                      <div className="flex gap-1">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <motion.span
                            key={i}
                            animate={{
                              opacity: [0.3, 1, 0.3],
                              scale: [1, 1.2, 1],
                            }}
                            transition={{
                              repeat: Infinity,
                              duration: personality === "dash" ? 0.6 : 1,
                              delay
                            }}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: config.accentColor }}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-black/50 mt-2">Finding books...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty State / Intro */}
              {showEmptyState && (
                <div className="book-buddy-empty-state">
                  <div
                    className="empty-state-avatar"
                    style={{ background: `linear-gradient(135deg, ${config.bgColor}80, ${config.bgColor})` }}
                  >
                    <svg className="w-10 h-10 opacity-60" fill="none" stroke={config.accentColor} strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <p className="empty-state-intro" style={{ color: config.accentColor }}>
                    {config.intro}
                  </p>
                  <p className="empty-state-hint">
                    Pick a topic below or type what you're looking for!
                  </p>
                </div>
              )}

              {/* Book Cards Grid */}
              {currentBooks.length > 0 && !isLoading && (
                <div className="book-buddy-cards-grid">
                  {lastRequest && (
                    <div className="last-request-label">
                      You asked for: <span>{lastRequest}</span>
                    </div>
                  )}
                  {currentBooks.map((book, idx) => (
                    <BookRecCard
                      key={`${book.id}-${idx}`}
                      book={book}
                      personality={personality}
                      coverUrl={getCoverUrl(book.id)}
                      onStartReading={() => {
                        onStartReading(book.id);
                        setExpanded(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Prompt Chips */}
            <div className="book-buddy-chips">
              {suggestedReplies.map((reply) => (
                <button
                  key={reply.label}
                  onClick={() => handleChipClick(reply)}
                  disabled={isLoading}
                  className="prompt-chip"
                  style={{
                    borderColor: `${config.accentColor}40`,
                  }}
                >
                  {reply.label}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <div className="book-buddy-input">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What kind of book do you want?"
                disabled={isLoading}
                className="flex-1"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                style={{ backgroundColor: config.accentColor }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default BookBuddy;
