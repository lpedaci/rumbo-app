import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { interactive } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon } from '@/components/ui/Icon';
import { findDemoPerson, resetDemo, signOut } from '@/features/auth/auth-service';
import { can } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser, useSessionStore } from '@/store/session-store';

/** User menu (CLAUDE.md F0): name, role, "Mi seguridad", demo controls and "Cerrar sesión". */
export function UserMenu({ placement = 'header' }: { placement?: 'header' | 'sidebar' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const warningMinutes = useDataStore((s) => s.securityPolicy.sessionWarningMinutes);
  const [resetOpen, setResetOpen] = useState(false);
  if (!user) return null;
  const person = findDemoPerson(user.personId);
  const name = person?.name ?? '';

  /** Demo control: move the last activity back so the expiry warning appears now. */
  const showSessionWarning = () => {
    useSessionStore.getState().touch(Date.now() - warningMinutes * 60_000);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {/* Accessible name starts with the visible text (WCAG 2.5.3, label in name). */}
          <button
            type="button"
            className={cn(
              'flex min-w-0 items-center gap-2',
              placement === 'sidebar'
                ? 'w-full rounded-lg p-2 text-left hover:bg-surface-container'
                : 'h-11 rounded-sm px-1',
              interactive,
            )}
          >
            <Avatar name={name} role={user.role} size={placement === 'sidebar' ? 'md' : 'sm'} />
            <span className={cn('sr-only', placement === 'sidebar' && 'hidden')}>
              {name}
            </span>
            <span
              className={cn(
                'min-w-0 flex-1 flex-col text-left',
                placement === 'sidebar' ? 'flex' : 'hidden',
              )}
            >
              <span className="truncate text-label-large text-on-surface">{name}</span>
              <span className="truncate text-body-small text-on-surface-variant">{t(`roles.${user.role}`)}</span>
            </span>
            <span className="sr-only">, {t('layout.userMenuSuffix')}</span>
            <Icon
              name={placement === 'sidebar' ? 'more_vert' : 'keyboard_arrow_down'}
              className="hidden shrink-0 text-on-surface-variant md:block"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          label={t('layout.userMenu', { name })}
          align={placement === 'sidebar' ? 'start' : 'end'}
          side={placement === 'sidebar' ? 'top' : 'bottom'}
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={name} role={user.role} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-label-large text-on-surface">{name}</span>
              <span className="truncate text-body-small text-on-surface-variant">
                {t(`roles.${user.role}`)} · {person?.email}
              </span>
            </div>
          </div>
          <DropdownMenuSeparator />
          {can(user, 'account:security_own') && (
            <DropdownMenuItem icon="verified_user" onSelect={() => navigate('/account/security')}>
              {t('layout.mySecurity')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem icon="schedule" onSelect={showSessionWarning}>
            {t('layout.sessionDemo')}
          </DropdownMenuItem>
          {can(user, 'demo:reset') && (
            <DropdownMenuItem icon="refresh" onSelect={() => setResetOpen(true)}>
              {t('layout.resetDemo')}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            icon="logout"
            onSelect={() => {
              signOut('manual');
              navigate('/login', { replace: true });
            }}
          >
            {t('layout.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t('home.resetTitle')}
        description={t('home.resetBody')}
        confirmLabel={t('home.resetConfirm')}
        onConfirm={() => {
          resetDemo();
          navigate('/', { replace: true });
        }}
      />
    </>
  );
}
