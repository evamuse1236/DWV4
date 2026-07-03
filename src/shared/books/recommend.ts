// Deterministic book recommendation ranking, moved verbatim from
// convex/ai.ts when the LLM library chat was replaced by the dialogue
// buddy. Runs entirely client-side — the catalog and reading history are
// already loaded by the reading page.

export interface ReadingHistoryItem {
  title: string;
  author: string;
  genre?: string;
  rating?: number;
  status: string;
}

export interface AvailableBook {
  id: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  coverImageUrl?: string;
}

export type BookBuddyPreferenceProfile = {
  genre?: string;
  vibe?: string;
  pace?: string;
  novelty?: "familiar" | "mix" | "fresh";
  freeText?: string;
};

export type RankedRecommendation = {
  book: AvailableBook;
  score: number;
  freshnessScore: number;
  reasons: string[];
  genreKey: string;
};

const FICTION_HINTS = [
  "fiction",
  "fantasy",
  "mystery",
  "adventure",
  "novel",
  "story",
  "stories",
];

const VIBE_KEYWORDS: Record<string, string[]> = {
  funny: ["funny", "humor", "humour", "laugh", "comedy"],
  adventure: ["adventure", "quest", "journey", "action"],
  mystery: ["mystery", "detective", "clue", "secret"],
  realworld: ["history", "science", "real", "true", "biography", "facts"],
  cozy: ["cozy", "gentle", "friendship", "warm"],
  thoughtful: ["thoughtful", "ideas", "big questions", "reflection"],
};

const PACE_KEYWORDS: Record<string, string[]> = {
  fast: ["fast", "quick", "page-turner", "action"],
  cozy: ["cozy", "gentle", "slow", "quiet"],
  thoughtful: ["thoughtful", "deep", "ideas", "reflective"],
};

