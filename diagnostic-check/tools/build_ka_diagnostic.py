#!/usr/bin/env python3
"""
Build diagnostic quiz data mapped from KA exercises to Eedi CC questions.

Parses Curriculum_Map_Links.html to extract KA links per module,
then matches each KA link to Eedi Common Core topics by grade + keywords.
Outputs a data.js file and HTML diagnostic quiz.

Usage:
    python tools/scrape/build_ka_diagnostic.py
"""

import hashlib
import json
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
EEDI_RAW = ROOT / "data" / "eedi" / "raw"
CURRICULUM_HTML = ROOT / "data" / "Curriculum_Map_Links.html"
OUTPUT_DIR = ROOT / "web" / "public" / "check"
# diagnostic-check/ is where the export script reads data from
DIAGNOSTIC_CHECK_DIR = Path(__file__).resolve().parent.parent

# ────────────────────────────────────────────────────────────
# Module definitions: each module maps to KA exercises and
# keyword patterns that select matching Eedi CC topics
# ────────────────────────────────────────────────────────────
MODULES = [
    {
        "id": "1.1",
        "name": "Multi-Digit Operations",
        "module_name": "Module 1: Whole Number Foundations",
        "ka_links": [
            {
                "label": "KA Grade 5: Multi-digit Mult & Div",
                "url": "https://www.khanacademy.org/math/cc-fifth-grade-math/multi-digit-multiplication-and-division",
            }
        ],
        "standards": ["5.NBT.5", "6.NS.2"],
        "grades": [5, 6],
        # Keywords to match Eedi CC topic names
        "topic_keywords": [
            "multi-digit", "multiplication", "division", "long division",
            "written method", "column multiplication", "column division",
            "multiply", "divide", "algorithm",
        ],
        # Keywords to EXCLUDE (avoid pulling in fraction/decimal multiplication)
        "exclude_keywords": [
            "fraction", "decimal", "percent", "ratio", "algebra",
            "equation", "negative", "coordinate",
        ],
    },
    {
        "id": "1.2",
        "name": "Word Problems & Analysis",
        "module_name": "Module 1: Whole Number Foundations",
        "ka_links": [
            {
                "label": "KA Grade 4: Add/Sub Word Problems",
                "url": "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-addition-and-subtraction-2",
            },
            {
                "label": "KA Grade 4: Mult/Div Problems",
                "url": "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiplication-and-division-2",
            },
        ],
        "standards": ["4.OA.3"],
        "grades": [4],
        "topic_keywords": [
            "word problem", "problem solving", "multi-step",
            "four operations", "mental arithmetic", "interpreting remainder",
            "addition and subtraction", "multiplication equation",
            "multiplicative comparison",
        ],
        "exclude_keywords": ["fraction", "decimal", "negative", "percent"],
    },
    {
        "id": "1.3",
        "name": "Number Theory (Factors & Multiples)",
        "module_name": "Module 1: Whole Number Foundations",
        "ka_links": [
            {
                "label": "KA Grade 4: Factors & Patterns",
                "url": "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-factors-multiples-and-patterns",
            },
            {
                "label": "KA Grade 6: LCM & GCF",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-factors-and-multiples",
            },
        ],
        "standards": ["4.OA.4", "6.NS.4"],
        "grades": [4, 6],
        "topic_keywords": [
            "factor", "multiple", "prime", "composite", "hcf", "gcf",
            "lcm", "highest common factor", "lowest common multiple",
            "prime factor", "venn diagram",
        ],
        "exclude_keywords": ["scale factor", "enlargement"],
    },
    {
        "id": "2.1",
        "name": "Visualization & Equivalence",
        "module_name": "Module 2: The World of Fractions",
        "ka_links": [
            {
                "label": "KA Grade 4: Equivalence & Ordering",
                "url": "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2",
            },
        ],
        "standards": ["4.NF.1", "4.NF.2"],
        "grades": [4],
        "topic_keywords": [
            "fraction", "equivalent", "simplif", "compar", "order",
            "visual", "unit fraction", "number line",
        ],
        "exclude_keywords": [
            "add", "subtract", "multiply", "divide", "decimal",
            "percent", "mixed number",
        ],
    },
    {
        "id": "2.2",
        "name": "Addition & Subtraction of Fractions",
        "module_name": "Module 2: The World of Fractions",
        "ka_links": [
            {
                "label": "KA Grade 5: Add/Sub Fractions",
                "url": "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-fractions-3",
            },
        ],
        "standards": ["5.NF.1"],
        "grades": [5],
        "topic_keywords": [
            "add.*fraction", "subtract.*fraction", "fraction.*add",
            "fraction.*subtract", "mixed number", "unlike denominator",
            "common denominator",
        ],
        "exclude_keywords": ["multiply", "divide", "decimal", "percent"],
    },
    {
        "id": "2.3",
        "name": "Multiplication & Division of Fractions",
        "module_name": "Module 2: The World of Fractions",
        "ka_links": [
            {
                "label": "KA Grade 5: Mult/Div Fractions",
                "url": "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-multiplication-and-division-3",
            },
            {
                "label": "KA Grade 6: Dividing Fractions",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-arithmetic-operations/cc-6th-dividing-fractions",
            },
        ],
        "standards": ["5.NF.4", "6.NS.1"],
        "grades": [5, 6],
        "topic_keywords": [
            "multiply.*fraction", "fraction.*multiply", "divide.*fraction",
            "fraction.*divide", "reciprocal",
        ],
        "exclude_keywords": ["decimal", "percent", "add", "subtract"],
    },
    {
        "id": "3.1",
        "name": "Decimal Concepts & Operations",
        "module_name": "Module 3: Decimals",
        "ka_links": [
            {
                "label": "KA Grade 5: Place Value (Powers of 10)",
                "url": "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-place-value-and-decimals",
            },
            {
                "label": "KA Grade 6: Arithmetic (Decimal Fluency)",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-arithmetic-operations",
            },
        ],
        "standards": ["5.NBT.7", "6.NS.3"],
        "grades": [5, 6],
        "topic_keywords": [
            "decimal", "place value", "powers of 10", "rounding",
            "comparing decimal", "ordering decimal",
        ],
        "exclude_keywords": [
            "fraction", "negative", "percent", "ratio", "coordinate",
            "algebra", "equation",
        ],
    },
    {
        "id": "4.1",
        "name": "Understanding Integers",
        "module_name": "Module 4: Integers (Negative Numbers)",
        "ka_links": [
            {
                "label": "KA Grade 6: Negative Numbers Intro",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-negative-number-topic",
            },
        ],
        "standards": ["6.NS.7"],
        "grades": [6],
        "topic_keywords": [
            "negative number", "positive and negative", "order negative",
            "integer", "number line",
        ],
        "exclude_keywords": [
            "add", "subtract", "multiply", "coordinate", "operations",
        ],
    },
    {
        "id": "4.2",
        "name": "Integer Operations (Advanced)",
        "module_name": "Module 4: Integers (Negative Numbers)",
        "ka_links": [
            {
                "label": "KA Grade 7: Add/Sub Negative Numbers",
                "url": "https://www.khanacademy.org/math/cc-seventh-grade-math/cc-7th-negative-numbers-add-and-subtract",
            },
        ],
        "standards": ["7.NS.1"],
        "grades": [7],
        "topic_keywords": [
            "add.*negative", "subtract.*negative", "negative.*add",
            "negative.*subtract", "integer.*add", "integer.*subtract",
            "directed number",
        ],
        "exclude_keywords": ["coordinate", "percent", "ratio"],
    },
    {
        "id": "5.1",
        "name": "Ratios & Rates",
        "module_name": "Module 5: Ratios, Rates & Percentages",
        "ka_links": [
            {
                "label": "KA Grade 6: Ratios & Rates",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-ratios-prop-topic",
            },
        ],
        "standards": ["6.RP.2"],
        "grades": [6],
        "topic_keywords": [
            "ratio", "rate", "proportion", "unit rate",
        ],
        "exclude_keywords": [
            "percent", "scale factor", "enlargement", "coordinate",
        ],
    },
    {
        "id": "5.2",
        "name": "Percentage Basics",
        "module_name": "Module 5: Ratios, Rates & Percentages",
        "ka_links": [
            {
                "label": "KA Grade 6: Intro to Percents",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-ratios-prop-topic/cc-6th-percents",
            },
        ],
        "standards": ["6.RP.3"],
        "grades": [6],
        "topic_keywords": [
            "percent", "percentage",
        ],
        "exclude_keywords": [
            "increase", "decrease", "change", "discount", "tax", "tip",
            "interest",
        ],
    },
    {
        "id": "5.3",
        "name": "Advanced Percent Application",
        "module_name": "Module 5: Ratios, Rates & Percentages",
        "ka_links": [
            {
                "label": "KA Grade 7: Percent Problems",
                "url": "https://www.khanacademy.org/math/cc-seventh-grade-math/cc-7th-fractions-decimals-percentages",
            },
        ],
        "standards": ["7.RP.3"],
        "grades": [7],
        "topic_keywords": [
            "percent", "percentage", "discount", "tax", "tip",
            "increase", "decrease", "interest",
        ],
        "exclude_keywords": [],
    },
    {
        "id": "6.1",
        "name": "Expressions & Exponents",
        "module_name": "Module 6: Algebra",
        "ka_links": [
            {
                "label": "KA Grade 6: Variables & Expressions",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-expressions-and-variables",
            },
        ],
        "standards": ["6.EE.1"],
        "grades": [6],
        "topic_keywords": [
            "expression", "exponent", "order of operations", "evaluate",
            "variable", "substitut", "power", "index",
        ],
        "exclude_keywords": [
            "equation", "inequalit", "solve", "coordinate",
        ],
    },
    {
        "id": "6.2",
        "name": "Solving Equations",
        "module_name": "Module 6: Algebra",
        "ka_links": [
            {
                "label": "KA Grade 6: Equations & Inequalities",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities",
            },
        ],
        "standards": ["6.EE.5"],
        "grades": [6],
        "topic_keywords": [
            "equation", "solve", "inequalit", "one-step", "two-step",
            "unknown", "balance",
        ],
        "exclude_keywords": [
            "coordinate", "pattern", "dependent", "independent",
        ],
    },
    {
        "id": "6.3",
        "name": "Patterns & Relations",
        "module_name": "Module 6: Algebra",
        "ka_links": [
            {
                "label": "KA Grade 5: Patterns",
                "url": "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-algebraic-thinking",
            },
            {
                "label": "KA Grade 6: Dependent/Independent Vars",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities/cc-6th-dependent-independent",
            },
        ],
        "standards": ["6.EE.9"],
        "grades": [5, 6],
        "topic_keywords": [
            "pattern", "sequence", "dependent", "independent",
            "relationship", "rule", "function",
        ],
        "exclude_keywords": ["equation", "solve", "inequalit"],
    },
    {
        "id": "7.1",
        "name": "Coordinate Geometry",
        "module_name": "Module 7: Geometry & Data",
        "ka_links": [
            {
                "label": "KA Grade 6: Coordinate Plane",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-negative-number-topic/cc-6th-coordinate-plane",
            },
        ],
        "standards": ["6.NS.8"],
        "grades": [6],
        "topic_keywords": [
            "coordinate", "plot", "quadrant", "axis",
        ],
        "exclude_keywords": [
            "negative number", "order negative", "integer",
        ],
    },
    {
        "id": "7.2",
        "name": "Area & 2D Figures",
        "module_name": "Module 7: Geometry & Data",
        "ka_links": [
            {
                "label": "KA Grade 5: Properties of Shapes",
                "url": "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-geometry-3",
            },
            {
                "label": "KA Grade 6: Geometry (Area)",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic",
            },
        ],
        "standards": ["6.G.1"],
        "grades": [5, 6],
        "topic_keywords": [
            "area", "triangle", "rectangle", "polygon", "parallelogram",
            "trapez", "shape", "classify", "angle", "perimeter",
            "quadrilateral",
        ],
        "exclude_keywords": [
            "surface area", "volume", "net", "3d", "prism", "cylinder",
            "coordinate",
        ],
    },
    {
        "id": "7.3",
        "name": "3D Figures",
        "module_name": "Module 7: Geometry & Data",
        "ka_links": [
            {
                "label": "KA Grade 6: Surface Area & Nets",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic/cc-6th-surface-area",
            },
        ],
        "standards": ["6.G.4"],
        "grades": [6],
        "topic_keywords": [
            "surface area", "net", "3d", "prism", "cube", "cuboid",
            "pyramid",
        ],
        "exclude_keywords": ["volume", "cylinder", "cone"],
    },
    {
        "id": "7.4",
        "name": "Data Visualization",
        "module_name": "Module 7: Geometry & Data",
        "ka_links": [
            {
                "label": "KA Grade 6: Data & Statistics",
                "url": "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-data-statistics",
            },
        ],
        "standards": ["6.SP.4"],
        "grades": [6],
        "topic_keywords": [
            "data", "statistic", "mean", "median", "mode", "range",
            "graph", "chart", "plot", "histogram", "stem and leaf",
            "box and whisker", "scatter", "frequency",
        ],
        "exclude_keywords": [
            "coordinate", "equation", "algebra",
        ],
    },
]


