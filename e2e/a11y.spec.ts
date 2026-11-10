import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES } from './pages';

/**
 * CLAUDE.md 2.10: axe without violations on every screen (WCAG 2.2 A and AA rules),
 * at a desktop and a mobile width.
 */
for (const page of PAGES) {
  for (const width of [375, 1280]) {
    test(`${page.id} @ ${width}px has no axe violations`, async ({ page: browserPage }) => {
      await browserPage.setViewportSize({ width, height: 900 });
      await browserPage.goto(page.path);
      await browserPage.locator('h1').first().waitFor();

      const results = await new AxeBuilder({ page: browserPage })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      const summary = results.violations.map(
        (v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
      );
      expect(summary).toEqual([]);
    });
  }

  test(`${page.id} has exactly one h1`, async ({ page: browserPage }) => {
    await browserPage.goto(page.path);
    await browserPage.locator('h1').first().waitFor();
    await expect(browserPage.locator('h1')).toHaveCount(1);
  });
}
