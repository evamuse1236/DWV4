/**
 * validate-playlist-mapping.ts
 *
 * Validates `playlist_mapping.json` against the curriculum mapping quality contract.
 * Intended to be run locally as a guardrail before regenerating seed data.
 *
 * Usage:
 *   node --experimental-strip-types scripts/validate-playlist-mapping.ts
 *
 * Output:
 *   - Writes a markdown report to `docs/curriculum/validation.md`
 *   - Exits non-zero on contract violations (missing activities, too many activities, etc.)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const CONTRACT = {
  minActivitiesSimple: 1,
  minActivitiesComplex: 2,
  maxActivitiesTotal: 8,
  maxKaPerLo: 3,
  maxBrilliantPerLo: 6,
  lowAlignmentThreshold: 0.04,
} as const;

type Curriculum = "MYP Y1" | "PYP Y2" | (string & {});

interface KAEntry {
  unit_url: string;
  unit_name: string;
  display_title?: string;
}

interface BrilliantLesson {
  url: string;
  lesson_slug: string;
  title?: string;
}

interface BrilliantChapter {
  course_name: string;
  course_slug: string;
  chapter_slug: string;
  lessons: BrilliantLesson[];
}

interface LearningObjective {
  curriculum: Curriculum;
  row: number;
  topic: string;
  learning_objective: string;
  dw_handout: string;
  playlist_links: {
    khan_academy: KAEntry[];
    brilliant: BrilliantChapter[];
  };
}

interface PlaylistMapping {
  metadata?: Record<string, unknown>;
  learning_objectives: LearningObjective[];
}

function norm(s: string): string {
  return (s || "").toLowerCase();
}

function tokenize(s: string): Set<string> {
  const out = new Set<string>();
  const parts = norm(s).split(/[^a-z0-9]+/g);
  for (const p of parts) {
    if (!p) continue;
    if (p.length <= 2) continue;
    if (["swbat", "with", "using", "and", "the", "for", "into", "from"].includes(p))
      continue;
    out.add(p);
  }
  return out;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function loText(lo: LearningObjective): string {
  return `${lo.dw_handout || ""}\n${lo.learning_objective || ""}`.trim();
}

function isComplex(lo: LearningObjective): boolean {
  const t = norm(loText(lo));
  const hasAdd = /\badd(?:ition|ing)?\b/.test(t);
  const hasSub = /\bsub(?:tract|traction|tracting)?\b/.test(t);
  const hasMul = /\bmult(?:iply|iplication|iplying)?\b/.test(t);
  const hasDiv = /\bdiv(?:ide|ision|iding)?\b/.test(t);

  // Treat add/sub as one cluster and multiply/divide as another cluster.
  const clusterHits = (hasAdd || hasSub ? 1 : 0) + (hasMul || hasDiv ? 1 : 0);
  if (clusterHits >= 2) return true;

  if (/\bword problems?\b/.test(t) && /\b(add|subtract|multiply|divide)\b/.test(t))
    return true;
  return false;
}

function main() {
  const mappingPath = path.join(ROOT, "playlist_mapping.json");
  const outPath = path.join(ROOT, "docs", "curriculum", "validation.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const mapping: PlaylistMapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
  const los = mapping.learning_objectives || [];

  const urlUsesAll = new Map<string, Set<string>>();
  const kaUrlUsesByCurr = new Map<string, Map<string, Set<string>>>();
  const brilliantUrlUses = new Map<string, Set<string>>();

  const violations: string[] = [];
  const lowAlign: Array<{ curr: string; row: number; topic: string; score: number }> = [];
  const outliers: Array<{ curr: string; row: number; topic: string; ka: number; br: number; total: number }> = [];

  let only1 = 0;
  let totalActivities = 0;

  for (const lo of los) {
    const id = `${lo.curriculum}:${lo.row}`;

    const ka = lo.playlist_links?.khan_academy || [];
    const brCh = lo.playlist_links?.brilliant || [];

    let br = 0;
    for (const ch of brCh) br += (ch.lessons || []).length;
    const total = ka.length + br;
    totalActivities += total;
    if (total === 1) only1++;

    const complex = isComplex(lo);
    const min = complex ? CONTRACT.minActivitiesComplex : CONTRACT.minActivitiesSimple;
    if (total < min) {
      violations.push(
        `${id} (${lo.topic}) has ${total} activities but requires >= ${min} (${complex ? "complex" : "simple"})`
      );
    }

    if (total > CONTRACT.maxActivitiesTotal || ka.length > CONTRACT.maxKaPerLo || br > CONTRACT.maxBrilliantPerLo) {
      outliers.push({ curr: lo.curriculum, row: lo.row, topic: lo.topic, ka: ka.length, br, total });
    }

    // Duplicates within LO
    const seen = new Set<string>();
    for (const entry of ka) {
      const url = entry.unit_url;
      if (!url) continue;
      if (seen.has(url)) {
        violations.push(`${id} (${lo.topic}) has duplicate KA URL within LO: ${url}`);
      }
      seen.add(url);
    }
    for (const ch of brCh) {
      for (const lesson of ch.lessons || []) {
        const url = lesson.url;
        if (!url) continue;
        if (seen.has(url)) {
          violations.push(`${id} (${lo.topic}) has duplicate URL within LO: ${url}`);
        }
        seen.add(url);
      }
    }

    // Alignment heuristic
    const loTokens = tokenize(loText(lo));
    const activityScores: number[] = [];
    for (const entry of ka) {
      const label = entry.display_title || entry.unit_name || entry.unit_url || "";
      activityScores.push(jaccard(loTokens, tokenize(label)));
    }
    for (const ch of brCh) {
      for (const lesson of ch.lessons || []) {
        const labelParts = [
          ch.course_name,
          ch.course_slug,
          ch.chapter_slug,
          lesson.title || "",
          lesson.lesson_slug,
        ].filter(Boolean);
        activityScores.push(jaccard(loTokens, tokenize(labelParts.join(" "))));
      }
    }
    activityScores.sort((a, b) => b - a);
    const top = activityScores.slice(0, 3);
    const avgTop = top.length ? top.reduce((a, b) => a + b, 0) / top.length : 0;
    if (avgTop > 0 && avgTop < CONTRACT.lowAlignmentThreshold) {
      lowAlign.push({ curr: lo.curriculum, row: lo.row, topic: lo.topic, score: avgTop });
    }

    // URL reuse maps
    for (const entry of ka) {
      const url = entry.unit_url;
      if (!url) continue;
      const usesAll = urlUsesAll.get(url) || new Set<string>();
      usesAll.add(id);
      urlUsesAll.set(url, usesAll);

      const byCurr = kaUrlUsesByCurr.get(lo.curriculum) || new Map<string, Set<string>>();
      const uses = byCurr.get(url) || new Set<string>();
      uses.add(id);
      byCurr.set(url, uses);
      kaUrlUsesByCurr.set(lo.curriculum, byCurr);
    }
    for (const ch of brCh) {
      for (const lesson of ch.lessons || []) {
        const url = lesson.url;
        if (!url) continue;
        const uses = brilliantUrlUses.get(url) || new Set<string>();
        uses.add(id);
        brilliantUrlUses.set(url, uses);

        const usesAll = urlUsesAll.get(url) || new Set<string>();
        usesAll.add(id);
        urlUsesAll.set(url, usesAll);
      }
    }
  }

  const duplicatedKaByCurr: Array<{ curriculum: string; url: string; count: number }> = [];
  for (const [curr, map] of kaUrlUsesByCurr.entries()) {
    for (const [url, uses] of map.entries()) {
      if (uses.size >= 2) duplicatedKaByCurr.push({ curriculum: curr, url, count: uses.size });
    }
  }
  duplicatedKaByCurr.sort((a, b) => b.count - a.count || a.url.localeCompare(b.url));

  const duplicatedBrilliant: Array<{ url: string; count: number }> = [];
  for (const [url, uses] of brilliantUrlUses.entries()) {
    if (uses.size >= 2) duplicatedBrilliant.push({ url, count: uses.size });
  }
  duplicatedBrilliant.sort((a, b) => b.count - a.count || a.url.localeCompare(b.url));

  outliers.sort((a, b) => b.total - a.total || a.curr.localeCompare(b.curr) || a.row - b.row);
  lowAlign.sort((a, b) => a.score - b.score);

  // Report
  const lines: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  lines.push("# Curriculum Mapping Validation");
  lines.push("");
  lines.push(`Generated: ${today}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- LOs: ${los.length}`);
  lines.push(`- Total activities: ${totalActivities}`);
  lines.push(`- LOs with exactly 1 activity: ${only1}`);
  lines.push(`- Contract max per LO: ${CONTRACT.maxActivitiesTotal} (KA ≤ ${CONTRACT.maxKaPerLo}, Brilliant ≤ ${CONTRACT.maxBrilliantPerLo})`);
  lines.push(`- Contract alignment threshold (avg top-3): ${CONTRACT.lowAlignmentThreshold}`);
  lines.push("");

  lines.push("## Violations");
  lines.push("");
  if (!violations.length) {
    lines.push("- None");
  } else {
    for (const v of violations.slice(0, 200)) lines.push(`- ${v}`);
    if (violations.length > 200) lines.push(`- … (${violations.length - 200} more)`);
  }
  lines.push("");

  lines.push("## Outliers (too many activities)");
  lines.push("");
  if (!outliers.length) {
    lines.push("- None");
  } else {
    for (const o of outliers.slice(0, 50)) {
      lines.push(`- ${o.curr} Row ${o.row} (${o.topic}): total ${o.total} (KA ${o.ka}, Brilliant ${o.br})`);
    }
    if (outliers.length > 50) lines.push(`- … (${outliers.length - 50} more)`);
  }
  lines.push("");

  lines.push("## Low Alignment Candidates");
  lines.push("");
  if (!lowAlign.length) {
    lines.push("- None");
  } else {
    for (const x of lowAlign.slice(0, 50)) {
      lines.push(`- ${x.curr} Row ${x.row} (${x.topic}): avg top-3 = ${x.score.toFixed(3)}`);
    }
    if (lowAlign.length > 50) lines.push(`- … (${lowAlign.length - 50} more)`);
  }
  lines.push("");

  lines.push("## Duplicate URLs (KA, by curriculum)");
  lines.push("");
  if (!duplicatedKaByCurr.length) {
    lines.push("- None");
  } else {
    for (const d of duplicatedKaByCurr.slice(0, 50)) {
      lines.push(`- ${d.curriculum}: ${d.count}× ${d.url}`);
    }
    if (duplicatedKaByCurr.length > 50) lines.push(`- … (${duplicatedKaByCurr.length - 50} more)`);
  }
  lines.push("");

  lines.push("## Duplicate URLs (Brilliant lessons)");
  lines.push("");
  if (!duplicatedBrilliant.length) {
    lines.push("- None");
  } else {
    for (const d of duplicatedBrilliant.slice(0, 50)) {
      lines.push(`- ${d.count}× ${d.url}`);
    }
    if (duplicatedBrilliant.length > 50) lines.push(`- … (${duplicatedBrilliant.length - 50} more)`);
  }
  lines.push("");

  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`Wrote validation: ${path.relative(ROOT, outPath)}`);

  // Exit code: violations + outliers are considered failures.
  const hasFailures = violations.length > 0 || outliers.length > 0;
  if (hasFailures) {
    console.error(
      `Validation failed: ${violations.length} violation(s), ${outliers.length} outlier(s).`
    );
    process.exit(1);
  }
}

main();
