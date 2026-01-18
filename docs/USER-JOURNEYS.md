# Complete User Journey Map: Deep Work Tracker

## Overview

The Deep Work Tracker is a learning management system with two distinct user roles:
- **Students**: Learn through gamified objectives, track emotional state, set sprint goals, and read books
- **Coaches/Admins**: Manage students, create curriculum content, and monitor progress

---

## System Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────┐
│         Public Routes                        │
├─────────────────────────────────────────────┤
│ /login          → LoginPage                  │
│ /setup          → SetupPage (first-time)     │
└─────────────────────────────────────────────┘
         │
         ├─→ Username + Password
         │
         ↓
┌─────────────────────────────────────────────┐
│      useAuth Context                         │
├─────────────────────────────────────────────┤
│ • Stores token in localStorage               │
│ • Token Key: "deep-work-tracker-token"       │
│ • Queries getCurrentUser via Convex          │
│ • Validates session on mount                 │
└─────────────────────────────────────────────┘
         │
         ├─→ Admin (role="admin")
         │   ↓
         │   /admin (AdminLayout)
         │
         └─→ Student (role="student")
             ↓
             CheckInGate (enforces daily emotional check-in)
             ↓
             /dashboard (DashboardLayout)
```

---

## STUDENT JOURNEY

### 1. Login & Entry

```
Login Page
  ├─ Enter username & password
  ├─ "Deep Work" branding (Paper UI glass card aesthetic)
  └─ POST /api/auth.login
      ↓
      Token stored in localStorage
      ↓
      Navigate to /dashboard
```

### 2. Daily Ritual: Palette of Presence (Emotional Check-In)

**Required before accessing any feature**

```
CheckInGate (blocks dashboard access)
  ↓
Palette of Presence UI (4 quadrant mood wheel)
  ├─ Good + High Energy (☀️) → Excited, Curious, Proud, Playful...
  ├─ Good + Low Energy (🌿) → Calm, Relaxed, Safe, Content...
  ├─ Bad + Low Energy (💧) → Tired, Bored, Sad, Lonely...
  └─ Bad + High Energy (🌧️) → Stressed, Worried, Nervous, Angry...
      ↓
[Student clicks quadrant to expand]
      ↓
Emotion Grid (7-8 nuanced feelings per quadrant)
[Multi-select emotions possible]
      ↓
Journal Entry Overlay
"Why do you feel this way? (optional)"
      ↓
POST /api/emotions.saveCheckIn
      ↓
Proceed to dashboard
```

**User Actions:**
1. Click quadrant (e.g., "Good + High Energy")
2. Select emotions (can multi-select across quadrants)
3. Click "Proceed"
4. Optional: Write journal entry
5. Click "Continue"

### 3. Main Dashboard

**Route:** `/dashboard`

```
StudentDashboard
├─ Header: "Good morning/afternoon/evening, [FirstName]"
│
├─ BENTO GRID (Glass cards)
│  ├─ Deep Work Card (2x2) → Click → /deep-work
│  │  └─ Shows total mastered skills
│  ├─ Sprint Card (1x1) → Click → /sprint
│  │  └─ Shows sprint day + tasks left
│  └─ Reading Card (1x1) → Click → /reading
│     └─ Shows currently reading book
│
└─ DOMAINS ROW (4-column grid)
   └─ Each domain card → Click → /deep-work/[domainId]
      └─ Shows mastery progress (e.g., "3/5")
