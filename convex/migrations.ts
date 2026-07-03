import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireMaintenanceKey } from "./authz";

/**
 * One-time migration: convert global trustJar doc to batch-specific docs.
 *
 * Run via: npx convex run migrations:migrateTrustJarToBatches
 *
 * This finds any trustJar doc without a batch field (the old global doc),
 * creates two batch-specific copies (2153 and 2156), and deletes the old doc.
 */
export const migrateTrustJarToBatches = mutation({
  args: {
    maintenanceKey: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    requireMaintenanceKey(args.maintenanceKey);
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

/**
 * One-time migration: patch legacy Khan Academy activity URLs to current destinations.
 *
 * Dry run:
 *   npx convex run migrations:migrateKhanAcademyActivityLinks '{"dryRun": true}'
 *
 * Apply:
 *   npx convex run migrations:migrateKhanAcademyActivityLinks '{"dryRun": false}'
 */
export const migrateKhanAcademyActivityLinks = mutation({
  args: {
    maintenanceKey: v.optional(v.string()),
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    requireMaintenanceKey(args.maintenanceKey);
    const dryRun = args.dryRun ?? true;

    const replacements: Record<string, string> = {
      "https://www.khanacademy.org/math/pre-algebra/pre-algebra-fractions":
        "https://www.khanacademy.org/math/arithmetic-home/arith-review-fractions",
      "https://www.khanacademy.org/math/k-8-grades/cc-third-grade-math/imp-perimeter":
        "https://www.khanacademy.org/math/cc-third-grade-math/3rd-perimeter/imp-perimeter",
      "https://www.khanacademy.org/math/cc-fifth-grade-math/volume":
        "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-volume",
      "https://www.khanacademy.org/math/cc-fifth-grade-math/volume/volume_word_problems":
        "https://www.khanacademy.org/math/cc-fifth-grade-math/5th-volume",
      "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-measurement-and-data-3/converting-units":
        "https://www.khanacademy.org/math/6th-grade-illustrative-math/unit-3-unit-rates-and-percentages/x6d0461550282bed1:converting-units/a/converting-units",
      "https://www.khanacademy.org/math/cc-fifth-grade-math/multiply-decimals/multiplying-decimals-word-problems":
        "https://www.khanacademy.org/math/grade-4-math-snc-aligned/x6f85f380d87b3bb6:decimals/x6f85f380d87b3bb6:word-problems-of-decimal-numbers/v/multiplying-decimals-word-problems",
      "https://www.khanacademy.org/math/cc-fourth-grade-math/area-perimeter/area-perimeter-word-problems":
        "https://www.khanacademy.org/math/cc-third-grade-math/3rd-perimeter/imp-comparing-area-and-perimeter/e/area-perimeter-word-problems",
    };

    const activities = await ctx.db.query("activities").collect();
    const planned = activities
      .filter((activity) => replacements[activity.url] && activity.url !== replacements[activity.url])
      .map((activity) => ({
        activityId: activity._id,
        title: activity.title,
        from: activity.url,
        to: replacements[activity.url],
      }));

    if (!dryRun) {
      for (const change of planned) {
        await ctx.db.patch(change.activityId, { url: change.to });
      }
    }

    return {
      success: true,
      dryRun,
      matchesFound: planned.length,
      updated: dryRun ? 0 : planned.length,
      sample: planned.slice(0, 25),
    };
  },
});
