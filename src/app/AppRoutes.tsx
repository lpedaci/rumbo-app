import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { NextCheckinRedirect } from '@/features/journey/NextCheckinRedirect';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { NotFoundPage } from '@/features/system/NotFoundPage';
import { UpcomingPage } from '@/features/system/UpcomingPage';
import { homePath } from '@/lib/permissions';
import { useCurrentUser } from '@/store/session-store';
import { RouteGuard } from './RouteGuard';

// Route-level code splitting (RNF-005): each screen group loads on demand.
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const SsoPage = lazy(() => import('@/features/auth/SsoPage').then((m) => ({ default: m.SsoPage })));
const VerifyPage = lazy(() => import('@/features/auth/VerifyPage').then((m) => ({ default: m.VerifyPage })));
const NewPasswordPage = lazy(() =>
  import('@/features/auth/NewPasswordPage').then((m) => ({ default: m.NewPasswordPage })),
);
const AccessHelpPage = lazy(() => import('@/features/auth/AccessHelpPage').then((m) => ({ default: m.AccessHelpPage })));
const SecurityPage = lazy(() => import('@/features/account/SecurityPage').then((m) => ({ default: m.SecurityPage })));

// Internal style guide: development only (CLAUDE.md 2.8). `import.meta.env.DEV` is
// replaced with `false` in production builds, so the page is never bundled or deployed.
const StyleguidePage = import.meta.env.DEV
  ? lazy(() => import('@/features/styleguide/StyleguidePage').then((m) => ({ default: m.StyleguidePage })))
  : null;

function RootRedirect() {
  const user = useCurrentUser();
  return <Navigate to={user ? homePath(user) : '/login'} replace />;
}

/** Unknown routes: G7 inside the layout when signed in, a standalone page otherwise. */
function CatchAll() {
  const user = useCurrentUser();
  return user ? <AccessDeniedPage reason="not_found" /> : <NotFoundPage />;
}

export function AppRoutes() {
  const user = useCurrentUser();

  return (
    <Suspense fallback={null}>
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* Access (public): G1 to G4 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/sso" element={<SsoPage />} />
      <Route path="/login/verify" element={<VerifyPage />} />
      <Route path="/login/new-password" element={<NewPasswordPage />} />
      <Route path="/access-help" element={<AccessHelpPage />} />

      {StyleguidePage && (
        <Route
          path="/styleguide"
          element={<StyleguidePage />}
        />
      )}

      {/* Signed-in app: G6 layout + permission guard from permissions.ts */}
      <Route element={<AppLayout />}>
        <Route element={<RouteGuard />}>
          <Route path="/account/security" element={<SecurityPage />} />

          <Route path="/admin" element={<UpcomingPage screen="A1" />} />
          <Route path="/admin/hires" element={<UpcomingPage screen="A2" />} />
          <Route path="/admin/hires/new" element={<UpcomingPage screen="A3" />} />
          <Route path="/admin/hires/:id" element={<UpcomingPage screen="A4" />} />
          <Route path="/admin/templates" element={<UpcomingPage screen="A5" />} />
          <Route path="/admin/templates/:id" element={<UpcomingPage screen="A6" />} />
          <Route path="/admin/templates/:id/preview" element={<UpcomingPage screen="A7" />} />

          <Route path="/manager" element={<UpcomingPage screen="J1" />} />
          <Route path="/manager/hires/:id" element={<UpcomingPage screen="J2" />} />
          <Route path="/manager/hires/:id/checkin/:stage" element={<UpcomingPage screen="J3" />} />

          <Route path="/me" element={<UpcomingPage screen="N1" />} />
          <Route path="/me/tasks/:id" element={<UpcomingPage screen="N2" />} />
          <Route path="/me/checkin" element={<NextCheckinRedirect />} />
          <Route path="/me/checkin/:stage" element={<UpcomingPage screen="N3" />} />

          <Route path="/it/requests" element={<UpcomingPage screen="S1" />} />
          <Route path="/it/requests/:id" element={<UpcomingPage screen="S2" />} />
          <Route path="/it/security" element={<UpcomingPage screen="S3" />} />

          {user && <Route path="*" element={<CatchAll />} />}
        </Route>
      </Route>

      {!user && <Route path="*" element={<CatchAll />} />}
    </Routes>
    </Suspense>
  );
}
