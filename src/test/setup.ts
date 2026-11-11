import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@/app/i18n';

// Screens load on demand (route-level code splitting, RNF-005): under a full, busy test run the
// first import can take more than the default 1 s of findBy*, so wait up to 5 s (INC-019).
configure({ asyncUtilTimeout: 5000 });

afterEach(() => {
  cleanup();
});

// jsdom has no IntersectionObserver; Motion's whileInView needs one (G0 entrance, D-74).
// Every element is reported as visible right away, so revealed content is in the document.
class TestIntersectionObserver {
  private readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback(
      [{ isIntersecting: true, target, intersectionRatio: 1 } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
if (!('IntersectionObserver' in globalThis)) {
  Object.assign(globalThis, { IntersectionObserver: TestIntersectionObserver });
}

// jsdom has no ResizeObserver; Recharts' ResponsiveContainer needs one (A1 charts, step 9).
class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (!('ResizeObserver' in globalThis)) {
  Object.assign(globalThis, { ResizeObserver: TestResizeObserver });
}
