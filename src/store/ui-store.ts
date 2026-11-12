import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Interface preferences of this viewer (not demo data): kept apart from the data and
 * session stores so "Restablecer demo" does not undo them.
 */
interface UiState {
  /** Side navigation folded to icons. `null` = automatic (folded below 1280 px). */
  navCollapsed: boolean | null;
  /** Mobile navigation drawer open. Not persisted. */
  navDrawerOpen: boolean;
  /** F16: quick search open. Not persisted. */
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  /**
   * D-53: a screen with unsaved changes (the template editor) can hold back actions that leave
   * it without a route change it can block, such as "Ver como". Returns true when it took
   * over: it asks first and calls `proceed` if the person chooses to leave. Not persisted.
   */
  leaveGuard: ((proceed: () => void) => boolean) | null;
  setLeaveGuard: (guard: ((proceed: () => void) => boolean) | null) => void;
  setNavCollapsed: (collapsed: boolean) => void;
  setNavDrawerOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      navCollapsed: null,
      navDrawerOpen: false,
      searchOpen: false,
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      leaveGuard: null,
      setLeaveGuard: (leaveGuard) => set({ leaveGuard }),
      setNavCollapsed: (navCollapsed) => set({ navCollapsed }),
      setNavDrawerOpen: (navDrawerOpen) => set({ navDrawerOpen }),
    }),
    {
      name: 'rumbo-ui',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ navCollapsed }) => ({ navCollapsed }),
    },
  ),
);
