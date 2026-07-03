import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

type DailyGoalDraft = {
  goalHabit: string;
  wentWell: string;
  couldImprove: string;
};

type StudentDraft = {
  batch: string;
  displayName: string;
  username: string;
  draft: DailyGoalDraft;
  evidence: unknown;
};

type DraftReport = {
  generatedAt: number;
  sprintWindow: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  }>;
  students: StudentDraft[];
};

type SheetConfig = {
  batch: "2153" | "2156";
  spreadsheetId: string;
  tab: string;
};

type CellWriteResult = {
  batch: string;
  student: string;
  row: number;
  column: string | null;
  cell: string | null;
  field: keyof DailyGoalDraft;
  value: string;
  status: "written" | "skipped_existing" | "skipped_missing_column";
  existingValue?: string;
};

const NPX = process.platform === "win32" ? "npx.cmd" : "npx";
const GOG = process.platform === "win32" ? "gog.exe" : "gog";
const DW_REPO = "C:\\WProjects\\DW";
const Q3_TARGETS: SheetConfig[] = [
  {
    batch: "2153",
    spreadsheetId: "1JqUG-zqA2WGS1ZFiCZ7UVqwHmGBPTWYoRNYPb4_JGaQ",
    tab: "Q3",
  },
  {
    batch: "2156",
    spreadsheetId: "10-iUcRzomm_JcCx0m8Cb03YFxLdLJmfYoUjf4Fd6IDs",
    tab: "MYP Y1 Q3",
  },
];

const ROWS: Record<keyof DailyGoalDraft, number> = {
  goalHabit: 59,
  wentWell: 60,
  couldImprove: 61,
};

const NAME_ALIASES: Record<string, string> = {
  aadhithya: "aadithya",
  aadithya: "aadithya",
  mohammed: "zuhayr",
};

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  return { dryRun };
}

