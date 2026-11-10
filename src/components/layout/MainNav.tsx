import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';
import { NAV_ITEMS, type NavItem } from '@/app/navigation';
import { Icon } from '@/components/ui/Icon';
import { can } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/store/session-store';

function useNavItems(): NavItem[] {
  const user = useCurrentUser();
  return NAV_ITEMS.filter((item) => can(user, item.action));
}

/**
 * Side navigation: full sidebar from 1280 px, icon rail from 768 px (CLAUDE.md 2.7).
 * The active item uses a filled icon and the secondary container (2.3).
 */
export function SideNav() {
  const { t } = useTranslation();
  const items = useNavItems();

  return (
    <nav
      aria-label={t('layout.mainNav')}
      className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-24 shrink-0 flex-col gap-1 overflow-y-auto border-r border-outline-variant bg-surface-container px-2 py-4 md:flex xl:w-60 xl:px-3"
    >
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-16 flex-col py-1 items-center justify-center gap-1 rounded-md px-1 text-center text-label-medium transition-colors duration-150 xl:min-h-10 xl:flex-row xl:justify-start xl:gap-3 xl:px-3 xl:text-left xl:text-label-large',
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} size={24} filled={isActive} />
                  {/* Rail: up to two lines so labels are never cut; sidebar: one line. */}
                  <span className="line-clamp-2 max-w-full xl:truncate">{t(item.label)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-surface-container pb-[env(safe-area-inset-bottom)] md:hidden"
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
                  isActive ? 'text-on-secondary-container' : 'text-on-surface-variant',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150',
                      isActive && 'bg-secondary-container',
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
