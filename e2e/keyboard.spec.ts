import { expect, type Page, test } from '@playwright/test';
import { prepareSession } from './pages';

/**
 * RNF-011 (CLAUDE.md 2.10): the main flows done only with the keyboard, in Chromium, Firefox and
 * WebKit (D-131). No clicks: Tab and Shift+Tab move the focus, Enter and Space act, the arrows
 * move inside radio groups and menus, and Escape closes dialogs. Every step checks where the
 * focus is, so a control that cannot be reached with Tab makes the test fail.
 */

/** Accessible name of the focused element (aria-label, its label or its text). */
async function focusedName(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return '';
    const labelled = el.getAttribute('aria-labelledby');
    const byId = labelled
      ? labelled
          .split(' ')
          .map((id) => document.getElementById(id)?.textContent ?? '')
          .join(' ')
      : '';
    const label = (el as HTMLInputElement).labels?.[0]?.textContent ?? '';
    return (el.getAttribute('aria-label') || byId || label || el.textContent || '').replace(/\s+/g, ' ').trim();
  });
}

/** Presses Tab until the focused element's name matches, as a person scanning the page would. */
async function tabTo(page: Page, name: RegExp, { max = 120, back = false, next = false } = {}) {
  // The app may have moved the focus there already (for example, into the first field of a
  // form that just opened); Firefox does not cycle back into the page after its last element.
  // `next` skips the focused element, to reach the next control with the same name.
  if (!next && name.test(await focusedName(page))) return;
  for (let i = 0; i < max; i += 1) {
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
    if (name.test(await focusedName(page))) return;
  }
  throw new Error(`Tab never reached ${name} (last focus: "${await focusedName(page)}")`);
}

test('signs in with email, password and the MFA code, only with the keyboard', async ({ page }) => {
  await page.goto('/#/login');
  await page.locator('h1').waitFor();

  await tabTo(page, /^Iniciar sesión con correo y contraseña$/);
  await page.keyboard.press('Enter');
  await tabTo(page, /^Correo de trabajo/);
  await page.keyboard.type('carla@nortia.demo');
  await tabTo(page, /^Contraseña/);
  // Demo credentials of the spec (CLAUDE.md F0), fictitious
  await page.keyboard.type('Demo.2026!');
  await page.keyboard.press('Enter');

  await expect(page.locator('h1')).toHaveText('Verificación en dos pasos');
  await tabTo(page, /^Código de verificación/);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('246810');
  await page.keyboard.press('Enter');

  // First visit: the privacy notice (G8) is also done with the keyboard
  await expect(page.locator('h1')).toBeVisible();
  for (let step = 0; step < 6 && (await page.url()).includes('/consent'); step += 1) {
    await tabTo(page, /^(Continuar|Aceptar y continuar)$/);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  // The guided welcome closes with Escape and gives the focus back to the page
  const welcome = page.getByRole('dialog');
  if (await welcome.isVisible().catch(() => false)) await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/admin$/);
  await expect(page.locator('h1')).toContainText('Carla');
});

test("completes one of Sofía's tasks from Mi recorrido, only with the keyboard", async ({ page }) => {
  await prepareSession(page, { id: 'kb-n1', path: '/#/me', role: 'hire' });
  await page.goto('/#/me');
  await page.locator('h1').waitFor();

  // One of her own tasks that is not done and not blocked
  const task = await page.evaluate(async () => {
    const { useDataStore } = await import('/src/store/data-store.ts');
    const hire = useDataStore.getState().hires.find((h: { id: string }) => h.id === 'h-sofia');
    const done = new Set(hire.tasks.filter((t: { status: string }) => t.status === 'done').map((t: { id: string }) => t.id));
    const open = hire.tasks.find(
      (t: { owner: string; status: string; dependsOn: string[] }) =>
        t.owner === 'hire' && t.status !== 'done' && t.dependsOn.every((d) => done.has(d)),
    );
    return { id: open.id as string, title: open.title as string };
  });

  // Its row has a "Marcar como hecha" control, reached with Tab in every browser (in Safari the
  // row link itself needs Option+Tab or the "highlight each item" setting)
  await tabTo(page, new RegExp(`^Marcar como hecha: ${task.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await page.keyboard.press('Space');
  // Read what the app saved: an imported store can be another module instance than the app's
  // after the dev server updates a module (INC-022)
  await expect
    .poll(() =>
      page.evaluate((id) => {
        const saved = JSON.parse(window.localStorage.getItem('rumbo-data') ?? '{}');
        const hire = saved.state?.hires?.find((h: { id: string }) => h.id === 'h-sofia');
        return hire?.tasks.find((t: { id: string }) => t.id === id)?.status;
      }, task.id),
    )
    .toBe('done');
});

test('reorders a task with Subir and Bajar in the template builder, only with the keyboard', async ({ page }) => {
  await prepareSession(page, { id: 'kb-a6', path: '/#/admin/templates/tpl-data', role: 'admin' });
  await page.goto('/#/admin/templates/tpl-data');
  await page.locator('h1').waitFor();

  // The first stage with two tasks or more: its second task goes up
  const card = 'li[id^="task-card-"]';
  const stage = page.locator('section').filter({ has: page.locator(`${card} ~ ${card}`) }).first();
  const titles = () => stage.locator(`${card} .line-clamp-2`).allInnerTexts();
  const before = await titles();
  const second = before[1]!;
  const menuName = `Acciones de la tarea ${second}`;
  const escaped = new RegExp(`^${menuName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

  const choose = async (item: string) => {
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();
    // Radix menus: the arrows move between items and Enter chooses
    for (let i = 0; i < 8 && (await focusedName(page)) !== item; i += 1) await page.keyboard.press('ArrowDown');
    expect(await focusedName(page)).toBe(item);
    await page.keyboard.press('Enter');
  };

  await tabTo(page, escaped);
  await choose('Subir');
  await expect.poll(titles).toEqual([second, before[0], ...before.slice(2)]);

  // The focus goes back to the same task's menu, now first in the stage: Bajar returns it
  await expect.poll(() => focusedName(page)).toBe(menuName);
  await choose('Bajar');
  await expect.poll(titles).toEqual(before);
});

test("does Sofía's 30-day check-in as Martín, only with the keyboard", async ({ page }) => {
  await prepareSession(page, { id: 'kb-j3', path: '/#/manager/hires/h-sofia/checkin/day30', role: 'manager' });
  await page.goto('/#/manager/hires/h-sofia/checkin/day30');
  await page.locator('h1').waitFor();

  // Each milestone is a radio group: Tab enters it on "Cumplido", Space chooses it
  const groups = page.locator('form fieldset');
  const milestones = (await groups.count()) >= 3 ? 3 : await groups.count();
  for (let i = 0; i < milestones; i += 1) {
    await tabTo(page, /^Cumplido$/, { next: true });
    await page.keyboard.press('Space');
  }
  await expect(page.locator('form input[type=radio]:checked')).toHaveCount(milestones);

  await tabTo(page, /^Completar check-in$/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/manager\/hires\/h-sofia$/);
});
