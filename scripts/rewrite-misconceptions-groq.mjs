import fs from "node:fs";
import path from "node:path";

const DEFAULT_PRIMARY_MODEL = "moonshotai/kimi-k2-instruct-0905";
const DEFAULT_FALLBACK_MODEL = "moonshotai/kimi-k2-instruct";
const DEFAULT_BATCH_SIZE = 12;
const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_TIMEOUT_MS = 90_000;

function parseArgs(argv) {
  const out = {
    source: path.join("public", "diagnostic_v2", "mastery_data.json"),
    mirrors: [path.join("Diagnostic V2", "web", "public", "diagnostic_v2", "mastery_data.json")],
    report: path.join("readable", "misconception-groq-rewrite-report.md"),
    batchSize: DEFAULT_BATCH_SIZE,
    limit: null,
    dryRun: false,
    primaryModel: DEFAULT_PRIMARY_MODEL,
    fallbackModel: DEFAULT_FALLBACK_MODEL,
    maxRetries: DEFAULT_MAX_RETRIES,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    targetKeysFile: null,
    allowMissingNumericTokens: false,
    allowAddedNumericTokens: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") out.source = String(argv[++i] ?? out.source);
    else if (arg === "--mirrors") {
      const raw = String(argv[++i] ?? "");
      out.mirrors = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg === "--report") out.report = String(argv[++i] ?? out.report);
    else if (arg === "--batch-size") out.batchSize = Number(argv[++i] ?? out.batchSize);
    else if (arg === "--limit") out.limit = Number(argv[++i] ?? 0);
    else if (arg === "--dry-run") out.dryRun = true;
    else if (arg === "--primary-model") out.primaryModel = String(argv[++i] ?? out.primaryModel);
    else if (arg === "--fallback-model") out.fallbackModel = String(argv[++i] ?? out.fallbackModel);
    else if (arg === "--max-retries") out.maxRetries = Number(argv[++i] ?? out.maxRetries);
    else if (arg === "--timeout-ms") out.timeoutMs = Number(argv[++i] ?? out.timeoutMs);
    else if (arg === "--target-keys-file")
      out.targetKeysFile = String(argv[++i] ?? out.targetKeysFile);
    else if (arg === "--allow-missing-numeric-tokens") out.allowMissingNumericTokens = true;
    else if (arg === "--allow-added-numeric-tokens") out.allowAddedNumericTokens = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  if (!Number.isFinite(out.batchSize) || out.batchSize <= 0) {
    throw new Error(`Invalid --batch-size: ${out.batchSize}`);
  }
  if (out.limit != null && (!Number.isFinite(out.limit) || out.limit <= 0)) {
    out.limit = null;
  }
  if (!Number.isFinite(out.maxRetries) || out.maxRetries <= 0) {
    throw new Error(`Invalid --max-retries: ${out.maxRetries}`);
  }
  if (!Number.isFinite(out.timeoutMs) || out.timeoutMs <= 0) {
    throw new Error(`Invalid --timeout-ms: ${out.timeoutMs}`);
  }

  return out;
}

function printHelp() {
  console.log(`Rewrite misconception text with Groq models (batched, with fallback + retries).

Usage:
  node scripts/rewrite-misconceptions-groq.mjs [options]

Required env:
  GROQ_API_KEY=...

Options:
  --source <path>           Source JSON (default: public/diagnostic_v2/mastery_data.json)
  --mirrors <csv>           Comma-separated mirror JSONs to apply same rewrites
  --report <path>           Report path (default: readable/misconception-groq-rewrite-report.md)
  --batch-size <n>          Batch size per API call (default: ${DEFAULT_BATCH_SIZE})
  --limit <n>               Process first n wrong-choice misconceptions only
  --dry-run                 No file writes (API still called)
  --primary-model <name>    Primary model (default: ${DEFAULT_PRIMARY_MODEL})
  --fallback-model <name>   Fallback model (default: ${DEFAULT_FALLBACK_MODEL})
  --max-retries <n>         Retries per model per batch (default: ${DEFAULT_MAX_RETRIES})
  --timeout-ms <n>          Request timeout (default: ${DEFAULT_TIMEOUT_MS})
  --target-keys-file <path> Rewrite only keys listed (one key per line)
  --allow-missing-numeric-tokens
                            Relax safety: allow model output to omit source numeric tokens
  --allow-added-numeric-tokens
                            Relax safety: allow model output to introduce numeric tokens
`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, payload) {
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function normalizeText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function choiceLabel(choice, index) {
  return String(choice?.label ?? String.fromCharCode(65 + index));
}

function keyFor(standardId, questionId, label) {
  return `${standardId}::${questionId}::${label}`;
}

function extractRows(payload) {
  const rows = [];
  const questionBank = payload?.question_bank ?? {};

  for (const [standardId, questions] of Object.entries(questionBank)) {
    if (!Array.isArray(questions)) continue;
    for (const question of questions) {
      const questionId = String(question?.question_id ?? "").trim();
      if (!questionId) continue;
      const choices = Array.isArray(question?.choices) ? question.choices : [];
      const correct = choices.find((c) => c?.correct);
      const correctText = normalizeText(correct?.text ?? "");
      const stem = normalizeText(question?.stem ?? "");

      choices.forEach((choice, index) => {
        if (choice?.correct) return;
        const label = choiceLabel(choice, index);
        const sourceMisconception = normalizeText(
          choice?.misconception_text ?? choice?.misconception ?? ""
        );
        if (!sourceMisconception) return;
        rows.push({
          key: keyFor(standardId, questionId, label),
          standardId,
          questionId,
          label,
          stem,
          wrongChoiceText: normalizeText(choice?.text ?? ""),
          correctChoiceText: correctText,
          sourceMisconception,
        });
      });
    }
  }

  return rows;
}

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(value) {
  if (!value) return null;
  const asSeconds = Number(value);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.max(0, Math.round(asSeconds * 1000));
  }
  const asDate = Date.parse(String(value));
  if (Number.isFinite(asDate)) {
    return Math.max(0, asDate - Date.now());
  }
  return null;
}

function safeJsonParse(text) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Attempt fenced JSON extraction.
    const match = raw.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
}

function numericTokens(text) {
  const raw =
    String(text ?? "").match(
      /-?(?:(?:\d[\d,]*)(?:\.\d+)?|\.\d+)(?:\/(?:(?:\d[\d,]*)(?:\.\d+)?|\.\d+))?/g
    ) ?? [];
  return new Set(raw.map(normalizeNumericToken).filter(Boolean));
}

function normalizeNumericToken(token) {
  const trimmed = String(token ?? "").trim();
  if (!trimmed) return "";
  if (!trimmed.includes("/")) {
    return normalizeNumericPart(trimmed);
  }
  const [a, b] = trimmed.split("/");
  const left = normalizeNumericPart(a);
  const right = normalizeNumericPart(b);
  if (!left || !right) return "";
  return `${left}/${right}`;
}

function normalizeNumericPart(part) {
  let out = String(part ?? "").trim().replace(/,/g, "");
  if (!out) return "";
  if (out.startsWith("-.")) out = `-0${out.slice(1)}`;
  else if (out.startsWith(".")) out = `0${out}`;
  const num = Number(out);
  if (!Number.isFinite(num)) return out;
  return String(num);
}

function countWords(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function sentenceWordCounts(text) {
  let protectedDecimals = String(text ?? "");
  protectedDecimals = protectedDecimals.replace(/(\d)\.(\d)/g, "$1__DOT__$2");
  protectedDecimals = protectedDecimals.replace(/(^|[^\d])\.(\d)/g, "$1__DOT__$2");
  return protectedDecimals
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => countWords(s.replace(/__DOT__/g, ".")));
}

function ensureWarmStart(text) {
  const trimmed = normalizeText(text);
  if (!trimmed) return "";
  if (/^nice try[.!]/i.test(trimmed)) return trimmed;
  return normalizeText(`Nice try. ${trimmed}`);
}

function validateRewrite(source, candidate, options) {
  const { allowMissingNumericTokens = false, allowAddedNumericTokens = false } = options ?? {};
  const clean = ensureWarmStart(candidate);
  if (!clean) return { ok: false, text: source, reason: "empty_candidate" };
  if (clean.length > 480) return { ok: false, text: source, reason: "too_long" };

  const totalWords = countWords(clean);
  if (totalWords > 65) return { ok: false, text: source, reason: "too_many_words" };

  const perSentence = sentenceWordCounts(clean);
  if (perSentence.length === 0 || perSentence.length > 3) {
    return { ok: false, text: source, reason: "sentence_count_out_of_range" };
  }
  if (perSentence.some((n) => n > 24)) {
    return { ok: false, text: source, reason: "sentence_too_long" };
  }

  const sourceNums = numericTokens(source);
  const rewrittenNums = numericTokens(clean);
  if (!allowMissingNumericTokens && sourceNums.size > 0) {
    for (const token of sourceNums) {
      if (!rewrittenNums.has(token)) {
        return { ok: false, text: source, reason: "missing_numeric_token" };
      }
    }
  }
  if (!allowAddedNumericTokens) {
    for (const token of rewrittenNums) {
      if (!sourceNums.has(token)) {
        return { ok: false, text: source, reason: "added_numeric_token" };
      }
    }
  }

  return { ok: true, text: clean, reason: null };
}

function buildMessages(batch) {
  const systemPrompt = [
    "You are an expert middle-school math feedback editor.",
    "Rewrite misconception feedback in a warm, friendly, reassuring tone for ages 10-13.",
    "Use very simple words and short sentences that are easy to understand quickly.",
    "Use standard math words: add, subtract, multiply, divide, place value, decimal.",
    "Do not invent words.",
    "Do not change mathematical meaning, facts, direction, numbers, operations, symbols, or correctness logic.",
    "Do not introduce any new numbers or new examples.",
    "Keep each rewritten feedback to 1-3 short sentences and <= 65 words.",
    "Keep each sentence concise, around 24 words max.",
    "Always begin each rewritten feedback with: Nice try.",
    "Do not add markdown, bullets, labels, or extra commentary.",
    "Return JSON only with this shape: {\"items\":[{\"id\":\"...\",\"text\":\"...\"}]}",
    "Do not omit any item.",
  ].join(" ");

  const userPayload = {
    task: "Rewrite misconception feedback while preserving exact math intent.",
    items: batch.map((row) => ({
      id: row.key,
      misconception: row.sourceMisconception,
    })),
  };

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: JSON.stringify(userPayload) },
  ];
}

