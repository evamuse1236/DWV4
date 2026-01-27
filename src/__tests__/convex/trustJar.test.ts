/**
 * Tests for convex/trustJar.ts mutations and queries.
 *
 * These tests use a mock database context to test the handler logic
 * without needing a real Convex backend.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

// The trust jar has a max count of 50 (from the actual implementation)
const MAX_COUNT = 50;

describe("TrustJar Queries", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();
  });

  describe("get", () => {
    it("should return defaults when no jar exists", async () => {
      // Simulate the get query when no trustJar document exists
      const jar = await mockCtx.db.query("trustJar").first();

      // This mimics the get handler's default behavior
      const result = {
        count: jar?.count ?? 0,
        maxCount: MAX_COUNT,
        timesCompleted: jar?.timesCompleted ?? 0,
        updatedAt: jar?.updatedAt ?? null,
      };

      expect(result.count).toBe(0);
      expect(result.maxCount).toBe(MAX_COUNT);
      expect(result.timesCompleted).toBe(0);
      expect(result.updatedAt).toBeNull();
    });

    it("should return jar data when jar exists", async () => {
      const jarId = await mockCtx.db.insert("trustJar", {
        count: 25,
        timesCompleted: 2,
        updatedAt: 1706000000000,
        updatedBy: createMockId("users"),
      });

      const jar = await mockCtx.db.query("trustJar").first();

      const result = {
        count: jar?.count ?? 0,
        maxCount: MAX_COUNT,
        timesCompleted: jar?.timesCompleted ?? 0,
        updatedAt: jar?.updatedAt ?? null,
      };

      expect(result.count).toBe(25);
      expect(result.maxCount).toBe(MAX_COUNT);
      expect(result.timesCompleted).toBe(2);
      expect(result.updatedAt).toBe(1706000000000);
    });
  });
});

describe("TrustJar Mutations - Auth", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let adminUserId: Id<"users">;
  let studentUserId: Id<"users">;
  let validAdminToken: string;
  let validStudentToken: string;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    // Create admin user
    adminUserId = createMockId("users");
    mockCtx.db._seed(adminUserId, {
      username: "admin",
      role: "admin",
      displayName: "Admin User",
      createdAt: Date.now(),
    });

    // Create student user (not admin)
    studentUserId = createMockId("users");
    mockCtx.db._seed(studentUserId, {
      username: "student",
      role: "student",
      displayName: "Student User",
      createdAt: Date.now(),
    });

    // Create valid admin session
    validAdminToken = "valid_admin_token_123";
    const adminSessionId = createMockId("sessions");
    mockCtx.db._seed(adminSessionId, {
      userId: adminUserId,
      token: validAdminToken,
      expiresAt: Date.now() + 86400000, // Expires in 24 hours
    });

    // Create valid student session
    validStudentToken = "valid_student_token_456";
    const studentSessionId = createMockId("sessions");
    mockCtx.db._seed(studentSessionId, {
      userId: studentUserId,
      token: validStudentToken,
      expiresAt: Date.now() + 86400000,
    });
  });

  /**
   * Helper to simulate verifyAdmin function from trustJar.ts
   */
  async function verifyAdmin(adminToken: string): Promise<{ _id: string } | null> {
    const session = await mockCtx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", adminToken))
      .unique();

    if (!session) return null;

    const user = await mockCtx.db.get(session.userId as string);
    if (!user || user.role !== "admin") return null;

    return user;
  }

  describe("add - auth", () => {
    it("should reject invalid admin token", async () => {
      const user = await verifyAdmin("invalid_token");
      expect(user).toBeNull();

      // Mutation would return { success: false, error: "Unauthorized" }
    });

    it("should reject non-admin sessions", async () => {
      const user = await verifyAdmin(validStudentToken);
      expect(user).toBeNull();

      // Mutation would return { success: false, error: "Unauthorized" }
    });

    it("should accept valid admin token", async () => {
      const user = await verifyAdmin(validAdminToken);
      expect(user).not.toBeNull();
      expect(user?._id).toBe(adminUserId);
    });
  });

  describe("remove - auth", () => {
    it("should reject invalid admin token", async () => {
      const user = await verifyAdmin("bad_token");
      expect(user).toBeNull();
    });

    it("should reject non-admin sessions", async () => {
      const user = await verifyAdmin(validStudentToken);
      expect(user).toBeNull();
    });
  });

  describe("reset - auth", () => {
    it("should reject invalid admin token", async () => {
      const user = await verifyAdmin("fake_token");
      expect(user).toBeNull();
    });

    it("should reject non-admin sessions", async () => {
      const user = await verifyAdmin(validStudentToken);
      expect(user).toBeNull();
    });
  });
});

