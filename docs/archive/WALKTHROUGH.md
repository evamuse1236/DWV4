# Smoke Test Walkthrough

Browser automation guide for post-PR smoke testing using `agent-browser`.

## Test Dependencies

Use this to skip unrelated tests after small changes.

```
INDEPENDENT FEATURES (test only what you changed):

┌─────────────────────────────────────────────────────────────────┐
│  STUDENT SIDE                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Login ──► Check-In ──► Dashboard                               │
│              │              │                                   │
│              │              ├──► Sprint ◄──► Habits             │
│              │              │      (same page, linked)          │
│              │              │                                   │
│              │              ├──► Deep Work (independent)        │
│              │              │                                   │
│              │              ├──► Reading (independent)          │
│              │              │                                   │
│              │              └──► Trust Jar (independent)        │
│              │                                                  │
│              └── Required daily before Dashboard access         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  ADMIN SIDE                                                     │
├─────────────────────────────────────────────────────────────────┤
│  Login ──► Admin Dashboard                                      │
│                  │                                              │
│                  ├──► Students ──► Student Detail               │
│                  │                                              │
│                  ├──► Sprints (independent)                     │
│                  │                                              │
│                  ├──► Projects ──► Project Detail               │
│                  │                    (links & reflections)     │
│                  │                                              │
│                  ├──► Objectives (independent)                  │
│                  │                                              │
│                  ├──► Viva Queue (independent)                  │
│                  │                                              │
│                  ├──► Presentations (independent)               │
│                  │                                              │
│                  ├──► Books (independent)                       │
│                  │                                              │
│                  └──► Trust Jar Admin (independent)             │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Guide: What to Test

| If you changed... | Test these sections |
|-------------------|---------------------|
| Login/Auth | Login (both student & admin) |
| Check-in/Emotions | Login → Check-In |
| Dashboard layout | Login → Check-In → Dashboard |
| Sprint goals/tasks | Sprint only |
| Habits (Daily Rituals) | Sprint → Habits |
| Deep Work/Skill tree | Deep Work only |
| Reading/Books (student) | Reading only |
| Trust Jar animation | Trust Jar only |
| Admin Dashboard | Admin Login → Dashboard |
| Student CRUD | Admin → Students → Student Detail |
| Sprint CRUD (admin) | Admin → Sprints |
| Project management | Admin → Projects → Project Detail |
| Objectives/Activities | Admin → Objectives |
| Viva approval flow | Admin → Viva Queue |
| Presentation approval | Admin → Presentations |
| Book CRUD (admin) | Admin → Books |
| Trust Jar (admin) | Admin → Trust Jar Admin |
| Shared components (buttons, cards, dialogs) | Full smoke test recommended |
| Auth/routing logic | Full smoke test recommended |

---

## Prerequisites

- App running locally at `http://localhost:5173`
- Test accounts already configured:
  - **Admin**: (use existing admin credentials)
  - **Student**: (use existing test student credentials)

## Quick Reference

```bash
# Core workflow
agent-browser open <url>        # Navigate
agent-browser snapshot -i       # Get interactive elements with refs
agent-browser click @e1         # Click by ref
agent-browser fill @e2 "text"   # Fill input by ref
agent-browser screenshot        # Capture current state
agent-browser close             # Cleanup
```

---

# Student Flows

## 1. Login Flow

**Route**: `/login`
**Purpose**: Verify student can authenticate and reach dashboard

```bash
# Navigate to login
agent-browser open http://localhost:5173/login
agent-browser snapshot -i

# Fill credentials (find refs from snapshot)
agent-browser fill @username "test-student-username"
agent-browser fill @password "test-student-password"

# Submit
agent-browser click @login-button
agent-browser wait --url "**/check-in"
agent-browser snapshot -i
```

**Selectors**:
- Username: `input[placeholder="Username"]` or `.input-minimal` (first)
- Password: `input[placeholder="Password"]` or `.input-minimal` (second)
- Login button: `button[type="submit"]` or `.btn.breathing-glow`

**Assertions**:
- [ ] URL redirects to `/check-in` (first login of day) or `/dashboard`
- [ ] No error messages visible

