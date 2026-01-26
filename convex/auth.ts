import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashPassword } from "./utils";

/**
 * Generate a random session token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if the system needs initial setup (no users exist)
 */
export const checkNeedsBootstrap = query({
  args: {},
  handler: async (ctx) => {
    const firstUser = await ctx.db.query("users").first();
    return firstUser === null;
  },
});

/**
 * Login with username and password
 * Returns session token if successful
 */
export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by username
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (!user) {
      return { success: false, error: "Invalid username or password" };
    }

    // Verify password
    const passwordHash = await hashPassword(args.password);
    if (user.passwordHash !== passwordHash) {
      return { success: false, error: "Invalid username or password" };
    }

    // Create session token
    const token = generateToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    // Delete any existing sessions for this user
    const existingSessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const session of existingSessions) {
      await ctx.db.delete(session._id);
    }

    // Create new session
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt,
    });

    // Update last login
    await ctx.db.patch(user._id, { lastLoginAt: Date.now() });

    return {
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  },
});

/**
 * Logout - delete session
 */
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

/**
 * Get current user from session token
 */
export const getCurrentUser = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token) {
      return null;
    }

    // Find session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session) {
      return null;
    }

    // Check if session expired
    if (session.expiresAt < Date.now()) {
      return null;
    }

    // Get user
    const user = await ctx.db.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      batch: user.batch,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };
  },
});

/**
 * Create a new user (admin only)
 */
export const createUser = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    displayName: v.string(),
    role: v.union(v.literal("student"), v.literal("admin")),
    adminToken: v.string(),
    batch: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify admin
    const adminSession = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.adminToken))
      .unique();

    if (!adminSession) {
      return { success: false, error: "Unauthorized" };
    }

    const admin = await ctx.db.get(adminSession.userId);
    if (!admin || admin.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Check if username exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      passwordHash,
      displayName: args.displayName,
      role: args.role,
      batch: args.batch,
      createdAt: Date.now(),
    });

    return { success: true, userId };
  },
});

/**
 * Initialize the first admin user (only works if no users exist)
 */
export const initializeAdmin = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any users exist
    const existingUsers = await ctx.db.query("users").first();

    if (existingUsers) {
      return { success: false, error: "Admin already exists" };
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create admin user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      passwordHash,
      displayName: args.displayName,
      role: "admin",
      createdAt: Date.now(),
    });

    return { success: true, userId };
  },
});

/**
 * Initialize the first student user (for bootstrapping)
 * Only works if no student users exist yet
 */
export const initializeStudent = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any student users exist
    const existingStudents = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "student"))
      .first();

    if (existingStudents) {
      return { success: false, error: "Student users already exist. Use createUser with admin token instead." };
    }

    // Check if username exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();

    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create student user
    const userId = await ctx.db.insert("users", {
      username: args.username,
      passwordHash,
      displayName: args.displayName,
      role: "student",
      createdAt: Date.now(),
    });

    return { success: true, userId };
  },
});

/**
 * Clean up expired sessions
 * Should be called periodically to prevent sessions table from growing
 */
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const sessions = await ctx.db.query("sessions").collect();

    let deletedCount = 0;
    for (const session of sessions) {
      if (session.expiresAt < now) {
        await ctx.db.delete(session._id);
        deletedCount++;
      }
    }

    return { success: true, deletedCount };
  },
});
