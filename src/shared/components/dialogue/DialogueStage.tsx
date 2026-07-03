import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import {
  CHARACTERS,
  emoteFor,
  isBuddySoundEnabled,
  playVoice,
  setBuddySoundEnabled,
  voiceFor,
} from "@/shared/dialogue";
import type { BuddyMode, CharacterId, ResolvedLine } from "@/shared/dialogue";
import styles from "@/shared/styles/dialogue.module.css";
import { CharacterPortrait } from "./CharacterPortrait";
import { useTypewriter } from "./useTypewriter";

const UNPICKED_THEME = {
  name: "Your Buddy",
  tagline: "Choose a companion",
  accent: "#a8c5b5",
  accentBg: "#e6efe8",
  accentInk: "#3c4a41",
};

interface DialogueStageProps {
  /** null renders a neutral stage (first-run BuddyPicker). */
  character: CharacterId | null;
  open: boolean;
  onClose: () => void;
  /** The line the character is currently speaking. */
  line: ResolvedLine | null;
  /** Ghosted previous line shown above the current one. */
  ghostLine?: string | null;
  mode: BuddyMode;
  onModeToggle?: () => void;
  /** Tap the nameplate to open the BuddyPicker. */
  onNameplateClick?: () => void;
  /** Everything below the speech: choices, bubbles, cards, input. */
  children?: ReactNode;
  /** Reveal children immediately instead of waiting for the typewriter. */
  revealChildrenEarly?: boolean;
  /** Fires once when the current line finishes typing (or is skipped). */
  onLineDone?: (lineId: string) => void;
  "data-testid"?: string;
}

/**
 * The Hades-style dialogue stage: portrait breaking the top edge, letterpress
 * nameplate, one typewriter line at a time (tap to skip), and a content slot
 * that fades in when the character finishes speaking.
 */
export function DialogueStage({
  character,
  open,
  onClose,
  line,
  ghostLine,
  mode,
  onModeToggle,
  onNameplateClick,
  children,
  revealChildrenEarly = false,
  onLineDone,
  "data-testid": testId,
}: DialogueStageProps) {
  const theme = character ? CHARACTERS[character] : UNPICKED_THEME;
  const text = line?.text ?? "";
  const { visible, done, skip } = useTypewriter(
    text,
    line?.id ?? "empty",
    mode === "quick" ? 70 : 48
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (done && line && onLineDone) onLineDone(line.id);

  }, [done, line?.id]);

  // Real voice clip alongside the visual emote burst — one per line.
  const [soundOn, setSoundOn] = useState(isBuddySoundEnabled);
  useEffect(() => {
    if (!open || !soundOn || !character || !line) return;
    const clip = voiceFor(character, line.id);
    if (clip) playVoice(clip);

  }, [open, character, line?.id]);

  if (!open) return null;

  const accentVars = {
    "--buddy-accent": theme.accent,
    "--buddy-accent-bg": theme.accentBg,
    "--buddy-ink": theme.accentInk,
  } as CSSProperties;

  const showChildren = revealChildrenEarly || done || !line;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <section
        className={styles.stage}
        style={accentVars}
        role="dialog"
        aria-label={`Talking with ${theme.name}`}
        data-testid={testId}
      >
        {character && (
          <div className={styles.portraitSlot}>
            <CharacterPortrait character={character} expression={line?.expression ?? "neutral"} />
            {line && (
              // Visual-novel style one-word "voice" burst — retriggers per line.
              <span key={line.id} className={styles.emoteBurst} aria-hidden="true">
                {emoteFor(character, line.expression, line.id)}
              </span>
            )}
          </div>
        )}

        <header className={styles.header} style={character ? undefined : { paddingLeft: 26 }}>
          <button
            type="button"
            className={styles.nameplate}
            onClick={onNameplateClick}
            disabled={!onNameplateClick}
            aria-label={`Change buddy (currently ${theme.name})`}
          >
            <span className={styles.characterName}>{theme.name}</span>
            <span className={styles.tagline}>{theme.tagline}</span>
          </button>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                setBuddySoundEnabled(next);
              }}
              aria-label={soundOn ? "Mute character voice" : "Unmute character voice"}
              title={soundOn ? "Voice on" : "Voice off"}
            >
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
            {onModeToggle && (
              <button
                type="button"
                className={styles.modeChip}
                onClick={onModeToggle}
                title="Switch between quick and talkative mode"
              >
                {mode === "quick" ? "Quick" : "Talkative"}
              </button>
            )}
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </header>

        <div
          className={styles.speech}
          onClick={() => {
            if (!done) skip();
          }}
        >
          {ghostLine ? <p className={styles.ghostLine}>{ghostLine}</p> : null}
          <p className={styles.currentLine} aria-live="polite">
            {visible}
            {!done && <span className={styles.caret} />}
          </p>
          {!done && text.length > 40 && <div className={styles.skipHint}>tap to skip</div>}
        </div>

        <div className={`${styles.slot} ${showChildren ? "" : styles.slotWaiting}`}>
          {children}
        </div>
      </section>
    </>
  );
}
