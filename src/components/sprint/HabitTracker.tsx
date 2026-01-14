import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

// Day labels for the week (Mon-Sun)
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Available icons for the icon picker
const AVAILABLE_ICONS = [
  "ph-book-open",
  "ph-plant",
  "ph-drop",
  "ph-pencil-simple",
  "ph-barbell",
  "ph-sun",
  "ph-moon",
  "ph-heart",
  "ph-star",
  "ph-lightning",
  "ph-fire",
  "ph-wind",
  "ph-music-notes",
  "ph-camera",
  "ph-paint-brush",
  "ph-code",
  "ph-coffee",
  "ph-bicycle",
  "ph-airplane",
  "ph-house",
  "ph-tree",
  "ph-mountains",
  "ph-infinity",
  "ph-brain",
];

// Color presets for habits
const HABIT_COLORS = [
  {
    name: "blue",
    tint: "var(--color-pastel-blue)",
    color: "#8da4ef",
    shadow: "rgba(141, 164, 239, 0.3)",
  },
  {
    name: "green",
    tint: "var(--color-pastel-green)",
    color: "#88c999",
    shadow: "rgba(136, 201, 153, 0.3)",
  },
  {
    name: "aqua",
    tint: "var(--color-pastel-blue)",
    color: "#64b5f6",
    shadow: "rgba(100, 181, 246, 0.3)",
  },
  {
    name: "purple",
    tint: "var(--color-pastel-purple)",
    color: "#b39ddb",
    shadow: "rgba(179, 157, 219, 0.3)",
  },
  {
    name: "orange",
    tint: "var(--color-pastel-orange)",
    color: "#ffb74d",
    shadow: "rgba(255, 183, 77, 0.3)",
  },
  {
    name: "pink",
    tint: "var(--color-pastel-pink)",
    color: "#f48fb1",
    shadow: "rgba(244, 143, 177, 0.3)",
  },
];

// Default icons for new habits
const DEFAULT_ICONS = [
  "ph-book-open",
  "ph-plant",
  "ph-drop",
  "ph-pencil-simple",
  "ph-barbell",
  "ph-star",
];

interface HabitTrackerProps {
  userId: Id<"users">;
  sprintId: Id<"sprints">;
  weekDates: { date: string; dayOfWeek: number; dayNum: number; displayIndex: number }[];
}

