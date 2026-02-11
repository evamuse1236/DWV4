import fs from "node:fs";
import path from "node:path";

function toChoiceLabel(choice, index) {
  if (choice?.label) return String(choice.label).trim();
  return String.fromCharCode(65 + index);
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function rewriteWarmMisconception(raw) {
  let text = String(raw ?? "").trim();
  while (/^misconception:\s*/i.test(text)) {
    text = text.replace(/^misconception:\s*/i, "").trim();
  }

  text = text.replace(/\uFFFD/g, "×");

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
    [
      "You this solid and cut do not create curved boundaries.",
      "This solid and this cut do not create curved boundaries.",
    ],
    [
      "You a full through-cut of opposite edges in a prism gives four sides.",
      "A full through-cut of opposite edges in a prism gives four sides.",
    ],
    [
      "You parallel-to-base slices of pyramids match base shape.",
      "Slices parallel to a pyramid's base match the base shape.",
    ],
    ["You pyramid faces are polygonal.", "Pyramid faces are polygonal."],
    ["You parallel sections preserve shape type.", "Parallel sections preserve shape type."],
    [
      "You complementary angles do not have to be equal.",
      "Complementary angles do not have to be equal.",
    ],
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
    const loweredRest = rest.charAt(0).toLowerCase() + rest.slice(1);
    return `Nice try. It looks like you ${loweredRest}`;
  }

  if (
    /^(Nice try|Good try|Close|Almost|Oops|Careful|Not quite|It looks like|You\'re close|You’re close)/i.test(
      text
    )
  ) {
    return text;
  }

  return `Nice try. ${text}`;
}

