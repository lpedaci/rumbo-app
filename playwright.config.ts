import { defineConfig, devices } from '@playwright/test';

/**
 * Overflow, touch target, accessibility and keyboard checks (CLAUDE.md 2.7 and 2.10).
 * Runs against its own dev server on port 5180 (never one another project left on 5173)
 * because /styleguide only exists in development.
 * Run before every review: `npm run test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5180',
    // Stable screenshots: Motion and CSS animations collapse to their end state.
    reducedMotion: 'reduce',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
  },
  // Chromium runs every check and takes the screenshots. Firefox and WebKit (Safari's engine)
  // run the overflow test and the main flows with the keyboard (D-131). Edge uses Chromium.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testMatch: /(overflow|keyboard)\.spec\.ts/ },
    { name: 'webkit', use: { ...devices['Desktop Safari'] }, testMatch: /(overflow|keyboard)\.spec\.ts/ },
  ],
  webServer: {
    command: 'npm run dev -- --port 5180 --strictPort',
    url: 'http://localhost:5180',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
