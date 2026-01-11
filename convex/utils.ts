/**
 * Shared utilities for Convex functions
 */

/**
 * Hash a password using SHA-256 with a salt.
 * Note: In production, use a proper hashing library like bcrypt via an action.
 * This is a simplified version for demo purposes.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "deep-work-tracker-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
