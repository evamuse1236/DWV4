import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkle } from "@phosphor-icons/react";
import { useVisionBoard } from "@/hooks/useVisionBoard";
import type { VisionBoardCard } from "@/hooks/useVisionBoard";
import { VisionBoardGrid } from "@/components/visionboard/VisionBoardGrid";
import { CardCreatorSheet } from "@/components/visionboard/CardCreatorSheet";
import { CardDetailSheet } from "@/components/visionboard/CardDetailSheet";
import { VisionBoardFAB } from "@/components/visionboard/VisionBoardFAB";

/**
 * Vision Board — immersive full-bleed mosaic of goals.
 * No header, no top chrome. All controls live in the floating bubble (bottom-right).
 */
export function VisionBoardPage() {
  const {
    cards,
    areas,
    addCard,
    updateCard,
    deleteCard,
    addArea,
    updateArea,
    deleteArea,
    incrementCounter,
    incrementProgress,
    incrementStreak,
    toggleHabit,
  } = useVisionBoard();

  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredCards = useMemo(() => {
    const sorted = [...cards].sort((a, b) => a.order - b.order);
    if (!selectedAreaId) return sorted;
    return sorted.filter((c) => c.areaId === selectedAreaId);
  }, [cards, selectedAreaId]);

  // Derive from live cards array so the sheet stays in sync during edits
  const selectedCardData = useMemo(
    () => cards.find((c) => c.id === selectedCardId) ?? null,
    [cards, selectedCardId],
  );

  const handleCardClick = useCallback((card: VisionBoardCard) => {
    setSelectedCardId(card.id);
    setDetailOpen(true);
  }, []);

  const handleDetailOpenChange = useCallback((open: boolean) => {
    setDetailOpen(open);
    if (!open) setSelectedCardId(null);
  }, []);

  const handleDeleteArea = useCallback(
    (id: string) => {
      deleteArea(id);
      if (selectedAreaId === id) setSelectedAreaId(null);
    },
    [deleteArea, selectedAreaId],
  );

  return (
    <div>
      {filteredCards.length > 0 ? (
        <VisionBoardGrid
          key={selectedAreaId ?? "all"}
          cards={filteredCards}
          onIncrement={incrementCounter}
          onIncrementProgress={incrementProgress}
          onIncrementStreak={incrementStreak}
          onToggleHabit={toggleHabit}
          onCardClick={handleCardClick}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex flex-col items-center justify-center text-center py-32"
        >
          <div className="w-20 h-20 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center mb-6 shadow-sm">
            <Sparkle size={32} className="opacity-60" />
          </div>
          <h3 className="font-display italic text-2xl mb-2">
            {selectedAreaId
              ? "No goals in this area yet"
              : "Your board is empty"}
          </h3>
          <p className="text-sm opacity-50 font-body max-w-[300px]">
            {selectedAreaId
              ? "Create your first goal for this area."
              : "Tap the + button to start building your vision."}
          </p>
        </motion.div>
      )}

      {/* Detail sheet — edit / delete a card */}
      <CardDetailSheet
        card={selectedCardData}
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        onUpdate={updateCard}
        onDelete={deleteCard}
      />

      {/* Creator sheet — triggered from floating bubble */}
      <CardCreatorSheet
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        areas={areas}
        onAdd={addCard}
        defaultAreaId={selectedAreaId}
      />

      {/* Floating action bubble with drop-up menu */}
      <VisionBoardFAB
        areas={areas}
        selectedAreaId={selectedAreaId}
        onSelectArea={setSelectedAreaId}
        onNewGoal={() => setCreatorOpen(true)}
        onAddArea={addArea}
        onUpdateArea={updateArea}
        onDeleteArea={handleDeleteArea}
        cards={cards}
      />
    </div>
  );
}

export default VisionBoardPage;
