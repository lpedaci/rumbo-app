import { useReducedMotion } from 'motion/react';
import { useSyncExternalStore } from 'react';

/** M3 motion tokens mirrored from tokens.css for Motion (seconds). */
export const duration = {
  short: 0.15,
  medium: 0.2,
  long: 0.3,
} as const;

export const easing = {
  standard: [0.2, 0, 0, 1],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
} as const;

export const stagger = 0.04;

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduce-motion'] });
  return () => observer.disconnect();
}

function getAppPreference() {
  return document.documentElement.dataset.reduceMotion === 'true';
}

/**
 * True when the OS asks for reduced motion or the user turned on
 * "Reducir animaciones" (F17, stored as `data-reduce-motion` on <html>).
 * In that case animations fall back to opacity only (CLAUDE.md 2.6).
 */
export function useShouldReduceMotion(): boolean {
  const system = useReducedMotion() ?? false;
  const app = useSyncExternalStore(subscribe, getAppPreference, () => false);
  return system || app;
}
