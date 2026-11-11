import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Icon, type IconName } from '@/components/ui/Icon';
import { KpiCard, KpiRow } from '@/components/ui/KpiCard';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { TaskRow } from '@/features/journey/TaskRow';
import { useCompleteTask } from '@/features/journey/use-complete-task';
import { DEMO_TODAY, daysBetween, formatDate, formatPercent, STAGES } from '@/lib/dates';
import { summarizeHire } from '@/lib/hires';
import { CHECKIN_OFFSETS, checkinDueDate, progressByStage } from '@/lib/journey';
import { can, canCompleteTask, canViewHire } from '@/lib/permissions';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Checkin, MilestoneResult } from '@/types/domain';
import { HireStatusPill } from './HireStatusPill';

const RESULT: Record<MilestoneResult, { tone: StatusTone; icon: IconName }> = {
  met: { tone: 'success', icon: 'check_circle' },
  partial: { tone: 'warning', icon: 'pending' },
  not_met: { tone: 'error', icon: 'error' },
};
const CHECKIN_STATUS: Record<Checkin['status'], { tone: StatusTone; icon: IconName }> = {
  pending: { tone: 'neutral', icon: 'schedule' },
  hire_done: { tone: 'info', icon: 'fact_check' },
  completed: { tone: 'success', icon: 'check_circle' },
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-baseline justify-between gap-4 border-b border-outline-variant py-3 last:border-b-0">
      <dt className="shrink-0 text-body-medium text-on-surface-variant">{label}</dt>
      <dd className="min-w-0 truncate text-right text-body-medium text-on-surface" title={value}>
        {value}
      </dd>
    </div>
  );
}

/**
 * A4 · Hire record (CLAUDE.md F3, F5): data, journey with statuses and check-in history.
 * HR can mark as done tasks of any owner (IT, Facilities, buddy), as section 4 requires.
 * The self-review is visible here because HR may see it (least privilege, F0).
 */
