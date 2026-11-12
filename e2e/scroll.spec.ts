import { expect, test } from '@playwright/test';
import { prepareSession } from './pages';

test.use({ viewport: { width: 1280, height: 720 } });

test('a new screen opens from the top, not where the previous one was scrolled (D-138)', async ({ page }) => {
  await prepareSession(page, { id: 'scroll-a9', path: '/#/admin/people', role: 'admin' });
  await page.goto('/#/admin/people');
  await page.locator('h1').waitFor();

  // Down to the end of the list, then open the last person's record
  const last = page.getByRole('link', { name: /Valeria Ortiz/ });
  await last.scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
  await last.click();

  await expect(page).toHaveURL(/#\/admin\/people\/p-valeria$/);
  await page.locator('h1').waitFor();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
