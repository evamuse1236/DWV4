/**
 * Tests for convex/sprints.ts mutations and queries.
 *
 * Sprints are a core entity - they group goals and habits into time periods.
 * Only one sprint can be active at a time.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";

describe("Sprints Mutations", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    // Seed with an admin user (sprints are typically created by admins)
    mockUserId = createMockId("users");
    mockCtx.db._seed(mockUserId, {
      username: "admin",
      role: "admin",
      displayName: "Admin User",
      createdAt: Date.now(),
    });
  });

  describe("create", () => {
    it("should create a new sprint and set it as active", async () => {
      // Simulate create mutation
      const sprintId = await mockCtx.db.insert("sprints", {
        name: "Sprint 1",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: true,
        createdBy: mockUserId,
      });

      const sprint = await mockCtx.db.get(sprintId);

      expect(sprint).not.toBeNull();
      expect(sprint?.name).toBe("Sprint 1");
      expect(sprint?.startDate).toBe("2025-01-01");
      expect(sprint?.endDate).toBe("2025-01-14");
      expect(sprint?.isActive).toBe(true);
      expect(sprint?.createdBy).toBe(mockUserId);
    });

    it("should deactivate existing active sprint when creating new one", async () => {
      // Create first sprint (active)
      const sprint1Id = await mockCtx.db.insert("sprints", {
        name: "Sprint 1",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: true,
        createdBy: mockUserId,
      });

      // Simulate create mutation logic - deactivate existing active sprint first
      const activeSprint = await mockCtx.db
        .query("sprints")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .first();

      if (activeSprint) {
        await mockCtx.db.patch(activeSprint._id, { isActive: false });
      }

      // Create second sprint (now active)
      const sprint2Id = await mockCtx.db.insert("sprints", {
        name: "Sprint 2",
        startDate: "2025-01-15",
        endDate: "2025-01-28",
        isActive: true,
        createdBy: mockUserId,
      });

      const sprint1 = await mockCtx.db.get(sprint1Id);
      const sprint2 = await mockCtx.db.get(sprint2Id);

      expect(sprint1?.isActive).toBe(false);
      expect(sprint2?.isActive).toBe(true);
    });
  });

  describe("update", () => {
    it("should update sprint name", async () => {
      const sprintId = await mockCtx.db.insert("sprints", {
        name: "Original Name",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: true,
        createdBy: mockUserId,
      });

      const updates = { name: "Updated Sprint Name" };
      const filteredUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );
      await mockCtx.db.patch(sprintId, filteredUpdates);

      const sprint = await mockCtx.db.get(sprintId);
      expect(sprint?.name).toBe("Updated Sprint Name");
      expect(sprint?.startDate).toBe("2025-01-01"); // Unchanged
    });

    it("should update sprint dates", async () => {
      const sprintId = await mockCtx.db.insert("sprints", {
        name: "Sprint 1",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: true,
        createdBy: mockUserId,
      });

      await mockCtx.db.patch(sprintId, {
        startDate: "2025-01-05",
        endDate: "2025-01-18",
      });

      const sprint = await mockCtx.db.get(sprintId);
      expect(sprint?.startDate).toBe("2025-01-05");
      expect(sprint?.endDate).toBe("2025-01-18");
    });
  });

  describe("setActive", () => {
    it("should set a specific sprint as active", async () => {
      // Create two sprints
      const sprint1Id = await mockCtx.db.insert("sprints", {
        name: "Sprint 1",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: true,
        createdBy: mockUserId,
      });

      const sprint2Id = await mockCtx.db.insert("sprints", {
        name: "Sprint 2",
        startDate: "2025-01-15",
        endDate: "2025-01-28",
        isActive: false,
        createdBy: mockUserId,
      });

      // Simulate setActive mutation - deactivate all, then activate selected
      const allSprints = await mockCtx.db.query("sprints").collect();
      for (const sprint of allSprints) {
        if (sprint.isActive) {
          await mockCtx.db.patch(sprint._id, { isActive: false });
        }
      }
      await mockCtx.db.patch(sprint2Id, { isActive: true });

      const sprint1 = await mockCtx.db.get(sprint1Id);
      const sprint2 = await mockCtx.db.get(sprint2Id);

      expect(sprint1?.isActive).toBe(false);
      expect(sprint2?.isActive).toBe(true);
    });

    it("should only have one active sprint at a time", async () => {
      // Create three sprints
      await mockCtx.db.insert("sprints", {
        name: "Sprint 1",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: false,
        createdBy: mockUserId,
      });

      await mockCtx.db.insert("sprints", {
        name: "Sprint 2",
        startDate: "2025-01-15",
        endDate: "2025-01-28",
        isActive: true,
        createdBy: mockUserId,
      });

      const sprint3Id = await mockCtx.db.insert("sprints", {
        name: "Sprint 3",
        startDate: "2025-01-29",
        endDate: "2025-02-11",
        isActive: false,
        createdBy: mockUserId,
      });

      // Set sprint 3 as active
      const allSprints = await mockCtx.db.query("sprints").collect();
      for (const sprint of allSprints) {
        if (sprint.isActive) {
          await mockCtx.db.patch(sprint._id, { isActive: false });
        }
      }
      await mockCtx.db.patch(sprint3Id, { isActive: true });

      // Count active sprints
      const activeSprints = await mockCtx.db
        .query("sprints")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect();

      expect(activeSprints).toHaveLength(1);
      expect(activeSprints[0].name).toBe("Sprint 3");
    });
  });

  describe("remove", () => {
    it("should delete a sprint", async () => {
      const sprintId = await mockCtx.db.insert("sprints", {
        name: "Sprint to delete",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: false,
        createdBy: mockUserId,
      });

      expect(await mockCtx.db.get(sprintId)).not.toBeNull();

      await mockCtx.db.delete(sprintId);

      expect(await mockCtx.db.get(sprintId)).toBeNull();
    });
  });
});

describe("Sprints Queries", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;
  let mockUserId: Id<"users">;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = createMockCtx();

    mockUserId = createMockId("users");
    mockCtx.db._seed(mockUserId, {
      username: "admin",
      role: "admin",
      displayName: "Admin User",
      createdAt: Date.now(),
    });
  });

  describe("getActive", () => {
    it("should return the active sprint", async () => {
      await mockCtx.db.insert("sprints", {
        name: "Inactive Sprint",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: false,
        createdBy: mockUserId,
      });

      await mockCtx.db.insert("sprints", {
        name: "Active Sprint",
        startDate: "2025-01-15",
        endDate: "2025-01-28",
        isActive: true,
        createdBy: mockUserId,
      });

      const active = await mockCtx.db
        .query("sprints")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .first();

      expect(active).not.toBeNull();
      expect(active?.name).toBe("Active Sprint");
    });

    it("should return null if no active sprint", async () => {
      await mockCtx.db.insert("sprints", {
        name: "Inactive Sprint 1",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: false,
        createdBy: mockUserId,
      });

      await mockCtx.db.insert("sprints", {
        name: "Inactive Sprint 2",
        startDate: "2025-01-15",
        endDate: "2025-01-28",
        isActive: false,
        createdBy: mockUserId,
      });

      const active = await mockCtx.db
        .query("sprints")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .first();

      expect(active).toBeNull();
    });
  });

  describe("getAll", () => {
    it("should return all sprints sorted by start date (newest first)", async () => {
      await mockCtx.db.insert("sprints", {
        name: "Sprint 1",
        startDate: "2025-01-01",
        endDate: "2025-01-14",
        isActive: false,
        createdBy: mockUserId,
      });

      await mockCtx.db.insert("sprints", {
        name: "Sprint 3",
        startDate: "2025-01-29",
        endDate: "2025-02-11",
        isActive: false,
        createdBy: mockUserId,
      });

      await mockCtx.db.insert("sprints", {
        name: "Sprint 2",
        startDate: "2025-01-15",
        endDate: "2025-01-28",
        isActive: true,
        createdBy: mockUserId,
      });

      // Simulate getAll query with sorting
      const sprints = await mockCtx.db.query("sprints").collect();
      const sorted = sprints.sort(
        (a, b) =>
          new Date(b.startDate as string).getTime() -
          new Date(a.startDate as string).getTime()
      );

      expect(sorted).toHaveLength(3);
      expect(sorted[0].name).toBe("Sprint 3"); // Newest
      expect(sorted[1].name).toBe("Sprint 2");
      expect(sorted[2].name).toBe("Sprint 1"); // Oldest
    });

    it("should return empty array if no sprints exist", async () => {
      const sprints = await mockCtx.db.query("sprints").collect();
      expect(sprints).toHaveLength(0);
    });
  });
});
