import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import { formatDateTime } from '@/lib/dates';
import { NOTIFICATION_TYPES } from '@/lib/notifications';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import type { AppNotification } from '@/types/domain';
import { useNotificationText } from './use-notification-text';

interface NotificationItemProps {
  notification: AppNotification;
  /** Compact rows in the top bar panel; full rows with actions on the G9 page. */
  variant?: 'compact' | 'full';
  /** Called after following the link (the panel closes). */
  onOpen?: () => void;
  /** Opens the email preview (G9 only). */
  onPreviewEmail?: (n: AppNotification) => void;
}

/**
 * One notification (F7, list pattern D-65): the icon of its type on the left; title, message and
 * time in the middle; on the right the unread mark (dot plus hidden text, never color alone) and,
 * on G9, a menu with "Marcar como leída / no leída" and the email preview. The whole row is the
 * link to where the action happens, and following it marks the notice as read.
 */
export function NotificationItem({ notification: n, variant = 'full', onOpen, onPreviewEmail }: NotificationItemProps) {
  const { t } = useTranslation();
  const text = useNotificationText()(n);
  const meta = NOTIFICATION_TYPES[n.type];
  const unread = !n.readAt;
  const setRead = useDataStore((s) => s.setNotificationRead);
  const compact = variant === 'compact';

  return (
    // Same rhythm as the alert list of A1 (D-87, D-106): rows split by dividers, 12 px between
    // icon and text, 6 px between lines.
    <li className="border-b border-outline-variant py-1 last:border-b-0">
      <div
        className={cn(
          'relative flex min-h-14 min-w-0 items-start gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-container focus-within:bg-surface-container',
          unread && 'bg-primary-container/40',
        )}
      >
        <IconTile icon={meta.icon} tone={meta.tone} size={compact ? 'sm' : 'md'} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Link
            to={n.link}
            onClick={() => {
              if (unread) setRead(n.id, true);
              onOpen?.();
            }}
            className={cn(
              'min-w-0 text-title-small text-on-surface outline-none',
              // Stretched link: the whole row opens the place of the action; focus ring on the row.
              "after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-primary",
            )}
          >
            {text.title}
            {unread && <span className="sr-only">, {t('notifications.unreadDot')}</span>}
          </Link>
          <p className={cn('min-w-0 text-body-small text-on-surface-variant', compact ? 'line-clamp-2' : 'text-body-medium')}>
            {text.body}
          </p>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-small text-on-surface-variant">
            <time dateTime={n.createdAt} className="tabular-nums">
              {formatDateTime(n.createdAt)}
            </time>
            {!compact && n.channels.includes('email') && (
              <span className="inline-flex items-center gap-1">
                <span aria-hidden>·</span>
                <Icon name="mail" size={16} />
                {t('notifications.alsoEmail')}
              </span>
            )}
          </p>
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-1">
          {unread && <span aria-hidden className="mt-1 size-2.5 rounded-full bg-primary" />}
          {!compact && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton icon="more_vert" label={t('notifications.actions', { title: text.title })} size="xs" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" label={t('notifications.actions', { title: text.title })}>
                <DropdownMenuItem
                  icon={unread ? 'mark_email_read' : 'mark_email_unread'}
                  onSelect={() => setRead(n.id, unread)}
                >
                  {unread ? t('notifications.markRead') : t('notifications.markUnread')}
                </DropdownMenuItem>
                <DropdownMenuItem icon="mail" onSelect={() => onPreviewEmail?.(n)}>
                  {t('notifications.email.open')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </li>
  );
}