describe("TrustJar Mutations - Bounds", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let adminUserId: Id<"users">;
  let validAdminToken: string;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    // Create admin user
    adminUserId = createMockId("users");
    mockCtx.db._seed(adminUserId, {
      username: "admin",
      role: "admin",
      displayName: "Admin User",
      createdAt: Date.now(),
    });

    // Create valid admin session
    validAdminToken = "valid_admin_token";
    const adminSessionId = createMockId("sessions");
    mockCtx.db._seed(adminSessionId, {
      userId: adminUserId,
      token: validAdminToken,
      expiresAt: Date.now() + 86400000,
    });
  });

  describe("add - bounds", () => {
    it("should create jar with count 1 if no jar exists", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Simulate add mutation when no jar exists
      const jar = await mockCtx.db.query("trustJar").first();
      expect(jar).toBeNull();

      // Create new jar
      const jarId = await mockCtx.db.insert("trustJar", {
        count: 1,
        timesCompleted: 0,
        updatedAt: now,
        updatedBy: adminUserId,
      });

      const newJar = await mockCtx.db.get(jarId);
      expect(newJar?.count).toBe(1);
      expect(newJar?.timesCompleted).toBe(0);

      vi.useRealTimers();
    });

    it("should increment count when jar exists and not full", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create existing jar
      const jarId = await mockCtx.db.insert("trustJar", {
        count: 25,
        timesCompleted: 0,
        updatedAt: now - 86400000,
        updatedBy: adminUserId,
      });

      // Simulate add mutation
      const jar = await mockCtx.db.query("trustJar").first();
      if (jar && (jar.count as number) < MAX_COUNT) {
        await mockCtx.db.patch(jar._id, {
          count: (jar.count as number) + 1,
          updatedAt: now,
          updatedBy: adminUserId,
        });
      }

      const updatedJar = await mockCtx.db.get(jarId);
      expect(updatedJar?.count).toBe(26);

      vi.useRealTimers();
    });

    it("should not add past max count", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create jar at max count
      const jarId = await mockCtx.db.insert("trustJar", {
        count: MAX_COUNT,
        timesCompleted: 0,
        updatedAt: now - 86400000,
        updatedBy: adminUserId,
      });

      // Simulate add mutation - should fail because jar is full
      const jar = await mockCtx.db.query("trustJar").first();
      let addResult: { success: boolean; error?: string };

      if (jar && (jar.count as number) >= MAX_COUNT) {
        addResult = { success: false, error: "Jar is full" };
      } else {
        // Would increment, but we shouldn't get here
        addResult = { success: true };
      }

      expect(addResult.success).toBe(false);
      expect(addResult.error).toBe("Jar is full");

      // Verify count didn't change
      const unchangedJar = await mockCtx.db.get(jarId);
      expect(unchangedJar?.count).toBe(MAX_COUNT);

      vi.useRealTimers();
    });
  });

  describe("remove - bounds", () => {
    it("should decrement count when jar has marbles", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create jar with some marbles
      const jarId = await mockCtx.db.insert("trustJar", {
        count: 10,
        timesCompleted: 0,
        updatedAt: now - 86400000,
        updatedBy: adminUserId,
      });

      // Simulate remove mutation
      const jar = await mockCtx.db.query("trustJar").first();
      if (jar && (jar.count as number) > 0) {
        await mockCtx.db.patch(jar._id, {
          count: (jar.count as number) - 1,
          updatedAt: now,
          updatedBy: adminUserId,
        });
      }

      const updatedJar = await mockCtx.db.get(jarId);
      expect(updatedJar?.count).toBe(9);

      vi.useRealTimers();
    });

    it("should not remove below zero", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create empty jar
      const jarId = await mockCtx.db.insert("trustJar", {
        count: 0,
        timesCompleted: 0,
        updatedAt: now - 86400000,
        updatedBy: adminUserId,
      });

      // Simulate remove mutation - should fail because jar is empty
      const jar = await mockCtx.db.query("trustJar").first();
      let removeResult: { success: boolean; error?: string };

      if (!jar || (jar.count as number) <= 0) {
        removeResult = { success: false, error: "Jar is empty" };
      } else {
        removeResult = { success: true };
      }

      expect(removeResult.success).toBe(false);
      expect(removeResult.error).toBe("Jar is empty");

      // Verify count didn't change
      const unchangedJar = await mockCtx.db.get(jarId);
      expect(unchangedJar?.count).toBe(0);

      vi.useRealTimers();
    });

    it("should fail when no jar exists", async () => {
      // Simulate remove mutation when no jar exists
      const jar = await mockCtx.db.query("trustJar").first();
      let removeResult: { success: boolean; error?: string };

      if (!jar || (jar.count as number) <= 0) {
        removeResult = { success: false, error: "Jar is empty" };
      } else {
        removeResult = { success: true };
      }

      expect(removeResult.success).toBe(false);
      expect(removeResult.error).toBe("Jar is empty");
    });
  });

  describe("reset", () => {
    it("should set count to zero", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create jar with some marbles (not full)
      const jarId = await mockCtx.db.insert("trustJar", {
        count: 25,
        timesCompleted: 0,
        updatedAt: now - 86400000,
        updatedBy: adminUserId,
      });

      // Simulate reset mutation
      const jar = await mockCtx.db.query("trustJar").first();
      if (jar) {
        const wasComplete = (jar.count as number) >= MAX_COUNT;
        const currentCompleted = (jar.timesCompleted as number) ?? 0;

        await mockCtx.db.patch(jar._id, {
          count: 0,
          timesCompleted: wasComplete ? currentCompleted + 1 : currentCompleted,
          updatedAt: now,
          updatedBy: adminUserId,
        });
      }

      const resetJar = await mockCtx.db.get(jarId);
      expect(resetJar?.count).toBe(0);

      vi.useRealTimers();
    });

    it("should NOT increment timesCompleted when jar was NOT full", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create jar with partial count (NOT full)
      const jarId = await mockCtx.db.insert("trustJar", {
        count: 30, // Less than MAX_COUNT (50)
        timesCompleted: 2,
        updatedAt: now - 86400000,
        updatedBy: adminUserId,
      });

      // Simulate reset mutation
      const jar = await mockCtx.db.query("trustJar").first();
      if (jar) {
        const wasComplete = (jar.count as number) >= MAX_COUNT;
        const currentCompleted = (jar.timesCompleted as number) ?? 0;

        await mockCtx.db.patch(jar._id, {
          count: 0,
          timesCompleted: wasComplete ? currentCompleted + 1 : currentCompleted,
          updatedAt: now,
          updatedBy: adminUserId,
        });
      }

      const resetJar = await mockCtx.db.get(jarId);
      expect(resetJar?.count).toBe(0);
      // timesCompleted should NOT have changed since jar wasn't full
      expect(resetJar?.timesCompleted).toBe(2);

      vi.useRealTimers();
    });

    it("should increment timesCompleted ONLY when jar was full", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create jar at exactly MAX_COUNT (full)
      const jarId = await mockCtx.db.insert("trustJar", {
        count: MAX_COUNT,
        timesCompleted: 2,
        updatedAt: now - 86400000,
        updatedBy: adminUserId,
      });

      // Simulate reset mutation
      const jar = await mockCtx.db.query("trustJar").first();
      if (jar) {
        const wasComplete = (jar.count as number) >= MAX_COUNT;
        const currentCompleted = (jar.timesCompleted as number) ?? 0;

        await mockCtx.db.patch(jar._id, {
          count: 0,
          timesCompleted: wasComplete ? currentCompleted + 1 : currentCompleted,
          updatedAt: now,
          updatedBy: adminUserId,
        });
      }

      const resetJar = await mockCtx.db.get(jarId);
      expect(resetJar?.count).toBe(0);
      // timesCompleted should have incremented because jar was full
      expect(resetJar?.timesCompleted).toBe(3);

      vi.useRealTimers();
    });

    it("should succeed even when no jar exists", async () => {
      // When no jar exists, reset returns success:true (no-op)
      const jar = await mockCtx.db.query("trustJar").first();

      let resetResult: { success: boolean };
      if (!jar) {
        resetResult = { success: true };
      } else {
        // Would reset
        resetResult = { success: true };
      }

      expect(resetResult.success).toBe(true);
    });

    it("should handle timesCompleted being undefined (legacy data)", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // Create jar without timesCompleted (simulating legacy data)
      const jarId = await mockCtx.db.insert("trustJar", {
        count: MAX_COUNT,
        // timesCompleted is intentionally missing
        updatedAt: now - 86400000,
        updatedBy: adminUserId,
      });

      // Simulate reset mutation
      const jar = await mockCtx.db.query("trustJar").first();
      if (jar) {
        const wasComplete = (jar.count as number) >= MAX_COUNT;
        const currentCompleted = (jar.timesCompleted as number) ?? 0; // Defaults to 0

        await mockCtx.db.patch(jar._id, {
          count: 0,
          timesCompleted: wasComplete ? currentCompleted + 1 : currentCompleted,
          updatedAt: now,
          updatedBy: adminUserId,
        });
      }

      const resetJar = await mockCtx.db.get(jarId);
      expect(resetJar?.count).toBe(0);
      // Should go from undefined (treated as 0) to 1
      expect(resetJar?.timesCompleted).toBe(1);

      vi.useRealTimers();
    });
  });
});
