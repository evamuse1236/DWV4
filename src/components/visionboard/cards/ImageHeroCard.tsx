import type { VisionBoardCard } from "@/hooks/useVisionBoard";

interface Props {
  card: VisionBoardCard;
}

export function ImageHeroCard({ card }: Props) {
  const progress = card.progressPercent ?? 0;

  return (
    <div className="h-full p-10 flex flex-col justify-between relative overflow-hidden">
      {card.imageUrl && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url('${card.imageUrl}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "multiply",
          }}
        />
      )}
      <div className="relative z-10">
        {card.subtitle && (
          <span className="inline-block px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase bg-white/60 backdrop-blur-sm mb-4">
            {card.subtitle}
          </span>
        )}
        <h2 className="text-[3.5rem] leading-[1.05] m-0 font-display italic">
          {card.title}
        </h2>
      </div>
      <div className="relative z-10 flex items-center gap-4">
        <div className="h-1.5 flex-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-bold opacity-70">{progress}%</span>
      </div>
    </div>
  );
}
