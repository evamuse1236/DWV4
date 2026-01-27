import { describe, expect, it } from "vitest";

import { __goalChatTesting } from "../ai";

describe("goal chat parsing (hybrid)", () => {
  it("parses simple schedule answers like 'one day'", () => {
    expect(__goalChatTesting.parseSchedule("one day")).toBe("1x per week");
    expect(__goalChatTesting.parseSchedule("just one day")).toBe("1x per week");
    expect(__goalChatTesting.parseSchedule("once a week")).toBe("1x per week");
    expect(__goalChatTesting.parseSchedule("twice a week")).toBe("2x per week");
  });

  it("treats 'after school' as weekdays + time qualifier", () => {
    expect(__goalChatTesting.parseSchedule("after school")).toBe("on weekdays after school");
    expect(__goalChatTesting.parseSchedule("weekdays after school")).toBe("on weekdays after school");
    expect(__goalChatTesting.parseSchedule("mon tues and fri after school")).toBe(
      "on mon, tue, fri after school"
    );
  });

  it("does not duplicate morning/night qualifiers", () => {
    expect(__goalChatTesting.parseSchedule("every morning")).toBe("every morning");
    expect(__goalChatTesting.parseSchedule("mornings")).toBe("every morning");
  });

  it("parses combined base + time qualifiers", () => {
    expect(__goalChatTesting.parseSchedule("weekdays mornings")).toBe("on weekdays in the morning");
    expect(__goalChatTesting.parseSchedule("on weekends at 7pm")).toBe("on weekends at 7pm");
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
