import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
  CHARACTER_XP,
  awardXpIfNotExists,
  getReadingDomainId,
} from "./characterAwards";
import { requireAdmin, requireUserMatch, toSafeUser } from "./authz";

const DONE_STATUSES = new Set([
  "already_read",
  "completed",
  "review_submitted",
  "review_changes_requested",
  "review_approved",
  "presentation_requested",
  "presented",
]);
const ACTIVE_READING_STATUSES = new Set(["reading", "review_draft"]);
const REVIEW_QUEUE_STATUSES = [
  "review_submitted",
  "presentation_requested",
  "completed",
] as const;
const COMMUNITY_REVIEW_STATUSES = [
  "completed",
  "review_submitted",
  "review_changes_requested",
  "review_approved",
  "presentation_requested",
  "presented",
] as const;

type BookInput = {
  title: string;
  author: string;
  coverImageUrl?: string;
  readingUrl?: string;
  description?: string;
  gradeLevel?: string;
  genre?: string;
  pageCount?: number;
};

function cleanOptionalText(value?: string) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeBookIdentityPart(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBookIdentity(title: string, author: string) {
  return `${normalizeBookIdentityPart(title)}::${normalizeBookIdentityPart(author)}`;
}

function normalizeBookInput(input: BookInput): BookInput {
  return {
    title: input.title.trim(),
    author: input.author.trim(),
    coverImageUrl: cleanOptionalText(input.coverImageUrl),
    readingUrl: cleanOptionalText(input.readingUrl),
    description: cleanOptionalText(input.description),
    gradeLevel: cleanOptionalText(input.gradeLevel),
    genre: cleanOptionalText(input.genre),
    pageCount:
      typeof input.pageCount === "number" && Number.isFinite(input.pageCount)
        ? input.pageCount
        : undefined,
  };
}

function sortLibraryBooks<T extends { title: string; author: string; libraryStatus?: string; needsAdminReview?: boolean }>(books: T[]) {
  return [...books].sort((a, b) => {
    const reviewDelta = Number(Boolean(a.needsAdminReview)) - Number(Boolean(b.needsAdminReview));
    if (reviewDelta !== 0) return reviewDelta;

    const statusWeight = (book: T) => (book.libraryStatus === "draft" ? 1 : 0);
    const statusDelta = statusWeight(a) - statusWeight(b);
    if (statusDelta !== 0) return statusDelta;

    const titleCompare = a.title.localeCompare(b.title);
    if (titleCompare !== 0) return titleCompare;
    return a.author.localeCompare(b.author);
  });
}

async function getAllBooks(ctx: any) {
  return await ctx.db.query("books").collect();
}

async function findBookByIdentity(ctx: any, title: string, author: string) {
  const targetIdentity = normalizeBookIdentity(title, author);
  const books = await getAllBooks(ctx);
  return books.find(
    (book: any) => normalizeBookIdentity(book.title, book.author) === targetIdentity
  );
}

function getMissingMetadataPatch(existing: any, input: BookInput) {
  const patch: Record<string, unknown> = {};
  const normalizedInput = normalizeBookInput(input);

  if (!existing.coverImageUrl && normalizedInput.coverImageUrl) patch.coverImageUrl = normalizedInput.coverImageUrl;
  if (!existing.readingUrl && normalizedInput.readingUrl) patch.readingUrl = normalizedInput.readingUrl;
  if (!existing.description && normalizedInput.description) patch.description = normalizedInput.description;
  if (!existing.gradeLevel && normalizedInput.gradeLevel) patch.gradeLevel = normalizedInput.gradeLevel;
  if (!existing.genre && normalizedInput.genre) patch.genre = normalizedInput.genre;
  if (!existing.pageCount && normalizedInput.pageCount) patch.pageCount = normalizedInput.pageCount;

  return patch;
}

async function findStudentBook(ctx: any, userId: any, bookId: any) {
  return await ctx.db
    .query("studentBooks")
    .withIndex("by_user_book", (q: any) => q.eq("userId", userId).eq("bookId", bookId))
    .first();
}

function hasReviewText(review?: string) {
  return Boolean(review && review.trim().length > 0);
}

function isDoneStatus(status: string) {
  return DONE_STATUSES.has(status);
}

function getDoneTimestamp(studentBook: any) {
  return (
    studentBook.reviewSubmittedAt ??
    studentBook.completedAt ??
    studentBook.reviewApprovedAt ??
    studentBook.presentedAt ??
    studentBook.presentationRequestedAt ??
    studentBook.startedAt ??
    0
  );
}

function getNormalizedCompletedAt(studentBook: any, now: number) {
  return (
    studentBook.completedAt ??
    studentBook.reviewApprovedAt ??
    studentBook.presentedAt ??
    studentBook.reviewSubmittedAt ??
    studentBook.presentationRequestedAt ??
    now
  );
}

function getNormalizedDoneStatus(studentBook: any) {
  return studentBook.status === "presented" ? "presented" : "completed";
}

function ensureValidRating(rating?: number) {
  if (rating === undefined) return;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be an integer between 1 and 5");
  }
}

