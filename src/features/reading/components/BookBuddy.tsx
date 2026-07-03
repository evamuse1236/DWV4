import { useEffect, useRef, useState } from "react";
import { useAction } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@convex/_generated/api";

type Personality = "luna" | "dash" | "hagrid";
type GuideStepKey = "genre" | "pace" | "novelty";

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
  token: string | null;
  readingHistory: ReadingHistoryItem[];
  availableBooks: AvailableBook[];
  onStartReading: (bookId: string) => void;
  disabled?: boolean;
}

interface SuggestedReply {
  label: string;
  fullText: string;
}

interface BuddyResponse {
  message: string;
  suggestedReplies?: SuggestedReply[];
  books?: BookRecommendation[];
}

interface GuideChoice {
  label: string;
  value: string;
  fullText: string;
}

type GuideAnswers = Partial<Record<GuideStepKey, GuideChoice>>;

const PERSONALITY_ORDER: Personality[] = ["luna", "dash", "hagrid"];

const personalities: Record<
  Personality,
  {
    name: string;
    symbol: string;
    intro: string;
    accentColor: string;
    bgColor: string;
  }
> = {
  luna: {
    name: "Luna",
    symbol: "☽",
    intro: "Let's narrow it down gently and find something that actually feels right.",
    accentColor: "#7E22CE",
    bgColor: "#E9D5FF",
  },
  dash: {
    name: "Dash",
    symbol: "⚡",
    intro: "Quick picks, better filters, no random repeats.",
    accentColor: "#C2410C",
    bgColor: "#FDBA74",
  },
  hagrid: {
    name: "Hagrid",
    symbol: "🌿",
    intro: "We'll pick a few clues first, then I'll look for a proper match.",
    accentColor: "#44403C",
    bgColor: "#D6D3D1",
  },
};

const guideSteps: Array<{
  key: GuideStepKey;
  title: string;
  subtitle: string;
  choices: GuideChoice[];
}> = [
  {
    key: "genre",
    title: "What sounds good?",
    subtitle: "Start with the kind of story or subject you want most.",
    choices: [
      { label: "Funny fiction", value: "fiction", fullText: "I want funny fiction" },
      { label: "Something funny", value: "fiction", fullText: "I want funny fiction" },
      { label: "Adventure", value: "adventure", fullText: "I want adventure books" },
      { label: "Mystery", value: "mystery", fullText: "Show me mystery books" },
      { label: "Real-world", value: "realworld", fullText: "I want real-world books" },
      { label: "Surprise me", value: "surprise", fullText: "Surprise me with a good unread book" },
    ],
  },
  {
    key: "pace",
    title: "How should it feel?",
    subtitle: "Pick the reading energy you want right now.",
    choices: [
      { label: "Fast", value: "fast", fullText: "Make it fast and gripping" },
      { label: "Cozy", value: "cozy", fullText: "Make it cozy and gentle" },
      { label: "Thoughtful", value: "thoughtful", fullText: "Make it thoughtful" },
      { label: "Any pace", value: "any", fullText: "Any pace is fine" },
    ],
  },
  {
    key: "novelty",
    title: "Familiar or fresh?",
    subtitle: "We can stay close to your favorites or mix in a new flavor.",
    choices: [
      { label: "Familiar", value: "familiar", fullText: "Keep it close to what I already like" },
      { label: "Mix it up", value: "mix", fullText: "Mix my favorites with something new" },
      { label: "Fresh pick", value: "fresh", fullText: "Give me something fresher" },
    ],
  },
];

const defaultReplies: SuggestedReply[] = [
  { label: "More fiction", fullText: "Show me more fiction please" },
  { label: "Try a surprise", fullText: "Give me a fresher surprise pick" },
  { label: "Different mood", fullText: "Let's try a different mood" },
];

function parseBuddyResponse(content: string): BuddyResponse | null {
  const patterns = [
    /```buddy-response\s*([\s\S]*?)\s*```/,
    /```buddy-response\n([\s\S]*?)\n```/,
    /```buddy-response([\s\S]*?)```/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (!match) continue;
    try {
      return JSON.parse(match[1].trim());
    } catch {
      continue;
    }
  }

  return null;
}

