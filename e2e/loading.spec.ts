import { expect, test } from '@playwright/test';
import { prepareSession } from './pages';

test.use({ viewport: { width: 1280, height: 800 } });

test('each screen first shows the skeleton of its page template, once per session (D-140)', async ({ page }) => {
  await prepareSession(page, { id: 'loading-a2', path: '/#/admin/hires', role: 'admin' });
  await page.goto('/#/admin/hires');

  // Listing: the skeleton, announced as a status, then the screen
  const listSkeleton = page.locator('[data-page-skeleton="list"]');
  await expect(listSkeleton).toBeVisible();
  await expect(listSkeleton).toHaveAttribute('role', 'status');
  await expect(page.locator('h1')).toHaveText('Ingresos');
  await expect(listSkeleton).toHaveCount(0);

  // A record: its own skeleton
  await page.locator('a[href^="#/admin/hires/h-"]').first().click();
  await expect(page.locator('[data-page-skeleton="detail"]')).toBeVisible();
  await page.locator('h1').waitFor();
  await expect(page.locator('[data-page-skeleton]')).toHaveCount(0);

  // Back to a screen already seen in this session: it opens at once
  await page.goBack();
  await expect(page.locator('h1')).toHaveText('Ingresos');
  await expect(page.locator('[data-page-skeleton]')).toHaveCount(0);
});
