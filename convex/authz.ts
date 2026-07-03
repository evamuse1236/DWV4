import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type DbCtx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

export type SafeUser = {
  _id: Id<"users">;
  username: string;
  role: "student" | "admin";
  displayName: string;
  avatarUrl?: string;
  batch?: string;
  createdAt: number;
  lastLoginAt?: number;
};

export function toSafeUser(user: Doc<"users">): SafeUser {
  return {
    _id: user._id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    batch: user.batch,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export async function getSessionUser(
  ctx: DbCtx,
  token: string
): Promise<{ session: Doc<"sessions">; user: Doc<"users"> } | null> {
  if (!token) return null;

  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();

  if (!session || session.expiresAt < Date.now()) return null;

  const user = await ctx.db.get(session.userId);
  if (!user) return null;

  return { session, user };
}

export async function requireSession(ctx: DbCtx, token: string) {
  const sessionUser = await getSessionUser(ctx, token);
  if (!sessionUser) {
    throw new Error("Unauthorized");
  }
  return sessionUser;
}

export async function requireAdmin(ctx: DbCtx, adminToken: string) {
  const sessionUser = await requireSession(ctx, adminToken);
  if (sessionUser.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return sessionUser;
}

export async function requireUserMatch(
  ctx: DbCtx,
  token: string,
  userId: Id<"users">
) {
  const sessionUser = await requireSession(ctx, token);
  if (sessionUser.user._id.toString() !== userId.toString()) {
    throw new Error("Unauthorized");
  }
  return sessionUser;
}

export async function requireUserOrAdmin(
  ctx: DbCtx,
  args: { token?: string; adminToken?: string; userId: Id<"users"> }
) {
  if (args.adminToken) {
    return requireAdmin(ctx, args.adminToken);
  }
  if (args.token) {
    return requireUserMatch(ctx, args.token, args.userId);
  }
  throw new Error("Unauthorized");
}

export function requireMaintenanceKey(providedKey: string | undefined) {
  const expectedKey = process.env.CONVEX_MAINTENANCE_KEY;
  if (!expectedKey || providedKey !== expectedKey) {
    throw new Error("Unauthorized");
  }
}