---

## 2. Emotion Check-In

**Route**: `/check-in`
**Purpose**: Verify mood selection and journal entry flow

```bash
# Should already be on /check-in after login
agent-browser snapshot -i

# Click a quadrant (Good + High Energy = yellow section)
agent-browser click @good-high-quadrant

# Snapshot to see emotion shades
agent-browser snapshot -i

# Select specific emotion (e.g., "Excited")
agent-browser click @excited-emotion

# Optional: Add journal entry
agent-browser fill @journal-textarea "Test journal entry"

# Save
agent-browser click @save-button
agent-browser wait --url "**/dashboard"
```

**Selectors**:
- Quadrants: Look for clickable sections with `onClick={() => setActiveQuadrant("...")}`
  - Good+High (yellow): text contains "Good" and "High"
  - Good+Low (teal): text contains "Good" and "Low"
  - Bad+Low (gray): text contains "Bad" and "Low"
  - Bad+High (pink): text contains "Bad" and "High"
- Emotion shades: Buttons that appear after quadrant selection
- Journal: `textarea` element
- Save button: Button with text "Save"

**Assertions**:
- [ ] Quadrant highlights on selection
- [ ] Emotion shades appear after quadrant click
- [ ] Redirect to `/dashboard` after save

---

## 3. Dashboard Navigation

**Route**: `/dashboard`
**Purpose**: Verify all dashboard cards are clickable and navigate correctly

```bash
agent-browser open http://localhost:5173/dashboard
agent-browser snapshot -i

# Test Deep Work card
agent-browser click @deep-work-card
agent-browser wait --url "**/deep-work"
agent-browser get url  # Verify: /deep-work
agent-browser back

# Test Sprint card
agent-browser snapshot -i
agent-browser click @sprint-card
agent-browser wait --url "**/sprint"
agent-browser back

# Test Reading card
agent-browser snapshot -i
agent-browser click @reading-card
agent-browser wait --url "**/reading"
agent-browser back
```

**Selectors**:
- Cards use: `.pastel-card` class with color variants
  - Deep Work: `.pastel-card.pastel-orange` or card with "Deep Work" text
  - Sprint: `.pastel-card.pastel-blue` or card with "Sprint" text
  - Reading: `.pastel-card.pastel-yellow` or card with "Library" text
- Domain cards: Individual domain cards that link to `/deep-work/:domainId`

**Assertions**:
- [ ] Each card click navigates to correct route
- [ ] Greeting card displays student name
- [ ] All cards render without errors

---

## 4. Sprint Page

**Route**: `/sprint`
**Purpose**: Verify goal/task creation and management

```bash
agent-browser open http://localhost:5173/sprint
agent-browser snapshot -i

# Create a goal via AI chat (if available)
agent-browser fill @chat-input "I want to learn React hooks"
agent-browser click @send-button
agent-browser wait 2000

# Or create goal manually
agent-browser click @add-goal-button
agent-browser fill @goal-title "Test Goal"
agent-browser click @save-goal

# Create task under goal
agent-browser snapshot -i
agent-browser click @add-task-button
agent-browser fill @task-input "Test task"
agent-browser press Enter

# Complete task (click checkbox or task)
agent-browser snapshot -i
agent-browser click @task-checkbox
```

**Selectors**:
- Goal input: Input field for new goal title
- Task input: Input field within goal for new tasks
- Checkboxes: Checkbox elements for task completion
- Week toggle: Buttons for "Week 1" / "Week 2"

**Keyboard Shortcuts** (test with `agent-browser press`):
- Arrow keys: Navigate between tasks
- Space: Toggle task completion
- Delete: Remove selected task

**Assertions**:
- [ ] Goals persist after creation
- [ ] Tasks appear under correct goal
- [ ] Checkbox toggles completion state
- [ ] Week view switches correctly

### 4b. Habits (Daily Rituals)

**Route**: `/sprint` (scroll down to "Daily Rituals" section)
**Purpose**: Verify habit creation, day toggling, and editing

