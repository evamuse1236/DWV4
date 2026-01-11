import { motion } from "framer-motion";
import { Card, Badge, Button } from "../paper";
import { bookStatusConfig, type BookStatus } from "../../lib/status-utils";

interface BookCardProps {
  title: string;
  author: string;
  coverImageUrl?: string;
  description?: string;
  gradeLevel?: string;
  genre?: string;
  status?: BookStatus;
  rating?: number;
  onStartReading?: () => void;
  onMarkComplete?: () => void;
  onMarkPresented?: () => void;
  onClick?: () => void;
}

/**
 * Book card with cover, status, and actions
 */
export function BookCard({
  title,
  author,
  coverImageUrl,
  description,
  gradeLevel,
  genre,
  status,
  rating,
  onStartReading,
  onMarkComplete,
  onMarkPresented,
  onClick,
}: BookCardProps) {
  const statusInfo = status ? bookStatusConfig[status] : null;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer hover:shadow-lg transition-shadow h-full"
        onClick={onClick}
      >
        <div className="flex flex-col h-full">
          {/* Cover image or placeholder */}
          <div className="relative mb-3">
            {coverImageUrl ? (
              <img
                src={coverImageUrl}
                alt={title}
                className="w-full h-40 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-5xl">📚</span>
              </div>
            )}

            {/* Status badge */}
            {statusInfo && (
              <div className="absolute top-2 right-2">
                <Badge variant={statusInfo.variant as any} size="sm">
                  {statusInfo.emoji} {statusInfo.label}
                </Badge>
              </div>
            )}
          </div>

          {/* Book info */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 line-clamp-2">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">by {author}</p>

            {/* Meta info */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {genre && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {genre}
                </span>
              )}
              {gradeLevel && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                  Grade {gradeLevel}
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {description}
              </p>
            )}

            {/* Rating */}
            {rating && (
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={star <= rating ? "text-yellow-400" : "text-gray-300"}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            {!status && onStartReading && (
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartReading();
                }}
                className="w-full"
              >
                📖 Start Reading
              </Button>
            )}

            {status === "reading" && onMarkComplete && (
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkComplete();
                }}
                className="w-full"
              >
                ✅ Mark Complete
              </Button>
            )}

            {status === "completed" && onMarkPresented && (
              <Button
                size="sm"
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkPresented();
                }}
                className="w-full"
              >
                🎤 Mark Presented
              </Button>
            )}

            {status === "presented" && (
              <div className="text-center text-sm text-green-600 font-medium">
                🎉 Shared with class!
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default BookCard;
