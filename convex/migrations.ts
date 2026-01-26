import { mutation } from "./_generated/server";

/**
 * One-time migration: convert global trustJar doc to batch-specific docs.
 *
 * Run via: npx convex run migrations:migrateTrustJarToBatches
 *
 * This finds any trustJar doc without a batch field (the old global doc),
 * creates two batch-specific copies (2153 and 2156), and deletes the old doc.
 */
export const migrateTrustJarToBatches = mutation({
  args: {},
  handler: async (ctx) => {
    const allJars = await ctx.db.query("trustJar").collect();

    // Find the old global doc (one without a batch field, or with empty batch)
    const oldDoc = allJars.find(
      (jar) => !(jar as Record<string, unknown>).batch
    );

    if (!oldDoc) {
      return {
        success: true,
        message: "No global trustJar doc found. Migration may have already run.",
        existingDocs: allJars.length,
      };
    }

    const batches = ["2153", "2156"];

    for (const batch of batches) {
      // Check if a doc for this batch already exists
      const existing = await ctx.db
        .query("trustJar")
        .withIndex("by_batch", (q) => q.eq("batch", batch))
        .unique();

      if (!existing) {
        await ctx.db.insert("trustJar", {
          batch,
          count: oldDoc.count,
          timesCompleted: oldDoc.timesCompleted,
          updatedAt: oldDoc.updatedAt,
          updatedBy: oldDoc.updatedBy,
        });
      }
    }

    // Delete the old global doc
    await ctx.db.delete(oldDoc._id);

    return {
      success: true,
      message: `Migrated global trustJar doc to ${batches.length} batch-specific docs.`,
      migratedBatches: batches,
    };
  },
});
