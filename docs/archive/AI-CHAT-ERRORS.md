# AI Chat Error Analysis

**Date:** 2026-01-25
**Model:** meta-llama/llama-3.3-70b-instruct:free
**Persona:** Muse
**Sprint Days Remaining:** 1

---

## Summary of Issues

The AI chat has severe usability problems when users try to modify their goal during the confirmation phase. The conversation below shows a frustrated user going in circles for **25+ messages** before finally confirming, then accidentally creating a completely wrong goal.

### Critical Issues Identified

1. **AI doesn't understand "change the days"** - When user clicks the suggested chip "No, change the days", the AI just says "Say yes to confirm, or tell me what to change" - completely ignoring the request.

2. **Stuck in confirmation loop** - When `awaitingConfirm: true`, any negative response just triggers the same "Say yes to confirm" message without actually allowing changes.

3. **"after school" misinterpreted as frequency** - User said "after school" (time of day), but AI treated it as frequency like "on weekends".

4. **Goal title corrupted** - When user said "no of days" (meaning "number of days" to change frequency), AI interpreted it as a NEW GOAL TITLE, creating: `"what": "i said no of days"`. This is the most severe bug.

5. **No escape hatch** - User can't easily go back and modify specific fields. The flow is too linear.

6. **Draft state not cleared properly** - After goal was created, user tried to modify but the conversation context was lost.

---

## Full Conversation Transcript

```
User: practice piano
AI: How long each time?
  → Draft: { what: "practice piano", howLong: null, when: null }
  → Chips: ["15 minutes", "30 minutes", "45 minutes", "1 hour"]

User: 15 minutes
AI: How often?
  → Draft: { what: "practice piano", howLong: "15 minutes", when: null }
  → Chips: ["every day", "every morning", "3 times a week", "on weekends", "after school"]

User: on weekends
AI: Here's your plan:
    • practice piano
    • on weekends, 15 minutes each
    Say "yes" to confirm!
  → Draft: { what: "practice piano", howLong: "15 minutes", when: "on weekends", awaitingConfirm: true }
  → Chips: ["Yes, looks good!", "No, change the days", "Make it fewer days", "Add more days"]

User: No, change the days  ← CLICKED SUGGESTED CHIP
AI: Say "yes" to confirm, or tell me what to change.  ← BUG: IGNORES THE REQUEST
  → Draft unchanged, still awaitingConfirm: true
  → Same chips offered again

User: Make it fewer days  ← CLICKED ANOTHER CHIP
AI: How often should it be?  ← Finally asks, but confusing
  → Draft: { awaitingConfirm: false, when: null }  ← Reset when but kept other fields
  → Chips: ["every day", "every morning", "3 times a week", "on weekends", "after school"]

User: after school  ← USER MEANT TIME OF DAY, NOT FREQUENCY
AI: Here's your plan:
    • practice piano
    • after school, 15 minutes each  ← WRONG: "after school" is time, not frequency
    Say "yes" to confirm!

User: No, change the days
AI: Say "yes" to confirm, or tell me what to change.  ← SAME BUG AGAIN

User: Add more days
AI: How often should it be?

User: every day
AI: Here's your plan:
    • practice piano
    • every day, 15 minutes each
    Say "yes" to confirm!

User: Make it fewer days
AI: How often should it be?

User: 3 times a week
AI: Here's your plan:
    • practice piano
    • 3x per week, 15 minutes each
    Say "yes" to confirm!

User: no yes option  ← USER FRUSTRATED, SAYING THERE'S NO YES BUTTON
AI: Say "yes" to confirm, or tell me what to change.  ← AI MISUNDERSTANDS

User: Yes, looks good!  ← FINALLY CONFIRMS AFTER 25 TURNS
AI: Goal created!
  → Action: goal-ready with 6 tasks (Mon/Wed/Fri for 2 weeks)

--- AFTER GOAL CREATED ---

User: no of days  ← USER WANTS TO CHANGE NUMBER OF DAYS
AI: How long each time?  ← BUG: INTERPRETS AS NEW GOAL
  → Draft: { what: "no of days", howLong: null, when: null }  ← WRONG!

User: i said no of days  ← USER FRUSTRATED
AI: How long each time?  ← STILL WRONG
  → Draft: { what: "i said no of days", howLong: null, when: null }  ← CRITICAL BUG

User: 1 hour  ← USER GIVES UP, PLAYS ALONG
AI: How often?
  → Draft: { what: "i said no of days", howLong: "1 hour", when: null }

User: every night
AI: Here's your plan:
    • i said no of days  ← COMPLETELY WRONG GOAL TITLE
    • every night, 1 hour each
    Say "yes" to confirm!
  → Draft: { what: "i said no of days", howLong: "1 hour", when: "every night", awaitingConfirm: true }
```

