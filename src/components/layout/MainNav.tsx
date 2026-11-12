import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useMatch, useNavigate } from 'react-router';
import { NAV_ITEMS, type NavItem } from '@/app/navigation';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Tooltip } from '@/components/ui/Tooltip';
import { signOut } from '@/features/auth/auth-service';
import { can } from '@/lib/permissions';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/store/session-store';
import { useUiStore } from '@/store/ui-store';
import { Logo } from './Logo';

export const SIDEBAR_ID = 'app-sidebar';
export const MENU_BUTTON_ID = 'app-menu-button';

function useNavItems(): NavItem[] {
  const user = useCurrentUser();
  return NAV_ITEMS.filter((item) => can(user, item.action));
}

/** Folded to icons: the viewer's choice, or automatic (folded below 1280 px). */
export function useNavCollapsed(): boolean {
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const preference = useUiStore((s) => s.navCollapsed);
  return preference ?? !isDesktop;
}

const itemClass = (collapsed: boolean, active: boolean) =>
  cn(
    'flex items-center rounded-md text-label-large transition-colors duration-150',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    collapsed ? 'mx-auto size-11 justify-center' : 'min-h-11 w-full gap-3 px-3',
    // Active item: solid primary, white icon, same soft corners as buttons (2.1.3, D-57).
    active ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
  );

/** Folded items keep their name for assistive tech and show it in a tooltip (2.3). */
function WithTooltip({ collapsed, label, children }: { collapsed: boolean; label: string; children: ReactNode }) {
  return collapsed ? (
    <Tooltip content={label} side="right">
      {children}
    </Tooltip>
  ) : (
    <>{children}</>
  );
}

function ItemContent({ icon, label, collapsed, active }: { icon: IconName; label: string; collapsed: boolean; active?: boolean }) {
  return (
    <>
      <Icon name={icon} size={24} filled={active} className="shrink-0" />
      <span className={collapsed ? 'sr-only' : 'min-w-0 truncate'}>{label}</span>
    </>
  );
}


/**
 * Navigation link with a plain className: the tooltip trigger (Radix Slot) cannot merge
 * NavLink's className function, so the active state is computed here with useMatch.
 */
function SideLink({
  to,
  end = false,
  icon,
  label,
  collapsed,
  onNavigate,
}: {
  to: string;
  end?: boolean;
  icon: IconName;
  label: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const active = useMatch({ path: to, end }) !== null;
  return (
    <WithTooltip collapsed={collapsed} label={label}>
      <Link
        to={to}
        onClick={onNavigate}
        aria-current={active ? 'page' : undefined}
        className={itemClass(collapsed, active)}
      >
        <ItemContent icon={icon} label={label} collapsed={collapsed} active={active} />
      </Link>
    </WithTooltip>
  );
}

/**
 * Items of the side navigation, shared by the sidebar and the mobile drawer:
 * the role workspace on top, "Mi seguridad" and "Cerrar sesión" at the bottom.
 */
function NavContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const items = useNavItems();
  if (!user) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1">
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.to}>
            <SideLink
              to={item.to}
              end={item.end}
              icon={item.icon}
              label={t(item.label)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>

      <div className="flex-1" />

      <ul aria-label={t('layout.account')} className="flex flex-col gap-1 rounded-lg bg-surface-container p-1">
        {can(user, 'account:security_own') && (
          <li>
            <SideLink
              to="/account/security"
              icon="verified_user"
              label={t('layout.mySecurity')}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </li>
        )}
        {can(user, 'privacy:own') && (
          <li>
            <SideLink
              to="/account/privacy"
              icon="policy"
              label={t('layout.myPrivacy')}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </li>
        )}
        <li>
          <WithTooltip collapsed={collapsed} label={t('layout.signOut')}>
            <button
              type="button"
              className={itemClass(collapsed, false)}
              onClick={() => {
                onNavigate?.();
                signOut('manual');
                navigate('/login', { replace: true });
              }}
            >
              <ItemContent icon="logout" label={t('layout.signOut')} collapsed={collapsed} />
            </button>
          </WithTooltip>
        </li>
      </ul>
    </div>
  );
}