def load_cc_topics():
    """Load all CC grade topics from raw data."""
    topics_by_grade = {}

    for grade in range(2, 9):
        grade_dir = EEDI_RAW / f"common_core_standards_-_grade_{grade}"
        index_path = grade_dir / "index.json"
        if not index_path.exists():
            continue

        with open(index_path) as f:
            index = json.load(f)

        topics = []
        topics_dir = grade_dir / "topics"
        for topic_meta in index.get("topics", []):
            file_rel = topic_meta.get("file", "")
            if file_rel:
                filename = file_rel.replace("topics/", "")
                topic_path = topics_dir / filename
            else:
                continue

            if not topic_path.exists():
                continue

            with open(topic_path) as f:
                topic_data = json.load(f)

            # Only include topics with real question data
            qs = topic_data.get("questions", [])
            has_real_data = any(q.get("questionId") for q in qs)
            if not has_real_data:
                continue

            topics.append({
                "name": topic_data.get("name", ""),
                "shortcode": topic_data.get("shortcode", ""),
                "skills": topic_data.get("skills", []),
                "categories": topic_data.get("categories", []),
                "questions": qs,
            })

        topics_by_grade[grade] = topics
        print(f"  Grade {grade}: {len(topics)} topics loaded")

    return topics_by_grade