```bash
# On sprint page, scroll to habits section
agent-browser open http://localhost:5173/sprint
agent-browser snapshot -i

# Find the "Daily Rituals" section (scroll if needed)
agent-browser scrollintoview @daily-rituals-section

# Create a new habit
agent-browser click @add-new-habit-card  # Card with "+" icon and "New Ritual" text
agent-browser snapshot -i

# Fill habit name in the form that appears
agent-browser fill @new-habit-input "Test Habit"
agent-browser click @create-habit-button
agent-browser wait 1000
agent-browser snapshot -i

# Toggle a day completion (click on day orb)
agent-browser click @monday-orb  # Day orbs are M, T, W, T, F, S, S
agent-browser snapshot -i

# Verify the day orb changed state (filled/completed)

# Edit habit name (click on habit name text)
agent-browser click @habit-name  # Clicking name makes it editable
agent-browser snapshot -i
agent-browser fill @habit-name-input "Updated Habit Name"
agent-browser press Enter

# Edit habit description
agent-browser click @habit-description
agent-browser fill @habit-description-input "My daily ritual description"
agent-browser press Enter

# Change habit icon (click on icon)
agent-browser click @habit-icon
agent-browser snapshot -i  # Icon picker appears
agent-browser click @icon-option  # Select a different icon

# Delete a habit (hover reveals delete button)
agent-browser hover @habit-card
agent-browser click @habit-delete-button
agent-browser click @confirm-delete  # If confirmation dialog appears
```

**Selectors**:
- Daily Rituals section: Section with title "Daily Rituals" and sparkle icon
- Add habit card: `.add-new-card` with "+" icon and "New Ritual" text
- New habit input: `input[placeholder="Habit name..."]` in `.new-habit-form`
- Create button: `.btn-create` button
- Cancel button: `.btn-cancel` button
- Habit cards: `.art-habit-card` class
- Day orbs: `.day-orb-container` with `.day-orb` inside (M-T-W-T-F-S-S)
- Completed day: `.day-orb.completed`
- Habit name: `<h3>` element inside `.habit-info` (clickable to edit)
- Habit description: `<p>` element with description (clickable to edit)
- Icon picker: `.icon-picker-inline` with `.icon-option` buttons
- Streak badge: `.habit-streak` showing "X Days"
- Delete button: `.habit-delete-btn` (appears on hover)

**Assertions**:
- [ ] New habit appears in the list
- [ ] Day orb toggles between empty and completed states
- [ ] Streak counter updates when completing consecutive days
- [ ] Habit name/description edits persist
- [ ] Icon changes persist
- [ ] Deleted habit is removed from list

---

## 5. Deep Work

**Route**: `/deep-work` and `/deep-work/:domainId`
**Purpose**: Verify domain navigation and activity completion

```bash
agent-browser open http://localhost:5173/deep-work
agent-browser snapshot -i

# Click on a domain (circular view)
agent-browser click @domain-card  # First available domain
agent-browser wait --url "**/deep-work/**"
agent-browser snapshot -i

# Expand major objective (accordion)
agent-browser click @major-objective-header
agent-browser snapshot -i

# Expand sub-objective
agent-browser click @sub-objective-header
agent-browser snapshot -i

# Complete an activity (checkbox)
agent-browser click @activity-checkbox

# Click activity link (if external resource)
agent-browser snapshot -i
# agent-browser click @activity-link  # Opens external URL

# Navigate back
agent-browser click @back-button
```

**Selectors**:
- Domain cards: Cards in circular/grid layout on `/deep-work`
- Accordions: Collapsible sections for objectives
- Activity checkboxes: Checkboxes next to activities
- Activity links: `<a>` elements with external URLs
- Viva button: Appears when all activities complete

**Assertions**:
- [ ] Domain detail page loads
- [ ] Objectives expand/collapse
- [ ] Activity completion persists
- [ ] "Request Viva" button appears when eligible

---

## 6. Reading Library

**Route**: `/reading`
**Purpose**: Verify book browsing, reading flow, and review submission