async function getStudentBooksByStatuses(
  ctx: any,
  statuses: readonly string[],
) {
  const studentBooksByStatus = await Promise.all(
    statuses.map((status) =>
      ctx.db
        .query("studentBooks")
        .withIndex("by_status", (q: any) => q.eq("status", status))
        .collect()
    )
  );

  return studentBooksByStatus.flat();
}

async function hydrateStudentBookSubmission(ctx: any, studentBook: any) {
  const [user, book] = await Promise.all([
    ctx.db.get(studentBook.userId),
    ctx.db.get(studentBook.bookId),
  ]);

  return {
    ...studentBook,
    user: user ? toSafeUser(user) : null,
    book: book ?? null,
  };
}

async function ensureCommentableReview(ctx: any, studentBookId: any) {
  const studentBook = await ctx.db.get(studentBookId);
  if (!studentBook) {
    throw new Error("Review not found");
  }
  if (!isDoneStatus(studentBook.status)) {
    throw new Error("Comments are only allowed on finished books with reviews");
  }
  if (!hasReviewText(studentBook.review)) {
    throw new Error("Comments require a submitted review");
  }
  return studentBook;
}

async function awardFinishedBookXp(ctx: any, studentBook: any) {
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
    return sortLibraryBooks(await getAllBooks(ctx));
  },
});

// Get books by genre
export const getByGenre = query({
  args: { genre: v.string() },
  handler: async (ctx, args) => {
    return sortLibraryBooks(
      await ctx.db
      .query("books")
      .filter((q) => q.eq(q.field("genre"), args.genre))
      .collect()
    );
  },
});

// Get student's books
export const getStudentBooks = query({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
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
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
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
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
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
    token: v.string(),
    userId: v.id("users"),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const existing = await findStudentBook(ctx, args.userId, args.bookId);

    if (existing) {
      if (existing.status === "already_read") {
        await ctx.db.patch(existing._id, {
          status: "reading",
          startedAt: existing.startedAt ?? Date.now(),
        });
      }
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

export const markAlreadyRead = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    bookId: v.id("books"),
  },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const existing = await findStudentBook(ctx, args.userId, args.bookId);
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "already_read",
        completedAt: existing.completedAt ?? now,
      });
      return existing._id;
    }

    return await ctx.db.insert("studentBooks", {
      userId: args.userId,
      bookId: args.bookId,
      status: "already_read",
      startedAt: now,
      completedAt: now,
    });
  },
});

export const finishBook = mutation({
  args: {
    token: v.string(),
    studentBookId: v.id("studentBooks"),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }
    await requireUserMatch(ctx, args.token, studentBook.userId);

    ensureValidRating(args.rating);
    const now = Date.now();
    const updates: any = {
      status: getNormalizedDoneStatus(studentBook),
      completedAt: getNormalizedCompletedAt(studentBook, now),
    };

    if (args.rating !== undefined) {
      updates.rating = args.rating;
    }

    if (args.review !== undefined) {
      const normalizedReview = args.review.trim();
      updates.review = normalizedReview;
      if (normalizedReview) {
        updates.reviewSubmittedAt = now;
      }
    }

    await ctx.db.patch(args.studentBookId, updates);

    if (!isDoneStatus(studentBook.status)) {
      await awardFinishedBookXp(ctx, {
        ...studentBook,
        _id: args.studentBookId,
      });
    }
  },
});