def match_topics(module, topics_by_grade):
    """Find Eedi CC topics that match a module's keywords."""
    matched = []
    seen_shortcodes = set()

    for grade in module["grades"]:
        if grade not in topics_by_grade:
            continue

        for topic in topics_by_grade[grade]:
            topic_name = topic["name"].lower()

            # Build searchable text from name + skills
            skill_names = []
            for s in topic.get("skills", []):
                if isinstance(s, dict):
                    skill_names.append(s.get("name", "").lower())
                elif isinstance(s, str):
                    skill_names.append(s.lower())
            search_text = topic_name + " " + " ".join(skill_names)

            # Check exclude keywords first
            excluded = False
            for kw in module.get("exclude_keywords", []):
                if re.search(r'\b' + re.escape(kw) + r'\b', search_text, re.I):
                    excluded = True
                    break
            if excluded:
                continue

            # Check include keywords (any match)
            matched_kw = False
            for kw in module["topic_keywords"]:
                if re.search(kw, search_text, re.I):
                    matched_kw = True
                    break

            if matched_kw and topic["shortcode"] not in seen_shortcodes:
                seen_shortcodes.add(topic["shortcode"])
                matched.append({
                    "name": topic["name"],
                    "shortcode": topic["shortcode"],
                    "grade": grade,
                    "questions": topic["questions"],
                })

    return matched


