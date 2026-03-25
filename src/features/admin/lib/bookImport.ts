import * as XLSX from "xlsx";

export type ImportBookRow = {
  title: string;
  author: string;
  genre?: string;
  gradeLevel?: string;
  description?: string;
  coverImageUrl?: string;
  readingUrl?: string;
  pageCount?: number;
};

export type ImportIssue = {
  rowNumber: number;
  reason: string;
};

function cleanText(value: unknown) {
  if (value === null || value === undefined) return undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function toImportRow(source: Record<string, unknown>): ImportBookRow | null {
  const title =
    cleanText(source.title) ??
    cleanText(source.booktitle) ??
    cleanText(source.name);
  const author =
    cleanText(source.author) ??
    cleanText(source.bookauthor) ??
    cleanText(source.writer);

  if (!title || !author) {
    return null;
  }

  const pageCountValue =
    cleanText(source.pagecount) ??
    cleanText(source.pages) ??
    cleanText(source.length);
  const pageCount =
    pageCountValue && !Number.isNaN(Number(pageCountValue))
      ? Number(pageCountValue)
      : undefined;

  return {
    title,
    author,
    genre: cleanText(source.genre),
    gradeLevel: cleanText(source.gradelevel) ?? cleanText(source.grade),
    description: cleanText(source.description) ?? cleanText(source.summary),
    coverImageUrl: cleanText(source.coverimageurl) ?? cleanText(source.coverurl),
    readingUrl: cleanText(source.readingurl) ?? cleanText(source.url),
    pageCount,
  };
}

export function parseBulkPaste(text: string) {
  const rows: ImportBookRow[] = [];
  const invalidRows: ImportIssue[] = [];

  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .forEach((line, index) => {
      if (!line) return;

      const tabParts = line.split("\t").map((part) => part.trim()).filter(Boolean);
      if (tabParts.length >= 2) {
        rows.push({
          title: tabParts[0],
          author: tabParts[1],
        });
        return;
      }

      const separatorMatch = line.match(/^(.*?)\s(?:\||-)\s(.*)$/);
      if (!separatorMatch) {
        invalidRows.push({
          rowNumber: index + 1,
          reason: "Use Title - Author or Title | Author",
        });
        return;
      }

      const title = separatorMatch[1]?.trim();
      const author = separatorMatch[2]?.trim();
      if (!title || !author) {
        invalidRows.push({
          rowNumber: index + 1,
          reason: "Title and author are required",
        });
        return;
      }

      rows.push({ title, author });
    });

  return { rows, invalidRows };
}

export async function parseSpreadsheetFile(file: File) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];

  if (!sheet) {
    return {
      rows: [] as ImportBookRow[],
      invalidRows: [{ rowNumber: 1, reason: "No sheet data found" }],
    };
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const rows: ImportBookRow[] = [];
  const invalidRows: ImportIssue[] = [];

  rawRows.forEach((rawRow, index) => {
    const normalizedRecord = Object.fromEntries(
      Object.entries(rawRow).map(([key, value]) => [normalizeHeader(key), value])
    );
    const row = toImportRow(normalizedRecord);
    if (!row) {
      invalidRows.push({
        rowNumber: index + 2,
        reason: "Title and author are required",
      });
      return;
    }
    rows.push(row);
  });

  return { rows, invalidRows };
}
