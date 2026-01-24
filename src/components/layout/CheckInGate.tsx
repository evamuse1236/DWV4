import { useState, useEffect, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Plant, Drop, CloudRain } from "@phosphor-icons/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";
import { useDelayedLoading } from "../../hooks/useDelayedLoading";
import { Skeleton } from "../ui/skeleton";

/**
 * Skeleton loading state for the Palette of Presence UI.
 * Shows 4 quadrant card placeholders matching the actual layout.
 */
function CheckInSkeleton() {
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header skeleton */}
        <div className="text-center mb-8">
          <Skeleton className="h-6 w-24 mx-auto mb-2" />
          <Skeleton className="h-12 w-80 mx-auto" />
        </div>

        {/* 4 Quadrant cards skeleton */}
        <div className="mood-deck">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className="mood-card rounded-[30px] h-[200px]"
              style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

// 4-Quadrant Mood Data with kid-friendly definitions
const shadesData = {
  goodHigh: {
    label: "Good + High Energy",
    icon: Sun,
    color: "#FEF9C3",
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
    icon: Plant,
    color: "#E0F7FA",
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
    icon: Drop,
    color: "#E5E7EB",
    shades: [
      { name: "Tired", color: "#F9FAFB", def: "Feeling like you have no energy and need to rest or sleep." },
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
    icon: CloudRain,
    color: "#FFE4E6",
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

interface CheckInGateProps {
  children: ReactNode;
}

/**
 * CheckInGate - Forces students to complete emotional check-in before accessing the app
 * Uses the Palette of Presence design with 4 quadrants
 * Allows selecting multiple emotions
 */
export function CheckInGate({ children }: CheckInGateProps) {
  const { user } = useAuth();
  const saveCheckIn = useMutation(api.emotions.saveCheckIn);

  // State for the check-in flow
  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantKey | null>(null);
  const [selectedShades, setSelectedShades] = useState<Shade[]>([]); // Multiple selection
  const [journalEntry, setJournalEntry] = useState("");
  const [showJournal, setShowJournal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  // Press Enter to proceed when emotions are selected
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selectedShades.length > 0 && !showJournal) {
        setShowJournal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedShades, showJournal]);

  // Query emotion categories from database (for mapping)
  const categories = useQuery(api.emotions.getCategories);

  // Get today's check-in if exists
  const todayCheckIn = useQuery(
    api.emotions.getTodayCheckIn,
    user ? { userId: user._id as any } : "skip"
  );

  // Delayed skeleton - only show if loading takes >200ms to avoid flash
  const isLoading = todayCheckIn === undefined || categories === undefined;
  const showSkeleton = useDelayedLoading(isLoading);

  // Show skeleton only after delay threshold
  if (showSkeleton) {
    return <CheckInSkeleton />;
  }

  // Data still loading but under threshold - render nothing briefly
  if (isLoading) {
    return null;
  }

  // Already checked in - render children (the actual app)
  if (todayCheckIn) {
    return <>{children}</>;
  }

  const handleQuadrantClick = (key: QuadrantKey) => {
    if (activeQuadrant === key) return;
    setActiveQuadrant(key);
    // Selections persist across quadrants - users can select from multiple palettes
  };

  // Toggle shade selection (multi-select)
  const handleShadeClick = (shade: Shade) => {
    setSelectedShades((prev) => {
      const isSelected = prev.some((s) => s.name === shade.name);
      if (isSelected) {
        return prev.filter((s) => s.name !== shade.name);
      } else {
        return [...prev, shade];
      }
    });
  };

  // Proceed to journal after selecting emotions
  const handleProceed = () => {
    if (selectedShades.length > 0) {
      setShowJournal(true);
    }
  };

  const handleReset = () => {
    setActiveQuadrant(null);
    // Keep selectedShades so user can proceed from main view
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

  // Save check-in
  const handleSave = async () => {
    if (!user || selectedShades.length === 0) return;

    setIsSubmitting(true);
    setSaveError(false);

    try {
      // Use the first selected emotion for mapping to database
      const primaryEmotion = selectedShades[0];
      const emotionName = primaryEmotion.name.toLowerCase();
      const category = categories?.find(
        (c: any) =>
          c.name.toLowerCase().includes(emotionName) ||
          emotionName.includes(c.name.toLowerCase())
      );

      const categoryId = category?._id || categories?.[0]?._id;
      const subcategoryId =
        category?.subcategories?.[0]?._id || categories?.[0]?.subcategories?.[0]?._id;

      // Include all selected emotions in journal entry
      const emotionsList = selectedShades.map((s) => s.name).join(", ");
      const fullJournalEntry = journalEntry
        ? `Feeling: ${emotionsList}\n\n${journalEntry}`
        : `Feeling: ${emotionsList}`;

      if (categoryId && subcategoryId) {
        await saveCheckIn({
          userId: user._id as any,
          categoryId: categoryId as any,
          subcategoryId: subcategoryId as any,
          journalEntry: fullJournalEntry,
        });
      }
    } catch (error) {
      console.error("Failed to save check-in:", error);
      setSaveError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Discard and start over
  const handleDiscard = () => {
    setShowJournal(false);
    setJournalEntry("");
    setSelectedShades([]);
    setActiveQuadrant(null);
  };

  // Check if a shade is selected
  const isShadeSelected = (shade: Shade) => {
    return selectedShades.some((s) => s.name === shade.name);
  };

  // Not checked in - show Palette of Presence UI
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <main className="max-w-6xl mx-auto px-6 py-12 relative">
        {/* Header */}
        <div
          className="text-center mb-8 fade-in-up transition-opacity duration-500"
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
            className="absolute top-12 right-12 z-50 text-2xl bg-transparent border-none cursor-pointer hover:scale-110 transition-transform"
            aria-label="Go back"
          >
            ←
          </motion.button>
        )}

        {/* Primary Mood Cards (4 Quadrants) */}
        <div className="mood-deck fade-in-up delay-1">
          {(Object.keys(shadesData) as QuadrantKey[]).map((key) => {
            const quadrant = shadesData[key];
            const isActive = activeQuadrant !== null;
            const IconComponent = quadrant.icon;

            return (
              <motion.div
                key={key}
                onClick={() => handleQuadrantClick(key)}
                className={`mood-card primary ${isActive ? "active-primary" : ""}`}
                style={{ backgroundColor: quadrant.color }}
                layout
                transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <IconComponent
                  weight="light"
                  className={`transition-all duration-500 ${isActive ? "w-7 h-7" : "w-16 h-16"}`}
                  style={{ opacity: 0.7 }}
                />
                {!isActive && (
                  <div className="orb-label">
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

        {/* Proceed from main view - when selections exist but no quadrant expanded */}
        {!activeQuadrant && selectedShades.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-8"
          >
            <p className="text-sm text-[#666] mb-4">
              Selected: {selectedShades.map((s) => s.name).join(", ")}
            </p>
            <button
              onClick={handleProceed}
              className="btn btn-primary"
              style={{ padding: "16px 48px" }}
            >
              PROCEED →
            </button>
          </motion.div>
        )}

        {/* Nuance Canvas (Emotion Grid) - Multi-select */}
        <AnimatePresence>
          {activeQuadrant && (
            <>
              <motion.div
                className="nuance-canvas visible"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
              >
                {shadesData[activeQuadrant].shades.map((shade, idx) => (
                  <motion.div
                    key={shade.name}
                    className={`shade-tile ${isShadeSelected(shade) ? "selected" : ""}`}
                    style={{
                      backgroundColor: shade.color,
                      border: isShadeSelected(shade)
                        ? "2px solid rgba(255, 255, 255, 0.9)"
                        : "1px solid rgba(255,255,255,0.5)",
                      // Simplified shadow: single layer instead of 3-layer glow
                      boxShadow: isShadeSelected(shade)
                        ? `0 0 16px 4px ${shade.color}60`
                        : "0 2px 4px rgba(0, 0, 0, 0.02)",
                    }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      scale: isShadeSelected(shade) ? 1.05 : 1,
                    }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => handleShadeClick(shade)}
                    onMouseEnter={(e) => showTooltip(e, shade.def)}
                    onMouseLeave={hideTooltip}
                  >
                    {shade.name}
                  </motion.div>
                ))}
              </motion.div>

              {/* Proceed Button - Shows when at least one emotion selected */}
              {selectedShades.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-8"
                >
                  <p className="text-sm text-[#666] mb-4">
                    Selected: {selectedShades.map((s) => s.name).join(", ")}
                  </p>
                  <button
                    onClick={handleProceed}
                    className="btn btn-primary"
                    style={{ padding: "16px 48px" }}
                  >
                    PROCEED →
                  </button>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              className="definition-tooltip visible"
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
      </main>

      {/* Full Screen Journal Overlay */}
      <AnimatePresence>
        {showJournal && selectedShades.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="journal-overlay active"
            style={{
              background: `linear-gradient(to bottom, ${selectedShades[0].color}CC, rgba(255,255,255,0.95))`,
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
                  Feeling: {selectedShades.map((s) => s.name).join(", ")}
                </span>
                {selectedShades.length === 1 && (
                  <p className="text-sm text-[#666] mt-2 max-w-md mx-auto">
                    {selectedShades[0].def}
                  </p>
                )}
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
                className="mt-[60px] flex flex-col items-center gap-4"
              >
                {/* Error message */}
                {saveError && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-6 py-3 rounded-full text-[14px]"
                    style={{
                      background: "rgba(255, 200, 200, 0.7)",
                      color: "#8B0000",
                    }}
                  >
                    Couldn't save your check-in. Please try again.
                  </motion.div>
                )}
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={handleDiscard}
                    className="bg-transparent border-none text-[14px] opacity-50 text-[#1a1a1a] cursor-pointer hover:opacity-100 transition-opacity"
                    disabled={isSubmitting}
                  >
                    START OVER
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="btn btn-primary"
                    style={{ padding: "16px 48px" }}
                  >
                    {isSubmitting ? "SAVING..." : saveError ? "RETRY" : "CONTINUE"}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CheckInGate;
