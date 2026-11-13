import { expect, test } from '@playwright/test';
import { prepareSession } from '../../e2e/pages';

// The three small screens of the G0 hero and the share image (D-122, D-139): the real homes of
// Sofía, Carla and Martín, captured from the app so they never fall behind it. They run first,
// because the Open Graph card and the README hero use them.
for (const [file, path, role] of [
  ['hero-hire', '/#/me', 'hire'],
  ['hero-hr', '/#/admin', 'admin'],
  ['hero-manager', '/#/manager', 'manager'],
] as const) {
  test(`captures the G0 hero screen ${file}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Morning of the demo day, so the greeting reads "Buenos días" whenever this runs
    await page.clock.setFixedTime(new Date('2026-11-10T10:00:00'));
    await prepareSession(page, { id: file, path, role });
    await page.goto(path);
    await page.locator('h1').first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `src/assets/home/${file}.jpg`, type: 'jpeg', quality: 82 });
  });
}

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

// README hero (D-98): the first screen of G0 once everything has come in, never a full page
// (sections that appear on scroll would still be hidden).
test('captures the README hero', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.locator('h1').first().waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'docs/readme/hero.jpg', type: 'jpeg', quality: 85 });
});

// Architecture figures of the design system site (D-98), exported for the README and
// docs/design-system.md: drawn with the system's own tokens, never auto-laid-out diagrams.
test('captures the architecture figures', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#/design-system');
  await page.locator('[data-figure="tokens"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  for (const [name, file] of [
    ['tokens', 'token-tiers'],
    ['layers', 'app-layers'],
  ]) {
    const figure = page.locator(`[data-figure="${name}"]`);
    await figure.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await figure.screenshot({ path: `docs/readme/${file}.png` });
  }
});

// Wireflows of docs/flows.md (D-100): real screenshots joined by the action that leads on.
test('captures the wireflows', async ({ page }) => {
  await page.setViewportSize({ width: 2600, height: 1200 });
  await page.goto('/#/wireflows');
  await page.locator('[data-wireflow="login"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  for (const key of ['login', 'journey', 'template']) {
    await page.locator(`[data-wireflow="${key}"]`).screenshot({ path: `docs/wireflows/${key}.png` });
  }
});
