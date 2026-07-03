import { useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { Id } from "@convex/_generated/dataModel";
import type { SizeStep } from "@/features/vision-board/engine/types";
import { clampStep, MAX_STEP, MIN_STEP } from "@/features/vision-board/engine/sizeLadder";
import { resolveSizeStep } from "@/features/vision-board/engine/adapter";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardType =
  | "image_hero"
  | "counter"
  | "progress"
  | "streak"
  | "habits"
  | "mini_tile"
  | "motivation"
  | "journal"
  | "countdown"
  | "photo_strip";

/** Legacy v1 size names (kept during the transition for rollback safety). */
export type CardSize = "sm" | "md" | "lg" | "tall" | "wide" | "hero";
export type ColorVariant = "green" | "blue" | "pink" | "purple" | "orange" | "yellow";

export interface VisionBoardCard {
  id: string;
  areaId: string;
  cardType: CardType;
  title: string;
  subtitle?: string;
  emoji?: string;
  colorVariant: ColorVariant;
  /** Collage v2 size step (always resolved, adapting legacy sizes). */
  sizeStep: SizeStep;
  /** Legacy named size, when the row still carries one. */
  size?: CardSize;
  order: number;

  // image_hero
  imageUrl?: string;
  progressPercent?: number;

  // counter
  currentCount?: number;
  targetCount?: number;
  countLabel?: string;

  // progress
  description?: string;
  totalSteps?: number;
  completedSteps?: number;
  stepsLabel?: string;

  // streak
  quote?: string;
  streakCount?: number;

  // habits
  habits?: { label: string; done: boolean }[];
  dayCount?: number;

  // journal
  textContent?: string;
  entryDate?: string;

  // countdown
  targetDate?: string;

  // photo_strip
  imageUrls?: string[];

  createdAt: number;
}

export interface VisionBoardArea {
  id: string;
  name: string;
  emoji: string;
  isPreset: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default S/M/L/XL step for a freshly created card of each type. */
export const DEFAULT_STEP: Record<CardType, SizeStep> = {
  image_hero: 3,
  counter: 1,
  progress: 2,
  streak: 2,
  habits: 2,
  mini_tile: 1,
  motivation: 2,
  journal: 2,
  countdown: 2,
  photo_strip: 2,
};

export { MIN_STEP, MAX_STEP };

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVisionBoard() {
  const { user, token } = useAuth();
  const userId = user?._id as Id<"users"> | undefined;

  // ---- Queries ----
  const rawAreas = useQuery(
    api.visionBoard.getAreas,
    userId && token ? { token, userId } : "skip",
  );
  const rawCards = useQuery(
    api.visionBoard.getCards,
    userId && token ? { token, userId } : "skip",
  );

  // ---- Map _id → id for backward-compat with components ----
  const areas: VisionBoardArea[] = (rawAreas ?? []).map((a) => ({
    id: a._id as string,
    name: a.name,
    emoji: a.emoji,
    isPreset: a.isPreset,
  }));

  const cards: VisionBoardCard[] = (rawCards ?? [])
    .map((c) => ({
      id: c._id as string,
      areaId: c.areaId as string,
      cardType: c.cardType as CardType,
      title: c.title,
      subtitle: c.subtitle,
      emoji: c.emoji,
      colorVariant: c.colorVariant as ColorVariant,
      // Read-adapter: unmigrated rows render correctly on first paint.
      sizeStep: resolveSizeStep(c),
      size: c.size as CardSize | undefined,
      order: c.order,
      imageUrl: c.imageUrl,
      progressPercent: c.progressPercent,
      currentCount: c.currentCount,
      targetCount: c.targetCount,
      countLabel: c.countLabel,
      description: c.description,
      totalSteps: c.totalSteps,
      completedSteps: c.completedSteps,
      stepsLabel: c.stepsLabel,
      quote: c.quote,
      streakCount: c.streakCount,
      habits: c.habits,
      dayCount: c.dayCount,
      textContent: c.textContent,
      entryDate: c.entryDate,
      targetDate: c.targetDate,
      imageUrls: c.imageUrls,
      createdAt: c.createdAt,
    }))
    .sort((a, b) => a.order - b.order);

  // ---- Seed preset areas on first load ----
  const seedMutation = useMutation(api.visionBoard.seedPresetAreas);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!userId || !token || seededRef.current) return;
    if (rawAreas !== undefined && rawAreas.length === 0) {
      seededRef.current = true;
      seedMutation({ token, userId });
    }
  }, [userId, token, rawAreas, seedMutation]);

  // ---- Lazy v1 → v2 migration (idempotent, fires once) ----
  const migrateMutation = useMutation(api.visionBoard.migrateMyCards);
  const migratedRef = useRef(false);

  useEffect(() => {
    if (!userId || !token || migratedRef.current) return;
    const needsMigration = (rawCards ?? []).some(
      (c) => typeof c.sizeStep !== "number",
    );
    if (rawCards !== undefined && needsMigration) {
      migratedRef.current = true;
      migrateMutation({ token, userId });
    }
  }, [userId, token, rawCards, migrateMutation]);

  // ---- Mutations ----
  const createCardMut = useMutation(api.visionBoard.createCard);
  const updateCardMut = useMutation(api.visionBoard.updateCard);
  const deleteCardMut = useMutation(api.visionBoard.deleteCard);
  const addAreaMut = useMutation(api.visionBoard.addArea);
  const updateAreaMut = useMutation(api.visionBoard.updateArea);
  const deleteAreaMut = useMutation(api.visionBoard.deleteArea);
  const incrementCounterMut = useMutation(api.visionBoard.incrementCounter);
  const incrementProgressMut = useMutation(api.visionBoard.incrementProgress);
  const incrementStreakMut = useMutation(api.visionBoard.incrementStreak);
  const toggleHabitMut = useMutation(api.visionBoard.toggleHabit);

  // ---- CRUD wrappers ----

  const addCard = useCallback(
    (draft: Omit<VisionBoardCard, "id" | "order" | "createdAt" | "sizeStep"> & {
      sizeStep?: SizeStep;
    }) => {
      if (!userId || !token) return;
      createCardMut({
        token,
        userId,
        areaId: draft.areaId as Id<"visionBoardAreas">,
        cardType: draft.cardType,
        title: draft.title,
        subtitle: draft.subtitle,
        emoji: draft.emoji,
        colorVariant: draft.colorVariant,
        sizeStep: draft.sizeStep ?? DEFAULT_STEP[draft.cardType],
        imageUrl: draft.imageUrl,
        progressPercent: draft.progressPercent,
        currentCount: draft.currentCount,
        targetCount: draft.targetCount,
        countLabel: draft.countLabel,
        description: draft.description,
        totalSteps: draft.totalSteps,
        completedSteps: draft.completedSteps,
        stepsLabel: draft.stepsLabel,
        quote: draft.quote,
        streakCount: draft.streakCount,
        habits: draft.habits,
        dayCount: draft.dayCount,
        textContent: draft.textContent,
        entryDate: draft.entryDate,
        targetDate: draft.targetDate,
        imageUrls: draft.imageUrls,
      });
    },
    [userId, token, createCardMut],
  );

  const updateCard = useCallback(
    (id: string, patch: Partial<VisionBoardCard>) => {
      if (!token) return;
      const { id: _id, areaId: _areaId, cardType: _ct, createdAt: _ca, order: _o, size: _s, ...rest } = patch;
      updateCardMut({
        token,
        cardId: id as Id<"visionBoardCards">,
        ...rest,
      } as Parameters<typeof updateCardMut>[0]);
    },
    [token, updateCardMut],
  );

  const deleteCard = useCallback(
    (id: string) => {
      if (!token) return;
      deleteCardMut({ token, cardId: id as Id<"visionBoardCards"> });
    },
    [token, deleteCardMut],
  );

  const addArea = useCallback(
    (name: string, emoji: string) => {
      if (!userId || !token) return;
      addAreaMut({ token, userId, name, emoji });
    },
    [userId, token, addAreaMut],
  );

  const updateArea = useCallback(
    (id: string, patch: { name?: string; emoji?: string }) => {
      if (!token) return;
      updateAreaMut({
        token,
        areaId: id as Id<"visionBoardAreas">,
        ...patch,
      });
    },
    [token, updateAreaMut],
  );

  const deleteArea = useCallback(
    (id: string) => {
      if (!token) return;
      deleteAreaMut({ token, areaId: id as Id<"visionBoardAreas"> });
    },
    [token, deleteAreaMut],
  );

  // ---- Interaction helpers ----

  const incrementCounter = useCallback(
    (id: string) => {
      if (!token) return;
      incrementCounterMut({ token, cardId: id as Id<"visionBoardCards"> });
    },
    [token, incrementCounterMut],
  );

  const incrementProgress = useCallback(
    (id: string) => {
      if (!token) return;
      incrementProgressMut({ token, cardId: id as Id<"visionBoardCards"> });
    },
    [token, incrementProgressMut],
  );

  const incrementStreak = useCallback(
    (id: string) => {
      if (!token) return;
      incrementStreakMut({ token, cardId: id as Id<"visionBoardCards"> });
    },
    [token, incrementStreakMut],
  );

  const toggleHabit = useCallback(
    (cardId: string, habitIndex: number) => {
      if (!token) return;
      toggleHabitMut({
        token,
        cardId: cardId as Id<"visionBoardCards">,
        habitIndex,
      });
    },
    [token, toggleHabitMut],
  );

  /** Set a card's S/M/L/XL step (clamped 1..4). */
  const setSizeStep = useCallback(
    (id: string, step: number) => {
      if (!token) return;
      updateCardMut({
        token,
        cardId: id as Id<"visionBoardCards">,
        sizeStep: clampStep(step),
      });
    },
    [token, updateCardMut],
  );

  /**
   * Move a card into the priority slot between its new neighbours using a
   * fractional order — one document patch, the packer does the rest.
   */
  const reorderCard = useCallback(
    (id: string, beforeOrder: number | null, afterOrder: number | null) => {
      if (!token) return;
      let order: number;
      if (beforeOrder === null && afterOrder === null) return;
      if (beforeOrder === null) order = (afterOrder as number) - 1;
      else if (afterOrder === null) order = beforeOrder + 1;
      else order = (beforeOrder + afterOrder) / 2;
      updateCardMut({
        token,
        cardId: id as Id<"visionBoardCards">,
        order,
      });
    },
    [token, updateCardMut],
  );

  return {
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
    setSizeStep,
    reorderCard,
  };
}

export default useVisionBoard;
