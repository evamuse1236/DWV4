import { CHARACTERS } from "@/shared/dialogue";
import type { CharacterId, Expression } from "@/shared/dialogue";
import styles from "@/shared/styles/dialogue.module.css";
import { CharacterSymbol } from "./CharacterSymbol";

const EXPRESSION_CLASS: Record<Expression, string> = {
  neutral: styles.exprNeutral,
  excited: styles.exprExcited,
  thinking: styles.exprThinking,
  proud: styles.exprProud,
  laughing: styles.exprLaughing,
};

interface CharacterPortraitProps {
  character: CharacterId;
  expression: Expression;
}

/**
 * Expression-keyed portrait. Resolution: exact expression image → neutral
 * image → placeholder (accent blob + character symbol with a per-expression
 * motion cue), so the stage feels alive even before art lands.
 */
export function CharacterPortrait({ character, expression }: CharacterPortraitProps) {
  const theme = CHARACTERS[character];
  const src = theme.portraits[expression] ?? theme.portraits.neutral;

  return (
    <div
      className={styles.portrait}
      style={src ? undefined : { background: theme.symbolBg ?? theme.accentBg }}
      aria-hidden="true"
    >
      <div key={expression} className={`${styles.portraitInner} ${EXPRESSION_CLASS[expression]}`}>
        {src ? (
          <img className={styles.portraitImage} src={src} alt="" draggable={false} />
        ) : (
          <span className={styles.portraitSymbol}>
            <CharacterSymbol character={character} size={56} />
          </span>
        )}
      </div>
    </div>
  );
}
