import { defineConfig, devices } from '@playwright/test';

/**
 * Captures the Open Graph image and the app icons from /og-card (D-76).
 * Run with `npm run og` after changing the card; the images are committed in public/.
 */
export default defineConfig({
  testDir: '.',
  testMatch: 'capture.spec.ts',
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', reducedMotion: 'reduce', locale: 'es-AR' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], deviceScaleFactor: 1 } }],
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
