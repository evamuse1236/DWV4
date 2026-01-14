import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cn, formatRelativeDate } from "./utils";

describe("cn (classname utility)", () => {
  it("merges multiple class strings", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe(
      "base active"
    );
  });

  it("deduplicates and merges Tailwind classes", () => {
    // tailwind-merge should keep the last conflicting class
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays and objects from clsx", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles empty and undefined values", () => {
    expect(cn("", undefined, null, "foo")).toBe("foo");
  });
});

describe("formatRelativeDate", () => {
  // Mock Date.now() for consistent testing
  beforeEach(() => {
    vi.useFakeTimers();
    // Set "now" to a fixed date: Jan 15, 2025, 12:00:00 PM
    vi.setSystemTime(new Date("2025-01-15T12:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for times less than a minute ago', () => {
    const thirtySecondsAgo = new Date("2025-01-15T11:59:35");
    expect(formatRelativeDate(thirtySecondsAgo)).toBe("just now");
  });

  it('returns "X minute(s) ago" for times less than an hour ago', () => {
    const fiveMinutesAgo = new Date("2025-01-15T11:55:00");
    expect(formatRelativeDate(fiveMinutesAgo)).toBe("5 minutes ago");

    const oneMinuteAgo = new Date("2025-01-15T11:59:00");
    expect(formatRelativeDate(oneMinuteAgo)).toBe("1 minute ago");
  });

  it('returns "X hour(s) ago" for times less than a day ago', () => {
    const twoHoursAgo = new Date("2025-01-15T10:00:00");
    expect(formatRelativeDate(twoHoursAgo)).toBe("2 hours ago");

    const oneHourAgo = new Date("2025-01-15T11:00:00");
    expect(formatRelativeDate(oneHourAgo)).toBe("1 hour ago");
  });

  it('returns "yesterday" for times exactly one day ago', () => {
    const yesterday = new Date("2025-01-14T12:00:00");
    expect(formatRelativeDate(yesterday)).toBe("yesterday");
  });

  it('returns "X days ago" for times 2-6 days ago', () => {
    const threeDaysAgo = new Date("2025-01-12T12:00:00");
    expect(formatRelativeDate(threeDaysAgo)).toBe("3 days ago");
  });

  it("returns formatted date for times 7+ days ago", () => {
    const twoWeeksAgo = new Date("2025-01-01T12:00:00");
    // toLocaleDateString format depends on locale, just check it's not a relative format
    const result = formatRelativeDate(twoWeeksAgo);
    expect(result).not.toContain("ago");
    expect(result).not.toBe("yesterday");
  });

  it("accepts timestamps (numbers) as input", () => {
    const fiveMinutesAgoTimestamp = new Date("2025-01-15T11:55:00").getTime();
    expect(formatRelativeDate(fiveMinutesAgoTimestamp)).toBe("5 minutes ago");
  });
});
