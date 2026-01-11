import { motion } from "framer-motion";
import { EmotionCard } from "./EmotionCard";
import { formatRelativeDate } from "../../lib/utils";

interface CheckInData {
  _id: string;
  timestamp: number;
  journalEntry?: string;
  category: {
    name: string;
    emoji: string;
    color: string;
  };
  subcategory: {
    name: string;
    emoji: string;
  };
}

interface EmotionHistoryProps {
  checkIns: CheckInData[];
  isLoading?: boolean;
}

/**
 * Display history of emotion check-ins
 */
export function EmotionHistory({ checkIns, isLoading }: EmotionHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (checkIns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-4xl block mb-2">📝</span>
        <p>No check-ins yet.</p>
        <p className="text-sm">Start your day with an emotional check-in!</p>
      </div>
    );
  }

  // Group check-ins by date
  const groupedByDate = checkIns.reduce((groups, checkIn) => {
    const dateKey = formatRelativeDate(checkIn.timestamp);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(checkIn);
    return groups;
  }, {} as Record<string, CheckInData[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dateCheckIns]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-gray-500 mb-2">{date}</h3>
          <div className="space-y-2">
            {dateCheckIns.map((checkIn, index) => (
              <motion.div
                key={checkIn._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EmotionCard
                  emoji={checkIn.category.emoji}
                  name={checkIn.category.name}
                  color={checkIn.category.color}
                  subEmotion={checkIn.subcategory.name}
                  subEmoji={checkIn.subcategory.emoji}
                  timestamp={checkIn.timestamp}
                  size="sm"
                />
                {checkIn.journalEntry && (
                  <div className="ml-4 mt-1 p-2 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
                    "{checkIn.journalEntry}"
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default EmotionHistory;
