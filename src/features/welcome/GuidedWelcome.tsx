import { AnimatePresence, motion } from 'motion/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useOwnHire } from '@/features/journey/use-own-hire';
import { formatDate } from '@/lib/dates';
import { checkinDueDate, nextCheckin, nextTasks, progressOf } from '@/lib/journey';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser, useSessionStore } from '@/store/session-store';
import { CheckinIllustration, JourneyIllustration, TasksIllustration } from './HireWelcomeIllustrations';
import { hasGuidedWelcome } from './welcome-steps';

interface Step {
  title: string;
  body: string;
  illustration: ReactNode;
}

/**
 * Guided welcome (F16, 2.2.1 pattern 9, reference video original-d624f662): a 3-step
 * dialog the first time a person enters, with an illustration made of real components,
 * progress dots and "Anterior" / "Continuar". It can be skipped and opened again from
 * the navigation. Steps slide sideways; with reduced motion only opacity changes (2.6).
 */
export function GuidedWelcome() {
  const user = useCurrentUser();
  const seen = useSessionStore((s) => (user ? s.welcomeSeen.includes(user.personId) : true));
  const open = useSessionStore((s) => s.welcomeOpen);

  // First visit: open once the person is in (not over the session warning).
  useEffect(() => {
    if (user && hasGuidedWelcome(user.role) && !seen) useSessionStore.getState().setWelcomeOpen(true);
  }, [user, seen]);

  if (!user || !hasGuidedWelcome(user.role) || !open) return null;
  return <HireWelcome personId={user.personId} />;
}

function HireWelcome({ personId }: { personId: string }) {
  const { t } = useTranslation();
  const reduce = useShouldReduceMotion();
  const hire = useOwnHire();
  const people = useDataStore((s) => s.people);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const person = people.find((p) => p.id === personId);
  const manager = people.find((p) => p.id === hire?.managerId);
  const progress = hire ? progressOf(hire.tasks) : { done: 0, total: 0, percent: 0 };
  const checkin = hire ? nextCheckin(hire) : undefined;
  const tasks = hire?.tasks ?? [];
  const lastDone = tasks.filter((x) => x.status === 'done').at(-1)?.title ?? '';
  const nextOpen = nextTasks(tasks)[0]?.title ?? '';
  const firstName = person?.name.split(' ')[0] ?? '';

  const steps: Step[] = [
    {
      title: t('welcome.hire.steps.0.title', { name: firstName }),
      body: t('welcome.hire.steps.0.body'),
      illustration: (
        <JourneyIllustration
          name={person?.name ?? ''}
          jobTitle={person?.jobTitle ?? ''}
          done={progress.done}
          total={progress.total}
          reduce={reduce}
        />
      ),
    },
    {
      title: t('welcome.hire.steps.1.title'),
      body: t('welcome.hire.steps.1.body'),
      illustration: <TasksIllustration reduce={reduce} done={lastDone} next={nextOpen} />,
    },
    {
      title: t('welcome.hire.steps.2.title'),
      body: t('welcome.hire.steps.2.body'),
      illustration: (
        <CheckinIllustration
          reduce={reduce}
          date={checkin ? formatDate(checkinDueDate(checkin)) : ''}
          manager={manager?.name ?? ''}
        />
      ),
    },
  ];
  const step = steps[index]!;
  const last = index === steps.length - 1;

  const close = () => useSessionStore.getState().markWelcomeSeen(personId);
  const go = (delta: 1 | -1) => {
    setDirection(delta);
    setIndex((i) => Math.min(steps.length - 1, Math.max(0, i + delta)));
  };

  const slide = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 24 * direction },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 * direction },
      };

  return (
    <DialogPrimitive.Root open onOpenChange={(next) => !next && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-scrim/32 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby="welcome-body"
          className={cn(
            'fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl bg-surface-container-lowest shadow-elevation-2',
            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          )}
        >
          {/* Illustration zone: flat surface, no gradient (the video fades it out; here it is solid). */}
          <div className="relative flex h-56 shrink-0 items-center justify-center overflow-hidden rounded-t-xl bg-surface-container">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                {...slide}
                transition={{ duration: duration.long, ease: easing.emphasizedDecelerate }}
                className="flex items-center justify-center"
              >
                {step.illustration}
              </motion.div>
            </AnimatePresence>
            <DialogPrimitive.Close asChild>
              <IconButton icon="close" label={t('welcome.close')} className="absolute top-2 right-2" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex flex-col items-center gap-4 px-6 pt-5 pb-6 text-center">
            <div aria-hidden className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <motion.span
                  key={i}
                  className={cn('h-2 rounded-full', i === index ? 'bg-primary' : 'bg-outline-variant')}
                  animate={{ width: i === index ? 20 : 8 }}
                  transition={{ duration: reduce ? 0 : duration.medium, ease: easing.standard }}
                />
              ))}
            </div>
            <p className="sr-only" aria-live="polite">
              {t('welcome.stepOf', { current: index + 1, total: steps.length })}
            </p>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.medium }}
                className="flex flex-col gap-2"
              >
                <DialogPrimitive.Title className="text-title-large text-on-surface">{step.title}</DialogPrimitive.Title>
                <DialogPrimitive.Description id="welcome-body" className="text-body-medium text-on-surface-variant">
                  {step.body}
                </DialogPrimitive.Description>
              </motion.div>
            </AnimatePresence>

            <div className="flex w-full flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="text" onClick={close} fullWidth className="sm:w-auto">
                {t('welcome.skip')}
              </Button>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                {/* Hidden on the first step (2.2.1): nothing to go back to. */}
                {index > 0 && (
                  <Button variant="outlined" onClick={() => go(-1)} fullWidth className="sm:w-auto">
                    {t('welcome.previous')}
                  </Button>
                )}
                <Button onClick={() => (last ? close() : go(1))} fullWidth className="sm:w-auto">
                  {last ? t('welcome.hire.finish') : t('welcome.next')}
                </Button>
              </div>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
