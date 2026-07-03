import { describe, it, expect } from "vitest";
import { createDialogueEngine } from "../engine";
import { createMemoryLineHistory } from "../history";
import { interpolate } from "../interpolate";
import { getLinePack } from "../lines";
import { CHARACTER_IDS } from "../characters";
import type { DialogueContext, LinePack } from "../types";

const baseCtx: DialogueContext = { mode: "quick" };

function makePack(): LinePack {
  return {
    greet: [
      { id: "g.1", text: "one" },
      { id: "g.2", text: "two" },
      { id: "g.3", text: "three" },
      { id: "g.4", text: "four" },
    ],
    tiered: [
      { id: "t.generic", text: "generic" },
      {
        id: "t.special",
        text: "special",
        priority: 10,
        when: (ctx) => (ctx.sprintDaysLeft ?? 99) <= 2,
      },
    ],
    chatty: [
      { id: "c.both", text: "both modes" },
      { id: "c.talk", text: "banter", modes: ["talkative"] },
    ],
    solo: [{ id: "s.1", text: "only line" }],
  };
}

describe("dialogue engine", () => {
  it("never repeats within a pool until variety is exhausted", () => {
    const engine = createDialogueEngine(makePack(), createMemoryLineHistory());
    const seen = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const line = engine.next("greet", baseCtx);
      expect(line).not.toBeNull();
      seen.add(line!.id);
    }
    expect(seen.size).toBe(4);
  });

  it("keeps working when a pool is smaller than the exclusion window", () => {
    const engine = createDialogueEngine(makePack(), createMemoryLineHistory());
    for (let i = 0; i < 5; i++) {
      expect(engine.next("solo", baseCtx)?.id).toBe("s.1");
    }
  });

  it("prefers the highest priority tier whose predicates pass", () => {
    const engine = createDialogueEngine(makePack(), createMemoryLineHistory());
    const urgent = engine.next("tiered", { ...baseCtx, sprintDaysLeft: 1 });
    expect(urgent?.id).toBe("t.special");
    const normal = engine.next("tiered", { ...baseCtx, sprintDaysLeft: 10 });
    expect(normal?.id).toBe("t.generic");
  });

  it("filters lines by mode", () => {
    const engine = createDialogueEngine(makePack(), createMemoryLineHistory());
    for (let i = 0; i < 6; i++) {
      const line = engine.next("chatty", { mode: "quick" });
      expect(line?.id).toBe("c.both");
    }
    const talkativeIds = new Set<string>();
    const engine2 = createDialogueEngine(makePack(), createMemoryLineHistory());
    for (let i = 0; i < 2; i++) {
      talkativeIds.add(engine2.next("chatty", { mode: "talkative" })!.id);
    }
    expect(talkativeIds).toEqual(new Set(["c.both", "c.talk"]));
  });

  it("returns null for unknown context keys", () => {
    const engine = createDialogueEngine(makePack(), createMemoryLineHistory());
    expect(engine.next("nope", baseCtx)).toBeNull();
  });
});

describe("interpolate", () => {
  it("fills vars and known context fields", () => {
    const out = interpolate("Hi {kidName}, {tasksDoneToday} done, book: {bookTitle}!", {
      mode: "quick",
      kidName: "Asha",
      tasksDoneToday: 3,
      vars: { bookTitle: "Holes" },
    });
    expect(out).toBe("Hi Asha, 3 done, book: Holes!");
  });

  it("resolves unknown tokens to empty string", () => {
    const out = interpolate("Hello {mysteryToken}!", { mode: "quick" });
    expect(out).toBe("Hello !");
  });
});

describe("line packs", () => {
  const PLANNER_KEYS = [
    "greeting",
    "offer.duplicateRoutine",
    "goal.askActivity",
    "goal.askActivityVague",
    "goal.askDuration",
    "goal.retryDuration",
    "goal.askSchedule",
    "goal.retrySchedule",
    "goal.confirmRecap",
    "goal.created",
    "goal.duplicated",
    "goal.imported",
    "goal.edited",
    "task.done.single",
    "task.done.multi",
    "task.done.allToday",
    "streak.3",
    "streak.5",
    "streak.7",
    "habit.created",
    "banter.betweenSteps",
    "error.generic",
  ];
  const LIBRARY_KEYS = [
    "greeting",
    "genre.picked.fantasy",
    "genre.picked.mystery",
    "genre.picked.adventure",
    "genre.picked.realworld",
    "genre.picked.fiction",
    "genre.picked.other",
    "pace.picked",
    "novelty.picked",
    "pitch.frame",
    "pitch.genreStinger.fantasy",
    "pitch.genreStinger.mystery",
    "pitch.genreStinger.adventure",
    "pitch.genreStinger.realworld",
    "pitch.genreStinger.fiction",
    "pitch.genreStinger.other",
    "pick.first",
    "pick.backup",
    "why.genreMatch",
    "why.moodMatch",
    "why.history",
    "why.fiction",
    "why.token",
    "why.fresh",
    "why.fallback",
    "teaser.fallback",
    "postStartReading",
    "noMatches",
    "browsing",
  ];

  it("every character covers every context key with unique line ids", () => {
    const allIds = new Set<string>();
    for (const character of CHARACTER_IDS) {
      const planner = getLinePack(character, "planner");
      for (const key of PLANNER_KEYS) {
        expect(planner[key]?.length, `${character} planner ${key}`).toBeGreaterThan(0);
      }
      const library = getLinePack(character, "library");
      for (const key of LIBRARY_KEYS) {
        expect(library[key]?.length, `${character} library ${key}`).toBeGreaterThan(0);
      }
      for (const pack of [planner, library]) {
        for (const lines of Object.values(pack)) {
          for (const line of lines) {
            expect(allIds.has(line.id), `duplicate line id ${line.id}`).toBe(false);
            allIds.add(line.id);
          }
        }
      }
    }
  });

  it("greeting pools resolve for urgent, first-open, and return states", () => {
    for (const character of CHARACTER_IDS) {
      const engine = createDialogueEngine(
        getLinePack(character, "planner"),
        createMemoryLineHistory()
      );
      expect(engine.next("greeting", { mode: "quick", sprintDaysLeft: 1 })).not.toBeNull();
      expect(
        engine.next("greeting", { mode: "quick", sprintDaysLeft: 10, isFirstOpenToday: true })
      ).not.toBeNull();
      expect(engine.next("greeting", { mode: "quick", sprintDaysLeft: 10 })).not.toBeNull();
    }
  });
});