export function HabitTracker({ userId, sprintId, weekDates }: HabitTrackerProps) {
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"name" | "description" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [iconPickerOpen, setIconPickerOpen] = useState<string | null>(null);
  const [showNewHabitForm, setShowNewHabitForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");

  const habits = useQuery(api.habits.getByUserAndSprint, { userId, sprintId });

  const createHabit = useMutation(api.habits.create);
  const updateHabit = useMutation(api.habits.update);
  const toggleCompletion = useMutation(api.habits.toggleCompletion);
  const removeHabit = useMutation(api.habits.remove);

  function calculateStreak(completions: { date: string; completed: boolean }[] | undefined): number {
    if (!completions || completions.length === 0) return 0;

    const completedDates = completions
      .filter((c) => c.completed)
      .map((c) => c.date)
      .sort()
      .reverse();

    if (completedDates.length === 0) return 0;

    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = today;

    for (const date of completedDates) {
      if (date === checkDate) {
        streak++;
        const d = new Date(checkDate);
        d.setDate(d.getDate() - 1);
        checkDate = d.toISOString().split("T")[0];
      } else if (date < checkDate) {
        break;
      }
    }

    return streak;
  }

  async function handleToggleCompletion(habitId: string, date: string): Promise<void> {
    await toggleCompletion({
      habitId: habitId as Id<"habits">,
      userId,
      date,
    });
  }

  async function handleSaveEdit(habitId: string): Promise<void> {
    if (!editValue.trim()) {
      setEditingHabitId(null);
      setEditingField(null);
      return;
    }

    if (editingField === "name") {
      await updateHabit({
        habitId: habitId as Id<"habits">,
        name: editValue.trim(),
      });
    } else if (editingField === "description") {
      await updateHabit({
        habitId: habitId as Id<"habits">,
        whatIsHabit: editValue.trim(),
      });
    }

    setEditingHabitId(null);
    setEditingField(null);
    setEditValue("");
  }

  async function handleSelectIcon(habitId: string, iconClass: string): Promise<void> {
    await updateHabit({
      habitId: habitId as Id<"habits">,
      description: iconClass, // Using description field to store icon
    });
    setIconPickerOpen(null);
  }

  async function handleCreateHabit(): Promise<void> {
    if (!newHabitName.trim()) return;

    const iconIndex = (habits?.length || 0) % DEFAULT_ICONS.length;

    await createHabit({
      userId,
      sprintId,
      name: newHabitName.trim(),
      whatIsHabit: "Define what this habit is",
      howToPractice: "How you'll practice it",
      description: DEFAULT_ICONS[iconIndex], // Store icon in description
    });

    setNewHabitName("");
    setShowNewHabitForm(false);
  }

  async function handleDeleteHabit(habitId: string, habitName: string): Promise<void> {
    if (confirm(`Delete "${habitName}"?`)) {
      await removeHabit({ habitId: habitId as Id<"habits"> });
    }
  }

  function getHabitIcon(habit: { description?: string }, index: number): string {
    if (habit.description && habit.description.startsWith("ph-")) {
      return habit.description;
    }
    return DEFAULT_ICONS[index % DEFAULT_ICONS.length];
  }

  function getHabitColor(index: number): (typeof HABIT_COLORS)[number] {
    return HABIT_COLORS[index % HABIT_COLORS.length];
  }

  return (
    <div className="habit-section fade-in-up delay-2" style={{ marginTop: "80px" }}>
      {/* Section Title */}
      <h2 className="habit-section-title">
        <i className="ph ph-sparkle" style={{ fontSize: "28px", color: "var(--color-accent)" }} />
        Daily Rituals
      </h2>

      {/* Habits Container */}
      <div className="habits-container">
        <AnimatePresence mode="popLayout">
          {habits?.map((habit: any, index: number) => {
            const color = getHabitColor(index);
            const icon = getHabitIcon(habit, index);
            const streak = calculateStreak(habit.completions);
            const isEditingName = editingHabitId === habit._id && editingField === "name";
            const isEditingDesc = editingHabitId === habit._id && editingField === "description";

            return (
              <motion.div
                key={habit._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="art-habit-card"
                style={{
                  "--card-tint": color.tint,
                  "--tint-color": color.color,
                  "--tint-shadow": color.shadow,
                } as React.CSSProperties}
              >
                {/* Habit Header */}
                <div className="habit-header">
                  <div className="habit-info">
                    {/* Icon (clickable to change) */}
                    <i
                      className={`ph ${icon} habit-icon-trigger`}
                      onClick={() => setIconPickerOpen(iconPickerOpen === habit._id ? null : habit._id)}
                      style={{
                        fontSize: "24px",
                        color: color.color,
                        marginBottom: "8px",
                        cursor: "pointer",
                      }}
                      title="Click to change icon"
                    />

                    {/* Habit Name (editable) */}
                    {isEditingName ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(habit._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEdit(habit._id);
                          }
                          if (e.key === "Escape") {
                            setEditingHabitId(null);
                            setEditingField(null);
                          }
                        }}
                        autoFocus
                        className="habit-edit-input"
                        style={{ fontSize: "1.5rem" }}
                      />
                    ) : (
                      <h3
                        onClick={() => {
                          setEditingHabitId(habit._id);
                          setEditingField("name");
                          setEditValue(habit.name);
                        }}
                        style={{ cursor: "text" }}
                        title="Click to edit"
                      >
                        {habit.name}
                      </h3>
                    )}

                    {/* Description (editable) */}
                    {isEditingDesc ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveEdit(habit._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveEdit(habit._id);
                          }
                          if (e.key === "Escape") {
                            setEditingHabitId(null);
                            setEditingField(null);
                          }
                        }}
                        autoFocus
                        className="habit-edit-input"
                        style={{ fontSize: "13px", marginTop: "4px" }}
                      />
                    ) : (
                      <p
                        onClick={() => {
                          setEditingHabitId(habit._id);
                          setEditingField("description");
                          setEditValue(habit.whatIsHabit || "");
                        }}
                        style={{
                          fontSize: "13px",
                          opacity: 0.6,
                          marginTop: "4px",
                          cursor: "text",
                        }}
                        title="Click to edit"
                      >
                        {habit.whatIsHabit || "Add description"}
                      </p>
                    )}
                  </div>

                  {/* Streak Badge */}
                  <div className="habit-streak">
                    <i className="ph ph-flame" />
                    <span>{streak}</span> Days
                  </div>
                </div>

                {/* Icon Picker (shown when open) */}
                <AnimatePresence>
                  {iconPickerOpen === habit._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="icon-picker-inline"
                    >
                      <div className="icon-grid-inline">
                        {AVAILABLE_ICONS.map((iconClass) => (
                          <button
                            key={iconClass}
                            className={`icon-option ${icon === iconClass ? "selected" : ""}`}
                            onClick={() => handleSelectIcon(habit._id, iconClass)}
                          >
                            <i className={`ph ${iconClass}`} />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Week Visual (Day Orbs) */}
                <div className="habit-week-visual">
                  {weekDates.map((dayInfo, dayIndex) => {
                    const isCompleted = habit.completions?.some(
                      (c: any) => c.date === dayInfo.date && c.completed
                    );

                    return (
                      <div
                        key={dayInfo.date}
                        className="day-orb-container"
                        onClick={() => handleToggleCompletion(habit._id, dayInfo.date)}
                      >
                        <span className="day-label">{DAY_LABELS[dayIndex]}</span>
                        <motion.div
                          className={`day-orb ${isCompleted ? "completed" : ""}`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          animate={isCompleted ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ duration: 0.2 }}
                          style={{
                            "--tint-color": color.color,
                            "--tint-shadow": color.shadow,
                          } as React.CSSProperties}
                        >
                          <i className="ph ph-check" />
                        </motion.div>
                      </div>
                    );
                  })}
                </div>

                {/* Delete button (shows on hover via CSS) */}
                <button
                  className="habit-delete-btn"
                  onClick={() => handleDeleteHabit(habit._id, habit.name)}
                  title="Delete habit"
                >
                  <i className="ph ph-trash" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add New Habit Card */}
        <motion.div
          className="art-habit-card add-new-card"
          onClick={() => setShowNewHabitForm(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {showNewHabitForm ? (
            <div className="new-habit-form" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Habit name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateHabit();
                  if (e.key === "Escape") {
                    setShowNewHabitForm(false);
                    setNewHabitName("");
                  }
                }}
                className="new-habit-input"
              />
              <div className="new-habit-actions">
                <button
                  onClick={() => {
                    setShowNewHabitForm(false);
                    setNewHabitName("");
                  }}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button onClick={handleCreateHabit} className="btn-create" disabled={!newHabitName.trim()}>
                  Create
                </button>
              </div>
            </div>
          ) : (
            <div className="add-new-content">
              <i className="ph ph-plus" style={{ fontSize: "32px", color: "var(--color-text-muted)" }} />
              <div className="add-new-label">New Ritual</div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
