import { expect, test } from '@playwright/test';
import { PAGES, prepareSession } from './pages';

/**
 * RNF-014 (CLAUDE.md 2.1.3 and 2.10): on mobile every control has a touch area of at least
 * 48 × 48 px, even when it looks smaller. The area counts the element, the label around it and
 * the invisible `::after` hit area of the shared `interactive` classes. Measured with a 44 px
 * margin for subpixel rounding. Controls inside a sentence are exempt, as in WCAG 2.5.8.
 */
for (const page of PAGES) {
  test(`${page.id} @ 375px has touch targets of 48 px`, async ({ page: browserPage }) => {
    await browserPage.setViewportSize({ width: 375, height: 812 });
    await prepareSession(browserPage, page);
    await browserPage.goto(page.path);
    await browserPage.locator('h1').first().waitFor();
    await browserPage.evaluate(() => document.fonts.ready);

    const small = await browserPage.evaluate(() => {
      const box = (el: Element): [number, number] => {
        const rect = el.getBoundingClientRect();
        const after = getComputedStyle(el, '::after');
        const on = after.content !== 'none' && after.position === 'absolute';
        const w = on ? Math.max(parseFloat(after.width) || 0, parseFloat(after.minWidth) || 0) : 0;
        const h = on ? parseFloat(after.height) || 0 : 0;
        return [Math.max(rect.width, w), Math.max(rect.height, h)];
      };
      // A link or a reference chip inside a sentence (D-83) is exempt, as in WCAG 2.5.8.
      const inSentence = (el: Element) =>
        [...(el.parentElement?.childNodes ?? [])].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim());
      return [
        ...document.querySelectorAll(
          'a[href], button, input:not([type=hidden]), select, textarea, [role=radio], [role=checkbox], [role=tab]',
        ),
      ]
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          if (!rect.width || !rect.height) return false;
          if (el.closest('.sr-only, [aria-hidden="true"], [data-print-only]') || inSentence(el)) return false;
          let [w, h] = box(el);
          const label = el.closest('label');
          if (label) {
            const [lw, lh] = box(label);
            w = Math.max(w, lw);
            h = Math.max(h, lh);
          }
          return w < 44 || h < 44;
        })
        .slice(0, 8)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const name = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30);
          return `${el.tagName.toLowerCase()} ${Math.round(rect.width)}×${Math.round(rect.height)} "${name}"`;
        });
    });
    expect(small, 'controls with a touch area under 48 px').toEqual([]);
  });
}
