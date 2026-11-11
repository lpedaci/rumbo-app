import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { GreetingHeader } from '@/components/layout/GreetingHeader';
import { BentoCard } from '@/components/ui/BentoCard';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { Button } from '@/components/ui/Button';
import { IconTile } from '@/components/ui/IconTile';
import { KpiCard, KpiRow } from '@/components/ui/KpiCard';
import { findDemoPerson } from '@/features/auth/auth-service';
import { DEMO_TODAY, formatLongDate, formatNumber, formatPercent } from '@/lib/dates';
import { summarizeHire } from '@/lib/hires';
import { greetingKey } from '@/lib/journey';
import { alerts, kpis, moodSummary, overdueByOwner, progressByCohort, progressByHire } from '@/lib/metrics';
import { visibleHires } from '@/lib/permissions';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import { AlertList } from './AlertList';
import { BottleneckCard } from './BottleneckCard';
import { ProgressCard } from './ProgressCard';
import { UpcomingHiresCard } from './UpcomingHiresCard';

/**
 * A1 · HR follow-up panel (CLAUDE.md F4), in bento (2.4): greeting, KPIs, the main progress
 * chart next to the alerts, and the bottleneck by owner with the people who start soon.
 * Every number comes from src/lib/metrics.ts, so it changes when the data changes.
 * Mood is only shown aggregated (least privilege, F0).
 */
export function DashboardPage() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const allHires = useDataStore((s) => s.hires);
  const people = useDataStore((s) => s.people);
  const templates = useDataStore((s) => s.templates);
  const person = user && findDemoPerson(user.personId);

  const hires = visibleHires(user, allHires);
  const k = kpis(hires);
  const alertList = alerts(hires);
  const cohorts = progressByCohort(hires);
  const mood = moodSummary(hires);
  const upcoming = hires
    .filter((h) => h.status === 'upcoming')
    .map((h) => summarizeHire(h, people, templates))
    .sort((a, b) => a.hire.startDate.localeCompare(b.hire.startDate));
  const escalated = alertList.filter((a) => a.kind === 'checkin_escalated').length;

  return (
    <>
      <GreetingHeader
        date={formatLongDate(DEMO_TODAY, i18n.language === 'en' ? 'en' : 'es')}
        greeting={t(`journey.greetings.${greetingKey()}`)}
        name={person?.name.split(' ')[0] ?? ''}
        facts={[
          { icon: 'groups', label: t('dashboard.facts.active', { count: k.activeHires }) },
          { icon: 'person', label: t('dashboard.facts.upcoming', { count: upcoming.length }) },
          {
            icon: 'warning',
            label: t('dashboard.facts.alerts', { count: alertList.length }),
            tone: alertList.length > 0 ? 'accent' : 'neutral',
          },
          // Mood only aggregated, and only with 3 answers or more (least privilege, F0)
          ...(mood
            ? [{ icon: 'mood' as const, label: t('dashboard.facts.mood', { value: formatNumber(mood.average, 1) }) }]
            : []),
        ]}
        actions={
          <Button asChild leadingIcon="add">
            <Link to="/admin/hires/new">{t('dashboard.newHire')}</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-(--space-section)">
        <KpiRow>
          <KpiCard
            label={t('dashboard.kpis.active')}
            value={formatNumber(k.activeHires)}
            icon="groups"
            series={cohorts.map((c) => c.hires)}
            caption={t('dashboard.kpiCaption.active', { count: upcoming.length })}
          />
          <KpiCard
            label={t('dashboard.kpis.onTime')}
            value={formatPercent(k.onTimeRate)}
            icon="task_alt"
            caption={t('dashboard.kpiCaption.onTime')}
          />
          <KpiCard
            label={t('dashboard.kpis.delayed')}
            value={formatNumber(k.delayedJourneys)}
            icon="schedule"
            iconTone={k.delayedJourneys > 0 ? 'error' : 'success'}
            trend={
              k.delayedJourneys > 0
                ? {
                    tone: 'error',
                    icon: 'warning',
                    label: t('dashboard.kpiTrend.delayed', { count: k.delayedJourneys, total: k.activeHires }),
                  }
                : { tone: 'success', icon: 'check_circle', label: t('dashboard.kpiTrend.onTrack') }
            }
          />
          <KpiCard
            label={t('dashboard.kpis.progress')}
            value={formatPercent(k.averageProgress)}
            icon="trending_up"
            iconTone="tertiary"
            series={cohorts.map((c) => c.averageProgress)}
            seriesTone="tertiary"
            caption={t('dashboard.kpiCaption.progress')}
          />
        </KpiRow>

        <BentoGrid>
          <BentoCard
            size="lg"
            title={t('dashboard.progress.title')}
            description={t('dashboard.progress.description')}
            icon={<IconTile icon="bar_chart" size="sm" />}
          >
            <ProgressCard cohorts={cohorts} byHire={progressByHire(hires)} people={people} />
          </BentoCard>

          <BentoCard
            title={t('dashboard.alerts.title')}
            description={
              escalated > 0
                ? t('dashboard.alerts.descriptionEscalated', { count: escalated })
                : t('dashboard.alerts.description')
            }
            icon={<IconTile icon="warning" tone={alertList.length > 0 ? 'error' : 'success'} size="sm" />}
            className="md:col-span-6 xl:col-span-4 xl:row-span-2"
          >
            <AlertList alerts={alertList} hires={hires} people={people} />
          </BentoCard>

          <BentoCard
            title={t('dashboard.bottleneck.title')}
            description={t('dashboard.bottleneck.description')}
            icon={<IconTile icon="hourglass_empty" tone="tertiary" size="sm" />}
          >
            <BottleneckCard counts={overdueByOwner(hires)} />
          </BentoCard>

          <BentoCard
            title={t('dashboard.upcoming.title')}
            description={t('dashboard.upcoming.description')}
            icon={<IconTile icon="event" size="sm" />}
          >
            <div className="flex flex-col gap-3">
              <UpcomingHiresCard upcoming={upcoming} />
              <Button asChild variant="text" size="xs" trailingIcon="arrow_forward" className="w-fit">
                <Link to="/admin/hires">{t('dashboard.upcoming.viewAll')}</Link>
              </Button>
            </div>
          </BentoCard>
        </BentoGrid>
      </div>
    </>
  );
}
