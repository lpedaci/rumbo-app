import { describe, expect, it } from 'vitest';
import css from './tokens.css?raw';

/**
 * Verifies WCAG 2.2 AA contrast for every color pair the system allows
 * (CLAUDE.md 2.1.1 and 2.8). Values are read from tokens.css, the single
 * source of truth, so a change in the palette is checked automatically.
 */
const lightBlock = css.slice(css.indexOf(':root {'), css.indexOf("[data-theme='dark']"));

function token(name: string): string {
  const match = lightBlock.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match?.[1]) throw new Error(`Token --${name} not found`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = 4.5;
const NON_TEXT = 3;

const roles = [
  ['md-sys-color', 'primary'],
  ['md-sys-color', 'secondary'],
  ['md-sys-color', 'tertiary'],
  ['md-sys-color', 'error'],
  ['md-custom-color', 'success'],
  ['md-custom-color', 'warning'],
  ['md-custom-color', 'info'],
] as const;

const textSurfaces = [
  'md-sys-color-surface',
  'md-sys-color-surface-container-lowest',
  'md-sys-color-surface-container',
];

const surfaces = [
  'md-sys-color-surface',
  'md-sys-color-surface-container-lowest',
  'md-sys-color-surface-container',
  'md-sys-color-surface-container-high',
];

describe('color tokens: WCAG 2.2 AA contrast', () => {
  for (const [prefix, role] of roles) {
    it(`${role}: on-${role} text on the base color`, () => {
      expect(contrast(token(`${prefix}-on-${role}`), token(`${prefix}-${role}`))).toBeGreaterThanOrEqual(TEXT);
    });

    it(`${role}: on-${role}-container text on the container`, () => {
      expect(
        contrast(token(`${prefix}-on-${role}-container`), token(`${prefix}-${role}-container`)),
      ).toBeGreaterThanOrEqual(TEXT);
    });

    // Status pills use on-*-container text (D-21); the base color is only used for the pill icon.
    it(`${role}: base color as icon on the container (3:1)`, () => {
      expect(contrast(token(`${prefix}-${role}`), token(`${prefix}-${role}-container`))).toBeGreaterThanOrEqual(
        NON_TEXT,
      );
    });

    // Base colors as text only on the three lightest surfaces; never on surface-container-high (D-21).
    for (const surface of textSurfaces) {
      it(`${role}: base color as text on ${surface}`, () => {
        expect(contrast(token(`${prefix}-${role}`), token(surface))).toBeGreaterThanOrEqual(TEXT);
      });
    }
  }

  for (const surface of surfaces) {
    it(`on-surface and on-surface-variant text on ${surface}`, () => {
      expect(contrast(token('md-sys-color-on-surface'), token(surface))).toBeGreaterThanOrEqual(TEXT);
      expect(contrast(token('md-sys-color-on-surface-variant'), token(surface))).toBeGreaterThanOrEqual(TEXT);
    });

  }

  // Fields and controls always have a surface-container-lowest fill, so the border
  // is measured against that fill and the page surfaces they sit on (D-21).
  for (const surface of textSurfaces) {
    it(`outline (control borders) reaches 3:1 on ${surface}`, () => {
      expect(contrast(token('md-sys-color-outline'), token(surface))).toBeGreaterThanOrEqual(NON_TEXT);
    });
  }

  it('inverse surface (tooltips) keeps text contrast', () => {
    expect(
      contrast(token('md-sys-color-inverse-on-surface'), token('md-sys-color-inverse-surface')),
    ).toBeGreaterThanOrEqual(TEXT);
  });

  it('chart series reach 3:1 against the card surface', () => {
    for (let i = 1; i <= 5; i++) {
      expect(contrast(token(`chart-${i}`), token('md-sys-color-surface-container-lowest'))).toBeGreaterThanOrEqual(
        NON_TEXT,
      );
    }
  });
});
