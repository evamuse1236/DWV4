import { describe, expect, it } from "vitest";

import {
  deriveScheduleUpdate,
  isModificationRequest,
  parseDuration,
  parseModification,
  parseSchedule,
  resolveActivity,
} from "../parser";

describe("goal chat parsing (hybrid)", () => {
  it.each([
    ["one day", "1x per week"],
    ["just one day", "1x per week"],
    ["once a week", "1x per week"],
    ["twice a week", "2x per week"],
    ["after school", "on weekdays after school"],
    ["weekdays after school", "on weekdays after school"],
    ["mon tues and fri after school", "on mon, tue, fri after school"],
    ["every morning", "every morning"],
    ["mornings", "every morning"],
    ["weekdays mornings", "on weekdays in the morning"],
    ["on weekends at 7pm", "on weekends at 7pm"],
  ])("parses %s to %s", (input, expected) => {
    expect(parseSchedule(input)).toBe(expected);
  });

  it("supports removing/adding days in modification text", () => {
    const draft = { what: "practice piano", howLong: "30 minutes", when: "on mon, tue, fri" };

    expect(isModificationRequest("remove tuesday")).toBe(true);

    const removed = parseModification("remove tuesday", draft);
    expect(removed?.when).toBe("on mon, fri");

    const addedBack = parseModification("add tuesday", { ...draft, when: "on mon, fri" });
    expect(addedBack?.when).toBe("on mon, tue, fri");
  });

  it("merges time-only updates onto an existing schedule", () => {
    expect(
      deriveScheduleUpdate("after school", "on mon, tue, fri")
    ).toBe("on mon, tue, fri after school");
  });
});

describe("parseDuration word numbers", () => {
  it.each([
    ["ten minutes", "10 minutes"],
    ["fifteen mins", "15 minutes"],
    ["twenty five minutes", "25 minutes"],
    ["forty-five minutes", "45 minutes"],
    ["half an hour", "30 minutes"],
  ])("parses %s to %s", (input, expected) => {
    expect(parseDuration(input)).toBe(expected);
  });
});

describe("resolveActivity (deterministic extractActivity replacement)", () => {
  it("extracts a clear activity", () => {
    expect(resolveActivity("practice piano every day for 30 minutes")).toEqual({
      kind: "activity",
      activity: "practice piano",
    });
  });

  it("asks when the input is vague", () => {
    const result = resolveActivity("do stuff");
    expect(result.kind).toBe("ask");
  });

  it("asks when nothing is left after stripping schedule words", () => {
    const result = resolveActivity("every day for 30 minutes");
    expect(result.kind).toBe("ask");
  });
});
