import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { StatusPill } from '@/components/ui/StatusPill';
import { toast } from '@/components/ui/toast-store';
import { findDemoPerson, mfaRequired } from '@/features/auth/auth-service';
import { formatDate } from '@/lib/dates';
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
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={person.name} role={person.role} size="lg" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-title-medium text-on-surface">{person.name}</span>
              <span className="truncate text-body-medium text-on-surface-variant">{person.email}</span>
              <span className="text-body-small text-on-surface-variant">
                {t(`roles.${user.role}`)} · {person.jobTitle}
              </span>
            </div>
          </div>
          <p className="flex items-center gap-2 text-body-medium text-on-surface-variant">
            <Icon name="key" />
            {t('security.signedInWith', { method: t(`auth.methods.${user.method}`) })}
          </p>
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