def build_module_data(module, matched_topics):
    """Build canonical question data for a module."""
    questions = []
    for topic in matched_topics:
        for raw_q in topic["questions"]:
            qid = raw_q.get("questionId")
            if not qid:
                continue

            image_url = raw_q.get("imageURL", "")
            correct = raw_q.get("correctAnswer", "")
            explanations = raw_q.get("explanations", {})

            choices = []
            for label in ["A", "B", "C", "D"]:
                is_correct = (label == correct)
                explanation = explanations.get(label, "")
                choices.append({
                    "label": label,
                    "text": "",
                    "correct": is_correct,
                    "misconception": explanation if not is_correct else "",
                })

            questions.append({
                "id": f"q_eedi_{qid}",
                "topic": topic["name"],
                "topic_shortcode": topic["shortcode"],
                "grade": topic["grade"],
                "stem": f"[Image question] {topic['name']}",
                "visual_html": f'<img src="{image_url}" alt="Diagnostic question" />' if image_url else "",
                "choices": choices,
                "explanation": explanations.get(correct, ""),
            })

    return questions


NUM_SETS = 10
MAX_QUESTIONS_PER_SET = 30


def generate_sets(all_modules):
    """Generate pre-built question sets for each module group.

    Groups modules by their module_name prefix (e.g. "Module 1:"),
    then for each group creates NUM_SETS deterministic sets using
    seeded PRNG and round-robin across sub-modules.
    """
    # Group modules by their shared prefix (e.g. "Module 1: Whole Number Foundations")
    groups = {}
    for mod in all_modules:
        # The prefix is the "Module N:" part of the module_name
        prefix = mod["module_name"].split(":")[0] + ":"
        if prefix not in groups:
            groups[prefix] = []
        groups[prefix].append(mod)

    all_sets = []

    for prefix, group_modules in sorted(groups.items()):
        # Collect questions per sub-module (keyed by sub-module id like "1.1")
        sub_module_questions = {}
        for mod in group_modules:
            qids = [q["id"] for q in mod["questions"]]
            sub_module_questions[mod["id"]] = qids

        sub_module_ids = sorted(sub_module_questions.keys())

        for set_idx in range(NUM_SETS):
            # Deterministic seed from group prefix + set index
            seed_str = f"{prefix}{set_idx}"
            seed = int(hashlib.sha256(seed_str.encode()).hexdigest()[:8], 16)
            rng = random.Random(seed)

            # Shuffle each sub-module's questions independently
            shuffled = {}
            for sm_id in sub_module_ids:
                pool = sub_module_questions[sm_id][:]
                rng.shuffle(pool)
                shuffled[sm_id] = pool

            # Round-robin: pick 1 from each sub-module in turn until 30
            pointers = {sm_id: 0 for sm_id in sub_module_ids}
            selected = []

            while len(selected) < MAX_QUESTIONS_PER_SET:
                picked_any = False
                for sm_id in sub_module_ids:
                    if len(selected) >= MAX_QUESTIONS_PER_SET:
                        break
                    if pointers[sm_id] < len(shuffled[sm_id]):
                        selected.append(shuffled[sm_id][pointers[sm_id]])
                        pointers[sm_id] += 1
                        picked_any = True
                # All sub-modules exhausted
                if not picked_any:
                    break

            all_sets.append({
                "groupPrefix": prefix,
                "setIndex": set_idx,
                "questionIds": selected,
            })

        total_pool = sum(len(q) for q in sub_module_questions.values())
        print(f"  {prefix} {len(sub_module_ids)} sub-modules, "
              f"{total_pool} total questions, "
              f"{NUM_SETS} sets (max {MAX_QUESTIONS_PER_SET} each)")

    return all_sets


