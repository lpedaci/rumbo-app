import { useCallback } from 'react';

/**
 * Scroll entrance for lists (D-92): returns a ref for an element with `data-stagger`.
 * When it scrolls into view, `data-shown` is set once and the CSS in index.css fades and
 * lifts its children one after the other (50 ms apart). Lists keep their semantics because
 * the children are not wrapped. Without IntersectionObserver the content shows at once;
 * with reduced motion the global rules cut the transition to nothing (2.6).
 */
export function useRevealOnce<T extends HTMLElement>() {
  return useCallback((node: T | null) => {
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      node.dataset.shown = '';
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          node.dataset.shown = '';
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
  }, []);
}
