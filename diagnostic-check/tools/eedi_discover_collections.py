#!/usr/bin/env python3
"""
Discover Eedi collection IDs by intercepting API calls.

Launches a browser, waits for manual login, then captures collection
metadata from API responses when the Set Work modal is opened.

Usage:
    # Step 1: Login and capture auth token
    python tools/scrape/eedi_discover_collections.py --login

    # Step 2: Discover collections using saved token
    python tools/scrape/eedi_discover_collections.py --discover

    # All-in-one: login, discover, and extract Common Core
    python tools/scrape/eedi_discover_collections.py --login --discover --extract-cc
"""

import argparse
import asyncio
import json
import time
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = ROOT / "data" / "eedi"
SESSION_FILE = DATA_DIR / "session.json"
COLLECTIONS_FILE = DATA_DIR / "collections.json"
TOKEN_FILE = DATA_DIR / "auth_token.txt"


def load_token() -> str:
    """Load saved auth token."""
    if TOKEN_FILE.exists():
        return TOKEN_FILE.read_text().strip()
    return ""


def save_token(token: str):
    """Save auth token to file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    TOKEN_FILE.write_text(token)
    print(f"  Token saved to {TOKEN_FILE}")


def api_request(url: str, token: str) -> dict:
    """Make authenticated Eedi API request."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Authorization': f'Bearer {token}',
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"  API error: {e}")
        return {}


