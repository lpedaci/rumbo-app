import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { BentoCard } from '@/components/ui/BentoCard';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SegmentedProgress } from '@/components/ui/SegmentedProgress';
import { StatusPill } from '@/components/ui/StatusPill';
import { daysBetween, DEMO_TODAY, formatDate, formatNumber, formatPercent, STAGES } from '@/lib/dates';
import {
  CHECKIN_OFFSETS,
  checkinDueDate,
  completionSeries,
  currentStage,
  doneInLastDays,
  greetingKey,
  nextCheckin,
  nextTasks,
  progressByStage,
  progressOf,
  taskStatus,
} from '@/lib/journey';
import { canCompleteTask } from '@/lib/permissions';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { HireTask, Person } from '@/types/domain';
import { NextStepRow } from './NextStepRow';
import { TaskRow } from './TaskRow';
import { UNLOCK_HIGHLIGHT_MS } from './task-meta';
import { useCompleteTask } from './use-complete-task';
import { useOwnHire } from './use-own-hire';

/**
 * N1 · Mi recorrido (CLAUDE.md F1): what to do, with whom and by when.
 * Redesign 2.2.1: greeting as title, KPI row with sparkline, journey card with segmented
 * progress and next steps (reference original-cf59fe35), progress by stage, check-in,
 * key contacts and the full journey by stage.
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
  const greeting = t(`journey.greetings.${greetingKey()}`, { name: firstName });

  if (!hire) {
    return (
      <>
        <PageHeader title={greeting} />
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
  const ownPending = hire.tasks.filter((x) => x.owner === 'hire' && taskStatus(x, hire.tasks) !== 'done');
  const ownOverdue = ownPending.filter((x) => taskStatus(x, hire.tasks) === 'overdue').length;
  const monthDone = doneInLastDays(hire.tasks);
  const checkinIn = checkin ? daysBetween(DEMO_TODAY, checkinDueDate(checkin)) : null;
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
        title={greeting}
        description={
          day < 0
            ? t('journey.beforeStart', { date: formatDate(hire.startDate) })
            : t('journey.dayOf', { day, stage: t(`stages.${stage}`) })
        }
      />

      <BentoGrid>
        {/* KPI row (2.2.1, pattern 3) */}
        <KpiCard
          label={t('journey.kpi.progress')}
          value={formatPercent(overall.percent)}
          icon="route"
          caption={t('journey.kpi.progressCaption', { done: overall.done, total: overall.total })}
          trend={
            monthDone > 0
              ? { tone: 'success', icon: 'trending_up', label: t('journey.kpi.monthDone', { count: monthDone }) }
              : { tone: 'neutral', icon: 'trending_flat', label: t('journey.kpi.monthNone') }
          }
          series={completionSeries(hire.tasks)}
        />
        <KpiCard
          label={t('journey.kpi.pending')}
          value={formatNumber(ownPending.length)}
          icon="checklist"
          iconTone="secondary"
          caption={t('journey.kpi.pendingCaption')}
          trend={
            ownOverdue > 0
              ? { tone: 'error', icon: 'error', label: t('journey.kpi.overdue', { count: ownOverdue }) }
              : { tone: 'success', icon: 'check_circle', label: t('journey.kpi.upToDate') }
          }
        />
        <KpiCard
          label={t('journey.kpi.stage')}
          value={t(`stages.${stage}`)}
          icon="flag"
          iconTone="secondary"
          caption={t('journey.kpi.stageCaption', { day: Math.max(day, 0) })}
          trend={{
            tone: 'primary',
            icon: 'task_alt',
            label: t('journey.kpi.stageTrend', { done: byStage[stage].done, total: byStage[stage].total }),
          }}
        />
        <KpiCard
          label={t('journey.kpi.checkin')}
          value={
            checkinIn === null
              ? t('journey.kpi.none')
              : checkinIn <= 0
                ? t('journey.kpi.today')
                : t('journey.kpi.days', { count: checkinIn })
          }
          icon="event"
          iconTone="tertiary"
          caption={
            checkin
              ? t('journey.kpi.checkinCaption', {
                  days: CHECKIN_OFFSETS[checkin.stage],
                  date: formatDate(checkinDueDate(checkin)),
                })
              : undefined
          }
        />

        {/* Journey overview: segmented progress and next steps (2.2.1, pattern 10) */}
        <BentoCard
          size="lg"
          title={t('journey.overview.title')}
          icon={<IconTile icon="route" tone="brand" size="lg" />}
          description={
            overall.done === overall.total
              ? t('journey.overview.bodyDone')
              : t('journey.overview.body', {
                  done: overall.done,
                  total: overall.total,
                  left: overall.total - overall.done,
                })
          }
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <SegmentedProgress
                done={overall.done}
                total={overall.total}
                label={t('journey.progress.overall')}
                valueText={t('journey.progress.tasksDone', { done: overall.done, total: overall.total })}
              />
              <div aria-hidden className="flex flex-wrap gap-x-4 gap-y-1 text-body-small text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-primary" />
                  {t('journey.overview.legendDone')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-outline-variant" />
                  {t('journey.overview.legendPending')}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-title-small text-on-surface">{t('journey.next.title')}</h3>
              {upNext.length > 0 ? (
                <ul className="flex flex-col divide-y divide-outline-variant overflow-hidden rounded-lg border border-outline-variant">
                  {upNext.map((task) => (
                    <NextStepRow key={task.id} task={task} allTasks={hire.tasks} />
                  ))}
                </ul>
              ) : (
                <p className="text-body-medium text-on-surface-variant">{t('journey.next.empty')}</p>
              )}
            </div>
          </div>
        </BentoCard>

        <BentoCard size="md" title={t('journey.stagesCard.title')}>
          <ul className="flex flex-col gap-4">
            {STAGES.map((s) => {
              const isCurrent = s === stage && day >= 0;
              return (
                <li key={s} className="flex flex-col gap-1.5">
                  <span className="flex min-h-6 items-center justify-between gap-2 text-label-large text-on-surface">
                    {t(`stages.${s}`)}
                    {isCurrent && <StatusPill tone="primary" icon="flag" label={t('journey.progress.current')} />}
                  </span>
                  <ProgressBar
                    size="lg"
                    value={byStage[s].percent}
                    label={t('journey.progress.stage', { stage: t(`stages.${s}`) })}
                    valueText={`${byStage[s].done}/${byStage[s].total}`}
                    tone={byStage[s].percent === 100 ? 'success' : 'primary'}
                  />
                </li>
              );
            })}
          </ul>
        </BentoCard>

        <BentoCard
          size="md"
          title={t('journey.checkin.title')}
          icon={<IconTile icon="event" tone="tertiary" />}
        >
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
                <li
                  key={role}
                  className="flex min-w-0 flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={contact.name} role={contact.role} />
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
