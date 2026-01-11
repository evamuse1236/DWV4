import { useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";

// Style mapping for emotion categories from database
const getCategoryStyle = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("happy")) {
    return {
      colorClass: "pastel-yellow",
      bgColor: "#FDF5D0",
      icon: (
        <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ),
    };
  }
  if (lowerName.includes("sad")) {
    return {
      colorClass: "pastel-blue",
      bgColor: "#EBF1FF",
      icon: (
        <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
        </svg>
      ),
    };
  }
  if (lowerName.includes("angry") || lowerName.includes("anger")) {
    return {
      colorClass: "pastel-orange",
      bgColor: "#FFEAD6",
      icon: (
        <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
        </svg>
      ),
    };
  }
  if (lowerName.includes("scared") || lowerName.includes("fear")) {
    return {
      colorClass: "pastel-purple",
      bgColor: "#EEE4F1",
      icon: (
        <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
    };
  }
  if (lowerName.includes("surprise")) {
    return {
      colorClass: "pastel-pink",
      bgColor: "#FBDADC",
      icon: (
        <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ),
    };
  }
  // Default fallback
  return {
    colorClass: "pastel-green",
    bgColor: "#F0FFEB",
    icon: (
      <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  };
};

// Get a friendly subtitle for each category
const getCategorySubtitle = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("happy")) return "Joyful & Bright";
  if (lowerName.includes("sad")) return "Reflective & Quiet";
  if (lowerName.includes("angry")) return "Fiery & Intense";
  if (lowerName.includes("scared")) return "Uncertain & Cautious";
  if (lowerName.includes("surprise")) return "Unexpected & Alert";
  return "Present & Aware";
};

interface CheckInGateProps {
  children: ReactNode;
}

/**
 * CheckInGate - Forces students to complete emotional check-in before accessing the app
 * Shows full-screen check-in UI with no navigation until complete
 * Now fully server-driven - renders categories from database
 */