// Legacy status updater (kept for compatibility)
export const updateStatus = mutation({
  args: {
    adminToken: v.string(),
    studentBookId: v.id("studentBooks"),
    status: v.union(
      v.literal("reading"),
      v.literal("already_read"),
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
    await requireAdmin(ctx, args.adminToken);
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }

    const now = Date.now();
    const updates: any = { status: args.status };

    if (args.status === "already_read" || args.status === "completed") {
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
      await awardFinishedBookXp(ctx, {
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
    token: v.string(),
    studentBookId: v.id("studentBooks"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }
    await requireUserMatch(ctx, args.token, studentBook.userId);
    ensureValidRating(args.rating);
    await ctx.db.patch(args.studentBookId, {
      rating: args.rating,
      review: args.review,
    });
  },
});

export const saveReviewDraft = mutation({
  args: {
    token: v.string(),
    studentBookId: v.id("studentBooks"),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }
    await requireUserMatch(ctx, args.token, studentBook.userId);

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
    token: v.string(),
    studentBookId: v.id("studentBooks"),
    rating: v.optional(v.number()),
    review: v.string(),
  },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }
    await requireUserMatch(ctx, args.token, studentBook.userId);
    if (!isDoneStatus(studentBook.status)) {
      throw new Error("Finish the book before sharing a review");
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
      status: getNormalizedDoneStatus(studentBook),
      completedAt: getNormalizedCompletedAt(studentBook, now),
    };

    if (args.rating !== undefined) {
      updates.rating = args.rating;
    }

    await ctx.db.patch(args.studentBookId, updates);
  },
});

export const approveReview = mutation({
  args: {
    adminToken: v.string(),
    studentBookId: v.id("studentBooks"),
    approvedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
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
      await awardFinishedBookXp(ctx, {
        ...studentBook,
        _id: args.studentBookId,
      });
    }
  },
});

export const requestReviewChanges = mutation({
  args: {
    adminToken: v.string(),
    studentBookId: v.id("studentBooks"),
    feedback: v.string(),
    feedbackBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
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
    adminToken: v.string(),
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
    await requireAdmin(ctx, args.adminToken);
    const normalized = normalizeBookInput(args);
    const existing = await findBookByIdentity(ctx, normalized.title, normalized.author);

    if (existing) {
      const metadataPatch = getMissingMetadataPatch(existing, normalized);
      if (Object.keys(metadataPatch).length > 0 || existing.needsAdminReview || existing.libraryStatus !== "curated") {
        await ctx.db.patch(existing._id, {
          ...metadataPatch,
          needsAdminReview: false,
          libraryStatus: "curated",
          addedBy: args.addedBy ?? existing.addedBy,
        });
      }
      return existing._id;
    }

    return await ctx.db.insert("books", {
      ...normalized,
      source: "admin",
      libraryStatus: "curated",
      needsAdminReview: false,
      submittedBy: undefined,
      isPrePopulated: false,
      addedBy: args.addedBy,
      createdAt: Date.now(),
    });
  },
});

export const createStudentSubmission = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    title: v.string(),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const normalized = normalizeBookInput({
      title: args.title,
      author: args.author,
    });
    const existing = await findBookByIdentity(ctx, normalized.title, normalized.author);

    if (existing) {
      return {
        bookId: existing._id,
        created: false,
        mergedWithExisting: true,
      };
    }

    const bookId = await ctx.db.insert("books", {
      ...normalized,
      source: "student",
      libraryStatus: "draft",
      needsAdminReview: true,
      submittedBy: args.userId,
      isPrePopulated: false,
      addedBy: args.userId,
      createdAt: Date.now(),
    });

    return {
      bookId,
      created: true,
      mergedWithExisting: false,
    };
  },
});

export const bulkImport = mutation({
  args: {
    adminToken: v.string(),
    rows: v.array(
      v.object({
        title: v.string(),
        author: v.string(),
        genre: v.optional(v.string()),
        gradeLevel: v.optional(v.string()),
        description: v.optional(v.string()),
        coverImageUrl: v.optional(v.string()),
        readingUrl: v.optional(v.string()),
        pageCount: v.optional(v.number()),
      })
    ),
    addedBy: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const invalidRows: Array<{ rowNumber: number; reason: string }> = [];
    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;

    for (const [index, row] of args.rows.entries()) {
      const normalized = normalizeBookInput(row);
      if (!normalized.title || !normalized.author) {
        invalidRows.push({
          rowNumber: index + 1,
          reason: "Title and author are required",
        });
        continue;
      }

      const existing = await findBookByIdentity(ctx, normalized.title, normalized.author);
      if (existing) {
        const metadataPatch = getMissingMetadataPatch(existing, normalized);
        const shouldClearReview = existing.needsAdminReview || existing.libraryStatus !== "curated";
        if (Object.keys(metadataPatch).length > 0 || shouldClearReview) {
          await ctx.db.patch(existing._id, {
            ...metadataPatch,
            needsAdminReview: false,
            libraryStatus: "curated",
            addedBy: args.addedBy ?? existing.addedBy,
          });
          updatedCount += 1;
        } else {
          unchangedCount += 1;
        }
        continue;
      }

      await ctx.db.insert("books", {
        ...normalized,
        source: "admin",
        libraryStatus: "curated",
        needsAdminReview: false,
        submittedBy: undefined,
        isPrePopulated: false,
        addedBy: args.addedBy,
        createdAt: Date.now(),
      });
      createdCount += 1;
    }

    return {
      createdCount,
      updatedCount,
      unchangedCount,
      invalidRows,
    };
  },
});

