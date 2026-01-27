import type { VisionBoardCard } from "@/hooks/useVisionBoard";
import { PhIcon } from "../PhIcon";

interface Props {
  card: VisionBoardCard;
}

export function MotivationCard({ card }: Props) {
  return (
    <div className="h-full p-6 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <PhIcon name={card.emoji ?? "Lightning"} size={28} className="opacity-80" />
        <span className="text-[10px] font-bold opacity-40 italic">
          DAY {card.dayCount ?? 1}
        </span>
      </div>
      <div>
        <h3 className="text-[1.4rem] m-0 mb-1 font-display italic">{card.title}</h3>
        {card.subtitle && (
          <p className="text-[12px] opacity-50 font-body m-0">{card.subtitle}</p>
        )}
      </div>
    </div>
  );
}
