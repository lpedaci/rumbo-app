import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router';
import { NAV_ITEMS, type NavItem } from '@/app/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
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

/** Shared look of every sidebar entry: icon above a short label on the rail, icon + label in a row on desktop. */
const itemBase = cn(
  'flex min-h-16 w-full flex-col items-center justify-center gap-1 rounded-lg px-1 py-1 text-center text-label-medium transition-colors duration-150',
  'xl:min-h-10 xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-left xl:text-label-large',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
);
const itemIdle = 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface';
// Active item: solid primary pill with white text and filled icon, as in reference 9d0f172e (D-57).
const itemActive = 'bg-primary text-on-primary';

function SecondaryItem({ icon, label, to, onClick }: { icon: IconName; label: string; to?: string; onClick?: () => void }) {
  const content = (
    <>
      <Icon name={icon} size={24} className="xl:size-5" />
      <span className="line-clamp-2 max-w-full xl:truncate">{label}</span>
    </>
  );
  return (
    <li>
      {to ? (
        <NavLink to={to} className={({ isActive }) => cn(itemBase, isActive ? itemActive : itemIdle)}>
          {content}
        </NavLink>
      ) : (
        <button type="button" onClick={onClick} className={cn(itemBase, itemIdle)}>
          {content}
        </button>
      )}
    </li>
  );
}

/**
 * Side navigation (2.2.1 pattern 5, reference 9d0f172e): one white panel with the logo
 * on top, the workspace items, and at the bottom the help shortcuts and the person.
 * - From 1280 px: full sidebar (icon + label).
 * - From 768 px: icon rail with short labels; help and account live in the header menu.
 * - Below 768 px: bottom navigation (BottomNav).
 */
export function SideNav() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const items = useNavItems();
  if (!user) return null;

  const home = homePath(user);

  return (
    <nav
      aria-label={t('layout.mainNav')}
      className="sticky top-0 hidden h-dvh w-24 shrink-0 flex-col overflow-y-auto border-r border-outline-variant bg-surface-container-lowest px-2 py-4 md:flex xl:w-64 xl:px-4"
    >
      <Link to={home} className="mb-6 hidden rounded-md px-2 xl:block">
        <Logo />
      </Link>
      <Link to={home} aria-label={t('layout.home')} className="mx-auto mb-6 rounded-md xl:hidden">
        <Logo markOnly />
      </Link>

      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(itemBase, isActive ? itemActive : itemIdle)}
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} size={24} filled={isActive} className="xl:size-5" />
                  {/* Rail: up to two lines so labels are never cut; sidebar: one line. */}
                  <span className="line-clamp-2 max-w-full xl:truncate">{t(item.label)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      {/* Desktop footer: help shortcuts and the person (reference: plan card + user at the bottom) */}
      <div className="hidden flex-col gap-3 xl:flex">
        <ul aria-label={t('layout.shortcuts')} className="flex flex-col gap-1">
          {hasGuidedWelcome(user.role) && (
            <SecondaryItem
              icon="help"
              label={t('welcome.reopen')}
              onClick={() => useSessionStore.getState().setWelcomeOpen(true)}
            />
          )}
          {can(user, 'account:security_own') && (
            <SecondaryItem icon="verified_user" label={t('layout.mySecurity')} to="/account/security" />
          )}
        </ul>
        <div className="border-t border-outline-variant pt-3">
          <UserMenu placement="sidebar" />
        </div>
      </div>
    </nav>
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
                  isActive ? 'text-on-surface' : 'text-on-surface-variant',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150',
                      isActive && 'bg-primary text-on-primary',
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
