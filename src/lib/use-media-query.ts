import { useSyncExternalStore } from 'react';

const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

/**
 * True while the media query matches (for example the 1280 px desktop breakpoint).
 * Without `matchMedia` (tests, old browsers) it reports `fallback`.
 */
export function useMediaQuery(query: string, fallback = true): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (!hasMatchMedia()) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', callback);
      return () => list.removeEventListener('change', callback);
    },
    () => (hasMatchMedia() ? window.matchMedia(query).matches : fallback),
    () => fallback,
  );
}
