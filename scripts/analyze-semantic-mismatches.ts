/**
 * analyze-semantic-mismatches.ts
 *
 * Heuristic report to explain why curriculum mapping "feels wrong":
 * - Reused URLs across multiple objectives (duplication)
 * - Overly-specific objectives (e.g., "3-digit by 2-digit") that force bad matches
 * - Objectives containing key constraints (e.g., "unlike denominators") where
 *   activity titles/URLs don't reflect that constraint (likely coverage mismatch)
 *
 * Usage: node --experimental-strip-types scripts/analyze-semantic-mismatches.ts
 *
 * Output: writes to docs/curriculum/semantic-mismatch-report.md
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

type LearningObjective = {
  curriculum: string;
  row: number;
  topic: string;
  learning_objective?: string;
  dw_handout?: string;
  playlist_links: {
    khan_academy: Array<{
      unit_url: string;
      unit_name: string;
      display_title?: string;
    }>;
    brilliant: Array<{
      course_name: string;
      course_slug: string;
      chapter_slug: string;
      lessons: Array<{ url: string; title?: string; lesson_slug: string }>;
    }>;
  };
};

type PlaylistMapping = {
  metadata: Record<string, unknown>;
  learning_objectives: LearningObjective[];
};

function readMapping(): PlaylistMapping {
  return JSON.parse(
    fs.readFileSync(path.join(ROOT, "playlist_mapping.json"), "utf8")
  ) as PlaylistMapping;
}

function collapseWhitespace(s: string): string {
  return (s || "").replace(/\s+/g, " ").trim();
}

function firstNonEmptyLine(s: string | undefined): string {
  const lines = (s || "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return "";
}

function objectiveLabel(lo: LearningObjective): string {
  const handout = collapseWhitespace(firstNonEmptyLine(lo.dw_handout));
  const swbat = collapseWhitespace(
    firstNonEmptyLine(lo.learning_objective).replace(/^SWBAT\s+/i, "")
  );
  if (handout) return handout;
  if (swbat) return swbat;
  return `Row ${lo.row}`;
}

function allActivityStrings(lo: LearningObjective): string[] {
  const out: string[] = [];
  for (const ka of lo.playlist_links.khan_academy || []) {
    out.push(ka.display_title || ka.unit_name || "");
    out.push(ka.unit_url || "");
  }
  for (const ch of lo.playlist_links.brilliant || []) {
    out.push(ch.course_name || "");
    out.push(`${ch.course_slug}/${ch.chapter_slug}`);
    for (const lesson of ch.lessons || []) {
      out.push(lesson.title || lesson.lesson_slug || "");
      out.push(lesson.url || "");
    }
  }
  return out
    .map((s) => collapseWhitespace(String(s)).toLowerCase())
    .filter(Boolean);
}

function extractConstraintTokens(label: string): string[] {
  const s = label.toLowerCase();
  const tokens: string[] = [];

  const patterns: Array<{ token: string; re: RegExp }> = [
    { token: "unlike denominators", re: /\bunlike denominators?\b/ },
    { token: "different denominators", re: /\bdifferent denominators?\b/ },
    { token: "mixed numbers", re: /\bmixed numbers?\b/ },
    { token: "improper fractions", re: /\bimproper\b/ },
    { token: "equivalent fractions", re: /\bequivalent\b/ },
    { token: "compare fractions", re: /\bcompare\b.*\bfractions?\b/ },
    { token: "unit rate", re: /\bunit rate\b/ },
    { token: "ratio", re: /\bratio(s)?\b/ },
    { token: "percent", re: /\bpercent(age)?\b/ },
    { token: "coordinate plane", re: /\bcoordinate plane\b|\bcoordinate\b/ },
    { token: "distance", re: /\bdistance\b/ },
    { token: "midpoint", re: /\bmidpoint\b/ },
    {
      token: "order of operations",
      re: /\border of operations\b|\bbedmas\b|\bpedmas\b/,
    },
    { token: "exponents", re: /\bexponent(s)?\b/ },
    { token: "area", re: /\barea\b/ },
    { token: "angles", re: /\bangle(s)?\b/ },
    { token: "triangles", re: /\btriangle(s)?\b/ },
  ];

  for (const p of patterns) {
    if (p.re.test(s)) tokens.push(p.token);
  }

  // Overly-specific numeric formats (a leading indicator of forced matches)
  if (/\b\d+\s*-\s*digit\b/.test(s) || /\b\d+\s*digit\b/.test(s)) {
    tokens.push("digit-specific");
  }
  if (/\b\d+\s*digit\b.*\bby\b.*\b\d+\s*digit\b/.test(s)) {
    tokens.push("digit-by-digit");
  }

  return Array.from(new Set(tokens));
}

function markdownEscape(s: string): string {
  return s.replace(/\|/g, "\\|");
}

function writeReport(md: string) {
  const outPath = path.join(ROOT, "docs/curriculum/semantic-mismatch-report.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, "utf8");
}

function main() {
  const mapping = readMapping();
  const rows = mapping.learning_objectives;

  // ===== Duplicate URL inventory (KA + Brilliant lesson URLs) =====
  type Ref = { curriculum: string; row: number; topic: string; label: string };
  const urlToRefs = new Map<string, Ref[]>();

  for (const lo of rows) {
    const label = objectiveLabel(lo);
    for (const ka of lo.playlist_links.khan_academy || []) {
      const url = ka.unit_url;
      if (!urlToRefs.has(url)) urlToRefs.set(url, []);
      urlToRefs.get(url)!.push({
        curriculum: lo.curriculum,
        row: lo.row,
        topic: lo.topic,
        label,
      });
    }
    for (const ch of lo.playlist_links.brilliant || []) {
      for (const lesson of ch.lessons || []) {
        const url = lesson.url;
        if (!urlToRefs.has(url)) urlToRefs.set(url, []);
        urlToRefs.get(url)!.push({
          curriculum: lo.curriculum,
          row: lo.row,
          topic: lo.topic,
          label,
        });
      }
    }
  }

  const duplicatedUrls = Array.from(urlToRefs.entries())
    .filter(([, refs]) => refs.length >= 2)
    .sort((a, b) => b[1].length - a[1].length);

  // ===== Coverage mismatch heuristics =====
  const mismatchCandidates: Array<{
    curriculum: string;
    row: number;
    topic: string;
    label: string;
    constraints: string[];
    note: string;
  }> = [];

  for (const lo of rows) {
    const label = objectiveLabel(lo);
    const constraints = extractConstraintTokens(label);
    if (constraints.length === 0) continue;

    const haystack = allActivityStrings(lo);
    const missing = constraints.filter((t) => {
      if (t === "digit-specific" || t === "digit-by-digit") return true;
      const parts = t.split(/\s+/g).filter(Boolean);
      return !parts.some((p) => haystack.some((h) => h.includes(p)));
    });

    if (missing.length > 0) {
      const note =
        missing.includes("digit-specific") || missing.includes("digit-by-digit")
          ? "Objective granularity likely too specific vs available activities."
          : "Objective includes constraints not reflected in linked activity titles/URLs.";
      mismatchCandidates.push({
        curriculum: lo.curriculum,
        row: lo.row,
        topic: lo.topic,
        label,
        constraints: missing,
        note,
      });
    }
  }

  mismatchCandidates.sort((a, b) => {
    if (a.curriculum !== b.curriculum)
      return a.curriculum.localeCompare(b.curriculum);
    return a.row - b.row;
  });

  // ===== Render Markdown =====
  const lines: string[] = [];
  lines.push("# Semantic mismatch report (heuristics)");
  lines.push("");
  lines.push(
    "This is a *heuristic* report to explain recurring mapping issues (duplicates and forced mismatches). It does not assert correctness; it highlights where the data model and objective granularity commonly drift from real activity coverage."
  );
  lines.push("");
  lines.push("Generated from `playlist_mapping.json`.");
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total rows: ${rows.length}`);
  lines.push(`- Duplicated activity URLs (any platform): ${duplicatedUrls.length}`);
  lines.push(
    `- Rows flagged as likely mismatch-risk: ${mismatchCandidates.length}`
  );
  lines.push("");

  lines.push("## A) Most duplicated activity URLs");
  lines.push("");
  lines.push("| Count | URL | Rows (curriculum/row/topic) |");
  lines.push("| ---: | --- | --- |");

  const topDupes = duplicatedUrls.slice(0, 25);
  for (const [url, refs] of topDupes) {
    const rowRefs = refs
      .map((r) => `${r.curriculum}#${r.row} (${r.topic})`)
      .join(", ");
    lines.push(
      `| ${refs.length} | ${markdownEscape(url)} | ${markdownEscape(rowRefs)} |`
    );
  }
  if (duplicatedUrls.length > topDupes.length) {
    lines.push("");
    lines.push(
      `Only showing top ${topDupes.length}. Full list is available by re-running the script and extending the slice.`
    );
  }
  lines.push("");

  lines.push("## B) Likely mismatch-risk rows");
  lines.push("");
  lines.push(
    "Flagged when an objective is very specific (digits) or includes constraints that aren't visible in linked activity titles/URLs (e.g., 'unlike denominators' but the activity title is generic)."
  );
  lines.push("");
  lines.push("| Curriculum | Row | Topic | Objective label | Missing constraints | Note |");
  lines.push("| --- | ---: | --- | --- | --- | --- |");

  for (const r of mismatchCandidates) {
    lines.push(
      `| ${markdownEscape(r.curriculum)} | ${r.row} | ${markdownEscape(
        r.topic
      )} | ${markdownEscape(r.label)} | ${markdownEscape(
        r.constraints.join(", ")
      )} | ${markdownEscape(r.note)} |`
    );
  }
  lines.push("");

  lines.push("## What this suggests");
  lines.push("");
  lines.push(
    "- **Objective granularity vs activity granularity is mismatched**: many rows are more specific than a unit-level link can prove coverage for."
  );
  lines.push(
    "- **The model stores activities per objective**: reusing a KA unit across multiple objectives is currently the easiest way to get coverage, but it looks like duplication in the UI."
  );
  lines.push(
    "- **Fix requires taxonomy + data-model decisions**: either (a) make objectives broader, (b) link deeper (lesson-level instead of unit-level), or (c) introduce an activity library + coverage tagging so one activity can cover multiple objectives without looking like copy/paste."
  );
  lines.push("");

  writeReport(lines.join("\n"));
  console.log(
    `Wrote docs/curriculum/semantic-mismatch-report.md (${rows.length} rows analyzed)`
  );
}

main();
