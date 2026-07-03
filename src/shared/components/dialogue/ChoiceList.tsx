import type { CSSProperties, ReactNode } from "react";
import styles from "@/shared/styles/dialogue.module.css";

export interface Choice {
  id: string;
  label: ReactNode;
  /** Small right-aligned hint, e.g. a sprint name or day count. */
  hint?: string;
  disabled?: boolean;
}

interface ChoiceListProps {
  choices: Choice[];
  onChoose: (id: string) => void;
  disabled?: boolean;
}

/** Hades keel-rows: stacked full-width choices with a sliding accent bar. */
export function ChoiceList({ choices, onChoose, disabled }: ChoiceListProps) {
  if (choices.length === 0) return null;
  return (
    <div className={styles.choiceList}>
      {choices.map((choice, index) => (
        <button
          key={choice.id}
          type="button"
          className={styles.choiceRow}
          style={{ "--row-index": index } as CSSProperties}
          onClick={() => onChoose(choice.id)}
          disabled={disabled || choice.disabled}
        >
          <span className={styles.choiceMarker}>▸</span>
          <span>{choice.label}</span>
          {choice.hint ? <span className={styles.choiceHint}>{choice.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}
