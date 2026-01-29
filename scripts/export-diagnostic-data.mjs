import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const inputPath = path.join(repoRoot, "diagnostic-check", "data.js");
const outDir = path.join(repoRoot, "public", "diagnostic");
const outPath = path.join(outDir, "diagnostic-data.json");

const src = await fs.readFile(inputPath, "utf8");

const marker = "var DIAGNOSTIC_DATA =";
const start = src.indexOf(marker);
if (start === -1) {
  throw new Error(`Could not find '${marker}' in ${inputPath}`);
}

const afterEquals = src.indexOf("=", start);
if (afterEquals === -1) {
  throw new Error(`Could not find '=' after '${marker}' in ${inputPath}`);
}

const lastSemi = src.lastIndexOf(";");
if (lastSemi === -1 || lastSemi <= afterEquals) {
  throw new Error(`Could not find trailing ';' in ${inputPath}`);
}

const json = src.slice(afterEquals + 1, lastSemi).trim();
if (!json.startsWith("[") || !json.endsWith("]")) {
  throw new Error(
    `Extracted content does not look like a JSON array (starts with '${json.slice(0, 20)}')`
  );
}

await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(outPath, json, "utf8");

console.log(`Wrote ${outPath}`);
