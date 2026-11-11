import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout';
import { NextCheckinRedirect } from '@/features/journey/NextCheckinRedirect';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { NotFoundPage } from '@/features/system/NotFoundPage';
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
const AccessHelpPage = lazy(() =>
  import('@/features/auth/AccessHelpPage').then((m) => ({ default: m.AccessHelpPage })),
);
const DemoHomePage = lazy(() => import('@/features/home/DemoHomePage').then((m) => ({ default: m.DemoHomePage })));
const JourneyPage = lazy(() => import('@/features/journey/JourneyPage').then((m) => ({ default: m.JourneyPage })));
const TaskDetailPage = lazy(() =>
  import('@/features/journey/TaskDetailPage').then((m) => ({ default: m.TaskDetailPage })),
);
const TemplatesPage = lazy(() =>
  import('@/features/templates/TemplatesPage').then((m) => ({ default: m.TemplatesPage })),
);
const TemplateEditorPage = lazy(() =>
  import('@/features/templates/TemplateEditorPage').then((m) => ({ default: m.TemplateEditorPage })),
);
const TemplatePreviewPage = lazy(() =>
  import('@/features/templates/TemplatePreviewPage').then((m) => ({ default: m.TemplatePreviewPage })),
);
const DesignSystemPage = lazy(() =>
  import('@/features/design-system/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
);
// Screens of steps 7 to 10 load on demand too (RNF-005, D-99).
const ManagerCheckinPage = lazy(() =>
  import('@/features/checkins/ManagerCheckinPage').then((m) => ({ default: m.ManagerCheckinPage })),
);
const SelfReviewPage = lazy(() =>
  import('@/features/checkins/SelfReviewPage').then((m) => ({ default: m.SelfReviewPage })),
);
const TeamPage = lazy(() => import('@/features/team/TeamPage').then((m) => ({ default: m.TeamPage })));
const HireDetailPage = lazy(() =>
  import('@/features/hires/HireDetailPage').then((m) => ({ default: m.HireDetailPage })),
);
const HiresPage = lazy(() => import('@/features/hires/HiresPage').then((m) => ({ default: m.HiresPage })));
const NewHirePage = lazy(() => import('@/features/hires/NewHirePage').then((m) => ({ default: m.NewHirePage })));
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ItSecurityPage = lazy(() => import('@/features/it/ItSecurityPage').then((m) => ({ default: m.ItSecurityPage })));
const RequestDetailPage = lazy(() =>
  import('@/features/it/RequestDetailPage').then((m) => ({ default: m.RequestDetailPage })),
);
const RequestsPage = lazy(() => import('@/features/it/RequestsPage').then((m) => ({ default: m.RequestsPage })));
const SecurityPage = lazy(() => import('@/features/account/SecurityPage').then((m) => ({ default: m.SecurityPage })));

// Internal style guide: development only (CLAUDE.md 2.8). `import.meta.env.DEV` is
// replaced with `false` in production builds, so the page is never bundled or deployed.
// Open Graph card and app icon, captured with `npm run og` (D-76). Development only.
// Wireflows of docs/flows.md (D-100): development only, exported as images with `npm run og`.
const WireflowsPage = import.meta.env.DEV
  ? lazy(() => import('@/features/marketing/WireflowsPage').then((m) => ({ default: m.WireflowsPage })))
  : null;
const OgCardPage = import.meta.env.DEV
  ? lazy(() => import('@/features/marketing/OgCard').then((m) => ({ default: m.OgCardPage })))
  : null;
const StyleguidePage = import.meta.env.DEV
  ? lazy(() => import('@/features/styleguide/StyleguidePage').then((m) => ({ default: m.StyleguidePage })))
  : null;

/** `/`: the demo start (G0) for visitors, the role home for signed-in users. */
function RootRoute() {
  const user = useCurrentUser();
  return user ? <Navigate to={homePath(user)} replace /> : <DemoHomePage />;
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
        {/* Demo start (G0) and access (G1 to G4): public */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/sso" element={<SsoPage />} />
        <Route path="/login/verify" element={<VerifyPage />} />
        <Route path="/login/new-password" element={<NewPasswordPage />} />
        <Route path="/access-help" element={<AccessHelpPage />} />
        {/* Public design system site (D-98): with or without a session */}
        <Route path="/design-system" element={<DesignSystemPage />} />

        {OgCardPage && <Route path="/og-card" element={<OgCardPage />} />}
        {WireflowsPage && <Route path="/wireflows" element={<WireflowsPage />} />}

        {StyleguidePage && <Route path="/styleguide" element={<StyleguidePage />} />}

        {/* Signed-in app: G6 layout + permission guard from permissions.ts */}
        <Route element={<AppLayout />}>
          <Route element={<RouteGuard />}>
            <Route path="/account/security" element={<SecurityPage />} />

            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/admin/hires" element={<HiresPage />} />
            <Route path="/admin/hires/new" element={<NewHirePage />} />
            <Route path="/admin/hires/:id" element={<HireDetailPage />} />
            <Route path="/admin/templates" element={<TemplatesPage />} />
            <Route path="/admin/templates/:id" element={<TemplateEditorPage />} />
            <Route path="/admin/templates/:id/preview" element={<TemplatePreviewPage />} />

            <Route path="/manager" element={<TeamPage />} />
            <Route path="/manager/hires/:id" element={<HireDetailPage />} />
            <Route path="/manager/hires/:id/checkin/:stage" element={<ManagerCheckinPage />} />

            <Route path="/me" element={<JourneyPage />} />
            <Route path="/me/tasks/:id" element={<TaskDetailPage />} />
            <Route path="/me/checkin" element={<NextCheckinRedirect />} />
            <Route path="/me/checkin/:stage" element={<SelfReviewPage />} />

            <Route path="/it/requests" element={<RequestsPage />} />
            <Route path="/it/requests/:id" element={<RequestDetailPage />} />
            <Route path="/it/security" element={<ItSecurityPage />} />

            {user && <Route path="*" element={<CatchAll />} />}
          </Route>
        </Route>

        {!user && <Route path="*" element={<CatchAll />} />}
      </Routes>
    </Suspense>
  );
}
