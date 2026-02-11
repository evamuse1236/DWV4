import fs from "node:fs";
import path from "node:path";

function readLines(filePath) {
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/);
}

function partIndex(fileName) {
  const match = fileName.match(/^diagnostic-part-(\d+)\.md$/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function loadMisconceptionMap(partsDir) {
  const partFiles = fs
    .readdirSync(partsDir)
    .filter((name) => /^diagnostic-part-\d+\.md$/.test(name))
    .sort((a, b) => partIndex(a) - partIndex(b));

  if (partFiles.length === 0) {
    throw new Error(`No readable parts found in: ${partsDir}`);
  }

  const byQuestion = new Map();

  for (const partFile of partFiles) {
    const fullPath = path.join(partsDir, partFile);
    const lines = readLines(fullPath);

    let currentQuestionId = null;
    let pendingWrongChoiceLabel = null;

    for (const line of lines) {
      const questionMatch = line.match(/^#### Q\d+ - (.+)\s*$/);
      if (questionMatch) {
        currentQuestionId = questionMatch[1].trim();
        pendingWrongChoiceLabel = null;
        continue;
      }

      const choiceMatch = line.match(/^- ([A-Z])\. .+ \[(CORRECT|WRONG)\]\s*$/);
      if (choiceMatch) {
        pendingWrongChoiceLabel =
          choiceMatch[2] === "WRONG" ? choiceMatch[1] : null;
        continue;
      }

      const misconceptionMatch = line.match(/^  - Misconception:\s*(.+)\s*$/);
      if (
        misconceptionMatch &&
        currentQuestionId &&
        pendingWrongChoiceLabel
      ) {
        if (!byQuestion.has(currentQuestionId)) {
          byQuestion.set(currentQuestionId, new Map());
        }
        byQuestion
          .get(currentQuestionId)
          .set(pendingWrongChoiceLabel, misconceptionMatch[1].trim());
        pendingWrongChoiceLabel = null;
      }
    }
  }

  return byQuestion;
}

function toChoiceLabel(choice, index) {
  if (choice?.label) return String(choice.label).trim();
  return String.fromCharCode(65 + index);
}

function applyMapToPayload(payload, misconceptionMap) {
  const questionBank = payload?.question_bank ?? {};
  let updatedChoices = 0;
  let matchedQuestions = 0;

  for (const questions of Object.values(questionBank)) {
    if (!Array.isArray(questions)) continue;

    for (const question of questions) {
      const questionId = String(question?.question_id ?? "").trim();
      if (!questionId || !misconceptionMap.has(questionId)) continue;

      const labelMap = misconceptionMap.get(questionId);
      matchedQuestions += 1;

      if (!Array.isArray(question.choices)) continue;
      question.choices.forEach((choice, index) => {
        if (choice?.correct) return;
        const label = toChoiceLabel(choice, index);
        const replacement = labelMap.get(label);
        if (!replacement) return;

        const current = String(
          choice?.misconception_text ?? choice?.misconception ?? ""
        ).trim();
        if (current === replacement) return;

        if ("misconception_text" in choice || !("misconception" in choice)) {
          choice.misconception_text = replacement;
        }
        if ("misconception" in choice) {
          choice.misconception = replacement;
        }
        updatedChoices += 1;
      });
    }
  }

  return { updatedChoices, matchedQuestions };
}

function updateJsonFile(jsonPath, misconceptionMap) {
  if (!fs.existsSync(jsonPath)) {
    return { file: jsonPath, updatedChoices: 0, matchedQuestions: 0, skipped: true };
  }

  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const result = applyMapToPayload(payload, misconceptionMap);
  fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { file: jsonPath, ...result, skipped: false };
}

function main() {
  const root = process.cwd();
  const partsDir = path.join(root, "readable");
  const misconceptionMap = loadMisconceptionMap(partsDir);

  const targets = [
    path.join(root, "Diagnostic V2", "web", "public", "diagnostic_v2", "mastery_data.json"),
    path.join(root, "public", "diagnostic_v2", "mastery_data.json"),
  ];

  const results = targets.map((target) =>
    updateJsonFile(target, misconceptionMap)
  );

  for (const result of results) {
    if (result.skipped) {
      console.log(`[skip] Missing file: ${result.file}`);
      continue;
    }
    console.log(
      `[ok] ${result.file} -> updated choices: ${result.updatedChoices}, matched questions: ${result.matchedQuestions}`
    );
  }
}

main();
