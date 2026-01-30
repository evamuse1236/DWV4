# Diagnostic Answer Correction Log

## Problem

The EEDI API returns `correctAnswer: 0` for all Common Core "flat format" questions, causing every answer to default to "A". This is an EEDI API bug — NOT fixable from our scraper (`tools/eedi_discover_collections.py:321-324`).

## Dataset

- **8,520 question instances** across 852 raw topic JSON files
- **7,230 unique questions** (some appear in multiple topics)
- **5,700 questions** in the final build (19 modules)
- Files: `data/eedi/raw/*/topics/*.json`

## Fix Pipeline

### Round 1: Haiku LLM Classification (commit `4b9be46`)

- Used Claude Haiku to classify correct answers from explanation text
- Each answer's explanation has patterns: correct answers affirm ("Well done!", "Correct!"), wrong answers correct ("actually...", "but...", "the correct answer is...")
- Ran 5 iterative rounds across all 7,230 questions in parallel batches
- Fixed ~3,500 questions
- **Estimated accuracy: ~75%**

### Round 2: Gemini Verification (commit `b9f3218`)

- Sent all 7,230 questions to Gemini CLI in 4 large batches (~1,800 each)
- Gemini found **293 additional misclassifications**
- Most common: A→C (63), A→B (51), A→D (40)
- **Verified accuracy: 90% (45/50 image-verified sample)**

### Round 3: Gemini A-Answer Re-check (commit `1568235`)

- Focused on 2,237 questions still answered "A" (highest risk)
- Split into 8 batches of ~280, sent to Gemini via stdin pipe
- Found **518 additional corrections**
- Also fixed 5 errors found during Round 1 image verification
- Plus 2 non-A errors from Round 2 image verification
- **Verified accuracy: 96% (48/50 image-verified sample)**
- Answer distribution: A=24%, B=27%, C=26%, D=23%

### Round 4: Non-A Answer Verification (commit `e5f7dc2`)

- Verified all 5,511 questions with B/C/D answers
- Split into 23 batches of ~250, sent 2 at a time to Gemini
- Found **229 unique corrections** (269 instances across 165 files)
- Correction sources: B→other (123), C→other (61), D→other (45)
- Correction targets: D (81), C (77), A (41), B (30)
- **Answer distribution after Round 4: A=24.6%, B=25.9%, C=25.6%, D=23.8%**

## Verification Method

1. EEDI CDN (`images.diagnosticquestions.com`) blocks non-browser requests (returns 404/BlobNotFound from curl)
2. Solution: Create HTML pages with embedded `<img>` tags, serve via `python3 -m http.server 8765` from scratchpad
3. Use Playwright browser automation to load pages and screenshot each question
4. Manually solve each math problem from the image and compare to our answer

## Key Files

| File | Purpose |
|------|---------|
| `data/eedi/raw/*/topics/*.json` | Raw topic files with `correctAnswer` field (string: "A"/"B"/"C"/"D") |
| `data.js` | Built diagnostic data (9.1MB, 5,700 questions, 19 modules) |
| `tools/build_ka_diagnostic.py` | Build script — run with ROOT override (see below) |
| `tools/eedi_discover_collections.py` | Scraper (bug at lines 321-324, unfixable) |
| `scripts/export-diagnostic-data.mjs` | Exports `data.js` → `public/diagnostic/diagnostic-data.json` |
| `/home/vishwa/WProjects/DW/public/diagnostic/diagnostic-data.json` | Frontend data file |

## Build Commands

```python
# Rebuild data.js
import tools.build_ka_diagnostic as bk
from pathlib import Path
bk.ROOT = Path('.').resolve()
bk.EEDI_RAW = bk.ROOT / 'data' / 'eedi' / 'raw'
bk.OUTPUT_DIR = bk.ROOT
bk.main()
```

```bash
# Export to frontend
cd /home/vishwa/WProjects/DW && node scripts/export-diagnostic-data.mjs
```

## Gemini CLI Usage

```bash
# Pipe data via stdin (avoids "Argument list too long" error)
cat batch.json | gemini -p "prompt text" > result.json 2>&1

# DO NOT use $(cat) — exceeds shell arg limit for large files
```

## Scratchpad Location

`/tmp/claude-1000/-home-vishwa-WProjects-DW-diagnostic-check/4a9ef687-29d0-49c9-8041-59e1186bd104/scratchpad/`

Key scratchpad files:
- `questions_answer_a.json` — 2,237 A-answer questions
- `gemini_a_batch_0-7.json` — Gemini input batches
- `gemini_a_result_0-7.json` — Gemini output
- `gemini_a_all_corrections.json` — 518 merged corrections
- `gemini_nonA_batch_0-22.json` — Non-A input batches (23 total)
- `gemini_nonA_result_0-21.json` — Non-A Gemini output (batch 22 had 0 corrections)
- `gemini_nonA_all_corrections.json` — 229 merged non-A corrections
- `gemini_nonA_prompt.txt` — Prompt used for non-A verification
- `verify_r2_batch_0-4.html` — Round 2 verification HTML pages
- `verify_r2_sample.json` — 50 random verification questions (seed 42424242)

## Commits

1. `4b9be46` — Round 1: Haiku LLM classification (5 rounds)
2. `b9f3218` — Round 2: Gemini verification (293 fixes)
3. `1568235` — Round 3: Gemini A-answer re-check (518+5+2 fixes)
4. `e5f7dc2` — Round 4: Gemini non-A verification (229 corrections)
