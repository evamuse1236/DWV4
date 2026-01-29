/**
 * fill-empty-rows.ts
 *
 * Fills empty rows in playlist_mapping.json with new Khan Academy URLs
 * from scripts/ka-new-content-config.json.
 *
 * Usage:
 *   node --experimental-strip-types scripts/fill-empty-rows.ts            # Apply changes
 *   node --experimental-strip-types scripts/fill-empty-rows.ts --dry-run  # Preview only
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

// --- Types ---

interface KhanEntry {
  source: string;
  unit_name: string;
  unit_url: string;
  match_quality: string;
  note?: string;
}

interface BrilliantChapter {
  source: string;
  course_name: string;
  course_slug: string;
  chapter_slug: string;
  lessons: { lesson_slug: string; url: string }[];
  match_quality: string;
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

interface KaAssignment {
  curriculum: string;
  row: number;
  topic: string;
  learning_objective_abbrev: string;
  ka_unit_name: string;
  ka_unit_url: string;
  match_quality: string;
  note?: string;
  mode?: "add" | "replace"; // "add" (default) appends; "replace" clears existing KA entries first
}

interface KaConfig {
  description: string;
  created: string;
  assignments: KaAssignment[];
}

// --- Main ---

const dryRun = process.argv.includes("--dry-run");

function main() {
  const mappingPath = path.join(ROOT, "playlist_mapping.json");
  const kaConfigPath = path.join(ROOT, "scripts", "ka-new-content-config.json");
  const coverageFixesPath = path.join(ROOT, "scripts", "ka-coverage-fixes.json");

  const mapping: PlaylistMapping = JSON.parse(
    fs.readFileSync(mappingPath, "utf-8")
  );
  const kaConfig: KaConfig = JSON.parse(
    fs.readFileSync(kaConfigPath, "utf-8")
  );

  // Load coverage fixes if the file exists
  let coverageFixes: KaConfig | null = null;
  if (fs.existsSync(coverageFixesPath)) {
    coverageFixes = JSON.parse(fs.readFileSync(coverageFixesPath, "utf-8"));
  }

  const report: string[] = [];
  report.push("=== Fill Empty Rows Report ===\n");

  // Count before
  const beforeEmpty = countEmpty(mapping);
  report.push(`Before: ${beforeEmpty} empty rows (0 activities)`);

  // Index LOs by (curriculum, row)
  const loIndex = new Map<string, LearningObjective>();
  for (const lo of mapping.learning_objectives) {
    loIndex.set(`${lo.curriculum}|${lo.row}`, lo);
  }

  // Apply KA assignments
  let applied = 0;
  let skipped = 0;
  let alreadyHasContent = 0;

  report.push("\n## Khan Academy Assignments\n");

  for (const assignment of kaConfig.assignments) {
    const key = `${assignment.curriculum}|${assignment.row}`;
    const lo = loIndex.get(key);

    if (!lo) {
      report.push(
        `  ✗ SKIP: ${assignment.curriculum} Row ${assignment.row} — LO not found`
      );
      skipped++;
      continue;
    }

    // Check if row already has this exact KA URL
    const alreadyHasUrl = lo.playlist_links.khan_academy.some(
      (ka) => ka.unit_url === assignment.ka_unit_url
    );
    if (alreadyHasUrl) {
      report.push(
        `  ⊘ SKIP: ${assignment.curriculum} Row ${assignment.row} — already has ${assignment.ka_unit_url}`
      );
      skipped++;
      continue;
    }

    // Check if row already has ANY content (for reporting, but still add)
    const hasExisting =
      lo.playlist_links.khan_academy.length > 0 ||
      lo.playlist_links.brilliant.some((ch) => ch.lessons.length > 0);
    if (hasExisting) {
      alreadyHasContent++;
    }

    // Add the new KA entry
    const newEntry: KhanEntry = {
      source: "Khan Academy",
      unit_name: assignment.ka_unit_name,
      unit_url: assignment.ka_unit_url,
      match_quality: assignment.match_quality,
    };
    if (assignment.note) {
      newEntry.note = assignment.note;
    }

    lo.playlist_links.khan_academy.push(newEntry);
    applied++;

    const statusIcon = hasExisting ? "+" : "✓";
    report.push(
      `  ${statusIcon} ${assignment.curriculum} Row ${assignment.row} [${assignment.topic}]: ${assignment.ka_unit_name}`
    );
  }

  // Apply coverage fixes (from ka-coverage-fixes.json)
  if (coverageFixes) {
    report.push("\n## Coverage Fixes (ka-coverage-fixes.json)\n");

    for (const assignment of coverageFixes.assignments) {
      const key = `${assignment.curriculum}|${assignment.row}`;
      const lo = loIndex.get(key);

      if (!lo) {
        report.push(
          `  ✗ SKIP: ${assignment.curriculum} Row ${assignment.row} — LO not found`
        );
        skipped++;
        continue;
      }

      // Check if row already has this exact KA URL
      const alreadyHasUrl = lo.playlist_links.khan_academy.some(
        (ka) => ka.unit_url === assignment.ka_unit_url
      );
      if (alreadyHasUrl) {
        report.push(
          `  ⊘ SKIP: ${assignment.curriculum} Row ${assignment.row} — already has ${assignment.ka_unit_url}`
        );
        skipped++;
        continue;
      }

      // If mode is "replace", clear existing KA entries first
      if (assignment.mode === "replace") {
        const removed = lo.playlist_links.khan_academy.length;
        lo.playlist_links.khan_academy = [];
        report.push(
          `  ⟳ REPLACE: ${assignment.curriculum} Row ${assignment.row} — cleared ${removed} existing KA entries`
        );
      }

      // Add the new KA entry
      const newEntry: KhanEntry = {
        source: "Khan Academy",
        unit_name: assignment.ka_unit_name,
        unit_url: assignment.ka_unit_url,
        match_quality: assignment.match_quality,
      };
      if (assignment.note) {
        newEntry.note = assignment.note;
      }

      lo.playlist_links.khan_academy.push(newEntry);
      applied++;

      const modeIcon = assignment.mode === "replace" ? "⟳" : "+";
      report.push(
        `  ${modeIcon} ${assignment.curriculum} Row ${assignment.row} [${assignment.topic}]: ${assignment.ka_unit_name}`
      );
    }
  }

  // Count after
  const afterEmpty = countEmpty(mapping);

  report.push("\n=== Statistics ===");
  report.push(`KA assignments applied: ${applied}`);
  report.push(`KA assignments skipped: ${skipped}`);
  report.push(`Rows that already had content (enriched): ${alreadyHasContent}`);
  report.push(`Empty rows before: ${beforeEmpty}`);
  report.push(`Empty rows after: ${afterEmpty}`);
  report.push(`Rows filled: ${beforeEmpty - afterEmpty}`);

  // Validate: check for URL duplicates within same curriculum+row
  report.push("\n=== Duplicate URL Check ===");
  let dupeCount = 0;
  for (const lo of mapping.learning_objectives) {
    const urls = lo.playlist_links.khan_academy.map((ka) => ka.unit_url);
    const seen = new Set<string>();
    for (const url of urls) {
      if (seen.has(url)) {
        report.push(
          `  DUPLICATE: ${lo.curriculum} Row ${lo.row} has "${url}" twice`
        );
        dupeCount++;
      }
      seen.add(url);
    }
  }
  if (dupeCount === 0) {
    report.push("  No duplicate URLs within any row.");
  }

  // List remaining empty rows
  const remainingEmpty: string[] = [];
  for (const lo of mapping.learning_objectives) {
    const kaCount = lo.playlist_links.khan_academy.length;
    const brilliantCount = lo.playlist_links.brilliant.reduce(
      (sum, ch) => sum + ch.lessons.length,
      0
    );
    if (kaCount === 0 && brilliantCount === 0) {
      remainingEmpty.push(
        `  ${lo.curriculum} Row ${lo.row} [${lo.topic}]: ${(lo.learning_objective || lo.dw_handout || "(no text)").substring(0, 60)}`
      );
    }
  }

  if (remainingEmpty.length > 0) {
    report.push(`\n=== Remaining Empty Rows (${remainingEmpty.length}) ===`);
    for (const line of remainingEmpty) {
      report.push(line);
    }
  } else {
    report.push("\nAll rows now have at least 1 activity!");
  }

  // Output report
  const reportText = report.join("\n");
  console.log(reportText);

  const reportPath = path.join(ROOT, "scripts", "fill-empty-report.txt");
  fs.writeFileSync(reportPath, reportText);
  console.log(`\nReport saved to: ${reportPath}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No changes written to playlist_mapping.json");
  } else {
    // Update metadata
    const emptyCount = countEmpty(mapping);
    mapping.metadata.los_with_links = mapping.learning_objectives.length - emptyCount;
    mapping.metadata.los_without_links = emptyCount;
    mapping.metadata.coverage_percent = parseFloat(
      (((mapping.learning_objectives.length - emptyCount) / mapping.learning_objectives.length) * 100).toFixed(1)
    );

    fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2) + "\n");
    console.log(`\nUpdated playlist_mapping.json written.`);
  }
}

function countEmpty(mapping: PlaylistMapping): number {
  let count = 0;
  for (const lo of mapping.learning_objectives) {
    const kaCount = lo.playlist_links.khan_academy.length;
    const brilliantCount = lo.playlist_links.brilliant.reduce(
      (sum, ch) => sum + ch.lessons.length,
      0
    );
    if (kaCount === 0 && brilliantCount === 0) {
      count++;
    }
  }
  return count;
}

main();
