import fs from "node:fs";
import path from "node:path";

function uniq(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (!item || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function text(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim();
}

function oneLine(value) {
  return text(value).replace(/\s+/g, " ");
}

function toChoiceLabel(idx, choice) {
  if (choice?.label) return String(choice.label);
  return String.fromCharCode(65 + idx);
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function formatStandardHeader(standardId, meta, questionCount) {
  const grade = meta?.grade !== undefined && meta?.grade !== null ? `Grade ${meta.grade}` : "Grade N/A";
  return `### Standard ${standardId} (${grade}) - ${questionCount} question${questionCount === 1 ? "" : "s"}`;
}

function getVisualSummary(visualHtml) {
  const raw = text(visualHtml);
  if (!raw) return "None";
  const srcMatch = raw.match(/src=\"([^\"]+)\"/i);
  if (srcMatch?.[1]) return `Image: ${srcMatch[1]}`;
  return "Inline visual HTML present";
}

function buildMarkdown(payload, sourcePath) {
  const topics = Array.isArray(payload.topics) ? payload.topics : [];
  const standardsIndex = payload.standards_index ?? {};
  const questionBank = payload.question_bank ?? {};

  const totalQuestions = Object.values(questionBank).reduce((sum, list) => {
    return sum + (Array.isArray(list) ? list.length : 0);
  }, 0);

  const lines = [];
  lines.push("# Diagnostic V2 Question Bank (Readable Export)");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Source: \`${sourcePath}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Topics: ${topics.length}`);
  lines.push(`- Standards in index: ${Object.keys(standardsIndex).length}`);
  lines.push(`- Questions in bank: ${totalQuestions}`);
  lines.push("");
  lines.push("## Full Content");
  lines.push("");

  topics.forEach((topic, topicIdx) => {
    const moduleName = oneLine(topic?.module) || `Module ${topicIdx + 1}`;
    const topicId = oneLine(topic?.topic_id) || `topic-${topicIdx + 1}`;
    const topicTitle = oneLine(topic?.topic_title) || `Topic ${topicIdx + 1}`;

    const powerStandards = uniq((topic?.power_available_standards ?? []).map((s) => oneLine(s)));
    const challengeStandards = uniq((topic?.challenge_available_standards ?? []).map((s) => oneLine(s)));
    const allStandards = uniq([...powerStandards, ...challengeStandards]);

    lines.push(`## ${moduleName} - ${topicTitle}`);
    lines.push("");
    lines.push(`- Topic ID: ${topicId}`);
    lines.push(`- Power standards: ${powerStandards.length ? powerStandards.join(", ") : "None"}`);
    lines.push(`- Challenge standards: ${challengeStandards.length ? challengeStandards.join(", ") : "None"}`);
    lines.push("");

    if (allStandards.length === 0) {
      lines.push("_No standards mapped for this topic._");
      lines.push("");
      return;
    }

    allStandards.forEach((standardId) => {
      const meta = standardsIndex[standardId] ?? {};
      const questions = Array.isArray(questionBank[standardId]) ? questionBank[standardId] : [];
      lines.push(formatStandardHeader(standardId, meta, questions.length));
      lines.push("");

      const statement = oneLine(meta?.standard_statement);
      if (statement) {
        lines.push(`**Standard Statement:** ${statement}`);
        lines.push("");
      }

      if (questions.length === 0) {
        lines.push("_No questions for this standard._");
        lines.push("");
        return;
      }

      questions.forEach((q, qIdx) => {
        const qid = oneLine(q?.question_id) || `${standardId}-${qIdx + 1}`;
        const stem = text(q?.stem);
        const explanation = text(q?.explanation);
        const choices = Array.isArray(q?.choices) ? q.choices : [];

        lines.push(`#### Q${qIdx + 1} - ${qid}`);
        lines.push("");
        lines.push(`**Prompt:** ${stem || "[No prompt text]"}`);
        lines.push("");
        lines.push(`**Visual:** ${getVisualSummary(q?.visual_html)}`);
        lines.push("");
        lines.push("**Choices:**");

        let correctChoices = [];
        choices.forEach((choice, choiceIdx) => {
          const label = toChoiceLabel(choiceIdx, choice);
          const choiceText = text(choice?.text) || "[No choice text]";
          const isCorrect = Boolean(choice?.correct);
          const status = isCorrect ? "[CORRECT]" : "[WRONG]";
          lines.push(`- ${label}. ${choiceText} ${status}`);
          if (!isCorrect) {
            const misconception = text(choice?.misconception_text ?? choice?.misconception);
            if (misconception) {
              lines.push(`  - Misconception: ${misconception}`);
            }
          } else {
            correctChoices.push(`${label}. ${choiceText}`);
          }
        });

        if (choices.length === 0) {
          lines.push("- [No choices]");
        }

        lines.push("");
        lines.push(`**Correct Answer(s):** ${correctChoices.length ? correctChoices.join(" | ") : "None marked"}`);
        lines.push("");
        lines.push(`**Explanation:** ${explanation || "[No explanation]"}`);
        lines.push("");
      });
    });
  });

  return `${lines.join("\n").trim()}\n`;
}

function main() {
  const sourceArg = process.argv[2] ?? "public/diagnostic_v2/mastery_data.json";
  const outArg = process.argv[3] ?? "diagnostic-v2-readable.md";
  const sourcePath = path.resolve(sourceArg);
  const outPath = path.resolve(outArg);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source JSON not found: ${sourcePath}`);
  }

  const payload = loadJson(sourcePath);
  const markdown = buildMarkdown(payload, sourcePath);
  fs.writeFileSync(outPath, markdown, "utf8");

  const questionBank = payload.question_bank ?? {};
  const totalQuestions = Object.values(questionBank).reduce((sum, list) => {
    return sum + (Array.isArray(list) ? list.length : 0);
  }, 0);

  console.log(`Wrote ${outPath}`);
  console.log(`Questions exported: ${totalQuestions}`);
}

main();