```bash
agent-browser open http://localhost:5173/reading
agent-browser snapshot -i

# Search for a book
agent-browser fill @search-input "test"
agent-browser snapshot -i

# Switch tabs
agent-browser click @reading-tab      # "Reading" tab
agent-browser click @finished-tab     # "Finished" tab
agent-browser click @library-tab      # "Library" tab

# Click a book to open detail modal
agent-browser snapshot -i
agent-browser click @book-card
agent-browser snapshot -i

# Start reading
agent-browser click @read-button
agent-browser snapshot -i

# Mark as finished (if in Reading tab)
agent-browser click @finish-button

# Add rating/review
agent-browser snapshot -i
agent-browser click @star-5            # 5-star rating
agent-browser fill @review-textarea "Great book!"
agent-browser click @submit-review
```

**Selectors**:
- Search: `input[placeholder*="Search"]`
- Tabs: Buttons with text "Library", "Reading", "Finished"
- Book cards: Cards displaying book cover/title
- Read button: Button with text "Read" in detail modal
- Finish button: Button with text "Finish"
- Stars: Star rating elements (1-5)
- Review textarea: `textarea` for review text

**Assertions**:
- [ ] Search filters books correctly
- [ ] Tab switching works
- [ ] Book modal opens with details
- [ ] Reading status changes persist

---

## 7. Trust Jar

**Route**: `/trust-jar`
**Purpose**: Verify trust jar renders (read-only for students)

```bash
agent-browser open http://localhost:5173/trust-jar
agent-browser snapshot -i
agent-browser screenshot trust-jar.png
```

**Assertions**:
- [ ] Animation renders
- [ ] Page loads without errors

---

# Admin Flows

## 1. Admin Login

**Route**: `/login`
**Purpose**: Verify admin authentication and dashboard access

```bash
agent-browser open http://localhost:5173/login
agent-browser snapshot -i

# Fill admin credentials
agent-browser fill @username "admin-username"
agent-browser fill @password "admin-password"
agent-browser click @login-button
agent-browser wait --url "**/admin"
agent-browser snapshot -i
```

**Assertions**:
- [ ] Redirects to `/admin` (not `/dashboard`)
- [ ] Admin sidebar visible

---

## 2. Admin Dashboard Overview

**Route**: `/admin`
**Purpose**: Verify stats cards and quick actions

```bash
agent-browser open http://localhost:5173/admin
agent-browser snapshot -i

# Click stats cards
agent-browser click @students-stat-card
agent-browser wait --url "**/admin/students"
agent-browser back

agent-browser snapshot -i
agent-browser click @viva-stat-card
agent-browser wait --url "**/admin/viva"
agent-browser back

# Quick approve viva (double-click)
agent-browser snapshot -i
agent-browser dblclick @approve-viva-button  # If pending viva exists

# Quick approve presentation
agent-browser dblclick @approve-presentation-button  # If pending
```

**Selectors**:
- Stats cards: Cards showing counts (Students, Vivas, Sprint, Check-ins)
- Quick action buttons: "Add Student", "Manage Sprint", etc.
- Approve buttons: Buttons requiring double-click for confirmation

**Assertions**:
- [ ] Stats display correct counts
- [ ] Card clicks navigate correctly
- [ ] Double-click approve works

---

## 3. Students Management

**Route**: `/admin/students`
**Purpose**: Verify CRUD operations for students

```bash
agent-browser open http://localhost:5173/admin/students
agent-browser snapshot -i

# Search students
agent-browser fill @search-input "test"
agent-browser snapshot -i

# Filter by batch
agent-browser click @batch-filter
agent-browser snapshot -i
agent-browser click @batch-option  # Select a batch

# Open Add Student dialog
agent-browser click @add-student-button
agent-browser snapshot -i

# Fill new student form (for reference only - don't create in smoke test)
# agent-browser fill @display-name "Test Student"
# agent-browser fill @username "test.student"
# agent-browser fill @password "testpass123"
# agent-browser click @create-button

# Close dialog
agent-browser press Escape

# Click student row to view detail
agent-browser snapshot -i
agent-browser click @student-row
agent-browser wait --url "**/admin/students/**"
```

