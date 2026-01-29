/**
 * dedup-khan-academy.ts
 *
 * Deduplicates Khan Academy unit URLs in playlist_mapping.json so each
 * KA URL appears in exactly one learning objective row (the best fit).
 *
 * Uses heuristic scoring: keyword overlap between the KA unit name and
 * the LO's handout/objective text, plus match_quality preference.
 *
 * Usage: npx tsx scripts/dedup-khan-academy.ts [--dry-run]
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    brilliant: { lessons: unknown[] }[];
  };
}

interface PlaylistMapping {
  metadata: Record<string, unknown>;
  learning_objectives: LearningObjective[];
}

const ROOT = path.resolve(__dirname, "..");
const MAPPING_PATH = path.join(ROOT, "playlist_mapping.json");
const dryRun = process.argv.includes("--dry-run");

/** Extract meaningful keywords from text, lowercased */
function extractKeywords(text: string): Set<string> {
  // Common math terms worth matching
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
      // Filter out noise words
      .filter(
        (w) =>
          ![
            "the",
            "and",
            "for",
            "with",
            "from",
            "swbat",
            "using",
            "that",
            "this",
            "are",
            "can",
            "will",
            "use",
          ].includes(w)
      )
  );
}

/** Score how well a KA unit name matches an LO's text */
function scoreMatch(kaUnitName: string, lo: LearningObjective): number {
  const kaWords = extractKeywords(kaUnitName);
  const loText = `${lo.dw_handout} ${lo.learning_objective} ${lo.topic}`;
  const loWords = extractKeywords(loText);

  // Count overlapping keywords
  let overlap = 0;
  for (const word of kaWords) {
    if (loWords.has(word)) overlap++;
  }

  // Normalize by KA keyword count to get a 0-1 ratio
  const keywordScore = kaWords.size > 0 ? overlap / kaWords.size : 0;

  // Bonus for match_quality
  const kaEntry = lo.playlist_links.khan_academy.find((k) =>
    k.unit_url.includes(kaUnitName.toLowerCase().replace(/\s+/g, "-"))
  );
  let qualityBonus = 0;
  if (kaEntry) {
    if (kaEntry.match_quality === "strong") qualityBonus = 0.3;
    else if (kaEntry.match_quality === "suggested") qualityBonus = 0.1;
  }

  return keywordScore + qualityBonus;
}

function main() {
  const mapping: PlaylistMapping = JSON.parse(
    fs.readFileSync(MAPPING_PATH, "utf-8")
  );

  const report: string[] = [];
  report.push("=== Khan Academy Deduplication Report ===\n");

  // Step 1: Find all KA URLs and which rows they appear in
  const urlToRows = new Map<
    string,
    { lo: LearningObjective; kaEntry: KhanEntry }[]
  >();

  for (const lo of mapping.learning_objectives) {
    for (const ka of lo.playlist_links.khan_academy) {
      const url = ka.unit_url;
      if (!urlToRows.has(url)) {
        urlToRows.set(url, []);
      }
      urlToRows.get(url)!.push({ lo, kaEntry: ka });
    }
  }

  // Step 2: Process only duplicated URLs (appearing in 2+ rows)
  let removedCount = 0;
  let duplicatedUrls = 0;
  const emptyAfter: string[] = [];

  for (const [url, entries] of urlToRows) {
    if (entries.length <= 1) continue;
    duplicatedUrls++;

    const unitName = entries[0].kaEntry.unit_name;
    report.push(`\n## ${unitName} (${entries.length} rows)`);
    report.push(`   URL: ${url}`);

    // Score each row
    const scored = entries.map((entry) => ({
      ...entry,
      score: scoreMatch(unitName, entry.lo),
      totalActivities: totalActivityCount(entry.lo),
    }));

    // Sort: highest score first, then prefer rows with fewer total activities
    // (to avoid leaving a row with 0 activities)
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // If tied, prefer the row where this is the only activity
      if (a.totalActivities !== b.totalActivities)
        return a.totalActivities - b.totalActivities;
      // Final tiebreak: lower row number (more foundational)
      return a.lo.row - b.lo.row;
    });

    const winner = scored[0];
    report.push(
      `   → Keep in ${winner.lo.curriculum} Row ${winner.lo.row} "${winner.lo.topic}" (score: ${winner.score.toFixed(2)})`
    );

    // Remove from all other rows
    for (let i = 1; i < scored.length; i++) {
      const loser = scored[i];
      loser.lo.playlist_links.khan_academy =
        loser.lo.playlist_links.khan_academy.filter(
          (k) => k.unit_url !== url
        );
      report.push(
        `   ✗ Removed from ${loser.lo.curriculum} Row ${loser.lo.row} "${loser.lo.topic}" (score: ${loser.score.toFixed(2)})`
      );
      removedCount++;

      // Track if this row now has 0 activities
      if (totalActivityCount(loser.lo) === 0) {
        emptyAfter.push(
          `${loser.lo.curriculum} Row ${loser.lo.row} "${loser.lo.topic}" - ${loLabel(loser.lo)}`
        );
      }
    }
  }

  // Summary
  report.push("\n=== Summary ===");
  report.push(`Duplicated KA URLs processed: ${duplicatedUrls}`);
  report.push(`Total KA entries removed: ${removedCount}`);
  report.push(`Rows now with 0 activities: ${emptyAfter.length}`);

  if (emptyAfter.length > 0) {
    report.push("\n=== Rows Now Empty (need future content) ===");
    for (const row of emptyAfter) {
      report.push(`  ${row}`);
    }
  }

  const reportText = report.join("\n");
  console.log(reportText);

  const reportPath = path.join(ROOT, "scripts", "ka-dedup-report.txt");
  fs.writeFileSync(reportPath, reportText);
  console.log(`\nReport saved to: ${reportPath}`);

  if (dryRun) {
    console.log("\n[DRY RUN] No changes written to playlist_mapping.json");
  } else {
    fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2) + "\n");
    console.log(`\nUpdated playlist_mapping.json written.`);
  }
}

function totalActivityCount(lo: LearningObjective): number {
  const kaCount = lo.playlist_links.khan_academy.length;
  const brilliantCount = lo.playlist_links.brilliant.reduce(
    (sum, ch) => sum + (ch.lessons as unknown[]).length,
    0
  );
  return kaCount + brilliantCount;
}

function loLabel(lo: LearningObjective): string {
  return lo.learning_objective || lo.dw_handout || `Row ${lo.row}`;
}

main();
