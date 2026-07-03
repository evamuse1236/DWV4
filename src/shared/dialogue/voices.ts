// Real voice clips for the dialogue buddies. Clips are matched to CONTEXT,
// not just mood: a sound only plays on the specific dialogue moments where
// the words genuinely fit. A laugh belongs on a celebration, not a greeting.
// Most moments are intentionally silent — the visual emote burst always
// carries them, and sparse audio stays charming instead of grating.
//
// To add a clip: drop an mp3 in src/assets/buddies/sfx/, import it, and add
// a rule below whose `match` fragments name the line ids it should fire on.

import luffyLaughing1 from "@/assets/buddies/sfx/luffy-laughing-1.mp3";
import luffyLaughing2 from "@/assets/buddies/sfx/luffy-laughing-2.mp3";
import luffyLaughing3 from "@/assets/buddies/sfx/luffy-laughing-3.mp3";
import steveCelebrate1 from "@/assets/buddies/sfx/steve-celebrate-1.mp3";
import type { CharacterId } from "./types";

interface VoiceRule {
  /** Fire when the line id contains ANY of these fragments. */
  match: string[];
  clips: string[];
}

// Line-id fragments for the celebratory beats shared across characters:
// task completed (single/multi/all), goal created, streaks, a goal brought
// back, and starting a new book. These are the "yay!" moments where a laugh
// or a proud "that's great" lands right.
const CELEBRATION = [
  ".created.",
  ".done1.",
  ".donem.",
  ".doneall.",
  ".streak",
  ".dupd.",
  ".imp.",
  ".lib.start.",
];

const VOICE_RULES: Record<CharacterId, VoiceRule[]> = {
  luffy: [
    // Shishishi — the laugh the user confirmed feels right. Celebrations only.
    { match: CELEBRATION, clips: [luffyLaughing1, luffyLaughing2, luffyLaughing3] },
  ],
  steve: [
    // "That's great — proud of ya." Warm, and only on wins.
    { match: CELEBRATION, clips: [steveCelebrate1] },
  ],
  // No clean Percy Jackson clips exist on soundboards yet — Percy stays silent
  // (visual emote still fires). Drop mp3s here + add a rule when sourced.
  percy: [],
};

/** Deterministic clip pick — a given line always sounds the same. */
export function voiceFor(character: CharacterId, lineId: string): string | null {
  for (const rule of VOICE_RULES[character]) {
    if (rule.match.some((fragment) => lineId.includes(fragment))) {
      let hash = 0;
      for (let i = 0; i < lineId.length; i++) hash = (hash * 31 + lineId.charCodeAt(i)) % 100003;
      return rule.clips[hash % rule.clips.length];
    }
  }
  return null;
}

const SOUND_KEY = "dw.buddy.sound";

export function isBuddySoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setBuddySoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
  } catch {
    // ignore
  }
}

let currentClip: HTMLAudioElement | null = null;

/** Play a character voice clip, stopping any clip already speaking. */
export function playVoice(url: string, volume = 0.6) {
  try {
    if (currentClip) {
      currentClip.pause();
      currentClip = null;
    }
    const audio = new Audio(url);
    audio.volume = volume;
    currentClip = audio;
    void audio.play().catch(() => {
      // Autoplay blocked or device muted — the visual emote still carries it.
    });
  } catch {
    // Audio unavailable (very old browser) — silent fallback.
  }
}
