# Deep Work Tracker

<div align="center">

```
    ╭──────────────────────────────────────────╮
    │                                          │
    │      ✦  D E E P   W O R K  ✦            │
    │                                          │
    │    A mindful learning companion          │
    │    for focused skill mastery             │
    │                                          │
    ╰──────────────────────────────────────────╯
```

**A beautiful, flow-state-inducing learning tracker for students and coaches**

*Built with React 19 • TypeScript • Convex • Tailwind CSS v4 • shadcn/ui*

</div>

---

## ✨ Design Philosophy

Deep Work Tracker uses a hybrid **Paper UI + shadcn** design system — an ethereal, calming aesthetic for students combined with functional admin interfaces for coaches. The design prioritizes:

- **Calm over chaos** — Soft pastels, gentle animations, generous whitespace
- **Flow state** — Minimal distractions, focused interactions
- **Inevitability** — The right action always feels obvious
- **Guided experience** — System shepherds users through setup and daily workflows

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start Convex backend (creates tables automatically)
npx convex dev

# Start frontend (in another terminal)
npm run dev

# Open http://localhost:5173
```

### First-Time Setup

1. Navigate to `/login` — system detects no users exist
2. Click **"Begin Setup"** banner to create first admin account
3. Login as admin → Setup checklist guides you through:
   - Add Students
   - Create Sprint
   - Add Learning Objectives

---

## 👥 User Roles

### 🎓 Student Experience

| Feature | Description |
|---------|-------------|
| **Emotion Gate** | Must complete daily check-in before accessing any content |
| **Dashboard** | Bento grid with Deep Work, Sprint, Reading quick access |
| **Smart Routing** | Deep Work card routes to most relevant domain automatically |
| **Learning Objectives** | View assigned objectives, complete activities, request vivas |
| **Sprint Goals** | SMART goal wizard with weekly task calendar |
| **Reading Library** | Browse books, track reading progress, mark presentations |

**Login:** `student` / `student`

### 🧑‍🏫 Coach (Admin) Experience

| Feature | Description |
|---------|-------------|
| **Setup Checklist** | Guided onboarding: students → sprint → objectives |
| **Student Management** | Create accounts, assign batches, view details |
| **Learning Objectives** | Create objectives, assign to students, manage activities |
| **Viva Queue** | Review mastery requests with confirmation + notes |
| **Sprint Management** | Create/edit sprints with safe deletion dialogs |
| **Visibility Dashboard** | See today's check-ins with emotional state + journal |

**Login:** `admin` / `admin`

---

## 🎯 Key Features

### Student Side

- [x] **Mandatory emotion check-in gate** — Server-driven categories from database
- [x] **Smart Deep Work routing** — Routes to domain with in-progress work
- [x] **Activity completion tracking** — Separate "mark done" vs "open link" actions
- [x] **Viva request system** — Request mastery verification from coach
- [x] **Sprint goals** — SMART goal wizard with weekly task assignment
- [x] **Habit tracking** — Daily habits with streak visualization
- [x] **Reading library** — Browse, read, present books

### Coach Side

- [x] **Setup checklist** — Detects missing students/sprint/objectives, guides setup
- [x] **Student detail navigation** — Click check-ins or vivas to view student
- [x] **Viva confirmation dialogs** — Approve/reject with optional notes
- [x] **Safe sprint deletion** — Confirmation dialog with active sprint warning
- [x] **Batch management** — Filter students by class (2156, 2153)
- [x] **Objective assignment** — Assign from objectives page or student page
- [x] **Book library CRUD** — Full management with reading URLs

### UX Improvements

- [x] **First-run setup CTA** — Login page detects bootstrap needed
- [x] **Check-in save error handling** — Shows retry button on failure
- [x] **Domain tab defaults** — Objectives page defaults to first domain
- [x] **Session error handling** — Clear message when token expires
- [x] **Consistent navigation** — "Deep Work" label used everywhere

---

## 🎨 Design System

### Typography

| Role | Font | Usage |
|------|------|-------|
| Display | **Cormorant Garamond** | Headlines, large numbers, emphasis |
| Body | **Lato** | Paragraphs, labels, UI text |

### Color Palette

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ██████  Sage Green      #a8c5b5   Primary / Success          │
│   ██████  Blush Pink      #f2c6c2   Secondary / Love           │
│   ██████  Warm Beige      #e8d5b5   Accent / Warmth            │
│   ██████  Muted Teal      #8eb8bf   Info / Calm                │
│                                                                 │
│   Pastel Cards:                                                 │
│   ░░░░░░  pastel-green    #F0FFEB → #D4F5C4                    │
│   ░░░░░░  pastel-blue     #EBF1FF → #C4D4F5                    │
│   ░░░░░░  pastel-yellow   #FDF5D0 → #F5E6A3                    │
│   ░░░░░░  pastel-purple   #EEE4F1 → #D4C4E8                    │
│   ░░░░░░  pastel-orange   #FFEAD6 → #F5D4B8                    │
│   ░░░░░░  pastel-pink     #FBDADC → #F5C4C8                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Effects

- **Glass Morphism** — Frosted glass cards with backdrop blur
- **Ambient Blobs** — Floating gradient orbs in background
- **Paper Grain** — Subtle texture overlay
- **Breathing Glow** — Pulsing animation on key actions

---

## 📱 User Flows

### Student: Daily Flow

```
Login → Check-in Gate → Dashboard
                ↓
    ┌───────────┴───────────┐
    ↓           ↓           ↓
