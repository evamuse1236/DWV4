/**
 * audit-playlist-mapping.ts
 *
 * Generates a human-readable snapshot of the current `playlist_mapping.json`
 * (LOs → activities) so we can see duplicates, gaps, and structural issues.
 *
 * This is intentionally NOT a "fix" script. It only reports what exists today.
 *
 * Usage:
 *   node --experimental-strip-types scripts/audit-playlist-mapping.ts
 *
 * Output:
 *   docs/curriculum/snapshot.md
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

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

function firstNonEmptyLine(s: string): string | null {
  const lines = (s || "").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function shortLoLabel(lo: LearningObjective): string {
  const base =
    (lo.dw_handout && lo.dw_handout.trim()) ||
    (firstNonEmptyLine(lo.learning_objective) ?? "");
  const cleaned = base.replace(/^SWBAT\s+/i, "").trim();
  return cleaned || "(missing title)";
}

function main() {
  const mappingPath = path.join(ROOT, "playlist_mapping.json");
  const outPath = path.join(ROOT, "docs", "curriculum", "snapshot.md");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const mapping: PlaylistMapping = JSON.parse(
    fs.readFileSync(mappingPath, "utf8")
  );
  const los = mapping.learning_objectives || [];

  const byCurr: Record<string, LearningObjective[]> = {};
  for (const lo of los) {
    (byCurr[lo.curriculum] ||= []).push(lo);
  }

  const urlToUses = new Map<
    string,
    {
      kind: "KA" | "Brilliant";
      uses: Array<{ curr: string; row: number; topic: string; label: string }>;
    }
  >();

  let totalActivities = 0;
  let totalKa = 0;
  let totalBrilliant = 0;

  const structural: {
    leadingWhitespaceLO: Array<{ curr: string; row: number; sample: string }>;
    multiLineDwHandout: Array<{ curr: string; row: number; lines: number }>;
    emptyLearningObjective: Array<{ curr: string; row: number; dw_handout: boolean }>;
    emptyBothTexts: Array<{ curr: string; row: number; topic: string }>;
  } = {
    leadingWhitespaceLO: [],
    multiLineDwHandout: [],
    emptyLearningObjective: [],
    emptyBothTexts: [],
  };

  for (const lo of los) {
    const loText = lo.learning_objective ?? "";
    const dw = lo.dw_handout ?? "";
    if (!loText.trim()) {
      structural.emptyLearningObjective.push({
        curr: lo.curriculum,
        row: lo.row,
        dw_handout: Boolean(dw.trim()),
      });
    }
    if (!loText.trim() && !dw.trim()) {
      structural.emptyBothTexts.push({
        curr: lo.curriculum,
        row: lo.row,
        topic: lo.topic,
      });
    }
    if (loText && loText.trim() && /^\s+/.test(loText)) {
      structural.leadingWhitespaceLO.push({
        curr: lo.curriculum,
        row: lo.row,
        sample: loText.slice(0, 30).replace(/\n/g, "\\n"),
      });
    }
    if (dw.includes("\n")) {
      structural.multiLineDwHandout.push({
        curr: lo.curriculum,
        row: lo.row,
        lines: dw.split(/\r?\n/).length,
      });
    }

    const loLabel = shortLoLabel(lo);

    for (const ka of lo.playlist_links?.khan_academy || []) {
      if (!ka.unit_url) continue;
      totalActivities++;
      totalKa++;
      const key = ka.unit_url;
      const entry = urlToUses.get(key) || { kind: "KA" as const, uses: [] };
      entry.uses.push({
        curr: lo.curriculum,
        row: lo.row,
        topic: lo.topic,
        label: loLabel,
      });
      urlToUses.set(key, entry);
    }

    for (const ch of lo.playlist_links?.brilliant || []) {
      for (const lesson of ch.lessons || []) {
        if (!lesson.url) continue;
        totalActivities++;
        totalBrilliant++;
        const key = lesson.url;
        const entry =
          urlToUses.get(key) || ({ kind: "Brilliant" as const, uses: [] });
        entry.uses.push({
          curr: lo.curriculum,
          row: lo.row,
          topic: lo.topic,
          label: loLabel,
        });
        urlToUses.set(key, entry);
      }
    }
  }

  const duplicatedUrls = Array.from(urlToUses.entries())
    .map(([url, info]) => {
      const unique = new Map(
        info.uses.map((u) => [`${u.curr}:${u.row}`, u] as const)
      );
      return { url, kind: info.kind, uses: Array.from(unique.values()) };
    })
    .filter((x) => x.uses.length >= 2)
    .sort(
      (a, b) =>
        b.uses.length - a.uses.length || a.url.localeCompare(b.url)
    );

  const lines: string[] = [];
  const today = new Date().toISOString().slice(0, 10);

  lines.push("# Curriculum Mapping Snapshot");
  lines.push("");
  lines.push(`Generated: ${today}`);
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push(`- Learning objectives (LOs): ${los.length}`);
  for (const [curr, list] of Object.entries(byCurr)) {
    lines.push(`- ${curr}: ${list.length} LOs`);
  }
  lines.push(`- Total activities: ${totalActivities}`);
  lines.push(`- Khan Academy activities: ${totalKa}`);
  lines.push(`- Brilliant lesson activities: ${totalBrilliant}`);
  lines.push(`- Unique URLs: ${urlToUses.size}`);
  lines.push(`- URLs reused across 2+ LOs: ${duplicatedUrls.length}`);
  lines.push("");

  lines.push("## Topics");
  lines.push("");
  for (const [curr, list] of Object.entries(byCurr)) {
    const topicCounts = new Map<string, number>();
    for (const lo of list) {
      topicCounts.set(lo.topic, (topicCounts.get(lo.topic) || 0) + 1);
    }
    const entries = Array.from(topicCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    lines.push(`### ${curr}`);
    lines.push("");
    for (const [topic, count] of entries) {
      lines.push(`- ${count} — ${topic}`);
    }
    lines.push("");
  }

  lines.push("## Structural Issues");
  lines.push("");
  lines.push(
    `- LOs with empty \`learning_objective\`: ${structural.emptyLearningObjective.length}`
  );
  lines.push(
    `- LOs with empty \`learning_objective\` and empty \`dw_handout\`: ${structural.emptyBothTexts.length}`
  );
  lines.push(
    `- LOs with leading whitespace in \`learning_objective\`: ${structural.leadingWhitespaceLO.length}`
  );
  lines.push(
    `- LOs with multi-line \`dw_handout\`: ${structural.multiLineDwHandout.length}`
  );
  lines.push("");

  if (structural.emptyLearningObjective.length) {
    lines.push("### Empty learning_objective");
    lines.push("");
    for (const item of structural.emptyLearningObjective.sort(
      (a, b) => a.curr.localeCompare(b.curr) || a.row - b.row
    )) {
      lines.push(
        `- ${item.curr} Row ${item.row} (dw_handout present: ${item.dw_handout ? "yes" : "no"})`
      );
    }
    lines.push("");
  }

  if (structural.leadingWhitespaceLO.length) {
    lines.push("### Leading whitespace in learning_objective");
    lines.push("");
    for (const item of structural.leadingWhitespaceLO.sort(
      (a, b) => a.curr.localeCompare(b.curr) || a.row - b.row
    )) {
      lines.push(`- ${item.curr} Row ${item.row}: ${item.sample}`);
    }
    lines.push("");
  }

  if (structural.multiLineDwHandout.length) {
    lines.push("### Multi-line dw_handout");
    lines.push("");
    for (const item of structural.multiLineDwHandout.sort(
      (a, b) => a.curr.localeCompare(b.curr) || a.row - b.row
    )) {
      lines.push(`- ${item.curr} Row ${item.row}: ${item.lines} lines`);
    }
    lines.push("");
  }

  lines.push("## Reused Activity URLs (2+ LOs)");
  lines.push("");
  for (const item of duplicatedUrls) {
    lines.push(`### ${item.uses.length}× (${item.kind}) ${item.url}`);
    lines.push("");
    for (const u of item.uses.sort(
      (a, b) => a.curr.localeCompare(b.curr) || a.row - b.row
    )) {
      lines.push(`- ${u.curr} Row ${u.row} — ${u.topic} — ${u.label}`);
    }
    lines.push("");
  }

  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  console.log(`Wrote snapshot: ${path.relative(ROOT, outPath)}`);
}

main();