/**
 * Side navigation from 768 px (reference ad2d9e23, D-60): a floating white panel that
 * runs the full height of the screen, with a "Menú" header and its fold toggle on top (D-101), the role items
 * and the account items at the bottom (the logo is in the top bar). Folded to icons (circles) or expanded with labels from
 * the menu button of the top bar; folded by default below 1280 px, choice remembered.
 */
export function SideNav() {
  const { t } = useTranslation();
  const collapsed = useNavCollapsed();

  return (
    <div data-print-hide className="sticky top-0 hidden h-dvh shrink-0 py-3 pl-3 md:block">
      <nav
        id={SIDEBAR_ID}
        aria-label={t('layout.mainNav')}
        className={cn(
          'flex h-full flex-col gap-4 overflow-x-hidden overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest py-3',
          'transition-[width] duration-200 ease-standard motion-reduce:transition-none',
          collapsed ? 'w-[4.5rem] px-2' : 'w-60 px-3',
        )}
      >
        {/* Header (D-101): the "Menú" label and the toggle that folds or expands this panel
            (the logo lives in the top bar). Folded, only the toggle. */}
        <div className={cn('flex shrink-0 items-center', collapsed ? 'justify-center' : 'justify-between gap-2 pl-3')}>
          {!collapsed && <span className="truncate text-title-small text-on-surface-variant">{t('layout.menu.title')}</span>}
          <Tooltip content={collapsed ? t('layout.menu.expand') : t('layout.menu.collapse')} side="right">
            <button
              type="button"
              aria-label={collapsed ? t('layout.menu.expand') : t('layout.menu.collapse')}
              aria-expanded={!collapsed}
              aria-controls={SIDEBAR_ID}
              onClick={() => useUiStore.getState().setNavCollapsed(!collapsed)}
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors duration-150',
                'hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary',
              )}
            >
              <Icon name={collapsed ? 'menu' : 'menu_open'} size={24} />
            </button>
          </Tooltip>
        </div>
        <NavContent collapsed={collapsed} />
      </nav>
    </div>
  );
}

/** Mobile navigation (< 768 px): the menu button opens this drawer with every item (2.7). */
export function MobileNavDrawer() {
  const { t } = useTranslation();
  const open = useUiStore((s) => s.navDrawerOpen);
  const setOpen = useUiStore((s) => s.setNavDrawerOpen);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim/32 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 md:hidden" />
        <DialogPrimitive.Content
          id={`${SIDEBAR_ID}-drawer`}
          // The drawer opens from state, not from a Radix trigger: focus goes to the first
          // item on open and back to the menu button on close (2.10).
          onOpenAutoFocus={(event) => {
            const first = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>('nav a, nav button');
            if (first) {
              event.preventDefault();
              first.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById(MENU_BUTTON_ID)?.focus();
          }}
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100%-3rem))] flex-col gap-4 bg-surface-container-lowest px-3 py-4 shadow-elevation-2 md:hidden',
            'duration-200 data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left',
          )}
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <Logo />
            <DialogPrimitive.Close asChild>
              <IconButton icon="close" label={t('layout.menu.close')} />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Title className="sr-only">{t('layout.mainNav')}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{t('layout.menu.description')}</DialogPrimitive.Description>
          <nav aria-label={t('layout.mainNav')} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <NavContent collapsed={false} onNavigate={() => setOpen(false)} />
          </nav>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Bottom navigation on mobile (< 768 px): up to 4 items, 48 px targets, safe-area padding. */
export function BottomNav() {
  const { t } = useTranslation();
  const items = useNavItems().slice(0, 4);

  return (
    <nav
      data-print-hide
      aria-label={t('layout.bottomNav')}
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
                  'flex h-14 min-w-0 items-center justify-center px-1',
                  'focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-primary',
                  isActive ? 'text-on-primary' : 'text-on-surface-variant',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Icon only (the label stays for assistive tech): lighter bar on small screens. */}
                  <span
                    className={cn(
                      'flex h-10 w-16 items-center justify-center rounded-full transition-colors duration-150',
                      isActive && 'bg-primary',
                    )}
                  >
                    <Icon name={item.icon} size={24} filled={isActive} />
                  </span>
                  <span className="sr-only">{t(item.label)}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
