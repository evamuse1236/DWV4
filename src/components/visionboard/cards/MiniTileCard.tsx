import type { VisionBoardCard } from "@/hooks/useVisionBoard";
import { PhIcon } from "../PhIcon";

interface Props {
  card: VisionBoardCard;
}

export function MiniTileCard({ card }: Props) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6">
      <PhIcon name={card.emoji ?? "Star"} size={28} className="mb-1 opacity-80" />
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] opacity-60">
        {card.title}
      </span>
    </div>
  );
}
