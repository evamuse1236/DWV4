/**
 * repair-playlist-mapping.ts
 *
 * Deterministic cleanup pass over `playlist_mapping.json` to improve:
 * - Seeded objective usability (prevents 30–40 activity dumps)
 * - Cross-objective duplication (soft-dedup where safe)
 * - Text hygiene (removes accidental leading whitespace/newlines)
 *
 * This script does not browse the web. It only rebalances and trims what's already present.
 *
 * Usage:
 *   node --experimental-strip-types scripts/repair-playlist-mapping.ts
 *
 * Output:
 *   - Updates `playlist_mapping.json`
 *   - Writes `docs/curriculum/repair-report.md`
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const LIMITS = {
  minActivitiesSimple: 1,
  minActivitiesComplex: 2,
  maxActivitiesTotal: 8,
  maxKaPerLo: 3,
  maxBrilliantPerLo: 6,
} as const;

type Curriculum = "MYP Y1" | "PYP Y2" | (string & {});

interface KAEntry {
  source?: string;
  unit_name: string;
  unit_url: string;
  match_quality?: string;
  note?: string;
  display_title?: string;
  activity_type?: string;
}

interface BrilliantLesson {
  lesson_slug: string;
  url: string;
  title?: string;
}

interface BrilliantChapter {
  source?: string;
  course_name: string;
  course_slug: string;
  chapter_slug: string;
  lessons: BrilliantLesson[];
  match_quality?: string;
  activity_type?: string;
}

interface LearningObjective {
  curriculum: Curriculum;
  row: number;
  subject: string;
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
    if (
      [
        "swbat",
        "with",
        "using",
        "and",
        "the",
        "for",
        "into",
        "from",
        "using",
        "understand",
      ].includes(p)
    )
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

function normalizeMultilineText(input: string): string {
  const s = (input || "").replace(/\r\n/g, "\n");
  const lines = s.split("\n");
  // Drop leading empty lines/whitespace-only lines.
  while (lines.length > 0 && !lines[0].trim()) lines.shift();
  // Drop trailing empty lines/whitespace-only lines.
  while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();
  return lines.join("\n");
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
  const clusterHits = (hasAdd || hasSub ? 1 : 0) + (hasMul || hasDiv ? 1 : 0);
  if (clusterHits >= 2) return true;
  if (/\bword problems?\b/.test(t) && /\b(add|subtract|multiply|divide)\b/.test(t))
    return true;
  return false;
}

function stats(mapping: PlaylistMapping) {
  const los = mapping.learning_objectives || [];
  let total = 0;
  let ka = 0;
  let br = 0;
  let over8 = 0;
  for (const lo of los) {
    const kaCount = lo.playlist_links?.khan_academy?.length || 0;
    let brCount = 0;
    for (const ch of lo.playlist_links?.brilliant || []) brCount += ch.lessons.length;
    const t = kaCount + brCount;
    total += t;
    ka += kaCount;
    br += brCount;
    if (t > LIMITS.maxActivitiesTotal) over8++;
  }
  return { los: los.length, total, ka, br, over8 };
}

type KaCandidate = { kind: "KA"; url: string; score: number; entry: KAEntry };
type BrilliantCandidate = {
  kind: "Brilliant";
  url: string;
  score: number;
  chapterKey: string;
  chapter: BrilliantChapter;
  lesson: BrilliantLesson;
};

function scoreKa(loTokens: Set<string>, ka: KAEntry): number {
  const label = `${ka.display_title || ""} ${ka.unit_name || ""} ${ka.unit_url || ""}`;
  return jaccard(loTokens, tokenize(label));
}

function scoreBrilliant(
  loTokens: Set<string>,
  chapter: BrilliantChapter,
  lesson: BrilliantLesson
): number {
  const label = [
    chapter.course_name,
    chapter.course_slug,
    chapter.chapter_slug,
    lesson.title || "",
    lesson.lesson_slug,
  ]
    .filter(Boolean)
    .join(" ");
  return jaccard(loTokens, tokenize(label));
}

function removeBrilliantLessonByUrl(lo: LearningObjective, url: string): boolean {
  let changed = false;
  lo.playlist_links.brilliant = (lo.playlist_links.brilliant || [])
    .map((ch) => {
      const before = ch.lessons.length;
      ch.lessons = ch.lessons.filter((l) => l.url !== url);
      if (ch.lessons.length !== before) changed = true;
      return ch;
    })
    .filter((ch) => ch.lessons.length > 0);
  return changed;
}

function countActivities(lo: LearningObjective): { total: number; ka: number; br: number } {
  const ka = lo.playlist_links.khan_academy.length;
  let br = 0;
  for (const ch of lo.playlist_links.brilliant) br += ch.lessons.length;
  return { total: ka + br, ka, br };
}

function main() {
  const mappingPath = path.join(ROOT, "playlist_mapping.json");
  const reportPath = path.join(ROOT, "docs", "curriculum", "repair-report.md");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });

  const mapping: PlaylistMapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
  const before = stats(mapping);

  // ---------- 1) Text hygiene ----------
  for (const lo of mapping.learning_objectives) {
    lo.learning_objective = normalizeMultilineText(lo.learning_objective || "");
    lo.dw_handout = normalizeMultilineText(lo.dw_handout || "");
  }

  // ---------- 2) Per-LO trimming ----------
  const keptScores = new Map<string, Map<string, number>>(); // loId -> url -> score
  const removedDueToTrim: Array<{ loId: string; url: string; kind: string; score: number }> = [];

  for (const lo of mapping.learning_objectives) {
    const loId = `${lo.curriculum}:${lo.row}`;
    const loTokens = tokenize(loText(lo));
    const complex = isComplex(lo);
    const minNeeded = complex ? LIMITS.minActivitiesComplex : LIMITS.minActivitiesSimple;

    // Score candidates
    const kaCandidates: KaCandidate[] = (lo.playlist_links.khan_academy || [])
      .filter((k) => Boolean(k.unit_url))
      .map((k) => ({ kind: "KA", url: k.unit_url, score: scoreKa(loTokens, k), entry: k }))
      .sort((a, b) => b.score - a.score);

    const brilliantCandidates: BrilliantCandidate[] = [];
    for (const ch of lo.playlist_links.brilliant || []) {
      const chapterKey = `${ch.course_slug}/${ch.chapter_slug}`;
      for (const lesson of ch.lessons || []) {
        if (!lesson.url) continue;
        brilliantCandidates.push({
          kind: "Brilliant",
          url: lesson.url,
          score: scoreBrilliant(loTokens, ch, lesson),
          chapterKey,
          chapter: ch,
          lesson,
        });
      }
    }
    brilliantCandidates.sort((a, b) => b.score - a.score);

    // Select initial keep sets by quotas
    const keepKa = new Set<string>(kaCandidates.slice(0, LIMITS.maxKaPerLo).map((c) => c.url));
    const keepBrilliant = new Set<string>(
      brilliantCandidates.slice(0, LIMITS.maxBrilliantPerLo).map((c) => c.url)
    );

    // Apply KA selection
    const beforeKa = lo.playlist_links.khan_academy.length;
    lo.playlist_links.khan_academy = lo.playlist_links.khan_academy.filter((k) =>
      keepKa.has(k.unit_url)
    );
    if (lo.playlist_links.khan_academy.length !== beforeKa) {
      for (const c of kaCandidates) {
        if (!keepKa.has(c.url)) {
          removedDueToTrim.push({ loId, url: c.url, kind: "KA", score: c.score });
        }
      }
    }

    // Apply Brilliant lesson selection
    const beforeBrCount = (lo.playlist_links.brilliant || []).reduce((n, ch) => n + ch.lessons.length, 0);
    lo.playlist_links.brilliant = (lo.playlist_links.brilliant || [])
      .map((ch) => {
        ch.lessons = (ch.lessons || []).filter((l) => keepBrilliant.has(l.url));
        return ch;
      })
      .filter((ch) => ch.lessons.length > 0);
    const afterBrCount = (lo.playlist_links.brilliant || []).reduce((n, ch) => n + ch.lessons.length, 0);
    if (afterBrCount !== beforeBrCount) {
      for (const c of brilliantCandidates) {
        if (!keepBrilliant.has(c.url)) {
          removedDueToTrim.push({ loId, url: c.url, kind: "Brilliant", score: c.score });
        }
      }
    }

    // Enforce total max (drop lowest scored across kept)
    const kept: Array<{ url: string; score: number; kind: "KA" | "Brilliant" }> = [];
    for (const k of lo.playlist_links.khan_academy) {
      kept.push({ url: k.unit_url, score: scoreKa(loTokens, k), kind: "KA" });
    }
    for (const ch of lo.playlist_links.brilliant) {
      for (const lesson of ch.lessons) {
        kept.push({
          url: lesson.url,
          score: scoreBrilliant(loTokens, ch, lesson),
          kind: "Brilliant",
        });
      }
    }
    kept.sort((a, b) => b.score - a.score);
    while (kept.length > LIMITS.maxActivitiesTotal) {
      const drop = kept.pop();
      if (!drop) break;
      if (drop.kind === "KA") {
        lo.playlist_links.khan_academy = lo.playlist_links.khan_academy.filter(
          (k) => k.unit_url !== drop.url
        );
      } else {
        removeBrilliantLessonByUrl(lo, drop.url);
      }
      removedDueToTrim.push({ loId, url: drop.url, kind: drop.kind, score: drop.score });
    }

    // Ensure min coverage by re-adding best remaining candidates from this LO (if any)
    const counts = countActivities(lo);
    if (counts.total < minNeeded) {
      const existingUrls = new Set<string>();
      for (const k of lo.playlist_links.khan_academy) existingUrls.add(k.unit_url);
      for (const ch of lo.playlist_links.brilliant) for (const l of ch.lessons) existingUrls.add(l.url);

      const backlog: Array<{ kind: "KA" | "Brilliant"; url: string; score: number; entry?: any }> = [];
      for (const c of kaCandidates) {
        if (!existingUrls.has(c.url)) backlog.push({ kind: "KA", url: c.url, score: c.score, entry: c.entry });
      }
      for (const c of brilliantCandidates) {
        if (!existingUrls.has(c.url)) backlog.push({ kind: "Brilliant", url: c.url, score: c.score });
      }
      backlog.sort((a, b) => b.score - a.score);

      while (countActivities(lo).total < minNeeded && backlog.length) {
        const next = backlog.shift()!;
        if (next.kind === "KA") {
          lo.playlist_links.khan_academy.push(next.entry as KAEntry);
        } else {
          // Re-add: find the chapter/lesson in the original candidates
          const cand = brilliantCandidates.find((c) => c.url === next.url);
          if (cand) {
            let ch = lo.playlist_links.brilliant.find(
              (x) => x.course_slug === cand.chapter.course_slug && x.chapter_slug === cand.chapter.chapter_slug
            );
            if (!ch) {
              ch = {
                source: cand.chapter.source,
                course_name: cand.chapter.course_name,
                course_slug: cand.chapter.course_slug,
                chapter_slug: cand.chapter.chapter_slug,
                lessons: [],
                match_quality: cand.chapter.match_quality,
                activity_type: cand.chapter.activity_type,
              };
              lo.playlist_links.brilliant.push(ch);
            }
            ch.lessons.push(cand.lesson);
          }
        }
      }
    }

    // Record scores for dedupe decisions
    const map = new Map<string, number>();
    for (const k of lo.playlist_links.khan_academy) map.set(k.unit_url, scoreKa(loTokens, k));
    for (const ch of lo.playlist_links.brilliant)
      for (const l of ch.lessons) map.set(l.url, scoreBrilliant(loTokens, ch, l));
    keptScores.set(loId, map);
  }

  // ---------- 3) Soft dedupe across LOs ----------
  const removedDueToDedupe: Array<{ keptIn: string; removedFrom: string; url: string; kind: string }> = [];
  const duplicatesKept: Array<{ url: string; kind: string; keptIn: string[]; reason: string }> = [];

  const minRequiredFor = (lo: LearningObjective) =>
    isComplex(lo) ? LIMITS.minActivitiesComplex : LIMITS.minActivitiesSimple;

  // KA dedupe per curriculum
  const byCurrKa = new Map<string, Map<string, string[]>>(); // curr -> url -> loIds
  for (const lo of mapping.learning_objectives) {
    const loId = `${lo.curriculum}:${lo.row}`;
    const m = byCurrKa.get(lo.curriculum) || new Map<string, string[]>();
    for (const ka of lo.playlist_links.khan_academy) {
      const list = m.get(ka.unit_url) || [];
      list.push(loId);
      m.set(ka.unit_url, list);
    }
    byCurrKa.set(lo.curriculum, m);
  }

  for (const [curr, urlMap] of byCurrKa.entries()) {
    for (const [url, loIds] of urlMap.entries()) {
      const unique = Array.from(new Set(loIds));
      if (unique.length < 2) continue;
      unique.sort((a, b) => (keptScores.get(b)?.get(url) || 0) - (keptScores.get(a)?.get(url) || 0));
      const keep = unique[0];
      const keptIn: string[] = [keep];

      for (const loId of unique.slice(1)) {
        const lo = mapping.learning_objectives.find(
          (x) => `${x.curriculum}:${x.row}` === loId
        );
        if (!lo) continue;
        const countsBefore = countActivities(lo);
        const min = minRequiredFor(lo);
        if (countsBefore.total - 1 < min) {
          keptIn.push(loId);
          continue;
        }
        lo.playlist_links.khan_academy = lo.playlist_links.khan_academy.filter((k) => k.unit_url !== url);
        removedDueToDedupe.push({ keptIn: keep, removedFrom: loId, url, kind: "KA" });
      }

      if (keptIn.length > 1) {
        duplicatesKept.push({ url, kind: "KA", keptIn, reason: "min-coverage" });
      }
    }
  }

  // Brilliant lesson dedupe globally
  const brUrlMap = new Map<string, string[]>(); // url -> loIds
  for (const lo of mapping.learning_objectives) {
    const loId = `${lo.curriculum}:${lo.row}`;
    for (const ch of lo.playlist_links.brilliant) {
      for (const lesson of ch.lessons) {
        const list = brUrlMap.get(lesson.url) || [];
        list.push(loId);
        brUrlMap.set(lesson.url, list);
      }
    }
  }
  for (const [url, loIds] of brUrlMap.entries()) {
    const unique = Array.from(new Set(loIds));
    if (unique.length < 2) continue;
    unique.sort((a, b) => (keptScores.get(b)?.get(url) || 0) - (keptScores.get(a)?.get(url) || 0));
    const keep = unique[0];
    const keptIn: string[] = [keep];
    for (const loId of unique.slice(1)) {
      const lo = mapping.learning_objectives.find((x) => `${x.curriculum}:${x.row}` === loId);
      if (!lo) continue;
      const countsBefore = countActivities(lo);
      const min = minRequiredFor(lo);
      if (countsBefore.total - 1 < min) {
        keptIn.push(loId);
        continue;
      }
      removeBrilliantLessonByUrl(lo, url);
      removedDueToDedupe.push({ keptIn: keep, removedFrom: loId, url, kind: "Brilliant" });
    }
    if (keptIn.length > 1) {
      duplicatesKept.push({ url, kind: "Brilliant", keptIn, reason: "min-coverage" });
    }
  }

  // ---------- 4) Metadata update ----------
  const totalLos = mapping.learning_objectives.length;
  let losWithLinks = 0;
  for (const lo of mapping.learning_objectives) {
    if (countActivities(lo).total > 0) losWithLinks++;
  }
  mapping.metadata = {
    ...(mapping.metadata || {}),
    total_los: totalLos,
    los_with_links: losWithLinks,
    los_without_links: totalLos - losWithLinks,
    coverage_percent: Math.round((losWithLinks / totalLos) * 100),
    last_repaired: new Date().toISOString().slice(0, 10),
  };

  // ---------- 5) Write outputs ----------
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2) + "\n", "utf8");

  const after = stats(mapping);
  const lines: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  lines.push("# Playlist Mapping Repair Report");
  lines.push("");
  lines.push(`Generated: ${today}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- LOs: ${before.los} → ${after.los}`);
  lines.push(`- Total activities: ${before.total} → ${after.total}`);
  lines.push(`- KA activities: ${before.ka} → ${after.ka}`);
  lines.push(`- Brilliant lesson activities: ${before.br} → ${after.br}`);
  lines.push(`- LOs over ${LIMITS.maxActivitiesTotal} activities: ${before.over8} → ${after.over8}`);
  lines.push("");

  lines.push("## Removed (Trimming)");
  lines.push("");
  lines.push(`- Removed entries: ${removedDueToTrim.length}`);
  for (const r of removedDueToTrim.slice(0, 120)) {
    lines.push(`- ${r.loId}: ${r.kind} ${r.url} (score ${r.score.toFixed(3)})`);
  }
  if (removedDueToTrim.length > 120) lines.push(`- … (${removedDueToTrim.length - 120} more)`);
  lines.push("");

  lines.push("## Removed (Deduplication)");
  lines.push("");
  lines.push(`- Removed entries: ${removedDueToDedupe.length}`);
  for (const r of removedDueToDedupe.slice(0, 120)) {
    lines.push(`- Kept in ${r.keptIn}, removed from ${r.removedFrom}: ${r.kind} ${r.url}`);
  }
  if (removedDueToDedupe.length > 120) lines.push(`- … (${removedDueToDedupe.length - 120} more)`);
  lines.push("");

  lines.push("## Duplicates Kept (Min Coverage)");
  lines.push("");
  if (!duplicatesKept.length) {
    lines.push("- None");
  } else {
    for (const d of duplicatesKept.slice(0, 80)) {
      lines.push(`- (${d.kind}) ${d.url}`);
      lines.push(`  - kept in: ${d.keptIn.join(", ")}`);
      lines.push(`  - reason: ${d.reason}`);
    }
    if (duplicatesKept.length > 80) lines.push(`- … (${duplicatesKept.length - 80} more)`);
  }
  lines.push("");

  fs.writeFileSync(reportPath, lines.join("\n"), "utf8");
  console.log(`Updated mapping: ${path.relative(ROOT, mappingPath)}`);
  console.log(`Wrote report: ${path.relative(ROOT, reportPath)}`);
}

main();
