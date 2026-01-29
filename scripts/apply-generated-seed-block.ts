/**
 * apply-generated-seed-block.ts
 *
 * Replaces the generated seed sections in `convex/seed.ts` using the latest
 * `scripts/generated-seed-block.ts`.
 *
 * This avoids manual copy/paste when `playlist_mapping.json` changes.
 *
 * Usage:
 *   node --experimental-strip-types scripts/apply-generated-seed-block.ts
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const GEN_PATH = path.join(ROOT, "scripts", "generated-seed-block.ts");
const SEED_PATH = path.join(ROOT, "convex", "seed.ts");

const PYP_MARKER = "    // ========== PYP Y2 SEED BLOCK (insertPypMajor) ==========";

const MYP_BEGIN = "    // BEGIN GENERATED SEED (MYP Y1) - DO NOT EDIT BY HAND";
const MYP_END = "    // END GENERATED SEED (MYP Y1) - DO NOT EDIT BY HAND";

const PYP_BEGIN = "    // BEGIN GENERATED SEED (PYP Y2) - DO NOT EDIT BY HAND";
const PYP_END = "    // END GENERATED SEED (PYP Y2) - DO NOT EDIT BY HAND";

function replaceBetween(src: string, begin: string, end: string, replacement: string): string {
  const start = src.indexOf(begin);
  const stop = src.indexOf(end);
  if (start === -1 || stop === -1 || stop < start) {
    throw new Error(`Missing markers: ${begin} / ${end}`);
  }
  const before = src.slice(0, start + begin.length);
  const after = src.slice(stop);
  return `${before}\n${replacement}\n${after}`;
}

function main() {
  const generated = fs.readFileSync(GEN_PATH, "utf8");
  const seed = fs.readFileSync(SEED_PATH, "utf8");

  const pypIdx = generated.indexOf(PYP_MARKER);
  if (pypIdx === -1) {
    throw new Error(`Could not find PYP marker in ${path.relative(ROOT, GEN_PATH)}`);
  }

  const mypBlock = generated.slice(0, pypIdx).trimEnd();
  const pypBlock = generated.slice(pypIdx).trim();

  // The generated file includes indentation already.
  const nextSeed1 = replaceBetween(seed, MYP_BEGIN, MYP_END, mypBlock);
  const nextSeed2 = replaceBetween(nextSeed1, PYP_BEGIN, PYP_END, pypBlock);

  fs.writeFileSync(SEED_PATH, nextSeed2, "utf8");
  console.log(`Updated: ${path.relative(ROOT, SEED_PATH)}`);
}

main();

