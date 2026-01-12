import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../hooks/useAuth";

// Emotion configuration for Paper UI design
const emotions = [
  {
    id: "serene",
    name: "Serene",
    subtitle: "Balanced & Calm",
    colorClass: "pastel-green",
    bgColor: "#F0FFEB",
    icon: (
      <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    id: "reflective",
    name: "Reflective",
    subtitle: "Thoughtful & Quiet",
    colorClass: "pastel-blue",
    bgColor: "#EBF1FF",
    icon: (
      <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
  },
  {
    id: "radiant",
    name: "Radiant",
    subtitle: "Joyful & Warm",
    colorClass: "pastel-yellow",
    bgColor: "#FDF5D0",
    icon: (
      <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
  },
  {
    id: "clouded",
    name: "Clouded",
    subtitle: "Overthinking",
    colorClass: "pastel-purple",
    bgColor: "#EEE4F1",
    icon: (
      <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
      </svg>
    ),
  },
  {
    id: "vibrant",
    name: "Vibrant",
    subtitle: "Ready to Go",
    colorClass: "pastel-orange",
    bgColor: "#FFEAD6",
    icon: (
      <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    id: "loving",
    name: "Loving",
    subtitle: "Grateful & Warm",
    colorClass: "pastel-pink",
    bgColor: "#FBDADC",
    icon: (
      <svg className="w-8 h-8 opacity-70" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
];

/**
 * Emotion Check-in Page - Paper UI Design
 * 6 emotion cards with full-screen journal overlay
 */
export function EmotionCheckInPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const saveCheckIn = useMutation(api.emotions.saveCheckIn);
  const updateCheckIn = useMutation(api.emotions.updateCheckIn);

  const [selectedEmotion, setSelectedEmotion] = useState<typeof emotions[0] | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [showJournal, setShowJournal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Query emotion categories from Convex
  const categories = useQuery(api.emotions.getCategories);

  // Get today's check-in if exists
  const todayCheckIn = useQuery(
    api.emotions.getTodayCheckIn,
    user ? { userId: user._id as any } : "skip"
  );

  // When editing, pre-fill the journal entry
  useEffect(() => {
    if (isEditing && todayCheckIn?.journalEntry) {
      setJournalEntry(todayCheckIn.journalEntry);
    }
  }, [isEditing, todayCheckIn?.journalEntry]);

  const handleEmotionClick = (emotion: typeof emotions[0]) => {
    setSelectedEmotion(emotion);
    setShowJournal(true);
  };

  const handleSave = async () => {
    if (!user || !selectedEmotion) return;

    setIsSubmitting(true);

    try {
      // Map our UI emotion to Convex category
      // Find the closest matching category by name
      const category = categories?.find(
        (c: any) => c.name.toLowerCase().includes(selectedEmotion.id) ||
                    selectedEmotion.id.includes(c.name.toLowerCase())
      );

      // If we have a matching category, use it. Otherwise create with first category
      const categoryId = category?._id || categories?.[0]?._id;
      const subcategoryId = category?.subcategories?.[0]?._id || categories?.[0]?.subcategories?.[0]?._id;

      if (categoryId && subcategoryId) {
        if (isEditing && todayCheckIn?._id) {
          // Update existing check-in
          await updateCheckIn({
            checkInId: todayCheckIn._id as any,
            categoryId: categoryId as any,
            subcategoryId: subcategoryId as any,
            journalEntry: journalEntry || undefined,
          });
        } else {
          // Create new check-in
          await saveCheckIn({
            userId: user._id as any,
            categoryId: categoryId as any,
            subcategoryId: subcategoryId as any,
            journalEntry: journalEntry || undefined,
          });
        }
      }

      // Navigate to dashboard
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
    setSelectedEmotion(null);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    // Pre-fill with existing journal entry
    if (todayCheckIn?.journalEntry) {
      setJournalEntry(todayCheckIn.journalEntry);
    }
  };

  // If already checked in today (and not editing)
  if (todayCheckIn && !isEditing) {
    return (
      <div>
        <div className="text-center mb-20 fade-in-up">
          <span className="font-display italic text-[24px] text-[#888]">
            Already Done
          </span>
          <h1 className="text-[4rem] mt-[10px]">
            You checked in<br />
            <span className="text-[#a8c5b5] italic underline decoration-[rgba(168,197,181,0.4)] decoration-4">
              today
            </span>
          </h1>
        </div>

        <div className="max-w-md mx-auto text-center">
          <div className="pastel-card pastel-green p-10 mb-8">
            <div className="text-[60px] mb-4">✅</div>
            <h3 className="text-[2rem]">
              {todayCheckIn.category?.name || "Feeling Good"}
            </h3>
            {todayCheckIn.journalEntry && (
              <p className="mt-4 font-body opacity-70 italic">
                "{todayCheckIn.journalEntry}"
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleEditClick}
              className="btn btn-secondary"
            >
              Edit Check-in
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Header */}
        <div className="text-center mb-20 fade-in-up">
          <span className="font-display italic text-[24px] text-[#888]">
            {isEditing ? "Edit Check-in" : "Step 1 of 2: Awareness"}
          </span>
          <h1 className="text-[4rem] mt-[10px]">
            How does your spirit<br />
            <span className="text-[#a8c5b5] italic underline decoration-[rgba(168,197,181,0.4)] decoration-4">
              feel today?
            </span>
          </h1>
        </div>

        {/* Emotion Grid */}
        <div className="emotion-grid fade-in-up delay-1">
          {emotions.map((emotion) => (
            <motion.div
              key={emotion.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`pastel-card ${emotion.colorClass} p-10 text-center cursor-pointer`}
              onClick={() => handleEmotionClick(emotion)}
            >
              <div
                className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center transition-transform duration-400"
                style={{
                  background: "rgba(255, 255, 255, 0.4)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {emotion.icon}
              </div>
              <h3>{emotion.name}</h3>
              <span className="font-body uppercase tracking-[0.1em] text-[11px] opacity-60">
                {emotion.subtitle}
              </span>
            </motion.div>
          ))}
        </div>

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
        {showJournal && selectedEmotion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="journal-overlay active"
            style={{
              background: `linear-gradient(to bottom, ${selectedEmotion.bgColor}CC, rgba(255,255,255,0.95))`,
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
                  {isEditing ? "Editing" : "Exploring"}: {selectedEmotion.name}
                </span>
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
                  style={{
                    padding: "16px 48px",
                  }}
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
