# Deep Work Tracker - Project Overview

## Purpose
A learning management app for students to track their goals, emotions, reading progress, and skill mastery. Designed for young learners with coach/admin oversight.

## Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion (animations)
- **Backend**: Convex (serverless database + functions)
- **Routing**: React Router DOM v7
- **Testing**: Vitest, Testing Library

## Project Structure
```
/
├── src/
│   ├── App.tsx              # Main app with routing
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles (Tailwind)
│   ├── components/          # Reusable components
│   │   ├── auth/            # Login, protected routes
│   │   ├── deepwork/        # Learning objective components
│   │   ├── emotions/        # Emotion check-in components
│   │   ├── layout/          # Sidebar, header, dashboard layout
│   │   ├── reading/         # Book components
│   │   ├── sprint/          # Goals, habits components
│   │   └── ui/              # Generic UI (Button, Card, Modal, etc.)
│   ├── hooks/               # Custom hooks (useAuth)
│   ├── lib/                 # Utilities
│   ├── pages/               # Page components
│   │   ├── student/         # Student pages
│   │   └── admin/           # Admin pages
│   ├── test/                # Test setup
│   └── types/               # TypeScript types
├── convex/                  # Backend (Convex)
│   ├── schema.ts            # Database schema
│   ├── auth.ts              # Authentication mutations
│   ├── emotions.ts          # Emotion check-in
│   ├── goals.ts             # Sprint goals
│   ├── habits.ts            # Habit tracking
│   ├── objectives.ts        # Learning objectives
│   ├── progress.ts          # Activity progress
│   ├── books.ts             # Reading library
│   ├── sprints.ts           # Sprint management
│   ├── users.ts             # User queries
│   ├── domains.ts           # Learning domains
│   ├── seed.ts              # Database seeding
│   └── _generated/          # Auto-generated Convex files
├── public/                  # Static assets
└── dist/                    # Build output
```

## Key Concepts
- **Sprints**: Time-boxed periods for tracking goals and habits
- **Deep Work**: Learning domains (Math, Reading, Coding, Writing) with objectives and activities
- **Viva**: Verbal assessment to verify mastery
- **Emotion Check-in**: Daily emotional wellness tracking