def main():
    print("Loading CC topics...")
    topics_by_grade = load_cc_topics()

    total_topics = sum(len(t) for t in topics_by_grade.values())
    print(f"\n  Total: {total_topics} topics across {len(topics_by_grade)} grades\n")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Build data for each module
    all_modules = []
    grand_total = 0

    for module in MODULES:
        matched = match_topics(module, topics_by_grade)
        questions = build_module_data(module, matched)

        module_data = {
            "id": module["id"],
            "name": module["name"],
            "module_name": module["module_name"],
            "ka_links": module["ka_links"],
            "standards": module["standards"],
            "topics_matched": len(matched),
            "topic_names": [t["name"] for t in matched],
            "questions": questions,
        }
        all_modules.append(module_data)

        grand_total += len(questions)
        print(f"  {module['id']} {module['name']}: "
              f"{len(matched)} topics, {len(questions)} questions")

    # Write data.js
    data_js_content = f"// Auto-generated diagnostic data\n// {grand_total} questions across {len(all_modules)} modules\nvar DIAGNOSTIC_DATA = {json.dumps(all_modules, indent=2, ensure_ascii=False)};\n"

    data_js_path = OUTPUT_DIR / "data.js"
    with open(data_js_path, "w") as f:
        f.write(data_js_content)

    print(f"\n  Total: {grand_total} questions across {len(all_modules)} modules")
    print(f"  Data: {data_js_path}")

    # Generate pre-built question sets
    print("\nGenerating pre-built question sets...")
    sets = generate_sets(all_modules)

    sets_js_content = (
        f"// Auto-generated diagnostic question sets\n"
        f"// {len(sets)} sets across {len(set(s['groupPrefix'] for s in sets))} groups\n"
        f"var DIAGNOSTIC_SETS = {json.dumps(sets, indent=2, ensure_ascii=False)};\n"
    )

    sets_js_path = OUTPUT_DIR / "data-sets.js"
    with open(sets_js_path, "w") as f:
        f.write(sets_js_content)
    print(f"  Sets: {sets_js_path}")

    # Also write to diagnostic-check/ where the export script reads from
    sets_export_path = DIAGNOSTIC_CHECK_DIR / "data-sets.js"
    with open(sets_export_path, "w") as f:
        f.write(sets_js_content)
    print(f"  Sets (export): {sets_export_path}")


if __name__ == "__main__":
    main()
