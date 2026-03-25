/**
 * fix-metadata.ts
 *
 * Fixes metadata quality issues in playlist_mapping.json:
 * 1. Brilliant lesson titles: looks up human-readable names from brilliant_links.json
 * 2. KA display titles: strips grade/course/module prefixes
 * 3. Activity types: assigns types based on URL patterns
 *
 * Usage:
 *   node --experimental-strip-types scripts/fix-metadata.ts            # Apply changes
 *   node --experimental-strip-types scripts/fix-metadata.ts --dry-run  # Preview only
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// --- Types ---

interface Lesson {
  lesson_slug: string;
  url: string;
  title?: string; // Added by this script
}

interface BrilliantChapter {
  source: string;
  course_name: string;
  course_slug: string;
  chapter_slug: string;
  lessons: Lesson[];
  match_quality: string;
  activity_type?: string; // Added by this script
}

interface KhanEntry {
  source: string;
  unit_name: string;
  unit_url: string;
  match_quality: string;
  note?: string;
  display_title?: string; // Added by this script
  activity_type?: string; // Added by this script
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

// brilliant_links.json lesson entry (in the all_links array)
interface BrilliantLesson {
  index: number;
  title: string;
  lesson_slug: string;
  url: string;
  mapped_los: unknown[];
}

interface BrilliantLinks {
  all_links: BrilliantLesson[];
  [key: string]: unknown;
}

// --- Brilliant title lookup ---

function buildSlugToTitleMap(brilliantLinks: BrilliantLinks): Map<string, string> {
  const map = new Map<string, string>();
  for (const lesson of brilliantLinks.all_links) {
    map.set(lesson.lesson_slug, lesson.title);
  }
  return map;
}

// --- KA title normalization ---

/**
 * Strips common prefixes from KA unit names:
 * - Grade prefixes: "3rd Grade - X", "4th Grade – X", "6th Grade - X"
 * - Course prefixes: "Arithmetic – X", "Pre-Algebra – X", etc.
 * - Module prefixes: "Module 5: X"
 * - Parenthetical suffixes: "X (3rd grade)", "X (Arithmetic)", "X (Pre-Algebra)"
 */
function makeDisplayTitle(unitName: string): string {
  let title = unitName;

  // Strip grade prefixes: "3rd Grade - X", "4th Grade – X" (both dash types)
  title = title.replace(
    /^\d+(?:st|nd|rd|th)\s+[Gg]rade\s*[-–—]\s*/i,
    ""
  );

  // Strip course prefixes: "Arithmetic – X", "Pre-Algebra – X"
  title = title.replace(
    /^(?:Arithmetic|Pre-Algebra|Algebra|Geometry|Statistics)\s*[-–—]\s*/i,
    ""
  );

  // Strip module prefixes: "Module 5: X"
  title = title.replace(/^Module\s+\d+:\s*/i, "");

  // Strip parenthetical suffixes: "(3rd grade)", "(Arithmetic)", "(4th grade K-8)"
  title = title.replace(
    /\s*\((?:\d+(?:st|nd|rd|th)\s+grade(?:\s+K-\d+)?|Arithmetic(?:\s+review)?|Pre-Algebra|Algebra|Geometry|Statistics)\)\s*$/i,
    ""
  );

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return title;
}

// --- Activity type detection ---

/**
 * Determines activity type for a KA URL.
 * - /e/ or /exercise/ segments → "exercise"
 * - /v/ or /video/ segments → "video"
 * - Everything else (unit landing pages) → "video" (default, since KA units are primarily video-based)
 */
function detectKaActivityType(url: string): "video" | "exercise" {
  // Check for exercise-specific URL patterns
  if (/\/e\//.test(url) || /\/exercise\//.test(url)) {
    return "exercise";
  }
  // Check for video-specific URL patterns
  if (/\/v\//.test(url) || /\/video\//.test(url)) {
    return "video";
  }
  // Default for unit/course landing pages — KA units are mostly video content
  return "video";
}

// --- Main ---

const dryRun = process.argv.includes("--dry-run");

