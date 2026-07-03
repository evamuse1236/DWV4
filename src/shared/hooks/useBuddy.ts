import { useCallback, useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { BuddyMode, CharacterId } from "@/shared/dialogue";

const PREF_KEY = "dw.buddy.pref";

interface StoredPref {
  character?: CharacterId;
  mode?: BuddyMode;
}

function readStoredPref(): StoredPref {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return JSON.parse(raw) as StoredPref;
  } catch {
    // ignore
  }
  return {};
}

function writeStoredPref(pref: StoredPref) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(pref));
  } catch {
    // ignore
  }
}

export interface BuddyState {
  /** null until the kid picks a character (BuddyPicker should open). */
  character: CharacterId | null;
  mode: BuddyMode;
  setCharacter: (character: CharacterId) => void;
  setMode: (mode: BuddyMode) => void;
}

/**
 * The kid's chosen dialogue buddy. Convex is the source of truth
 * (follows the kid across devices); localStorage mirrors it for an
 * instant first paint before the auth query resolves.
 */
export function useBuddy(): BuddyState {
  const { user, token } = useAuth();
  const setBuddyPreferences = useMutation(api.users.setBuddyPreferences);

  const [local, setLocal] = useState<StoredPref>(() => readStoredPref());

  // Server value wins once it arrives; keep the mirror in sync.
  useEffect(() => {
    if (!user) return;
    const server: StoredPref = {
      character: user.buddyCharacter,
      mode: user.buddyMode,
    };
    if (server.character !== local.character || server.mode !== local.mode) {
      if (server.character || server.mode) {
        setLocal((prev) => {
          const next = {
            character: server.character ?? prev.character,
            mode: server.mode ?? prev.mode,
          };
          writeStoredPref(next);
          return next;
        });
      }
    }
     
  }, [user?.buddyCharacter, user?.buddyMode]);

  const setCharacter = useCallback(
    (character: CharacterId) => {
      setLocal((prev) => {
        const next = { ...prev, character };
        writeStoredPref(next);
        return next;
      });
      if (token) {
        void setBuddyPreferences({ token, buddyCharacter: character }).catch(() => {
          // Local mirror keeps working; server sync retries next change.
        });
      }
    },
    [token, setBuddyPreferences]
  );

  const setMode = useCallback(
    (mode: BuddyMode) => {
      setLocal((prev) => {
        const next = { ...prev, mode };
        writeStoredPref(next);
        return next;
      });
      if (token) {
        void setBuddyPreferences({ token, buddyMode: mode }).catch(() => {
          // Non-fatal; localStorage mirror still applies.
        });
      }
    },
    [token, setBuddyPreferences]
  );

  return {
    character: local.character ?? null,
    mode: local.mode ?? "quick",
    setCharacter,
    setMode,
  };
}