function partIndex(fileName) {
  const match = fileName.match(/^diagnostic-part-(\d+)\.md$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function parseMarkdownQuestionMap(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const map = new Map();

  let currentQuestionId = null;
  let pendingChoice = null;

  for (const line of lines) {
    const questionMatch = line.match(/^#### Q\d+ - (.+)\s*$/);
    if (questionMatch) {
      currentQuestionId = questionMatch[1].trim();
      if (!map.has(currentQuestionId)) map.set(currentQuestionId, new Map());
      pendingChoice = null;
      continue;
    }

    const choiceMatch = line.match(
      /^- ([A-Z])\. (.+) \[(CORRECT|WRONG)\]\s*$/
    );
    if (choiceMatch && currentQuestionId) {
      const label = choiceMatch[1];
      const choiceText = choiceMatch[2].trim();
      const isCorrect = choiceMatch[3] === "CORRECT";
      map.get(currentQuestionId).set(label, {
        label,
        text: choiceText,
        correct: isCorrect,
        misconception: null,
      });
      pendingChoice = isCorrect ? null : label;
      continue;
    }

    const misconceptionMatch = line.match(/^\s*-\s*Misconception:\s*(.+)\s*$/);
    if (misconceptionMatch && currentQuestionId && pendingChoice) {
      const row = map.get(currentQuestionId).get(pendingChoice);
      if (row) {
        row.misconception = misconceptionMatch[1].trim();
      }
      pendingChoice = null;
    }
  }

  return map;
}

function mergeQuestionMaps(questionMaps) {
  const merged = new Map();
  for (const map of questionMaps) {
    for (const [questionId, labelMap] of map.entries()) {
      if (!merged.has(questionId)) merged.set(questionId, new Map());
      const target = merged.get(questionId);
      for (const [label, row] of labelMap.entries()) {
        target.set(label, row);
      }
    }
  }
  return merged;
}

function loadReadableParts(partsDir) {
  const partFiles = fs
    .readdirSync(partsDir)
    .filter((name) => /^diagnostic-part-\d+\.md$/.test(name))
    .sort((a, b) => partIndex(a) - partIndex(b));

  if (partFiles.length === 0) {
    throw new Error(`No readable parts found in: ${partsDir}`);
  }

  const parsedMaps = partFiles.map((partFile) =>
    parseMarkdownQuestionMap(path.join(partsDir, partFile))
  );

  return {
    partFiles,
    map: mergeQuestionMaps(parsedMaps),
  };
}

function loadReadableBaseline(fullReadablePath) {
  if (!fs.existsSync(fullReadablePath)) {
    throw new Error(`Baseline readable file not found: ${fullReadablePath}`);
  }
  return parseMarkdownQuestionMap(fullReadablePath);
}

function applyMapToPayload(payload, partsMap, baselineMap) {
  const questionBank = payload?.question_bank ?? {};
  let safeApplied = 0;
  let safeAlreadyCorrect = 0;
  let rollbackApplied = 0;
  let riskySourceSkipped = 0;
  let missingPartLabel = 0;
  let missingPartMisconception = 0;
  let missingBaselineFallback = 0;
  let matchedQuestions = 0;
  const riskyRows = [];

  for (const questions of Object.values(questionBank)) {
    if (!Array.isArray(questions)) continue;

    for (const question of questions) {
      const questionId = String(question?.question_id ?? "").trim();
      if (!questionId) continue;
      matchedQuestions += 1;
      const sourceChoices = partsMap.get(questionId) ?? null;
      const baselineChoices = baselineMap.get(questionId) ?? null;

      if (!Array.isArray(question.choices)) continue;
      question.choices.forEach((choice, index) => {
        if (choice?.correct) return;
        const label = toChoiceLabel(choice, index);
        const liveText = normalizeText(choice?.text ?? "");
        const liveCorrect = Boolean(choice?.correct);
        const liveMisconception = String(
          choice?.misconception_text ?? choice?.misconception ?? ""
        ).trim();

        const source = sourceChoices?.get(label);
        const baseline = baselineChoices?.get(label);
        const canUseSource =
          source &&
          source.misconception &&
          normalizeText(source.text) === liveText &&
          source.correct === liveCorrect;

        if (canUseSource) {
          const replacement = String(source.misconception).trim();
          if (replacement === liveMisconception) {
            safeAlreadyCorrect += 1;
            return;
          }

          if ("misconception_text" in choice || !("misconception" in choice)) {
            choice.misconception_text = replacement;
          }
          if ("misconception" in choice) {
            choice.misconception = replacement;
          }
          safeApplied += 1;
          return;
        }

        if (!source) {
          missingPartLabel += 1;
          return;
        }

        if (!source.misconception) {
          missingPartMisconception += 1;
        } else {
          riskySourceSkipped += 1;
          riskyRows.push({
            questionId,
            label,
            sourceChoiceText: source.text,
            liveChoiceText: String(choice?.text ?? ""),
            sourceCorrect: source.correct,
            liveCorrect,
            reason:
              source.correct !== liveCorrect
                ? "correctness_mismatch"
                : "choice_text_mismatch",
          });
        }

        const canUseBaseline =
          baseline &&
          baseline.misconception &&
          normalizeText(baseline.text) === liveText &&
          baseline.correct === liveCorrect;

        if (!canUseBaseline) {
          missingBaselineFallback += 1;
          return;
        }

        const fallback = rewriteWarmMisconception(
          String(baseline.misconception).trim()
        );
        if (fallback === liveMisconception) return;
        if ("misconception_text" in choice || !("misconception" in choice)) {
          choice.misconception_text = fallback;
        }
        if ("misconception" in choice) {
          choice.misconception = fallback;
        }
        rollbackApplied += 1;
      });
    }
  }

  return {
    safeApplied,
    safeAlreadyCorrect,
    rollbackApplied,
    riskySourceSkipped,
    missingPartLabel,
    missingPartMisconception,
    missingBaselineFallback,
    matchedQuestions,
    riskyRows,
  };
}

function updateJsonFile(jsonPath, partsMap, baselineMap) {
  if (!fs.existsSync(jsonPath)) {
    return {
      file: jsonPath,
      skipped: true,
      safeApplied: 0,
      safeAlreadyCorrect: 0,
      rollbackApplied: 0,
      riskySourceSkipped: 0,
      missingPartLabel: 0,
      missingPartMisconception: 0,
      missingBaselineFallback: 0,
      matchedQuestions: 0,
      riskyRows: [],
    };
  }

  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const result = applyMapToPayload(payload, partsMap, baselineMap);
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { file: jsonPath, ...result, skipped: false };
}

function writeReport(args) {
  const { reportPath, partsInfo, results } = args;
  const totals = results.reduce(
    (acc, row) => {
      acc.safeApplied += row.safeApplied;
      acc.safeAlreadyCorrect += row.safeAlreadyCorrect;
      acc.rollbackApplied += row.rollbackApplied;
      acc.riskySourceSkipped += row.riskySourceSkipped;
      acc.missingPartLabel += row.missingPartLabel;
      acc.missingPartMisconception += row.missingPartMisconception;
      acc.missingBaselineFallback += row.missingBaselineFallback;
      return acc;
    },
    {
      safeApplied: 0,
      safeAlreadyCorrect: 0,
      rollbackApplied: 0,
      riskySourceSkipped: 0,
      missingPartLabel: 0,
      missingPartMisconception: 0,
      missingBaselineFallback: 0,
    }
  );

  const riskyExamples = results.flatMap((row) =>
    row.riskyRows.slice(0, 20).map((r) => ({
      file: row.file,
      ...r,
    }))
  );

  const lines = [
    "# Misconception Sync Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Sources",
    "",
    `- Parts directory files: ${partsInfo.partFiles.length}`,
    `- Baseline readable file: \`diagnostic-v2-readable.md\``,
    "",
    "## Totals",
    "",
    `- Safe applied from readable parts: ${totals.safeApplied}`,
    `- Already matching safe rows: ${totals.safeAlreadyCorrect}`,
    `- Rollback applied from baseline (risky rows): ${totals.rollbackApplied}`,
    `- Risky source rows skipped: ${totals.riskySourceSkipped}`,
    `- Missing label in parts: ${totals.missingPartLabel}`,
    `- Missing misconception line in parts: ${totals.missingPartMisconception}`,
    `- Missing baseline fallback: ${totals.missingBaselineFallback}`,
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
      lines.push(`- Safe applied: ${row.safeApplied}`);
      lines.push(`- Already safe-match: ${row.safeAlreadyCorrect}`);
      lines.push(`- Rollback applied: ${row.rollbackApplied}`);
      lines.push(`- Risky rows skipped: ${row.riskySourceSkipped}`);
      lines.push(`- Missing part label: ${row.missingPartLabel}`);
      lines.push(
        `- Missing part misconception: ${row.missingPartMisconception}`
      );
      lines.push(`- Missing baseline fallback: ${row.missingBaselineFallback}`);
    }
    lines.push("");
  }

  lines.push("## Risky Examples");
  lines.push("");
  if (riskyExamples.length === 0) {
    lines.push("- None");
  } else {
    for (const row of riskyExamples.slice(0, 20)) {
      lines.push(
        `- ${row.questionId} [${row.label}] (${row.reason}) in \`${row.file}\``
      );
      lines.push(`  - Source choice text: ${row.sourceChoiceText}`);
      lines.push(`  - Live choice text: ${row.liveChoiceText}`);
    }
  }
  lines.push("");

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

function main() {
  const root = process.cwd();
  const partsDir = path.join(root, "readable");
  const fullReadablePath = path.join(root, "diagnostic-v2-readable.md");
  const reportPath = path.join(root, "readable", "misconception-sync-report.md");

  const partsInfo = loadReadableParts(partsDir);
  const baselineMap = loadReadableBaseline(fullReadablePath);

  const targets = [
    path.join(root, "Diagnostic V2", "web", "public", "diagnostic_v2", "mastery_data.json"),
    path.join(root, "public", "diagnostic_v2", "mastery_data.json"),
  ];

  const results = targets.map((target) =>
    updateJsonFile(target, partsInfo.map, baselineMap)
  );

  writeReport({
    reportPath,
    partsInfo,
    results,
  });

  for (const result of results) {
    if (result.skipped) {
      console.log(`[skip] Missing file: ${result.file}`);
      continue;
    }
    console.log(
      `[ok] ${result.file} -> safeApplied=${result.safeApplied}, safeAlreadyCorrect=${result.safeAlreadyCorrect}, rollbackApplied=${result.rollbackApplied}, riskySourceSkipped=${result.riskySourceSkipped}`
    );
  }
  console.log(`[report] ${reportPath}`);
}

main();
