import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Logo } from '@/components/layout/Logo';
import { formatDateTime } from '@/lib/dates';
import { useDataStore } from '@/store/data-store';
import type { AppNotification } from '@/types/domain';
import { useNotificationText } from './use-notification-text';

/**
 * "Ver cómo llega por correo" (F7): the email template of a notification, drawn inside Rumbo.
 * Clearly labeled as a simulation: nothing is sent (CLAUDE.md 9, no real integrations).
 * The link in the email is a plain text button: the preview is not a page to sign in from.
 */
export function EmailPreviewDialog({
  notification,
  onOpenChange,
}: {
  notification: AppNotification | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const text = useNotificationText();
  const person = useDataStore((s) => s.people.find((p) => p.id === notification?.recipientId));
  const content = notification ? text(notification) : null;
  const byEmail = notification?.channels.includes('email');

  return (
    <Dialog open={Boolean(notification)} onOpenChange={onOpenChange}>
      {notification && content && (
        <DialogContent
          title={t('notifications.email.title')}
          className="max-w-xl"
          actions={
            <DialogClose asChild>
              <Button variant="outlined">{t('ui.close')}</Button>
            </DialogClose>
          }
        >
          <InlineAlert tone="info">{t('notifications.email.note')}</InlineAlert>
          {!byEmail && <p className="text-body-medium text-on-surface-variant">{t('notifications.email.appOnly')}</p>}
          <article className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-outline-variant">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 border-b border-outline-variant bg-surface-container px-4 py-3 text-body-small">
              <dt className="text-on-surface-variant">{t('notifications.email.from')}</dt>
              <dd className="min-w-0 break-words text-on-surface">{t('notifications.email.sender')}</dd>
              <dt className="text-on-surface-variant">{t('notifications.email.to')}</dt>
              <dd className="min-w-0 break-words text-on-surface">
                {person ? `${person.name} <${person.email}>` : notification.recipientId}
              </dd>
              <dt className="text-on-surface-variant">{t('notifications.email.subject')}</dt>
              <dd className="min-w-0 text-title-small text-on-surface">{content.title}</dd>
            </dl>
            <div className="flex flex-col gap-4 bg-surface-container-lowest px-4 py-5">
              <Logo />
              <p className="text-body-medium text-on-surface">
                {t('notifications.email.greeting', { name: person?.name.split(' ')[0] ?? '' })}
              </p>
              <p className="text-body-medium text-on-surface">{content.body}</p>
              <span className="inline-flex h-10 w-fit items-center gap-2 rounded-sm bg-primary px-4 text-label-large text-on-primary">
                {t('notifications.email.cta')}
                <Icon name="arrow_forward" size={20} />
              </span>
              <p className="border-t border-outline-variant pt-4 text-body-small text-on-surface-variant">
                {t('notifications.email.footer')}
              </p>
              <p className="text-body-small text-on-surface-variant tabular-nums">{formatDateTime(notification.createdAt)}</p>
            </div>
          </article>
        </DialogContent>
      )}
    </Dialog>
  );
}