Deep Work    Sprint     Reading
    ↓
Domain → Objective → Activities → Request Viva
```

### Coach: Setup Flow

```
Login (first time) → Setup Banner → Create Admin
                         ↓
                    Admin Dashboard
                         ↓
              ┌──────────┼──────────┐
              ↓          ↓          ↓
         Add Students  Create    Add Objectives
                      Sprint
```

### Coach: Daily Flow

```
Admin Dashboard
      ↓
┌─────┴─────┬─────────────┬──────────────┐
↓           ↓             ↓              ↓
Check-ins   Viva Queue   Students    Objectives
(→ student) (confirm+notes) (→ detail)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **UI Components** | shadcn/ui (admin), Paper UI (student) |
| **Styling** | Tailwind CSS v4, CSS Variables |
| **Animation** | Framer Motion |
| **Backend** | Convex (serverless) |
| **Routing** | React Router v7 |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx           # Navigation (role-based)
│   │   ├── DashboardLayout.tsx   # Student layout wrapper
│   │   ├── AdminLayout.tsx       # Admin layout wrapper
│   │   └── CheckInGate.tsx       # Mandatory check-in (server-driven)
│   ├── ui/                       # shadcn components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── textarea.tsx
│   │   └── ...
│   ├── sprint/
│   │   └── GoalEditor.tsx        # SMART goal wizard
│   └── student/
│       └── TaskAssigner.tsx      # Weekly task calendar
├── pages/
│   ├── LoginPage.tsx             # With bootstrap detection
│   ├── SetupPage.tsx             # First admin creation
│   ├── student/
│   │   ├── StudentDashboard.tsx  # Bento grid + smart routing
│   │   ├── SprintPage.tsx        # Goals + habits
│   │   ├── DeepWorkPage.tsx      # Domain list
│   │   ├── DomainDetailPage.tsx  # Objectives + activities
│   │   └── ReadingPage.tsx       # Book library
│   └── admin/
│       ├── AdminDashboard.tsx    # Stats + setup checklist
│       ├── StudentsPage.tsx      # Student CRUD + batches
│       ├── StudentDetailPage.tsx # Individual student view
│       ├── ObjectivesPage.tsx    # Objectives + assignment
│       ├── VivaQueuePage.tsx     # Approval with notes
│       ├── SprintsPage.tsx       # Sprint CRUD + safe delete
│       └── BooksPage.tsx         # Book library management
├── hooks/
│   └── useAuth.tsx               # Auth context + session
└── index.css                     # Paper UI design tokens

convex/
├── schema.ts                     # Database schema
├── auth.ts                       # Login, sessions, bootstrap check
├── users.ts                      # User CRUD + batches
├── emotions.ts                   # Check-ins (server-driven categories)
├── sprints.ts                    # Sprint CRUD
├── goals.ts                      # Goals + action items
├── habits.ts                     # Habit tracking
├── domains.ts                    # Learning domains
├── objectives.ts                 # Objectives + student assignments
├── progress.ts                   # Domain progress summaries
└── books.ts                      # Reading library
```

---

## 🔐 Authentication

Simple session-based auth with Convex:

- Sessions stored in `sessions` table with 7-day expiry
- Token stored in localStorage
- Role-based routing (student vs admin)
- Bootstrap detection for first-run setup

---

## 📊 Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Students and admins with roles |
| `sessions` | Auth sessions with tokens |
| `emotionCategories` | Server-driven emotion options |
| `emotionCheckIns` | Daily student check-ins |
| `sprints` | Time-boxed learning periods |
| `goals` | Student SMART goals |
| `habits` | Daily habit tracking |
| `domains` | Learning subject areas |
| `learningObjectives` | Objectives within domains |
| `studentObjectives` | Assignment + progress tracking |
| `books` | Reading library catalog |
| `studentBooks` | Reading progress per student |

---

## 🌟 Design Credits

- **Paper UI** aesthetic inspired by [refined.so](https://refined.so)
- **Admin UI** built with [shadcn/ui](https://ui.shadcn.com)
- **Typography**: [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) + [Lato](https://fonts.google.com/specimen/Lato)
- **Icons**: Lucide React (admin), Heroicons (student)

---

## 📝 Development Notes

### Adding New Features

1. **Database**: Add schema in `convex/schema.ts`, run `npx convex dev`
2. **API**: Add queries/mutations in `convex/*.ts`
3. **UI**: Use shadcn components for admin, Paper UI for student
4. **Routes**: Add to `src/App.tsx` with appropriate ProtectedRoute

### Design Principles

- **Student pages**: Calm, spacious, minimal choices
- **Admin pages**: Functional, data-dense, action-oriented
- **Errors**: Always guide forward, never dead-end
- **Confirmations**: High-stakes actions require explicit confirmation

---

<div align="center">

*Built with care for focused learning*

```
"The successful warrior is the average man,
 with laser-like focus."
                          — Bruce Lee
```

</div>
