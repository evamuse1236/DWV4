import { useEffect, useRef, useState } from "react";

const TICK_MS = 33;

/**
 * Reveals `text` character by character. Restarts whenever `resetKey`
 * changes (pass the line id). `skip()` completes the reveal instantly —
 * tap-to-skip, Hades-style.
 *
 * Uses setInterval (not requestAnimationFrame) so the reveal still
 * progresses when the tab is backgrounded or the renderer throttles
 * animation frames; the count is computed from elapsed wall time, so
 * a slow timer just means chunkier (never slower) reveals.
 */
export function useTypewriter(
  text: string,
  resetKey: string,
  charsPerSecond = 45
): { visible: string; done: boolean; skip: () => void } {
  const [count, setCount] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setCount(0);
    if (text.length === 0) return;
    const startedAt = Date.now();

    timerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const next = Math.floor(elapsed * charsPerSecond);
      if (next >= text.length) {
        setCount(text.length);
        if (timerRef.current !== null) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      setCount(next);
    }, TICK_MS);

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [resetKey, text, charsPerSecond]);

  const skip = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCount(text.length);
  };

  return {
    visible: text.slice(0, count),
    done: count >= text.length,
    skip,
  };
}
