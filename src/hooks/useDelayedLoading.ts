import { useState, useEffect } from "react";

/**
 * Hook that delays showing a loading state to prevent "flash" of skeletons.
 *
 * Problem: When data loads quickly (~150ms), showing a skeleton creates a
 * jarring flash that makes the UI feel slower than it actually is.
 *
 * Solution: Only show the loading state (skeleton) if loading takes longer
 * than a threshold (default 200ms). If data arrives before the threshold,
 * the skeleton is never shown.
 *
 * @param isLoading - Whether data is currently loading (e.g., query === undefined)
 * @param delay - Milliseconds to wait before showing loading state (default: 200)
 * @returns boolean - Whether to show the loading skeleton
 *
 * @example
 * ```tsx
 * const data = useQuery(api.myData.get);
 * const showSkeleton = useDelayedLoading(data === undefined);
 *
 * if (showSkeleton) {
 *   return <MySkeleton />;
 * }
 * ```
 */
export function useDelayedLoading(isLoading: boolean, delay: number = 200): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    // If not loading, immediately hide the skeleton
    if (!isLoading) {
      setShowLoading(false);
      return;
    }

    // If loading, wait for the delay before showing skeleton
    const timer = setTimeout(() => {
      setShowLoading(true);
    }, delay);

    // Clean up timer if loading finishes before delay
    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  // Only show loading state if BOTH:
  // 1. Data is actually loading
  // 2. The delay threshold has passed
  return isLoading && showLoading;
}

export default useDelayedLoading;