```

### 4. Feature: Deep Work & Skill Tree

**Route:** `/deep-work` or `/deep-work/:domainId`

```
SkillTreeCanvas
├─ Domains arranged in circle (center)
├─ Click domain → expands to show objectives
│  ├─ Major Objectives (branches from domain)
│  └─ Sub Objectives (branches from major)
├─ Color-coded nodes by status
├─ SVG connections between nodes
└─ Selection triggers ObjectivePopover (right panel)
```

**ObjectivePopover shows:**
- Objective title & description
- Activity checklist (videos, exercises, games)
- Progress indicator
- "Request Viva" button (when ready for mastery check)

**Mastery Flow:**
```
Complete activities → Request Viva → Coach approves → "Mastered" badge
```

### 5. Feature: Sprint Planning & Goals

**Route:** `/sprint`

```
SprintPage
├─ Header: Sprint name + Week toggle
│
├─ GOALS (3 slots max)
│  ├─ Goal Cards (color-coded: sage, coral, sky)
│  └─ Empty slot → Opens "The Muse" (AI companion)
│
├─ WEEK VIEW (7-day grid)
│  └─ Task cards organized by day
│     ├─ Color-coded by goal
│     ├─ Time picker
│     ├─ Completion checkbox
│     └─ Keyboard shortcuts (←→ move, Space toggle)
│
├─ HABIT TRACKER (bottom)
│
└─ TheMuse (AI Companion)
   ├─ Two personas: "Muse" (friendly) or "Captain" (direct)
   ├─ Helps ideate goals through conversation
   └─ Extracts SMART goals from chat
```

**User Actions:**
1. Set goals via AI conversation or manual entry
2. Create daily tasks
3. Drag/move tasks between days
4. Complete tasks (checkbox)
5. Track habits

### 6. Feature: Reading Journey

**Route:** `/reading`

```
ReadingPage
├─ Stats: Reading | Pending | Finished
├─ Tabs: [Library] [Reading] [Finished]
│
├─ Library Tab → Books not yet started
├─ Reading Tab → Books in progress
└─ Finished Tab → Coach-approved books
```

**Book Status Flow:**
```
Library → [Read] → Reading → [Finish] → Pending → Coach Approves → Finished
```

**BookBuddy AI:** Recommends books based on reading history

---

## COACH/ADMIN JOURNEY

### 1. First-Time Setup

**Route:** `/setup` (if no admin exists)

```
Step 1: Create Admin Account
├─ Name, Username, Password
└─ POST /api/auth.initializeAdmin

Step 2: Seed Initial Data (optional)
├─ 5 emotion categories
├─ 4 learning domains
└─ 8 starter books

Step 3: Complete → Go to Login
```

### 2. Admin Dashboard

**Route:** `/admin`

```
AdminDashboard
├─ Welcome Header
│
├─ SETUP CHECKLIST (if incomplete)
│  ├─ [ ] Add Students
│  ├─ [ ] Create Sprint
│  └─ [ ] Add Objectives
│
├─ STAT CARDS
│  ├─ Total Students
│  ├─ Pending Vivas (→ /admin/viva)
│  ├─ Active Sprint
│  └─ Check-ins Today
│
├─ CONTENT GRID
│  ├─ Students Overview (first 5)
│  ├─ Viva Queue (first 3, quick-approve)
│  └─ Presentations Queue (first 3, quick-approve)
│
├─ Today's Check-ins (emotional temperature)
│
└─ Quick Actions
   ├─ Add Student
   ├─ Manage Sprint
   ├─ Add Objective
   └─ Add Book
```

### 3. Feature: Student Management

**Route:** `/admin/students`

```
StudentsPage
├─ [+ Add Student] Dialog
├─ Search + Filter by batch
├─ Table: Avatar | Name | Username | Batch | Actions
└─ Click row → /admin/students/:studentId
```

**StudentDetailPage Tabs:**
- Overview: Basic info, quick stats
- Progress: Domain breakdown, skill tree mini-view
- Check-ins: Emotional timeline, patterns
- Assignments: Assigned objectives, status

### 4. Feature: Sprint Management

**Route:** `/admin/sprints`

```
SprintsPage
├─ [+ Create Sprint] Dialog
│  ├─ Name, Start date, End date
│
├─ Active Sprint Card (prominent)
│  └─ Days remaining countdown
│
└─ Sprint List (past, current, future)
```

### 5. Feature: Objective/Curriculum Management

**Route:** `/admin/objectives`

```
ObjectivesPage
├─ Domain Selector
│
├─ Major Objectives List
│  └─ Per major:
│     ├─ Title, Description, Difficulty
│     ├─ Sub-objectives list
│     └─ [Edit] [+ Add Sub] [Delete]
│
└─ Sub-Objective Details
   ├─ Activities: video, exercise, reading, project, game
   └─ [Assign to Students] (bulk)
