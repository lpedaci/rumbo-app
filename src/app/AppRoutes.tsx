import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { NotFoundPage } from '@/features/system/NotFoundPage';
import { PlaceholderPage } from '@/features/system/PlaceholderPage';

// Internal style guide: development only (CLAUDE.md 2.8). `import.meta.env.DEV` is
// replaced with `false` in production builds, so the page is never bundled or deployed.
const StyleguidePage = import.meta.env.DEV
  ? lazy(() => import('@/features/styleguide/StyleguidePage').then((m) => ({ default: m.StyleguidePage })))
  : null;

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PlaceholderPage />} />
      {StyleguidePage && (
        <Route
          path="/styleguide"
          element={
            <Suspense fallback={null}>
              <StyleguidePage />
            </Suspense>
          }
        />
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
