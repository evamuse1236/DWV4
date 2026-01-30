# Diagnostic Answer Correction Log

## Problem

The EEDI API returns `correctAnswer: 0` for all Common Core "flat format" questions, causing every answer to default to "A". This is an EEDI API bug — NOT fixable from our scraper (`tools/eedi_discover_collections.py:321-324`).

## Dataset

- **8,520 question instances** across 852 raw topic JSON files
- **7,230 unique questions** (some appear in multiple topics)
- **5,700 questions** in the final build (19 modules)
- Files: `data/eedi/raw/*/topics/*.json`

---

## How It Works

### The Core Insight

Each EEDI question has 4 answer choices (A/B/C/D), each with an **explanation**. The explanations follow predictable patterns:

- **Correct answer** explanations: affirm the student ("Correct!", "Well done!", "That's right"), provide the full worked solution without correction
- **Wrong answer** explanations: redirect ("actually...", "but...", "the correct answer is..."), point out errors, use corrective language ("you need to...", "remember that...")

Since the API bug zeroed out `correctAnswer`, we used LLMs to read all 4 explanations per question and identify which one affirms rather than corrects.

### Why Multiple Rounds

- **Round 1 (Haiku)**: Fast initial classification, but ~25% error rate. Haiku sometimes confused "teaching within a wrong answer" with affirmation.
- **Round 2 (Gemini)**: Cross-checked all answers. Found 293 more errors. Accuracy jumped to 90%.
- **Round 3 (Gemini, A-only)**: Targeted the highest-risk group (answers still "A" — most likely to be uncorrected defaults). Found 518 more. Accuracy reached 96%.
- **Round 4 (Gemini, non-A)**: Verified B/C/D answers. Found 229 more. Final accuracy: **98%**.

### Verification Method

EEDI CDN (`images.diagnosticquestions.com`) blocks non-browser requests (returns 404/BlobNotFound from curl/wget). Workaround:

1. Generate HTML pages with embedded `<img>` tags pointing to EEDI image URLs
2. Serve from scratchpad via `python3 -m http.server 8765`
3. Use Playwright browser automation to load pages (browser renders the images)
4. Screenshot each question, manually solve the math problem, compare to our stored answer
5. Sample 50 random questions per round (different seeds each time)

---

## Fix Pipeline

### Round 1: Haiku LLM Classification (commit `4b9be46`)

- Used Claude Haiku 4.5 to classify correct answers from explanation text
- Prompt told Haiku to identify which explanation affirms vs. corrects
- Ran 5 iterative rounds across all 7,230 questions in parallel batches
- Fixed ~3,500 questions
- **Estimated accuracy: ~75%**

### Round 2: Gemini Verification (commit `b9f3218`)

- Sent all 7,230 questions to Gemini CLI in 4 large batches (~1,800 each)
- Gemini found **293 additional misclassifications**
- Most common: A->C (63), A->B (51), A->D (40)
- **Verified accuracy: 90% (45/50 image-verified sample, seed 12345)**

### Round 3: Gemini A-Answer Re-check (commit `1568235`)

- Focused on 2,237 questions still answered "A" (highest risk — most likely uncorrected defaults)
- Split into 8 batches of ~280, piped to Gemini via stdin
- Found **518 additional corrections**
- Also fixed 5 errors found during Round 1 image verification
- Plus 2 non-A errors from Round 2 image verification (Q147007 B->D, Q132183 C->D)
- **Verified accuracy: 96% (48/50 image-verified sample, seed 42424242)**
- Answer distribution: A=24%, B=27%, C=26%, D=23%

### Round 4: Non-A Answer Verification (commit `87843ad`)

- Verified all 5,511 questions with B/C/D answers
- Split into 23 batches of ~250, sent 2 at a time to Gemini sequentially
- Found **229 unique corrections** (269 instances across 165 files)
- Correction sources: B->other (123), C->other (61), D->other (45)
- Correction targets: D (81), C (77), A (41), B (30)
- **Verified accuracy: 98% (49/50 image-verified sample, seed 98765)**
- 1 remaining error: Q166539 (B->A, "NOT" question about consecutive odd numbers)
- **Final answer distribution: A=24.6%, B=25.9%, C=25.6%, D=23.8%**

---

## Gemini Prompt (for reference)

The prompt used for non-A verification (A-answer prompt was similar but targeted "A" answers):

```
You are verifying math quiz answers. Each question has an assigned answer (B, C, or D) but some may be WRONG.

For each question you have: qid (question ID), answer (current assigned answer), img (image URL), explanations (text for A,B,C,D).

YOUR TASK: Read ALL four explanations carefully. The CORRECT answer's explanation:
- Affirms the student ("Correct!", "Well done", "That's right")
- Shows the proper worked solution without correction
- Does NOT start by correcting the student

WRONG answer explanations:
- Point out errors ("actually...", "but...", "the correct answer is...")
- Redirect to the correct method
- Use corrective language ("you need to...", "remember that...")

IMPORTANT: Wrong-answer explanations sometimes ALSO show the full correct solution (to teach). Don't confuse teaching within a wrong-answer explanation with it BEING correct. The key: does the explanation START by affirming or correcting?

If the assigned answer is genuinely correct, skip it.
If the assigned answer is WRONG, output: {"qid":<id>,"was":"<B|C|D>","correct":"<A|B|C|D>","reason":"<brief>"}

Output ONLY a JSON array of corrections. No markdown fences. No extra text. Just the JSON array [].
```

### Preparing Gemini Input Batches

Each batch is a JSON array of objects:
```json
[
  {
    "qid": 12345,
    "answer": "B",
    "img": "https://images.diagnosticquestions.com/...",
    "explanations": {"A": "...", "B": "...", "C": "...", "D": "..."}
  }
]
```

