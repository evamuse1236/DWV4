import { useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "./useAuth";
import type { Id } from "../../convex/_generated/dataModel";

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
  | "journal";

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
  size: CardSize;
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

/** Which sizes each card type allows. */
export const ALLOWED_SIZES: Record<CardType, readonly CardSize[]> = {
  image_hero: ["hero", "lg", "wide"],
  counter: ["sm", "md"],
  progress: ["lg", "md", "wide"],
  streak: ["wide", "md"],
  habits: ["tall", "lg"],
  mini_tile: ["sm"],
  motivation: ["md", "wide"],
  journal: ["wide", "md", "lg"],
} as const;

/** Default size for each card type. */
export const DEFAULT_SIZE: Record<CardType, CardSize> = {
  image_hero: "hero",
  counter: "sm",
  progress: "lg",
  streak: "wide",
  habits: "tall",
  mini_tile: "sm",
  motivation: "md",
  journal: "wide",
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVisionBoard() {
  const { user } = useAuth();
  const userId = user?._id as Id<"users"> | undefined;

  // ---- Queries ----
  const rawAreas = useQuery(
    api.visionBoard.getAreas,
    userId ? { userId } : "skip",
  );
  const rawCards = useQuery(
    api.visionBoard.getCards,
    userId ? { userId } : "skip",
  );

  // ---- Map _id → id for backward-compat with components ----
  const areas: VisionBoardArea[] = (rawAreas ?? []).map((a) => ({
    id: a._id as string,
    name: a.name,
    emoji: a.emoji,
    isPreset: a.isPreset,
  }));

  const cards: VisionBoardCard[] = (rawCards ?? []).map((c) => ({
    id: c._id as string,
    areaId: c.areaId as string,
    cardType: c.cardType as CardType,
    title: c.title,
    subtitle: c.subtitle,
    emoji: c.emoji,
    colorVariant: c.colorVariant as ColorVariant,
    size: c.size as CardSize,
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
    createdAt: c.createdAt,
  }));

  // ---- Seed preset areas on first load ----
  const seedMutation = useMutation(api.visionBoard.seedPresetAreas);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!userId || seededRef.current) return;
    if (rawAreas !== undefined && rawAreas.length === 0) {
      seededRef.current = true;
      seedMutation({ userId });
    }
  }, [userId, rawAreas, seedMutation]);

  // ---- Mutations ----
  const createCardMut = useMutation(api.visionBoard.createCard);
  const updateCardMut = useMutation(api.visionBoard.updateCard);
  const deleteCardMut = useMutation(api.visionBoard.deleteCard);
  const addAreaMut = useMutation(api.visionBoard.addArea);
  const incrementCounterMut = useMutation(api.visionBoard.incrementCounter);
  const incrementProgressMut = useMutation(api.visionBoard.incrementProgress);
  const incrementStreakMut = useMutation(api.visionBoard.incrementStreak);
  const toggleHabitMut = useMutation(api.visionBoard.toggleHabit);

  // ---- CRUD wrappers (same signatures as before) ----

  const addCard = useCallback(
    (draft: Omit<VisionBoardCard, "id" | "order" | "createdAt">) => {
      if (!userId) return;
      createCardMut({
        userId,
        areaId: draft.areaId as Id<"visionBoardAreas">,
        cardType: draft.cardType,
        title: draft.title,
        subtitle: draft.subtitle,
        emoji: draft.emoji,
        colorVariant: draft.colorVariant,
        size: draft.size,
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
      });
    },
    [userId, createCardMut],
  );

  const updateCard = useCallback(
    (id: string, patch: Partial<VisionBoardCard>) => {
      const { id: _id, areaId: _areaId, cardType: _ct, createdAt: _ca, order: _o, ...rest } = patch;
      updateCardMut({
        cardId: id as Id<"visionBoardCards">,
        ...rest,
      } as Parameters<typeof updateCardMut>[0]);
    },
    [updateCardMut],
  );

  const deleteCard = useCallback(
    (id: string) => {
      deleteCardMut({ cardId: id as Id<"visionBoardCards"> });
    },
    [deleteCardMut],
  );

  const addArea = useCallback(
    (name: string, emoji: string) => {
      if (!userId) return;
      addAreaMut({ userId, name, emoji });
    },
    [userId, addAreaMut],
  );

  // ---- Interaction helpers ----

  const incrementCounter = useCallback(
    (id: string) => {
      incrementCounterMut({ cardId: id as Id<"visionBoardCards"> });
    },
    [incrementCounterMut],
  );

  const incrementProgress = useCallback(
    (id: string) => {
      incrementProgressMut({ cardId: id as Id<"visionBoardCards"> });
    },
    [incrementProgressMut],
  );

  const incrementStreak = useCallback(
    (id: string) => {
      incrementStreakMut({ cardId: id as Id<"visionBoardCards"> });
    },
    [incrementStreakMut],
  );

  const toggleHabit = useCallback(
    (cardId: string, habitIndex: number) => {
      toggleHabitMut({
        cardId: cardId as Id<"visionBoardCards">,
        habitIndex,
      });
    },
    [toggleHabitMut],
  );

  const cycleSize = useCallback(
    (id: string) => {
      const card = cards.find((c) => c.id === id);
      if (!card) return;
      const allowed = ALLOWED_SIZES[card.cardType];
      const idx = allowed.indexOf(card.size);
      const next = allowed[(idx + 1) % allowed.length];
      updateCardMut({
        cardId: id as Id<"visionBoardCards">,
        size: next,
      });
    },
    [cards, updateCardMut],
  );

  return {
    cards,
    areas,
    addCard,
    updateCard,
    deleteCard,
    addArea,
    incrementCounter,
    incrementProgress,
    incrementStreak,
    toggleHabit,
    cycleSize,
  };
}

export default useVisionBoard;
