import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  CHARACTER_XP,
  awardXpIfNotExists,
  getReadingDomainId,
} from "./characterAwards";

const DONE_STATUSES = new Set(["review_approved", "presented"]);

function hasReviewText(review?: string) {
  return Boolean(review && review.trim().length > 0);
}

function isDoneStatus(status: string) {
  return DONE_STATUSES.has(status);
}

function getDoneTimestamp(studentBook: any) {
  return (
    studentBook.reviewApprovedAt ??
    studentBook.presentedAt ??
    studentBook.reviewSubmittedAt ??
    studentBook.presentationRequestedAt ??
    studentBook.completedAt ??
    studentBook.startedAt ??
    0
  );
}

function ensureValidRating(rating?: number) {
  if (rating === undefined) return;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }
}

async function ensureCommentableReview(ctx: any, studentBookId: any) {
  const studentBook = await ctx.db.get(studentBookId);
  if (!studentBook) {
    throw new Error("Review not found");
  }
  if (!isDoneStatus(studentBook.status)) {
    throw new Error("Comments are only allowed on approved reviews");
  }
  if (!hasReviewText(studentBook.review)) {
    throw new Error("Comments require a published review");
  }
  return studentBook;
}

async function awardReviewDoneXp(ctx: any, studentBook: any) {
  const readingDomainId = await getReadingDomainId(ctx);
  await awardXpIfNotExists(ctx, {
    userId: studentBook.userId,
    sourceType: "reading_milestone",
    sourceKey: `reading_milestone:${studentBook._id}:review_approved`,
    xp: CHARACTER_XP.readingPresented,
    domainId: readingDomainId,
    meta: {
      studentBookId: studentBook._id,
      bookId: studentBook.bookId,
      status: "review_approved",
    },
  });
}

// Get all books
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("books").collect();
  },
});

// Get books by genre
export const getByGenre = query({
  args: { genre: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("books")
      .filter((q) => q.eq(q.field("genre"), args.genre))
      .collect();
  },
});

// Get student's books
export const getStudentBooks = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const studentBooks = await ctx.db
      .query("studentBooks")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return await Promise.all(
      studentBooks.map(async (studentBook) => {
        const book = await ctx.db.get(studentBook.bookId);
        return {
          ...studentBook,
          book,
        };
      })
    );
  },
});

// Get reading history for AI context (Book Buddy)
export const getReadingHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const studentBooks = await ctx.db
      .query("studentBooks")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    return await Promise.all(
      studentBooks.map(async (studentBook) => {
        const book = await ctx.db.get(studentBook.bookId);
        return {
          title: book?.title || "Unknown",
          author: book?.author || "Unknown",
          genre: book?.genre,
          rating: studentBook.rating,
          status: studentBook.status,
        };
      })
    );
  },
});

// Get currently reading book
export const getCurrentlyReading = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const reading = await ctx.db
      .query("studentBooks")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("status"), "reading")
        )
      )
      .first();

    if (!reading) return null;

    const book = await ctx.db.get(reading.bookId);
    return { ...reading, book };
  },
});

// Start reading a book
export const startReading = mutation({
  args: {
    userId: v.id("users"),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studentBooks")
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.eq(q.field("bookId"), args.bookId)
        )
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("studentBooks", {
      userId: args.userId,
      bookId: args.bookId,
      status: "reading",
      startedAt: Date.now(),
    });
  },
});

// Legacy status updater (kept for compatibility)
export const updateStatus = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    status: v.union(
      v.literal("reading"),
      v.literal("completed"),
      v.literal("review_draft"),
      v.literal("review_submitted"),
      v.literal("review_changes_requested"),
      v.literal("review_approved"),
      v.literal("presentation_requested"),
      v.literal("presented")
    ),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }

    const now = Date.now();
    const updates: any = { status: args.status };

    if (args.status === "completed") {
      updates.completedAt = now;
    } else if (args.status === "presentation_requested") {
      updates.presentationRequestedAt = now;
    } else if (args.status === "presented") {
      updates.presentedAt = now;
    } else if (args.status === "review_submitted") {
      updates.reviewSubmittedAt = now;
    } else if (args.status === "review_approved") {
      updates.reviewApprovedAt = now;
    }

    await ctx.db.patch(args.studentBookId, updates);

    if (args.status === "presentation_requested" && studentBook.status !== "presentation_requested") {
      const readingDomainId = await getReadingDomainId(ctx);
      await awardXpIfNotExists(ctx, {
        userId: studentBook.userId,
        sourceType: "reading_milestone",
        sourceKey: `reading_milestone:${args.studentBookId}:presentation_requested`,
        xp: CHARACTER_XP.readingPresentationRequested,
        domainId: readingDomainId,
        meta: {
          studentBookId: args.studentBookId,
          bookId: studentBook.bookId,
          status: "presentation_requested",
        },
      });
    }

    if (args.status === "review_approved" && !isDoneStatus(studentBook.status)) {
      await awardReviewDoneXp(ctx, {
        ...studentBook,
        _id: args.studentBookId,
      });
    }

    if (args.status === "presented" && studentBook.status !== "presented") {
      const readingDomainId = await getReadingDomainId(ctx);
      await awardXpIfNotExists(ctx, {
        userId: studentBook.userId,
        sourceType: "reading_milestone",
        sourceKey: `reading_milestone:${args.studentBookId}:presented`,
        xp: CHARACTER_XP.readingPresented,
        domainId: readingDomainId,
        meta: {
          studentBookId: args.studentBookId,
          bookId: studentBook.bookId,
          status: "presented",
        },
      });
    }
  },
});

