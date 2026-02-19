import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import styles from "./emotions.module.css";

// 4-Quadrant Mood Data with kid-friendly definitions
const shadesData = {
  goodHigh: {
    label: "Good + High Energy",
    icon: "☀️",
    color: "#FEF9C3", // Yellow
    shades: [
      { name: "Excited", color: "#FFFBEB", def: "Feeling super energetic and happy because something fun is about to happen or is happening." },
      { name: "Curious", color: "#FEF9C3", def: "Recognizing there is something you don't know, and really wanting to learn more about it." },
      { name: "Proud", color: "#FEF08A", def: "Feeling happy and good about something you did or achieved." },
      { name: "Playful", color: "#FDE047", def: "Feeling fun, relaxed, and ready to joke around or connect with others." },
      { name: "Confident", color: "#FCD34D", def: "Believing in yourself and trusting that you can handle a situation." },
      { name: "Motivated", color: "#F59E0B", def: "Feeling ready and eager to keep trying to reach a goal." },
      { name: "Not sure", color: "#FFFFFF", def: "Just checking in, I don't know yet." },
    ],
  },
  goodLow: {
    label: "Good + Low Energy",
    icon: "🌿",
    color: "#E0F7FA", // Teal
    shades: [
      { name: "Calm", color: "#F0FDF4", def: "Feeling steady and keeping your cool, even when things are busy or stressful." },
      { name: "Relaxed", color: "#E0F2F1", def: "Feeling loose and free from tension or worry." },
      { name: "Safe", color: "#E1F5FE", def: "Feeling protected and knowing that the hard part is over." },
      { name: "Content", color: "#F3E5F5", def: "Feeling happy with what you have and not needing anything else right now." },
      { name: "Grateful", color: "#FDF2F8", def: "Feeling thankful for the good things and people in your life." },
      { name: "Peaceful", color: "#F1F8E9", def: "Feeling quiet inside with no pressure to do anything." },
      { name: "Serene", color: "#FFF7ED", def: "Feeling a deep sense of peace and clear-headedness." },
      { name: "Not sure", color: "#FFFFFF", def: "Just checking in, I don't know yet." },
    ],
  },
  badLow: {
    label: "Bad + Low Energy",
    icon: "💧",
    color: "#E5E7EB", // Gray
    shades: [
      { name: "Tired", color: "#F9FAFB", def: "Feeling like you have no energy and need to rest or sleep." },
      { name: "Sleepy", color: "#F3F4F6", def: "Feeling drowsy and like your body wants rest right now." },
      { name: "Bored", color: "#F1F5F9", def: "Feeling restless because you want to do something fun but can't find anything to do." },
      { name: "Sad", color: "#E0F2FE", def: "Feeling down or unhappy because you lost something or something bad happened." },
      { name: "Lonely", color: "#EEF2FF", def: "Feeling sad because you want to be with friends or feel close to others, but you aren't." },
      { name: "Disappointed", color: "#F8FAFC", def: "Feeling let down because something didn't go the way you wanted or hoped." },
      { name: "Discouraged", color: "#F1F1F1", def: "Losing your energy and belief that you can finish something you started." },
      { name: "Melancholy", color: "#E2E8F0", def: "A quiet, thoughtful sadness that feels a bit like a rainy day." },
      { name: "Not sure", color: "#FFFFFF", def: "Just checking in, I don't know yet." },
    ],
  },
  badHigh: {
    label: "Bad + High Energy",
    icon: "🌧️",
    color: "#FFE4E6", // Pink
    shades: [
      { name: "Stressed", color: "#FFF1F2", def: "Feeling like you have too much to do and not enough time or ability to handle it." },
      { name: "Worried", color: "#FFE4E6", def: "Thinking a lot about bad things that might happen later." },
      { name: "Nervous", color: "#FECDD3", def: "Feeling shaky or uneasy about something that is about to happen." },
      { name: "Frustrated", color: "#FFB8C1", def: "Feeling annoyed because something out of your control is stopping you from doing what you want." },
      { name: "Angry", color: "#FFA6B2", def: "Feeling mad because something isn't fair or is blocking your way." },
      { name: "Overwhelmed", color: "#FF94A2", def: "Feeling like everything is too much and you can't think or act." },
      { name: "Not sure", color: "#FFFFFF", def: "Just checking in, I don't know yet." },
    ],
  },
};

type QuadrantKey = keyof typeof shadesData;
type Shade = { name: string; color: string; def: string };
const emotionAliases: Record<string, string[]> = {
  sleepy: ["sleepy", "tired"],
};
const normalizeEmotion = (value: string) => value.trim().toLowerCase();

