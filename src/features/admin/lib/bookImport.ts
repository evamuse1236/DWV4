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

function parseDelimitedRows(text: string, delimiter: "," | "\t") {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(value.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

function chooseDelimiter(file: File, text: string): "," | "\t" {
  if (file.name.toLowerCase().endsWith(".tsv")) return "\t";
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return firstLine.includes("\t") && !firstLine.includes(",") ? "\t" : ",";
}

async function readFileAsText(file: File) {
  if (typeof file.text === "function") {
    return await file.text();
  }

  if (typeof file.arrayBuffer === "function") {
    return new TextDecoder().decode(await file.arrayBuffer());
  }

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsText(file);
  });
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

export async function parseDelimitedBookFile(file: File) {
  const text = (await readFileAsText(file)).replace(/^\uFEFF/, "");
  const delimiter = chooseDelimiter(file, text);
  const [headerRow, ...dataRows] = parseDelimitedRows(text, delimiter);

  if (!headerRow || headerRow.length === 0) {
    return {
      rows: [] as ImportBookRow[],
      invalidRows: [{ rowNumber: 1, reason: "No CSV or TSV data found" }],
    };
  }

  const headers = headerRow.map(normalizeHeader);
  if (!headers.includes("title") || !headers.includes("author")) {
    return {
      rows: [] as ImportBookRow[],
      invalidRows: [{ rowNumber: 1, reason: "Header row must include title and author" }],
    };
  }

  const rows: ImportBookRow[] = [];
  const invalidRows: ImportIssue[] = [];

  dataRows.forEach((cells, index) => {
    const normalizedRecord = Object.fromEntries(headers.map((key, cellIndex) => [key, cells[cellIndex] ?? ""]));
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