Built with Python: collect questions from `data/eedi/raw/*/topics/*.json`, filter by current answer, deduplicate by `questionId`, split into batches of ~250.

### Running Gemini

```bash
# Pipe data via stdin (avoids "Argument list too long" error)
cat batch.json | gemini -p "$(cat prompt.txt)" 2>&1 | tee result.json

# DO NOT use $(cat batch.json) in command substitution — exceeds shell arg limit
```

**Rate limiting**: Gemini may return 429 errors. The CLI auto-retries with short backoff (1-2s). Running 2 batches sequentially (not parallel) avoids most rate limits.

### Parsing Gemini Output

Gemini output includes preamble lines (credential loading, errors, etc.) before the JSON array. Parser strategy:
1. Look for JSON code blocks (`` ```json ... ``` ``)
2. Fall back to finding lines starting with `[` and tracking bracket depth
3. Deduplicate corrections by `qid`

### Applying Corrections

```python
import json, glob

# Load corrections
with open('corrections.json') as f:
    corrections = json.load(f)
fix_map = {c['qid']: c['correct'] for c in corrections}

# Apply to all raw topic files
for fpath in glob.glob('data/eedi/raw/*/topics/*.json'):
    with open(fpath) as f:
        data = json.load(f)
    modified = False
    for q in data.get('questions', []):
        if q['questionId'] in fix_map:
            new_answer = fix_map[q['questionId']]
            if q['correctAnswer'] != new_answer:
                q['correctAnswer'] = new_answer
                modified = True
    if modified:
        with open(fpath, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
```

**Critical**: `correctAnswer` must be a string ("A"/"B"/"C"/"D"), NOT an integer index.

### Rebuilding After Corrections

```python
# Rebuild data.js (run from diagnostic-check/)
import tools.build_ka_diagnostic as bk
from pathlib import Path
bk.ROOT = Path('.').resolve()
bk.EEDI_RAW = bk.ROOT / 'data' / 'eedi' / 'raw'
bk.OUTPUT_DIR = bk.ROOT
bk.main()
```

```bash
# Export to frontend (run from DW/)
cd /home/vishwa/WProjects/DW && node scripts/export-diagnostic-data.mjs
```

---

## Lessons Learned

1. **$(cat file) breaks for large inputs** — shell argument limit. Always pipe: `cat file | command`
2. **EEDI CDN blocks curl** — must use real browser (Playwright) to load question images
3. **"NOT" questions fool LLMs** — questions like "which does NOT show X" have inverted explanation patterns. The correct answer's explanation may sound corrective because it explains why the option doesn't fit. This is the main remaining error class.
4. **Batch size ~250 works well for Gemini** — larger batches risk truncation; smaller wastes API calls
5. **Run 2 batches sequentially, not parallel** — avoids rate limiting while still making progress
6. **Always verify with images** — text-only verification can't catch image-dependent errors. The Playwright + HTTP server approach works well.
7. **Multiple LLM rounds compound accuracy** — each round catches errors the previous one missed. Haiku->Gemini->Gemini(targeted) went from 75% -> 90% -> 96% -> 98%.

---

## Key Files

| File | Purpose |
|------|---------|
| `data/eedi/raw/*/topics/*.json` | Raw topic files with `correctAnswer` field (string: "A"/"B"/"C"/"D") |
| `data.js` | Built diagnostic data (9.1MB, 5,700 questions, 19 modules) |
| `tools/build_ka_diagnostic.py` | Build script — run with ROOT override (see above) |
| `tools/eedi_discover_collections.py` | Scraper (bug at lines 321-324, unfixable) |
| `scripts/export-diagnostic-data.mjs` | Exports `data.js` -> `public/diagnostic/diagnostic-data.json` |
| `/home/vishwa/WProjects/DW/public/diagnostic/diagnostic-data.json` | Frontend data file |

## Scratchpad Location

`/tmp/claude-1000/-home-vishwa-WProjects-DW-diagnostic-check/4a9ef687-29d0-49c9-8041-59e1186bd104/scratchpad/`

Key scratchpad files:
- `questions_answer_a.json` — 2,237 A-answer questions
- `gemini_a_batch_0-7.json` / `gemini_a_result_0-7.json` — A-answer Gemini I/O
- `gemini_a_all_corrections.json` — 518 merged A-answer corrections
- `gemini_nonA_batch_0-22.json` / `gemini_nonA_result_0-21.json` — Non-A Gemini I/O
- `gemini_nonA_all_corrections.json` — 229 merged non-A corrections
- `gemini_nonA_prompt.txt` — Prompt used for non-A verification
- `verify_r2_sample.json` — Round 2 verification sample (seed 42424242)
- `verify_r3_sample.json` — Round 4 verification sample (seed 98765)
- `verify_r2_batch_0-4.html` / `verify_r3_batch_0-4.html` — Verification HTML pages

## Commits

1. `4b9be46` — Round 1: Haiku LLM classification (5 rounds)
2. `b9f3218` — Round 2: Gemini verification (293 fixes)
3. `1568235` — Round 3: Gemini A-answer re-check (518+5+2 fixes)
4. `87843ad` — Round 4: Gemini non-A verification (229 corrections)

## Known Remaining Issues

- ~2% error rate (~144 of 7,230 questions may still be wrong)
- "NOT" questions (negated logic) are the primary remaining error class
- Q166539 confirmed wrong (B->A): "Which does NOT show sum of two consecutive odd numbers"
- To improve further: targeted pass on "NOT"/"EXCEPT" questions, or manual review
