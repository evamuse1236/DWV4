import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { hashPassword } from "./utils";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/**
 * Generate a random session token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function normalizeUsername(username: string): string {
  return username.trim();
}

function normalizeAvatarUrl(avatarUrl: string | undefined): string | undefined {
  const normalized = avatarUrl?.trim();
  return normalized ? normalized : undefined;
}

async function getSessionUser(
  ctx: MutationCtx,
  token: string
): Promise<{ session: Doc<"sessions">; user: Doc<"users"> } | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session) return null;

  if (session.expiresAt < Date.now()) {
    await ctx.db.delete(session._id);
    return null;
  }

  const user = await ctx.db.get(session.userId);
  if (!user) return null;

  return { session, user };
}

async function getAdminFromToken(
  ctx: MutationCtx,
  adminToken: string
): Promise<Doc<"users"> | null> {
  const sessionUser = await getSessionUser(ctx, adminToken);
  if (!sessionUser) return null;
  if (sessionUser.user.role !== "admin") return null;
  return sessionUser.user;
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
    const admin = await getAdminFromToken(ctx, args.adminToken);
    if (!admin) {
      return { success: false, error: "Unauthorized" };
    }

    const normalizedUsername = normalizeUsername(args.username);
    if (!normalizedUsername) {
      return { success: false, error: "Username cannot be empty" };
    }
    if (args.password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    // Check if username exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .unique();

    if (existingUser) {
      return { success: false, error: "Username already exists" };
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create user
    const userId = await ctx.db.insert("users", {
      username: normalizedUsername,
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
 * Change current user's username
 */
export const changeOwnUsername = mutation({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionUser = await getSessionUser(ctx, args.token);
    if (!sessionUser) {
      return { success: false, error: "Session expired. Please log in again." };
    }

    const normalizedUsername = normalizeUsername(args.newUsername);
    if (!normalizedUsername) {
      return { success: false, error: "Username cannot be empty" };
    }

    const currentPasswordHash = await hashPassword(args.currentPassword);
    if (currentPasswordHash !== sessionUser.user.passwordHash) {
      return { success: false, error: "Current password is incorrect" };
    }

    if (normalizedUsername === sessionUser.user.username) {
      return { success: true, username: normalizedUsername };
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .unique();

    if (existingUser && existingUser._id.toString() !== sessionUser.user._id.toString()) {
      return { success: false, error: "Username already exists" };
    }

    await ctx.db.patch(sessionUser.user._id, { username: normalizedUsername });
    return { success: true, username: normalizedUsername };
  },
});

/**
 * Change current user's password
 */
export const changeOwnPassword = mutation({
  args: {
    token: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionUser = await getSessionUser(ctx, args.token);
    if (!sessionUser) {
      return { success: false, error: "Session expired. Please log in again." };
    }

    if (args.newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters" };
    }

    const currentPasswordHash = await hashPassword(args.currentPassword);
    if (currentPasswordHash !== sessionUser.user.passwordHash) {
      return { success: false, error: "Current password is incorrect" };
    }

    if (args.newPassword === args.currentPassword) {
      return { success: false, error: "New password must be different from current password" };
    }

    const newPasswordHash = await hashPassword(args.newPassword);
    await ctx.db.patch(sessionUser.user._id, { passwordHash: newPasswordHash });

    return { success: true };
  },
});

/**
 * Update current user's profile fields.
 * Initial scope: avatar URL only.
 */
export const updateOwnProfile = mutation({
  args: {
    token: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionUser = await getSessionUser(ctx, args.token);
    if (!sessionUser) {
      return { success: false, error: "Session expired. Please log in again." };
    }

    const normalizedAvatarUrl = normalizeAvatarUrl(args.avatarUrl);
    await ctx.db.patch(sessionUser.user._id, {
      avatarUrl: normalizedAvatarUrl,
    });

    return { success: true, avatarUrl: normalizedAvatarUrl };
  },
});

/**
 * Get friend profile photos for the current student.
 * Returns only safe public fields.
 */
export const getFriendProfiles = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.token) {
      return [];
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();

    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const currentUser = await ctx.db.get(session.userId);
    if (!currentUser || currentUser.role !== "student") {
      return [];
    }

    const candidateStudents = currentUser.batch
      ? await ctx.db
          .query("users")
          .withIndex("by_batch", (q) => q.eq("batch", currentUser.batch))
          .collect()
      : await ctx.db
          .query("users")
          .withIndex("by_role", (q) => q.eq("role", "student"))
          .collect();

    return candidateStudents
      .filter(
        (student) =>
          student.role === "student" &&
          student._id.toString() !== currentUser._id.toString()
      )
      .map((student) => ({
        _id: student._id,
        displayName: student.displayName,
        username: student.username,
        avatarUrl: student.avatarUrl,
        batch: student.batch,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
  },
});

/**
 * Admin: update another user's username
 */
export const adminUpdateUsername = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
    newUsername: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminFromToken(ctx, args.adminToken);
    if (!admin) {
      return { success: false, error: "Unauthorized" };
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    const normalizedUsername = normalizeUsername(args.newUsername);
    if (!normalizedUsername) {
      return { success: false, error: "Username cannot be empty" };
    }

    if (normalizedUsername === targetUser.username) {
      return { success: true, username: normalizedUsername };
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", normalizedUsername))
      .unique();
    if (existingUser && existingUser._id.toString() !== targetUser._id.toString()) {
      return { success: false, error: "Username already exists" };
    }

    await ctx.db.patch(args.userId, { username: normalizedUsername });
    return { success: true, username: normalizedUsername };
  },
});

/**
 * Admin: reset another user's password
 */
export const adminResetPassword = mutation({
  args: {
    adminToken: v.string(),
    userId: v.id("users"),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminFromToken(ctx, args.adminToken);
    if (!admin) {
      return { success: false, error: "Unauthorized" };
    }

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    if (args.newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    const passwordHash = await hashPassword(args.newPassword);
    await ctx.db.patch(args.userId, { passwordHash });
    return { success: true };
  },
});

/**
 * Admin: get safe credential summary for all users.
 * Note: Passwords are never stored in plaintext and cannot be retrieved.
 */
export const getCredentialSummaries = query({
  args: {
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.adminToken) {
      return [];
    }

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.adminToken))
      .unique();
    if (!session || session.expiresAt < Date.now()) {
      return [];
    }

    const admin = await ctx.db.get(session.userId);
    if (!admin || admin.role !== "admin") {
      return [];
    }

    const users = await ctx.db.query("users").collect();
    return users
      .map((user) => ({
        _id: user._id,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        batch: user.batch,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName));
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
 * One-off: seed additional admin accounts.
 * Idempotent — skips usernames that already exist.
 * Run: npx convex run auth:seedAdmins
 */
export const seedAdmins = mutation({
  args: {},
  handler: async (ctx) => {
    const admins = [
      { username: "devisha", displayName: "devisha" },
      { username: "vishwa", displayName: "vishwa" },
    ];

    const created: string[] = [];
    for (const admin of admins) {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_username", (q) => q.eq("username", admin.username))
        .unique();

      const passwordHash = await hashPassword(admin.username);

      if (existing) {
        // Fix password if it doesn't match
        if (existing.passwordHash !== passwordHash) {
          await ctx.db.patch(existing._id, { passwordHash });
          created.push(admin.username + " (password fixed)");
        }
        continue;
      }

      await ctx.db.insert("users", {
        username: admin.username,
        passwordHash,
        displayName: admin.displayName,
        role: "admin",
        createdAt: Date.now(),
      });
      created.push(admin.username);
    }

    return { created, skipped: admins.length - created.length };
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