**Selectors**:
- Search: `input[placeholder="Search students..."]`
- Batch filter: `Select` dropdown
- Add button: Button with text "Add Student"
- Form inputs:
  - Display name: `input[placeholder*="John Smith"]`
  - Username: `input[placeholder*="john.smith"]`
  - Password: `input[type="password"]`
- Student rows: Table rows or list items

**Assertions**:
- [ ] Search filters list
- [ ] Batch filter works
- [ ] Add dialog opens/closes
- [ ] Student detail page loads

---

## 4. Student Detail & Assignment

**Route**: `/admin/students/:studentId`
**Purpose**: Verify objective assignment flow

```bash
# Assumes we're on student detail page
agent-browser snapshot -i

# View assigned objectives by domain
agent-browser click @domain-tab  # If tabbed

# Assign new objective
agent-browser click @assign-button
agent-browser snapshot -i
agent-browser click @objective-checkbox  # Select objective
agent-browser click @confirm-assign

# Unassign objective
agent-browser snapshot -i
agent-browser click @unassign-button
```

**Assertions**:
- [ ] Student profile displays
- [ ] Assigned objectives visible
- [ ] Assignment dialog works

---

## 5. Sprints Management

**Route**: `/admin/sprints`
**Purpose**: Verify sprint CRUD operations

```bash
agent-browser open http://localhost:5173/admin/sprints
agent-browser snapshot -i

# Open Create Sprint dialog
agent-browser click @add-sprint-button
agent-browser snapshot -i

# Fill sprint form (for reference - be careful creating)
# agent-browser fill @sprint-name "Test Sprint"
# agent-browser fill @start-date "2025-01-01"
# agent-browser fill @end-date "2025-01-14"
# agent-browser click @create-sprint

# Close dialog
agent-browser press Escape

# Set sprint as active (if not already)
agent-browser snapshot -i
agent-browser click @set-active-checkbox  # On existing sprint row
```

**Selectors**:
- Add button: Button with text "Add Sprint" or "New Sprint"
- Name input: `input[type="text"]` in dialog
- Date inputs: `input[type="date"]` (start and end)
- Active checkbox: Checkbox in sprint row
- Edit/Delete: Icon buttons in sprint row

**Assertions**:
- [ ] Sprint list displays
- [ ] Create dialog works
- [ ] Active status toggles

---

## 6. Projects Management

**Route**: `/admin/projects`
**Purpose**: Verify project CRUD and navigation to detail page

```bash
agent-browser open http://localhost:5173/admin/projects
agent-browser snapshot -i

# View active project card (if exists)
# Click "Enter Data" to go to project detail
agent-browser click @enter-data-button
agent-browser wait --url "**/admin/projects/**"
agent-browser snapshot -i

# Navigate back
agent-browser back

# Open Create Project dialog
agent-browser click @new-project-button
agent-browser snapshot -i

# Fill project form (for reference - be careful creating)
# agent-browser fill @project-name "Test Project"
# agent-browser fill @project-description "Test description"
# agent-browser fill @start-date "2025-01-01"
# agent-browser fill @end-date "2025-02-15"
# agent-browser click @create-project

# Close dialog
agent-browser press Escape

# Set project as active (via dropdown menu)
agent-browser snapshot -i
agent-browser click @project-row-menu  # Three dots menu
agent-browser click @set-active-option
```

**Selectors**:
- Active project card: Card with "Active" badge
- Enter Data button: Button with "Enter Data" text
- New Project button: Button with text "New Project"
- Project name input: `input[placeholder*="Project"]` in dialog
- Description textarea: `textarea` in dialog
- Date inputs: `input[type="date"]` (start and end)
- Project table rows: Table rows with project info (clickable)
- Row menu: Three dots button in each row
- Set Active option: Dropdown menu item "Set Active"

**Assertions**:
- [ ] Project list displays
- [ ] Active project card shows correctly
- [ ] Create dialog works
- [ ] Can set project as active
- [ ] Clicking row navigates to detail page

---

### 6b. Project Detail (Adding Links & Reflections)

**Route**: `/admin/projects/:projectId`
**Purpose**: Verify adding student work links and reflections