export function normalizeGenreKey(value?: string) {
  if (!value) return "";
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenize(value?: string) {
  if (!value) return [];
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function isFictionBook(book: AvailableBook) {
  const haystack = `${book.genre ?? ""} ${book.description ?? ""}`.toLowerCase();
  return FICTION_HINTS.some((hint) => haystack.includes(hint));
}

function deterministicScore(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  }
  return (hash % 1000) / 1000;
}

export function buildReaderProfile(readingHistory: ReadingHistoryItem[]) {
  const genreScores = new Map<string, number>();

  for (const entry of readingHistory) {
    const genreKey = normalizeGenreKey(entry.genre);
    if (!genreKey) continue;

    const ratingBoost = entry.rating ? Math.max(entry.rating - 2, 0.5) : 1;
    const completionBoost =
      entry.status === "already_read" ||
      entry.status === "completed" ||
      entry.status === "review_submitted" ||
      entry.status === "review_approved" ||
      entry.status === "presented"
        ? 1.2
        : 0.7;

    genreScores.set(genreKey, (genreScores.get(genreKey) ?? 0) + ratingBoost * completionBoost);
  }

  return {
    genreScores,
    topGenres: [...genreScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 3),
  };
}

function buildReasonPhrase(rawReason: string) {
  if (rawReason === "fiction boost") return "it leans into fiction, which is the default priority";
  if (rawReason.startsWith("matches your")) return rawReason.toLowerCase();
  if (rawReason.startsWith("fits the")) return rawReason.toLowerCase();
  if (rawReason === "similar to books you've liked before") return rawReason;
  if (rawReason === "adds a fresher flavor to your mix") return rawReason;
  if (rawReason.startsWith("picks up on")) return rawReason.toLowerCase();
  return rawReason.toLowerCase();
}

export function buildWhyText(reasons: string[]) {
  if (reasons.length === 0) return "It gives you a different flavor without feeling random.";
  if (reasons.length === 1) return buildReasonPhrase(reasons[0]);
  return `${buildReasonPhrase(reasons[0])}, and ${buildReasonPhrase(reasons[1])}.`;
}

export function selectBookRecommendations(
  availableBooks: AvailableBook[],
  readingHistory: ReadingHistoryItem[],
  preferenceProfile?: BookBuddyPreferenceProfile,
  seedText = ""
) {
  const readerProfile = buildReaderProfile(readingHistory);
  const desiredGenre = normalizeGenreKey(preferenceProfile?.genre);
  const desiredVibe = normalizeGenreKey(preferenceProfile?.vibe);
  const desiredPace = normalizeGenreKey(preferenceProfile?.pace);
  const novelty = preferenceProfile?.novelty ?? "mix";
  const textTokens = tokenize(`${preferenceProfile?.freeText ?? ""} ${seedText}`);

  const ranked: RankedRecommendation[] = availableBooks.map((book) => {
    const genreKey = normalizeGenreKey(book.genre);
    const haystack = `${book.title} ${book.author} ${book.genre ?? ""} ${book.description ?? ""}`.toLowerCase();
    const reasons: string[] = [];
    let score = 0;

    if (desiredGenre && genreKey.includes(desiredGenre)) {
      score += 18;
      reasons.push(`matches your ${preferenceProfile?.genre} pick`);
    }

    if (desiredVibe) {
      const vibeTokens = VIBE_KEYWORDS[desiredVibe] ?? tokenize(desiredVibe);
      const vibeMatches = vibeTokens.filter((token) => haystack.includes(token)).length;
      if (vibeMatches > 0) {
        score += 6 + vibeMatches;
        reasons.push(`fits the ${preferenceProfile?.vibe} mood`);
      }
    }

    if (desiredPace) {
      const paceTokens = PACE_KEYWORDS[desiredPace] ?? tokenize(desiredPace);
      const paceMatches = paceTokens.filter((token) => haystack.includes(token)).length;
      if (paceMatches > 0) {
        score += 4 + paceMatches;
      }
    }

    if (genreKey && readerProfile.genreScores.has(genreKey)) {
      score += (readerProfile.genreScores.get(genreKey) ?? 0) * 3;
      reasons.push("similar to books you've liked before");
    } else if (novelty !== "familiar") {
      score += novelty === "fresh" ? 4 : 2;
    }

    if (isFictionBook(book)) {
      score += 5;
      reasons.push("fiction boost");
    }

    const tokenMatches = textTokens.filter((token) => haystack.includes(token));
    if (tokenMatches.length > 0) {
      score += tokenMatches.length * 2;
      reasons.push(`picks up on "${tokenMatches[0]}"`);
    }

    const freshnessScore = deterministicScore(`${book.id}:${seedText}:${genreKey || "none"}`);
    score += freshnessScore * 1.5;
    if (novelty !== "familiar" && freshnessScore > 0.72) {
      reasons.push("adds a fresher flavor to your mix");
    }

    return {
      book,
      score,
      freshnessScore,
      reasons: [...new Set(reasons)],
      genreKey,
    };
  });

  const sorted = ranked.sort((a, b) => b.score - a.score || b.freshnessScore - a.freshnessScore);
  if (sorted.length === 0) return [];

  const picks: RankedRecommendation[] = [sorted[0]];
  const firstGenre = sorted[0].genreKey;

  const secondPick =
    sorted.find(
      (candidate) =>
        candidate.book.id !== picks[0].book.id &&
        ((novelty === "familiar" && candidate.score >= sorted[0].score - 3) ||
          (candidate.genreKey && candidate.genreKey !== firstGenre))
    ) ?? sorted.find((candidate) => candidate.book.id !== picks[0].book.id);

  if (secondPick) {
    picks.push(secondPick);
  }

  const thirdPick =
    (novelty === "fresh"
      ? [...sorted]
          .filter((candidate) => !picks.some((pick) => pick.book.id === candidate.book.id))
          .sort((a, b) => b.freshnessScore - a.freshnessScore)[0]
      : undefined) ??
    sorted.find((candidate) => !picks.some((pick) => pick.book.id === candidate.book.id));

  if (thirdPick) {
    picks.push(thirdPick);
  }

  return picks.slice(0, 3);
}

export type GenreBucket = "fantasy" | "mystery" | "adventure" | "realworld" | "fiction" | "other";

/** Map an arbitrary genre string (or preference value) to a stinger bucket. */
export function genreToBucket(genre?: string): GenreBucket {
  const key = normalizeGenreKey(genre);
  if (!key) return "other";
  if (key.includes("fantasy") || key.includes("magic")) return "fantasy";
  if (key.includes("mystery") || key.includes("detective")) return "mystery";
  if (key.includes("adventure") || key.includes("action")) return "adventure";
  if (
    key.includes("histor") ||
    key.includes("science") ||
    key.includes("biograph") ||
    key.includes("fact") ||
    key.includes("real") ||
    key.includes("nonfiction") ||
    key.includes("non fiction")
  ) {
    return "realworld";
  }
  if (key.includes("fiction") || key.includes("story") || key.includes("novel")) return "fiction";
  return "other";
}
