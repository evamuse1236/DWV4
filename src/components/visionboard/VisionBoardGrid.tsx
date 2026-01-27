import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import type { VisionBoardCard } from "@/hooks/useVisionBoard";
import { CardRenderer } from "./CardRenderer";
import { computeVisionBoardLayout } from "./layout";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

interface Props {
  cards: VisionBoardCard[];
  onIncrement: (id: string) => void;
  onIncrementProgress: (id: string) => void;
  onIncrementStreak: (id: string) => void;
  onToggleHabit: (cardId: string, index: number) => void;
  onCardClick: (card: VisionBoardCard) => void;
}

export function VisionBoardGrid({
  cards,
  onIncrement,
  onIncrementProgress,
  onIncrementStreak,
  onToggleHabit,
  onCardClick,
}: Props) {
  if (cards.length === 0) return null;

  const layout = useMemo(() => computeVisionBoardLayout(cards), [cards]);

  return (
    <motion.div
      className="grid grid-cols-6 gap-6 auto-rows-[160px] items-stretch"
      style={{ gridAutoFlow: "dense" }}
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => (
        <CardRenderer
          key={card.id}
          card={card}
          layout={layout.items[card.id]}
          onIncrement={onIncrement}
          onIncrementProgress={onIncrementProgress}
          onIncrementStreak={onIncrementStreak}
          onToggleHabit={onToggleHabit}
          onClick={onCardClick}
        />
      ))}
    </motion.div>
  );
}
