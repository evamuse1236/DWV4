// No-repeat tracking for dialogue lines, persisted in localStorage.
// Freshness is cosmetic, so localStorage (not Convex) is the right home:
// zero latency, zero DB churn, and a cross-device repeat is harmless.

const MAX_ENTRIES = 300;

interface HistoryData {
  /** lineId -> lastShownAt (ms). Monotonic counter is fine too; we use Date.now(). */
  shown: Record<string, number>;
}

export interface LineHistory {
  recentIds(contextKey: string, limit: number): Set<string>;
  record(contextKey: string, lineId: string): void;
  /** Oldest-first ordering value for tie-breaking when a pool is exhausted. */
  lastShownAt(lineId: string): number;
}

function storageKey(userId: string) {
  return `dw.buddy.lineHistory.${userId}`;
}

function safeRead(key: string): HistoryData {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as HistoryData;
      if (parsed && typeof parsed.shown === "object") return parsed;
    }
  } catch {
    // Corrupt or unavailable storage — start fresh.
  }
  return { shown: {} };
}

function safeWrite(key: string, data: HistoryData) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(data));
  } catch {
    // Storage full/unavailable — history just lives in memory for the session.
  }
}

function prune(data: HistoryData) {
  const entries = Object.entries(data.shown);
  if (entries.length <= MAX_ENTRIES) return;
  entries.sort((a, b) => a[1] - b[1]);
  const excess = entries.length - MAX_ENTRIES;
  for (let i = 0; i < excess; i++) {
    delete data.shown[entries[i][0]];
  }
}

export function createLineHistory(userId: string): LineHistory {
  const key = storageKey(userId);
  const data = safeRead(key);

  return {
    recentIds(contextKey, limit) {
      const prefix = `${contextKey}#`;
      const inKey = Object.entries(data.shown)
        .filter(([id]) => id.startsWith(prefix))
        .sort((a, b) => b[1] - a[1])
        .slice(0, Math.max(0, limit))
        .map(([id]) => id.slice(prefix.length));
      return new Set(inKey);
    },
    record(contextKey, lineId) {
      data.shown[`${contextKey}#${lineId}`] = Date.now();
      prune(data);
      safeWrite(key, data);
    },
    lastShownAt(lineId) {
      let latest = 0;
      for (const [id, at] of Object.entries(data.shown)) {
        if (id.endsWith(`#${lineId}`) && at > latest) latest = at;
      }
      return latest;
    },
  };
}

/** In-memory history for tests or logged-out states. */
export function createMemoryLineHistory(): LineHistory {
  const shown = new Map<string, number>();
  let tick = 0;
  return {
    recentIds(contextKey, limit) {
      const prefix = `${contextKey}#`;
      return new Set(
        [...shown.entries()]
          .filter(([id]) => id.startsWith(prefix))
          .sort((a, b) => b[1] - a[1])
          .slice(0, Math.max(0, limit))
          .map(([id]) => id.slice(prefix.length))
      );
    },
    record(contextKey, lineId) {
      shown.set(`${contextKey}#${lineId}`, ++tick);
    },
    lastShownAt(lineId) {
      let latest = 0;
      for (const [id, at] of shown.entries()) {
        if (id.endsWith(`#${lineId}`) && at > latest) latest = at;
      }
      return latest;
    },
  };
}