// Update an existing book (admin only)
export const update = mutation({
  args: {
    adminToken: v.string(),
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
    await requireAdmin(ctx, args.adminToken);
    const { adminToken: _adminToken, bookId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries({
        ...updates,
        title: cleanOptionalText(updates.title) ?? updates.title,
        author: cleanOptionalText(updates.author) ?? updates.author,
        coverImageUrl: cleanOptionalText(updates.coverImageUrl),
        readingUrl: cleanOptionalText(updates.readingUrl),
        description: cleanOptionalText(updates.description),
        gradeLevel: cleanOptionalText(updates.gradeLevel),
        genre: cleanOptionalText(updates.genre),
      }).filter(([, value]) => value !== undefined)
    );
    await ctx.db.patch(bookId, {
      ...filteredUpdates,
      needsAdminReview: false,
      libraryStatus: "curated",
    });
    return bookId;
  },
});

// Delete a book (admin only)
export const remove = mutation({
  args: { adminToken: v.string(), bookId: v.id("books") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
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
  args: { token: v.string(), studentBookId: v.id("studentBooks") },
  handler: async (ctx, args) => {
    const studentBook = await ctx.db.get(args.studentBookId);
    if (!studentBook) {
      throw new Error("Student book not found");
    }
    await requireUserMatch(ctx, args.token, studentBook.userId);
    await ctx.db.delete(args.studentBookId);
    return { success: true };
  },
});

// Get reading stats for a student
export const getReadingStats = query({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
    const studentBooks = await ctx.db
      .query("studentBooks")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();

    const reading = studentBooks.filter((studentBook) =>
      ACTIVE_READING_STATUSES.has(studentBook.status)
    ).length;

    const finished = studentBooks.filter((studentBook) => isDoneStatus(studentBook.status)).length;
    const reviewed = studentBooks.filter(
      (studentBook) => isDoneStatus(studentBook.status) && hasReviewText(studentBook.review)
    ).length;

    return {
      total: studentBooks.length,
      reading,
      finished,
      reviewed,
      pendingReview: 0,
      approved: finished,
      pendingPresentation: 0,
      presented: finished,
    };
  },
});

// Get all pending review submissions for coach approval queue
export const getReviewSubmissions = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const submissions = (await getStudentBooksByStatuses(ctx, REVIEW_QUEUE_STATUSES))
      .sort((a, b) => getDoneTimestamp(b) - getDoneTimestamp(a));

    return await Promise.all(submissions.map((submission) => hydrateStudentBookSubmission(ctx, submission)));
  },
});

// Backward-compatible alias
export const getPresentationRequests = query({
  args: { adminToken: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
    const submissions = (await getStudentBooksByStatuses(ctx, REVIEW_QUEUE_STATUSES))
      .sort((a, b) => getDoneTimestamp(b) - getDoneTimestamp(a));

    return await Promise.all(submissions.map((submission) => hydrateStudentBookSubmission(ctx, submission)));
  },
});

// Backward-compatible alias
export const approvePresentationRequest = mutation({
  args: {
    adminToken: v.string(),
    studentBookId: v.id("studentBooks"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.adminToken);
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
        await awardFinishedBookXp(ctx, {
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
    const approvedReviews = (await getStudentBooksByStatuses(ctx, COMMUNITY_REVIEW_STATUSES))
      .filter((studentBook) => hasReviewText(studentBook.review))
      .sort((a, b) => getDoneTimestamp(b) - getDoneTimestamp(a));

    return await Promise.all(approvedReviews.map((review) => hydrateStudentBookSubmission(ctx, review)));
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
          user: user ? toSafeUser(user) : null,
        };
      })
    );
  },
});

export const addReviewComment = mutation({
  args: {
    token: v.string(),
    studentBookId: v.id("studentBooks"),
    userId: v.id("users"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    await requireUserMatch(ctx, args.token, args.userId);
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
