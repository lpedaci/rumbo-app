/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/**
 * Content Security Policy (CLAUDE.md 8.2): only the app's own resources. Injected in the
 * production build as a <meta> tag (GitHub Pages cannot send headers). Not in development,
 * where Vite needs inline scripts for hot reload. `frame-ancestors` and `X-Frame-Options`
 * only work as HTTP headers: they are documented in docs/security.md for production.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  // Scripts stay strict (that is what stops XSS). Inline styles are allowed because Radix
  // (react-remove-scroll) and Motion insert <style> blocks with runtime values and Recharts
  // measures labels with style attributes; a hash cannot cover changing values and a fixed
  // nonce in a static <meta> would protect nothing. No external origin is allowed (D-95).
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

function securityMeta(): Plugin {
  return {
    name: 'rumbo-security-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
            injectTo: 'head-prepend',
          },
          {
            tag: 'meta',
            attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' },
            injectTo: 'head-prepend',
          },
        ],
      };
    },
  };
}

// Heavy libraries in their own chunks (D-131): each screen downloads only what it uses, and
// the shared core stays under the 500 kB warning. Each group also takes the packages its
// libraries depend on (Rolldown's default; Recharts' CommonJS dependencies break if they are
// split apart), so the shared ones (React, Radix, clsx) are claimed first by groups with a
// higher priority. Otherwise they land in vendor-charts and every screen downloads the charts.
const VENDOR_GROUPS: { name: string; test: RegExp; priority: number }[] = [
  {
    name: 'vendor-react',
    test: /node_modules[\\/](react|react-dom|scheduler|react-router|zustand|cookie|set-cookie-parser)[\\/]/,
    priority: 50,
  },
  {
    name: 'vendor-ui',
    test: /node_modules[\\/](radix-ui|@radix-ui[\\/][^\\/]+|@floating-ui[\\/][^\\/]+|tailwind-merge|clsx|class-variance-authority|react-remove-scroll[^\\/]*|aria-hidden|use-callback-ref|use-sidecar|detect-node-es|get-nonce|tslib)[\\/]/,
    priority: 40,
  },
  { name: 'vendor-forms', test: /node_modules[\\/](zod|react-hook-form|@hookform)[\\/]/, priority: 30 },
  { name: 'vendor-dates', test: /node_modules[\\/]date-fns[\\/]/, priority: 30 },
  { name: 'vendor-i18n', test: /node_modules[\\/](i18next|react-i18next)[\\/]/, priority: 30 },
  { name: 'vendor-motion', test: /node_modules[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/, priority: 20 },
  { name: 'vendor-dnd', test: /node_modules[\\/]@dnd-kit[\\/]/, priority: 15 },
  { name: 'vendor-charts', test: /node_modules[\\/](recharts|recharts-scale|d3-[^\\/]+|victory-vendor)[\\/]/, priority: 10 },
];

// `base: './'` keeps asset paths relative, so the build works on GitHub Pages
// under any repository name. HashRouter handles client routes.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), securityMeta()],
  build: {
    rolldownOptions: {
      output: { codeSplitting: { groups: VENDOR_GROUPS } },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Only tokens.css is processed in tests (read as ?raw by the contrast test).
    css: { include: [/tokens\.css/] },
    // Some tests render the whole app; with every file in parallel they can pass 5 s (INC-027).
    testTimeout: 15000,
  },
});
