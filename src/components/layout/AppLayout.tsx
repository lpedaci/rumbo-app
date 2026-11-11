import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useCurrentUser, useSessionStore } from '@/store/session-store';
import { BottomNav, MobileNavDrawer, SideNav } from './MainNav';
import { SessionTimeout } from './SessionTimeout';
import { TopBar } from './TopBar';
import { GuidedWelcome } from '@/features/welcome/GuidedWelcome';

/**
 * G6 · Layout of the signed-in app: header with the "Ver como" selector and the user
 * menu, navigation by role, idle session warning. Without a session, it sends the
 * visitor to the login and remembers the requested route.
 */
export function AppLayout() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      useSessionStore.getState().setReturnTo(location.pathname);
      navigate('/login', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-surface-container-lowest px-4 py-3 text-label-large text-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:shadow-elevation-1"
      >
        {t('app.skipToContent')}
      </a>
      {/* Floating side panel at full height, and the column with the top bar and the page (ad2d9e23) */}
      <div className="flex min-w-0">
        <SideNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main
            id="main-content"
            tabIndex={-1}
            className="min-w-0 flex-1 px-(--space-gutter) pt-5 pb-20 md:pt-6 focus:outline-none md:pb-10 md:pl-4"
          >
            <div className="mx-auto w-full max-w-[max(80rem,80%)] min-w-0">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <BottomNav />
      <MobileNavDrawer />
      <SessionTimeout />
      <GuidedWelcome />
    </div>
  );
}
