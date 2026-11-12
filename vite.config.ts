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

// `base: './'` keeps asset paths relative, so the build works on GitHub Pages
// under any repository name. HashRouter handles client routes.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), securityMeta()],
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
