import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderChip } from '@/components/layout/DetailHeader';
import { Link, useParams } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { KpiCard, KpiRow } from '@/components/ui/KpiCard';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { TaskRow } from '@/features/journey/TaskRow';
import { useCompleteTask } from '@/features/journey/use-complete-task';
import { DEMO_TODAY, daysBetween, formatDate, formatPercent, STAGES } from '@/lib/dates';
import { summarizeHire } from '@/lib/hires';
import { maskPhone } from '@/lib/validation';
import { CHECKIN_OFFSETS, checkinDueDate, progressByStage } from '@/lib/journey';
import { can, canCompleteTask, canViewHire } from '@/lib/permissions';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import { CheckinTimeline } from './CheckinTimeline';
import { HireStatusPill } from './HireStatusPill';
import { latestVersion } from '@/lib/templates';

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
 * A4 · Hire record (CLAUDE.md F3, F5), also J2 for the direct manager: data, journey with
 * statuses and check-in history. The manager completes their own tasks and opens J3.
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
  // Same record for HR (A4) and for the direct manager (J2): the way back and the check-in action change.
  const isManager = can(user, 'checkin:fill');
  const backTo = isManager ? '/manager' : '/admin/hires';
  const checkinIn = s.nextCheckin ? daysBetween(DEMO_TODAY, checkinDueDate(s.nextCheckin)) : null;

  return (
    <>
      <nav aria-label={t('hires.detail.breadcrumb')} className="mb-4 md:mb-6">
        <Link
          to={backTo}
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {isManager ? t('hires.detail.backTeam') : t('hires.detail.back')}
        </Link>
      </nav>

      {/* The person is the subject of the record: photo next to the h1, facts as the standard chips (D-94) */}
      <header className="mb-(--space-section) flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        {s.person && <Avatar name={s.person.name} role={s.person.role} size="xl" />}
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-headline-small text-balance text-on-surface">{s.person?.name}</h1>
          <ul aria-label={t('hires.detail.facts')} className="flex flex-wrap items-center gap-2">
            <li>
              <HireStatusPill status={s.status} className="h-7" />
            </li>
            {s.person && <HeaderChip icon="badge">{s.person.jobTitle}</HeaderChip>}
            {s.person && <HeaderChip icon="apartment">{s.person.area}</HeaderChip>}
          </ul>
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
                          viewerOwner={isManager ? 'manager' : 'hr'}
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
                <DetailRow
                  label={t('hires.detail.template')}
                  value={
                    s.template
                      ? hire.templateVersion
                        ? t('templateVersions.hire.version', { name: s.template.name, version: hire.templateVersion })
                        : s.template.name
                      : t('hires.detail.none')
                  }
                />
                <DetailRow label={t('hires.detail.email')} value={s.person?.email ?? ''} />
                {s.person?.employeeId && <DetailRow label={t('hires.detail.employeeId')} value={s.person.employeeId} />}
                {/* Only the last digits: personal data shown masked (F10) */}
                {s.person?.mobile && <DetailRow label={t('hires.detail.mobile')} value={maskPhone(s.person.mobile)} />}
              </dl>
              {/* F8: a later version never changes this journey */}
              {s.template && hire.templateVersion && (latestVersion(s.template)?.version ?? 0) > hire.templateVersion && (
                <p className="pt-2 text-body-small text-on-surface-variant">
                  {t('templateVersions.hire.olderNote', { version: latestVersion(s.template)?.version })}
                </p>
              )}
            </Card>

            <Card
              title={t('hires.detail.checkins')}
              description={t('hires.detail.checkinsHelp')}
              action={
                <span className="inline-flex h-6 items-center rounded-full bg-surface-container px-2.5 text-label-medium whitespace-nowrap text-on-surface tabular-nums">
                  {t('hires.detail.checkinsDone', {
                    done: hire.checkins.filter((c) => c.status === 'completed').length,
                    total: hire.checkins.length,
                  })}
                </span>
              }
            >
              <CheckinTimeline hire={hire} canSeeSelfReview={canSeeSelfReview} canRun={isManager} />
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
