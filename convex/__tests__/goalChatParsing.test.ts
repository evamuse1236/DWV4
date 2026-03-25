import { describe, expect, it } from "vitest";

import { __goalChatTesting } from "../ai";

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
    expect(__goalChatTesting.parseSchedule(input)).toBe(expected);
  });

  it("supports removing/adding days in modification text", () => {
    const draft = { what: "practice piano", howLong: "30 minutes", when: "on mon, tue, fri" };

    expect(__goalChatTesting.isModificationRequest("remove tuesday")).toBe(true);

    const removed = __goalChatTesting.parseModification("remove tuesday", draft);
    expect(removed?.when).toBe("on mon, fri");

    const addedBack = __goalChatTesting.parseModification("add tuesday", { ...draft, when: "on mon, fri" });
    expect(addedBack?.when).toBe("on mon, tue, fri");
  });

  it("merges time-only updates onto an existing schedule", () => {
    expect(
      __goalChatTesting.deriveScheduleUpdate("after school", "on mon, tue, fri")
    ).toBe("on mon, tue, fri after school");
  });
});
