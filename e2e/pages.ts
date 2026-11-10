/**
 * Screens checked by the overflow and accessibility tests.
 * Add every new screen here as it is built (one entry per role screen).
 */
export interface CheckedPage {
  /** File-name friendly id, used for screenshots. */
  id: string;
  /** Hash route. */
  path: string;
}

export const PAGES: CheckedPage[] = [
  { id: 'placeholder', path: '/#/' },
  { id: 'not-found', path: '/#/no-existe' },
  { id: 'styleguide', path: '/#/styleguide' },
];

/** CLAUDE.md 2.7: every screen at these widths. */
export const WIDTHS = [320, 375, 768, 1024, 1280, 1440] as const;
