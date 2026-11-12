// Measures the JavaScript each screen downloads on a first load, against a production build
// (`npx vite preview --port 4173 --strictPort`). Usage: node scripts/perf/measure-js.mjs [label]
// Reports raw size, gzip-equivalent size and the largest file per screen (D-131).
import { chromium } from '@playwright/test';
import { gzipSync } from 'node:zlib';
import { signIn } from './demo-session.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';
const PAGES = [
  ['G0 inicio', '#/'],
  ['G1 login', '#/login'],
  ['N1 mi recorrido', '#/me', 'sofia'],
  ['A1 panel', '#/admin', 'carla'],
  ['A6 constructor', '#/admin/templates/tpl-data', 'carla'],
];

const browser = await chromium.launch();
const label = process.argv[2] ?? '';
const kb = (n) => `${Math.round(n / 1024)} kB`;
for (const [name, hash, demo] of PAGES) {
  const context = await browser.newContext();
  const page = await context.newPage();
  if (demo) await signIn(page, BASE, demo);
  // Measure a cold load of the screen: new tab, empty cache, same storage
  const measured = await context.newPage();
  const client = await context.newCDPSession(measured);
  await client.send('Network.setCacheDisabled', { cacheDisabled: true });
  const scripts = new Map();
  measured.on('response', async (response) => {
    if (!response.url().endsWith('.js')) return;
    try {
      scripts.set(response.url(), await response.body());
    } catch {
      /* no body */
    }
  });
  await measured.goto(BASE + hash, { waitUntil: 'networkidle' });
  let raw = 0;
  let gz = 0;
  let largest = 0;
  for (const body of scripts.values()) {
    raw += body.length;
    gz += gzipSync(body).length;
    largest = Math.max(largest, body.length);
  }
  console.log(`${label}\t${name}\t${scripts.size} archivos\t${kb(raw)}\t${kb(gz)} gzip\tmayor ${kb(largest)}`);
  await context.close();
}
await browser.close();
