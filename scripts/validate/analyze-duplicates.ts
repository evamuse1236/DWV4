/**
 * Analyze duplicated Brilliant chapters and KA units across playlist_mapping.json
 * and identify which are NOT covered by chapter-assignment-config.json.
 *
 * Usage: node --experimental-strip-types scripts/analyze-duplicates.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Types ----------

interface BrilliantEntry {
  source: string;
  course_name: string;
  course_slug: string;
  chapter_slug: string;
  lessons: { lesson_slug: string; url: string }[];
  match_quality: string;
}

interface KAEntry {
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
    khan_academy: KAEntry[];
    brilliant: BrilliantEntry[];
  };
}

interface PlaylistMapping {
  metadata: Record<string, unknown>;
  learning_objectives: LearningObjective[];
}

interface ConfigSplit {
  type: "split";
  splits: Record<
    string,
    { target_description: string; lessons: string[] }
  >;
  note?: string;
}

interface ConfigAssign {
  type: "assign";
  target_row: number;
  target_description: string;
  note?: string;
}

interface ConfigRemove {
  type: "remove";
  note?: string;
}

type ConfigEntry = ConfigSplit | ConfigAssign | ConfigRemove;

interface ChapterConfig {
  description: string;
  within_topic_assignments?: Record<string, Record<string, ConfigEntry>>;
  within_curriculum_topic_assignments?: Record<
    string,
    Record<string, Record<string, ConfigEntry>>
  >;
  cross_topic_assignments: Record<string, unknown>;
}

// ---------- Load data ----------

const mappingPath = path.resolve(__dirname, "../playlist_mapping.json");
const configPath = path.resolve(__dirname, "chapter-assignment-config.json");

const mapping: PlaylistMapping = JSON.parse(
  fs.readFileSync(mappingPath, "utf-8")
);
const config: ChapterConfig = JSON.parse(
  fs.readFileSync(configPath, "utf-8")
);

// ---------- 1. Extract every Brilliant chapter -> rows it appears in ----------

interface RowInfo {
  row: number;
  topic: string;
  learning_objective: string;
  dw_handout: string;
}

// key = "course_slug/chapter_slug"
const brilliantChapterRows = new Map<string, RowInfo[]>();

for (const lo of mapping.learning_objectives) {
  for (const b of lo.playlist_links.brilliant) {
    const key = `${b.course_slug}/${b.chapter_slug}`;
    if (!brilliantChapterRows.has(key)) {
      brilliantChapterRows.set(key, []);
    }
    brilliantChapterRows.get(key)!.push({
      row: lo.row,
      topic: lo.topic,
      learning_objective: lo.learning_objective,
      dw_handout: lo.dw_handout,
    });
  }
}

// ---------- 2. Filter to chapters appearing in 2+ rows ----------

const duplicatedChapters = new Map<string, RowInfo[]>();
for (const [key, rows] of brilliantChapterRows) {
  // Deduplicate by row number (same chapter listed once per row)
  const uniqueRows = Array.from(
    new Map(rows.map((r) => [r.row, r])).values()
  );
  if (uniqueRows.length >= 2) {
    duplicatedChapters.set(key, uniqueRows);
  }
}

// ---------- 3. Extract configured chapters from config ----------

const configuredChapters = new Set<string>();

const legacyWithinTopic = config.within_topic_assignments || {};
for (const [_topic, chapters] of Object.entries(legacyWithinTopic)) {
  for (const chapterKey of Object.keys(chapters)) configuredChapters.add(chapterKey);
}

const perCurr = config.within_curriculum_topic_assignments || {};
for (const [_curr, topics] of Object.entries(perCurr)) {
  for (const [_topic, chapters] of Object.entries(topics)) {
    for (const chapterKey of Object.keys(chapters)) configuredChapters.add(chapterKey);
  }
}

// ---------- 4. Find duplicated chapters NOT in config ----------

const unconfiguredDuplicates = new Map<string, RowInfo[]>();
const configuredDuplicates = new Map<string, RowInfo[]>();

for (const [key, rows] of duplicatedChapters) {
  if (configuredChapters.has(key)) {
    configuredDuplicates.set(key, rows);
  } else {
    unconfiguredDuplicates.set(key, rows);
  }
}

// ---------- 5. KA unit URL duplicates ----------

interface KARowInfo {
  row: number;
  topic: string;
  learning_objective: string;
  dw_handout: string;
  unit_name: string;
}

const kaUnitRows = new Map<string, KARowInfo[]>();

for (const lo of mapping.learning_objectives) {
  for (const ka of lo.playlist_links.khan_academy) {
    const url = ka.unit_url;
    if (!kaUnitRows.has(url)) {
      kaUnitRows.set(url, []);
    }
    kaUnitRows.get(url)!.push({
      row: lo.row,
      topic: lo.topic,
      learning_objective: lo.learning_objective,
      dw_handout: lo.dw_handout,
      unit_name: ka.unit_name,
    });
  }
}

const duplicatedKAUnits = new Map<string, KARowInfo[]>();
for (const [url, rows] of kaUnitRows) {
  const uniqueRows = Array.from(
    new Map(rows.map((r) => [r.row, r])).values()
  );
  if (uniqueRows.length >= 2) {
    duplicatedKAUnits.set(url, uniqueRows);
  }
}

// ---------- Output report ----------

const divider = "=".repeat(80);
const subDivider = "-".repeat(60);

console.log(divider);
console.log("DUPLICATE ANALYSIS REPORT");
console.log(divider);
console.log();

// Summary
console.log("SUMMARY");
console.log(subDivider);
console.log(
  `Total unique Brilliant chapters in mapping:  ${brilliantChapterRows.size}`
);
console.log(
  `Brilliant chapters appearing in 2+ rows:     ${duplicatedChapters.size}`
);
console.log(
  `  - Covered by config:                       ${configuredDuplicates.size}`
);
console.log(
  `  - NOT covered by config (NEED ATTENTION):   ${unconfiguredDuplicates.size}`
);
console.log(
  `Total unique KA unit URLs in mapping:         ${kaUnitRows.size}`
);
console.log(
  `KA unit URLs appearing in 2+ rows:            ${duplicatedKAUnits.size}`
);
console.log();

// Section A: Unconfigured duplicates
console.log(divider);
console.log("A. BRILLIANT CHAPTERS DUPLICATED BUT NOT IN CONFIG");
console.log("   (These need manual assignment decisions)");
console.log(divider);
console.log();

if (unconfiguredDuplicates.size === 0) {
  console.log("   None! All duplicated chapters are covered by the config.");
} else {
  let idx = 0;
  for (const [key, rows] of [...unconfiguredDuplicates.entries()].sort(
    (a, b) => a[0].localeCompare(b[0])
  )) {
    idx++;
    console.log(`${idx}. ${key}`);
    console.log(`   Appears in ${rows.length} rows:`);
    for (const r of rows.sort((a, b) => a.row - b.row)) {
      console.log(`     Row ${r.row}: [${r.topic}]`);
      console.log(
        `       LO: ${r.learning_objective || "(no LO text)"}`
      );
      console.log(`       Handout: ${r.dw_handout}`);
    }
    console.log();
  }
}

// Section B: Configured duplicates (for reference)
console.log(divider);
console.log("B. BRILLIANT CHAPTERS DUPLICATED AND COVERED BY CONFIG");
console.log("   (Already handled - for reference)");
console.log(divider);
console.log();

let idx2 = 0;
for (const [key, rows] of [...configuredDuplicates.entries()].sort(
  (a, b) => a[0].localeCompare(b[0])
)) {
  idx2++;
  console.log(`${idx2}. ${key}`);
  console.log(`   Appears in rows: ${rows.map((r) => r.row).sort((a, b) => a - b).join(", ")}`);
}
console.log();

// Section C: KA duplicate units
console.log(divider);
console.log("C. KHAN ACADEMY UNIT URLs APPEARING IN 2+ ROWS");
console.log(divider);
console.log();

let idx3 = 0;
for (const [url, rows] of [...duplicatedKAUnits.entries()].sort(
  (a, b) => a[0].localeCompare(b[0])
)) {
  idx3++;
  // Extract short unit name from URL for readability
  const urlParts = url.split("/").filter(Boolean);
  const shortName = urlParts.slice(-1)[0] || url;

  console.log(`${idx3}. ${shortName}`);
  console.log(`   URL: ${url}`);
  console.log(`   Appears in ${rows.length} rows:`);
  for (const r of rows.sort((a, b) => a.row - b.row)) {
    console.log(`     Row ${r.row}: [${r.topic}] ${r.unit_name}`);
    console.log(
      `       LO: ${r.learning_objective || "(no LO text)"}`
    );
    console.log(`       Handout: ${r.dw_handout}`);
  }
  console.log();
}

// Section D: All Brilliant chapters (complete inventory)
console.log(divider);
console.log("D. COMPLETE BRILLIANT CHAPTER INVENTORY");
console.log(divider);
console.log();

let idx4 = 0;
for (const [key, rows] of [...brilliantChapterRows.entries()].sort(
  (a, b) => a[0].localeCompare(b[0])
)) {
  idx4++;
  const uniqueRows = Array.from(
    new Map(rows.map((r) => [r.row, r])).values()
  );
  const isDuplicate = uniqueRows.length >= 2;
  const isConfigured = configuredChapters.has(key);
  const status = isDuplicate
    ? isConfigured
      ? "[DUP-CONFIGURED]"
      : "[DUP-NEEDS-CONFIG]"
    : "[UNIQUE]";
  console.log(
    `${idx4}. ${status} ${key} → rows: ${uniqueRows.map((r) => r.row).sort((a, b) => a - b).join(", ")}`
  );
}
console.log();
console.log(divider);
console.log("END OF REPORT");
console.log(divider);
