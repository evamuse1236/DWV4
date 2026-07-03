import type { VisionBoardCard } from "@/features/vision-board/hooks/useVisionBoard";

interface Props {
  card: VisionBoardCard;
}

export function ImageHeroCard({ card }: Props) {
  const progress = card.progressPercent ?? 0;

  return (
    <div className="h-full p-10 flex flex-col justify-between relative overflow-hidden">
      {card.imageUrl && (
        <>
          {/* The dream should look alive — image at full color... */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50"
            style={{
              backgroundImage: `url('${card.imageUrl}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {/* ...with a paper scrim that keeps the title readable */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgba(253,251,247,0.94)] via-[rgba(253,251,247,0.68)] to-[rgba(253,251,247,0.15)]" />
        </>
      )}
      <div className="relative z-10">
        {card.subtitle && (
          <span className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase bg-white/70 backdrop-blur-sm mb-4">
            {card.subtitle}
          </span>
        )}
        <h2 className="text-[3.5rem] leading-[1.05] m-0 font-display italic text-[var(--color-espresso)]">
          {card.title}
        </h2>
      </div>
      <div className="relative z-10 flex items-center gap-4">
        <div className="h-2 flex-1 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-espresso)] rounded-full transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-bold text-[var(--color-espresso)]/80">{progress}%</span>
      </div>
    </div>
  );
}