/**
 * Emotion Check-in Page - Palette of Presence Design
 * 4 quadrant mood wheel with expandable emotion palettes
 */
export function EmotionCheckInPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const saveCheckIn = useMutation(api.emotions.saveCheckIn);
  const updateCheckIn = useMutation(api.emotions.updateCheckIn);

  // Query emotion categories from Convex
  const categories = useQuery(api.emotions.getCategories);

  // Get today's check-in if exists
  const todayCheckIn = useQuery(
    api.emotions.getTodayCheckIn,
    user ? { userId: user._id as any } : "skip"
  );

  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantKey | null>(null);
  const [selectedShade, setSelectedShade] = useState<Shade | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [showJournal, setShowJournal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // When editing, pre-fill the journal entry
  useEffect(() => {
    if (isEditing && todayCheckIn?.journalEntry) {
      setJournalEntry(todayCheckIn.journalEntry);
    }
  }, [isEditing, todayCheckIn?.journalEntry]);

  const handleQuadrantClick = (key: QuadrantKey) => {
    if (activeQuadrant === key) return;
    setActiveQuadrant(key);
    setSelectedShade(null);
  };

  const handleShadeClick = (shade: Shade) => {
    setSelectedShade(shade);
    setShowJournal(true);
  };

  const handleReset = () => {
    setActiveQuadrant(null);
    setSelectedShade(null);
  };

  const handleSave = async () => {
    if (!user || !selectedShade || !activeQuadrant) return;

    setIsSubmitting(true);

    try {
      const ids = resolveEmotionIds(selectedShade.name);
      if (ids?.categoryId && ids?.subcategoryId) {
        if (isEditing && todayCheckIn?._id) {
          await updateCheckIn({
            checkInId: todayCheckIn._id as any,
            categoryId: ids.categoryId as any,
            subcategoryId: ids.subcategoryId as any,
            journalEntry: journalEntry || undefined,
          });
        } else {
          await saveCheckIn({
            userId: user._id as any,
            categoryId: ids.categoryId as any,
            subcategoryId: ids.subcategoryId as any,
            journalEntry: journalEntry || undefined,
          });
        }
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to save check-in:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    setShowJournal(false);
    setJournalEntry("");
    setSelectedShade(null);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    if (todayCheckIn?.journalEntry) {
      setJournalEntry(todayCheckIn.journalEntry);
    }
  };

  // Tooltip handlers
  const showTooltip = (e: React.MouseEvent, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const hideTooltip = () => {
    setTooltip(null);
  };

  const resolveEmotionIds = (emotionName: string) => {
    if (!categories || categories.length === 0) return null;

    const normalizedEmotion = normalizeEmotion(emotionName);
    const candidateNames = emotionAliases[normalizedEmotion] ?? [normalizedEmotion];

    for (const category of categories as any[]) {
      const matchingSubcategory = (category.subcategories ?? []).find((subcategory: any) =>
        candidateNames.includes(normalizeEmotion(subcategory.name))
      );
      if (matchingSubcategory?._id) {
        return { categoryId: category._id, subcategoryId: matchingSubcategory._id };
      }
    }

    const looseCategory = (categories as any[]).find((category) => {
      const normalizedCategory = normalizeEmotion(category.name);
      return (
        normalizedCategory.includes(normalizedEmotion) ||
        normalizedEmotion.includes(normalizedCategory)
      );
    });

    const fallbackCategory = looseCategory ?? (categories as any[])[0];
    const fallbackSubcategory =
      fallbackCategory?.subcategories?.[0] ?? (categories as any[])[0]?.subcategories?.[0];

    if (!fallbackCategory?._id || !fallbackSubcategory?._id) return null;
    return {
      categoryId: fallbackCategory._id,
      subcategoryId: fallbackSubcategory._id,
    };
  };

  // Already checked in today (and not editing)
  if (todayCheckIn && !isEditing) {
    return (
      <div>
        <div className={cn("text-center mb-20", styles['fade-in-up'])}>
          <span className="font-display italic text-[24px] text-[#888]">Already Done</span>
          <h1 className="text-[4rem] mt-[10px]">
            You checked in
            <br />
            <span className="text-[#a8c5b5] italic underline decoration-[rgba(168,197,181,0.4)] decoration-4">
              today
            </span>
          </h1>
        </div>

        <div className="max-w-md mx-auto text-center">
          <div className="pastel-card pastel-green p-10 mb-8">
            <div className="text-[60px] mb-4">✅</div>
            <h3 className="text-[2rem]">{todayCheckIn.category?.name || "Feeling Good"}</h3>
            {todayCheckIn.journalEntry && (
              <p className="mt-4 font-body opacity-70 italic">"{todayCheckIn.journalEntry}"</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button onClick={handleEditClick} className="btn btn-secondary">
              Edit Check-in
            </button>
            <button onClick={() => navigate("/dashboard")} className="btn btn-primary">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        {/* Header */}
        <div
          className={cn("text-center mb-8 transition-opacity duration-500", styles['fade-in-up'])}
          style={{ opacity: activeQuadrant ? 0.4 : 1 }}
        >
          <span className="font-display italic text-[24px] text-[#666]">Reflecting</span>
          <h1 className="text-[3rem] mt-0 leading-tight">The Palette of Presence</h1>
        </div>

        {/* Back button - shows when quadrant is expanded */}
        {activeQuadrant && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReset}
            className="absolute top-10 right-10 z-50 text-2xl bg-transparent border-none cursor-pointer hover:scale-110 transition-transform"
            aria-label="Go back"
          >
            ←
          </motion.button>
        )}

        {/* Primary Mood Cards (4 Quadrants) */}
        <div className={cn(styles['mood-deck'], styles['fade-in-up'], styles['delay-1'])}>
          {(Object.keys(shadesData) as QuadrantKey[]).map((key) => {
            const quadrant = shadesData[key];
            const isActive = activeQuadrant !== null;

            return (
              <motion.div
                key={key}
                onClick={() => handleQuadrantClick(key)}
                className={cn(styles['mood-card'], isActive && styles['active-primary'])}
                style={{ backgroundColor: quadrant.color }}
                layout
                transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <span className={`text-[64px] ${isActive ? "!text-[28px]" : ""} transition-all duration-500`}>
                  {quadrant.icon}
                </span>
                {!isActive && (
                  <div className={styles['orb-label']}>
                    {quadrant.label.split(" + ").map((part, i) => (
                      <span key={i}>
                        {part}
                        {i === 0 && <br />}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Nuance Canvas (Emotion Grid) */}
        <AnimatePresence>
          {activeQuadrant && (
            <motion.div
              className={cn(styles['nuance-canvas'], styles.visible)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {shadesData[activeQuadrant].shades.map((shade, idx) => (
                <motion.div
                  key={shade.name}
                  className={styles['shade-tile']}
                  style={{ backgroundColor: shade.color }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => handleShadeClick(shade)}
                  onMouseEnter={(e) => showTooltip(e, shade.def)}
                  onMouseLeave={hideTooltip}
                >
                  {shade.name}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              className={cn(styles['definition-tooltip'], styles.visible)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                left: tooltip.x,
                top: tooltip.y,
              }}
            >
              {tooltip.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancel edit button */}
        {isEditing && (
          <div className="text-center mt-8">
            <button
              onClick={() => {
                setIsEditing(false);
                setJournalEntry("");
              }}
              className="text-sm opacity-50 hover:opacity-100 transition-opacity"
            >
              Cancel Edit
            </button>
          </div>
        )}
      </div>

      {/* Full Screen Journal Overlay */}
      <AnimatePresence>
        {showJournal && selectedShade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="journal-overlay active"
            style={{
              background: `linear-gradient(to bottom, ${selectedShade.color}CC, rgba(255,255,255,0.95))`,
            }}
          >
            <div className="w-full max-w-[800px] p-10 text-center">
              {/* Emotion Label */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6"
              >
                <span className="font-display italic text-[24px]">
                  {isEditing ? "Editing" : "Feeling"}: {selectedShade.name}
                </span>
                <p className="text-sm text-[#666] mt-2 max-w-md mx-auto">{selectedShade.def}</p>
              </motion.div>

              {/* Journal Textarea */}
              <motion.textarea
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full bg-transparent border-none outline-none resize-none text-center font-display text-[32px] leading-[1.4] italic text-[#333]"
                rows={5}
                placeholder="Why do you feel this way? (optional)"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                autoFocus
              />

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-[60px] flex items-center justify-center gap-8"
              >
                <button
                  onClick={handleDiscard}
                  className="bg-transparent border-none text-[14px] opacity-50 text-[#1a1a1a] cursor-pointer hover:opacity-100 transition-opacity"
                  disabled={isSubmitting}
                >
                  DISCARD
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ padding: "16px 48px" }}
                >
                  {isSubmitting ? "SAVING..." : isEditing ? "UPDATE ENTRY" : "SAVE ENTRY"}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default EmotionCheckInPage;
