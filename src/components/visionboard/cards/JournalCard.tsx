import type { VisionBoardCard } from "@/hooks/useVisionBoard";

interface Props {
  card: VisionBoardCard;
}

export function JournalCard({ card }: Props) {
  return (
    <div className="h-full p-6 flex flex-col justify-between">
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase opacity-40">
        {card.title}
      </span>
      <div className="mt-3">
        <p className="text-[15px] italic opacity-70 font-body leading-relaxed m-0">
          {card.textContent
            ? `\u201C${card.textContent}\u201D`
            : "Tap to write\u2026"}
        </p>
      </div>
      <span className="text-[10px] opacity-30 mt-3 font-body">
        {card.entryDate ?? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </span>
    </div>
  );
}
