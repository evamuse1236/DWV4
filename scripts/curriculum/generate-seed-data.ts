/**
 * generate-seed-data.ts
 *
 * Reads the updated playlist_mapping.json and generates the TypeScript
 * code blocks for seed.ts — both MYP Y1 (insertMajorWithSubsAndActivities)
 * and PYP Y2 (insertPypMajor) calls.
 *
 * Usage: node --experimental-strip-types scripts/generate-seed-data.ts
 *
 * Output: writes to scripts/generated-seed-block.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Lesson {
  lesson_slug: string;
  url: string;
  title?: string; // Human-readable title from brilliant_links.json
}

interface BrilliantChapter {
  source: string;
  course_name: string;
  course_slug: string;
  chapter_slug: string;
  lessons: Lesson[];
  match_quality: string;
  activity_type?: string;
}

interface KhanEntry {
  source: string;
  unit_name: string;
  unit_url: string;
  match_quality: string;
  note?: string;
  display_title?: string;
  activity_type?: string;
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

// Map from playlist_mapping topic names to seeded major objective titles.
//
// For MYP Y1, we intentionally group under CCSS Grade 6 domains to avoid
// confusing overlaps like "Fractions Foundation" vs "Fractions".
const TOPIC_TO_MAJOR: Record<string, string> = {
  // 6.RP
  Rates: "CCSS G6: Ratios & Proportional Relationships (6.RP)",
  Percentage: "CCSS G6: Ratios & Proportional Relationships (6.RP)",

  // 6.NS (includes below-grade prerequisites currently present in MYP Y1 mapping)
  "Fractions Foundation": "CCSS G6: The Number System (6.NS)",
  Fractions: "CCSS G6: The Number System (6.NS)",
  Decimals: "CCSS G6: The Number System (6.NS)",
  "Factors and Multiples": "CCSS G6: The Number System (6.NS)",
  "Arithmetic MYP 1": "CCSS G6: The Number System (6.NS)",

  // 6.EE
  "Algebra foundations": "CCSS G6: Expressions & Equations (6.EE)",
  Algebra: "CCSS G6: Expressions & Equations (6.EE)",

  // 6.G
  Geometry: "CCSS G6: Geometry (6.G)",
  "Measurement and Areas": "CCSS G6: Geometry (6.G)",

  // 6.SP
  Data: "CCSS G6: Statistics & Probability (6.SP)",
};

const CCSS_MAJOR_ORDER = [
  "CCSS G6: Ratios & Proportional Relationships (6.RP)",
  "CCSS G6: The Number System (6.NS)",
  "CCSS G6: Expressions & Equations (6.EE)",
  "CCSS G6: Geometry (6.G)",
  "CCSS G6: Statistics & Probability (6.SP)",
];

// Short sub-objective titles (derived from existing seed.ts patterns)
function firstNonEmptyLine(s: string): string | null {
  const lines = (s || "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function collapseWhitespace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function makeSubTitle(lo: LearningObjective): string {
  if (lo.dw_handout) {
    // Use the part after the colon if it follows "Topic: subtitle" pattern
    const colonIdx = lo.dw_handout.indexOf(":");
    if (colonIdx > 0) {
      const afterColon = lo.dw_handout.substring(colonIdx + 1);
      const first =
        firstNonEmptyLine(afterColon) || firstNonEmptyLine(lo.dw_handout);
      if (first) {
        return collapseWhitespace(first.replace(/^Deep\s*Work\s*:\s*/i, ""));
      }
      return collapseWhitespace(afterColon);
    }
    const first = firstNonEmptyLine(lo.dw_handout);
    if (first) {
      return collapseWhitespace(first.replace(/^Deep\s*Work\s*:\s*/i, ""));
    }
    return collapseWhitespace(lo.dw_handout);
  }
  // For learning_objective, take the first sentence/line, truncate if needed
  const first = firstNonEmptyLine(lo.learning_objective) || "";
  // Remove SWBAT prefix
  const cleaned = collapseWhitespace(first.replace(/^SWBAT\s+/i, ""));
  if (!cleaned) return `Row ${lo.row}`;
  // Capitalize first letter
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function escapeString(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

function main() {
  const ROOT = path.resolve(__dirname, "..");
  const mapping: PlaylistMapping = JSON.parse(
    fs.readFileSync(path.join(ROOT, "playlist_mapping.json"), "utf-8")
  );

  // Filter to MYP Y1 only
  const myp1LOs = mapping.learning_objectives.filter(
    (lo) => lo.curriculum === "MYP Y1"
  );

  // Group by CCSS major (derived from topic), preserving original row order.
  const majorLOs = new Map<string, LearningObjective[]>();
  const majorEncounterOrder: string[] = [];
  for (const lo of myp1LOs) {
    const majorTitle = TOPIC_TO_MAJOR[lo.topic];
    if (!majorTitle) continue;
    if (!majorLOs.has(majorTitle)) {
      majorLOs.set(majorTitle, []);
      majorEncounterOrder.push(majorTitle);
    }
    majorLOs.get(majorTitle)!.push(lo);
  }

  const majorOrder: string[] = [];
  for (const m of CCSS_MAJOR_ORDER) if (majorLOs.has(m)) majorOrder.push(m);
  for (const m of majorEncounterOrder)
    if (!majorOrder.includes(m)) majorOrder.push(m);

  const lines: string[] = [];
  let totalActivities = 0;

  for (const majorTitle of majorOrder) {
    const los = majorLOs.get(majorTitle)!;
    lines.push(`    // ${majorTitle}`);
    lines.push(
      `    await insertMajorWithSubsAndActivities("${escapeString(majorTitle)}", [`
    );

    for (let i = 0; i < los.length; i++) {
      const lo = los[i];
      const subTitle = makeSubTitle(lo);
      const description = lo.dw_handout || lo.learning_objective;

      // Build activities array
      const activities: string[] = [];

      // KA activities
      for (const ka of lo.playlist_links.khan_academy) {
        const kaTitle = ka.display_title || ka.unit_name;
        const kaType = ka.activity_type || "video";
        activities.push(
          `        { title: "${escapeString(kaTitle)}", type: "${kaType}", platform: "Khan Academy", url: "${escapeString(ka.unit_url)}" }`
        );
        totalActivities++;
      }

      // Brilliant activities
      for (const ch of lo.playlist_links.brilliant) {
        const brilliantType = ch.activity_type || "exercise";
        for (const lesson of ch.lessons) {
          const lessonTitle = lesson.title || lesson.lesson_slug;
          activities.push(
            `        { title: "${escapeString(ch.course_name)}: ${escapeString(lessonTitle)}", type: "${brilliantType}", platform: "Brilliant", url: "${escapeString(lesson.url)}" }`
          );
          totalActivities++;
        }
      }

      lines.push("      {");
      lines.push(`        title: "${escapeString(subTitle)}",`);
      lines.push(
        `        description: "${escapeString(description)}",`
      );
      lines.push("        activities: [");
      lines.push(activities.join(",\n"));
      lines.push("        ],");
      lines.push(`      }${i < los.length - 1 ? "," : ""}`);
    }

    lines.push("    ]);");
    lines.push("");
  }

  // ========== PYP Y2 GENERATION ==========

  // Map from playlist_mapping PYP Y2 topic names to seed.ts major titles
  const PYP_TOPIC_TO_MAJOR: Record<string, string> = {
    "Geometry ( Angles)": "Angle Detectives",
    "Geometry (2D shapes)": "Shape Safari",
    Arithmetic: "Number Crunching",
    Fractions: "Fraction Adventures",
    Measurement: "Measuring the World",
    "Coordinate Geometry": "Map Makers",
    Data: "Data Detectives",
    Decimal: "Decimal Explorers",
  };

  const pypLOs = mapping.learning_objectives.filter(
    (lo) => lo.curriculum === "PYP Y2"
  );

  const pypTopicOrder: string[] = [];
  const pypTopicLOs = new Map<string, LearningObjective[]>();
  for (const lo of pypLOs) {
    if (!pypTopicLOs.has(lo.topic)) {
      pypTopicOrder.push(lo.topic);
      pypTopicLOs.set(lo.topic, []);
    }
    pypTopicLOs.get(lo.topic)!.push(lo);
  }

  let pypActivities = 0;
  lines.push("    // ========== PYP Y2 SEED BLOCK (insertPypMajor) ==========");
  lines.push("");

  for (const topic of pypTopicOrder) {
    const majorTitle = PYP_TOPIC_TO_MAJOR[topic];
    if (!majorTitle) {
      console.error(`WARNING: No PYP major title mapping for topic "${topic}"`);
      continue;
    }

    const los = pypTopicLOs.get(topic)!;
    lines.push(`    // ${majorTitle}`);
    lines.push(
      `    await insertPypMajor("${escapeString(majorTitle)}", [`
    );

    for (let i = 0; i < los.length; i++) {
      const lo = los[i];
      // PYP uses learning_objective as the sub-objective title (SWBAT style)
      const subTitle = lo.learning_objective || makeSubTitle(lo);
      const pypDescription = lo.dw_handout || lo.learning_objective || subTitle;

      const activities: string[] = [];

      for (const ka of lo.playlist_links.khan_academy) {
        const kaTitle = ka.display_title || ka.unit_name;
        const kaType = ka.activity_type || "video";
        activities.push(
          `        { title: "${escapeString(kaTitle)}", type: "${kaType}", platform: "Khan Academy", url: "${escapeString(ka.unit_url)}" }`
        );
        pypActivities++;
        totalActivities++;
      }

      for (const ch of lo.playlist_links.brilliant) {
        const brilliantType = ch.activity_type || "exercise";
        for (const lesson of ch.lessons) {
          const lessonTitle = lesson.title || lesson.lesson_slug;
          activities.push(
            `        { title: "${escapeString(ch.course_name)}: ${escapeString(lessonTitle)}", type: "${brilliantType}", platform: "Brilliant", url: "${escapeString(lesson.url)}" }`
          );
          pypActivities++;
          totalActivities++;
        }
      }

      lines.push("      {");
      lines.push(`        title: "${escapeString(subTitle)}",`);
      lines.push(`        description: "${escapeString(pypDescription)}",`);
      lines.push("        activities: [");
      lines.push(activities.join(",\n"));
      lines.push("        ],");
      lines.push(`      }${i < los.length - 1 ? "," : ""}`);
    }

    lines.push("    ]);");
    lines.push("");
  }

  const output = lines.join("\n");
  const outputPath = path.join(ROOT, "scripts", "generated-seed-block.ts");
  fs.writeFileSync(outputPath, output);

  console.log(`Generated seed block written to: ${outputPath}`);
  console.log(
    `MYP Y1: ${majorOrder.length} majors (CCSS domains), ${myp1LOs.length} sub-objectives`
  );
  console.log(`PYP Y2: ${pypTopicOrder.length} topics, ${pypLOs.length} sub-objectives`);
  console.log(`Total activities: ${totalActivities} (MYP: ${totalActivities - pypActivities}, PYP: ${pypActivities})`);
}

main();
