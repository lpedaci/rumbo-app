import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { toast } from '@/components/ui/toast-store';
import { AuthLayout } from '@/features/auth/AuthLayout';
import { signOut } from '@/features/auth/auth-service';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { homePath } from '@/lib/permissions';
import { hasConsent } from '@/lib/privacy';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser, useSessionStore } from '@/store/session-store';

interface NoticeStep {
  title: string;
  icon: IconName;
  items: string[];
}

/**
 * G8 · Privacy notice and consent (F10), the first time a person signs in or when the notice
 * changes version. A short flow in 4 steps (what data, what for, who sees it, how long and
 * rights) with progress dots, like the guided welcome (2.2.1 pattern 9). Without accepting it
 * there is no way in: the only other way out is "Cerrar sesión". The acceptance is recorded
 * with its date and the notice version, and audited.
 */
export function ConsentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const policy = useDataStore((s) => s.securityPolicy);
  const consents = useDataStore((s) => s.consents);
  const returnTo = useSessionStore((s) => s.returnTo);
  const reduce = useShouldReduceMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [checked, setChecked] = useState(false);
  const [tried, setTried] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (hasConsent(consents, user.personId, policy.privacyNoticeVersion)) return <Navigate to={homePath(user)} replace />;

  const steps = t('privacy.steps', {
    returnObjects: true,
    journeyYears: policy.retentionJourneyYears,
    selfReviewYears: policy.retentionSelfReviewYears,
  }) as NoticeStep[];
  const step = steps[index]!;
  const last = index === steps.length - 1;
  const go = (delta: number) => {
    setDirection(delta);
    setIndex((i) => Math.min(steps.length - 1, Math.max(0, i + delta)));
  };

  const accept = () => {
    setTried(true);
    if (!checked) {
      document.getElementById('consent-check')?.focus();
      return;
    }
    useDataStore.getState().acceptPrivacyNotice(user.personId, policy.privacyNoticeVersion);
    toast.success(t('privacy.consent.accepted'));
    navigate(returnTo && returnTo !== '/consent' ? returnTo : homePath(user), { replace: true });
  };

  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 24 * direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 * direction },
      };

  return (
    <AuthLayout>
      <div className="flex flex-col gap-2">
        <p className="text-label-large text-primary">{t('privacy.consent.eyebrow')}</p>
        <h1 className="text-headline-small text-on-surface">{t('privacy.consent.title')}</h1>
        <p className="text-body-large text-on-surface-variant">{t('privacy.consent.intro')}</p>
      </div>

      <section
        aria-labelledby="consent-step-title"
        className="flex min-w-0 flex-col gap-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding)"
      >
        <div className="flex items-center justify-between gap-3">
          <div aria-hidden className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <motion.span
                key={i}
                className={cn('h-2 rounded-full', i <= index ? 'bg-primary' : 'bg-outline-variant')}
                animate={{ width: i === index ? 20 : 8 }}
                transition={{ duration: reduce ? 0 : duration.medium, ease: easing.standard }}
              />
            ))}
          </div>
          <p className="text-body-small text-on-surface-variant tabular-nums" aria-live="polite">
            {t('privacy.consent.step', { n: index + 1, total: steps.length })} ·{' '}
            {t('privacy.noticeVersion', { version: policy.privacyNoticeVersion })}
          </p>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            {...slide}
            transition={{ duration: duration.long, ease: easing.emphasizedDecelerate }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              <IconTile icon={step.icon} />
              <h2 id="consent-step-title" className="text-title-large text-on-surface">
                {step.title}
              </h2>
            </div>
            <ul className="flex flex-col gap-3">
              {step.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-body-large text-on-surface">
                  <Icon name="check_circle" size={20} className="mt-0.5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>

        {last && (
          <div className="flex flex-col gap-2 border-t border-outline-variant pt-4">
            <Checkbox
              id="consent-check"
              label={t('privacy.consent.check')}
              checked={checked}
              aria-invalid={tried && !checked ? true : undefined}
              onChange={(event) => setChecked(event.target.checked)}
            />
            {tried && !checked && (
              <p role="alert" className="flex items-center gap-1.5 text-body-small text-error">
                <Icon name="error" size={16} />
                {t('privacy.consent.checkRequired')}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {/* Hidden on the first step: nothing to go back to (2.2.1). */}
          {index > 0 && (
            <Button variant="outlined" onClick={() => go(-1)} fullWidth className="sm:w-auto">
              {t('privacy.consent.previous')}
            </Button>
          )}
          {last ? (
            <Button leadingIcon="check" onClick={accept} fullWidth className="sm:w-auto">
              {t('privacy.consent.accept')}
            </Button>
          ) : (
            <Button onClick={() => go(1)} fullWidth className="sm:w-auto">
              {t('privacy.consent.next')}
            </Button>
          )}
        </div>
      </section>

      <div className="flex flex-col items-start gap-2">
        <p className="text-body-small text-on-surface-variant">{t('privacy.consent.signOutHelp')}</p>
        <Button
          variant="text"
          leadingIcon="logout"
          onClick={() => {
            signOut('manual');
            navigate('/login', { replace: true });
          }}
        >
          {t('privacy.consent.signOut')}
        </Button>
      </div>
    </AuthLayout>
  );
}
