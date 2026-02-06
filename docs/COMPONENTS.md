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
| Student sidebar (shows @username + displayName) | `src/components/layout/Sidebar.tsx` |
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
| Student project cards (add/edit/delete links + reflections) | `src/components/projects/StudentProjectCard.tsx` |
| AI data entry chat (multi-turn project data assistant) | `src/components/projects/ProjectDataChat.tsx` |

### Vision Board
| Want to change... | Edit this file |
|-------------------|----------------|
| Board grid layout | `src/components/visionboard/VisionBoardGrid.tsx` |
| Floating action button | `src/components/visionboard/VisionBoardFAB.tsx` |
| Card creator sheet | `src/components/visionboard/CardCreatorSheet.tsx` |
| Card detail/edit sheet | `src/components/visionboard/CardDetailSheet.tsx` |
| Area filter bar | `src/components/visionboard/AreaFilter.tsx` |
| Card type renderer | `src/components/visionboard/CardRenderer.tsx` |
| Counter card | `src/components/visionboard/cards/CounterCard.tsx` |
| Habits card | `src/components/visionboard/cards/HabitsCard.tsx` |
| Image hero card | `src/components/visionboard/cards/ImageHeroCard.tsx` |
| Journal card | `src/components/visionboard/cards/JournalCard.tsx` |
| Mini tile card | `src/components/visionboard/cards/MiniTileCard.tsx` |
| Motivation card | `src/components/visionboard/cards/MotivationCard.tsx` |
| Progress card | `src/components/visionboard/cards/ProgressCard.tsx` |
| Streak card | `src/components/visionboard/cards/StreakCard.tsx` |
| Dynamic Phosphor icons | `src/components/visionboard/PhIcon.tsx` |
| Grid layout logic | `src/components/visionboard/layout.ts` |

### Other
| Want to change... | Edit this file |
|-------------------|----------------|
| Trust jar visualization | `src/components/trustjar/TrustJar.tsx` |
| Task assigner | `src/components/student/TaskAssigner.tsx` |

## Pages

All pages are in `src/pages/`.

### Student Pages
| Page | File |
|------|------|
| Dashboard | `student/StudentDashboard.tsx` |
| Emotion check-in | `student/EmotionCheckInPage.tsx` |
| Sprint view | `student/SprintPage.tsx` |
| Reading library | `student/ReadingPage.tsx` |
| Deep work | `student/DeepWorkPage.tsx` |
| Domain detail | `student/DomainDetailPage.tsx` |
| Diagnostic quiz | `student/DiagnosticPage.tsx` |
| Trust jar | `student/TrustJarPage.tsx` |
| Vision board | `student/VisionBoardPage.tsx` |
| Settings (student: username/password + avatar URL/GIF) | `student/SettingsPage.tsx` |

### Admin Pages
| Page | File |
|------|------|
| Dashboard | `admin/AdminDashboard.tsx` |
| Students list | `admin/StudentsPage.tsx` |
| Student detail | `admin/StudentDetailPage.tsx` |
| Sprints | `admin/SprintsPage.tsx` |
| Projects | `admin/ProjectsPage.tsx` |
| Project detail | `admin/ProjectDetailPage.tsx` |
| Objectives | `admin/ObjectivesPage.tsx` |
| Books | `admin/BooksPage.tsx` |
| Viva queue | `admin/VivaQueuePage.tsx` |
| Presentation queue | `admin/PresentationQueuePage.tsx` |
| Trust jar (admin) | `admin/TrustJarPage.tsx` |
| Norms (strikes/penalties) | `admin/NormsPage.tsx` |
| Settings (admin: own profile photo + credential management) | `admin/SettingsPage.tsx` |

## Hooks

| Hook | File | Purpose |
|------|------|---------|
| useAuth | `src/hooks/useAuth.tsx` | Authentication state + login/logout |
| useVisionBoard | `src/hooks/useVisionBoard.ts` | Vision board CRUD + card interactions |
| useDelayedLoading | `src/hooks/useDelayedLoading.ts` | Prevent skeleton flash (200ms) |
| useMobile | `src/hooks/use-mobile.tsx` | Mobile viewport detection |

## Utilities

| File | Purpose |
|------|---------|
| `src/lib/status-utils.ts` | Status badge configs for objectives, goals, books |
| `src/lib/utils.ts` | General utilities (cn, etc.) |
| `src/lib/diagnostic.ts` | Diagnostic quiz types, data loading, question selection |
| `src/lib/domain-utils.tsx` | Domain SVG icons, colors, descriptions |
| `src/lib/emotions.ts` | Emotion category/subcategory helpers |
| `src/lib/skill-tree-utils.ts` | Skill tree layout calculations |
| `src/lib/horizontal-tree-utils.ts` | Horizontal tree layout calculations |

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
| Habits | `habits.ts` |
| Objectives | `objectives.ts` |
| Activities | `activities.ts` |
| Progress tracking | `progress.ts` |
| Books | `books.ts` |
| Emotions | `emotions.ts` |
| Domains | `domains.ts` |
| Projects | `projects.ts` |
| Project links | `projectLinks.ts` |
| Project reflections | `projectReflections.ts` |
| Trust jar | `trustJar.ts` |
| Vision board | `visionBoard.ts` |
| Norms (strikes/penalties) | `norms.ts` |
| Diagnostics | `diagnostics.ts` |
| Chat logs | `chatLogs.ts` |
| Migrations | `migrations.ts` |
| Seed data | `seed.ts` |
| Schema | `schema.ts` |