```bash
# Navigate to project detail (or continue from above)
agent-browser open http://localhost:5173/admin/projects
agent-browser click @enter-data-button
agent-browser wait --url "**/admin/projects/**"
agent-browser snapshot -i

# Search for a student
agent-browser fill @search-input "test"
agent-browser snapshot -i

# Filter by batch
agent-browser click @batch-filter
agent-browser click @batch-option

# Filter by status
agent-browser click @status-filter
agent-browser click @status-option  # Complete, Partial, No Data

# Expand a student card to see details
agent-browser click @student-card-header
agent-browser snapshot -i

# Add a link to student's work
agent-browser click @add-link-button
agent-browser snapshot -i

# Fill link form
agent-browser fill @link-title "Final Presentation"
agent-browser fill @link-url "https://docs.google.com/presentation/..."

# Select link type
agent-browser click @link-type-dropdown
agent-browser snapshot -i
agent-browser click @presentation-option  # or document, video, other

# Save the link
agent-browser click @save-link-button
agent-browser wait 1000
agent-browser snapshot -i

# Fill reflection questions
agent-browser fill @did-well-textarea "Student demonstrated excellent understanding..."
agent-browser fill @project-description-textarea "Created a web app that..."
agent-browser fill @could-improve-textarea "Could improve on testing..."

# Reflections auto-save on blur, or click elsewhere
agent-browser click @student-card-header  # Collapse to trigger save

# Remove a link (if needed)
agent-browser click @student-card-header  # Re-expand
agent-browser hover @link-item
agent-browser click @remove-link-button

# Open AI Assistant chat
agent-browser click @ai-assistant-button
agent-browser snapshot -i
agent-browser press Escape  # Close chat
```

**Selectors**:
- Search input: `input[placeholder="Search students..."]`
- Batch filter: `Select` with "All Batches" placeholder
- Status filter: `Select` with "All Status" placeholder
- Status options: "Complete", "Partial", "No Data"
- Student cards: Cards with student name and avatar
- Card header: Clickable header to expand/collapse
- Status badge: Badge showing "Complete", "Partial", or "No Data"
- Add Link button: Button with "Add Link" text and plus icon
- Link form:
  - Title input: `input[placeholder="Link title (e.g., Final Presentation)"]`
  - URL input: `input[placeholder="URL (https://...)"]`
  - Type dropdown: `Select` with presentation/document/video/other options
- Save Link button: Button with "Add Link" text in form
- Cancel button: Button to cancel link addition
- Existing links: Items showing emoji icon, title, and URL
- Remove link button: Trash icon button (appears on hover)
- Reflection textareas:
  - Did well: `textarea[placeholder="Describe what this student did well..."]`
  - Project description: `textarea[placeholder="Brief description of their project..."]`
  - Could improve: `textarea[placeholder="Areas for improvement..."]`
- AI Assistant button: Button with "AI Assistant" text

**Assertions**:
- [ ] Student list displays with correct status badges
- [ ] Search filters students
- [ ] Batch/Status filters work
- [ ] Student card expands to show details
- [ ] Can add link with title, URL, and type
- [ ] Link appears in student's link list
- [ ] Can remove link
- [ ] Reflection textareas accept input
- [ ] Reflections save (check for "Saving..." indicator)
- [ ] Status badge updates when all fields filled

---

## 7. Objectives Management

**Route**: `/admin/objectives`
**Purpose**: Verify objective hierarchy CRUD

```bash
agent-browser open http://localhost:5173/admin/objectives
agent-browser snapshot -i

# Switch domain tabs
agent-browser click @domain-tab  # e.g., "Software Engineering"
agent-browser snapshot -i

# Expand existing major objective
agent-browser click @major-objective-row
agent-browser snapshot -i

# View sub-objectives
agent-browser click @sub-objective-row
agent-browser snapshot -i

# View activities list
```

**Selectors**:
- Domain tabs: Tab buttons for each domain
- Major objectives: Expandable rows/accordions
- Sub-objectives: Nested under majors
- Activities: Listed under sub-objectives
- Add buttons: "Add Major", "Add Sub", "Add Activity"