async function callGroq(args) {
  const { apiKey, model, batch, timeoutMs } = args;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: buildMessages(batch),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      const err = new Error(`Groq ${response.status}: ${body.slice(0, 500)}`);
      err.status = response.status;
      err.retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
      err.retryable = response.status === 429 || response.status >= 500;
      throw err;
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    const parsed = safeJsonParse(content);
    if (!parsed || !Array.isArray(parsed.items)) {
      const err = new Error("Model response did not contain valid JSON items array.");
      err.retryable = true;
      throw err;
    }

    const out = new Map();
    for (const item of parsed.items) {
      const id = String(item?.id ?? "").trim();
      const text = normalizeText(item?.text ?? "");
      if (!id || !text) continue;
      out.set(id, text);
    }
    return out;
  } catch (error) {
    if (error?.name === "AbortError") {
      const err = new Error("Groq request timed out.");
      err.retryable = true;
      throw err;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function rewriteBatchWithFallback(args) {
  const { apiKey, batch, primaryModel, fallbackModel, maxRetries, timeoutMs } = args;
  const models = [primaryModel, fallbackModel].filter(Boolean);
  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      try {
        const result = await callGroq({ apiKey, model, batch, timeoutMs });
        return { model, result, attempts: attempt };
      } catch (error) {
        lastError = error;
        const retryable = Boolean(error?.retryable);
        const isLastAttempt = attempt === maxRetries;
        if (!retryable || isLastAttempt) break;

        const retryAfterMs = Number(error?.retryAfterMs ?? 0);
        const backoffMs = Math.min(30_000, 1_200 * 2 ** (attempt - 1));
        const jitterMs = Math.floor(Math.random() * 600);
        const waitMs = Math.max(retryAfterMs, backoffMs + jitterMs);
        console.log(
          `[retry] model=${model} attempt=${attempt}/${maxRetries} waiting ${waitMs}ms (${error.message})`
        );
        await sleep(waitMs);
      }
    }
    if (fallbackModel && model !== fallbackModel) {
      console.log(`[fallback] switching model: ${model} -> ${fallbackModel}`);
    }
  }

  throw lastError ?? new Error("Failed to rewrite batch.");
}

