import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { BentoCard } from '@/components/ui/BentoCard';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { daysBetween, DEMO_TODAY, formatDate, formatPercent, STAGES } from '@/lib/dates';
import {
  CHECKIN_OFFSETS,
  checkinDueDate,
  currentStage,
  nextCheckin,
  nextTasks,
  progressByStage,
  progressOf,
} from '@/lib/journey';
import { canCompleteTask } from '@/lib/permissions';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { HireTask, Person } from '@/types/domain';
import { TaskRow } from './TaskRow';
import { UNLOCK_HIGHLIGHT_MS } from './task-meta';
import { useCompleteTask } from './use-complete-task';
import { useOwnHire } from './use-own-hire';

/**
 * N1 · Mi recorrido (CLAUDE.md F1): what to do, with whom and by when.
 * Bento layout (2.4): next tasks first, then progress, check-in, contacts and the
 * full journey by stage (reference original-cf59fe35 for the progress checklist).
 */
export function JourneyPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const hire = useOwnHire();
  const people = useDataStore((s) => s.people);
  const complete = useCompleteTask();
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const highlightTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);

  const person = people.find((p) => p.id === user?.personId);
  const firstName = person?.name.split(' ')[0] ?? '';

  if (!hire) {
    return (
      <>
        <PageHeader title={t('journey.title')} eyebrow={t('journey.greeting', { name: firstName })} />
        <InlineAlert tone="info">{t('journey.noHire')}</InlineAlert>
      </>
    );
  }

  const onComplete = (task: HireTask) => {
    const unlocked = complete(hire, task);
    if (unlocked.length > 0) {
      setHighlighted(unlocked);
      window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlighted([]), UNLOCK_HIGHLIGHT_MS);
    }
  };

  const overall = progressOf(hire.tasks);
  const byStage = progressByStage(hire.tasks);
  const day = daysBetween(hire.startDate, DEMO_TODAY);
  const stage = currentStage(hire.startDate);
  const upNext = nextTasks(hire.tasks);
  const checkin = nextCheckin(hire);
  const findPerson = (id?: string) => people.find((p) => p.id === id);
  const contacts: { role: 'manager' | 'buddy' | 'hr'; person?: Person }[] = [
    { role: 'manager', person: findPerson(hire.managerId) },
    { role: 'buddy', person: findPerson(hire.buddyId) },
    { role: 'hr', person: findPerson(hire.hrId) },
  ];
  const rowProps = (task: HireTask) => ({
    task,
    allTasks: hire.tasks,
    to: `/me/tasks/${task.id}`,
    canComplete: canCompleteTask(user, hire, task),
    onComplete,
    highlighted: highlighted.includes(task.id),
  });

  return (
    <>
      <PageHeader
        eyebrow={t('journey.greeting', { name: firstName })}
        title={t('journey.title')}
        description={
          day < 0
            ? t('journey.beforeStart', { date: formatDate(hire.startDate) })
            : t('journey.dayOf', { day, stage: t(`stages.${stage}`) })
        }
      />

      <BentoGrid>
        <BentoCard size="lg" title={t('journey.next.title')} description={t('journey.next.description')}>
          {upNext.length > 0 ? (
            <ul className="flex flex-col divide-y divide-outline-variant">
              {upNext.map((task) => (
                <TaskRow key={task.id} {...rowProps(task)} />
              ))}
            </ul>
          ) : (
            <p className="text-body-medium text-on-surface-variant">{t('journey.next.empty')}</p>
          )}
        </BentoCard>

        <BentoCard size="md" title={t('journey.progress.title')}>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-display-small text-on-surface tabular-nums">{formatPercent(overall.percent)}</p>
              <p className="text-body-small text-on-surface-variant">
                {t('journey.progress.tasksDone', { done: overall.done, total: overall.total })}
              </p>
            </div>
            <ProgressBar value={overall.percent} label={t('journey.progress.overall')} />
            <ul className="flex flex-col gap-3">
              {STAGES.map((s) => (
                <li key={s} className="flex flex-col gap-1">
                  <span className="flex items-center justify-between gap-2 text-label-medium text-on-surface">
                    {t(`stages.${s}`)}
                    {s === stage && day >= 0 && (
                      <span className="text-label-small text-primary">{t('journey.progress.current')}</span>
                    )}
                  </span>
                  <ProgressBar
                    value={byStage[s].percent}
                    label={t('journey.progress.stage', { stage: t(`stages.${s}`) })}
                    valueText={`${byStage[s].done}/${byStage[s].total}`}
                    tone={byStage[s].percent === 100 ? 'success' : 'primary'}
                  />
                </li>
              ))}
            </ul>
          </div>
        </BentoCard>

        <BentoCard size="md" title={t('journey.checkin.title')}>
          {checkin ? (
            <div className="flex h-full flex-col gap-3">
              <p className="text-title-small text-on-surface">
                {t('journey.checkin.when', {
                  days: CHECKIN_OFFSETS[checkin.stage],
                  date: formatDate(checkinDueDate(checkin)),
                })}
              </p>
              <p className="text-body-medium text-on-surface-variant">
                {checkin.status === 'pending' ? t('journey.checkin.pending') : t('journey.checkin.hireDone')}
              </p>
              <Button asChild variant={checkin.status === 'pending' ? 'tonal' : 'outlined'} className="mt-auto w-fit">
                <Link to={`/me/checkin/${checkin.stage}`}>
                  {checkin.status === 'pending' ? t('journey.checkin.respond') : t('journey.checkin.review')}
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-body-medium text-on-surface-variant">{t('journey.checkin.none')}</p>
          )}
        </BentoCard>

        <BentoCard size="lg" title={t('journey.contacts.title')}>
          <ul className="flex flex-col divide-y divide-outline-variant">
            {contacts.map(({ role, person: contact }) =>
              contact ? (
                <li key={role} className="flex min-w-0 flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={contact.name} />
                    <div className="flex min-w-0 flex-col">
                      <span className="text-label-medium text-on-surface-variant">{t(`journey.contacts.${role}`)}</span>
                      <span className="truncate text-title-small text-on-surface">{contact.name}</span>
                      <span className="truncate text-body-small text-on-surface-variant">{contact.jobTitle}</span>
                    </div>
                  </div>
                  <a
                    href={`mailto:${contact.email}`}
                    title={contact.email}
                    className="inline-flex min-h-12 min-w-0 items-center gap-2 text-body-medium text-primary underline-offset-4 hover:underline sm:min-h-0"
                  >
                    <Icon name="mail" className="shrink-0" />
                    <span className="truncate">{contact.email}</span>
                    <span className="sr-only">: {t('journey.contacts.email', { name: contact.name })}</span>
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </BentoCard>

        <BentoCard size="wide" title={t('journey.all.title')} description={t('journey.all.description')}>
          <div className="flex flex-col gap-6">
            {STAGES.map((s) => {
              const tasks = hire.tasks.filter((task) => task.stage === s);
              if (tasks.length === 0) return null;
              return (
                <section key={s} aria-labelledby={`stage-${s}`} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-outline-variant pb-2">
                    <h3 id={`stage-${s}`} className="text-title-medium text-on-surface">
                      {t(`stages.${s}`)}
                    </h3>
                    <span className="text-body-small text-on-surface-variant tabular-nums">
                      {t('journey.all.stageCount', { done: byStage[s].done, total: byStage[s].total })}
                    </span>
                  </div>
                  <ul className="flex flex-col divide-y divide-outline-variant">
                    {tasks.map((task) => (
                      <TaskRow key={task.id} {...rowProps(task)} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </BentoCard>
      </BentoGrid>
    </>
  );
}
