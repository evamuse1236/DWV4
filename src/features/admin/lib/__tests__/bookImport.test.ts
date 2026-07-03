import { describe, expect, it } from "vitest";
import { parseBulkPaste, parseDelimitedBookFile } from "../bookImport";

describe("bookImport helpers", () => {
  it("parses paste rows with supported separators", () => {
    const { rows, invalidRows } = parseBulkPaste(
      "Charlotte's Web - E.B. White\nThe Hobbit | J.R.R. Tolkien"
    );

    expect(rows).toEqual([
      { title: "Charlotte's Web", author: "E.B. White" },
      { title: "The Hobbit", author: "J.R.R. Tolkien" },
    ]);
    expect(invalidRows).toEqual([]);
  });

  it("reports invalid paste rows with line numbers", () => {
    const { rows, invalidRows } = parseBulkPaste("Only a title line\nValid Book - Valid Author");

    expect(rows).toEqual([{ title: "Valid Book", author: "Valid Author" }]);
    expect(invalidRows).toEqual([
      { rowNumber: 1, reason: "Use Title - Author or Title | Author" },
    ]);
  });

  it("parses headered CSV uploads", async () => {
    const file = new File(
      ['title,author,genre,page count\n"Charlotte, the Spider",E.B. White,Fiction,192'],
      "books.csv",
      { type: "text/csv" }
    );

    const { rows, invalidRows } = await parseDelimitedBookFile(file);

    expect(rows).toEqual([
      {
        title: "Charlotte, the Spider",
        author: "E.B. White",
        genre: "Fiction",
        pageCount: 192,
      },
    ]);
    expect(invalidRows).toEqual([]);
  });

  it("parses TSV uploads and reports invalid data rows", async () => {
    const file = new File(
      ["title\tauthor\tgrade\nThe Hobbit\tJ.R.R. Tolkien\t6\nMissing Author\t\t7"],
      "books.tsv",
      { type: "text/tab-separated-values" }
    );

    const { rows, invalidRows } = await parseDelimitedBookFile(file);

    expect(rows).toEqual([
      { title: "The Hobbit", author: "J.R.R. Tolkien", gradeLevel: "6" },
    ]);
    expect(invalidRows).toEqual([
      { rowNumber: 3, reason: "Title and author are required" },
    ]);
  });
});