// Legacy review writer (kept for compatibility)
export const addReview = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    ensureValidRating(args.rating);
    await ctx.db.patch(args.studentBookId, {
      rating: args.rating,
      review: args.review,
    });
  },
});

export const saveReviewDraft = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }

    ensureValidRating(args.rating);
    const updates: any = {};

    if (args.review !== undefined) {
      updates.review = args.review.trim();
    }
    if (args.rating !== undefined) {
      updates.rating = args.rating;
    }
    if (studentBook.status === "reading") {
      updates.status = "review_draft";
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.studentBookId, updates);
    }
  },
});

export const submitReview = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    rating: v.optional(v.number()),
    review: v.string(),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }

    ensureValidRating(args.rating);
    const normalizedReview = args.review.trim();
    if (!normalizedReview) {
      throw new Error("Review text is required");
    }

    const now = Date.now();
    const updates: any = {
      review: normalizedReview,
      reviewSubmittedAt: now,
      status: "review_submitted",
    };

    if (args.rating !== undefined) {
      updates.rating = args.rating;
    }

    if (studentBook.status === "review_approved" || studentBook.status === "presented") {
      updates.status = studentBook.status;
    }

    await ctx.db.patch(args.studentBookId, updates);
  },
});

export const approveReview = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    approvedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }
    if (!hasReviewText(studentBook.review)) {
      throw new Error("Cannot approve an empty review");
    }

    const now = Date.now();
    const updates: any = {
      status: "review_approved",
      reviewApprovedAt: now,
    };

    if (args.approvedBy !== undefined) {
      updates.reviewApprovedBy = args.approvedBy;
    }

    await ctx.db.patch(args.studentBookId, updates);

    if (!isDoneStatus(studentBook.status)) {
      await awardReviewDoneXp(ctx, {
        ...studentBook,
        _id: args.studentBookId,
      });
    }
  },
});

export const requestReviewChanges = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    feedback: v.string(),
    feedbackBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }

    const normalizedFeedback = args.feedback.trim();
    if (!normalizedFeedback) {
      throw new Error("Feedback is required");
    }

    const updates: any = {
      status: "review_changes_requested",
      coachFeedback: normalizedFeedback,
      coachFeedbackAt: Date.now(),
    };

    if (args.feedbackBy !== undefined) {
      updates.coachFeedbackBy = args.feedbackBy;
    }

    await ctx.db.patch(args.studentBookId, updates);
  },
});

// Create a new book (admin only)
export const create = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    coverImageUrl: v.optional(v.string()),
    readingUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    genre: v.optional(v.string()),
    pageCount: v.optional(v.number()),
    addedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("books", {
      ...args,
      isPrePopulated: false,
      createdAt: Date.now(),
    });
  },
});

// Update an existing book (admin only)
export const update = mutation({
  args: {
    bookId: v.id("books"),
    title: v.optional(v.string()),
    author: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    readingUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    genre: v.optional(v.string()),
    pageCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { bookId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(bookId, filteredUpdates);
    return bookId;
  },
});

// Delete a book (admin only)
export const remove = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    const studentBooks = await ctx.db
      .query("studentBooks")
      .filter((q) => q.eq(q.field("bookId"), args.bookId))
      .collect();

    for (const studentBook of studentBooks) {
      await ctx.db.delete(studentBook._id);
    }

    await ctx.db.delete(args.bookId);
    return { success: true };
  },
});