function applyRewritesToPayload(payload, rewriteMap) {
  const questionBank = payload?.question_bank ?? {};
  let changed = 0;
  let found = 0;

  for (const [standardId, questions] of Object.entries(questionBank)) {
    if (!Array.isArray(questions)) continue;
    for (const question of questions) {
      const questionId = String(question?.question_id ?? "").trim();
      if (!questionId) continue;
      const choices = Array.isArray(question?.choices) ? question.choices : [];
      choices.forEach((choice, index) => {
        if (choice?.correct) return;
        const key = keyFor(standardId, questionId, choiceLabel(choice, index));
        if (!rewriteMap.has(key)) return;
        found += 1;
        const next = rewriteMap.get(key);
        const current = normalizeText(choice?.misconception_text ?? choice?.misconception ?? "");
        if (next === current) return;
        if ("misconception_text" in choice || !("misconception" in choice)) {
          choice.misconception_text = next;
        }
        if ("misconception" in choice) {
          choice.misconception = next;
        }
        changed += 1;
      });
    }
  }

  return { changed, found };
}

function writeReport(args) {
  const {
    reportPath,
    sourcePath,
    mirrorPaths,
    processedRows,
    rewrittenRows,
    unchangedRows,
    rejectedRows,
    rejectedByReason,
    rejectionSamples,
    missingRows,
    modelUsage,
    sourceChanged,
    mirrorResults,
    dryRun,
    samplePairs,
  } = args;

  const lines = [
    "# Groq Misconception Rewrite Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Run Config",
    "",
    `- Source: \`${sourcePath}\``,
    `- Mirrors: ${mirrorPaths.length ? mirrorPaths.map((p) => `\`${p}\``).join(", ") : "None"}`,
    `- Dry run: ${dryRun ? "yes" : "no"}`,
    "",
    "## Totals",
    "",
    `- Rows processed: ${processedRows}`,
    `- Rewritten rows accepted: ${rewrittenRows}`,
    `- Unchanged rows: ${unchangedRows}`,
    `- Rejected rows (safety validation): ${rejectedRows}`,
    `- Missing rows from model output: ${missingRows}`,
    "",
    "## Apply Results",
    "",
    `- Source rows changed on disk: ${sourceChanged}`,
  ];

  for (const row of mirrorResults) {
    lines.push(`- Mirror \`${row.path}\`: found=${row.found}, changed=${row.changed}, skipped=${row.skipped}`);
  }

  lines.push("");
  lines.push("## Rejection Reasons");
  lines.push("");
  const reasonEntries = Object.entries(rejectedByReason ?? {}).sort((a, b) => b[1] - a[1]);
  if (reasonEntries.length === 0) {
    lines.push("- None");
  } else {
    for (const [reason, count] of reasonEntries) {
      lines.push(`- ${reason}: ${count}`);
    }
  }

  lines.push("");
  lines.push("## Model Usage");
  lines.push("");
  for (const [model, count] of Object.entries(modelUsage)) {
    lines.push(`- ${model}: ${count} batches`);
  }

  lines.push("");
  lines.push("## Rejection Samples");
  lines.push("");
  if ((rejectionSamples ?? []).length === 0) {
    lines.push("- None");
  } else {
    for (const row of rejectionSamples.slice(0, 10)) {
      lines.push(`- ${row.key} (${row.reason})`);
      lines.push(`  - Source: ${row.before}`);
      lines.push(`  - Model: ${row.modelOutput}`);
    }
  }

  lines.push("");
  lines.push("## Sample Rewrites");
  lines.push("");

  if (samplePairs.length === 0) {
    lines.push("- None");
  } else {
    for (const pair of samplePairs.slice(0, 20)) {
      lines.push(`- ${pair.key}`);
      lines.push(`  - Before: ${pair.before}`);
      lines.push(`  - After: ${pair.after}`);
    }
  }
  lines.push("");

  fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in environment.");
  }

  if (!fs.existsSync(args.source)) {
    throw new Error(`Source file not found: ${args.source}`);
  }

  const sourcePayload = readJson(args.source);
  let rows = extractRows(sourcePayload);
  if (args.targetKeysFile) {
    if (!fs.existsSync(args.targetKeysFile)) {
      throw new Error(`Target keys file not found: ${args.targetKeysFile}`);
    }
    const targetKeys = new Set(
      fs
        .readFileSync(args.targetKeysFile, "utf8")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    );
    rows = rows.filter((row) => targetKeys.has(row.key));
  }
  if (args.limit != null) {
    rows = rows.slice(0, args.limit);
  }
  if (rows.length === 0) {
    throw new Error("No misconception rows found to rewrite.");
  }

  const batches = chunk(rows, args.batchSize);
  const rewriteMap = new Map();
  const modelUsage = {};
  let rejectedRows = 0;
  let missingRows = 0;
  let rewrittenRows = 0;
  let unchangedRows = 0;
  const rejectedByReason = {};
  const rejectionSamples = [];
  const samplePairs = [];

  console.log(
    `[start] rows=${rows.length}, batches=${batches.length}, primary=${args.primaryModel}, fallback=${args.fallbackModel}`
  );

  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i];
    console.log(`[batch ${i + 1}/${batches.length}] size=${batch.length}`);
    const { model, result, attempts } = await rewriteBatchWithFallback({
      apiKey,
      batch,
      primaryModel: args.primaryModel,
      fallbackModel: args.fallbackModel,
      maxRetries: args.maxRetries,
      timeoutMs: args.timeoutMs,
    });
    modelUsage[model] = (modelUsage[model] ?? 0) + 1;
    console.log(`[batch ${i + 1}/${batches.length}] model=${model} attempts=${attempts} done`);

    for (const row of batch) {
      const candidate = result.get(row.key);
      if (!candidate) {
        rewriteMap.set(row.key, row.sourceMisconception);
        missingRows += 1;
        unchangedRows += 1;
        continue;
      }

      const validation = validateRewrite(row.sourceMisconception, candidate, {
        allowMissingNumericTokens: args.allowMissingNumericTokens,
        allowAddedNumericTokens: args.allowAddedNumericTokens,
      });
      if (!validation.ok) {
        rewriteMap.set(row.key, row.sourceMisconception);
        rejectedRows += 1;
        unchangedRows += 1;
        rejectedByReason[validation.reason] = (rejectedByReason[validation.reason] ?? 0) + 1;
        if (rejectionSamples.length < 20) {
          rejectionSamples.push({
            key: row.key,
            reason: validation.reason,
            before: row.sourceMisconception,
            modelOutput: normalizeText(candidate),
          });
        }
        continue;
      }

      rewriteMap.set(row.key, validation.text);
      if (validation.text === row.sourceMisconception) {
        unchangedRows += 1;
      } else {
        rewrittenRows += 1;
        if (samplePairs.length < 20) {
          samplePairs.push({
            key: row.key,
            before: row.sourceMisconception,
            after: validation.text,
          });
        }
      }
    }
  }

  const sourceResult = applyRewritesToPayload(sourcePayload, rewriteMap);

  const mirrorResults = [];
  for (const mirrorPath of args.mirrors) {
    if (!mirrorPath || mirrorPath === args.source) continue;
    if (!fs.existsSync(mirrorPath)) {
      mirrorResults.push({ path: mirrorPath, skipped: true, changed: 0, found: 0 });
      continue;
    }
    const mirrorPayload = readJson(mirrorPath);
    const applied = applyRewritesToPayload(mirrorPayload, rewriteMap);
    mirrorResults.push({ path: mirrorPath, skipped: false, ...applied });
    if (!args.dryRun) {
      writeJson(mirrorPath, mirrorPayload);
    }
  }

  if (!args.dryRun) {
    writeJson(args.source, sourcePayload);
  }

  writeReport({
    reportPath: args.report,
    sourcePath: args.source,
    mirrorPaths: args.mirrors,
    processedRows: rows.length,
    rewrittenRows,
    unchangedRows,
    rejectedRows,
    rejectedByReason,
    rejectionSamples,
    missingRows,
    modelUsage,
    sourceChanged: sourceResult.changed,
    mirrorResults,
    dryRun: args.dryRun,
    samplePairs,
  });

  console.log(
    `[done] processed=${rows.length} rewritten=${rewrittenRows} unchanged=${unchangedRows} rejected=${rejectedRows} missing=${missingRows}`
  );
  console.log(`[write] report=${args.report}`);
  if (args.dryRun) {
    console.log("[write] dry-run enabled, files unchanged");
  } else {
    console.log(`[write] source changed rows=${sourceResult.changed}`);
    for (const row of mirrorResults) {
      console.log(
        `[write] mirror=${row.path} changed=${row.changed} found=${row.found} skipped=${row.skipped}`
      );
    }
  }
}

main().catch((err) => {
  console.error(`[error] ${err?.message || err}`);
  process.exit(1);
});
