import { beforeEach, describe, expect, it } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

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

  it("supports review draft -> submitted -> changes requested -> approved", async () => {
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

    await ctx.db.patch(studentBookId, {
      status: "review_submitted",
      reviewSubmittedAt: Date.now(),
    });

    await ctx.db.patch(studentBookId, {
      status: "review_changes_requested",
      coachFeedback: "Add more detail.",
      coachFeedbackAt: Date.now(),
    });

    await ctx.db.patch(studentBookId, {
      status: "review_approved",
      reviewApprovedAt: Date.now(),
      reviewApprovedBy: createMockId("users"),
    });

    const updated = await ctx.db.get(studentBookId);
    expect(updated?.status).toBe("review_approved");
    expect(updated?.review).toBe("Draft text");
    expect(updated?.coachFeedback).toBe("Add more detail.");
    expect(updated?.reviewSubmittedAt).toBeDefined();
    expect(updated?.reviewApprovedAt).toBeDefined();
  });

  it("counts reading, pending, and approved using review workflow + legacy", async () => {
    const statuses = [
      "reading",
      "review_draft",
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
      (row) =>
        row.status === "reading" ||
        row.status === "review_draft" ||
        row.status === "review_changes_requested"
    ).length;

    const pending = rows.filter(
      (row) =>
        row.status === "review_submitted" ||
        row.status === "completed" ||
        row.status === "presentation_requested"
    ).length;

    const approved = rows.filter(
      (row) => row.status === "review_approved" || row.status === "presented"
    ).length;

    expect(reading).toBe(3);
    expect(pending).toBe(3);
    expect(approved).toBe(2);
  });

  it("treats only approved rows with text as community-visible reviews", async () => {
    await ctx.db.insert("studentBooks", {
      userId,
      bookId,
      status: "review_approved",
      review: "Great themes and pacing.",
      startedAt: Date.now(),
      reviewApprovedAt: Date.now(),
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
      review: "Not approved yet",
      startedAt: Date.now(),
      reviewSubmittedAt: Date.now(),
    });

    const rows = await ctx.db.query("studentBooks").collect();
    const visible = rows.filter(
      (row) =>
        (row.status === "review_approved" || row.status === "presented") &&
        Boolean(row.review?.trim())
    );

    expect(visible).toHaveLength(1);
    expect(visible[0].review).toBe("Great themes and pacing.");
  });
});
