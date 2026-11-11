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
  setNavCollapsed: (collapsed: boolean) => void;
  setNavDrawerOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      navCollapsed: null,
      navDrawerOpen: false,
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
