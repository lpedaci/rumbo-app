import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Person } from '@/types/domain';

// Slow enough to read each step before it is checked (D-67).
const STEP_MS = 1200;

interface SsoSimulationProps {
  person: Person;
  providerName: string;
  /** Completes the simulated sign-in (goes on to the verification step). */
  onDone: () => void;
}

/**
 * Simulated SSO sign-in with the person's fictitious account (D-66): three steps are
 * checked one after the other (redirect, work account, identity confirmed) and the
 * flow continues on its own. Neutral on purpose: it never imitates the Microsoft or
 * Google pages (F0). "Continuar" is available from the start, so nobody has to wait;
 * with reduced motion every step shows at once.
 */
export function SsoSimulation({ person, providerName, onDone }: SsoSimulationProps) {
  const { t } = useTranslation();
  const reduce = useShouldReduceMotion();
  const steps = [
    t('auth.sso.steps.redirect', { provider: providerName }),
    t('auth.sso.steps.account', { email: person.email }),
    t('auth.sso.steps.verified', { provider: providerName }),
  ];
  const [done, setDone] = useState(reduce ? steps.length : 0);
  const finished = useRef(false);

  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    onDone();
  };

  useEffect(() => {
    const timer = window.setTimeout(
      () => (done < steps.length ? setDone(done + 1) : finish()),
      done < steps.length ? STEP_MS : STEP_MS + 400,
    );
    return () => window.clearTimeout(timer);
  });

  return (
    <div className="flex flex-col gap-6">
      {/* The fictitious account used for this sign-in */}
      <div className="flex min-w-0 items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
        <Avatar name={person.name} role={person.role} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-title-small text-on-surface">{person.name}</span>
          <span className="truncate text-body-small text-on-surface-variant">{person.email}</span>
        </div>
      </div>

      <ol className="flex flex-col gap-4" aria-label={t('auth.sso.stepsLabel', { provider: providerName })}>
        {steps.map((step, i) => {
          const checked = i < done;
          return (
            <li key={step} className="flex items-center gap-3 text-body-medium">
              <span className="flex size-6 shrink-0 items-center justify-center">
                {checked ? (
                  <motion.span
                    className="flex text-success"
                    initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: duration.medium, ease: easing.emphasizedDecelerate }}
                  >
                    <Icon name="check_circle" filled size={24} />
                  </motion.span>
                ) : (
                  // Static icons: no looping animation (2.6).
                  <Icon
                    name={i === done ? 'pending' : 'radio_button_unchecked'}
                    size={24}
                    className={cn(i === done ? 'text-primary' : 'text-on-surface-variant')}
                  />
                )}
              </span>
              <span className={checked ? 'text-on-surface' : 'text-on-surface-variant'}>{step}</span>
              <span className="sr-only">{checked ? t('auth.sso.stepDone') : t('auth.sso.stepPending')}</span>
            </li>
          );
        })}
      </ol>

      <p className="sr-only" aria-live="polite">
        {done >= steps.length ? t('auth.sso.allDone', { provider: providerName }) : ''}
      </p>

      <Button fullWidth size="m" className="md:h-12" trailingIcon="arrow_forward" onClick={finish}>
        {t('auth.sso.continue')}
      </Button>
    </div>
  );
}
