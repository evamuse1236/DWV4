import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

    // Fetch book details
    return await Promise.all(
      studentBooks.map(async (sb) => {
        const book = await ctx.db.get(sb.bookId);
        return {
          ...sb,
          book,
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
    // Check if already started
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

// Update reading status
export const updateStatus = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    status: v.union(
      v.literal("reading"),
      v.literal("completed"), // Legacy status
      v.literal("presentation_requested"),
      v.literal("presented")
    ),
  },
  handler: async (ctx, args) => {
    const updates: any = { status: args.status };

    if (args.status === "completed") {
      updates.completedAt = Date.now();
    } else if (args.status === "presentation_requested") {
      updates.presentationRequestedAt = Date.now();
    } else if (args.status === "presented") {
      updates.presentedAt = Date.now();
    }

    await ctx.db.patch(args.studentBookId, updates);
  },
});;

// Add rating and review
export const addReview = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentBookId, {
      rating: args.rating,
      review: args.review,
    });
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
    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(bookId, filteredUpdates);
    return bookId;
  },
});

// Delete a book (admin only)
export const remove = mutation({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    // First, delete any student book associations
    const studentBooks = await ctx.db
      .query("studentBooks")
      .filter((q) => q.eq(q.field("bookId"), args.bookId))
      .collect();

    for (const sb of studentBooks) {
      await ctx.db.delete(sb._id);
    }

    // Then delete the book itself
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

    const reading = studentBooks.filter((sb) => sb.status === "reading").length;
    // Count both "completed" (legacy) and "presentation_requested" as pending
    const pendingPresentation = studentBooks.filter((sb) => 
      sb.status === "presentation_requested" || sb.status === "completed"
    ).length;
    const presented = studentBooks.filter((sb) => sb.status === "presented").length;

    return {
      total: studentBooks.length,
      reading,
      pendingPresentation,
      presented,
    };
  },
});;


// Get all pending presentation requests (for coach approval queue)
export const getPresentationRequests = query({
  args: {},
  handler: async (ctx) => {
    // Get all books pending presentation (both new and legacy statuses)
    const allBooks = await ctx.db
      .query("studentBooks")
      .collect();
    
    const requests = allBooks.filter(
      (sb) => sb.status === "presentation_requested" || sb.status === "completed"
    );

    // Fetch full details for each request
    return await Promise.all(
      requests.map(async (req) => {
        const user = await ctx.db.get(req.userId);
        const book = await ctx.db.get(req.bookId);
        return {
          ...req,
          user,
          book,
        };
      })
    );
  },
});;

// Approve or reject a presentation request
export const approvePresentationRequest = mutation({
  args: {
    studentBookId: v.id("studentBooks"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.approved) {
      await ctx.db.patch(args.studentBookId, {
        status: "presented",
        presentedAt: Date.now(),
      });
    } else {
      // Rejected - back to reading status
      await ctx.db.patch(args.studentBookId, {
        status: "reading",
        presentationRequestedAt: undefined,
      });
    }
  },
});
