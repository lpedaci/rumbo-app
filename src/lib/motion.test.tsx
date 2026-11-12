import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useShouldReduceMotion } from './motion';

afterEach(() => {
  delete document.documentElement.dataset.reduceMotion;
});

describe('RNF-015 · Reduce motion', () => {
  it('follows the "Reducir animaciones" preference as soon as it changes', async () => {
    const { result } = renderHook(() => useShouldReduceMotion());
    expect(result.current).toBe(false);
    await act(async () => {
      document.documentElement.dataset.reduceMotion = 'true';
      // The MutationObserver reports on the next microtask
      await Promise.resolve();
    });
    expect(result.current).toBe(true);
  });
});
