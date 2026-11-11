import { useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { GreetingHeader } from '@/components/layout/GreetingHeader';
import { BentoCard } from '@/components/ui/BentoCard';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { KpiCard, KpiRow } from '@/components/ui/KpiCard';
import { RefChip } from '@/components/ui/RefChip';
import { daysBetween, DEMO_TODAY, formatDate, formatLongDate, formatNumber, formatPercent, STAGES } from '@/lib/dates';
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
import { useMediaQuery } from '@/lib/use-media-query';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { HireTask, Person } from '@/types/domain';
import { ContactCard } from './ContactCard';
import { FoldedDoneTasks } from './FoldedDoneTasks';
import { JourneyTimeline } from './JourneyTimeline';
import { NextStepRow } from './NextStepRow';
import { TaskRow } from './TaskRow';
import { UNLOCK_HIGHLIGHT_MS } from './task-meta';
import { useCompleteTask } from './use-complete-task';
import { useOwnHire } from './use-own-hire';

/** Length of the journey in days (end of the "Días 30 a 90" stage). */
const JOURNEY_DAYS = 90;

/**
 * N1 · Mi recorrido (CLAUDE.md F1): what to do, with whom and by when.
 * Redesign 2.2.1: greeting as title, KPI row with sparkline, journey card with segmented
 * progress and next steps (reference original-cf59fe35), progress by stage, check-in,
 * key contacts and the full journey by stage.
 */
export function JourneyPage() {
  const { t, i18n } = useTranslation();
  const wide = useMediaQuery('(min-width: 64rem)', false);
  const user = useCurrentUser();
  const hire = useOwnHire();
  const people = useDataStore((s) => s.people);
  const complete = useCompleteTask();
  const [highlighted, setHighlighted] = useState<string[]>([]);
  // Completed during this visit: they stay unfolded until the next visit.
  const [recentlyDone, setRecentlyDone] = useState<string[]>([]);
  const highlightTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(highlightTimer.current), []);

  const person = people.find((p) => p.id === user?.personId);
  const firstName = person?.name.split(' ')[0] ?? '';
  const greeting = t(`journey.greetings.${greetingKey()}`);
  const today = formatLongDate(DEMO_TODAY, i18n.language === 'en' ? 'en' : 'es');

  if (!hire) {
    return (
      <>
        <GreetingHeader date={today} greeting={greeting} name={firstName} facts={[]} />
        <InlineAlert tone="info">{t('journey.noHire')}</InlineAlert>
      </>
    );
  }

  const onComplete = (task: HireTask) => {
    setRecentlyDone((ids) => [...ids, task.id]);
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
      <GreetingHeader
        date={today}
        greeting={greeting}
        name={firstName}
        facts={[
          day < 0
            ? { icon: 'route', label: t('journey.facts.startsOn', { date: formatDate(hire.startDate) }) }
            : { icon: 'route', label: t('journey.facts.day', { day, total: JOURNEY_DAYS }) },
          ...(day >= 0
            ? [{ icon: 'flag' as const, label: t('journey.facts.stage', { stage: t(`stages.${stage}`) }) }]
            : []),
          ...(checkin && checkinIn !== null
            ? [
                {
                  icon: 'event' as const,
                  tone: 'accent' as const,
                  label:
                    checkinIn <= 0 ? t('journey.facts.checkinToday') : t('journey.facts.checkin', { count: checkinIn }),
                },
              ]
            : []),
        ]}
      />

      <BentoGrid>
        {/* KPI row (2.2.1 pattern 3, reference ad2d9e23) */}
        <KpiRow>
          <KpiCard
            label={t('journey.kpi.progress')}
            value={formatPercent(overall.percent)}
            icon="route"
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
            trend={
              checkin
                ? { tone: 'neutral', icon: 'calendar_today', label: formatDate(checkinDueDate(checkin)) }
                : undefined
            }
          />
        </KpiRow>

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
            <p
              className={cn(
                'flex items-start gap-2 text-body-medium',
                ownOverdue > 0 ? 'text-on-surface' : 'text-on-surface-variant',
              )}
            >
              <Icon
                name={ownOverdue > 0 ? 'error' : 'check_circle'}
                filled={ownOverdue === 0}
                className={cn('mt-px shrink-0', ownOverdue > 0 ? 'text-error' : 'text-success')}
              />
              <span>
                {ownOverdue > 0 ? (
                  <Trans
                    i18nKey="journey.timeline.overdue"
                    count={ownOverdue}
                    components={{ next: <RefChip icon="arrow_downward" targetId="journey-next" /> }}
                  />
                ) : (
                  t('journey.timeline.onTrack')
                )}
              </span>
            </p>
            <JourneyTimeline byStage={byStage} stage={stage} day={day} />
            {/* Its own block under the timeline: a divider and air so the heading is not lost (D-97) */}
            <div className="mt-2 flex flex-col gap-3 border-t border-outline-variant pt-5">
              <h3
                id="journey-next"
                tabIndex={-1}
                className="scroll-mt-28 text-title-small text-on-surface outline-none"
              >
                {t('journey.next.title')}
              </h3>
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

        {/* Full row on tablet with two inner columns, so there is no empty half row (D-68). */}
        <BentoCard
          size="md"
          className="md:col-span-6 xl:col-span-4"
          title={t('journey.checkin.title')}
          icon={<IconTile icon="event" tone="tertiary" />}
        >
          {checkin ? (
            <div className="flex h-full flex-col gap-3 md:grid md:grid-cols-2 md:content-start md:gap-x-8 xl:flex">
              <p className="text-title-small text-on-surface">
                {t('journey.checkin.when', {
                  days: CHECKIN_OFFSETS[checkin.stage],
                  date: formatDate(checkinDueDate(checkin)),
                })}
              </p>
              <p className="text-body-medium text-on-surface-variant">
                {checkin.status === 'pending' ? t('journey.checkin.pending') : t('journey.checkin.hireDone')}
              </p>
              {checkin.milestones.length > 0 && (
                <div className="flex flex-col gap-1.5 md:col-start-2 md:row-span-3 md:row-start-1">
                  <h3 className="text-title-small text-on-surface">{t('journey.checkin.milestones')}</h3>
                  <ul className="flex flex-col gap-1.5">
                    {checkin.milestones.map((milestone) => (
                      <li key={milestone.id} className="flex items-start gap-2 text-body-small text-on-surface-variant">
                        <Icon name="flag" size={16} className="mt-px shrink-0 text-tertiary" />
                        <span>{milestone.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                asChild
                variant={checkin.status === 'pending' ? 'tonal' : 'outlined'}
                className="mt-auto w-fit md:mt-0 xl:mt-auto"
              >
                <Link to={`/me/checkin/${checkin.stage}`}>
                  {checkin.status === 'pending' ? t('journey.checkin.respond') : t('journey.checkin.review')}
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-body-medium text-on-surface-variant">{t('journey.checkin.none')}</p>
          )}
        </BentoCard>

        <BentoCard
          size="wide"
          title={t('journey.contacts.title')}
          description={wide ? undefined : t('journey.contacts.hint')}
        >
          {/* Compact: avatar, name and relation; tapping opens job title and email. */}
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {contacts.map(({ role, person: contact }) =>
              contact ? <ContactCard key={role} person={contact} relation={t(`journey.contacts.${role}`)} /> : null,
            )}
          </ul>
        </BentoCard>

        <BentoCard size="wide" title={t('journey.all.title')} description={t('journey.all.description')}>
          <div className="flex flex-col gap-6">
            {STAGES.map((s) => {
              const tasks = hire.tasks.filter((task) => task.stage === s);
              if (tasks.length === 0) return null;
              const folded = tasks.filter((task) => task.status === 'done' && !recentlyDone.includes(task.id));
              const open = tasks.filter((task) => !folded.includes(task));
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
                  {/* Tasks still to do stay in view; done ones fold (a task just completed
                      stays visible in this session so its check animation can be seen). */}
                  {open.length > 0 && (
                    <ul className="flex flex-col divide-y divide-outline-variant">
                      {open.map((task) => (
                        <TaskRow key={task.id} {...rowProps(task)} />
                      ))}
                    </ul>
                  )}
                  <FoldedDoneTasks count={folded.length}>
                    {folded.map((task) => (
                      <TaskRow key={task.id} {...rowProps(task)} />
                    ))}
                  </FoldedDoneTasks>
                </section>
              );
            })}
          </div>
        </BentoCard>
      </BentoGrid>
    </>
  );
}
