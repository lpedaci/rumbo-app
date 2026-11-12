import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { toast } from '@/components/ui/toast-store';
import { formatDateTime } from '@/lib/dates';
import { useDataStore } from '@/store/data-store';
import type { DeviceSession, LoginAlert } from '@/types/domain';
import { SessionRow } from './SessionRow';

/**
 * F11 in Mi seguridad (G5): the pending "¿Fuiste tú?" alerts on top, then the active sessions
 * of the person with "Cerrar esta sesión" and "Cerrar sesión en todos los demás dispositivos".
 * "No fui yo" closes that session and opens an urgent request for IT; the screen then says
 * what happened and how to reach the help desk.
 */
export function MySessions({ personId }: { personId: string }) {
  const { t } = useTranslation();
  const all = useDataStore((s) => s.deviceSessions);
  const alerts = useDataStore((s) => s.loginAlerts);
  const [toRevoke, setToRevoke] = useState<DeviceSession | null>(null);
  const [revokeOthers, setRevokeOthers] = useState(false);
  const [reported, setReported] = useState<string | null>(null);
  const { hash } = useLocation();
  // Coming from the "¿Fuiste tú?" notification: go to the alert.
  useEffect(() => {
    if (hash === '#login-alerts') document.getElementById('login-alerts')?.scrollIntoView({ block: 'start' });
  }, [hash]);

  const sessions = all
    .filter((s) => s.personId === personId && !s.revokedAt)
    .sort((a, b) => Number(b.current) - Number(a.current) || b.lastSeenAt.localeCompare(a.lastSeenAt));
  const pending = alerts.filter((a) => a.personId === personId && a.status === 'pending');
  const others = sessions.filter((s) => !s.current);
  const sessionOf = (a: LoginAlert) => all.find((s) => s.id === a.sessionId);
  const store = useDataStore.getState;

  return (
    <div id="login-alerts" className="flex scroll-mt-24 flex-col gap-(--space-bento-gap) lg:col-span-2">
      {reported && (
        <InlineAlert tone="info" title={t('sessions.alert.reportedTitle')}>
          {t('sessions.alert.reportedBody', { id: reported })}
        </InlineAlert>
      )}

      {pending.map((alert) => {
        const s = sessionOf(alert);
        if (!s) return null;
        return (
          // "¿Fuiste tú?" (F11): a warning section, serious and without blame (2.9)
          <section
            key={alert.id}
            aria-labelledby={`alert-${alert.id}`}
            className="flex flex-col gap-4 rounded-xl border border-warning/40 bg-warning-container p-(--space-card-padding) text-on-warning-container"
          >
            <div className="flex items-start gap-3">
              <Icon name="gpp_maybe" size={24} className="shrink-0 text-warning" />
              <div className="flex min-w-0 flex-col gap-1">
                <h2 id={`alert-${alert.id}`} className="text-title-medium">
                  {t('sessions.alert.title')}
                </h2>
                <p className="text-body-medium">
                  {t('sessions.alert.body', {
                    device: `${s.device} · ${s.browser}`,
                    place: s.approxLocation,
                    date: formatDateTime(s.startedAt),
                  })}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outlined"
                onClick={() => {
                  store().confirmLoginAlert(alert.id);
                  toast.success(t('sessions.alert.confirmed'));
                }}
              >
                {t('sessions.alert.yes')}
              </Button>
              <Button
                leadingIcon="gpp_maybe"
                onClick={() => {
                  const id = store().reportLoginAlert(alert.id);
                  if (id) setReported(id);
                }}
              >
                {t('sessions.alert.no')}
              </Button>
            </div>
          </section>
        );
      })}

      <Card
        title={t('sessions.title')}
        description={t('sessions.description')}
      >
        <ul className="-mx-2 flex flex-col">
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              action={
                s.current ? (
                  <span className="text-body-small text-on-surface-variant">{t('sessions.currentHelp')}</span>
                ) : (
                  <Button variant="outlined" size="xs" onClick={() => setToRevoke(s)}>
                    {t('sessions.revoke')}
                  </Button>
                )
              }
            />
          ))}
        </ul>
        {/* Under the list, so the card description keeps its width */}
        {others.length > 0 ? (
          <Button
            variant="outlined"
            leadingIcon="logout"
            onClick={() => setRevokeOthers(true)}
            className="w-fit max-sm:w-full"
          >
            {t('sessions.revokeOthers')}
          </Button>
        ) : (
          <p className="text-body-small text-on-surface-variant">{t('sessions.onlyThis')}</p>
        )}
      </Card>

      <ConfirmDialog
        open={toRevoke !== null}
        onOpenChange={(open) => !open && setToRevoke(null)}
        title={t('sessions.revokeTitle', { device: toRevoke?.device ?? '' })}
        description={t('sessions.revokeBody')}
        confirmLabel={t('sessions.revokeConfirm', { device: toRevoke?.device ?? '' })}
        onConfirm={() => {
          if (!toRevoke) return;
          store().revokeSession(toRevoke.id, personId);
          toast.success(t('sessions.revoked', { device: toRevoke.device }));
        }}
      />
      <ConfirmDialog
        open={revokeOthers}
        onOpenChange={setRevokeOthers}
        title={t('sessions.revokeOthersTitle')}
        description={t('sessions.revokeOthersBody')}
        confirmLabel={t('sessions.revokeOthersConfirm')}
        onConfirm={() => {
          store().revokeOtherSessions(personId, personId);
          toast.success(t('sessions.revokedOthers'));
        }}
      />
    </div>
  );
}
