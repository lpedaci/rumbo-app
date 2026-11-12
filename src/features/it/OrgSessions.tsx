import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { StatusPill } from '@/components/ui/StatusPill';
import { toast } from '@/components/ui/toast-store';
import { formatDateTime } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Person } from '@/types/domain';

const PANEL = 'rounded-xl border border-outline-variant bg-surface-container-lowest';

/**
 * S3 · Active sessions of the organization (F11), for IT: one row per person with their open
 * sessions (device, browser, place and last use) and "Forzar cierre", which closes all of them
 * and goes to the audit log. IT's own account is managed from Mi seguridad.
 */
export function OrgSessions() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const people = useDataStore((s) => s.people);
  const sessions = useDataStore((s) => s.deviceSessions);
  const alerts = useDataStore((s) => s.loginAlerts);
  const [toClose, setToClose] = useState<Person | null>(null);

  const active = sessions.filter((s) => !s.revokedAt);
  const owners = people
    .filter((p) => active.some((s) => s.personId === p.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const reportedSessions = new Set(alerts.filter((a) => a.status === 'reported').map((a) => a.sessionId));

  return (
    <section aria-labelledby="org-sessions-title" className={cn(PANEL, 'p-4 md:p-(--space-card-padding)')}>
      <div className="mb-4 flex flex-col gap-1">
        <h2 id="org-sessions-title" className="text-title-medium text-on-surface">
          {t('sessions.org.title')}
        </h2>
        <p className="text-body-small text-on-surface-variant">{t('sessions.org.description')}</p>
      </div>
      {owners.length === 0 ? (
        <p className="text-body-medium text-on-surface-variant">{t('sessions.org.empty')}</p>
      ) : (
        // List pattern (D-106): person on the left, their sessions in the middle, the action on the right
        <ul className="-mx-2 flex flex-col">
          {owners.map((p) => {
            const mine = active
              .filter((s) => s.personId === p.id)
              .sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
            const self = p.id === user?.personId;
            return (
              <li
                key={p.id}
                className="flex min-h-14 min-w-0 flex-col gap-3 border-b border-outline-variant px-2 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-4"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar name={p.name} role={p.role} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-title-small text-on-surface">{p.name}</span>
                    <span className="text-body-small text-on-surface-variant">
                      {t('sessions.org.count', { count: mine.length })}
                      {/* The clarification goes under the name, never in the right column (D-115) */}
                      {self && <> · {t('sessions.org.yourAccount')}</>}
                    </span>
                    <ul className="flex flex-col gap-1">
                      {mine.map((s) => (
                        <li key={s.id} className="text-body-small text-on-surface tabular-nums">
                          {s.device} · {s.browser} · {s.approxLocation} ·{' '}
                          {s.current
                            ? t('sessions.activeNow')
                            : t('sessions.lastSeen', { date: formatDateTime(s.lastSeenAt) })}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                  {mine.some((s) => reportedSessions.has(s.id)) && (
                    <StatusPill tone="error" icon="gpp_maybe" label={t('sessions.org.unrecognized')} />
                  )}
                  {!self && (
                    <Button
                      variant="outlined"
                      size="xs"
                      leadingIcon="logout"
                      aria-label={t('sessions.org.forceLabel', { name: p.name })}
                      onClick={() => setToClose(p)}
                    >
                      {t('sessions.org.force')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={toClose !== null}
        onOpenChange={(open) => !open && setToClose(null)}
        title={t('sessions.org.forceTitle', { name: toClose?.name ?? '' })}
        description={t('sessions.org.forceBody')}
        confirmLabel={t('sessions.org.forceConfirm')}
        destructive
        onConfirm={() => {
          if (!toClose || !user) return;
          useDataStore.getState().revokeOtherSessions(toClose.id, user.personId, true);
          toast.success(t('sessions.org.forced', { name: toClose.name }));
        }}
      />
    </section>
  );
}
