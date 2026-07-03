import type { VisionBoardCard } from "@/features/vision-board/hooks/useVisionBoard";

interface Props {
  card: VisionBoardCard;
}

function daysUntil(targetDate?: string): number | null {
  if (!targetDate) return null;
  const [y, m, d] = targetDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / (24 * 60 * 60 * 1000));
}

/**
 * Countdown widget — the big number of days until something the student
 * is looking forward to.
 */
export function CountdownCard({ card }: Props) {
  const days = daysUntil(card.targetDate);

  return (
    <div className="flex h-full flex-col justify-between p-5 @lg:p-7">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-60">
          {card.title}
        </p>
        {card.emoji && <span className="text-lg leading-none">{card.emoji}</span>}
      </div>
      <div>
        {days === null ? (
          <p className="font-display text-lg italic opacity-60">Pick a date…</p>
        ) : days > 0 ? (
          <>
            <p className="font-display text-[2.6rem] italic leading-none @lg:text-[3.4rem]">
              {days}
            </p>
            <p className="mt-1 text-xs font-medium opacity-60">
              day{days === 1 ? "" : "s"} to go
            </p>
          </>
        ) : days === 0 ? (
          <p className="font-display text-2xl italic leading-tight">It&apos;s today! 🎉</p>
        ) : (
          <p className="font-display text-lg italic opacity-60">
            {Math.abs(days)} day{Math.abs(days) === 1 ? "" : "s"} ago
          </p>
        )}
      </div>
    </div>
  );
}

export default CountdownCard;
