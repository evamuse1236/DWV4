import type { CSSProperties } from "react";
import styles from "@/shared/styles/dialogue.module.css";

interface SuggestionBubblesProps {
  /** Optional tiny label above the bubbles, e.g. "or pick one". */
  label?: string;
  suggestions: string[];
  onPick: (suggestion: string) => void;
  disabled?: boolean;
}

/**
 * The quick-tap suggestion pills — the standout feature that lets kids
 * finish whole flows without typing a single character.
 */
export function SuggestionBubbles({ label, suggestions, onPick, disabled }: SuggestionBubblesProps) {
  if (suggestions.length === 0) return null;
  return (
    <div>
      {label ? <div className={styles.bubbleLabel}>{label}</div> : null}
      <div className={styles.bubbleRow} style={{ marginTop: label ? 8 : 0 }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={suggestion}
            type="button"
            className={styles.bubble}
            style={{ "--row-index": index } as CSSProperties}
            onClick={() => onPick(suggestion)}
            disabled={disabled}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