```

**Hierarchy:**
```
Domain → Major Objective → Sub Objectives → Activities
```

### 6. Feature: Viva Queue

**Route:** `/admin/viva`

```
VivaQueuePage
├─ Pending Vivas Table
│  └─ Student | Objective | Domain | Date | [✓ Approve]
│
└─ Empty: "No pending vivas. All caught up!"
```

**Flow:**
```
Student requests viva → Appears in queue → Coach approves → Status: "mastered"
```

### 7. Feature: Presentations Queue

**Route:** `/admin/presentations`

```
PresentationQueuePage
├─ Pending Presentations Table
│  └─ Student | Book | Date | [✓ Approve]
│
└─ Empty: "No pending presentations."
```

### 8. Feature: Book Management

**Route:** `/admin/books`

```
BooksPage
├─ [+ Add Book] Dialog
│  └─ Title, Author, Genre, Grade, Cover URL, Reading URL
│
└─ Books Table
   └─ Cover | Title | Author | Genre | Grade | [Edit] [Delete]
```

---

## Data Flow Diagrams

### Learning Objective Flow

```
Coach creates:
Domain → Major Objective → Sub Objectives → Activities
                ↓
Coach assigns to students
                ↓
Student sees in skill tree
                ↓
Student completes activities
                ↓
Student requests viva
                ↓
Coach approves
                ↓
Status: "mastered" → Progress updated
```

### Book Reading Flow

```
Coach adds book to library
        ↓
Student browses library
        ↓
Student clicks [Read] → Opens book URL
        ↓
Status: "reading"
        ↓
Student clicks [Finish]
        ↓
Status: "presentation_requested"
        ↓
Coach approves presentation
        ↓
Status: "presented" → Student can rate/review
```

---

## Key User Interactions

### Student Emotional Arc

| Screen | Emotion | Why |
|--------|---------|-----|
| Login | Anticipation | About to access learning |
| Palette of Presence | Thoughtful | Reflecting on emotions |
| Dashboard | Overview | Know what's next |
| Skill Tree | Curiosity | Exploring learning path |
| Sprint Goals | Agency | Setting own direction |
| Task Completion | Progress | Checking off items |
| Viva Approval | Pride | Mastery validated |
| Book Finish | Accomplishment | Journey complete |

### Coach Emotional Arc

| Screen | Emotion | Why |
|--------|---------|-----|
| Dashboard | Overview | System health at glance |
| Student Details | Connection | Individual progress |
| Viva Queue | Authority | Validating mastery |
| Check-ins | Empathy | Understanding emotions |
| Curriculum Design | Ownership | Building content |

---

## Complete Flow Summary

### Student Journey
```
1. Login
2. Emotional check-in (required daily)
3. Dashboard overview
4. Navigate to:
   - /deep-work → Gamified skill tree
   - /sprint → Goal setting + task planning
   - /reading → Book library
5. Earn mastery via viva approval
6. Track progress on dashboard
```

### Coach Journey
```
1. Login
2. Dashboard overview + stats
3. Setup (first-time): students, sprint, objectives
4. Ongoing:
   - /admin/students → View class progress
   - /admin/objectives → Design curriculum
   - /admin/viva → Approve mastery claims
   - /admin/presentations → Approve books
   - /admin/sprints → Manage cycles
   - /admin/books → Curate library
5. Monitor daily check-ins for emotional patterns
```
