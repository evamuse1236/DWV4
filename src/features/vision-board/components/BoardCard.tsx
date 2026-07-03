import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/shared/lib/utils";
import type {
  VisionBoardCard,
  ColorVariant,
} from "@/features/vision-board/hooks/useVisionBoard";
import type { PlacedItem } from "@/features/vision-board/engine/types";
import { SizeStepper } from "./SizeStepper";

import { MiniTileCard } from "./cards/MiniTileCard";
import { CounterCard } from "./cards/CounterCard";
import { ImageHeroCard } from "./cards/ImageHeroCard";
import { ProgressCard } from "./cards/ProgressCard";
import { StreakCard } from "./cards/StreakCard";
import { HabitsCard } from "./cards/HabitsCard";
import { MotivationCard } from "./cards/MotivationCard";
import { JournalCard } from "./cards/JournalCard";
import { CountdownCard } from "./cards/CountdownCard";
import { PhotoStripCard } from "./cards/PhotoStripCard";

const COLOR_CLASSES: Record<ColorVariant, string> = {
  green: "pastel-green",
  blue: "pastel-blue",
  pink: "pastel-pink",
  purple: "pastel-purple",
  orange: "pastel-orange",
  yellow: "pastel-yellow",
};

const SPRING = { type: "spring" as const, stiffness: 350, damping: 34 };

interface BoardCardProps {
  card: VisionBoardCard;
  placement: PlacedItem;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onOpen: (card: VisionBoardCard) => void;
  onStep: (id: string, next: number) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onIncrement: (id: string) => void;
  onIncrementProgress: (id: string) => void;
  onIncrementStreak: (id: string) => void;
  onToggleHabit: (cardId: string, index: number) => void;
}

/**
 * Card chrome for the collage: FLIP layout animation, tap-to-select with a
 * glass toolbar (size stepper + move earlier/later + edit), content
 * delegated to the widget components. Container queries let content adapt
 * to whatever box the packer gives it.
 */
export function BoardCard({
  card,
  placement,
  selected,
  onSelect,
  onOpen,
  onStep,
  onMove,
  onIncrement,
  onIncrementProgress,
  onIncrementStreak,
  onToggleHabit,
}: BoardCardProps) {
  const colorClass = COLOR_CLASSES[card.colorVariant];

  function renderInner() {
    switch (card.cardType) {
      case "mini_tile":
        return <MiniTileCard card={card} />;
      case "counter":
        return <CounterCard card={card} onIncrement={() => onIncrement(card.id)} />;
      case "image_hero":
        return <ImageHeroCard card={card} />;
      case "progress":
        return (
          <ProgressCard card={card} onIncrement={() => onIncrementProgress(card.id)} />
        );
      case "streak":
        return <StreakCard card={card} onIncrement={() => onIncrementStreak(card.id)} />;
      case "habits":
        return <HabitsCard card={card} onToggle={(i) => onToggleHabit(card.id, i)} />;
      case "motivation":
        return <MotivationCard card={card} />;
      case "journal":
        return <JournalCard card={card} />;
      case "countdown":
        return <CountdownCard card={card} />;
      case "photo_strip":
        return <PhotoStripCard card={card} />;
      default:
        return null;
    }
  }

  return (
    <motion.div
      layout
      layoutId={card.id}
      transition={SPRING}
      data-card-id={card.id}
      className={cn(
        "pastel-card group relative h-full min-h-0 cursor-pointer @container",
        colorClass,
        selected &&
          "z-20 ring-2 ring-[var(--color-espresso)]/35 ring-offset-2 ring-offset-[var(--color-canvas)]"
      )}
      style={{
        gridColumnStart: placement.colStart,
        gridColumnEnd: `span ${placement.colSpan}`,
        gridRowStart: placement.rowStart,
        gridRowEnd: `span ${placement.rowSpan}`,
      }}
      animate={{ scale: selected ? 1.02 : 1 }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(selected ? null : card.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(selected ? null : card.id);
        }
        if (e.key === "Escape") onSelect(null);
      }}
    >
      {renderInner()}

      {/* Quick edit affordance on hover */}
      {!selected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(card);
          }}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/60 opacity-0 backdrop-blur-sm transition-opacity hover:!opacity-100 group-hover:opacity-60"
          aria-label="Edit card"
        >
          <PencilSimple size={14} weight="bold" className="opacity-70" />
        </button>
      )}

      {/* Selection toolbar */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Move earlier"
            onClick={() => onMove(card.id, -1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/85 text-[var(--color-espresso)] shadow-lg backdrop-blur transition-colors hover:bg-white"
          >
            <ArrowLeft size={14} weight="bold" />
          </button>
          <SizeStepper step={card.sizeStep} onStep={(next) => onStep(card.id, next)} />
          <button
            type="button"
            aria-label="Move later"
            onClick={() => onMove(card.id, 1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/85 text-[var(--color-espresso)] shadow-lg backdrop-blur transition-colors hover:bg-white"
          >
            <ArrowRight size={14} weight="bold" />
          </button>
          <button
            type="button"
            aria-label="Open card details"
            onClick={() => onOpen(card)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/85 text-[var(--color-espresso)] shadow-lg backdrop-blur transition-colors hover:bg-white"
          >
            <PencilSimple size={14} weight="bold" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

export default BoardCard;
