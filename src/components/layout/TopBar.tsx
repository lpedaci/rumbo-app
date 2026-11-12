import { useState } from 'react';
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
import { Dialog } from '@/components/ui/Dialog';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenHelpDialog } from '@/features/help/ScreenHelp';
import { hasGuidedWelcome } from '@/features/welcome/welcome-steps';
import { homePath } from '@/lib/permissions';
import { useCurrentUser, useSessionStore } from '@/store/session-store';
import { useUiStore } from '@/store/ui-store';
import { Logo } from './Logo';
import { MENU_BUTTON_ID, SIDEBAR_ID } from './MainNav';
import { RoleSwitcher } from './RoleSwitcher';
import { NotificationsBell } from '@/features/notifications/NotificationsBell';
import { GlobalSearch, SearchButton } from '@/features/search/SearchDialog';
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

/** Utility buttons on a neutral container, like the reference (D-69), with the product's single shape. */
const TOOL_BUTTON = 'bg-surface-container text-on-surface';

/** Help in the same place on every screen (WCAG 3.2.6): guided welcome and project docs. */
function HelpMenu() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const [screenHelp, setScreenHelp] = useState(false);
  if (!user) return null;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton icon="help" label={t('layout.help.title')} className={TOOL_BUTTON} />
        </DropdownMenuTrigger>
        <DropdownMenuContent label={t('layout.help.title')}>
          <DropdownMenuLabel>{t('layout.help.title')}</DropdownMenuLabel>
          {/* F16: what this screen is for (D-127) */}
          <DropdownMenuItem icon="info" onSelect={() => setScreenHelp(true)}>
            {t('help.menuItem')}
          </DropdownMenuItem>
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
      <Dialog open={screenHelp} onOpenChange={setScreenHelp}>
        {screenHelp && <ScreenHelpDialog />}
      </Dialog>
    </>
  );
}

/** Notifications (F7 arrives in phase B): for now, an empty state that says what will appear. */

/**
 * Top bar of the signed-in app (reference 9d0f172e): menu button and logo on the left;
 * "Ver como", help, notifications and the person on the right. Full width, above the sidebar.
 */
export function TopBar() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  if (!user) return null;

  return (
    // White floating bar on the gray page, like the sidebar (D-69, reference of the top bar).
    <header data-print-hide className="sticky top-0 z-40 bg-surface px-2 pt-2 md:pr-(--space-gutter) md:pl-4 md:pt-3">
      <div className="flex h-16 min-w-0 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-2 sm:gap-4 sm:px-4">
        <MenuButton />
        {/* Below 768 px the logo lives in the menu drawer, so the bar stays light (D-79) */}
        <Link to={homePath(user)} className="hidden shrink-0 rounded-sm md:inline-flex">
          <Logo markOnly className="sm:hidden" />
          {/* Mark only on small screens: the link keeps a name for assistive tech. */}
          <span className="sr-only sm:hidden">
            {t('layout.homeLogo', { name: t('app.name'), company: t('app.company') })}
          </span>
          <Logo className="hidden sm:inline-flex" />
        </Link>
        <div className="flex min-w-2 flex-1 justify-center">
          {/* F16: the field-like search from 1440 px (with the side menu open, it does not fit before); below, an icon among the tools */}
          <SearchButton variant="field" className="hidden min-[90rem]:inline-flex" />
          <GlobalSearch />
        </div>
        {/* The role selector shrinks first on small screens (its text truncates). */}
        <div className="ml-1 flex min-w-0 shrink justify-end">
          <RoleSwitcher />
        </div>
        <span aria-hidden className="hidden h-8 w-px bg-outline-variant sm:block" />
        <div className="flex items-center gap-2">
          <SearchButton variant="icon" className={`min-[90rem]:hidden ${TOOL_BUTTON}`} />
          <HelpMenu />
          {/* F7: panel from 640 px; below, the bell opens the notifications page */}
          <NotificationsBell buttonClassName={TOOL_BUTTON} />
        </div>
        <span aria-hidden className="hidden h-8 w-px bg-outline-variant sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}
