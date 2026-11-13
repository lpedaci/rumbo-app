import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useCurrentUser, useSessionStore } from '@/store/session-store';
import { BackToTop } from './BackToTop';
import { RouteLoading } from './RouteLoading';
import { BottomNav, MobileNavDrawer, SideNav } from './MainNav';
import { SessionTimeout } from './SessionTimeout';
import { TopBar } from './TopBar';
import { GuidedWelcome } from '@/features/welcome/GuidedWelcome';
import { useDataStore } from '@/store/data-store';
import { hasConsent } from '@/lib/privacy';
import { useApplyPreferences, useMyPreferences } from '@/features/preferences/use-preferences';

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
  // F17: the person's language, date format, time zone and accessibility settings
  const prefs = useMyPreferences();
  useApplyPreferences(prefs);
  const consented = useDataStore((s) =>
    user ? hasConsent(s.consents, user.personId, s.securityPolicy.privacyNoticeVersion) : true,
  );

  useEffect(() => {
    if (!user) {
      useSessionStore.getState().setReturnTo(location.pathname);
      navigate('/login', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  // F10: before anything else, the privacy notice (G8); afterwards it returns to this route.
  useEffect(() => {
    if (user && !consented) {
      useSessionStore.getState().setReturnTo(location.pathname + location.search);
      navigate('/consent', { replace: true });
    }
  }, [user, consented, location.pathname, location.search, navigate]);

  if (!user) return null;
  // F10: nobody uses the platform without accepting the privacy notice in force (G8).
  if (!consented) return null;

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
            {/* Full width, aligned with the top bar; from 1920 px, 10 % inner padding per side (D-82) */}
            <div className="w-full min-w-0 min-[120rem]:px-[10%]">
              {/* Remounted when the date format or time zone change, so every date is shown again */}
              <div key={`${prefs?.dateFormat}-${prefs?.timezone}`} className="contents">
                {/* The bar and the menu stay while the screen loads, with the skeleton of its
                    page template (D-131, D-140) */}
                <RouteLoading>
                  <Outlet />
                </RouteLoading>
              </div>
            </div>
          </main>
        </div>
      </div>
      <BottomNav />
      <BackToTop aboveBottomNav />
      <MobileNavDrawer />
      <SessionTimeout />
      <GuidedWelcome />
    </div>
  );
}
