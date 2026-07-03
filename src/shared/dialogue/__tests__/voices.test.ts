import { describe, expect, it } from "vitest";
import { voiceFor } from "../voices";
import { getLinePack } from "../lines";
import { CHARACTER_IDS } from "../characters";

// Context keys whose lines are celebratory — a voice clip is welcome here.
const CELEBRATORY_KEYS = [
  "goal.created",
  "task.done.single",
  "task.done.multi",
  "task.done.allToday",
  "streak.3",
  "streak.5",
  "streak.7",
  "goal.duplicated",
  "goal.imported",
];
const LIBRARY_CELEBRATORY_KEYS = ["postStartReading"];

// Context keys that must stay SILENT — a clip here would feel out of place
// (this is exactly the "Gomu Gomu no on a greeting" bug the mapping fixes).
const SILENT_PLANNER_KEYS = [
  "greeting",
  "goal.askActivity",
  "goal.askDuration",
  "goal.askSchedule",
  "goal.confirmRecap",
  "offer.duplicateRoutine",
  "banter.betweenSteps",
  "error.generic",
];
const SILENT_LIBRARY_KEYS = [
  "greeting",
  "genre.picked.fantasy",
  "pace.picked",
  "pitch.frame",
  "noMatches",
  "browsing",
];

describe("voiceFor context matching", () => {
  it("plays a clip on celebratory planner lines for characters that have one", () => {
    for (const character of ["luffy", "steve"] as const) {
      const pack = getLinePack(character, "planner");
      for (const key of CELEBRATORY_KEYS) {
        for (const line of pack[key]) {
          expect(voiceFor(character, line.id), `${character} ${line.id}`).not.toBeNull();
        }
      }
    }
  });

  it("plays a clip on post-start-reading in the library", () => {
    for (const character of ["luffy", "steve"] as const) {
      const pack = getLinePack(character, "library");
      for (const line of pack[LIBRARY_CELEBRATORY_KEYS[0]]) {
        expect(voiceFor(character, line.id), `${character} ${line.id}`).not.toBeNull();
      }
    }
  });

  it("stays silent on greetings and mid-flow prompts (no out-of-place clips)", () => {
    for (const character of CHARACTER_IDS) {
      const planner = getLinePack(character, "planner");
      for (const key of SILENT_PLANNER_KEYS) {
        for (const line of planner[key]) {
          expect(voiceFor(character, line.id), `${character} ${line.id}`).toBeNull();
        }
      }
      const library = getLinePack(character, "library");
      for (const key of SILENT_LIBRARY_KEYS) {
        for (const line of library[key]) {
          expect(voiceFor(character, line.id), `${character} ${line.id}`).toBeNull();
        }
      }
    }
  });

  it("is deterministic — a line always maps to the same clip", () => {
    const pack = getLinePack("luffy", "planner");
    const id = pack["goal.created"][0].id;
    expect(voiceFor("luffy", id)).toBe(voiceFor("luffy", id));
  });

  it("keeps Percy fully silent until clips are sourced", () => {
    for (const area of ["planner", "library"] as const) {
      const pack = getLinePack("percy", area);
      for (const lines of Object.values(pack)) {
        for (const line of lines) {
          expect(voiceFor("percy", line.id), line.id).toBeNull();
        }
      }
    }
  });
});
