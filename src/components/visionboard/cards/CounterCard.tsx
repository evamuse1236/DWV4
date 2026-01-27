import type { VisionBoardCard } from "@/hooks/useVisionBoard";
import { PhIcon } from "../PhIcon";

interface Props {
  card: VisionBoardCard;
  onIncrement: () => void;
}

export function CounterCard({ card, onIncrement }: Props) {
  const current = card.currentCount ?? 0;
  const target = card.targetCount;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onIncrement();
      }}
      className="h-full w-full flex flex-col items-center justify-center text-center p-6 cursor-pointer
                 transition-transform active:scale-95 focus:outline-none"
    >
      <PhIcon name={card.emoji ?? "ChartBar"} size={28} className="mb-2 opacity-80" />
      <span className="font-display text-[2.5rem] leading-none">
        {current}
        {target != null && (
          <span className="text-[0.5em] opacity-40">/{target}</span>
        )}
      </span>
      <span className="text-[9px] uppercase tracking-[0.15em] font-bold opacity-40 mt-1">
        {card.countLabel ?? card.title}
      </span>
    </button>
  );
}
