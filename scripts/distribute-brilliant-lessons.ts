/**
 * distribute-brilliant-lessons.ts
 *
 * Reads playlist_mapping.json + chapter-assignment-config.json,
 * deduplicates Brilliant chapter/lesson assignments so each chapter
 * is assigned to exactly one sub-objective per topic.
 *
 * Usage: npx tsx scripts/distribute-brilliant-lessons.ts [--dry-run]
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Lesson {
  lesson_slug: string;
  url: string;
}

interface BrilliantChapter {
  source: string;
  course_name: string;
  course_slug: string;
  chapter_slug: string;
  lessons: Lesson[];
  match_quality: string;
}

interface KhanEntry {
  source: string;
  unit_name: string;
  unit_url: string;
  match_quality: string;
  note?: string;
}

interface LearningObjective {
  curriculum: string;
  row: number;
  subject: string;
  topic: string;
  learning_objective: string;
  dw_handout: string;
  playlist_links: {
    khan_academy: KhanEntry[];
    brilliant: BrilliantChapter[];
  };
}

interface PlaylistMapping {
  metadata: Record<string, unknown>;
  learning_objectives: LearningObjective[];
}

interface SplitConfig {
  target_description: string;
  lessons: string[];
}

interface ChapterAssignment {
  type: "assign" | "split" | "remove";
  target_row?: number;
  target_description?: string;
  splits?: Record<string, SplitConfig>;
  note?: string;
}

interface TopicConfig {
  [chapterKey: string]: ChapterAssignment;
}

interface Config {
  description: string;
  within_topic_assignments: Record<string, TopicConfig>;
  cross_topic_assignments: Record<string, unknown>;
}

const ROOT = path.resolve(__dirname, "..");
const MAPPING_PATH = path.join(ROOT, "playlist_mapping.json");
const CONFIG_PATH = path.join(ROOT, "scripts", "chapter-assignment-config.json");
const OUTPUT_PATH = path.join(ROOT, "playlist_mapping.json");

const dryRun = process.argv.includes("--dry-run");

function chapterKey(ch: BrilliantChapter): string {
  return `${ch.course_slug}/${ch.chapter_slug}`;
}

function loLabel(lo: LearningObjective): string {
  return lo.learning_objective || lo.dw_handout || `Row ${lo.row}`;
}

function main() {
  const mapping: PlaylistMapping = JSON.parse(
    fs.readFileSync(MAPPING_PATH, "utf-8")
  );
  const config: Config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

  const beforeStats = countStats(mapping);
  const report: string[] = [];
  report.push("=== Brilliant Lesson Distribution Report ===\n");

  // Process each topic in the config
  for (const [topicName, topicConfig] of Object.entries(
    config.within_topic_assignments
  )) {
    report.push(`\n## Topic: ${topicName}`);

    // Get all LOs for this topic
    const topicLOs = mapping.learning_objectives.filter(
      (lo) => lo.topic === topicName
    );

    if (topicLOs.length === 0) {
      report.push(`  WARNING: No LOs found for topic "${topicName}"`);
      continue;
    }

    for (const [chapKey, assignment] of Object.entries(topicConfig)) {
      const [courseSlug, chapterSlug] = chapKey.split("/");

      if (assignment.type === "assign") {
        // Assign entire chapter to a single target row
        const targetRow = assignment.target_row!;
        report.push(
          `  ${chapKey} → Row ${targetRow} (${assignment.target_description})`
        );

        for (const lo of topicLOs) {
          const hasChapter = lo.playlist_links.brilliant.some(
            (b) => b.course_slug === courseSlug && b.chapter_slug === chapterSlug
          );
          if (!hasChapter) continue;

          if (lo.row === targetRow) {
            // Keep it
            report.push(`    ✓ Kept in Row ${lo.row}`);
          } else {
            // Remove it
            lo.playlist_links.brilliant = lo.playlist_links.brilliant.filter(
              (b) =>
                !(
                  b.course_slug === courseSlug &&
                  b.chapter_slug === chapterSlug
                )
            );
            report.push(`    ✗ Removed from Row ${lo.row} (${loLabel(lo)})`);
          }
        }
      } else if (assignment.type === "split") {
        // Split chapter lessons across multiple target rows
        report.push(`  ${chapKey} → SPLIT across rows`);
        const splits = assignment.splits!;

        // Build a map: row -> set of lesson slugs to keep
        const rowLessons = new Map<number, Set<string>>();
        for (const [rowStr, splitDef] of Object.entries(splits)) {
          const row = parseInt(rowStr, 10);
          rowLessons.set(row, new Set(splitDef.lessons));
          if (splitDef.lessons.length > 0) {
            report.push(
              `    Row ${row}: ${splitDef.lessons.length} lessons (${splitDef.target_description})`
            );
          } else {
            report.push(
              `    Row ${row}: 0 lessons - chapter removed (${splitDef.target_description})`
            );
          }
        }

        for (const lo of topicLOs) {
          const chapterIdx = lo.playlist_links.brilliant.findIndex(
            (b) => b.course_slug === courseSlug && b.chapter_slug === chapterSlug
          );
          if (chapterIdx === -1) continue;

          const chapter = lo.playlist_links.brilliant[chapterIdx];
          const targetLessons = rowLessons.get(lo.row);

          if (targetLessons === undefined) {
            // This row is not in the split config — remove the chapter entirely
            lo.playlist_links.brilliant.splice(chapterIdx, 1);
            report.push(
              `    ✗ Removed entirely from Row ${lo.row} (not in split config)`
            );
          } else if (targetLessons.size === 0) {
            // Explicitly assigned 0 lessons — remove chapter
            lo.playlist_links.brilliant.splice(chapterIdx, 1);
            report.push(
              `    ✗ Removed from Row ${lo.row} (0 lessons assigned)`
            );
          } else {
            // Filter lessons to only those assigned to this row
            const originalCount = chapter.lessons.length;
            chapter.lessons = chapter.lessons.filter((l) =>
              targetLessons.has(l.lesson_slug)
            );
            report.push(
              `    ✓ Row ${lo.row}: ${originalCount} → ${chapter.lessons.length} lessons`
            );
          }
        }
      } else if (assignment.type === "remove") {
        // Remove this chapter from all LOs in this topic
        report.push(
          `  ${chapKey} → REMOVED from topic (${assignment.note || "cross-topic duplicate"})`
        );

        for (const lo of topicLOs) {
          const hadIt = lo.playlist_links.brilliant.some(
            (b) => b.course_slug === courseSlug && b.chapter_slug === chapterSlug
          );
          if (hadIt) {
            lo.playlist_links.brilliant = lo.playlist_links.brilliant.filter(
              (b) =>
                !(
                  b.course_slug === courseSlug &&
                  b.chapter_slug === chapterSlug
                )
            );
            report.push(`    ✗ Removed from Row ${lo.row} (${loLabel(lo)})`);
          }
        }
      }
    }
  }

  // Process cross-topic assignments (chapters duplicated across different curricula/topics)
  const crossTopicConfig = config.cross_topic_assignments;
  report.push("\n## Cross-Topic Assignments");

  for (const [chapKey, entry] of Object.entries(crossTopicConfig)) {
    // Skip the "note" string entry
    if (typeof entry !== "object" || entry === null || !("type" in entry))
      continue;
    const assignment = entry as {
      type: string;
      keep: { curriculum: string; topic: string; row: number };
      remove_from: { curriculum: string; topic: string; row: number }[];
      note?: string;
    };
    if (assignment.type !== "cross_assign") continue;

    const [courseSlug, chapterSlug] = chapKey.split("/");
    report.push(
      `  ${chapKey} → Keep in ${assignment.keep.curriculum} "${assignment.keep.topic}" Row ${assignment.keep.row}`
    );

    for (const target of assignment.remove_from) {
      const targetLO = mapping.learning_objectives.find(
        (lo) =>
          lo.curriculum === target.curriculum &&
          lo.topic === target.topic &&
          lo.row === target.row
      );
      if (!targetLO) {
        report.push(
          `    WARNING: No LO found for ${target.curriculum} "${target.topic}" Row ${target.row}`
        );
        continue;
      }
      const hadIt = targetLO.playlist_links.brilliant.some(
        (b) => b.course_slug === courseSlug && b.chapter_slug === chapterSlug
      );
      if (hadIt) {
        targetLO.playlist_links.brilliant =
          targetLO.playlist_links.brilliant.filter(
            (b) =>
              !(
                b.course_slug === courseSlug && b.chapter_slug === chapterSlug
              )
          );
        report.push(
          `    ✗ Removed from ${target.curriculum} "${target.topic}" Row ${target.row}`
        );
      } else {
        report.push(
          `    (not found in ${target.curriculum} "${target.topic}" Row ${target.row})`
        );
      }
    }
  }

  const afterStats = countStats(mapping);

  report.push("\n=== Statistics ===");
  report.push(`Before: ${beforeStats.totalAssignments} total Brilliant lesson assignments`);
  report.push(`After:  ${afterStats.totalAssignments} total Brilliant lesson assignments`);
  report.push(`Removed: ${beforeStats.totalAssignments - afterStats.totalAssignments}`);
  report.push(`Before unique chapters: ${beforeStats.uniqueChapters}`);
  report.push(`After unique chapters:  ${afterStats.uniqueChapters}`);

  // Per-topic breakdown
  report.push("\n=== Per-Topic Activity Counts ===");
  const topicCounts = new Map<string, { brilliant: number; ka: number; subs: number }>();
  for (const lo of mapping.learning_objectives) {
    const existing = topicCounts.get(lo.topic) || { brilliant: 0, ka: 0, subs: 0 };
    existing.brilliant += lo.playlist_links.brilliant.reduce(
      (sum, ch) => sum + ch.lessons.length,
      0
    );
    existing.ka += lo.playlist_links.khan_academy.length;
    existing.subs++;
    topicCounts.set(lo.topic, existing);
  }

  for (const [topic, counts] of topicCounts) {
    report.push(
      `  ${topic}: ${counts.subs} subs, ${counts.brilliant} Brilliant lessons, ${counts.ka} KA units`
    );
  }

  // Check for remaining within-topic duplicates (ignoring lesson-level splits with distinct lessons)
  report.push("\n=== Remaining Within-Topic Duplicates ===");
  const topicChapterRows = new Map<string, { row: number; lessonSlugs: Set<string> }[]>();
  for (const lo of mapping.learning_objectives) {
    for (const ch of lo.playlist_links.brilliant) {
      const key = `${lo.topic}|||${chapterKey(ch)}`;
      if (!topicChapterRows.has(key)) {
        topicChapterRows.set(key, []);
      }
      topicChapterRows.get(key)!.push({
        row: lo.row,
        lessonSlugs: new Set(ch.lessons.map((l) => l.lesson_slug)),
      });
    }
  }

  let remainingDupes = 0;
  for (const [topicChap, entries] of topicChapterRows) {
    if (entries.length <= 1) continue;
    const [topic, chapK] = topicChap.split("|||");

    // Check if any two rows share the same lessons (true duplicate)
    let hasTrueDuplicate = false;
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const overlap = [...entries[i].lessonSlugs].filter((s) =>
          entries[j].lessonSlugs.has(s)
        );
        if (overlap.length > 0) {
          hasTrueDuplicate = true;
          break;
        }
      }
      if (hasTrueDuplicate) break;
    }

    if (hasTrueDuplicate) {
      report.push(
        `  DUPLICATE: ${topic} / ${chapK} in rows: ${entries.map((e) => e.row).join(", ")}`
      );
      remainingDupes++;
    } else {
      report.push(
        `  OK (lesson-level split): ${topic} / ${chapK} in rows: ${entries.map((e) => `${e.row}(${e.lessonSlugs.size})`).join(", ")}`
      );
    }
  }

  if (remainingDupes === 0) {
    report.push("  No true duplicates! All within-topic duplicates resolved.");
  }

  const reportText = report.join("\n");
  console.log(reportText);

  const reportPath = path.join(
    ROOT,
    "scripts",
    "distribution-report.txt"
  );
  fs.writeFileSync(reportPath, reportText);
  console.log(`\nReport saved to: ${reportPath}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No changes written to playlist_mapping.json");
  } else {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2) + "\n");
    console.log(`\nUpdated playlist_mapping.json written.`);
  }
}

function countStats(mapping: PlaylistMapping) {
  let totalAssignments = 0;
  const chapterSet = new Set<string>();

  for (const lo of mapping.learning_objectives) {
    for (const ch of lo.playlist_links.brilliant) {
      totalAssignments += ch.lessons.length;
      chapterSet.add(chapterKey(ch));
    }
  }

  return { totalAssignments, uniqueChapters: chapterSet.size };
}

main();