export function HireDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const user = useCurrentUser();
  const hires = useDataStore((s) => s.hires);
  const people = useDataStore((s) => s.people);
  const templates = useDataStore((s) => s.templates);
  const complete = useCompleteTask();
  const [unlocked, setUnlocked] = useState<string[]>([]);

  const hire = hires.find((h) => h.id === id);
  if (!hire || !canViewHire(user, hire)) return <AccessDeniedPage reason="not_found" />;

  const s = summarizeHire(hire, people, templates);
  const nameOf = (personId?: string) => people.find((p) => p.id === personId)?.name ?? t('hires.detail.none');
  const byStage = progressByStage(hire.tasks);
  const canSeeSelfReview = can(user, 'checkin:view_self_review');
  const checkinIn = s.nextCheckin ? daysBetween(DEMO_TODAY, checkinDueDate(s.nextCheckin)) : null;

  return (
    <>
      <nav aria-label={t('hires.detail.breadcrumb')} className="mb-4 md:mb-6">
        <Link
          to="/admin/hires"
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('hires.detail.back')}
        </Link>
      </nav>

      <header className="mb-(--space-section) flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        {s.person && <Avatar name={s.person.name} role={s.person.role} size="xl" />}
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-headline-small text-balance text-on-surface">{s.person?.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <HireStatusPill status={s.status} />
            <span className="text-body-medium text-on-surface-variant">
              {s.person?.jobTitle} · {s.person?.area}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-(--space-bento-gap)">
        <KpiRow>
          <KpiCard
            label={t('hires.detail.kpis.progress')}
            value={formatPercent(s.progress.percent)}
            icon="route"
            trend={{
              tone: 'primary',
              icon: 'task_alt',
              label: t('hires.detail.tasksDone', { done: s.progress.done, total: s.progress.total }),
            }}
          />
          <KpiCard
            label={t('hires.detail.kpis.overdue')}
            value={String(s.overdue)}
            icon="warning"
            iconTone="tertiary"
            trend={
              s.overdue > 0
                ? { label: t('hires.detail.needsAttention'), tone: 'error', icon: 'error' }
                : { label: t('hires.detail.noOverdue'), tone: 'success', icon: 'check_circle' }
            }
          />
          <KpiCard
            label={t('hires.detail.kpis.stage')}
            value={t(`stages.${s.stage}`)}
            icon="flag"
            trend={{
              tone: 'neutral',
              icon: 'route',
              label: s.day < 0 ? t('hires.detail.startsIn', { count: -s.day }) : t('hires.detail.day', { day: s.day }),
            }}
          />
          {/* Which check-in as the label, the countdown as the number and the date in a pill (D-78). */}
          <KpiCard
            label={
              s.nextCheckin
                ? t('hires.detail.checkinTitle', { days: CHECKIN_OFFSETS[s.nextCheckin.stage] })
                : t('hires.detail.kpis.checkin')
            }
            value={
              checkinIn === null
                ? t('journey.kpi.none')
                : checkinIn < 0
                  ? t('hires.detail.checkinOverdue')
                  : checkinIn === 0
                    ? t('journey.kpi.today')
                    : t('journey.kpi.days', { count: checkinIn })
            }
            icon="event"
            iconTone="tertiary"
            trend={
              s.nextCheckin
                ? {
                    tone: checkinIn !== null && checkinIn < 0 ? 'error' : 'neutral',
                    icon: 'calendar_today',
                    label: formatDate(checkinDueDate(s.nextCheckin)),
                  }
                : undefined
            }
          />
        </KpiRow>

        <div className="grid grid-cols-1 gap-(--space-bento-gap) xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
          {/* Journey by stage */}
          <Card title={t('hires.detail.journey')} description={t('hires.detail.journeyHelp')}>
            <div className="flex flex-col gap-6">
              {STAGES.map((stage) => {
                const tasks = hire.tasks.filter((task) => task.stage === stage);
                if (tasks.length === 0) return null;
                return (
                  <section key={stage} aria-labelledby={`stage-${stage}`} className="flex flex-col gap-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 id={`stage-${stage}`} className="text-title-medium text-on-surface">
                        {t(`stages.${stage}`)}
                      </h3>
                      <span className="text-body-small text-on-surface-variant tabular-nums">
                        {t('hires.detail.stageCount', { done: byStage[stage].done, total: byStage[stage].total })}
                      </span>
                    </div>
                    <ul className="flex flex-col divide-y divide-outline-variant">
                      {tasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          allTasks={hire.tasks}
                          canComplete={canCompleteTask(user, hire, task)}
                          onComplete={(done) => setUnlocked(complete(hire, done))}
                          highlighted={unlocked.includes(task.id)}
                        />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </Card>

          <div className="flex min-w-0 flex-col gap-(--space-bento-gap)">
            <Card title={t('hires.detail.data')}>
              <dl className="flex flex-col">
                <DetailRow label={t('hires.detail.startDate')} value={formatDate(hire.startDate)} />
                <DetailRow label={t('hires.detail.manager')} value={nameOf(hire.managerId)} />
                <DetailRow label={t('hires.detail.buddy')} value={nameOf(hire.buddyId)} />
                <DetailRow label={t('hires.detail.hr')} value={nameOf(hire.hrId)} />
                <DetailRow label={t('hires.detail.template')} value={s.template?.name ?? t('hires.detail.none')} />
                <DetailRow label={t('hires.detail.email')} value={s.person?.email ?? ''} />
              </dl>
            </Card>

            <Card title={t('hires.detail.checkins')} description={t('hires.detail.checkinsHelp')}>
              <ol className="flex flex-col gap-4">
                {hire.checkins.map((checkin) => (
                  <li key={checkin.id} className="flex flex-col gap-3 rounded-md border border-outline-variant p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <h3 className="text-title-small text-on-surface">
                          {t('hires.detail.checkinTitle', { days: CHECKIN_OFFSETS[checkin.stage] })}
                        </h3>
                        <span className="text-body-small text-on-surface-variant tabular-nums">
                          {t('hires.detail.due', { date: formatDate(checkinDueDate(checkin)) })}
                        </span>
                      </div>
                      <StatusPill
                        tone={CHECKIN_STATUS[checkin.status].tone}
                        icon={CHECKIN_STATUS[checkin.status].icon}
                        label={t(`hires.detail.checkinStatus.${checkin.status}`)}
                      />
                    </div>
                    {canSeeSelfReview && checkin.hireSelfReview && (
                      <p className="rounded-sm bg-surface-container p-2 text-body-small text-on-surface">
                        <span className="text-label-medium">
                          {t('hires.detail.mood', { mood: checkin.hireSelfReview.mood })}
                        </span>
                        {checkin.hireSelfReview.comment && <> · {checkin.hireSelfReview.comment}</>}
                      </p>
                    )}
                    {checkin.status === 'completed' && (
                      <ul className="flex flex-col gap-1.5">
                        {checkin.milestones.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-start justify-between gap-3 text-body-small text-on-surface"
                          >
                            <span className="min-w-0">{m.label}</span>
                            {m.result ? (
                              <StatusPill
                                tone={RESULT[m.result].tone}
                                icon={RESULT[m.result].icon}
                                label={t(`hires.detail.results.${m.result}`)}
                                className="shrink-0"
                              />
                            ) : (
                              <span className="shrink-0 text-on-surface-variant">{t('hires.detail.noResult')}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {checkin.action?.type === 'escalate' && (
                      <p className="flex items-start gap-1.5 text-body-small text-on-error-container">
                        <Icon name="warning" size={16} className="mt-px shrink-0 text-error" />
                        {t('hires.detail.escalated', { note: checkin.action.note })}
                      </p>
                    )}
                    {checkin.action?.type === 'reschedule' && (
                      <p className="flex items-start gap-1.5 text-body-small text-on-surface-variant">
                        <Icon name="schedule" size={16} className="mt-px shrink-0" />
                        {t('hires.detail.rescheduled', { date: formatDate(checkin.action.newDate) })}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
