/**
 * patch-mismatch-risk-rows.ts
 *
 * Targeted cleanup for the current "mismatch-risk" rows:
 * - remove digit-specific wording from objective statements (keep as examples)
 * - add KA `display_title` to better reflect the objective focus in the UI
 *
 * Usage: node --experimental-strip-types scripts/patch-mismatch-risk-rows.ts
 *
 * Output:
 * - Updates `playlist_mapping.json`
 * - Writes `docs/curriculum/mismatch-risk-patch-report.md`
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

type KhanEntry = {
  source: string;
  unit_name: string;
  unit_url: string;
  match_quality: string;
  note?: string;
  display_title?: string;
  activity_type?: string;
};

type LearningObjective = {
  curriculum: string;
  row: number;
  subject: string;
  topic: string;
  learning_objective: string;
  dw_handout: string;
  playlist_links: {
    khan_academy: KhanEntry[];
    brilliant: unknown[];
  };
};

type PlaylistMapping = {
  metadata: Record<string, unknown>;
  learning_objectives: LearningObjective[];
};

type Patch = {
  curriculum: string;
  row: number;
  newLearningObjective?: string;
  kaDisplayTitleByUrl?: Record<string, string>;
  kaNoteByUrl?: Record<string, string>;
};

const PATCHES: Patch[] = [
  {
    curriculum: "MYP Y1",
    row: 9,
    newLearningObjective:
      "SWBAT multiply multi-digit whole numbers using the standard algorithm (e.g., 3-digit × 2-digit).",
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division":
        "Multi-digit multiplication and division (standard algorithm)",
      "https://www.khanacademy.org/math/cc-fourth-grade-math/cc-4th-mult-div-topic":
        "Multiplication & division (word problems + multi-digit practice)",
    },
  },
  {
    curriculum: "MYP Y1",
    row: 10,
    newLearningObjective:
      "SWBAT divide multi-digit whole numbers using standard algorithms and reasoning (e.g., up to 4-digit ÷ 2-digit).",
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fourth-grade-math/division":
        "Division (multi-digit, quotients and remainders)",
    },
  },
  {
    curriculum: "MYP Y1",
    row: 23,
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3":
        "Add and subtract fractions (unlike denominators)",
    },
    kaNoteByUrl: {
      "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3":
        "Objective is specifically unlike denominators; prefer lesson-level links if you want stricter coverage validation.",
    },
  },
  {
    curriculum: "MYP Y1",
    row: 39,
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fifth-grade-math/properties-of-shapes":
        "Properties of shapes (classify quadrilaterals by sides/angles/parallel/perpendicular)",
    },
  },
  {
    curriculum: "PYP Y2",
    row: 6,
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-geometry-2/imp-angle-addition":
        "Angle addition (word problems)",
    },
  },
  {
    curriculum: "PYP Y2",
    row: 16,
    newLearningObjective:
      "SWBAT multiply multi-digit whole numbers by 1-digit using algorithms and area models (e.g., 4-digit × 1-digit).",
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2":
        "Multiplication and division (algorithms + area models)",
    },
  },
  {
    curriculum: "PYP Y2",
    row: 18,
    newLearningObjective:
      "SWBAT divide multi-digit whole numbers by 1-digit (quotients and remainders) using place value strategies (e.g., up to 4-digit ÷ 1-digit).",
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fourth-grade-math/division":
        "Division (multi-digit, quotients and remainders)",
    },
  },
  {
    curriculum: "PYP Y2",
    row: 20,
    newLearningObjective:
      "SWBAT multiply two multi-digit whole numbers using place value and algorithms (e.g., 2-digit × 2-digit).",
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2":
        "Multiply by 2-digit numbers (place value + algorithms)",
    },
  },
  {
    curriculum: "PYP Y2",
    row: 21,
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-algebraic-thinking":
        "Order of operations (PEMDAS/BODMAS practice)",
    },
  },
  {
    curriculum: "PYP Y2",
    row: 42,
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-measurement-and-data-2":
        "Units of measurement (distance/time/volume/mass/money)",
    },
  },
  {
    curriculum: "PYP Y2",
    row: 44,
    kaDisplayTitleByUrl: {
      "https://www.khanacademy.org/math/k-8-grades/cc-third-grade-math/imp-perimeter":
        "Perimeter (triangles, rectangles, composite shapes)",
    },
  },
];

function readMapping(): PlaylistMapping {
  return JSON.parse(
    fs.readFileSync(path.join(ROOT, "playlist_mapping.json"), "utf8")
  ) as PlaylistMapping;
}

function writeMapping(mapping: PlaylistMapping) {
  fs.writeFileSync(
    path.join(ROOT, "playlist_mapping.json"),
    JSON.stringify(mapping, null, 2) + "\n",
    "utf8"
  );
}

function writeReport(lines: string[]) {
  const outPath = path.join(
    ROOT,
    "docs/curriculum/mismatch-risk-patch-report.md"
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
}

function main() {
  const mapping = readMapping();
  const byKey = new Map<string, LearningObjective>();
  for (const lo of mapping.learning_objectives) {
    byKey.set(`${lo.curriculum}#${lo.row}`, lo);
  }

  const report: string[] = [];
  report.push("# Mismatch-risk patch report");
  report.push("");
  report.push(
    "This report documents a targeted cleanup pass over the current mismatch-risk rows (see `docs/curriculum/semantic-mismatch-report.md`)."
  );
  report.push("");

  let changed = 0;
  let missing = 0;

  for (const p of PATCHES) {
    const key = `${p.curriculum}#${p.row}`;
    const lo = byKey.get(key);
    if (!lo) {
      missing++;
      report.push(`- Missing row: ${key}`);
      continue;
    }

    let rowChanged = false;

    if (p.newLearningObjective && lo.learning_objective !== p.newLearningObjective) {
      report.push(`- ${key}: updated learning_objective`);
      lo.learning_objective = p.newLearningObjective;
      rowChanged = true;
    }

    if (p.kaDisplayTitleByUrl || p.kaNoteByUrl) {
      for (const ka of lo.playlist_links.khan_academy || []) {
        const newTitle = p.kaDisplayTitleByUrl?.[ka.unit_url];
        if (newTitle && ka.display_title !== newTitle) {
          report.push(`- ${key}: set display_title for ${ka.unit_url}`);
          ka.display_title = newTitle;
          rowChanged = true;
        }
        const newNote = p.kaNoteByUrl?.[ka.unit_url];
        if (newNote && ka.note !== newNote) {
          report.push(`- ${key}: set note for ${ka.unit_url}`);
          ka.note = newNote;
          rowChanged = true;
        }
      }
    }

    if (rowChanged) changed++;
  }

  report.push("");
  report.push("## Summary");
  report.push("");
  report.push(`- Rows patched: ${changed}`);
  report.push(`- Rows missing: ${missing}`);

  writeMapping(mapping);
  writeReport(report);

  console.log(
    `Updated playlist_mapping.json. Wrote docs/curriculum/mismatch-risk-patch-report.md (patched=${changed}, missing=${missing})`
  );
}

main();

