import { Check } from "@phosphor-icons/react";
import type { VisionBoardCard } from "@/hooks/useVisionBoard";

interface Props {
  card: VisionBoardCard;
  onToggle: (index: number) => void;
}

export function HabitsCard({ card, onToggle }: Props) {
  const habits = card.habits ?? [];

  return (
    <div className="h-full p-6 flex flex-col justify-between">
      <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-40 m-0">
        {card.title}
      </h4>
      <ul className="list-none p-0 m-0 space-y-4">
        {habits.map((h, i) => (
          <li key={i} className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(i);
              }}
              className={`w-5 h-5 rounded border flex items-center justify-center shrink-0
                cursor-pointer transition-colors ${
                  h.done
                    ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10"
                    : "border-black/10 hover:border-[var(--color-primary)]/30"
                }`}
            >
              {h.done && (
                <Check size={12} weight="bold" className="text-[var(--color-primary)]" />
              )}
            </button>
            <span className={`text-[13px] ${h.done ? "line-through opacity-50" : ""}`}>
              {h.label}
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-4 pt-4 border-t border-black/5">
        <span className="font-display italic text-[1.1rem]">
          Day {card.dayCount ?? 1}
        </span>
      </div>
    </div>
  );
}