function runCommand(
  command: string,
  args: string[],
  cwd?: string
): { stdout: string; stderr: string } {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32" && command.endsWith(".cmd"),
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw result.error;
  }

  const stdout = (result.stdout ?? "").trim();
  const stderr = (result.stderr ?? "").trim();
  const details = stderr || stdout || "No stdout/stderr captured.";

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed.\n${details}`);
  }

  return {
    stdout,
    stderr,
  };
}

function extractJsonPayload(stdout: string) {
  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error("Expected JSON output but command returned an empty stdout.");
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const objectStart = trimmed.lastIndexOf("\n{");
  const arrayStart = trimmed.lastIndexOf("\n[");
  const startIndex = Math.max(objectStart, arrayStart);

  if (startIndex >= 0) {
    return trimmed.slice(startIndex + 1).trim();
  }

  throw new Error(`Expected JSON output but could not locate a JSON payload.\n${trimmed}`);
}

function runJson<T>(command: string, args: string[], cwd?: string): T {
  const { stdout } = runCommand(command, args, cwd);
  return JSON.parse(extractJsonPayload(stdout)) as T;
}

function normalizeStudentName(name: string) {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim();
  const firstToken = cleaned.split(/\s+/)[0] ?? cleaned;
  return NAME_ALIASES[firstToken] ?? firstToken;
}

function isStudentHeader(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "student name") return false;
  if (normalized === "student info") return false;
  return true;
}

function columnLetterFromIndex(index: number) {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function ensureGogAccess(target: SheetConfig) {
  try {
    runJson(
      GOG,
      [
        "sheets",
        "get",
        target.spreadsheetId,
        `${target.tab}!A1:A1`,
        "--json",
        "--no-input",
      ],
      DW_REPO
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("invalid_grant") || message.includes("expired or revoked")) {
      throw new Error(
        "Your gog Google auth is expired or revoked. Refresh it first with `gog auth add vishwajit1236@gmail.com --services sheets,drive` and then rerun this script."
      );
    }
    throw error;
  }
}

function getHeaderMap(target: SheetConfig) {
  const response = runJson<{ values?: string[][] }>(
    GOG,
    [
      "sheets",
      "get",
      target.spreadsheetId,
      `${target.tab}!A1:ZZ1`,
      "--json",
      "--no-input",
    ],
    DW_REPO
  );

  const row = response.values?.[0] ?? [];
  const headerMap = new Map<string, string>();
  row.forEach((value, index) => {
    if (!isStudentHeader(value)) return;
    headerMap.set(normalizeStudentName(value), columnLetterFromIndex(index));
  });
  return headerMap;
}

function getExistingCellValue(target: SheetConfig, cell: string) {
  const response = runJson<{ values?: string[][] }>(
    GOG,
    [
      "sheets",
      "get",
      target.spreadsheetId,
      `${target.tab}!${cell}`,
      "--json",
      "--no-input",
    ],
    DW_REPO
  );

  return response.values?.[0]?.[0]?.trim() ?? "";
}

function writeCell(target: SheetConfig, cell: string, value: string) {
  return runJson<{ updatedRange: string }>(
    GOG,
    [
      "sheets",
      "update",
      target.spreadsheetId,
      `${target.tab}!${cell}`,
      "--values-json",
      JSON.stringify([[value]]),
      "--input",
      "USER_ENTERED",
      "--json",
      "--no-input",
    ],
    DW_REPO
  );
}

function getDraftReport() {
  const maintenanceKey = process.env.CONVEX_MAINTENANCE_KEY;
  if (!maintenanceKey) {
    throw new Error("CONVEX_MAINTENANCE_KEY is required to generate Q3 daily goal drafts.");
  }

  return runJson<DraftReport>(
    NPX,
    [
      "convex",
      "run",
      "reporting:generateQ3DailyGoalsDrafts",
      JSON.stringify({ maintenanceKey }),
    ],
    DW_REPO
  );
}

function buildAuditPath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(DW_REPO, "workspace", "q3-daily-goals");
  mkdirSync(dir, { recursive: true });
  return path.join(dir, `q3-daily-goals-audit-${timestamp}.json`);
}

function main() {
  const { dryRun } = parseArgs();

  for (const target of Q3_TARGETS) {
    ensureGogAccess(target);
  }

  const report = getDraftReport();
  const headerMaps = new Map(
    Q3_TARGETS.map((target) => [target.batch, getHeaderMap(target)])
  );

  const results: CellWriteResult[] = [];

  for (const student of report.students) {
    const target = Q3_TARGETS.find((item) => item.batch === student.batch);
    if (!target) continue;

    const headerMap = headerMaps.get(student.batch);
    const column = headerMap?.get(normalizeStudentName(student.displayName)) ?? null;

    for (const field of Object.keys(ROWS) as Array<keyof DailyGoalDraft>) {
      const value = student.draft[field].trim();

      if (!column) {
        results.push({
          batch: student.batch,
          student: student.displayName,
          row: ROWS[field],
          column: null,
          cell: null,
          field,
          value,
          status: "skipped_missing_column",
        });
        continue;
      }

      const cell = `${column}${ROWS[field]}`;
      const existingValue = getExistingCellValue(target, cell);
      if (existingValue) {
        results.push({
          batch: student.batch,
          student: student.displayName,
          row: ROWS[field],
          column,
          cell,
          field,
          value,
          existingValue,
          status: "skipped_existing",
        });
        continue;
      }

      if (!dryRun) {
        writeCell(target, cell, value);
      }

      results.push({
        batch: student.batch,
        student: student.displayName,
        row: ROWS[field],
        column,
        cell,
        field,
        value,
        status: "written",
      });
    }
  }

  const auditPath = buildAuditPath();
  writeFileSync(
    auditPath,
    JSON.stringify(
      {
        dryRun,
        generatedAt: new Date().toISOString(),
        sprintWindow: report.sprintWindow,
        students: report.students.map((student) => ({
          batch: student.batch,
          displayName: student.displayName,
          username: student.username,
          evidence: student.evidence,
          draft: student.draft,
        })),
        results,
      },
      null,
      2
    ),
    "utf8"
  );

  const written = results.filter((result) => result.status === "written").length;
  const skippedExisting = results.filter(
    (result) => result.status === "skipped_existing"
  ).length;
  const skippedMissing = results.filter(
    (result) => result.status === "skipped_missing_column"
  ).length;

  console.log(
    JSON.stringify(
      {
        dryRun,
        written,
        skippedExisting,
        skippedMissing,
        auditPath,
      },
      null,
      2
    )
  );
}

main();
