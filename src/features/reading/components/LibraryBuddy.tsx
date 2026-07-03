import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Send } from "lucide-react";
import {
  createDialogueEngine,
  createLineHistory,
  createMemoryLineHistory,
  getLinePack,
} from "@/shared/dialogue";
import type { DialogueContext, ResolvedLine } from "@/shared/dialogue";
import {
  BuddyBlob,
  BuddyPicker,
  ChoiceList,
  DialogueStage,
  SuggestionBubbles,
  type Choice,
} from "@/shared/components/dialogue";
import { useBuddy } from "@/shared/hooks/useBuddy";
import {
  genreToBucket,
  selectBookRecommendations,
  type AvailableBook,
  type BookBuddyPreferenceProfile,
  type GenreBucket,
  type RankedRecommendation,
  type ReadingHistoryItem,
} from "@/shared/books/recommend";
import type { DialogueEngine } from "@/shared/dialogue";
import styles from "@/shared/styles/dialogue.module.css";

type Step = "genre" | "pace" | "novelty" | "results";

/** A ranked book dressed in the character's voice. */
interface VoicedCard {
  entry: RankedRecommendation;
  kicker: string;
  teaser: string;
  why: string;
}

/**
 * Map the ranking algorithm's raw reason strings to in-voice line keys.
 * Prefers the most specific/personal reason so sibling cards don't all
 * say the same thing.
 */
function voiceWhy(
  engine: DialogueEngine,
  ctx: DialogueContext,
  reasons: string[]
): string {
  const token = reasons.find((r) => r.startsWith("picks up on"));
  if (token) {
    const word = token.match(/"([^"]+)"/)?.[1] ?? "that";
    return engine.next("why.token", { ...ctx, vars: { ...ctx.vars, token: word } })?.text ?? "";
  }
  const genre = reasons.find((r) => r.startsWith("matches your"));
  if (genre) {
    const name = genre.replace(/^matches your /, "").replace(/ pick$/, "");
    return engine.next("why.genreMatch", { ...ctx, vars: { ...ctx.vars, genre: name } })?.text ?? "";
  }
  const mood = reasons.find((r) => r.startsWith("fits the"));
  if (mood) {
    const name = mood.replace(/^fits the /, "").replace(/ mood$/, "");
    return engine.next("why.moodMatch", { ...ctx, vars: { ...ctx.vars, vibe: name } })?.text ?? "";
  }
  if (reasons.includes("similar to books you've liked before")) {
    return engine.next("why.history", ctx)?.text ?? "";
  }
  if (reasons.includes("adds a fresher flavor to your mix")) {
    return engine.next("why.fresh", ctx)?.text ?? "";
  }
  if (reasons.includes("fiction boost")) {
    return engine.next("why.fiction", ctx)?.text ?? "";
  }
  return engine.next("why.fallback", ctx)?.text ?? "";
}

interface LibraryBuddyProps {
  userId: string | null;
  kidName?: string;
  readingHistory: ReadingHistoryItem[];
  availableBooks: AvailableBook[];
  onStartReading: (bookId: string) => void;
  disabled?: boolean;
}

const GENRE_CHOICES: Array<{ id: string; label: string; bucket: GenreBucket; profileGenre?: string }> = [
  { id: "fantasy", label: "Fantasy & magic", bucket: "fantasy", profileGenre: "fantasy" },
  { id: "adventure", label: "Adventure", bucket: "adventure", profileGenre: "adventure" },
  { id: "mystery", label: "Mystery", bucket: "mystery", profileGenre: "mystery" },
  { id: "realworld", label: "Real-world & facts", bucket: "realworld", profileGenre: "realworld" },
  { id: "fiction", label: "Funny fiction", bucket: "fiction", profileGenre: "fiction" },
  { id: "surprise", label: "Surprise me!", bucket: "other" },
];

const PACE_CHOICES: Array<{ id: string; label: string; value?: string }> = [
  { id: "fast", label: "Fast & gripping", value: "fast" },
  { id: "cozy", label: "Cozy & gentle", value: "cozy" },
  { id: "thoughtful", label: "Thoughtful", value: "thoughtful" },
  { id: "any", label: "Any pace!" },
];

const NOVELTY_CHOICES: Array<{ id: string; label: string; value: "familiar" | "mix" | "fresh" }> = [
  { id: "familiar", label: "Close to what I love", value: "familiar" },
  { id: "mix", label: "Mix it up", value: "mix" },
  { id: "fresh", label: "Something totally new", value: "fresh" },
];

