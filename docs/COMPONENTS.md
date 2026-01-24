# Component Quick Reference

Quick lookup guide for developers. Find the file you need to edit.

## UI Components

### Base UI (shadcn/ui)
Located in `src/components/ui/` - Standard shadcn components, rarely need modification.

| Component | File | Use Case |
|-----------|------|----------|
| Button | `button.tsx` | All button variants |
| Card | `card.tsx` | Container cards |
| Dialog | `dialog.tsx` | Modal dialogs |
| Input | `input.tsx` | Text inputs |
| Select | `select.tsx` | Dropdowns |
| Skeleton | `skeleton.tsx` | Loading placeholders |
| Table | `table.tsx` | Data tables |
| Tabs | `tabs.tsx` | Tab navigation |
| Tooltip | `tooltip.tsx` | Hover tooltips |
| Avatar | `avatar.tsx` | User avatars |
| Badge | `badge.tsx` | Status badges |

### Custom Paper UI
Located in `src/components/paper/` - Custom "paper" aesthetic components.

| Component | File | Use Case |
|-----------|------|----------|
| Button | `Button.tsx` | Paper-styled buttons |
| Card | `Card.tsx` | Glass/paper cards |
| Input | `Input.tsx` | Paper-styled inputs |
| Modal | `Modal.tsx` | Paper-styled modals |
| Checkbox | `Checkbox.tsx` | Paper checkboxes |
| Badge | `Badge.tsx` | Paper badges |
| ProgressBar | `ProgressBar.tsx` | Progress indicators |
| LoadingSpinner | `LoadingSpinner.tsx` | Loading animation |

## Feature Components

### Layout
| Want to change... | Edit this file |
|-------------------|----------------|
| Dashboard layout/sidebar | `src/components/layout/DashboardLayout.tsx` |
| Admin layout/navigation | `src/components/layout/AdminLayout.tsx` |
| Student sidebar | `src/components/layout/Sidebar.tsx` |
| Header/top bar | `src/components/layout/Header.tsx` |
| Emotion check-in gate | `src/components/layout/CheckInGate.tsx` |

### Authentication
| Want to change... | Edit this file |
|-------------------|----------------|
| Login form | `src/components/auth/LoginForm.tsx` |
| Route protection | `src/components/auth/ProtectedRoute.tsx` |

### Sprint/Goals
| Want to change... | Edit this file |
|-------------------|----------------|
| Goal cards | `src/components/sprint/GoalCard.tsx` |
| Goal editor form | `src/components/sprint/GoalEditor.tsx` |
| AI goal chat | `src/components/sprint/GoalChatPalette.tsx` |
| Habit tracker | `src/components/sprint/HabitTracker.tsx` |

### Deep Work
| Want to change... | Edit this file |
|-------------------|----------------|
| Domain cards | `src/components/deepwork/DomainCard.tsx` |
| Objective cards | `src/components/deepwork/LearningObjectiveCard.tsx` |

### Reading
| Want to change... | Edit this file |
|-------------------|----------------|
| Book cards | `src/components/reading/BookCard.tsx` |
| AI book buddy | `src/components/reading/BookBuddy.tsx` |

### Emotions
| Want to change... | Edit this file |
|-------------------|----------------|
| Emotion selection wheel | `src/components/emotions/EmotionWheel.tsx` |
| Emotion cards | `src/components/emotions/EmotionCard.tsx` |
| Emotion history view | `src/components/emotions/EmotionHistory.tsx` |
| Journal entry | `src/components/emotions/EmotionJournal.tsx` |

### Skill Tree
| Want to change... | Edit this file |
|-------------------|----------------|
| Skill node display | `src/components/skill-tree/SkillNode.tsx` |
| Subject node | `src/components/skill-tree/SubjectNode.tsx` |
| Tree canvas layout | `src/components/skill-tree/SkillTreeCanvas.tsx` |
| Horizontal tree | `src/components/skill-tree/HorizontalTreeCanvas.tsx` |
| Node connections | `src/components/skill-tree/SVGConnections.tsx` |
| Objective popover | `src/components/skill-tree/ObjectivePopover.tsx` |

### Projects
| Want to change... | Edit this file |
|-------------------|----------------|
| Student project cards | `src/components/projects/StudentProjectCard.tsx` |
| AI data entry chat | `src/components/projects/ProjectDataChat.tsx` |

### Other
| Want to change... | Edit this file |
|-------------------|----------------|
| Trust jar visualization | `src/components/trustjar/TrustJar.tsx` |
| Task assigner | `src/components/student/TaskAssigner.tsx` |
| User settings modal | `src/components/settings/UserSettingsModal.tsx` |

## Pages

All pages are in `src/pages/`.

### Student Pages
| Page | File |
|------|------|
| Dashboard | `student/StudentDashboard.tsx` |
| Sprint view | `student/SprintPage.tsx` |
| Reading library | `student/ReadingPage.tsx` |
| Deep work | `student/DeepWorkPage.tsx` |
| Skill tree | `student/SkillTreePage.tsx` |

### Admin Pages
| Page | File |
|------|------|
| Dashboard | `admin/AdminDashboard.tsx` |
| Students list | `admin/StudentsPage.tsx` |
| Student detail | `admin/StudentDetailPage.tsx` |
| Sprints | `admin/SprintsPage.tsx` |
| Objectives | `admin/ObjectivesPage.tsx` |
| Books | `admin/BooksPage.tsx` |
| Viva queue | `admin/VivaPage.tsx` |

## Hooks

| Hook | File | Purpose |
|------|------|---------|
| useAuth | `src/hooks/useAuth.tsx` | Authentication state |
| useDelayedLoading | `src/hooks/useDelayedLoading.ts` | Prevent skeleton flash |
| useMobile | `src/hooks/use-mobile.tsx` | Mobile detection |
| useClickSound | `src/hooks/useClickSound.ts` | Click sound effects |

## Utilities

| File | Purpose |
|------|---------|
| `src/lib/status-utils.ts` | Status badge colors/classes |
| `src/lib/utils.ts` | General utilities (cn, etc.) |

## Styling

| Want to change... | Edit this file |
|-------------------|----------------|
| Global styles | `src/index.css` |
| Tailwind config | `tailwind.config.js` |
| CSS variables/themes | `src/index.css` (`:root` section) |

## Database (Convex)

All database code is in `convex/`.

| Feature | File |
|---------|------|
| AI chat actions | `ai.ts` |
| Authentication | `auth.ts` |
| Users | `users.ts` |
| Sprints | `sprints.ts` |
| Goals | `goals.ts` |
| Objectives | `objectives.ts` |
| Books | `books.ts` |
| Emotions | `emotions.ts` |
| Domains | `domains.ts` |
| Progress tracking | `progress.ts` |
| Schema | `schema.ts` |
