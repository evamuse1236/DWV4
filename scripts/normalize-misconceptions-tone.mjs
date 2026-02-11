import fs from "node:fs";
import path from "node:path";

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function fixEncodingArtifacts(text) {
  let out = String(text ?? "");
  out = out.replace(/([A-Za-z])�([A-Za-z])/g, "$1'$2");
  out = out.replace(/(\d)\s*�\s*(\d)/g, "$1×$2");
  out = out.replace(/\b(cm|in|m|ft|unit)s?�\b/gi, "$1²");
  out = out.replace(/�/g, "");
  return out;
}

function rewriteWarmMisconception(raw) {
  let text = String(raw ?? "").trim();
  while (/^misconception:\s*/i.test(text)) {
    text = text.replace(/^misconception:\s*/i, "").trim();
  }

  text = fixEncodingArtifacts(text);

  const phraseFixes = [
    ["You this is", "This is"],
    ["You variables are", "Variables are"],
    ["You rhombuses", "Rhombuses"],
    ["You not all", "Not all"],
    ["You equal sides", "Equal sides"],
    ["You definition", "Definition"],
    ["You category membership", "Category membership"],
    ["You triangle is", "A triangle is"],
    ["You square is", "A square is"],
    ["You quadrilaterals", "Quadrilaterals"],
    ["You rectangles", "Rectangles"],
    ["You parallelograms", "Parallelograms"],
    ["You linear units", "Linear units"],
    ["You square units", "Square units"],
    ["You degrees", "Degrees"],
    ["You less than", "Less than"],
    ["You equality", "Equality"],
    ["You strict less-than", "Strict less-than"],
    ["You both endpoint", "Both endpoint"],
    ["You an inequality", "An inequality"],
    ["You this solid and cut do not create curved boundaries.", "This solid and this cut do not create curved boundaries."],
    ["You a full through-cut of opposite edges in a prism gives four sides.", "A full through-cut of opposite edges in a prism gives four sides."],
    ["You parallel-to-base slices of pyramids match base shape.", "Slices parallel to a pyramid's base match the base shape."],
    ["You pyramid faces are polygonal.", "Pyramid faces are polygonal."],
    ["You parallel sections preserve shape type.", "Parallel sections preserve shape type."],
    ["You complementary angles do not have to be equal.", "Complementary angles do not have to be equal."],
  ];
  for (const [from, to] of phraseFixes) {
    text = text.replaceAll(from, to);
  }

  const cleanupFixes = [
    ["you you're", "you're"],
    ["for check the", "to check the"],
    ['"base times base.".', '"base times base."'],
  ];
  for (const [from, to] of cleanupFixes) {
    text = text.replaceAll(from, to);
  }

  text = normalizeText(text);
  if (!text) return text;

  if (/^you['’]re\b/i.test(text)) {
    return text;
  }

  if (/^you\b/i.test(text)) {
    const rest = text.replace(/^you\s+/i, "");
    const loweredRest = rest ? rest.charAt(0).toLowerCase() + rest.slice(1) : "";
    return normalizeText(`Nice try. It looks like you ${loweredRest}`);
  }

  if (
    /^(Nice try|Good try|Close|Almost|Oops|Careful|Not quite|It looks like|You're close|You’re close)/i.test(
      text
    )
  ) {
    return text;
  }

  return normalizeText(`Nice try. ${text}`);
}

function normalizePayload(payload) {
  const questionBank = payload?.question_bank ?? {};
  let wrongChoices = 0;
  let changed = 0;
  let prefixBefore = 0;
  let prefixAfter = 0;
  let upperYouBefore = 0;
  let upperYouAfter = 0;

  for (const questions of Object.values(questionBank)) {
    if (!Array.isArray(questions)) continue;
    for (const question of questions) {
      const choices = Array.isArray(question?.choices) ? question.choices : [];
      for (const choice of choices) {
        if (choice?.correct) continue;
        wrongChoices += 1;
        const current = String(
          choice?.misconception_text ?? choice?.misconception ?? ""
        ).trim();
        if (/^Misconception:/.test(current)) prefixBefore += 1;
        if (/\bYou\b/.test(current)) upperYouBefore += 1;

        const next = rewriteWarmMisconception(current);
        if (/^Misconception:/.test(next)) prefixAfter += 1;
        if (/\bYou\b/.test(next)) upperYouAfter += 1;

        if (next !== current) {
          changed += 1;
          if ("misconception_text" in choice || !("misconception" in choice)) {
            choice.misconception_text = next;
          }
          if ("misconception" in choice) {
            choice.misconception = next;
          }
        }
      }
    }
  }

  return {
    wrongChoices,
    changed,
    prefixBefore,
    prefixAfter,
    upperYouBefore,
    upperYouAfter,
  };
}

function normalizeFile(jsonPath) {
  if (!fs.existsSync(jsonPath)) {
    return {
      file: jsonPath,
      skipped: true,
      wrongChoices: 0,
      changed: 0,
      prefixBefore: 0,
      prefixAfter: 0,
      upperYouBefore: 0,
      upperYouAfter: 0,
    };
  }
  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const stats = normalizePayload(payload);
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { file: jsonPath, skipped: false, ...stats };
}

function writeReport(reportPath, results) {
  const totals = results.reduce(
    (acc, row) => {
      acc.wrongChoices += row.wrongChoices;
      acc.changed += row.changed;
      acc.prefixBefore += row.prefixBefore;
      acc.prefixAfter += row.prefixAfter;
      acc.upperYouBefore += row.upperYouBefore;
      acc.upperYouAfter += row.upperYouAfter;
      return acc;
    },
    {
      wrongChoices: 0,
      changed: 0,
      prefixBefore: 0,
      prefixAfter: 0,
      upperYouBefore: 0,
      upperYouAfter: 0,
    }
  );

  const lines = [
    "# Misconception Tone Normalization Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Totals",
    "",
    `- Wrong choices scanned: ${totals.wrongChoices}`,
    `- Rows changed: ${totals.changed}`,
    `- Prefix \`Misconception:\` before: ${totals.prefixBefore}`,
    `- Prefix \`Misconception:\` after: ${totals.prefixAfter}`,
    `- Uppercase word \`You\` before: ${totals.upperYouBefore}`,
    `- Uppercase word \`You\` after: ${totals.upperYouAfter}`,
    "",
    "## Per Target",
    "",
  ];

  for (const row of results) {
    lines.push(`### ${row.file}`);
    lines.push("");
    if (row.skipped) {
      lines.push("- Status: skipped (file missing)");
    } else {
      lines.push(`- Wrong choices scanned: ${row.wrongChoices}`);
      lines.push(`- Rows changed: ${row.changed}`);
      lines.push(`- Prefix before/after: ${row.prefixBefore} / ${row.prefixAfter}`);
      lines.push(`- Uppercase 'You' before/after: ${row.upperYouBefore} / ${row.upperYouAfter}`);
    }
    lines.push("");
  }

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const root = process.cwd();
  const reportPath = path.join(root, "readable", "misconception-tone-normalization-report.md");
  const targets = [
    path.join(root, "Diagnostic V2", "web", "public", "diagnostic_v2", "mastery_data.json"),
    path.join(root, "public", "diagnostic_v2", "mastery_data.json"),
  ];

  const results = targets.map((target) => normalizeFile(target));
  writeReport(reportPath, results);

  for (const row of results) {
    if (row.skipped) {
      console.log(`[skip] Missing file: ${row.file}`);
      continue;
    }
    console.log(
      `[ok] ${row.file} -> changed=${row.changed}, prefix ${row.prefixBefore}->${row.prefixAfter}, UppercaseYou ${row.upperYouBefore}->${row.upperYouAfter}`
    );
  }
  console.log(`[report] ${reportPath}`);
}

main();
