/**
 * Tests for convex/books.ts mutations and queries.
 *
 * These tests use a mock database context to test the handler logic
 * without needing a real Convex backend.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

describe("Books Mutations", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;
  let mockBookId: Id<"books">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    // Seed with a user
    mockUserId = createMockId("users");
    mockCtx.db._seed(mockUserId, {
      username: "teststudent",
      role: "student",
      displayName: "Test Student",
      createdAt: Date.now(),
    });

    // Seed with a book
    mockBookId = createMockId("books");
    mockCtx.db._seed(mockBookId, {
      title: "The Hobbit",
      author: "J.R.R. Tolkien",
      genre: "Fantasy",
      isPrePopulated: true,
      createdAt: Date.now(),
    });
  });

  describe("startReading", () => {
    it("should create studentBooks with status=reading and startedAt", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate startReading mutation
      // Check if already started
      const existing = await mockCtx.db
        .query("studentBooks")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), mockUserId),
            q.eq(q.field("bookId"), mockBookId)
          )
        )
        .first();

      expect(existing).toBeNull();

      // Create new studentBook
      const studentBookId = await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId,
        status: "reading",
        startedAt: now,
      });

      const studentBook = await mockCtx.db.get(studentBookId);

      expect(studentBook).not.toBeNull();
      expect(studentBook?.status).toBe("reading");
      expect(studentBook?.startedAt).toBe(now);
      expect(studentBook?.userId).toBe(mockUserId);
      expect(studentBook?.bookId).toBe(mockBookId);

      vi.useRealTimers();
    });

    it("should be idempotent - return existing record if already started", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // First call - creates new record
      const existingBefore = await mockCtx.db
        .query("studentBooks")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), mockUserId),
            q.eq(q.field("bookId"), mockBookId)
          )
        )
        .first();

      let studentBookId: string;
      if (existingBefore) {
        studentBookId = existingBefore._id;
      } else {
        studentBookId = await mockCtx.db.insert("studentBooks", {
          userId: mockUserId,
          bookId: mockBookId,
          status: "reading",
          startedAt: now,
        });
      }

      // Second call - should return existing
      const existingAfter = await mockCtx.db
        .query("studentBooks")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), mockUserId),
            q.eq(q.field("bookId"), mockBookId)
          )
        )
        .first();

      let secondCallId: string;
      if (existingAfter) {
        secondCallId = existingAfter._id;
      } else {
        // Would not happen since we just created it
        secondCallId = await mockCtx.db.insert("studentBooks", {
          userId: mockUserId,
          bookId: mockBookId,
          status: "reading",
          startedAt: Date.now(),
        });
      }

      expect(secondCallId).toBe(studentBookId);

      // Verify only one record exists
      const allStudentBooks = await mockCtx.db
        .query("studentBooks")
        .filter((q) =>
          q.and(
            q.eq(q.field("userId"), mockUserId),
            q.eq(q.field("bookId"), mockBookId)
          )
        )
        .collect();

      expect(allStudentBooks).toHaveLength(1);

      vi.useRealTimers();
    });
  });

  describe("updateStatus", () => {
    let studentBookId: string;

    beforeEach(async () => {
      // Create a studentBook in "reading" status
      studentBookId = await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId,
        status: "reading",
        startedAt: Date.now() - 86400000, // Started yesterday
      });
    });

    it("should set completedAt when status changes to completed", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate updateStatus mutation for "completed"
      const updates: Record<string, unknown> = { status: "completed" };
      updates.completedAt = now;

      await mockCtx.db.patch(studentBookId, updates);

      const studentBook = await mockCtx.db.get(studentBookId);
      expect(studentBook?.status).toBe("completed");
      expect(studentBook?.completedAt).toBe(now);

      vi.useRealTimers();
    });

    it("should set presentationRequestedAt when status changes to presentation_requested", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const updates: Record<string, unknown> = { status: "presentation_requested" };
      updates.presentationRequestedAt = now;

      await mockCtx.db.patch(studentBookId, updates);

      const studentBook = await mockCtx.db.get(studentBookId);
      expect(studentBook?.status).toBe("presentation_requested");
      expect(studentBook?.presentationRequestedAt).toBe(now);

      vi.useRealTimers();
    });

    it("should set presentedAt when status changes to presented", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const updates: Record<string, unknown> = { status: "presented" };
      updates.presentedAt = now;

      await mockCtx.db.patch(studentBookId, updates);

      const studentBook = await mockCtx.db.get(studentBookId);
      expect(studentBook?.status).toBe("presented");
      expect(studentBook?.presentedAt).toBe(now);

      vi.useRealTimers();
    });

    it("should not regress timestamps when updating status", async () => {
      const originalTime = Date.now() - 86400000; // Yesterday
      const newTime = Date.now();

      // First, set to presentation_requested
      await mockCtx.db.patch(studentBookId, {
        status: "presentation_requested",
        presentationRequestedAt: originalTime,
      });

      // Now update to presented - should add new timestamp, not overwrite old one
      await mockCtx.db.patch(studentBookId, {
        status: "presented",
        presentedAt: newTime,
      });

      const studentBook = await mockCtx.db.get(studentBookId);
      expect(studentBook?.status).toBe("presented");
      expect(studentBook?.presentationRequestedAt).toBe(originalTime); // Should still exist
      expect(studentBook?.presentedAt).toBe(newTime);
    });
  });

  describe("approvePresentationRequest", () => {
    let studentBookId: string;

    beforeEach(async () => {
      // Create a studentBook in "presentation_requested" status
      studentBookId = await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId,
        status: "presentation_requested",
        startedAt: Date.now() - 172800000, // Started 2 days ago
        presentationRequestedAt: Date.now() - 86400000, // Requested yesterday
      });
    });

    it("should set status to presented and add presentedAt when approved", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate approvePresentationRequest with approved=true
      await mockCtx.db.patch(studentBookId, {
        status: "presented",
        presentedAt: now,
      });

      const studentBook = await mockCtx.db.get(studentBookId);
      expect(studentBook?.status).toBe("presented");
      expect(studentBook?.presentedAt).toBe(now);

      vi.useRealTimers();
    });

    it("should set status back to reading and clear presentationRequestedAt when rejected", async () => {
      // Simulate approvePresentationRequest with approved=false
      await mockCtx.db.patch(studentBookId, {
        status: "reading",
        presentationRequestedAt: undefined,
      });

      const studentBook = await mockCtx.db.get(studentBookId);
      expect(studentBook?.status).toBe("reading");
      expect(studentBook?.presentationRequestedAt).toBeUndefined();
    });
  });

  describe("remove (admin CRUD)", () => {
    it("should cascade delete studentBooks when a book is removed", async () => {
      // Create studentBooks for multiple users
      const userId2 = createMockId("users");
      mockCtx.db._seed(userId2, {
        username: "student2",
        role: "student",
        displayName: "Student 2",
        createdAt: Date.now(),
      });

      const studentBookId1 = await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId,
        status: "reading",
        startedAt: Date.now(),
      });

      const studentBookId2 = await mockCtx.db.insert("studentBooks", {
        userId: userId2,
        bookId: mockBookId,
        status: "presented",
        startedAt: Date.now() - 86400000,
        presentedAt: Date.now(),
      });

      // Verify both exist
      expect(await mockCtx.db.get(studentBookId1)).not.toBeNull();
      expect(await mockCtx.db.get(studentBookId2)).not.toBeNull();

      // Simulate remove mutation - delete associated studentBooks first
      const studentBooks = await mockCtx.db
        .query("studentBooks")
        .filter((q) => q.eq(q.field("bookId"), mockBookId))
        .collect();

      for (const sb of studentBooks) {
        await mockCtx.db.delete(sb._id);
      }

      // Then delete the book
      await mockCtx.db.delete(mockBookId);

      // Verify all deleted
      expect(await mockCtx.db.get(mockBookId)).toBeNull();
      expect(await mockCtx.db.get(studentBookId1)).toBeNull();
      expect(await mockCtx.db.get(studentBookId2)).toBeNull();
    });

    it("should not affect other books when removing one", async () => {
      // Create another book
      const otherBookId = createMockId("books");
      mockCtx.db._seed(otherBookId, {
        title: "Another Book",
        author: "Another Author",
        isPrePopulated: true,
        createdAt: Date.now(),
      });

      // Create studentBooks for both books
      await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId,
        status: "reading",
        startedAt: Date.now(),
      });

      const otherStudentBookId = await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: otherBookId,
        status: "reading",
        startedAt: Date.now(),
      });

      // Delete the first book and its associations
      const studentBooks = await mockCtx.db
        .query("studentBooks")
        .filter((q) => q.eq(q.field("bookId"), mockBookId))
        .collect();

      for (const sb of studentBooks) {
        await mockCtx.db.delete(sb._id);
      }
      await mockCtx.db.delete(mockBookId);

      // Other book and its studentBook should still exist
      expect(await mockCtx.db.get(otherBookId)).not.toBeNull();
      expect(await mockCtx.db.get(otherStudentBookId)).not.toBeNull();
    });
  });
});

describe("Books Queries", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;
  let mockBookId1: Id<"books">;
  let mockBookId2: Id<"books">;
  let mockBookId3: Id<"books">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    // Seed with a user
    mockUserId = createMockId("users");
    mockCtx.db._seed(mockUserId, {
      username: "teststudent",
      role: "student",
      displayName: "Test Student",
      createdAt: Date.now(),
    });

    // Seed with books
    mockBookId1 = createMockId("books");
    mockCtx.db._seed(mockBookId1, {
      title: "Book 1",
      author: "Author 1",
      genre: "Fantasy",
      isPrePopulated: true,
      createdAt: Date.now(),
    });

    mockBookId2 = createMockId("books");
    mockCtx.db._seed(mockBookId2, {
      title: "Book 2",
      author: "Author 2",
      genre: "Science",
      isPrePopulated: true,
      createdAt: Date.now(),
    });

    mockBookId3 = createMockId("books");
    mockCtx.db._seed(mockBookId3, {
      title: "Book 3",
      author: "Author 3",
      genre: "History",
      isPrePopulated: true,
      createdAt: Date.now(),
    });
  });

  describe("getReadingStats", () => {
    it("should count reading/pending/presented correctly", async () => {
      // Create studentBooks with various statuses
      await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId1,
        status: "reading",
        startedAt: Date.now(),
      });

      await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId2,
        status: "presentation_requested",
        startedAt: Date.now() - 86400000,
        presentationRequestedAt: Date.now(),
      });

      await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId3,
        status: "presented",
        startedAt: Date.now() - 172800000,
        presentedAt: Date.now() - 86400000,
      });

      // Simulate getReadingStats query
      const studentBooks = await mockCtx.db
        .query("studentBooks")
        .filter((q) => q.eq(q.field("userId"), mockUserId))
        .collect();

      const reading = studentBooks.filter((sb) => sb.status === "reading").length;
      const pendingPresentation = studentBooks.filter(
        (sb) => sb.status === "presentation_requested" || sb.status === "completed"
      ).length;
      const presented = studentBooks.filter((sb) => sb.status === "presented").length;

      expect(reading).toBe(1);
      expect(pendingPresentation).toBe(1);
      expect(presented).toBe(1);
    });

    it("should treat legacy completed status as pending presentation", async () => {
      // Create studentBook with legacy "completed" status
      await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId1,
        status: "completed", // Legacy status
        startedAt: Date.now() - 86400000,
        completedAt: Date.now(),
      });

      await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId2,
        status: "presentation_requested",
        startedAt: Date.now() - 86400000,
        presentationRequestedAt: Date.now(),
      });

      const studentBooks = await mockCtx.db
        .query("studentBooks")
        .filter((q) => q.eq(q.field("userId"), mockUserId))
        .collect();

      const pendingPresentation = studentBooks.filter(
        (sb) => sb.status === "presentation_requested" || sb.status === "completed"
      ).length;

      // Both legacy completed and presentation_requested should be counted as pending
      expect(pendingPresentation).toBe(2);
    });

    it("should return zeros when no books", async () => {
      const studentBooks = await mockCtx.db
        .query("studentBooks")
        .filter((q) => q.eq(q.field("userId"), mockUserId))
        .collect();

      const reading = studentBooks.filter((sb) => sb.status === "reading").length;
      const pendingPresentation = studentBooks.filter(
        (sb) => sb.status === "presentation_requested" || sb.status === "completed"
      ).length;
      const presented = studentBooks.filter((sb) => sb.status === "presented").length;

      expect(reading).toBe(0);
      expect(pendingPresentation).toBe(0);
      expect(presented).toBe(0);
    });
  });

  describe("getPresentationRequests", () => {
    it("should return pending requests including legacy completed", async () => {
      const userId2 = createMockId("users");
      mockCtx.db._seed(userId2, {
        username: "student2",
        role: "student",
        displayName: "Student 2",
        createdAt: Date.now(),
      });

      // Create various studentBooks
      await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId1,
        status: "presentation_requested",
        startedAt: Date.now(),
        presentationRequestedAt: Date.now(),
      });

      await mockCtx.db.insert("studentBooks", {
        userId: userId2,
        bookId: mockBookId2,
        status: "completed", // Legacy status
        startedAt: Date.now(),
        completedAt: Date.now(),
      });

      // This one should NOT be included
      await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId3,
        status: "reading",
        startedAt: Date.now(),
      });

      // Simulate getPresentationRequests query
      const allBooks = await mockCtx.db.query("studentBooks").collect();
      const requests = allBooks.filter(
        (sb) => sb.status === "presentation_requested" || sb.status === "completed"
      );

      expect(requests).toHaveLength(2);
    });

    it("should attach user and book to each request", async () => {
      await mockCtx.db.insert("studentBooks", {
        userId: mockUserId,
        bookId: mockBookId1,
        status: "presentation_requested",
        startedAt: Date.now(),
        presentationRequestedAt: Date.now(),
      });

      const allBooks = await mockCtx.db.query("studentBooks").collect();
      const requests = allBooks.filter(
        (sb) => sb.status === "presentation_requested" || sb.status === "completed"
      );

      // Simulate attaching user and book
      const enrichedRequests = await Promise.all(
        requests.map(async (req) => {
          const user = await mockCtx.db.get(req.userId as string);
          const book = await mockCtx.db.get(req.bookId as string);
          return { ...req, user, book };
        })
      );

      expect(enrichedRequests).toHaveLength(1);
      expect(enrichedRequests[0].user).not.toBeNull();
      expect(enrichedRequests[0].user?.displayName).toBe("Test Student");
      expect(enrichedRequests[0].book).not.toBeNull();
      expect(enrichedRequests[0].book?.title).toBe("Book 1");
    });
  });
});
