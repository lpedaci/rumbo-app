import { expect, test } from '@playwright/test';
import { PAGES, prepareSession } from './pages';

/**
 * CLAUDE.md 2.1.3 (RNF-054): one filled button per visible region. A filled button is a button
 * or link with the `primary` background (the filled variant); the navigation's active item is
 * not a button and is left out. A region is the nearest dialog, card, form, section or page
 * header around it; the page itself when there is none. Checked on every screen at desktop and
 * phone widths, where the layout can bring regions together (D-131).
 */
// The design system pages show every button variant side by side on purpose.
const SPECIMENS = new Set(['styleguide', 'ds-site']);

for (const page of PAGES.filter((p) => !SPECIMENS.has(p.id))) {
  for (const width of [375, 1280]) {
    test(`${page.id} @ ${width}px has one filled button per region`, async ({ page: browserPage }) => {
      await browserPage.setViewportSize({ width, height: 900 });
      await prepareSession(browserPage, page);
      await browserPage.goto(page.path);
      await browserPage.locator('h1').first().waitFor();

      const crowded = await browserPage.evaluate(() => {
        const primary = getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-primary').trim();
        const probe = document.createElement('div');
        probe.style.color = primary;
        document.body.append(probe);
        const primaryRgb = getComputedStyle(probe).color;
        probe.remove();

        const visible = (el: Element) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && !el.closest('[aria-hidden="true"], .sr-only');
        };
        const isCard = (el: Element) => {
          const style = getComputedStyle(el);
          return parseFloat(style.borderTopWidth) > 0 && parseFloat(style.borderTopLeftRadius) >= 8;
        };
        const regionOf = (el: Element): Element => {
          let node = el.parentElement;
          while (node && node !== document.body) {
            if (node.matches('[role="dialog"], [role="alertdialog"], form, section, header, footer, aside') || isCard(node)) {
              return node;
            }
            node = node.parentElement;
          }
          return document.body;
        };
        const label = (el: Element) => {
          const heading = el.querySelector('h1, h2, h3, legend');
          return `${el.tagName.toLowerCase()}${heading ? ` "${heading.textContent?.trim().slice(0, 40)}"` : ''}`;
        };

        const filled = [...document.querySelectorAll('button, a')].filter(
          (el) => visible(el) && !el.closest('nav') && getComputedStyle(el).backgroundColor === primaryRgb,
        );
        const byRegion = new Map<Element, string[]>();
        for (const el of filled) {
          const region = regionOf(el);
          byRegion.set(region, [...(byRegion.get(region) ?? []), (el.textContent ?? '').trim().slice(0, 30)]);
        }
        return [...byRegion.entries()]
          .filter(([, buttons]) => buttons.length > 1)
          .map(([region, buttons]) => `${label(region)}: ${buttons.join(' | ')}`);
      });
      expect(crowded, 'regions with more than one filled button').toEqual([]);
    });
  }
}
