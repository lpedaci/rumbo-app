import { expect, test } from '@playwright/test';
import { PAGES, prepareSession, WIDTHS } from './pages';

/**
 * CLAUDE.md 2.7: zero horizontal overflow of the page at every width, and no
 * element marked with `data-overflow-container` overflowing its box.
 * Saves a full-page screenshot per screen and width in docs/screenshots/.
 */
for (const page of PAGES) {
  for (const width of WIDTHS) {
    test(`${page.id} @ ${width}px has no horizontal overflow`, async ({ page: browserPage }) => {
      await browserPage.setViewportSize({ width, height: 900 });
      await prepareSession(browserPage, page);
      await browserPage.goto(page.path);
      await browserPage.locator('h1').first().waitFor();
      await browserPage.evaluate(() => document.fonts.ready);

      const result = await browserPage.evaluate(() => {
        const root = document.documentElement;
        const overflowing = [...document.querySelectorAll<HTMLElement>('[data-overflow-container]')]
          .filter((el) => el.scrollWidth > el.clientWidth + 1)
          .map((el) => el.dataset.overflowContainer || el.tagName);
        // Offenders: elements wider than the viewport, to make failures easy to fix.
        const offenders = [...document.body.querySelectorAll<HTMLElement>('*')]
          .filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.right > root.clientWidth + 1 && getComputedStyle(el).position !== 'fixed';
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join('.')}`);
        return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, overflowing, offenders };
      });

      // Sections that appear on scroll (G0, D-92) only show once they enter the viewport:
      // scroll through the page first so the full-page capture shows everything.
      await browserPage.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo(0, 0);
      });
      await browserPage.waitForTimeout(500);

      // On Windows another process (a viewer, the indexer) can hold the file for a moment:
      // retry the capture before failing (INC-012). The checks above do not depend on it.
      for (let attempt = 1; ; attempt += 1) {
        try {
          await browserPage.screenshot({
            path: `docs/screenshots/${page.id}-${width}.jpg`,
            fullPage: true,
            type: 'jpeg',
            quality: 70,
          });
          break;
        } catch (error) {
          if (attempt >= 3) throw error;
          await browserPage.waitForTimeout(300 * attempt);
        }
      }

      expect(result.scrollWidth, `page overflows; first offenders: ${result.offenders.join(', ')}`).toBeLessThanOrEqual(
        result.clientWidth,
      );
      expect(result.overflowing, 'marked containers overflow').toEqual([]);
    });
  }
}