async def do_login():
    """Launch browser for manual login, capture auth token."""
    from playwright.async_api import async_playwright

    auth_token = None

    async def handle_response(response):
        nonlocal auth_token
        if "api.eedi.com" not in response.url:
            return
        if not auth_token:
            auth_header = response.request.headers.get("authorization", "")
            if auth_header.startswith("Bearer "):
                auth_token = auth_header.replace("Bearer ", "")
                print(f"\n  [CAPTURED] Auth token: {auth_token[:30]}...")

    async with async_playwright() as p:
        storage = str(SESSION_FILE) if SESSION_FILE.exists() else None

        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            storage_state=storage,
            viewport={"width": 1400, "height": 900},
        )
        page = await context.new_page()
        page.on("response", handle_response)

        await page.goto("https://teacher.eedi.com", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        current = page.url
        needs_login = "login" in current.lower() or "eedischool" in current.lower()

        if needs_login:
            print("\n  Browser opened. Please log in via Google.")
            print("  Waiting up to 5 minutes for login...")

            # Wait for navigation away from login page
            for _ in range(300):  # 5 min max
                await page.wait_for_timeout(1000)
                current = page.url
                if "teacher.eedi.com" in current and "login" not in current.lower():
                    print(f"\n  Logged in! URL: {current}")
                    break
            else:
                print("\n  Timeout waiting for login.")
                await browser.close()
                return None
        else:
            print(f"  Already logged in: {current}")

        # Save session
        await context.storage_state(path=str(SESSION_FILE))

        # Try to get token from localStorage
        if not auth_token:
            try:
                auth_token = await page.evaluate("localStorage.getItem('authToken')")
                if auth_token:
                    print(f"  [localStorage] Token: {auth_token[:30]}...")
            except Exception:
                pass

        # Trigger an API call to capture auth header
        if not auth_token:
            print("  Triggering API call to capture auth token...")
            try:
                await page.goto(
                    "https://teacher.eedi.com/291217/quizzes",
                    wait_until="networkidle"
                )
                await page.wait_for_timeout(5000)
            except Exception:
                pass

        await browser.close()

        if auth_token:
            save_token(auth_token)
        else:
            print("\n  Could not capture auth token automatically.")
            print("  You can manually copy it from browser DevTools:")
            print("    1. Open DevTools (F12) on teacher.eedi.com")
            print("    2. Console: localStorage.getItem('authToken')")
            print(f"    3. Paste into: {TOKEN_FILE}")

        return auth_token


def discover_collections(token: str):
    """Fetch all collections from the API."""
    print("\nFetching collections from API...")
    data = api_request("https://api.eedi.com/v4/topic-pathway-collections", token)

    if not isinstance(data, list) or not data:
        print("  Failed to fetch collections. Token may be expired.")
        print("  Run with --login to get a fresh token.")
        return []

    print(f"\n  Found {len(data)} collections:\n")

    result = {
        "discovered_at": datetime.now().isoformat(),
        "collections": [],
    }

    for c in data:
        years = [yg.get("name", "") for yg in (c.get("yearGroups") or [])]
        coll = {
            "id": c.get("topicPathwayCollectionId") or c.get("id"),
            "name": c.get("name", ""),
            "yearGroups": years,
        }
        result["collections"].append(coll)

        # Highlight Common Core
        name_str = coll["name"] or "(unnamed)"
        is_cc = "common core" in name_str.lower()
        marker = " <<<" if is_cc else ""
        cid = coll["id"] if coll["id"] is not None else "?"
        print(f"    ID {str(cid):>3}: {name_str}{marker}")
        if years:
            print(f"         Grades: {', '.join(years)}")

    with open(COLLECTIONS_FILE, "w") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    print(f"\n  Saved to {COLLECTIONS_FILE}")

    return result["collections"]


def extract_collection(collection_id: int, collection_name: str, token: str):
    """Extract all topics and questions from a collection."""
    import re

    def sanitize(name):
        safe = re.sub(r'[<>:"/\\|?*]', '_', name)
        return re.sub(r'[\s_]+', '_', safe).strip('_').lower()

    print(f"\nExtracting collection {collection_id}: {collection_name}")

    # Fetch all topics via paginated search
    # The API returns different field names depending on the collection:
    #   - Eedi Collection: {totalCount, items}, shortcode
    #   - Common Core/others: {total, data}, shortCode
    all_topics = []
    skip = 0
    take = 50

    while True:
        url = (
            f"https://api.eedi.com/v4/topic-pathway-collections/search?"
            f"request.filter.includeNoInterventionTopics=true"
            f"&request.filter.topicPathwayCollectionIds={collection_id}"
            f"&request.skip={skip}"
            f"&request.take={take}"
            f"&request.sort[0].Direction=Asc"
            f"&request.sort[0].FieldName=Level"
        )
        data = api_request(url, token)

        # Handle both API response formats
        items = data.get("items") or data.get("data") or []
        total = data.get("totalCount") or data.get("total") or 0

        if not items:
            break

        # Normalize field names: shortCode -> shortcode
        for item in items:
            if "shortCode" in item and "shortcode" not in item:
                item["shortcode"] = item["shortCode"]

        all_topics.extend(items)
        print(f"  Topics: {len(all_topics)}/{total}")

        skip += take
        if len(all_topics) >= total:
            break
        time.sleep(0.3)

    print(f"  Total topics: {len(all_topics)}")

    # Fetch year group names for ID mapping
    yg_data = api_request(
        "https://api.eedi.com/v3/countries/GB/country-year-groups", token
    )
    yg_map = {}
    if isinstance(yg_data, list):
        for yg in yg_data:
            yg_map[yg.get("id")] = yg.get("name", "")

    # Fetch tag taxonomy
    tag_data = api_request("https://api.eedi.com/v3/topic-tags", token)
    tag_map = {}
    if isinstance(tag_data, list):
        for tag in tag_data:
            tag_map[tag.get("id")] = tag.get("tag", "")

    # Fetch quiz data for each topic
    collection_dir = DATA_DIR / "raw" / sanitize(collection_name)
    topics_dir = collection_dir / "topics"
    topics_dir.mkdir(parents=True, exist_ok=True)

    index_topics = []
    total_questions = 0
    failed = []

    for i, topic in enumerate(all_topics):
        shortcode = topic.get("shortcode", "")
        name = topic.get("name", shortcode)

        # Fetch quiz data
        quiz_url = (
            f"https://api.eedi.com/v4/topic-pathway-quizs/shortcode/{shortcode}?"
            f"includes=quiz&includes=flow-questions"
            f"&includes=worksheet-questions&includes=constructs"
        )
        quiz = api_request(quiz_url, token)

        if not quiz or not quiz.get("flowQuestions"):
            failed.append(shortcode)
            print(f"  [{i+1}/{len(all_topics)}] {name} - FAILED")
            time.sleep(0.3)
            continue

        # Parse quiz data
        # Two API formats:
        #   Nested: fq.question.{id, questionImage, correctAnswer, answers[]}
        #   Flat (CC): fq.{questionId, imageURL, correctAnswer, explanationA/B/C/D}
        IMAGE_BASE = "https://images.diagnosticquestions.com"
        questions = []
        for fq in quiz.get("flowQuestions", []):
            labels = ["A", "B", "C", "D"]
            nested_q = fq.get("question")

            if nested_q and isinstance(nested_q, dict):
                # Nested format (Eedi Collection)
                correct_idx = nested_q.get("correctAnswer")
                correct_label = labels[correct_idx] if isinstance(correct_idx, int) and 0 <= correct_idx < 4 else ""

                explanations = {}
                for ans in nested_q.get("answers", []):
                    letter = ans.get("letter", "")
                    if ans.get("isCorrect"):
                        explanations[letter] = nested_q.get("correctAnswerExplanation", "")
                    else:
                        explanations[letter] = ans.get("wrongAnswerExplanation", "")

                img = nested_q.get("questionImage", "")
                questions.append({
                    "questionId": nested_q.get("id"),
                    "imageURL": img,
                    "correctAnswer": correct_label,
                    "explanations": explanations,
                    "isCheckout": fq.get("isCheckoutQuestion", False),
                })
            else:
                # Flat format (Common Core collections)
                correct_idx = fq.get("correctAnswer")
                correct_label = labels[correct_idx] if isinstance(correct_idx, int) and 0 <= correct_idx < 4 else ""

                explanations = {}
                for label in labels:
                    key = f"explanation{label}"
                    text = fq.get(key, "")
                    if text:
                        explanations[label] = text

                # Image URL may be relative — prepend base domain
                raw_img = fq.get("imageURL", "") or ""
                img = f"{IMAGE_BASE}{raw_img}" if raw_img.startswith("/") else raw_img

                questions.append({
                    "questionId": fq.get("questionId"),
                    "imageURL": img,
                    "correctAnswer": correct_label,
                    "explanations": explanations,
                    "isCheckout": fq.get("isCheckoutQuestion", False),
                })

        # Build topic metadata
        year_group_ids = topic.get("yearGroupIds", [])
        year_groups = [yg_map.get(yid, f"ID:{yid}") for yid in year_group_ids]

        tag_ids = topic.get("topicTagIds", [])
        categories = [tag_map.get(tid, "") for tid in tag_ids if tag_map.get(tid)]

        # Parse skills from constructs
        skills = []
        for construct in quiz.get("constructs", []):
            skill = {
                "id": construct.get("id"),
                "name": construct.get("name", ""),
                "subjectArea": construct.get("subjectAreaName", ""),
                "prerequisites": [
                    {"id": p.get("id"), "name": p.get("name", "")}
                    for p in construct.get("prerequisites", [])
                ],
            }
            skills.append(skill)

        topic_data = {
            "shortcode": shortcode,
            "name": name,
            "collectionId": collection_id,
            "level": topic.get("level"),
            "sequence": topic.get("sequence"),
            "yearGroups": year_groups,
            "hasInterventions": topic.get("hasInterventions", False),
            "skills": skills,
            "tags": categories,
            "questions": questions,
            "categories": list(set(
                s.get("subjectArea", "") for s in skills if s.get("subjectArea")
            )) if not categories else categories,
        }

        # Save individual topic file
        safe_name = sanitize(name)[:80]
        topic_file = topics_dir / f"{safe_name}.json"
        with open(topic_file, "w") as f:
            json.dump(topic_data, f, indent=2, ensure_ascii=False)

        # Build index entry
        subject_areas = list(set(s.get("subjectArea", "") for s in skills if s.get("subjectArea")))
        skill_names = [s.get("name", "") for s in skills if s.get("name")]
        index_topics.append({
            "name": name,
            "shortcode": shortcode,
            "level": topic.get("level"),
            "yearGroups": year_groups,
            "categories": categories if categories else subject_areas[:1],
            "skills": skill_names,
            "subjectAreas": subject_areas,
            "questionCount": len(questions),
            "file": f"topics/{safe_name}.json",
        })

        total_questions += len(questions)
        print(f"  [{i+1}/{len(all_topics)}] {name}: {len(questions)} Qs")
        time.sleep(0.3)

    # Save index
    index = {
        "collection": collection_name,
        "collectionId": collection_id,
        "extractedAt": datetime.now().isoformat(),
        "stats": {
            "totalTopics": len(index_topics),
            "totalQuestions": total_questions,
            "failed": len(failed),
        },
        "topics": index_topics,
    }
    with open(collection_dir / "index.json", "w") as f:
        json.dump(index, f, indent=2, ensure_ascii=False)

    print(f"\n  Done! {len(index_topics)} topics, {total_questions} questions")
    print(f"  Failed: {len(failed)}")
    print(f"  Saved to: {collection_dir}")

    return index


def main():
    parser = argparse.ArgumentParser(
        description="Discover and extract Eedi collections"
    )
    parser.add_argument("--login", action="store_true",
                        help="Launch browser for login and token capture")
    parser.add_argument("--discover", action="store_true",
                        help="List all available collections")
    parser.add_argument("--extract-cc", action="store_true",
                        help="Extract Common Core Standards collection")
    parser.add_argument("--extract", type=int,
                        help="Extract a specific collection by ID")
    parser.add_argument("--token", type=str,
                        help="Auth token (overrides saved token)")

    args = parser.parse_args()

    # Get token
    token = args.token or load_token()

    if args.login:
        token = asyncio.run(do_login())
        if not token:
            print("\nLogin failed. Try again or paste token manually.")
            return

    if not token and (args.discover or args.extract_cc or args.extract):
        print("No auth token. Run with --login first, or provide --token.")
        return

    collections = []
    if args.discover or args.extract_cc:
        collections = discover_collections(token)

    if args.extract_cc:
        cc = [c for c in collections if "common core" in c["name"].lower()]
        if not cc:
            print("\nNo Common Core collections found.")
            return
        for c in cc:
            extract_collection(c["id"], c["name"], token)

    if args.extract:
        # Find collection name
        if collections:
            match = [c for c in collections if c["id"] == args.extract]
            name = match[0]["name"] if match else f"collection_{args.extract}"
        else:
            name = f"collection_{args.extract}"
        extract_collection(args.extract, name, token)

    if not any([args.login, args.discover, args.extract_cc, args.extract]):
        parser.print_help()


if __name__ == "__main__":
    main()