**Assertions**:
- [ ] Domain tabs switch content
- [ ] Hierarchy expands correctly
- [ ] CRUD operations work

---

## 8. Viva Queue

**Route**: `/admin/viva`
**Purpose**: Verify viva approval/rejection flow

```bash
agent-browser open http://localhost:5173/admin/viva
agent-browser snapshot -i

# If pending vivas exist:
# Approve viva
agent-browser click @approve-button
agent-browser snapshot -i  # Confirm dialog may appear
agent-browser click @confirm-approve

# Reject viva ("Not Yet")
agent-browser snapshot -i
agent-browser click @reject-button
```

**Selectors**:
- Pending viva rows: Cards or list items with student info
- Approve button: Button with text "Approve" or checkmark icon
- Reject button: Button with text "Not Yet" or X icon
- Confirm dialog: Dialog with confirm/cancel buttons

**Assertions**:
- [ ] Pending list displays
- [ ] Approve removes from queue
- [ ] Reject removes from queue

---

## 9. Presentation Queue

**Route**: `/admin/presentations`
**Purpose**: Verify presentation approval flow

```bash
agent-browser open http://localhost:5173/admin/presentations
agent-browser snapshot -i

# Similar to viva queue
agent-browser click @approve-button
agent-browser click @reject-button
```

**Assertions**:
- [ ] Pending presentations display
- [ ] Approval works

---

## 10. Books Management

**Route**: `/admin/books`
**Purpose**: Verify book CRUD operations

```bash
agent-browser open http://localhost:5173/admin/books
agent-browser snapshot -i

# Search books
agent-browser fill @search-input "test"

# Add new book dialog
agent-browser click @add-book-button
agent-browser snapshot -i

# Close without creating
agent-browser press Escape
```

**Selectors**:
- Search: `input[placeholder*="Search"]`
- Add button: Button with text "Add Book"
- Book form: Title, author, cover URL, description inputs
- Book cards: Cards showing book info

**Assertions**:
- [ ] Book list displays
- [ ] Search filters correctly
- [ ] Add dialog opens

---

## 11. Trust Jar Admin

**Route**: `/admin/trust-jar`
**Purpose**: Verify admin can modify trust jar

```bash
agent-browser open http://localhost:5173/admin/trust-jar
agent-browser snapshot -i

# Add particle
agent-browser click @add-particle-button

# Remove particle
agent-browser click @remove-particle-button

# Reset jar (careful!)
# agent-browser click @reset-button
# agent-browser click @confirm-reset
```

**Assertions**:
- [ ] Particle count changes
- [ ] Animation updates

---

# Core Smoke Test Checklist

## Student Critical Path
```bash
# Run these in sequence for basic smoke test
agent-browser open http://localhost:5173/login
# ... login as student
# ... complete check-in
# ... verify dashboard loads
# ... navigate to sprint, create task
# ... navigate to deep-work, complete activity
# ... navigate to reading, start book
agent-browser close
```

## Admin Critical Path
```bash
# Run these in sequence
agent-browser open http://localhost:5173/login
# ... login as admin
# ... verify dashboard stats
# ... navigate to students, verify list
# ... navigate to sprints, verify active sprint
# ... navigate to objectives, verify structure
# ... approve one viva (if available)
agent-browser close
```

---

# Troubleshooting

## Common Issues

**Element not found**:
```bash
# Re-snapshot after any navigation or state change
agent-browser snapshot -i
```

**Stale refs**:
```bash
# Refs change after DOM updates - always re-snapshot
agent-browser click @e1
agent-browser wait 1000
agent-browser snapshot -i  # Get fresh refs
```

**Auth issues**:
```bash
# Check current URL
agent-browser get url

# Check localStorage for token
agent-browser storage local "deep-work-tracker-token"
```

**Wait for network**:
```bash
agent-browser wait --load networkidle
```

---

# Tips

1. **Always snapshot after navigation** - refs change with DOM
2. **Use `--headed` flag for debugging** - see what's happening
3. **Screenshot on failures** - `agent-browser screenshot failure.png`
4. **Check console for errors** - `agent-browser console`
5. **Use semantic locators** - `agent-browser find text "Login" click`
