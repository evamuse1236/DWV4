import { describe, expect, it } from "vitest";
import { parseBulkPaste } from "../bookImport";

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
});
