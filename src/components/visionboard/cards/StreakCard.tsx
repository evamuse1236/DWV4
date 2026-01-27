import type { VisionBoardCard } from "@/hooks/useVisionBoard";
import { PhIcon } from "../PhIcon";

interface Props {
  card: VisionBoardCard;
  onIncrement: () => void;
}

export function StreakCard({ card, onIncrement }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onIncrement();
      }}
      className="h-full w-full p-6 flex items-center gap-6 text-left cursor-pointer
                 transition-transform active:scale-[0.98] focus:outline-none"
    >
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-tertiary)]/30 flex items-center justify-center shrink-0">
        <PhIcon name={card.emoji ?? "Sun"} size={28} className="opacity-80" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[1.4rem] m-0 font-display italic">{card.title}</h3>
        {card.quote && (
          <p className="text-[12px] opacity-40 italic font-body m-0 mt-1 truncate">
            &ldquo;{card.quote}&rdquo;
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <span className="text-[2.5rem] font-light leading-none font-display">
          {card.streakCount ?? 0}
        </span>
        <span className="block text-[9px] uppercase font-bold tracking-[0.15em] opacity-40 mt-1">
          Streak
        </span>
      </div>
    </button>
  );
}
