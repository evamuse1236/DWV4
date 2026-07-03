import type { SizeStep } from "./types";
import { clampStep } from "./sizeLadder";

/**
 * Adapter from the v1 named sizes to v2 size steps. Used both by the
 * client read-path (so unmigrated cards render correctly on first paint)
 * and by the lazy `visionBoard.migrateMyCards` mutation.
 */
const LEGACY_SIZE_TO_STEP: Record<string, SizeStep> = {
  sm: 1,
  md: 2,
  tall: 2,
  wide: 3,
  lg: 3,
  hero: 4,
};

export function adaptLegacySize(size: string | undefined | null): SizeStep {
  if (!size) return 2;
  return LEGACY_SIZE_TO_STEP[size] ?? 2;
}

/** Resolve a card's effective step from v2/v1 fields. */
export function resolveSizeStep(card: {
  sizeStep?: number | null;
  size?: string | null;
}): SizeStep {
  if (typeof card.sizeStep === "number") return clampStep(card.sizeStep);
  return adaptLegacySize(card.size);
}
