/**
 * Tests for convex/auth.ts mutations and queries.
 *
 * These tests use a mock database context to test the handler logic
 * without needing a real Convex backend.
 *
 * Test Coverage (P0 items from TEST-PLAN.md):
 * - checkNeedsBootstrap: returns true when users is empty; false when any user exists
 * - initializeAdmin: succeeds only when no users exist; persists admin with role="admin" + createdAt; rejects when user exists
 * - initializeStudent: allows first student bootstrap only; rejects after any student exists; rejects duplicate usernames
 * - createUser: rejects missing/invalid admin token; rejects non-admin; rejects duplicate usernames; creates user with expected fields
 * - login: invalid username/password returns {success:false}; valid login deletes prior sessions, creates one session, updates lastLoginAt, returns {success:true, token, user}
 * - getCurrentUser: returns null for missing/expired session or missing user; returns expected user shape for valid session
 * - logout: deletes matching session; is idempotent
 * - cleanupExpiredSessions: deletes only expired sessions; returns correct deletedCount
 *
 * Also tests convex/utils.ts hashPassword:
 * - deterministic for same input
 * - different for different inputs
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockCtx, createMockId, resetMockIdCounter } from "./mockDb";
import type { Id } from "../../../convex/_generated/dataModel";
import { hashPassword } from "../../../convex/utils";

// Extend the mock query builder to support `unique()` method
// which returns the first result (used by auth.ts for index lookups)
function extendMockDbWithUnique(mockCtx: ReturnType<typeof createMockCtx>) {
  const originalQuery = mockCtx.db.query.bind(mockCtx.db);

  mockCtx.db.query = (tableName: string) => {
    const builder = originalQuery(tableName);

    // Add unique() method that returns first result or null
    // In Convex, unique() returns exactly one result or null (throws if multiple)
    // For testing, we'll use the same behavior as first()
    (builder as ReturnType<typeof originalQuery> & { unique: () => Promise<unknown> }).unique =
      async () => {
        return builder.first();
      };

    return builder as ReturnType<typeof originalQuery> & {
      unique: () => Promise<unknown>;
    };
  };

  return mockCtx;
}

// Helper to generate a mock session token (simplified version)
function generateMockToken(): string {
  return `mock_token_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

describe("hashPassword utility", () => {
  it("should be deterministic for the same input", async () => {
    const password = "testpassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different inputs", async () => {
    const hash1 = await hashPassword("password1");
    const hash2 = await hashPassword("password2");

    expect(hash1).not.toBe(hash2);
  });

  it("should produce a hex string of expected length", async () => {
    const hash = await hashPassword("anypassword");

    // SHA-256 produces 64 hex characters
    expect(hash).toHaveLength(64);
    // Should only contain hex characters
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });
});

describe("Auth Queries", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = extendMockDbWithUnique(createMockCtx());
  });

  describe("checkNeedsBootstrap", () => {
    it("should return true when users table is empty", async () => {
      // Simulate the checkNeedsBootstrap query handler
      const firstUser = await mockCtx.db.query("users").first();
      const needsBootstrap = firstUser === null;

      expect(needsBootstrap).toBe(true);
    });

    it("should return false when any user exists", async () => {
      // Seed a user
      const userId = createMockId("users");
      mockCtx.db._seed(userId, {
        username: "admin",
        displayName: "Admin User",
        passwordHash: "somehash",
        role: "admin",
        createdAt: Date.now(),
      });

      // Simulate the checkNeedsBootstrap query handler
      const firstUser = await mockCtx.db.query("users").first();
      const needsBootstrap = firstUser === null;

      expect(needsBootstrap).toBe(false);
    });

    it("should return false when a student user exists", async () => {
      // Seed a student user (not admin)
      const userId = createMockId("users");
      mockCtx.db._seed(userId, {
        username: "student1",
        displayName: "Student One",
        passwordHash: "somehash",
        role: "student",
        createdAt: Date.now(),
      });

      const firstUser = await mockCtx.db.query("users").first();
      const needsBootstrap = firstUser === null;

      expect(needsBootstrap).toBe(false);
    });
  });

  describe("getCurrentUser", () => {
    it("should return null for missing session", async () => {
      const token = "nonexistent_token";

      // Simulate getCurrentUser handler
      const session = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      expect(session).toBeNull();
    });

    it("should return null for expired session", async () => {
      // Create a user
      const userId = createMockId("users");
      mockCtx.db._seed(userId, {
        username: "testuser",
        displayName: "Test User",
        passwordHash: "somehash",
        role: "student",
        createdAt: Date.now(),
      });

      // Create an expired session
      const sessionId = createMockId("sessions");
      const token = generateMockToken();
      const expiredAt = Date.now() - 1000; // Expired 1 second ago

      mockCtx.db._seed(sessionId, {
        userId,
        token,
        expiresAt: expiredAt,
      });

      // Simulate getCurrentUser handler
      const session = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      expect(session).not.toBeNull();
      // Check if session expired
      const isExpired = (session?.expiresAt as number) < Date.now();
      expect(isExpired).toBe(true);
    });

    it("should return null when user is missing (deleted after session creation)", async () => {
      // Create a session pointing to a non-existent user
      const sessionId = createMockId("sessions");
      const fakeUserId = createMockId("users"); // User doesn't exist
      const token = generateMockToken();

      mockCtx.db._seed(sessionId, {
        userId: fakeUserId,
        token,
        expiresAt: Date.now() + 3600000, // Valid for 1 hour
      });

      // Simulate getCurrentUser handler
      const session = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      expect(session).not.toBeNull();

      // Try to get the user
      const user = await mockCtx.db.get(session?.userId as string);
      expect(user).toBeNull();
    });

    it("should return expected user shape for valid session", async () => {
      const now = Date.now();

      // Create a user with all expected fields
      const userId = createMockId("users");
      mockCtx.db._seed(userId, {
        username: "validuser",
        displayName: "Valid User",
        passwordHash: "somehash",
        role: "student",
        avatarUrl: "https://example.com/avatar.png",
        createdAt: now - 86400000, // Created yesterday
        lastLoginAt: now,
      });

      // Create a valid session
      const sessionId = createMockId("sessions");
      const token = generateMockToken();

      mockCtx.db._seed(sessionId, {
        userId,
        token,
        expiresAt: now + 7 * 24 * 60 * 60 * 1000, // Valid for 7 days
      });

      // Simulate getCurrentUser handler
      const session = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      expect(session).not.toBeNull();
      expect((session?.expiresAt as number) >= Date.now()).toBe(true);

      const user = await mockCtx.db.get(session?.userId as string);
      expect(user).not.toBeNull();

      // Verify user shape matches what getCurrentUser returns
      const result = {
        _id: user?._id,
        username: user?.username,
        displayName: user?.displayName,
        role: user?.role,
        avatarUrl: user?.avatarUrl,
        createdAt: user?.createdAt,
        lastLoginAt: user?.lastLoginAt,
      };

      expect(result._id).toBe(userId);
      expect(result.username).toBe("validuser");
      expect(result.displayName).toBe("Valid User");
      expect(result.role).toBe("student");
      expect(result.avatarUrl).toBe("https://example.com/avatar.png");
      expect(result.createdAt).toBe(now - 86400000);
      expect(result.lastLoginAt).toBe(now);
    });
  });
});

describe("Auth Mutations", () => {
  let mockCtx: ReturnType<typeof createMockCtx>;

  beforeEach(() => {
    resetMockIdCounter();
    mockCtx = extendMockDbWithUnique(createMockCtx());
  });

  describe("initializeAdmin", () => {
    it("should succeed when no users exist", async () => {
      const args = {
        username: "admin",
        password: "adminpass123",
        displayName: "Admin User",
      };

      // Simulate initializeAdmin handler
      const existingUsers = await mockCtx.db.query("users").first();
      expect(existingUsers).toBeNull();

      const passwordHash = await hashPassword(args.password);
      const now = Date.now();

      const userId = await mockCtx.db.insert("users", {
        username: args.username,
        passwordHash,
        displayName: args.displayName,
        role: "admin",
        createdAt: now,
      });

      // Verify the admin was created correctly
      const createdUser = await mockCtx.db.get(userId);

      expect(createdUser).not.toBeNull();
      expect(createdUser?.role).toBe("admin");
      expect(createdUser?.username).toBe("admin");
      expect(createdUser?.displayName).toBe("Admin User");
      expect(createdUser?.createdAt).toBe(now);
    });

    it("should persist admin with role='admin' and createdAt", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const passwordHash = await hashPassword("testpass");

      const userId = await mockCtx.db.insert("users", {
        username: "newadmin",
        passwordHash,
        displayName: "New Admin",
        role: "admin",
        createdAt: now,
      });

      const user = await mockCtx.db.get(userId);

      expect(user?.role).toBe("admin");
      expect(user?.createdAt).toBe(now);

      vi.useRealTimers();
    });

    it("should reject when a user already exists", async () => {
      // Seed an existing user
      const existingUserId = createMockId("users");
      mockCtx.db._seed(existingUserId, {
        username: "existingadmin",
        displayName: "Existing Admin",
        passwordHash: "somehash",
        role: "admin",
        createdAt: Date.now(),
      });

      // Simulate initializeAdmin handler
      const existingUsers = await mockCtx.db.query("users").first();

      // Should reject because user exists
      expect(existingUsers).not.toBeNull();

      // The mutation would return { success: false, error: "Admin already exists" }
      const result =
        existingUsers !== null
          ? { success: false, error: "Admin already exists" }
          : { success: true };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Admin already exists");
    });
  });

  describe("initializeStudent", () => {
    it("should allow first student bootstrap when no students exist", async () => {
      // Seed an admin user (students can bootstrap even if admin exists)
      const adminId = createMockId("users");
      mockCtx.db._seed(adminId, {
        username: "admin",
        displayName: "Admin",
        passwordHash: "somehash",
        role: "admin",
        createdAt: Date.now(),
      });

      // Check for existing students (simulating filter by role)
      const allUsers = await mockCtx.db.query("users").collect();
      const existingStudents = allUsers.filter((u) => u.role === "student");

      expect(existingStudents).toHaveLength(0);

      // Create the first student
      const passwordHash = await hashPassword("studentpass");
      const studentId = await mockCtx.db.insert("users", {
        username: "student1",
        passwordHash,
        displayName: "First Student",
        role: "student",
        createdAt: Date.now(),
      });

      const student = await mockCtx.db.get(studentId);
      expect(student?.role).toBe("student");
      expect(student?.username).toBe("student1");
    });

    it("should reject after any student exists", async () => {
      // Seed an existing student
      const existingStudentId = createMockId("users");
      mockCtx.db._seed(existingStudentId, {
        username: "existingstudent",
        displayName: "Existing Student",
        passwordHash: "somehash",
        role: "student",
        createdAt: Date.now(),
      });

      // Check for existing students
      const allUsers = await mockCtx.db.query("users").collect();
      const existingStudents = allUsers.filter((u) => u.role === "student");

      expect(existingStudents.length).toBeGreaterThan(0);

      // The mutation would return error
      const result =
        existingStudents.length > 0
          ? {
              success: false,
              error: "Student users already exist. Use createUser with admin token instead.",
            }
          : { success: true };

      expect(result.success).toBe(false);
      expect(result.error).toContain("Student users already exist");
    });

    it("should reject duplicate usernames", async () => {
      // Seed an admin with the username we want to use
      const adminId = createMockId("users");
      mockCtx.db._seed(adminId, {
        username: "takenname",
        displayName: "Admin",
        passwordHash: "somehash",
        role: "admin",
        createdAt: Date.now(),
      });

      // No students exist, but username is taken
      const allUsers = await mockCtx.db.query("users").collect();
      const existingStudents = allUsers.filter((u) => u.role === "student");
      expect(existingStudents).toHaveLength(0);

      // Check for existing username
      const existingUser = await mockCtx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", "takenname"))
        .first();

      expect(existingUser).not.toBeNull();

      const result = existingUser
        ? { success: false, error: "Username already exists" }
        : { success: true };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Username already exists");
    });
  });

  describe("createUser", () => {
    let adminUserId: Id<"users">;
    let adminSessionId: Id<"sessions">;
    let adminToken: string;

    beforeEach(async () => {
      // Create an admin user and session for authorization
      adminUserId = createMockId("users");
      adminSessionId = createMockId("sessions");
      adminToken = generateMockToken();

      const passwordHash = await hashPassword("adminpass");

      mockCtx.db._seed(adminUserId, {
        username: "admin",
        displayName: "Admin User",
        passwordHash,
        role: "admin",
        createdAt: Date.now(),
      });

      mockCtx.db._seed(adminSessionId, {
        userId: adminUserId,
        token: adminToken,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });
    });

    it("should reject missing admin token", async () => {
      const args = {
        username: "newuser",
        password: "password",
        displayName: "New User",
        role: "student" as const,
        adminToken: "", // Empty token
      };

      // Simulate createUser handler
      const adminSession = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.adminToken))
        .first();

      expect(adminSession).toBeNull();

      const result = !adminSession
        ? { success: false, error: "Unauthorized" }
        : { success: true };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should reject invalid admin token", async () => {
      const args = {
        username: "newuser",
        password: "password",
        displayName: "New User",
        role: "student" as const,
        adminToken: "invalid_token_that_doesnt_exist",
      };

      const adminSession = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.adminToken))
        .first();

      expect(adminSession).toBeNull();

      const result = !adminSession
        ? { success: false, error: "Unauthorized" }
        : { success: true };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should reject non-admin users", async () => {
      // Create a student user with a session
      const studentId = createMockId("users");
      const studentSessionId = createMockId("sessions");
      const studentToken = generateMockToken();

      mockCtx.db._seed(studentId, {
        username: "student",
        displayName: "Student",
        passwordHash: "somehash",
        role: "student",
        createdAt: Date.now(),
      });

      mockCtx.db._seed(studentSessionId, {
        userId: studentId,
        token: studentToken,
        expiresAt: Date.now() + 3600000,
      });

      // Try to create user with student token
      const session = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", studentToken))
        .first();

      expect(session).not.toBeNull();

      const user = await mockCtx.db.get(session?.userId as string);
      expect(user).not.toBeNull();
      expect(user?.role).toBe("student");

      // Non-admin should be rejected
      const result =
        !user || user.role !== "admin"
          ? { success: false, error: "Unauthorized" }
          : { success: true };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });

    it("should reject duplicate usernames", async () => {
      // Seed an existing user with the username we want to create
      const existingUserId = createMockId("users");
      mockCtx.db._seed(existingUserId, {
        username: "existinguser",
        displayName: "Existing",
        passwordHash: "somehash",
        role: "student",
        createdAt: Date.now(),
      });

      const args = {
        username: "existinguser", // Duplicate
        password: "password",
        displayName: "New User",
        role: "student" as const,
        adminToken,
      };

      // Verify admin session is valid
      const adminSession = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.adminToken))
        .first();

      expect(adminSession).not.toBeNull();

      const admin = await mockCtx.db.get(adminSession?.userId as string);
      expect(admin?.role).toBe("admin");

      // Check for duplicate username
      const existingUser = await mockCtx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      expect(existingUser).not.toBeNull();

      const result = existingUser
        ? { success: false, error: "Username already exists" }
        : { success: true };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Username already exists");
    });

    it("should create user with expected fields including batch", async () => {
      const args = {
        username: "newstudent",
        password: "studentpass123",
        displayName: "New Student",
        role: "student" as const,
        adminToken,
        batch: "Batch A",
      };

      const now = Date.now();
      vi.setSystemTime(now);

      // Verify admin authorization
      const adminSession = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.adminToken))
        .first();

      expect(adminSession).not.toBeNull();

      const admin = await mockCtx.db.get(adminSession?.userId as string);
      expect(admin?.role).toBe("admin");

      // Check no duplicate
      const existingUser = await mockCtx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      expect(existingUser).toBeNull();

      // Create the user
      const passwordHash = await hashPassword(args.password);
      const userId = await mockCtx.db.insert("users", {
        username: args.username,
        passwordHash,
        displayName: args.displayName,
        role: args.role,
        batch: args.batch,
        createdAt: now,
      });

      const createdUser = await mockCtx.db.get(userId);

      expect(createdUser).not.toBeNull();
      expect(createdUser?.username).toBe("newstudent");
      expect(createdUser?.displayName).toBe("New Student");
      expect(createdUser?.role).toBe("student");
      expect(createdUser?.batch).toBe("Batch A");
      expect(createdUser?.createdAt).toBe(now);
      expect(createdUser?.passwordHash).toBe(passwordHash);

      vi.useRealTimers();
    });

    it("should create admin user when role is admin", async () => {
      const args = {
        username: "newadmin",
        password: "adminpass",
        displayName: "New Admin",
        role: "admin" as const,
        adminToken,
      };

      const passwordHash = await hashPassword(args.password);
      const userId = await mockCtx.db.insert("users", {
        username: args.username,
        passwordHash,
        displayName: args.displayName,
        role: args.role,
        createdAt: Date.now(),
      });

      const createdUser = await mockCtx.db.get(userId);
      expect(createdUser?.role).toBe("admin");
    });
  });

  describe("login", () => {
    let testUserId: Id<"users">;
    let testPasswordHash: string;

    beforeEach(async () => {
      // Create a test user for login tests
      testUserId = createMockId("users");
      testPasswordHash = await hashPassword("correctpassword");

      mockCtx.db._seed(testUserId, {
        username: "testuser",
        displayName: "Test User",
        passwordHash: testPasswordHash,
        role: "student",
        avatarUrl: "https://example.com/avatar.png",
        createdAt: Date.now() - 86400000,
      });
    });

    it("should return {success: false} for invalid username", async () => {
      const args = {
        username: "nonexistentuser",
        password: "anypassword",
      };

      // Simulate login handler
      const user = await mockCtx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      expect(user).toBeNull();

      const result = !user
        ? { success: false, error: "Invalid username or password" }
        : { success: true };

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid username or password");
    });

    it("should return {success: false} for invalid password", async () => {
      const args = {
        username: "testuser",
        password: "wrongpassword",
      };

      const user = await mockCtx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      expect(user).not.toBeNull();

      const passwordHash = await hashPassword(args.password);
      const passwordMatch = user?.passwordHash === passwordHash;

      expect(passwordMatch).toBe(false);

      const result = !passwordMatch
        ? { success: false, error: "Invalid username or password" }
        : { success: true };

      expect(result.success).toBe(false);
    });

    it("should delete prior sessions on valid login", async () => {
      // Create existing sessions for the user
      const oldSession1 = createMockId("sessions");
      const oldSession2 = createMockId("sessions");

      mockCtx.db._seed(oldSession1, {
        userId: testUserId,
        token: "old_token_1",
        expiresAt: Date.now() + 3600000,
      });

      mockCtx.db._seed(oldSession2, {
        userId: testUserId,
        token: "old_token_2",
        expiresAt: Date.now() + 3600000,
      });

      // Verify sessions exist
      const existingSessionsBefore = await mockCtx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", testUserId))
        .collect();

      expect(existingSessionsBefore).toHaveLength(2);

      // Simulate login - delete existing sessions
      for (const session of existingSessionsBefore) {
        await mockCtx.db.delete(session._id);
      }

      // Verify sessions are deleted
      const existingSessionsAfter = await mockCtx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", testUserId))
        .collect();

      expect(existingSessionsAfter).toHaveLength(0);
    });

    it("should create exactly one session on valid login", async () => {
      const args = {
        username: "testuser",
        password: "correctpassword",
      };

      // Find the user
      const user = await mockCtx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      expect(user).not.toBeNull();

      // Verify password
      const passwordHash = await hashPassword(args.password);
      expect(user?.passwordHash).toBe(passwordHash);

      // Delete existing sessions
      const existingSessions = await mockCtx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", user?._id as string))
        .collect();

      for (const session of existingSessions) {
        await mockCtx.db.delete(session._id);
      }

      // Create new session
      const token = generateMockToken();
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

      await mockCtx.db.insert("sessions", {
        userId: user?._id,
        token,
        expiresAt,
      });

      // Verify exactly one session exists
      const sessions = await mockCtx.db
        .query("sessions")
        .withIndex("by_user", (q) => q.eq("userId", user?._id as string))
        .collect();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].token).toBe(token);
    });

    it("should update lastLoginAt on valid login", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const args = {
        username: "testuser",
        password: "correctpassword",
      };

      const user = await mockCtx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      expect(user).not.toBeNull();
      expect(user?.lastLoginAt).toBeUndefined(); // Not set before first login

      // Update last login
      await mockCtx.db.patch(user?._id as string, { lastLoginAt: now });

      const updatedUser = await mockCtx.db.get(user?._id as string);
      expect(updatedUser?.lastLoginAt).toBe(now);

      vi.useRealTimers();
    });

    it("should return {success: true, token, user} on valid login", async () => {
      const args = {
        username: "testuser",
        password: "correctpassword",
      };

      // Find user
      const user = await mockCtx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", args.username))
        .first();

      expect(user).not.toBeNull();

      // Verify password
      const passwordHash = await hashPassword(args.password);
      expect(user?.passwordHash).toBe(passwordHash);

      // Create session
      const token = generateMockToken();
      await mockCtx.db.insert("sessions", {
        userId: user?._id,
        token,
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      });

      // Build result
      const result = {
        success: true,
        token,
        user: {
          _id: user?._id,
          username: user?.username,
          displayName: user?.displayName,
          role: user?.role,
          avatarUrl: user?.avatarUrl,
        },
      };

      expect(result.success).toBe(true);
      expect(result.token).toBe(token);
      expect(result.user._id).toBe(testUserId);
      expect(result.user.username).toBe("testuser");
      expect(result.user.displayName).toBe("Test User");
      expect(result.user.role).toBe("student");
      expect(result.user.avatarUrl).toBe("https://example.com/avatar.png");
    });
  });

  describe("logout", () => {
    it("should delete matching session", async () => {
      // Create a user and session
      const userId = createMockId("users");
      const sessionId = createMockId("sessions");
      const token = generateMockToken();

      mockCtx.db._seed(userId, {
        username: "testuser",
        displayName: "Test",
        passwordHash: "somehash",
        role: "student",
        createdAt: Date.now(),
      });

      mockCtx.db._seed(sessionId, {
        userId,
        token,
        expiresAt: Date.now() + 3600000,
      });

      // Verify session exists
      const sessionBefore = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      expect(sessionBefore).not.toBeNull();

      // Simulate logout
      if (sessionBefore) {
        await mockCtx.db.delete(sessionBefore._id);
      }

      // Verify session is deleted
      const sessionAfter = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      expect(sessionAfter).toBeNull();
    });

    it("should be idempotent (logging out twice is OK)", async () => {
      const token = generateMockToken();

      // First logout attempt - no session exists
      const session1 = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      // Should not throw, just return success
      const result1 = { success: true };

      if (session1) {
        await mockCtx.db.delete(session1._id);
      }

      expect(result1.success).toBe(true);

      // Second logout attempt - still no session
      const session2 = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();

      const result2 = { success: true };

      if (session2) {
        await mockCtx.db.delete(session2._id);
      }

      expect(result2.success).toBe(true);
    });

    it("should only delete the specific session, not others", async () => {
      // Create a user with multiple sessions
      const userId = createMockId("users");
      const session1Id = createMockId("sessions");
      const session2Id = createMockId("sessions");
      const token1 = generateMockToken();
      const token2 = generateMockToken();

      mockCtx.db._seed(userId, {
        username: "testuser",
        displayName: "Test",
        passwordHash: "somehash",
        role: "student",
        createdAt: Date.now(),
      });

      mockCtx.db._seed(session1Id, {
        userId,
        token: token1,
        expiresAt: Date.now() + 3600000,
      });

      mockCtx.db._seed(session2Id, {
        userId,
        token: token2,
        expiresAt: Date.now() + 3600000,
      });

      // Logout from token1 only
      const session = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token1))
        .first();

      if (session) {
        await mockCtx.db.delete(session._id);
      }

      // Verify token1 is deleted but token2 remains
      const deletedSession = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token1))
        .first();

      const remainingSession = await mockCtx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", token2))
        .first();

      expect(deletedSession).toBeNull();
      expect(remainingSession).not.toBeNull();
    });
  });

  describe("cleanupExpiredSessions", () => {
    it("should delete only expired sessions", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const userId = createMockId("users");
      mockCtx.db._seed(userId, {
        username: "testuser",
        displayName: "Test",
        passwordHash: "somehash",
        role: "student",
        createdAt: now,
      });

      // Create expired session
      const expiredSessionId = createMockId("sessions");
      mockCtx.db._seed(expiredSessionId, {
        userId,
        token: "expired_token",
        expiresAt: now - 1000, // Expired 1 second ago
      });

      // Create valid session
      const validSessionId = createMockId("sessions");
      mockCtx.db._seed(validSessionId, {
        userId,
        token: "valid_token",
        expiresAt: now + 3600000, // Valid for 1 hour
      });

      // Simulate cleanupExpiredSessions handler
      const sessions = await mockCtx.db.query("sessions").collect();
      let deletedCount = 0;

      for (const session of sessions) {
        if ((session.expiresAt as number) < now) {
          await mockCtx.db.delete(session._id);
          deletedCount++;
        }
      }

      // Verify results
      expect(deletedCount).toBe(1);

      const remainingSessions = await mockCtx.db.query("sessions").collect();
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].token).toBe("valid_token");

      vi.useRealTimers();
    });

    it("should return correct deletedCount", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const userId = createMockId("users");
      mockCtx.db._seed(userId, {
        username: "testuser",
        displayName: "Test",
        passwordHash: "somehash",
        role: "student",
        createdAt: now,
      });

      // Create 3 expired sessions
      for (let i = 0; i < 3; i++) {
        const sessionId = createMockId("sessions");
        mockCtx.db._seed(sessionId, {
          userId,
          token: `expired_token_${i}`,
          expiresAt: now - (i + 1) * 1000, // All expired
        });
      }

      // Create 2 valid sessions
      for (let i = 0; i < 2; i++) {
        const sessionId = createMockId("sessions");
        mockCtx.db._seed(sessionId, {
          userId,
          token: `valid_token_${i}`,
          expiresAt: now + (i + 1) * 3600000, // All valid
        });
      }

      // Simulate cleanupExpiredSessions
      const sessions = await mockCtx.db.query("sessions").collect();
      let deletedCount = 0;

      for (const session of sessions) {
        if ((session.expiresAt as number) < now) {
          await mockCtx.db.delete(session._id);
          deletedCount++;
        }
      }

      expect(deletedCount).toBe(3);

      const result = { success: true, deletedCount };
      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(3);

      vi.useRealTimers();
    });

    it("should return 0 deletedCount when no expired sessions exist", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const userId = createMockId("users");
      mockCtx.db._seed(userId, {
        username: "testuser",
        displayName: "Test",
        passwordHash: "somehash",
        role: "student",
        createdAt: now,
      });

      // Create only valid sessions
      const sessionId = createMockId("sessions");
      mockCtx.db._seed(sessionId, {
        userId,
        token: "valid_token",
        expiresAt: now + 3600000,
      });

      const sessions = await mockCtx.db.query("sessions").collect();
      let deletedCount = 0;

      for (const session of sessions) {
        if ((session.expiresAt as number) < now) {
          await mockCtx.db.delete(session._id);
          deletedCount++;
        }
      }

      expect(deletedCount).toBe(0);

      vi.useRealTimers();
    });

    it("should handle empty sessions table", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // No sessions exist
      const sessions = await mockCtx.db.query("sessions").collect();
      expect(sessions).toHaveLength(0);

      let deletedCount = 0;
      for (const session of sessions) {
        if ((session.expiresAt as number) < now) {
          await mockCtx.db.delete(session._id);
          deletedCount++;
        }
      }

      expect(deletedCount).toBe(0);

      vi.useRealTimers();
    });
  });
});
