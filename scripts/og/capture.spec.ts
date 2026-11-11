import { expect, test } from '@playwright/test';

test('captures the Open Graph image and the app icons', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1400 });
  await page.goto('/#/og-card');
  const card = page.locator('[data-og-card]');
  await expect(card).toBeVisible();
  // Fonts and avatar photos have to be ready before the capture.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await card.screenshot({ path: 'public/og-image.png' });

  const icon = page.locator('[data-app-icon]');
  await icon.screenshot({ path: 'public/icon-512.png' });
  // 180 px touch icon: same element, scaled by the browser.
  await page.setViewportSize({ width: 1400, height: 1400 });
  await icon.evaluate((el) => {
    (el as HTMLElement).style.transform = 'scale(0.3515625)';
    (el as HTMLElement).style.transformOrigin = 'top left';
  });
  const box = await icon.boundingBox();
  await page.screenshot({
    path: 'public/apple-touch-icon.png',
    clip: { x: box!.x, y: box!.y, width: 180, height: 180 },
  });
});
