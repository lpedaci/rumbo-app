import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { toast } from '@/components/ui/toast-store';
import { Tooltip } from '@/components/ui/Tooltip';
import { notificationsFor } from '@/lib/notifications';
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import { NotificationItem } from './NotificationItem';
import { useNotificationText } from './use-notification-text';
import { useMyPreferences } from '@/features/preferences/use-preferences';
import { shownInApp } from '@/lib/preferences';

/** Newest notices shown in the panel; the rest live on G9. */
const PANEL_LIMIT = 5;

export const NOTIFICATIONS_PATH = '/notifications';

/** Badge with the unread count on the bell: label-small, only for counters (2.1.2). */
function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span
      aria-hidden
      className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-label-small text-on-error tabular-nums"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

/**
 * Bell of the top bar (F7): unread counter and a panel with the newest notices, "Marcar todas
 * como leídas" and "Ver todas las notificaciones". Below 640 px the panel would be cramped, so
 * the bell goes straight to the G9 page. Notices that arrive during the session also show as a
 * toast (one at a time, D-90).
 */
export function NotificationsBell({ buttonClassName }: { buttonClassName?: string }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const all = useDataStore((s) => s.notifications);
  const markAll = useDataStore((s) => s.markAllNotificationsRead);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  // The panel never stays open over another screen.
  const [openedAt, setOpenedAt] = useState(pathname);
  if (open && openedAt !== pathname) setOpen(false);
  if (openedAt !== pathname) setOpenedAt(pathname);
  const wide = useMediaQuery('(min-width: 640px)');
  const personId = user?.personId ?? '';
  const prefs = useMyPreferences();
  // F17: the kinds the person moved to email only do not show in the app
  const mine = useMemo(
    () => notificationsFor(all, personId).filter((n) => !prefs || shownInApp(n, prefs)),
    [all, personId, prefs],
  );
  const unread = mine.filter((n) => !n.readAt).length;
  useSessionToasts(personId);

  const label = unread ? t('notifications.bellLabelUnread', { count: unread }) : t('notifications.bellLabel');
  const triggerClass = cn(
    // 40 px like the other utility buttons, with a 48 px touch area on phones (2.1.3).
    "relative inline-flex size-10 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary max-md:after:absolute max-md:after:-inset-1 max-md:after:content-['']",
    buttonClassName,
  );

  if (!wide) {
    return (
      <Link to={NOTIFICATIONS_PATH} aria-label={label} className={triggerClass}>
        <Icon name="notifications" size={20} />
        <Badge count={unread} />
      </Link>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip content={t('notifications.title')}>
        <PopoverTrigger asChild>
          <button type="button" aria-label={label} className={triggerClass}>
            <Icon name="notifications" size={20} />
            <Badge count={unread} />
          </button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent label={t('notifications.title')} align="end" className="flex w-[26rem] flex-col gap-2 px-2 pt-3 pb-2">
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant px-2 pb-3">
          <div className="flex min-w-0 flex-col">
            <h2 className="text-title-medium text-on-surface">{t('notifications.title')}</h2>
            <p className="text-body-small text-on-surface-variant">{t('notifications.unread', { count: unread })}</p>
          </div>
          {unread > 0 && (
            <Button variant="text" size="xs" leadingIcon="done_all" onClick={() => markAll(personId)}>
              {t('notifications.markAll')}
            </Button>
          )}
        </div>
        {mine.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
            <Icon name="notifications" size={24} className="text-on-surface-variant" />
            <p className="text-title-small text-on-surface">{t('notifications.emptyTitle')}</p>
            <p className="text-body-small text-on-surface-variant">{t('notifications.emptyBody')}</p>
          </div>
        ) : (
          <ul className="flex max-h-[min(36rem,calc(100dvh-12rem))] flex-col overflow-y-auto">
            {mine.slice(0, PANEL_LIMIT).map((n) => (
              <NotificationItem key={n.id} notification={n} variant="compact" onOpen={() => setOpen(false)} />
            ))}
          </ul>
        )}
        <div className="border-t border-outline-variant pt-2">
          <Button asChild variant="text" trailingIcon="arrow_forward" className="w-full">
            <Link to={NOTIFICATIONS_PATH} onClick={() => setOpen(false)}>
              {t('notifications.viewAll')}
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Shows a toast for each notice that reaches this person during the session (F7). */
function useSessionToasts(personId: string) {
  const text = useNotificationText();
  const all = useDataStore((s) => s.notifications);
  const prefs = useMyPreferences();
  const known = useRef<Set<string> | null>(null);
  const owner = useRef(personId);

  useEffect(() => {
    // A new person (role switch) starts with what they already have: no toasts for the past.
    if (!known.current || owner.current !== personId) {
      known.current = new Set(all.map((n) => n.id));
      owner.current = personId;
      return;
    }
    const fresh = all.filter((n) => !known.current!.has(n.id));
    for (const n of fresh) known.current.add(n.id);
    const mine = fresh.filter((n) => n.recipientId === personId && (!prefs || shownInApp(n, prefs)));
    if (mine.length) toast.info(text(mine[mine.length - 1]!).title);
  }, [all, personId, text, prefs]);
}
