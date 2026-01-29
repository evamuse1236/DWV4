/**
 * generate-seed-data.ts
 *
 * Reads the updated playlist_mapping.json and generates the TypeScript
 * code blocks for seed.ts — both MYP Y1 (insertMajorWithSubsAndActivities)
 * and PYP Y2 (insertPypMajor) calls.
 *
 * Usage: npx tsx scripts/generate-seed-data.ts
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

// Map from playlist_mapping topic names to seed.ts major objective titles
const TOPIC_TO_MAJOR: Record<string, string> = {
  "Fractions Foundation": "Fractions Foundation",
  "Arithmetic MYP 1": "Arithmetic MYP 1",
  "Factors and Multiples": "Factors and Multiples",
  Fractions: "Fractions",
  Decimals: "Decimals",
  Geometry: "Geometry",
  "Measurement and Areas": "Measurement and Areas",
  "Algebra foundations": "Algebra Foundations",
  Algebra: "Algebra",
  Rates: "Rates",
  Percentage: "Percentage",
  Data: "Data",
};

// Short sub-objective titles (derived from existing seed.ts patterns)
function makeSubTitle(lo: LearningObjective): string {
  if (lo.dw_handout) {
    // Use the part after the colon if it follows "Topic: subtitle" pattern
    const colonIdx = lo.dw_handout.indexOf(":");
    if (colonIdx > 0) {
      return lo.dw_handout.substring(colonIdx + 1).trim();
    }
    return lo.dw_handout;
  }
  // For learning_objective, take the first sentence/line, truncate if needed
  const first = lo.learning_objective.split("\n")[0];
  // Remove SWBAT prefix
  const cleaned = first.replace(/^SWBAT\s+/i, "").trim();
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

  // Group by topic, preserving order
  const topicOrder: string[] = [];
  const topicLOs = new Map<string, LearningObjective[]>();
  for (const lo of myp1LOs) {
    if (!topicLOs.has(lo.topic)) {
      topicOrder.push(lo.topic);
      topicLOs.set(lo.topic, []);
    }
    topicLOs.get(lo.topic)!.push(lo);
  }

  const lines: string[] = [];
  let totalActivities = 0;

  for (const topic of topicOrder) {
    const majorTitle = TOPIC_TO_MAJOR[topic];
    if (!majorTitle) {
      console.error(`WARNING: No major title mapping for topic "${topic}"`);
      continue;
    }

    const los = topicLOs.get(topic)!;
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
        activities.push(
          `        { title: "${escapeString(ka.unit_name)}", type: "video", platform: "Khan Academy", url: "${escapeString(ka.unit_url)}" }`
        );
        totalActivities++;
      }

      // Brilliant activities
      for (const ch of lo.playlist_links.brilliant) {
        for (const lesson of ch.lessons) {
          activities.push(
            `        { title: "${escapeString(ch.course_name)}: ${escapeString(lesson.lesson_slug)}", type: "exercise", platform: "Brilliant", url: "${escapeString(lesson.url)}" }`
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
        activities.push(
          `        { title: "${escapeString(ka.unit_name)}", type: "video", platform: "Khan Academy", url: "${escapeString(ka.unit_url)}" }`
        );
        pypActivities++;
        totalActivities++;
      }

      for (const ch of lo.playlist_links.brilliant) {
        for (const lesson of ch.lessons) {
          activities.push(
            `        { title: "${escapeString(ch.course_name)}: ${escapeString(lesson.lesson_slug)}", type: "exercise", platform: "Brilliant", url: "${escapeString(lesson.url)}" }`
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
  console.log(`MYP Y1: ${topicOrder.length} topics, ${myp1LOs.length} sub-objectives`);
  console.log(`PYP Y2: ${pypTopicOrder.length} topics, ${pypLOs.length} sub-objectives`);
  console.log(`Total activities: ${totalActivities} (MYP: ${totalActivities - pypActivities}, PYP: ${pypActivities})`);
}

main();
