import { useTranslation } from 'react-i18next';
import { Link, NavLink, useNavigate } from 'react-router';
import { NAV_ITEMS, type NavItem } from '@/app/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Tooltip } from '@/components/ui/Tooltip';
import { signOut } from '@/features/auth/auth-service';
import { hasGuidedWelcome } from '@/features/welcome/welcome-steps';
import { can, homePath } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useCurrentUser, useSessionStore } from '@/store/session-store';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';

function useNavItems(): NavItem[] {
  const user = useCurrentUser();
  return NAV_ITEMS.filter((item) => can(user, item.action));
}

const railButton = cn(
  'flex size-11 items-center justify-center rounded-md text-on-surface-variant transition-colors duration-150',
  'hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary',
);

/** Icon-only control of the utility rail: always labelled, with a tooltip (2.3). */
function RailAction({ icon, label, onClick, to }: { icon: IconName; label: string; onClick?: () => void; to?: string }) {
  return (
    <li>
      <Tooltip content={label} side="right">
        {to ? (
          <Link to={to} aria-label={label} className={railButton}>
            <Icon name={icon} size={24} />
          </Link>
        ) : (
          <button type="button" aria-label={label} onClick={onClick} className={railButton}>
            <Icon name={icon} size={24} />
          </button>
        )}
      </Tooltip>
    </li>
  );
}

/**
 * Side navigation (2.2.1 patterns 5 and 12, reference 7fa40cfb).
 * - From 1280 px: two levels. A thin utility rail (logo, guided welcome, "Mi seguridad",
 *   "Cerrar sesión") and the expanded menu of the role workspace with the person at the bottom.
 * - From 768 px: one icon rail with short labels.
 * - Below 768 px: bottom navigation (BottomNav).
 * The active item is a pill in `primary-container` with a filled icon (2.3).
 */
export function SideNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const items = useNavItems();
  if (!user) return null;

  const home = homePath(user);

  return (
    <div className="sticky top-0 hidden h-dvh shrink-0 md:flex">
      {/* Utility rail (desktop) */}
      <div className="hidden w-[4.5rem] flex-col items-center gap-2 border-r border-outline-variant bg-surface-container-lowest py-4 xl:flex">
        <Link to={home} aria-label={t('layout.home')} className="rounded-md">
          <Logo markOnly />
        </Link>
        <div className="flex-1" />
        <ul aria-label={t('layout.shortcuts')} className="flex flex-col items-center gap-1">
          {hasGuidedWelcome(user.role) && (
            <RailAction
              icon="help"
              label={t('welcome.reopen')}
              onClick={() => useSessionStore.getState().setWelcomeOpen(true)}
            />
          )}
          {can(user, 'account:security_own') && (
            <RailAction icon="verified_user" label={t('layout.mySecurity')} to="/account/security" />
          )}
          <RailAction
            icon="logout"
            label={t('layout.signOut')}
            onClick={() => {
              signOut('manual');
              navigate('/login', { replace: true });
            }}
          />
        </ul>
      </div>

      {/* Workspace menu: icon rail on tablet, expanded panel on desktop */}
      <nav
        aria-label={t('layout.mainNav')}
        className="flex w-24 flex-col gap-1 overflow-y-auto border-r border-outline-variant bg-surface-container-lowest px-2 py-4 xl:w-64 xl:px-4"
      >
        <Link to={home} className="mb-4 hidden rounded-md px-2 xl:block">
          <Logo />
        </Link>
        <Link to={home} aria-label={t('layout.home')} className="mx-auto mb-4 rounded-md xl:hidden">
          <Logo markOnly />
        </Link>
        <p className="hidden px-3 pb-1 text-label-medium text-on-surface-variant xl:block">
          {t(`layout.workspace.${user.role}`)}
        </p>
        <ul className="flex flex-col gap-1">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-center text-label-medium transition-colors duration-150',
                    'xl:min-h-11 xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-left xl:text-label-large',
                    isActive
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon name={item.icon} size={24} filled={isActive} />
                    {/* Rail: up to two lines so labels are never cut; panel: one line. */}
                    <span className="line-clamp-2 max-w-full xl:truncate">{t(item.label)}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="flex-1" />
        <div className="hidden border-t border-outline-variant pt-3 xl:block">
          <UserMenu placement="sidebar" />
        </div>
      </nav>
    </div>
  );
}

/** Bottom navigation on mobile (< 768 px): up to 4 items, 48 px targets, safe-area padding. */
export function BottomNav() {
  const { t } = useTranslation();
  const items = useNavItems().slice(0, 4);

  return (
    <nav
      aria-label={t('layout.mainNav')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container-lowest pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}>
        {items.map((item) => (
          <li key={item.to} className="min-w-0">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex h-16 min-w-0 flex-col items-center justify-center gap-1 px-1 text-label-medium',
                  isActive ? 'text-on-primary-container' : 'text-on-surface-variant',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150',
                      isActive && 'bg-primary-container',
                    )}
                  >
                    <Icon name={item.icon} size={24} filled={isActive} />
                  </span>
                  <span className="max-w-full truncate">{t(item.label)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
