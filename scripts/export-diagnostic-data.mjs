import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "public", "diagnostic");
await fs.mkdir(outDir, { recursive: true });

/**
 * Extract a JSON array from a JS file containing `var NAME = [...];`
 * Finds the opening `[` after the `=`, then finds the matching `];` at the end.
 */
function extractJsonArray(src, marker, filePath) {
  const start = src.indexOf(marker);
  if (start === -1) {
    throw new Error(`Could not find '${marker}' in ${filePath}`);
  }

  const afterEquals = src.indexOf("=", start);
  if (afterEquals === -1) {
    throw new Error(`Could not find '=' after '${marker}' in ${filePath}`);
  }

  // Find the opening bracket
  const bracketStart = src.indexOf("[", afterEquals);
  if (bracketStart === -1) {
    throw new Error(`Could not find '[' after '${marker}' in ${filePath}`);
  }

  // Find the closing `];` — search backwards from end of file for `];`
  const closingPattern = "];";
  const closingIdx = src.lastIndexOf(closingPattern, src.length);
  if (closingIdx === -1 || closingIdx < bracketStart) {
    throw new Error(`Could not find trailing '];' in ${filePath}`);
  }

  // Extract from `[` to `]` (inclusive)
  const json = src.slice(bracketStart, closingIdx + 1).trim();
  if (!json.startsWith("[") || !json.endsWith("]")) {
    throw new Error(
      `Extracted content does not look like a JSON array (starts with '${json.slice(0, 20)}')`
    );
  }
  return json;
}

// --- Export diagnostic-data.json ---
const dataPath = path.join(repoRoot, "diagnostic-check", "data.js");
const dataSrc = await fs.readFile(dataPath, "utf8");
const dataJson = extractJsonArray(dataSrc, "var DIAGNOSTIC_DATA =", dataPath);
const dataOutPath = path.join(outDir, "diagnostic-data.json");
await fs.writeFile(dataOutPath, dataJson, "utf8");
console.log(`Wrote ${dataOutPath}`);

// --- Export diagnostic-sets.json ---
const setsPath = path.join(repoRoot, "diagnostic-check", "data-sets.js");
try {
  const setsSrc = await fs.readFile(setsPath, "utf8");
  const setsJson = extractJsonArray(setsSrc, "var DIAGNOSTIC_SETS =", setsPath);
  const setsOutPath = path.join(outDir, "diagnostic-sets.json");
  await fs.writeFile(setsOutPath, setsJson, "utf8");
  console.log(`Wrote ${setsOutPath}`);
} catch (err) {
  if (err.code === "ENOENT") {
    console.log(`Skipped diagnostic-sets.json (${setsPath} not found)`);
  } else {
    throw err;
  }
}
