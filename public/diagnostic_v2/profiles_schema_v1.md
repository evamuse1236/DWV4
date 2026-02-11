# Profiles Schema v1

Storage key: `diagnostic_v2_mastery_profiles_v1` in browser `localStorage`.

## Profile object
- `profile_id` (string)
- `name` (string)
- `grade` (number: 5, 6, or 7)
- `created_at` (ISO timestamp)
- `updated_at` (ISO timestamp)
- `attempt_history` (array of attempt objects)
- `topic_mastery` (object keyed by `grade|topic_id`)
- `misconception_stats` (object keyed by misconception code, numeric count)

## Attempt object
- `attempt_id` (string)
- `session_id` (string)
- `topic_focus_key` (string: `grade|topic_id|focus`)
- `grade` (number)
- `module` (string)
- `topic_id` (string)
- `topic_title` (string)
- `focus_area` (`power` or `challenge`)
- `attempt_no` (number)
- `mapped_standards` (array of standard IDs)
- `missing_standards` (array of standard IDs without question pools)
- `covered_standards` (array of standard IDs included in session)
- `started_at` (ISO timestamp)
- `completed_at` (ISO timestamp)
- `total_questions` (number)
- `correct_count` (number)
- `score_percent` (number)
- `pass` (boolean)
- `per_standard` (object: standard -> `{total, correct, missed_question_ids[]}`)
- `misconceptions` (object: code -> `{count, examples[]}`)
- `rows` (array: per-question result rows with chosen/correct labels and misconception fields)

## Topic mastery object
`topic_mastery[grade|topic_id]` contains:
- `power`: `{attempts, latest_score_percent, mastered, reason}`
- `challenge`: `{attempts, latest_score_percent}`
