import { Minus, Plus } from "@phosphor-icons/react";
import { MAX_STEP, MIN_STEP, STEP_LABELS } from "@/features/vision-board/engine/sizeLadder";
import type { SizeStep } from "@/features/vision-board/engine/types";

interface SizeStepperProps {
  step: SizeStep;
  onStep: (next: number) => void;
}

/**
 * The grow/shrink control on a selected card: − S/M/L/XL + with
 * comfortable 44px touch targets. The board reflows live per tap.
 */
export function SizeStepper({ step, onStep }: SizeStepperProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/70 bg-white/85 px-1 py-1 shadow-lg backdrop-blur">
      <button
        type="button"
        aria-label="Make smaller"
        disabled={step <= MIN_STEP}
        onClick={(e) => {
          e.stopPropagation();
          onStep(step - 1);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-espresso)] transition-colors hover:bg-black/5 disabled:opacity-30"
      >
        <Minus size={16} weight="bold" />
      </button>
      <span className="w-7 text-center text-xs font-bold tracking-wide text-[var(--color-espresso)]">
        {STEP_LABELS[step]}
      </span>
      <button
        type="button"
        aria-label="Make bigger"
        disabled={step >= MAX_STEP}
        onClick={(e) => {
          e.stopPropagation();
          onStep(step + 1);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-espresso)] transition-colors hover:bg-black/5 disabled:opacity-30"
      >
        <Plus size={16} weight="bold" />
      </button>
    </div>
  );
}

export default SizeStepper;
