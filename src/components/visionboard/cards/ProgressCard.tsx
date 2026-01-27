import type { VisionBoardCard } from "@/hooks/useVisionBoard";
import { PhIcon } from "../PhIcon";

interface Props {
  card: VisionBoardCard;
  onIncrement: () => void;
}

export function ProgressCard({ card, onIncrement }: Props) {
  const total = card.totalSteps ?? 6;
  const completed = card.completedSteps ?? 0;
  const isFull = completed >= total;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!isFull) onIncrement();
      }}
      className="h-full w-full p-8 flex flex-col justify-between text-left cursor-pointer
                 transition-transform active:scale-[0.98] focus:outline-none"
    >
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[1.8rem] m-0 font-display italic">{card.title}</h3>
          {card.emoji && (
            <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center shadow-sm">
              <PhIcon name={card.emoji} size={24} className="opacity-80" />
            </div>
          )}
        </div>
        {card.description && (
          <p className="text-[13px] opacity-50 font-body leading-relaxed m-0">
            {card.description}
          </p>
        )}
      </div>
      <div className="mt-8">
        <div className="flex justify-between text-[10px] mb-2 font-bold opacity-40 uppercase tracking-[0.1em]">
          <span>Progress</span>
          <span>
            {completed}/{total} {card.stepsLabel ?? "Steps"}
          </span>
        </div>
        <div className="flex gap-1 h-2.5">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm ${
                i < completed ? "bg-[var(--color-primary)]" : "bg-black/5"
              }`}
            />
          ))}
        </div>
      </div>
    </button>
  );
}