export function CheckInGate({ children }: CheckInGateProps) {
  const { user } = useAuth();
  const saveCheckIn = useMutation(api.emotions.saveCheckIn);

  // State for the check-in flow
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<any | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Query emotion categories from database
  const categories = useQuery(api.emotions.getCategories);

  // Get today's check-in if exists
  const todayCheckIn = useQuery(
    api.emotions.getTodayCheckIn,
    user ? { userId: user._id as any } : "skip"
  );

  // Still loading - show minimal loading state
  if (todayCheckIn === undefined || categories === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">✨</div>
          <p className="font-body opacity-60">Preparing your space...</p>
        </div>
      </div>
    );
  }

  // Error state - categories failed to load
  if (!categories || categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-4xl mb-4">😔</div>
          <h2 className="text-2xl font-display mb-4">Something went wrong</h2>
          <p className="font-body opacity-70 mb-6">
            We couldn't load the check-in options. Please refresh the page or try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Already checked in - render children (the actual app)
  if (todayCheckIn) {
    return <>{children}</>;
  }

  // Handle category selection - move to subcategory selection
  const handleCategoryClick = (category: any) => {
    setSelectedCategory(category);
    setShowSubcategories(true);
  };

  // Handle subcategory selection - move to journal
  const handleSubcategoryClick = (subcategory: any) => {
    setSelectedSubcategory(subcategory);
    setShowSubcategories(false);
    setShowJournal(true);
  };

  // Save check-in and allow access
  const handleSave = async () => {
    if (!user || !selectedCategory || !selectedSubcategory) return;

    setIsSubmitting(true);
    setSaveError(false);

    try {
      await saveCheckIn({
        userId: user._id as any,
        categoryId: selectedCategory._id as any,
        subcategoryId: selectedSubcategory._id as any,
        journalEntry: journalEntry || undefined,
      });
      // After save, the query will re-fetch and todayCheckIn will be truthy
    } catch (error) {
      console.error("Failed to save check-in:", error);
      setSaveError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go back to category selection
  const handleBackToCategories = () => {
    setShowSubcategories(false);
    setSelectedCategory(null);
  };

  // Discard and start over
  const handleDiscard = () => {
    setShowJournal(false);
    setShowSubcategories(false);
    setJournalEntry("");
    setSelectedCategory(null);
    setSelectedSubcategory(null);
  };

  const categoryStyle = selectedCategory ? getCategoryStyle(selectedCategory.name) : null;

  // Not checked in - show full-screen check-in UI (no sidebar)
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-20 fade-in-up">
          <span className="font-display italic text-[24px] text-[#888]">
            Before you begin...
          </span>
          <h1 className="text-[4rem] mt-[10px]">
            How does your spirit<br />
            <span className="text-[#a8c5b5] italic underline decoration-[rgba(168,197,181,0.4)] decoration-4">
              feel today?
            </span>
          </h1>
        </div>

        {/* Category Grid - Main emotions from database */}
        {!showSubcategories && !showJournal && (
          <div className="emotion-grid fade-in-up delay-1">
            {categories.map((category: any) => {
              const style = getCategoryStyle(category.name);
              return (
                <motion.div
                  key={category._id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`pastel-card ${style.colorClass} p-10 text-center cursor-pointer`}
                  onClick={() => handleCategoryClick(category)}
                >
                  <div
                    className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center transition-transform duration-400"
                    style={{
                      background: "rgba(255, 255, 255, 0.4)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {style.icon}
                  </div>
                  <h3>{category.name}</h3>
                  <span className="font-body uppercase tracking-[0.1em] text-[11px] opacity-60">
                    {getCategorySubtitle(category.name)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Subcategory Selection Overlay */}
      <AnimatePresence>
        {showSubcategories && selectedCategory && categoryStyle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: `linear-gradient(to bottom, ${categoryStyle.bgColor}DD, rgba(255,255,255,0.98))`,
            }}
          >
            <div className="w-full max-w-4xl p-10 text-center">
              {/* Back button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={handleBackToCategories}
                className="absolute top-8 left-8 text-[14px] opacity-50 hover:opacity-100 transition-opacity cursor-pointer bg-transparent border-none"
              >
                ← Back
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-12"
              >
                <span className="font-display italic text-[24px] text-[#888]">
                  You're feeling {selectedCategory.name.toLowerCase()}...
                </span>
                <h2 className="text-[2.5rem] mt-4">
                  What kind of {selectedCategory.name.toLowerCase()}?
                </h2>
              </motion.div>

              {/* Subcategory options */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto"
              >
                {selectedCategory.subcategories?.map((sub: any) => (
                  <motion.button
                    key={sub._id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSubcategoryClick(sub)}
                    className={`p-6 rounded-2xl border-2 border-transparent hover:border-white/50 cursor-pointer transition-all ${categoryStyle.colorClass}`}
                    style={{
                      background: "rgba(255,255,255,0.5)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <span className="font-display text-[20px]">{sub.name}</span>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Journal Overlay */}
      <AnimatePresence>
        {showJournal && selectedCategory && selectedSubcategory && categoryStyle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="journal-overlay active"
            style={{
              background: `linear-gradient(to bottom, ${categoryStyle.bgColor}CC, rgba(255,255,255,0.95))`,
            }}
          >
            <div className="w-full max-w-[800px] p-10 text-center">
              {/* Emotion Label */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-10"
              >
                <span className="font-display italic text-[24px]">
                  Feeling: {selectedSubcategory.name}
                </span>
                <p className="font-body text-[14px] opacity-60 mt-2">
                  {selectedCategory.name}
                </p>
              </motion.div>

              {/* Journal Textarea */}
              <motion.textarea
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="w-full bg-transparent border-none outline-none resize-none text-center font-display text-[32px] leading-[1.4] italic text-[#333]"
                rows={5}
                placeholder="Let your thoughts flow..."
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
                    style={{
                      padding: "16px 48px",
                    }}
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
