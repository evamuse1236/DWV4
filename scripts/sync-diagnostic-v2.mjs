import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, "Diagnostic V2", "web", "public", "diagnostic_v2");
const targetDir = path.join(root, "public", "diagnostic_v2");

if (!existsSync(sourceDir)) {
  console.error(`[sync-diagnostic-v2] Source directory not found: ${sourceDir}`);
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true, force: true });

console.log(`[sync-diagnostic-v2] Synced ${sourceDir} -> ${targetDir}`);
