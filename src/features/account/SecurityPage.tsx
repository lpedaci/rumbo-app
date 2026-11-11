import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar, ROLE_ACCENT } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/ui/StatusPill';
import { toast } from '@/components/ui/toast-store';
import { findDemoPerson, mfaRequired } from '@/features/auth/auth-service';
import { formatDate, formatDateTime } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser, useSessionStore } from '@/store/session-store';

/**
 * G5 · Mi seguridad: account, two-step verification (required or optional by role,
 * D-03) and remembered devices. Active sessions on other devices arrive in phase B (F11).
 */
export function SecurityPage() {
  const { t } = useTranslation();
  const user = useCurrentUser()!;
  const person = findDemoPerson(user.personId)!;
  // Subscribe to the policy so the page updates if it changes.
  useDataStore((s) => s.securityPolicy);
  const optOut = useSessionStore((s) => s.mfaOptOut.includes(user.personId));
  const rememberedUntil = useSessionStore((s) => s.rememberedDevices[user.personId]);

  const required = mfaRequired(person);
  const enabled = required || !optOut;

  const toggleMfa = () => {
    useSessionStore.getState().setMfaOptOut(user.personId, enabled);
    useDataStore.getState().logAudit({
      actorId: user.personId,
      action: enabled ? 'auth.mfa_disabled' : 'auth.mfa_enabled',
      result: 'success',
    });
    toast.success(enabled ? t('security.mfaDisabled') : t('security.mfaEnabled'));
  };

  const forgetDevice = () => {
    useSessionStore.getState().forgetDevice(user.personId);
    useDataStore.getState().logAudit({ actorId: user.personId, action: 'auth.device_forgotten', result: 'success' });
    toast.success(t('security.forgotten'));
  };

  return (
    <>
      <PageHeader title={t('security.title')} description={t('security.subtitle')} />
      <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-2">
        <Card title={t('security.accountTitle')}>
          {/* Who is signed in, then the facts as label and value rows (D-91) */}
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={person.name} role={person.role} size="lg" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="truncate text-title-medium text-on-surface">{person.name}</span>
              <span className="truncate text-body-medium text-on-surface-variant">{person.email}</span>
            </div>
            {/* The role on the right, in its color (D-95) */}
            <span
              className={cn(
                'inline-flex h-6 shrink-0 items-center self-start rounded-full px-2.5 text-label-medium',
                ROLE_ACCENT[person.role].chip,
              )}
            >
              {t(`roles.${user.role}`)}
            </span>
          </div>
          <dl className="flex flex-col border-t border-outline-variant">
            {[
              { icon: 'badge' as const, label: t('security.jobTitle'), value: `${person.jobTitle} · ${person.area}` },
              { icon: 'key' as const, label: t('security.method'), value: t(`auth.methods.${user.method}`) },
              { icon: 'schedule' as const, label: t('security.startedAt'), value: formatDateTime(user.startedAt) },
            ].map((row) => (
              <div
                key={row.label}
                className="flex min-w-0 flex-col gap-1 border-b border-outline-variant py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <dt className="flex shrink-0 items-center gap-2 text-body-medium text-on-surface-variant">
                  <Icon name={row.icon} size={20} />
                  {row.label}
                </dt>
                <dd
                  className="min-w-0 pl-7 text-body-medium break-words text-on-surface tabular-nums sm:truncate sm:pl-0 sm:text-right"
                  title={row.value}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card
          title={t('security.mfaTitle')}
          action={
            enabled ? (
              <StatusPill tone="success" icon="verified_user" label={t('security.mfaOn')} />
            ) : (
              <StatusPill tone="warning" icon="warning" label={t('security.mfaOff')} />
            )
          }
        >
          <p className="text-body-medium text-on-surface-variant">
            {required ? t('security.mfaRequired') : t('security.mfaOptional')}
          </p>
          <div>
            <Button
              variant={enabled ? 'outlined' : 'filled'}
              onClick={toggleMfa}
              disabledReason={required ? t('security.mfaRequiredReason') : undefined}
            >
              {enabled ? t('security.mfaDisable') : t('security.mfaEnable')}
            </Button>
          </div>
        </Card>

        <Card title={t('security.devicesTitle')} className="lg:col-span-2">
          {rememberedUntil ? (
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Icon name="devices" size={24} className="text-on-surface-variant" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-label-large text-on-surface">{t('security.thisDevice')}</span>
                  <span className="text-body-small text-on-surface-variant">
                    {t('security.deviceUntil', { date: formatDate(rememberedUntil) })}
                  </span>
                </div>
              </div>
              <Button variant="outlined" size="xs" onClick={forgetDevice}>
                {t('security.forget')}
              </Button>
            </div>
          ) : (
            <p className="text-body-medium text-on-surface-variant">{t('security.noDevices')}</p>
          )}
        </Card>
      </div>
    </>
  );
}