// Remove a book from student's reading list
export const removeFromMyBooks = mutation({
  args: { studentBookId: v.id("studentBooks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.studentBookId);
    return { success: true };
  },
});

// Get reading stats for a student
export const getReadingStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const studentBooks = await ctx.db
      .query("studentBooks")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const reading = studentBooks.filter((studentBook) =>
      studentBook.status === "reading" ||
      studentBook.status === "review_draft" ||
      studentBook.status === "review_changes_requested"
    ).length;

    const pendingReview = studentBooks.filter((studentBook) =>
      studentBook.status === "review_submitted" ||
      studentBook.status === "presentation_requested" ||
      studentBook.status === "completed"
    ).length;

    const approved = studentBooks.filter((studentBook) =>
      studentBook.status === "review_approved" || studentBook.status === "presented"
    ).length;

    return {
      total: studentBooks.length,
      reading,
      pendingReview,
      approved,
      pendingPresentation: pendingReview,
      presented: approved,
    };
  },
});

// Get all pending review submissions for coach approval queue
export const getReviewSubmissions = query({
  args: {},
  handler: async (ctx) => {
    const studentBooks = await ctx.db.query("studentBooks").collect();
    const submissions = studentBooks
      .filter((studentBook) =>
        studentBook.status === "review_submitted" ||
        studentBook.status === "presentation_requested" ||
        studentBook.status === "completed"
      )
      .sort((a, b) => getDoneTimestamp(b) - getDoneTimestamp(a));

    return await Promise.all(
      submissions.map(async (submission) => {
        const user = await ctx.db.get(submission.userId);
        const book = await ctx.db.get(submission.bookId);
        return {
          ...submission,
          user,
          book,
        };
      })
    );
  },
});

// Backward-compatible alias
export const getPresentationRequests = query({
  args: {},
  handler: async (ctx) => {
    const studentBooks = await ctx.db.query("studentBooks").collect();
    const submissions = studentBooks
      .filter((studentBook) =>
        studentBook.status === "review_submitted" ||
        studentBook.status === "presentation_requested" ||
        studentBook.status === "completed"
      )
      .sort((a, b) => getDoneTimestamp(b) - getDoneTimestamp(a));

    return await Promise.all(
      submissions.map(async (submission) => {
        const user = await ctx.db.get(submission.userId);
        const book = await ctx.db.get(submission.bookId);
        return {
          ...submission,
          user,
          book,
        };
      })
    );
  },
});

// Backward-compatible alias
export const approvePresentationRequest = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }

    if (args.approved) {
      const now = Date.now();
      await ctx.db.patch(args.studentBookId, {
        status: "review_approved",
        reviewApprovedAt: now,
      });
      if (!isDoneStatus(studentBook.status)) {
        await awardReviewDoneXp(ctx, {
          ...studentBook,
          _id: args.studentBookId,
        });
      }
    } else {
      await ctx.db.patch(args.studentBookId, {
        status: "review_changes_requested",
        coachFeedback: "Please update your review and submit again.",
        coachFeedbackAt: Date.now(),
      });
    }
  },
});

export const getApprovedReviews = query({
  args: {},
  handler: async (ctx) => {
    const studentBooks = await ctx.db.query("studentBooks").collect();
    const approvedReviews = studentBooks
      .filter((studentBook) =>
        isDoneStatus(studentBook.status) && hasReviewText(studentBook.review)
      )
      .sort((a, b) => getDoneTimestamp(b) - getDoneTimestamp(a));

    return await Promise.all(
      approvedReviews.map(async (review) => {
        const user = await ctx.db.get(review.userId);
        const book = await ctx.db.get(review.bookId);
        return {
          ...review,
          user,
          book,
        };
      })
    );
  },
});

export const getReviewComments = query({
  args: { studentBookId: v.id("studentBooks") },
  handler: async (ctx, args) => {
    await ensureCommentableReview(ctx, args.studentBookId);

    const comments = await ctx.db
      .query("bookReviewComments")
      .withIndex("by_review_created", (q) => q.eq("studentBookId", args.studentBookId))
      .collect();

    return await Promise.all(
      comments.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        return {
          ...comment,
          user,
        };
      })
    );
  },
});

export const addReviewComment = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await ensureCommentableReview(ctx, args.studentBookId);

    const message = args.message.trim();
    if (!message) {
      throw new Error("Comment cannot be empty");
    }

    return await ctx.db.insert("bookReviewComments", {
      studentBookId: args.studentBookId,
      userId: args.userId,
      message,
      createdAt: Date.now(),
    });
  },
});
