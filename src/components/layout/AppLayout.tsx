import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { homePath } from '@/lib/permissions';
import { useCurrentUser, useSessionStore } from '@/store/session-store';
import { Logo } from './Logo';
import { BottomNav, SideNav } from './MainNav';
import { RoleSwitcher } from './RoleSwitcher';
import { SessionTimeout } from './SessionTimeout';
import { UserMenu } from './UserMenu';

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
      <header className="sticky top-0 z-40 h-16 border-b border-outline-variant bg-surface-container-lowest">
        <div className="flex h-full min-w-0 items-center gap-3 px-(--space-gutter)">
          <Link to={homePath(user)} className="min-w-0 rounded-sm">
            <Logo showCompany={false} className="sm:hidden" />
            <Logo className="hidden sm:inline-flex" />
          </Link>
          <div className="flex-1" />
          <RoleSwitcher />
          <UserMenu />
        </div>
      </header>
      <div className="flex min-w-0">
        <SideNav />
        <main
          id="main-content"
          tabIndex={-1}
          className="min-w-0 flex-1 px-(--space-gutter) pt-6 pb-24 focus:outline-none md:pb-10"
        >
          <div className="mx-auto w-full max-w-7xl min-w-0">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
      <SessionTimeout />
    </div>
  );
}
