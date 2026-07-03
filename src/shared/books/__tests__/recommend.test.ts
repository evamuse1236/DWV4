import { describe, expect, it } from "vitest";
import {
  buildReaderProfile,
  buildWhyText,
  genreToBucket,
  selectBookRecommendations,
  type AvailableBook,
  type ReadingHistoryItem,
} from "../recommend";

const BOOKS: AvailableBook[] = [
  {
    id: "b1",
    title: "The Dragon's Quest",
    author: "A. Writer",
    genre: "Fantasy",
    description: "A magical adventure with dragons and a daring quest.",
  },
  {
    id: "b2",
    title: "Who Took the Trophy?",
    author: "B. Sleuth",
    genre: "Mystery",
    description: "A detective story full of clues and secrets.",
  },
  {
    id: "b3",
    title: "Volcanoes of Earth",
    author: "C. Science",
    genre: "Science",
    description: "True facts about real volcanoes and how they work.",
  },
  {
    id: "b4",
    title: "Laugh Out Loud Tales",
    author: "D. Comic",
    genre: "Fiction",
    description: "Funny short stories guaranteed to make you laugh.",
  },
];

const HISTORY: ReadingHistoryItem[] = [
  { title: "Old Wizard", author: "X", genre: "Fantasy", rating: 5, status: "completed" },
  { title: "Half Read", author: "Y", genre: "Science", rating: 3, status: "reading" },
];

describe("selectBookRecommendations", () => {
  it("is deterministic: same inputs produce identical picks", () => {
    const a = selectBookRecommendations(BOOKS, HISTORY, { genre: "mystery" }, "seed");
    const b = selectBookRecommendations(BOOKS, HISTORY, { genre: "mystery" }, "seed");
    expect(a.map((r) => r.book.id)).toEqual(b.map((r) => r.book.id));
    expect(a.map((r) => r.score)).toEqual(b.map((r) => r.score));
  });

  it("genre match (+18) dominates the ranking", () => {
    const picks = selectBookRecommendations(BOOKS, [], { genre: "mystery" });
    expect(picks[0].book.id).toBe("b2");
    expect(picks[0].reasons).toContain("matches your mystery pick");
  });

  it("reader history boosts previously loved genres", () => {
    const picks = selectBookRecommendations(BOOKS, HISTORY, {});
    const fantasy = picks.find((r) => r.book.id === "b1");
    expect(fantasy?.reasons).toContain("similar to books you've liked before");
  });

  it("returns at most 3 picks with the top pick first", () => {
    const picks = selectBookRecommendations(BOOKS, [], { genre: "fantasy" });
    expect(picks.length).toBe(3);
    expect(picks[0].book.id).toBe("b1");
  });

  it("picks up free-text tokens", () => {
    const picks = selectBookRecommendations(BOOKS, [], { freeText: "dragons" });
    expect(picks[0].book.id).toBe("b1");
    expect(picks[0].reasons.some((reason) => reason.includes("dragons"))).toBe(true);
  });

  it("returns empty for an empty catalog", () => {
    expect(selectBookRecommendations([], HISTORY, { genre: "fantasy" })).toEqual([]);
  });
});

describe("buildReaderProfile", () => {
  it("weights completed + high-rated genres higher", () => {
    const profile = buildReaderProfile(HISTORY);
    expect(profile.topGenres[0]).toBe("fantasy");
    expect(profile.genreScores.get("fantasy")).toBeCloseTo(3 * 1.2);
    expect(profile.genreScores.get("science")).toBeCloseTo(1 * 0.7);
  });
});

describe("buildWhyText", () => {
  it("combines up to two reasons", () => {
    expect(buildWhyText(["matches your mystery pick", "fiction boost"])).toBe(
      "matches your mystery pick, and it leans into fiction, which is the default priority."
    );
  });

  it("has a friendly fallback for zero reasons", () => {
    expect(buildWhyText([])).toBe("It gives you a different flavor without feeling random.");
  });
});

describe("genreToBucket", () => {
  it.each([
    ["Fantasy", "fantasy"],
    ["Mystery / Detective", "mystery"],
    ["Adventure", "adventure"],
    ["Science", "realworld"],
    ["Historical Fiction", "realworld"],
    ["Realistic Fiction", "realworld"],
    ["Fiction", "fiction"],
    ["Poetry", "other"],
    [undefined, "other"],
  ])("maps %s to %s", (input, expected) => {
    expect(genreToBucket(input as string | undefined)).toBe(expected);
  });
});
