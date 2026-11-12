import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { Icon } from '@/components/ui/Icon';
import { toast } from '@/components/ui/toast-store';
import {
  groupOf,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
  notificationsFor,
  type NotificationGroup,
} from '@/lib/notifications';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { AppNotification } from '@/types/domain';
import { EmailPreviewDialog } from './EmailPreviewDialog';
import { NotificationItem } from './NotificationItem';
import { useMyPreferences } from '@/features/preferences/use-preferences';
import { shownInApp } from '@/lib/preferences';

type ReadFilter = 'all' | 'unread';
const READ_FILTERS: ReadFilter[] = ['all', 'unread'];
const GROUPS: NotificationGroup[] = ['today', 'week', 'earlier'];

/**
 * G9, notifications center (F7): every notice of the signed-in person, newest first and grouped
 * by when it arrived, with filters (all or unread, and by type), "Marcar todas como leídas" and,
 * per notice, read state and the email preview. Each person only ever sees their own notices.
 */
export function NotificationsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const all = useDataStore((s) => s.notifications);
  const markAll = useDataStore((s) => s.markAllNotificationsRead);
  const [read, setRead] = useState<ReadFilter>('all');
  const [category, setCategory] = useState('all');
  const [preview, setPreview] = useState<AppNotification | null>(null);
  const personId = user?.personId ?? '';

  const prefs = useMyPreferences();
  // F17: the kinds the person moved to email only do not show in the app
  const mine = useMemo(
    () => notificationsFor(all, personId).filter((n) => !prefs || shownInApp(n, prefs)),
    [all, personId, prefs],
  );
  const unread = mine.filter((n) => !n.readAt).length;
  const shown = mine.filter(
    (n) =>
      (read === 'all' || !n.readAt) && (category === 'all' || NOTIFICATION_TYPES[n.type].category === category),
  );
  const countIn = (c: string) => mine.filter((n) => NOTIFICATION_TYPES[n.type].category === c).length;

  const empty =
    mine.length === 0
      ? { title: t('notifications.emptyTitle'), body: t('notifications.emptyBody') }
      : read === 'unread' && category === 'all'
        ? { title: t('notifications.emptyUnreadTitle'), body: t('notifications.emptyUnreadBody') }
        : { title: t('notifications.emptyFilterTitle'), body: t('notifications.emptyFilterBody') };

  return (
    <div className="flex flex-col">
      <PageHeader
        title={t('notifications.title')}
        description={t('notifications.description')}
        actions={
          unread > 0 ? (
            <Button
              variant="outlined"
              leadingIcon="done_all"
              onClick={() => {
                markAll(personId);
                toast.success(t('notifications.markedAll'));
              }}
            >
              {t('notifications.markAll')}
            </Button>
          ) : undefined
        }
      />

      <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding)">
        {/* Filters as in the other listings (A2, S1, D-78, D-107): from 640 px, read state as chips and
            the type menu on the right; on phones, both as menus side by side. */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <div
            role="group"
            aria-label={t('notifications.filters.read')}
            className="hidden flex-wrap items-center gap-3 sm:flex"
          >
            {READ_FILTERS.map((value) => (
              <FilterChip
                key={value}
                label={t(`notifications.filters.${value}`)}
                count={value === 'all' ? mine.length : unread}
                selected={read === value}
                onClick={() => setRead(value)}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:items-center">
            <FilterMenu
              label={t('notifications.filters.read')}
              value={read}
              onChange={(value) => setRead(value as ReadFilter)}
              options={READ_FILTERS.map((value) => ({
                value,
                label: t(`notifications.filters.${value}`),
                count: value === 'all' ? mine.length : unread,
              }))}
              className="sm:hidden"
            />
            <FilterMenu
              label={t('notifications.filters.category')}
              value={category}
              onChange={setCategory}
              options={[
                { value: 'all', label: t('notifications.filters.anyCategory'), count: mine.length },
                ...NOTIFICATION_CATEGORIES.map((c) => ({
                  value: c,
                  label: t(`notifications.categories.${c}`),
                  count: countIn(c),
                })),
              ]}
            />
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
              <Icon name="notifications" size={24} />
            </span>
            <h2 className="text-title-medium text-on-surface">{empty.title}</h2>
            <p className="text-body-medium text-on-surface-variant">{empty.body}</p>
          </div>
        ) : (
          // 32 px between groups, 8 px between a group title and its rows (8 px rhythm, D-69).
          <div className="flex flex-col gap-8 border-t border-outline-variant pt-4">
            {GROUPS.map((group) => {
              const items = shown.filter((n) => groupOf(n) === group);
              if (!items.length) return null;
              return (
                <section key={group} aria-labelledby={`nt-group-${group}`} className="flex flex-col gap-2">
                  <h2 id={`nt-group-${group}`} className="text-title-small text-on-surface-variant">
                    {t(`notifications.groups.${group}`)}
                  </h2>
                  <ul className="-mx-2 flex flex-col">
                    {items.map((n) => (
                      <NotificationItem key={n.id} notification={n} onPreviewEmail={setPreview} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </section>

      <EmailPreviewDialog notification={preview} onOpenChange={(open) => !open && setPreview(null)} />
    </div>
  );
}
