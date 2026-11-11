import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { DOCS_URL } from '@/app/links';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { hasGuidedWelcome } from '@/features/welcome/welcome-steps';
import { homePath } from '@/lib/permissions';
import { useCurrentUser, useSessionStore } from '@/store/session-store';
import { useUiStore } from '@/store/ui-store';
import { Logo } from './Logo';
import { MENU_BUTTON_ID, SIDEBAR_ID } from './MainNav';
import { RoleSwitcher } from './RoleSwitcher';
import { UserMenu } from './UserMenu';

/** Mobile only (< 768 px): opens the navigation drawer. From 768 px the panel has its own toggle. */
function MenuButton() {
  const { t } = useTranslation();
  const drawerOpen = useUiStore((s) => s.navDrawerOpen);
  return (
    <IconButton
      id={MENU_BUTTON_ID}
      icon="menu"
      label={t('layout.menu.open')}
      aria-expanded={drawerOpen}
      aria-controls={`${SIDEBAR_ID}-drawer`}
      aria-haspopup="dialog"
      className="md:hidden"
      onClick={() => useUiStore.getState().setNavDrawerOpen(true)}
    />
  );
}

/** Help in the same place on every screen (WCAG 3.2.6): guided welcome and project docs. */
function HelpMenu() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton icon="help" label={t('layout.help.title')} />
      </DropdownMenuTrigger>
      <DropdownMenuContent label={t('layout.help.title')}>
        <DropdownMenuLabel>{t('layout.help.title')}</DropdownMenuLabel>
        {hasGuidedWelcome(user.role) && (
          <DropdownMenuItem icon="school" onSelect={() => useSessionStore.getState().setWelcomeOpen(true)}>
            {t('welcome.reopen')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem icon="open_in_new" onSelect={() => window.open(DOCS_URL, '_blank', 'noopener,noreferrer')}>
          {t('layout.help.docs')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="max-w-64 px-3 py-2 text-body-small text-on-surface-variant">{t('layout.help.desk')}</p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Notifications (F7 arrives in phase B): for now, an empty state that says what will appear. */
function NotificationsMenu() {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton icon="notifications" label={t('layout.notifications.title')} />
      </DropdownMenuTrigger>
      <DropdownMenuContent label={t('layout.notifications.title')} className="w-80">
        <DropdownMenuLabel>{t('layout.notifications.title')}</DropdownMenuLabel>
        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
            <Icon name="notifications" size={24} />
          </span>
          <p className="text-title-small text-on-surface">{t('layout.notifications.emptyTitle')}</p>
          <p className="text-body-small text-on-surface-variant">{t('layout.notifications.emptyBody')}</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Top bar of the signed-in app (reference 9d0f172e): menu button and logo on the left;
 * "Ver como", help, notifications and the person on the right. Full width, above the sidebar.
 */
export function TopBar() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  if (!user) return null;

  return (
    // Flat on the tinted page (reference ad2d9e23); controls keep the product's single shape (2.1.3).
    <header className="sticky top-0 z-40 bg-surface">
      <div className="flex h-16 min-w-0 items-center gap-3 px-(--space-gutter) sm:gap-4 md:h-[4.5rem] md:pl-4">
        <MenuButton />
        <Link to={homePath(user)} className="shrink-0 rounded-sm">
          <Logo markOnly className="sm:hidden" />
          {/* Mark only on small screens: the link keeps a name for assistive tech. */}
          <span className="sr-only sm:hidden">
            {t('layout.homeLogo', { name: t('app.name'), company: t('app.company') })}
          </span>
          <Logo className="hidden sm:inline-flex" />
        </Link>
        <div className="min-w-2 flex-1" />
        {/* The role selector shrinks first on small screens (its text truncates). */}
        <div className="ml-1 flex min-w-0 shrink justify-end">
          <RoleSwitcher />
        </div>
        <HelpMenu />
        <div className="hidden sm:block">
          <NotificationsMenu />
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
