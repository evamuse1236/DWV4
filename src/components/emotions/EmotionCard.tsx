import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface EmotionCardProps {
  emoji: string;
  name: string;
  color: string;
  subEmotion?: string;
  subEmoji?: string;
  timestamp?: number;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

/**
 * Display card for a selected emotion
 */
export function EmotionCard({
  emoji,
  name,
  color,
  subEmotion,
  subEmoji,
  timestamp,
  size = "md",
  onClick,
}: EmotionCardProps) {
  const sizeStyles = {
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  const emojiSizes = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
  };

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        "rounded-xl border-2 transition-shadow",
        sizeStyles[size],
        onClick && "cursor-pointer hover:shadow-md"
      )}
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}50`,
      }}
    >
      <div className="flex items-center gap-3">
        <span className={emojiSizes[size]}>{emoji}</span>
        <div>
          <p className="font-semibold text-gray-900">{name}</p>
          {subEmotion && (
            <p className="text-sm text-gray-600 flex items-center gap-1">
              {subEmoji && <span>{subEmoji}</span>}
              {subEmotion}
            </p>
          )}
          {timestamp && (
            <p className="text-xs text-gray-400 mt-1">
              {new Date(timestamp).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default EmotionCard;
