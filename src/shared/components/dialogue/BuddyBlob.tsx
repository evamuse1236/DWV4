import type { CSSProperties, ReactNode } from "react";
import { CHARACTERS } from "@/shared/dialogue";
import type { CharacterId } from "@/shared/dialogue";
import styles from "@/shared/styles/dialogue.module.css";
import { CharacterSymbol } from "./CharacterSymbol";

interface BuddyBlobProps {
  character: CharacterId | null;
  hidden: boolean;
  onClick: () => void;
  ariaLabel: string;
  /** Bark bubble or other floating children anchored to the blob. */
  children?: ReactNode;
}

/**
 * The cute minimized blob — morphing, breathing, tinted per character,
 * with the character's symbol bobbing inside.
 */
export function BuddyBlob({ character, hidden, onClick, ariaLabel, children }: BuddyBlobProps) {
  const theme = character ? CHARACTERS[character] : null;

  const vars = {
    "--buddy-accent": theme?.accent ?? "#a8c5b5",
    "--buddy-accent-bg": theme?.accentBg ?? "#e8f0e9",
    "--buddy-blob-gradient": theme?.blobGradient,
  } as CSSProperties;

  return (
    <div className={`${styles.blobWrapper} ${hidden ? styles.blobHidden : ""}`} style={vars}>
      {children}
      <button type="button" className={styles.blob} onClick={onClick} aria-label={ariaLabel}>
        <span className={styles.blobSymbol} aria-hidden="true">
          {character ? <CharacterSymbol character={character} size={34} /> : "✦"}
        </span>
      </button>
    </div>
  );
}
