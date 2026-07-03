import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CHARACTERS } from "@/shared/dialogue";
import type { CharacterId } from "@/shared/dialogue";
import styles from "@/shared/styles/dialogue.module.css";
import { CharacterSymbol } from "./CharacterSymbol";

export interface BarkMessage {
  /** Changing the id retriggers the bubble. */
  id: string;
  text: string;
}

interface BuddyBarkProps {
  character: CharacterId;
  message: BarkMessage | null;
  /** Auto-dismiss delay in ms. */
  duration?: number;
  onDismiss?: () => void;
}

/**
 * A quick speech bubble popping from the blob — task-done reactions,
 * streak celebrations. Skippable by tap, auto-dismisses.
 */
export function BuddyBark({ character, message, duration = 3600, onDismiss }: BuddyBarkProps) {
  const theme = CHARACTERS[character];
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!message) return;
    setLeaving(false);
    timerRef.current = window.setTimeout(() => setLeaving(true), duration);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [message, duration]);

  useEffect(() => {
    if (!leaving) return;
    const t = window.setTimeout(() => onDismiss?.(), 300);
    return () => window.clearTimeout(t);
  }, [leaving, onDismiss]);

  if (!message) return null;

  const accentVars = {
    "--buddy-accent": theme.accent,
    "--buddy-accent-bg": theme.accentBg,
  } as CSSProperties;

  return (
    <div
      key={message.id}
      className={`${styles.bark} ${leaving ? styles.barkLeaving : ""}`}
      style={accentVars}
      onClick={() => setLeaving(true)}
      role="status"
    >
      <span
        className={styles.barkPortrait}
        style={theme.symbolBg ? { background: theme.symbolBg } : undefined}
        aria-hidden="true"
      >
        {theme.portraits.neutral ? (
          <img src={theme.portraits.neutral} alt="" draggable={false} />
        ) : (
          <CharacterSymbol character={character} size={17} />
        )}
      </span>
      <span className={styles.barkText}>{message.text}</span>
    </div>
  );
}
