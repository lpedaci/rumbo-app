import { useSyncExternalStore } from 'react';

export type ToastTone = 'success' | 'info' | 'error';

export interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function push(tone: ToastTone, message: string) {
  // One toast at a time (D-90): a new one replaces the previous, so they never pile up.
  items = [{ id: nextId++, tone, message }];
  emit();
}

/** Show a toast from anywhere. Success messages go in past tense and stay short (2.9). */
export const toast = {
  success: (message: string) => push('success', message),
  info: (message: string) => push('info', message),
  error: (message: string) => push('error', message),
};

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => items,
    () => items,
  );
}
