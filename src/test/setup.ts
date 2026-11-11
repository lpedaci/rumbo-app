import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@/app/i18n';

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
