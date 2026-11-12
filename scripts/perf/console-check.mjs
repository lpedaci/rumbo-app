// Opens the main screens of a build and lists console errors and warnings (D-131).
// Local build: npx vite preview --port 4173 --strictPort, then node scripts/perf/console-check.mjs
// Published demo: BASE_URL=https://lpedaci.github.io/rumbo-app/ node scripts/perf/console-check.mjs
// Exits with 1 when there is any error.
import { chromium } from '@playwright/test';
import { signIn } from './demo-session.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';
const PUBLIC = ['#/', '#/login', '#/access-help', '#/design-system'];
const SIGNED_IN = [
  ['sofia', ['#/me', '#/notifications']],
  ['carla', ['#/admin', '#/admin/templates/tpl-data', '#/admin/hires']],
  ['martin', ['#/manager']],
  ['diego', ['#/it/requests', '#/it/security']],
];

const browser = await chromium.launch();
const page = await browser.newPage();
const messages = [];
let where = '';
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') messages.push(`${where}\t${m.type()}\t${m.text().slice(0, 300)}`);
});
page.on('pageerror', (e) => messages.push(`${where}\tpageerror\t${e.message}`));

const visit = async (hash) => {
  where = hash;
  // A full load, as when opening a link (a hash change from outside would trip the editor's blocker)
  await page.goto('about:blank');
  await page.goto(BASE + hash, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
};
for (const hash of PUBLIC) await visit(hash);
for (const [demo, hashes] of SIGNED_IN) {
  where = `sign-in ${demo}`;
  await signIn(page, BASE, demo);
  for (const hash of hashes) await visit(hash);
}
await browser.close();

const visited = PUBLIC.length + SIGNED_IN.reduce((n, [, h]) => n + h.length, 0);
console.log(`${visited} pantallas en ${BASE}`);
console.log(messages.length ? messages.join('\n') : 'Sin errores ni advertencias en la consola');
process.exit(messages.some((m) => m.includes('\terror\t') || m.includes('pageerror')) ? 1 : 0);
