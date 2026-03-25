import { beforeEach, describe, expect, it } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "@convex/_generated/dataModel";

describe("books lifecycle data rules", () => {
  let ctx: ReturnType<typeof createMockCtx>;
  let userId: Id<"users">;
  let bookId: Id<"books">;

  beforeEach(() => {
    resetMockIdCounter();
    ctx = createMockCtx();

    userId = createMockId("users");
    bookId = createMockId("books");

    ctx.db._seed(userId, {
      username: "student",
      role: "student",
      displayName: "Student",
      createdAt: Date.now(),
    });

    ctx.db._seed(bookId, {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      source: "seed",
      libraryStatus: "curated",
      needsAdminReview: false,
      isPrePopulated: true,
      createdAt: Date.now(),
    });
  });

  it("creates reading record idempotently", async () => {
    const first = await ctx.db.insert("studentBooks", {
      userId,
      bookId,
      status: "reading",
      startedAt: Date.now(),
    });

    const existing = await ctx.db
      .query("studentBooks")
      .filter((query) =>
        query.and(query.eq(query.field("userId"), userId), query.eq(query.field("bookId"), bookId))
      )
      .first();

    expect(existing?._id).toBe(first);
  });

  it("supports review draft notes before a book is finished", async () => {
    const studentBookId = await ctx.db.insert("studentBooks", {
      userId,
      bookId,
      status: "reading",
      startedAt: Date.now(),
    });

    await ctx.db.patch(studentBookId, {
      status: "review_draft",
      review: "Draft text",
      rating: 4,
    });

    const updated = await ctx.db.get(studentBookId);
    expect(updated?.status).toBe("review_draft");
    expect(updated?.review).toBe("Draft text");
    expect(updated?.rating).toBe(4);
  });

  it("counts active, finished, and reviewed books using the no-approval flow plus legacy rows", async () => {
    const statuses = [
      "reading",
      "review_draft",
      "already_read",
      "review_changes_requested",
      "review_submitted",
      "completed",
      "presentation_requested",
      "review_approved",
      "presented",
    ] as const;

    for (const status of statuses) {
      await ctx.db.insert("studentBooks", {
        userId,
        bookId,
        status,
        startedAt: Date.now(),
      });
    }

    const rows = await ctx.db
      .query("studentBooks")
      .filter((query) => query.eq(query.field("userId"), userId))
      .collect();

    const reading = rows.filter(
      (row) => row.status === "reading" || row.status === "review_draft"
    ).length;

    const finished = rows.filter(
      (row) =>
        row.status === "already_read" ||
        row.status === "completed" ||
        row.status === "review_submitted" ||
        row.status === "review_changes_requested" ||
        row.status === "review_approved" ||
        row.status === "presentation_requested" ||
        row.status === "presented"
    ).length;

    const reviewed = rows.filter((row) => Boolean(row.review?.trim())).length;

    expect(reading).toBe(2);
    expect(finished).toBe(7);
    expect(reviewed).toBe(0);
  });

  it("treats any finished row with text as a community-visible review", async () => {
    await ctx.db.insert("studentBooks", {
      userId,
      bookId,
      status: "completed",
      review: "Great themes and pacing.",
      startedAt: Date.now(),
      completedAt: Date.now(),
      reviewSubmittedAt: Date.now(),
    });

    await ctx.db.insert("studentBooks", {
      userId,
      bookId,
      status: "review_approved",
      review: "   ",
      startedAt: Date.now(),
      reviewApprovedAt: Date.now(),
    });

    await ctx.db.insert("studentBooks", {
      userId,
      bookId,
      status: "review_submitted",
      review: "Shared right away",
      startedAt: Date.now(),
      reviewSubmittedAt: Date.now(),
    });

    await ctx.db.insert("studentBooks", {
      userId,
      bookId,
      status: "review_draft",
      review: "Still private",
      startedAt: Date.now(),
    });

    const rows = await ctx.db.query("studentBooks").collect();
    const visible = rows.filter(
      (row) =>
        (
          row.status === "completed" ||
          row.status === "review_submitted" ||
          row.status === "review_changes_requested" ||
          row.status === "review_approved" ||
          row.status === "presentation_requested" ||
          row.status === "presented"
        ) &&
        Boolean(row.review?.trim())
    );

    expect(visible).toHaveLength(2);
    expect(visible.map((row) => row.review)).toEqual([
      "Great themes and pacing.",
      "Shared right away",
    ]);
  });
});