function hasRecommendationLanguage(text: string) {
  return /\b(book|books|read|reading|recommend|recommendation|fiction|mystery|adventure|funny|surprise)\b/i.test(
    text
  );
}

function buildGuidePrompt(answers: GuideAnswers, freeText?: string) {
  const parts = [
    answers.genre?.fullText,
    answers.pace?.fullText,
    answers.novelty?.fullText,
    freeText?.trim(),
  ].filter(Boolean);
  return parts.join(". ");
}

function buildPreferenceProfile(answers: GuideAnswers, freeText?: string) {
  return {
    genre: answers.genre?.value,
    vibe: answers.genre?.value,
    pace: answers.pace?.value,
    novelty: (answers.novelty?.value ?? "mix") as "familiar" | "mix" | "fresh",
    freeText: freeText?.trim() || undefined,
  };
}

function BookRecCard({
  book,
  personality,
  coverUrl,
  onStartReading,
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
      style={{ borderColor: `${config.bgColor}80` }}
      onClick={onStartReading}
      role="button"
      tabIndex={0}
      onKeyDown={(event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onStartReading();
        }
      }}
    >
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

      <div className="book-rec-info">
        <h4 className="font-display font-bold text-[15px] leading-tight">{book.title}</h4>
        <span className="text-[11px] text-black/50">{book.author}</span>
        <p className="book-rec-teaser">{book.teaser}</p>
        {book.whyYoullLikeIt ? (
          <p className="text-[10px] text-black/40 italic mt-1">{book.whyYoullLikeIt}</p>
        ) : null}
        <button type="button" className="book-rec-start-btn" style={{ backgroundColor: config.accentColor }}>
          Start Reading
        </button>
      </div>
    </motion.div>
  );
}