function main() {
  const mappingPath = path.join(ROOT, "playlist_mapping.json");
  const brilliantLinksPath = path.join(ROOT, "brilliant_links.json");

  const mapping: PlaylistMapping = JSON.parse(
    fs.readFileSync(mappingPath, "utf-8")
  );

  const brilliantLinks: BrilliantLinks = JSON.parse(
    fs.readFileSync(brilliantLinksPath, "utf-8")
  );

  const slugToTitle = buildSlugToTitleMap(brilliantLinks);

  const report: string[] = [];
  report.push("=== Fix Metadata Report ===\n");

  // Counters
  let brilliantTitlesFixed = 0;
  let brilliantTitlesNotFound = 0;
  let kaDisplayTitlesFixed = 0;
  let kaDisplayTitlesSame = 0;
  let kaTypesAssigned = 0;
  let brilliantTypesAssigned = 0;

  for (const lo of mapping.learning_objectives) {
    // --- 1a. Fix Brilliant lesson titles ---
    for (const ch of lo.playlist_links.brilliant) {
      for (const lesson of ch.lessons) {
        const title = slugToTitle.get(lesson.lesson_slug);
        if (title) {
          lesson.title = title;
          brilliantTitlesFixed++;
        } else {
          // Slug not found — keep slug as fallback (no title field added)
          brilliantTitlesNotFound++;
          report.push(
            `  WARNING: No title found for Brilliant slug "${lesson.lesson_slug}" (${lo.curriculum} Row ${lo.row})`
          );
        }
      }

      // --- 1c. Brilliant activity type (always "exercise" — interactive content) ---
      if (!ch.activity_type) {
        ch.activity_type = "exercise";
        brilliantTypesAssigned++;
      }
    }

    // --- 1b. Standardize KA titles ---
    for (const ka of lo.playlist_links.khan_academy) {
      const displayTitle = makeDisplayTitle(ka.unit_name);

      // Only add display_title if it differs from unit_name
      if (displayTitle !== ka.unit_name) {
        ka.display_title = displayTitle;
        kaDisplayTitlesFixed++;
      } else {
        kaDisplayTitlesSame++;
      }

      // --- 1c. KA activity type ---
      if (!ka.activity_type) {
        ka.activity_type = detectKaActivityType(ka.unit_url);
        kaTypesAssigned++;
      }
    }
  }

  // --- Report ---
  report.push("## Brilliant Titles");
  report.push(`  Titles resolved from slug→title map: ${brilliantTitlesFixed}`);
  report.push(`  Slugs with no title found: ${brilliantTitlesNotFound}`);

  report.push("\n## KA Display Titles");
  report.push(`  Titles cleaned (prefix stripped): ${kaDisplayTitlesFixed}`);
  report.push(`  Titles already clean (unchanged): ${kaDisplayTitlesSame}`);

  report.push("\n## Activity Types");
  report.push(`  KA types assigned: ${kaTypesAssigned}`);
  report.push(`  Brilliant types assigned: ${brilliantTypesAssigned}`);

  // Show some examples of transformed KA titles
  report.push("\n## Example KA Title Transformations");
  const examples: string[] = [];
  for (const lo of mapping.learning_objectives) {
    for (const ka of lo.playlist_links.khan_academy) {
      if (ka.display_title && examples.length < 10) {
        examples.push(`  "${ka.unit_name}" → "${ka.display_title}"`);
      }
    }
  }
  for (const ex of examples) {
    report.push(ex);
  }

  // Show some Brilliant title examples
  report.push("\n## Example Brilliant Title Lookups");
  const bExamples: string[] = [];
  for (const lo of mapping.learning_objectives) {
    for (const ch of lo.playlist_links.brilliant) {
      for (const lesson of ch.lessons) {
        if (lesson.title && bExamples.length < 10) {
          bExamples.push(
            `  "${ch.course_name}: ${lesson.lesson_slug}" → "${ch.course_name}: ${lesson.title}"`
          );
        }
      }
    }
  }
  for (const ex of bExamples) {
    report.push(ex);
  }

  const reportText = report.join("\n");
  console.log(reportText);

  const reportPath = path.join(ROOT, "scripts", "fix-metadata-report.txt");
  fs.writeFileSync(reportPath, reportText);
  console.log(`\nReport saved to: ${reportPath}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No changes written to playlist_mapping.json");
  } else {
    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2) + "\n");
    console.log(`\nUpdated playlist_mapping.json written.`);
  }
}

main();
