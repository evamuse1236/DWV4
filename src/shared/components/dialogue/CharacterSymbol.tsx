import type { CharacterId } from "@/shared/dialogue";
import { CHARACTERS } from "@/shared/dialogue";

/**
 * Luffy's flag: the Straw Hat Jolly Roger — white skull and crossbones
 * wearing the hat, drawn inline so it's crisp on the black blob at any
 * size (the 🏴‍☠️ emoji rendered as an ugly purple flag on Windows).
 */
function StrawHatJollyRoger({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* crossbones */}
      <g stroke="#FFFFFF" strokeWidth={6.5} strokeLinecap="round">
        <path d="M13 24 L51 52" />
        <path d="M51 24 L13 52" />
      </g>
      {/* skull */}
      <ellipse cx="32" cy="30" rx="14.5" ry="13.5" fill="#FFFFFF" />
      <rect x="25" y="40" width="14" height="8" rx="3" fill="#FFFFFF" />
      {/* eyes + nose */}
      <circle cx="26.2" cy="30" r="3.1" fill="#111111" />
      <circle cx="37.8" cy="30" r="3.1" fill="#111111" />
      <path d="M32 34.2 L29.9 38 L34.1 38 Z" fill="#111111" />
      {/* teeth */}
      <g stroke="#111111" strokeWidth={1.4}>
        <path d="M29.5 41.5 V47" />
        <path d="M32 41.5 V47.5" />
        <path d="M34.5 41.5 V47" />
      </g>
      {/* the straw hat */}
      <path d="M23 15 a9 9 0 0 1 18 0 v3 H23 Z" fill="#E9C46A" />
      <rect x="23" y="14.5" width="18" height="3.5" fill="#C0392B" />
      <ellipse cx="32" cy="18.5" rx="17" ry="3.6" fill="#E9C46A" />
    </svg>
  );
}

interface CharacterSymbolProps {
  character: CharacterId;
  /** Pixel size of the rendered glyph. */
  size: number;
}

/** Per-character glyph used on the blob, portrait placeholder, picker, bark. */
export function CharacterSymbol({ character, size }: CharacterSymbolProps) {
  if (character === "luffy") {
    return <StrawHatJollyRoger size={size} />;
  }
  return (
    <span style={{ fontSize: size * 0.82, lineHeight: 1 }} aria-hidden="true">
      {CHARACTERS[character].symbol}
    </span>
  );
}
