import { expect, test } from '@playwright/test';
import { PAGES, prepareSession, WIDTHS } from './pages';

/**
 * CLAUDE.md 2.7: zero horizontal overflow of the page at every width, and no
 * element marked with `data-overflow-container` overflowing its box.
 * Also fails when a text is squeezed into a narrow column, one or two words per line
 * (D-103): a sign that a component lays out by the screen width instead of its container.
 * Saves a full-page screenshot per screen and width in docs/screenshots/.
 */
for (const page of PAGES) {
  for (const width of WIDTHS) {
    test(`${page.id} @ ${width}px has no horizontal overflow`, async ({ page: browserPage }, testInfo) => {
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
        // Squeezed texts: a text box narrower than 5 rem that wraps to 3 lines or more.
        const squeezed = [...document.body.querySelectorAll<HTMLElement>('main *')]
          .filter((el) => {
            const text = [...el.childNodes]
              .filter((n) => n.nodeType === Node.TEXT_NODE)
              .map((n) => n.textContent ?? '')
              .join('')
              .trim();
            if (text.length < 12 || !text.includes(' ')) return false;
            const rect = el.getBoundingClientRect();
            const style = getComputedStyle(el);
            if (!rect.width || style.visibility === 'hidden' || el.closest('.sr-only, [aria-hidden="true"]')) return false;
            const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4;
            return rect.width < 80 && rect.height >= lineHeight * 2.9;
          })
          .slice(0, 5)
          .map((el) => `"${(el.textContent ?? '').trim().slice(0, 30)}" (${Math.round(el.getBoundingClientRect().width)}px)`);
        // Buttons sticking out of their container (D-103): the page does not overflow, but the
        // button crosses the edge of the card that holds it.
        const visible = (el: Element) => {
          const st = getComputedStyle(el);
          return parseFloat(st.borderTopWidth) > 0 || st.backgroundColor !== 'rgba(0, 0, 0, 0)';
        };
        const stickingOut = [...document.body.querySelectorAll<HTMLElement>('main button, main a')]
          .filter((el) => {
            if (!visible(el) || el.closest('[data-overflow-container], .sr-only')) return false;
            const rect = el.getBoundingClientRect();
            if (!rect.width) return false;
            // The nearest bordered box around it (a card or panel)
            let box = el.parentElement;
            while (box && box !== document.body && parseFloat(getComputedStyle(box).borderTopWidth) === 0) {
              box = box.parentElement;
            }
            if (!box || box === document.body) return false;
            const card = box.getBoundingClientRect();
            return rect.right > card.right + 1 || rect.left < card.left - 1;
          })
          .slice(0, 5)
          .map((el) => `"${(el.textContent ?? '').trim().slice(0, 30)}"`);
        return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, overflowing, offenders, squeezed, stickingOut };
      });

      // The screenshots in docs/screenshots/ come from Chromium; Firefox and WebKit only check (D-131).
      const capture = testInfo.project.name === 'chromium';

      // Sections that appear on scroll (G0, D-92) only show once they enter the viewport:
      // scroll through the page first so the full-page capture shows everything.
      if (capture) await browserPage.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo(0, 0);
      });
      await browserPage.waitForTimeout(500);

      // On Windows another process (a viewer, the indexer) can hold the file for a moment:
      // retry the capture before failing (INC-012). The checks above do not depend on it.
      for (let attempt = 1; capture; attempt += 1) {
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
      expect(result.squeezed, 'texts squeezed into a narrow column').toEqual([]);
      expect(result.stickingOut, 'buttons or links crossing the edge of their container').toEqual([]);
    });
  }
}
