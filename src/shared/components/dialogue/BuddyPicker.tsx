import type { CSSProperties } from "react";
import { CHARACTERS, CHARACTER_IDS } from "@/shared/dialogue";
import type { BuddyMode, CharacterId } from "@/shared/dialogue";
import styles from "@/shared/styles/dialogue.module.css";
import { CharacterSymbol } from "./CharacterSymbol";

interface BuddyPickerProps {
  current: CharacterId | null;
  mode: BuddyMode;
  onPick: (character: CharacterId) => void;
  onModeChange: (mode: BuddyMode) => void;
}

/**
 * Character select as a mini-scene: all three portraits on stage, each
 * speaking a one-line pitch for why the kid should pick them.
 */
export function BuddyPicker({ current, mode, onPick, onModeChange }: BuddyPickerProps) {
  return (
    <div>
      <h3 className={styles.pickerTitle}>
        {current ? "Who's coming with you?" : "Pick your buddy!"}
      </h3>
      <div className={styles.pickerGrid} style={{ marginTop: 10 }}>
        {CHARACTER_IDS.map((id, index) => {
          const theme = CHARACTERS[id];
          const cardVars = {
            "--card-accent": theme.accent,
            "--card-accent-bg": theme.accentBg,
            "--row-index": index,
          } as CSSProperties;
          const active = current === id;
          return (
            <button
              key={id}
              type="button"
              className={`${styles.pickerCard} ${active ? styles.pickerCardActive : ""}`}
              style={cardVars}
              onClick={() => onPick(id)}
              aria-pressed={active}
            >
              <span
                className={styles.pickerPortrait}
                style={theme.symbolBg ? { background: theme.symbolBg } : undefined}
                aria-hidden="true"
              >
                {theme.portraits.neutral ? (
                  <img src={theme.portraits.neutral} alt="" draggable={false} />
                ) : (
                  <CharacterSymbol character={id} size={30} />
                )}
              </span>
              <span>
                <span className={styles.pickerName}>{theme.name}</span>
                <div className={styles.pickerPitch}>“{theme.pickerPitch}”</div>
              </span>
            </button>
          );
        })}
      </div>
      <div className={styles.modeToggleRow} style={{ marginTop: 12 }}>
        <span className={styles.modeToggleLabel}>Chat style</span>
        <button
          type="button"
          className={`${styles.modeToggleBtn} ${mode === "quick" ? styles.modeToggleBtnActive : ""}`}
          onClick={() => onModeChange("quick")}
        >
          Quick
        </button>
        <button
          type="button"
          className={`${styles.modeToggleBtn} ${mode === "talkative" ? styles.modeToggleBtnActive : ""}`}
          onClick={() => onModeChange("talkative")}
        >
          Talkative
        </button>
      </div>
    </div>
  );
}
