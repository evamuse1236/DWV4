import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Textarea } from "../paper";
import { getRandomPrompt } from "../../lib/emotions";

interface EmotionJournalProps {
  categoryId: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Optional journal entry for emotional check-in
 * Shows a contextual prompt based on the selected emotion
 */
export function EmotionJournal({
  categoryId,
  value,
  onChange,
  disabled,
}: EmotionJournalProps) {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    setPrompt(getRandomPrompt(categoryId));
  }, [categoryId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Want to tell me more? (Optional)
        </label>
        <p className="text-sm text-gray-500 mt-0.5">{prompt}</p>
      </div>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your thoughts here..."
        disabled={disabled}
        className="min-h-[100px]"
      />

      <p className="text-xs text-gray-400 mt-1 text-right">
        {value.length} / 500 characters
      </p>
    </motion.div>
  );
}

export default EmotionJournal;
