// Lighthouse on the production build (D-131). Start the build first:
//   npm run build && npx vite preview --port 4173 --strictPort
// then: node scripts/perf/lighthouse.mjs
// G0 and G1 are public; N1 and A1 are measured signed in as Sofía and Carla. Chrome is launched
// once with remote debugging: Playwright signs in on it and Lighthouse runs in the same profile,
// so the session stays (storage is not reset between runs).
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { signIn } from './demo-session.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/';
const TARGETS = [
  { id: 'G0', hash: '#/' },
  { id: 'G1', hash: '#/login' },
  { id: 'N1', hash: '#/me', demo: 'sofia' },
  { id: 'A1', hash: '#/admin', demo: 'carla' },
];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

// A persistent profile, so Lighthouse's tabs share the signed-in storage with Playwright's.
const PORT = Number(process.env.LH_PORT ?? 9333);
const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'rumbo-lh-')), {
  args: [`--remote-debugging-port=${PORT}`],
});
const results = [];

for (const target of TARGETS) {
  const page = await context.newPage();
  if (target.demo) await signIn(page, BASE, target.demo);
  else await page.goto(BASE);
  await page.close();
  for (const formFactor of ['mobile', 'desktop']) {
    const flags = { port: PORT, output: 'json', onlyCategories: CATEGORIES, disableStorageReset: true, logLevel: 'error' };
    const run = await lighthouse(BASE + target.hash, flags, formFactor === 'desktop' ? desktopConfig : undefined);
    const lhr = run.lhr;
    const score = (c) => Math.round((lhr.categories[c]?.score ?? 0) * 100);
    const failing = Object.values(lhr.audits)
      .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual')
      .map((a) => `${a.id} (${a.displayValue ?? Math.round(a.score * 100)})`);
    const row = {
      page: target.id,
      formFactor,
      finalUrl: lhr.finalDisplayedUrl,
      performance: score('performance'),
      accessibility: score('accessibility'),
      bestPractices: score('best-practices'),
      seo: score('seo'),
      lcp: lhr.audits['largest-contentful-paint']?.displayValue,
      tbt: lhr.audits['total-blocking-time']?.displayValue,
      cls: lhr.audits['cumulative-layout-shift']?.displayValue,
      failing,
    };
    const issues = lhr.audits['inspector-issues']?.details?.items ?? [];
    if (issues.length) row.inspectorIssues = issues.map((i) => ({ type: i.issueType, items: i.subItems?.items }));
    results.push(row);
    console.log(
      `${row.page}\t${formFactor}\tperf ${row.performance}\ta11y ${row.accessibility}\tbp ${row.bestPractices}\tseo ${row.seo}\tLCP ${row.lcp}\tTBT ${row.tbt}\tCLS ${row.cls}\t${row.finalUrl}`,
    );
    if (failing.length) console.log('   below 90:', failing.join(', '));
    if (row.inspectorIssues) console.log('   issues:', JSON.stringify(row.inspectorIssues));
  }
}

writeFileSync(process.env.LH_OUT ?? 'lighthouse-results.json', JSON.stringify(results, null, 2));
await context.close();