function BookPitchCard({
  card,
  index,
  disabled,
  onStartReading,
}: {
  card: VoicedCard;
  index: number;
  disabled?: boolean;
  onStartReading: (bookId: string) => void;
}) {
  const { book } = card.entry;
  return (
    <div className={`${styles.card} ${styles.bookCard}`} style={{ "--row-index": index } as CSSProperties}>
      <div className={styles.bookCover} aria-hidden="true">
        {book.coverImageUrl ? (
          <img src={book.coverImageUrl} alt="" draggable={false} />
        ) : (
          book.title.charAt(0)
        )}
      </div>
      <div className={styles.bookMeta}>
        <div className={styles.cardKicker}>{card.kicker}</div>
        <div className={styles.bookTitle}>{book.title}</div>
        <div className={styles.bookAuthor}>{book.author}</div>
        <div className={styles.bookTeaser}>{card.teaser}</div>
        <div className={styles.bookWhy}>{card.why}</div>
        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => onStartReading(book.id)}
            disabled={disabled}
          >
            Start Reading
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The library's dialogue buddy — the same character the kid picked in the
 * planner, now hunting for their next great book. Fully deterministic:
 * the existing ranking algorithm picks the books; the character voice
 * comes from hand-authored pitch frames + genre stingers.
 */
export function LibraryBuddy({
  userId,
  kidName,
  readingHistory,
  availableBooks,
  onStartReading,
  disabled,
}: LibraryBuddyProps) {
  const { character, mode, setCharacter, setMode } = useBuddy();
  const [expanded, setExpanded] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [step, setStep] = useState<Step>("genre");
  const [line, setLine] = useState<ResolvedLine | null>(null);
  const [ghost, setGhost] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [thinking, setThinking] = useState(false);
  const [cards, setCards] = useState<VoicedCard[]>([]);
  const [profile, setProfile] = useState<BookBuddyPreferenceProfile>({});
  const searchCount = useRef(0);
  const thinkTimer = useRef<number | null>(null);

  const engine = useMemo(() => {
    if (!character) return null;
    const history = userId ? createLineHistory(userId) : createMemoryLineHistory();
    return createDialogueEngine(getLinePack(character, "library"), history);
  }, [character, userId]);

  const buildCtx = useCallback(
    (vars?: Record<string, string | number>): DialogueContext => ({ kidName, mode, vars }),
    [kidName, mode]
  );

  const speak = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      if (!engine) return;
      const resolved = engine.next(key, buildCtx(vars));
      if (!resolved) return;
      setGhost(line?.text ?? null);
      setLine(resolved);
    },
     
    [engine, buildCtx, line?.text]
  );

  // Greet on open / character change.
  const greetedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!expanded || !character || !engine) {
      if (!expanded) greetedFor.current = null;
      return;
    }
    if (greetedFor.current === character) return;
    greetedFor.current = character;
    setStep("genre");
    setCards([]);
    setProfile({});
    speak("greeting");
     
  }, [expanded, character, engine]);

  useEffect(() => {
    if (expanded && !character) setShowPicker(true);
  }, [expanded, character]);

  useEffect(() => {
    return () => {
      if (thinkTimer.current !== null) window.clearTimeout(thinkTimer.current);
    };
  }, []);

  const runSearch = useCallback(
    (searchProfile: BookBuddyPreferenceProfile, bucketHint: GenreBucket | null) => {
      if (!engine) return;
      searchCount.current += 1;
      const seed = `${searchProfile.freeText ?? ""}:${searchProfile.genre ?? ""}:${searchProfile.pace ?? ""}:${searchCount.current}`;

      // A short "thinking" beat — ranking is instant, but the character
      // choosing carefully is part of the charm.
      setThinking(true);
      setLine((current) => (current ? { ...current, expression: "thinking" } : current));

      thinkTimer.current = window.setTimeout(() => {
        setThinking(false);
        const ranked = selectBookRecommendations(availableBooks, readingHistory, searchProfile, seed);
        setStep("results");
        if (ranked.length === 0) {
          setCards([]);
          speak("noMatches");
          return;
        }

        // Dress each pick in the character's voice: kicker, teaser, why.
        const ctx = buildCtx();
        setCards(
          ranked.map((entry, index) => ({
            entry,
            kicker: engine.next(index === 0 ? "pick.first" : "pick.backup", ctx)?.text ?? "",
            teaser:
              entry.book.description?.trim() ||
              engine.next("teaser.fallback", {
                ...ctx,
                vars: { bookTitle: entry.book.title, genre: entry.book.genre ?? "story" },
              })?.text ||
              "",
            why: voiceWhy(engine, ctx, entry.reasons),
          }))
        );

        const top = ranked[0];
        const bucket = bucketHint ?? genreToBucket(top.book.genre);
        const stinger = engine.next(`pitch.genreStinger.${bucket}`, ctx);
        speak("pitch.frame", {
          bookTitle: top.book.title,
          bookAuthor: top.book.author,
          genreStinger: stinger?.text ?? "",
        });
      }, 500);
    },
    [engine, availableBooks, readingHistory, speak, buildCtx]
  );

  const handleChoice = useCallback(
    (id: string) => {
      if (step === "genre") {
        const choice = GENRE_CHOICES.find((c) => c.id === id);
        if (!choice) return;
        setProfile((prev) => ({ ...prev, genre: choice.profileGenre, vibe: choice.profileGenre }));
        setStep("pace");
        speak(`genre.picked.${choice.bucket}`);
        return;
      }
      if (step === "pace") {
        const choice = PACE_CHOICES.find((c) => c.id === id);
        if (!choice) return;
        setProfile((prev) => ({ ...prev, pace: choice.value }));
        setStep("novelty");
        speak("pace.picked");
        return;
      }
      if (step === "novelty") {
        const choice = NOVELTY_CHOICES.find((c) => c.id === id);
        if (!choice) return;
        const nextProfile = { ...profile, novelty: choice.value };
        setProfile(nextProfile);
        speak("novelty.picked");
        const bucket = GENRE_CHOICES.find((c) => c.profileGenre === nextProfile.genre)?.bucket ?? null;
        runSearch(nextProfile, bucket);
        return;
      }
      if (step === "results") {
        if (id === "differentMood") {
          setStep("genre");
          setCards([]);
          setProfile({});
          speak("greeting");
        } else if (id === "freshSurprise") {
          runSearch({ ...profile, novelty: "fresh" }, null);
        }
      }
    },
    [step, speak, profile, runSearch]
  );

  const handleStartReading = useCallback(
    (bookId: string) => {
      const book = availableBooks.find((candidate) => candidate.id === bookId);
      onStartReading(bookId);
      speak("postStartReading", { bookTitle: book?.title ?? "your new book" });
      setCards((prev) => prev.filter((card) => card.entry.book.id !== bookId));
    },
    [availableBooks, onStartReading, speak]
  );

  const handleSubmit = useCallback(
    (raw?: string) => {
      const text = (raw ?? inputValue).trim();
      if (!text || thinking) return;
      setInputValue("");
      runSearch({ ...profile, freeText: text }, null);
    },
    [inputValue, thinking, runSearch, profile]
  );

  // Free-text suggestion bubbles, derived from the catalog's actual genres.
  const searchBubbles = useMemo(() => {
    const genres = [
      ...new Set(
        availableBooks
          .map((book) => book.genre?.trim())
          .filter((genre): genre is string => Boolean(genre))
      ),
    ].slice(0, 4);
    return [...genres, "Funny", "Surprise me"];
  }, [availableBooks]);

  const stageChildren = showPicker ? (
    <BuddyPicker
      current={character}
      mode={mode}
      onPick={(picked) => {
        setCharacter(picked);
        setShowPicker(false);
      }}
      onModeChange={setMode}
    />
  ) : (
    <>
      {step === "genre" && (
        <>
          <ChoiceList
            choices={GENRE_CHOICES.map((c): Choice => ({ id: c.id, label: c.label }))}
            onChoose={handleChoice}
            disabled={thinking}
          />
          <SuggestionBubbles
            label="or hunt by anything"
            suggestions={searchBubbles}
            onPick={(bubble) => handleSubmit(bubble)}
            disabled={thinking}
          />
        </>
      )}

      {step === "pace" && (
        <ChoiceList
          choices={PACE_CHOICES.map((c): Choice => ({ id: c.id, label: c.label }))}
          onChoose={handleChoice}
          disabled={thinking}
        />
      )}

      {step === "novelty" && (
        <ChoiceList
          choices={NOVELTY_CHOICES.map((c): Choice => ({ id: c.id, label: c.label }))}
          onChoose={handleChoice}
          disabled={thinking}
        />
      )}

      {step === "results" && !thinking && (
        <>
          {cards.map((card, index) => (
            <BookPitchCard
              key={card.entry.book.id}
              card={card}
              index={index}
              disabled={disabled}
              onStartReading={handleStartReading}
            />
          ))}
          <ChoiceList
            choices={[
              { id: "freshSurprise", label: "Show me a fresher surprise" },
              { id: "differentMood", label: "Different mood — start over" },
            ]}
            onChoose={handleChoice}
          />
        </>
      )}

      {/* Free-text hunts work at every step — kids can bail out of the
          guided flow at any moment with "dragons" or "something funny". */}
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          value={inputValue}
          placeholder="…or ask for anything (dragons, space, sports)"
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSubmit();
          }}
          disabled={thinking}
        />
        <button
          type="button"
          className={styles.sendBtn}
          onClick={() => handleSubmit()}
          disabled={thinking || !inputValue.trim()}
          aria-label="Search"
        >
          <Send size={15} />
        </button>
      </div>
    </>
  );

  return (
    <div className={styles.container}>
      <BuddyBlob
        character={character}
        hidden={expanded}
        onClick={() => {
          if (disabled) return;
          setExpanded(true);
        }}
        ariaLabel={character ? `Find a book with ${character}` : "Meet your book buddy"}
      />

      <DialogueStage
        character={showPicker ? null : character}
        open={expanded && !disabled}
        onClose={() => setExpanded(false)}
        line={showPicker ? null : line}
        ghostLine={showPicker ? null : ghost}
        mode={mode}
        onModeToggle={() => setMode(mode === "quick" ? "talkative" : "quick")}
        onNameplateClick={() => setShowPicker((value) => !value)}
        data-testid="library-buddy-stage"
      >
        {stageChildren}
      </DialogueStage>
    </div>
  );
}

export default LibraryBuddy;