---

## Raw API Logs

### Initial Request
```json
{
  "messageCount": 1,
  "messages": [{ "content": "practice piano", "role": "user" }],
  "model": "meta-llama/llama-3.3-70b-instruct:free",
  "persona": "muse",
  "sprintDaysRemaining": 1,
  "draft": null,
  "existingGoals": [{ "id": "jx76k9yyrt82gzzr565g7wjqw97zxxzw", "title": "To Rs, But" }]
}
```

### First Confirmation (after "on weekends")
```json
{
  "content": "Here's your plan:\n• practice piano\n• on weekends, 15 minutes each\n\nSay \"yes\" to confirm!",
  "draft": {
    "awaitingConfirm": true,
    "howLong": "15 minutes",
    "what": "practice piano",
    "when": "on weekends"
  },
  "promptChips": ["Yes, looks good!", "No, change the days", "Make it fewer days", "Add more days"]
}
```

### Bug: "No, change the days" ignored
```json
// User sent: "No, change the days"
// Response:
{
  "content": "Say \"yes\" to confirm, or tell me what to change.",
  "draft": {
    "awaitingConfirm": true,  // STILL TRUE - didn't process the change request
    "howLong": "15 minutes",
    "what": "practice piano",
    "when": "on weekends"  // UNCHANGED
  }
}
```

### Critical Bug: "no of days" becomes goal title
```json
// User sent: "no of days" (meaning number of days to practice)
// Response:
{
  "content": "How long each time?",
  "draft": {
    "howLong": null,
    "what": "no of days",  // CRITICAL BUG: interpreted as goal title
    "when": null
  }
}

// User sent: "i said no of days" (frustrated clarification)
// Response:
{
  "content": "How long each time?",
  "draft": {
    "howLong": null,
    "what": "i said no of days",  // EVEN WORSE - now includes frustration
    "when": null
  }
}
```

### Final Corrupted Goal
```json
{
  "content": "Here's your plan:\n• i said no of days\n• every night, 1 hour each\n\nSay \"yes\" to confirm!",
  "draft": {
    "awaitingConfirm": true,
    "howLong": "1 hour",
    "what": "i said no of days",  // User's original "practice piano" goal is lost
    "when": "every night"
  }
}
```

---

## Recommendations

### 1. Fix "No, change the days" chip behavior
When `awaitingConfirm: true` and user clicks "No, change the days":
- Set `awaitingConfirm: false`
- Set `when: null`
- Ask "How often would you like to practice?" with frequency chips

### 2. Distinguish time-of-day from frequency
"after school" = time of day (like "in the morning")
"3 times a week" = frequency

The AI should ask TWO separate questions:
1. "How often?" → frequency (daily, 3x/week, weekends)
2. "What time of day?" → time (morning, after school, evening)

### 3. Preserve context after goal creation
When user says something after "Goal created!", check if they want to:
- Edit the goal just created
- Create a new goal

Don't immediately start a new goal flow.

### 4. Add explicit "Edit" chips after confirmation
```json
"promptChips": [
  "Change the activity",
  "Change the frequency",
  "Change the duration",
  "Start over"
]
```

### 5. Natural language understanding for modifications
When user says "no of days", "number of days", "how many days" during confirmation:
- Recognize this as a modification request
- Ask "How many days per week?" with options like ["2 days", "3 days", "5 days", "every day"]

---

## Files to Modify

1. `convex/ai.ts` - System prompt needs better handling for:
   - Modification requests during confirmation
   - Context preservation after goal creation
   - Distinguishing time-of-day from frequency

2. `src/pages/student/SprintPage.tsx` - TheMuse component:
   - Better chip handling for "No, change the X" options
   - State management for edit flow vs new goal flow
