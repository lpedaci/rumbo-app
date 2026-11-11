import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { GreetingHeader } from '@/components/layout/GreetingHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { KpiCard, KpiRow } from '@/components/ui/KpiCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { findDemoPerson } from '@/features/auth/auth-service';
import { HireStatusPill, OverduePill } from '@/features/hires/HireStatusPill';
import { checkinIsActionable, CHECKIN_SOON_DAYS, daysUntilCheckin } from '@/lib/checkins';
import { DEMO_TODAY, formatDate, formatLongDate, formatPercent } from '@/lib/dates';
import { summarizeHire, type HireSummary } from '@/lib/hires';
import { CHECKIN_OFFSETS, greetingKey } from '@/lib/journey';
import { visibleHires } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';

/**
 * J1 · My team in onboarding (CLAUDE.md F5): the manager's new hires with their progress
 * and next check-in, and "Hacer check-in" when the self-review is in or the date is near.
 * Least privilege: only the manager's own team (visibleHires, permissions.ts).
 */
export function TeamPage() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const hires = useDataStore((s) => s.hires);
  const people = useDataStore((s) => s.people);
  const templates = useDataStore((s) => s.templates);
  const person = user && findDemoPerson(user.personId);

  const team = visibleHires(user, hires)
    .map((h) => summarizeHire(h, people, templates))
    .filter((s) => s.status !== 'completed')
    .sort((a, b) => a.hire.startDate.localeCompare(b.hire.startDate));
  const active = team.filter((s) => s.status === 'active');
  const upcoming = team.filter((s) => s.status === 'upcoming');
  const soon = team.filter(
    (s) =>
      s.nextCheckin && s.nextCheckin.status !== 'completed' && daysUntilCheckin(s.nextCheckin) <= CHECKIN_SOON_DAYS,
  ).length;
  const ready = team.filter((s) => s.nextCheckin?.status === 'hire_done').length;
  const myTasks = team.reduce(
    (sum, s) => sum + s.hire.tasks.filter((task) => task.owner === 'manager' && task.status !== 'done').length,
    0,
  );

  const checkinText = (s: HireSummary) => {
    if (!s.nextCheckin) return t('team.noCheckin');
    const days = CHECKIN_OFFSETS[s.nextCheckin.stage];
    const left = daysUntilCheckin(s.nextCheckin);
    if (left === 0) return t('team.checkinToday', { days });
    return left > 0 ? t('team.checkinIn', { days, count: left }) : t('team.checkinLate', { days, count: -left });
  };

  const card = (s: HireSummary) => {
    const actionable = s.nextCheckin && checkinIsActionable(s.nextCheckin);
    const late = s.nextCheckin && daysUntilCheckin(s.nextCheckin) < 0;
    return (
      <li
        key={s.hire.id}
        className="flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          {s.person && <Avatar name={s.person.name} role={s.person.role} size="lg" />}
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="truncate text-title-medium text-on-surface">{s.person?.name}</h3>
            <span className="truncate text-body-small text-on-surface-variant">{s.person?.jobTitle}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HireStatusPill status={s.status} />
          {s.overdue > 0 && <OverduePill count={s.overdue} />}
        </div>
        {s.status === 'upcoming' ? (
          <p className="text-body-medium text-on-surface-variant tabular-nums">
            {t('team.upcoming', { date: formatDate(s.hire.startDate) })}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-body-small text-on-surface-variant">
              <span>{t(`stages.${s.stage}`)}</span>
              <span className="text-label-large text-on-surface tabular-nums">{formatPercent(s.progress.percent)}</span>
            </div>
            <span
              role="progressbar"
              aria-label={t('team.progressLabel', { name: s.person?.name ?? '' })}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(s.progress.percent)}
              className="h-1.5 overflow-hidden rounded-full bg-outline-variant"
            >
              <span className="block h-full bg-primary" style={{ width: `${s.progress.percent}%` }} />
            </span>
          </div>
        )}
        <div
          className={cn(
            'flex flex-wrap items-center gap-2 rounded-md p-3 text-body-medium',
            late ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-surface',
          )}
        >
          <Icon name="event" size={20} className={late ? 'text-error' : 'text-tertiary'} />
          <span className="min-w-0 flex-1">{checkinText(s)}</span>
          {s.nextCheckin?.status === 'hire_done' && (
            <StatusPill tone="info" icon="fact_check" label={t('team.selfReviewReady')} />
          )}
        </div>
        <div className="mt-auto flex flex-wrap gap-2">
          <Button asChild variant="outlined" className="min-w-fit flex-1">
            <Link to={`/manager/hires/${s.hire.id}`}>{t('team.viewJourney')}</Link>
          </Button>
          {actionable && s.nextCheckin && (
            <Button asChild variant="tonal" leadingIcon="fact_check" className="min-w-fit flex-1">
              <Link to={`/manager/hires/${s.hire.id}/checkin/${s.nextCheckin.stage}`}>{t('team.doCheckin')}</Link>
            </Button>
          )}
        </div>
      </li>
    );
  };

  return (
    <>
      <GreetingHeader
        date={formatLongDate(DEMO_TODAY, i18n.language === 'en' ? 'en' : 'es')}
        greeting={t(`journey.greetings.${greetingKey()}`)}
        name={person?.name.split(' ')[0] ?? ''}
        facts={[
          { icon: 'groups', label: t('team.facts.people', { count: active.length + upcoming.length }) },
          { icon: 'event', label: t('team.facts.soon', { count: soon }), tone: soon > 0 ? 'accent' : 'neutral' },
        ]}
      />

      <div className="flex flex-col gap-(--space-section)">
        <KpiRow>
          <KpiCard label={t('team.kpis.active')} value={String(team.length)} icon="groups" />
          <KpiCard
            label={t('team.kpis.soon')}
            value={String(soon)}
            icon="event"
            iconTone="tertiary"
            caption={t('team.kpiCaption.soon')}
          />
          <KpiCard
            label={t('team.kpis.ready')}
            value={String(ready)}
            icon="fact_check"
            caption={t('team.kpiCaption.ready')}
          />
          <KpiCard
            label={t('team.kpis.myTasks')}
            value={String(myTasks)}
            icon="task_alt"
            iconTone="tertiary"
            caption={t('team.kpiCaption.myTasks')}
          />
        </KpiRow>

        {team.length === 0 ? (
          <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-body-large text-on-surface">
            {t('team.empty')}
          </p>
        ) : (
          [
            { id: 'active', title: t('team.activeTitle'), list: active },
            { id: 'upcoming', title: t('team.upcomingTitle'), list: upcoming },
          ]
            .filter((group) => group.list.length > 0)
            .map((group) => (
              <section key={group.id} aria-labelledby={`team-${group.id}`} className="flex flex-col gap-4">
                <h2 id={`team-${group.id}`} className="text-title-large text-on-surface">
                  {group.title} <span className="text-on-surface-variant tabular-nums">· {group.list.length}</span>
                </h2>
                <ul className="grid grid-cols-1 gap-(--space-bento-gap) md:grid-cols-2 xl:grid-cols-3">
                  {group.list.map(card)}
                </ul>
              </section>
            ))
        )}
      </div>
    </>
  );
}