export function BookBuddy({
  token,
  readingHistory,
  availableBooks,
  onStartReading,
  disabled,
}: BookBuddyProps) {
  const [expanded, setExpanded] = useState(false);
  const [personality, setPersonality] = useState<Personality>("luna");
  const [currentBooks, setCurrentBooks] = useState<BookRecommendation[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasWaved, setHasWaved] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<SuggestedReply[]>(defaultReplies);
  const [lastRequest, setLastRequest] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guideAnswers, setGuideAnswers] = useState<GuideAnswers>({});
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const libraryChat = useAction(api.ai.libraryChat);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const config = personalities[personality];
  const currentStep = guideSteps[Math.min(activeStepIndex, guideSteps.length - 1)];
  const guideComplete = guideSteps.every((step) => Boolean(guideAnswers[step.key]));

  useEffect(() => {
    if (expanded) {
      inputRef.current?.focus();
    }
  }, [expanded]);

  useEffect(() => {
    const timer = setTimeout(() => setHasWaved(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (disabled) {
      setExpanded(false);
    }
  }, [disabled]);

  const resetGuide = (clearResults = false) => {
    setGuideAnswers({});
    setActiveStepIndex(0);
    if (clearResults) {
      setCurrentBooks([]);
      setAiMessage("");
      setErrorMessage(null);
      setSuggestedReplies(defaultReplies);
      setLastRequest("");
    }
  };

  const handlePersonalityChange = (newPersonality: Personality) => {
    setPersonality(newPersonality);
    resetGuide(true);
    setInputValue("");
  };

  const cyclePersonality = () => {
    const currentIndex = PERSONALITY_ORDER.indexOf(personality);
    const next = PERSONALITY_ORDER[(currentIndex + 1) % PERSONALITY_ORDER.length];
    handlePersonalityChange(next);
  };

  const handleToggle = () => {
    if (disabled) return;
    setExpanded((previous) => !previous);
  };

  const applyParsedResponse = (response: BuddyResponse) => {
    setAiMessage(response.message || "");
    setCurrentBooks(response.books || []);
    setSuggestedReplies(
      response.suggestedReplies && response.suggestedReplies.length > 0
        ? response.suggestedReplies
        : defaultReplies
    );
  };

  const sendRequest = async ({
    messageText,
    recommend,
    nextAnswers = guideAnswers,
  }: {
    messageText: string;
    recommend: boolean;
    nextAnswers?: GuideAnswers;
  }) => {
    if (!token || !messageText.trim() || isLoading) return;

    setInputValue("");
    setIsLoading(true);
    setLastRequest(messageText);
    setErrorMessage(null);
    setAiMessage("");

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    try {
      const response = await libraryChat({
        token,
        messages: [{ role: "user", content: messageText }],
        personality,
        readingHistory,
        availableBooks: availableBooks.map((book) => ({
          id: book.id,
          title: book.title,
          author: book.author,
          genre: book.genre,
          description: book.description,
        })),
        requestRecommendations: recommend,
        preferenceProfile: recommend ? buildPreferenceProfile(nextAnswers, messageText) : undefined,
      });

      if (requestId !== requestIdRef.current) return;

      const parsed = parseBuddyResponse(response.content);
      if (!parsed) {
        setCurrentBooks([]);
        setAiMessage("");
        setErrorMessage("Sorry - I couldn't understand that response. Try again?");
        setSuggestedReplies(defaultReplies);
        return;
      }

      applyParsedResponse(parsed);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error("BookBuddy error:", error);
      setCurrentBooks([]);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSend = async (text?: string) => {
    if (disabled) return;
    const messageText = (text || inputValue).trim();
    if (!messageText) return;

    const shouldRecommend = guideComplete || hasRecommendationLanguage(messageText);
    await sendRequest({ messageText, recommend: shouldRecommend });
  };

  const handleGuideChoice = async (choice: GuideChoice) => {
    if (disabled || isLoading) return;

    const nextAnswers = {
      ...guideAnswers,
      [currentStep.key]: choice,
    };
    setGuideAnswers(nextAnswers);

    const nextStepIndex = activeStepIndex + 1;
    if (nextStepIndex < guideSteps.length) {
      setActiveStepIndex(nextStepIndex);
      return;
    }

    await sendRequest({
      messageText: buildGuidePrompt(nextAnswers, inputValue),
      recommend: true,
      nextAnswers,
    });
  };

  const handleChipClick = (reply: SuggestedReply) => {
    void handleSend(reply.fullText);
  };

  const getCoverUrl = (bookId: string): string | undefined => {
    const book = availableBooks.find((item) => item.id === bookId);
    return book?.coverImageUrl;
  };

  const guideChips = currentStep.choices;
  const showGuidePanel = currentBooks.length === 0 && !isLoading;

  return (
    <div className={`muse-container book-buddy-container ${expanded ? "expanded" : ""}${disabled ? " disabled" : ""}`} aria-hidden={disabled}>
      <div className="muse-blob-wrapper">
        <motion.button
          type="button"
          aria-label="Open Book Buddy"
          className="muse-blob book-buddy-blob-icon"
          onClick={handleToggle}
          animate={{
            scale: hasWaved ? 1 : [1, 1.1, 1],
            rotate: hasWaved ? 0 : [0, -10, 10, 0],
          }}
          transition={{
            duration: hasWaved ? 0.2 : 1.5,
            repeat: hasWaved ? 0 : 2,
          }}
          style={{
            background: `linear-gradient(135deg, ${config.bgColor}, ${config.bgColor}dd)`,
          }}
        >
          <svg className="w-7 h-7" fill="none" stroke={config.accentColor} strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </motion.button>
      </div>

      <div className="muse-panel book-buddy-panel">
        <div className="muse-header">
          <div>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "var(--color-taupe)",
                fontWeight: 600,
              }}
            >
              Book Buddy
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "22px",
                  fontStyle: "italic",
                  fontWeight: 400,
                  margin: 0,
                  lineHeight: 1,
                  color: "var(--color-espresso)",
                }}
              >
                {config.name}
              </h3>
              <motion.button
                type="button"
                aria-label="Switch character"
                onClick={cyclePersonality}
                title={`Switch to ${personalities[PERSONALITY_ORDER[(PERSONALITY_ORDER.indexOf(personality) + 1) % PERSONALITY_ORDER.length]].name}`}
                whileTap={{ scale: 0.85, rotate: -15 }}
                whileHover={{ scale: 1.15 }}
                style={{
                  background: config.bgColor,
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  fontSize: "14px",
                  lineHeight: 1,
                  boxShadow: "0 1px 4px rgba(45, 36, 32, 0.08)",
                }}
              >
                {config.symbol}
              </motion.button>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close Book Buddy"
            onClick={() => setExpanded(false)}
            className="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" style={{ opacity: 0.4 }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="muse-body book-buddy-cards-area">
          <AnimatePresence>
            {isLoading && (
              <motion.div className="book-buddy-loading-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="loading-spinner">
                  <div className="flex gap-1">
                    {[0, 0.15, 0.3].map((delay, index) => (
                      <motion.span
                        key={index}
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: personality === "dash" ? 0.6 : 1,
                          delay,
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

          {showGuidePanel ? (
            <motion.div
              className="rounded-3xl border border-black/5 bg-white/60 p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">Guided Search</p>
              <p className="mt-2 text-sm leading-6 text-black/70">{config.intro}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {guideSteps.map((step) =>
                  guideAnswers[step.key] ? (
                    <span
                      key={step.key}
                      className="rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        borderColor: `${config.accentColor}35`,
                        color: config.accentColor,
                        background: `${config.bgColor}55`,
                      }}
                    >
                      {guideAnswers[step.key]?.label}
                    </span>
                  ) : null
                )}
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-black/80">{currentStep.title}</p>
                    <p className="text-xs text-black/45">{currentStep.subtitle}</p>
                  </div>
                  {(Object.keys(guideAnswers).length > 0 || currentBooks.length > 0 || aiMessage) && (
                    <button
                      type="button"
                      onClick={() => resetGuide(true)}
                      className="text-xs font-medium uppercase tracking-[0.18em] text-black/40 hover:text-black/60"
                    >
                      Start Over
                    </button>
                  )}
                </div>
              </div>

              {aiMessage ? <div className="book-buddy-message mt-4">{aiMessage}</div> : null}
              {errorMessage ? <div className="book-buddy-error mt-4">{errorMessage}</div> : null}

              {availableBooks.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white/50 p-4 text-sm text-black/55">
                  No unread books are available right now. Add one to the library, then come back here.
                </div>
              ) : null}
            </motion.div>
          ) : null}

          {currentBooks.length > 0 && !isLoading ? (
            <div className="book-buddy-cards-grid">
              {aiMessage ? <div className="book-buddy-message">{aiMessage}</div> : null}
              {lastRequest ? (
                <div className="last-request-label">
                  You asked for: <span>{lastRequest}</span>
                </div>
              ) : null}
              {currentBooks.map((book, index) => (
                <BookRecCard
                  key={`${book.id}-${index}`}
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
          ) : null}
        </div>

        <div className="book-buddy-chips">
          {(showGuidePanel ? guideChips : suggestedReplies).map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => {
                if (showGuidePanel) {
                  void handleGuideChoice(item as GuideChoice);
                } else {
                  handleChipClick(item as SuggestedReply);
                }
              }}
              disabled={isLoading || disabled || !token || availableBooks.length === 0}
              className="prompt-chip"
              style={{
                borderColor: `${config.accentColor}40`,
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="muse-input-area">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="What kind of book do you want?"
            disabled={isLoading || disabled || !token}
            className="muse-input"
          />
          <button
            type="button"
            aria-label="Send message"
            onClick={() => void handleSend()}
            disabled={!inputValue.trim() || isLoading || disabled || !token}
            className="muse-send-btn"
            style={{ color: config.accentColor }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookBuddy;
