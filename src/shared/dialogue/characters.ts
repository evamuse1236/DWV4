import type { CharacterId, Expression } from "./types";

export interface CharacterTheme {
  name: string;
  /** Nameplate subtitle shown under the character name. */
  tagline: string;
  /** Primary accent (borders, nameplate, choice hover). */
  accent: string;
  /** Soft background tint (portrait placeholder, stage trim). */
  accentBg: string;
  /** Deep ink shade for text on accentBg surfaces. */
  accentInk: string;
  /** Blob gradient for the minimized state. */
  blobGradient: string;
  /** Placeholder glyph shown until portrait art lands. */
  symbol: string;
  /**
   * Background for symbol surfaces (portrait placeholder, picker, bark).
   * Defaults to accentBg; Luffy uses flag-black so the white Jolly Roger
   * reads like the actual Straw Hat flag.
   */
  symbolBg?: string;
  /** One-line pitch each character speaks on the BuddyPicker. */
  pickerPitch: string;
  /**
   * Portrait image URLs keyed by expression. EMPTY until art is supplied —
   * drop files into src/assets/buddies/ and reference them here; nothing
   * else in the system needs to change.
   */
  portraits: Partial<Record<Expression, string>>;
}

export const CHARACTER_IDS: CharacterId[] = ["luffy", "steve", "percy"];

export const CHARACTERS: Record<CharacterId, CharacterTheme> = {
  luffy: {
    name: "Luffy",
    tagline: "Kaizoku-ou ni ore wa naru!",
    accent: "#C0392B",
    accentBg: "#F2DCC3",
    accentInk: "#6E2318",
    // Flag-black blob: the white Jolly Roger sits on it like the real flag.
    blobGradient:
      "radial-gradient(circle at 30% 30%, #3d3733, #16130f, #2a2521)",
    symbol: "🏴‍☠️",
    symbolBg: "#16130f",
    pickerPitch: "Oi! Pick me! Ore wa Monkey D. Luffy! (I'm Monkey D. Luffy!) We'll conquer your whole list — then MEAT!",
    portraits: {},
  },
  steve: {
    name: "Steve",
    tagline: "World's Best Babysitter",
    accent: "#0F766E",
    accentBg: "#CFE8E4",
    accentInk: "#0B4740",
    blobGradient:
      "radial-gradient(circle at 30% 30%, #9adbd2, #0F766E, #cfe8e4)",
    symbol: "🍦",
    pickerPitch: "Hey. I've kept six kids alive through literal monsters. Your homework? Please. Also — great hair.",
    portraits: {},
  },
  percy: {
    name: "Percy",
    tagline: "Son of Poseidon",
    accent: "#2E6E8E",
    accentBg: "#D6E4E8",
    accentInk: "#1B4358",
    blobGradient:
      "radial-gradient(circle at 30% 30%, #a8cbd8, #2E6E8E, #d6e4e8)",
    symbol: "🔱",
    pickerPitch: "I've survived three prophecies and Mrs. Dodds. Your to-do list? Easy quest.",
    portraits: {},
  },
};

/**
 * Visual-novel style one/two-word emotes — a tiny "voiced" burst that pops
 * near the portrait when a line starts. Keyed by expression so the emote
 * always matches the line's mood. Luffy's are romaji, like the anime.
 */
export const EMOTES: Record<CharacterId, Record<Expression, string[]>> = {
  luffy: {
    neutral: ["Na~", "Yosh.", "Hm!"],
    excited: ["Yosha!!", "Sugee!!", "Ikuzo!!", "Oooo!!"],
    thinking: ["Nnn...?", "Hmmm...", "Eeeh?"],
    proud: ["Yosha!", "Heh!", "Un un!"],
    laughing: ["Shishishi!", "Hehe!", "Shishi!"],
  },
  steve: {
    neutral: ["Okay.", "Alright.", "So."],
    excited: ["Let's GO.", "Yes!", "Boom."],
    thinking: ["Uhh...", "Hold on.", "Wait—"],
    proud: ["Nice.", "There it is.", "Nailed it."],
    laughing: ["Ha!", "Pfft.", "Oh my god."],
  },
  percy: {
    neutral: ["So.", "Right.", "Okay."],
    excited: ["Oh, sweet!", "Yes!", "Whoa!"],
    thinking: ["Hmm.", "Hold up.", "Uh..."],
    proud: ["Nice.", "There we go.", "Ha—nailed it."],
    laughing: ["Ha!", "Styx.", "Heh."],
  },
};

/** Deterministic emote pick so a given line always bursts the same word. */
export function emoteFor(character: CharacterId, expression: Expression, lineId: string): string {
  const pool = EMOTES[character][expression];
  let hash = 0;
  for (let i = 0; i < lineId.length; i++) hash = (hash * 31 + lineId.charCodeAt(i)) % 100003;
  return pool[hash % pool.length];
}
