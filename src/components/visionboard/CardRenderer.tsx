import { motion, type Variants } from "framer-motion";
import { PencilSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { VisionBoardCard, CardSize, ColorVariant } from "@/hooks/useVisionBoard";
import type { LayoutItem } from "./layout";

import { MiniTileCard } from "./cards/MiniTileCard";
import { CounterCard } from "./cards/CounterCard";
import { ImageHeroCard } from "./cards/ImageHeroCard";
import { ProgressCard } from "./cards/ProgressCard";
import { StreakCard } from "./cards/StreakCard";
import { HabitsCard } from "./cards/HabitsCard";
import { MotivationCard } from "./cards/MotivationCard";
import { JournalCard } from "./cards/JournalCard";

// ---------------------------------------------------------------------------
// Size → CSS Grid span classes
// ---------------------------------------------------------------------------

const SIZE_CLASSES: Record<CardSize, string> = {
  sm: "col-span-1 row-span-1",
  md: "col-span-2 row-span-1",
  lg: "col-span-2 row-span-2",
  tall: "col-span-1 row-span-2",
  wide: "col-span-3 row-span-1",
  hero: "col-span-4 row-span-2",
};

const COLOR_CLASSES: Record<ColorVariant, string> = {
  green: "pastel-green",
  blue: "pastel-blue",
  pink: "pastel-pink",
  purple: "pastel-purple",
  orange: "pastel-orange",
  yellow: "pastel-yellow",
};

const PRIMARY_ACTION_TYPES = new Set(["counter", "progress", "streak", "habits"]);

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export const cardFadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
  },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  card: VisionBoardCard;
  onIncrement: (id: string) => void;
  onIncrementProgress: (id: string) => void;
  onIncrementStreak: (id: string) => void;
  onToggleHabit: (cardId: string, index: number) => void;
  onClick: (card: VisionBoardCard) => void;
  layout?: LayoutItem;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CardRenderer({
  card,
  onIncrement,
  onIncrementProgress,
  onIncrementStreak,
  onToggleHabit,
  onClick,
  layout,
}: Props) {
  const displaySize = layout?.size ?? card.size;
  const sizeClass = layout ? undefined : SIZE_CLASSES[displaySize];
  const colorClass = COLOR_CLASSES[card.colorVariant];
  const placementStyle = layout
    ? {
        gridColumnStart: layout.colStart,
        gridColumnEnd: `span ${layout.colSpan}`,
        gridRowStart: layout.rowStart,
        gridRowEnd: `span ${layout.rowSpan}`,
      }
    : undefined;

  const hasPrimaryAction = PRIMARY_ACTION_TYPES.has(card.cardType);

  function renderInner() {
    switch (card.cardType) {
      case "mini_tile":
        return <MiniTileCard card={card} />;
      case "counter":
        return (
          <CounterCard
            card={card}
            onIncrement={() => onIncrement(card.id)}
          />
        );
      case "image_hero":
        return <ImageHeroCard card={card} />;
      case "progress":
        return (
          <ProgressCard
            card={card}
            onIncrement={() => onIncrementProgress(card.id)}
          />
        );
      case "streak":
        return (
          <StreakCard
            card={card}
            onIncrement={() => onIncrementStreak(card.id)}
          />
        );
      case "habits":
        return (
          <HabitsCard
            card={card}
            onToggle={(i) => onToggleHabit(card.id, i)}
          />
        );
      case "motivation":
        return <MotivationCard card={card} />;
      case "journal":
        return <JournalCard card={card} />;
      default:
        return null;
    }
  }

  return (
    <motion.div
      variants={cardFadeUp}
      className={cn("pastel-card relative group cursor-pointer h-full min-h-0", sizeClass, colorClass)}
      style={placementStyle}
      onClick={() => onClick(card)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(card);
      }}
    >
      {renderInner()}
      {hasPrimaryAction && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClick(card);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/60 backdrop-blur-sm
                     flex items-center justify-center opacity-0 group-hover:opacity-60
                     hover:!opacity-100 transition-opacity z-10"
          aria-label="Edit card"
        >
          <PencilSimple size={14} weight="bold" className="opacity-70" />
        </button>
      )}
    </motion.div>
  );
}
