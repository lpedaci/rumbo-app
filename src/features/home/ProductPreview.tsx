import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { SegmentedProgress } from '@/components/ui/SegmentedProgress';
import { Sparkline } from '@/components/ui/Sparkline';
import { addDays, DEMO_TODAY, formatNumber, formatPercent } from '@/lib/dates';
import { progressOf } from '@/lib/journey';
import { kpis } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import type { Hire } from '@/types/domain';

/** Tasks completed per week across all journeys, for the last `weeks` weeks (real demo data). */
function weeklyCompletions(hires: Hire[], weeks = 8): number[] {
  const tasks = hires.flatMap((h) => h.tasks).filter((t) => t.status === 'done' && t.completedAt);
  return Array.from({ length: weeks }, (_, i) => {
    const to = addDays(DEMO_TODAY, -7 * (weeks - 1 - i));
    const from = addDays(to, -6);
    return tasks.filter((t) => {
      const day = t.completedAt!.slice(0, 10);
      return day >= from && day <= to;
    }).length;
  });
}

/** Journeys started up to the end of each of the last `weeks` weeks (real demo data). */
function startedJourneys(hires: Hire[], weeks = 8): number[] {
  return Array.from({ length: weeks }, (_, i) => {
    const to = addDays(DEMO_TODAY, -7 * (weeks - 1 - i));
    return hires.filter((h) => h.startDate <= to).length;
  });
}

/** Flat area chart drawn with tokens: line in `primary`, fill at 12 %, dark tooltip (2.2.1, pattern 4). */
function MiniAreaChart({ values }: { values: number[] }) {
  const width = 320;
  const height = 120;
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => [
    (i / (values.length - 1)) * width,
    height - 8 - (v / max) * (height - 44),
  ]) as [number, number][];
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const peak = values.reduce((best, v, i) => (v > values[best]! ? i : best), 0);
  const [px, py] = points[peak]!;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" preserveAspectRatio="none" aria-hidden>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} stroke="var(--md-sys-color-outline-variant)" strokeDasharray="3 4" />
        ))}
        <path d={area} fill="var(--chart-1)" fillOpacity={0.12} />
        <path d={line} fill="none" stroke="var(--chart-1)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span
        className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-surface-container-lowest"
        style={{ left: `${(px / width) * 100}%`, top: `${(py / height) * 100}%` }}
      />
      <span
        className="absolute -translate-x-1/2 -translate-y-[calc(100%+0.75rem)] rounded-md bg-inverse-surface px-2 py-1 text-label-medium whitespace-nowrap text-inverse-on-surface tabular-nums"
        style={{ left: `${Math.min(85, Math.max(15, (px / width) * 100))}%`, top: `${(py / height) * 100}%` }}
      >
        {values[peak]}
      </span>
    </div>
  );
}

const panel = 'rounded-xl border border-outline-variant bg-surface-container-lowest';

/**
 * Composed product preview for the demo start (G0) and the login panel (G1):
 * HR KPIs with sparklines, a completions chart and the journey card of the new hire,
 * built with real Rumbo components and real demo data (2.2.1). Decorative: one text
 * alternative describes it, and the inner parts are hidden from assistive technology.
 */
export function ProductPreview({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { t } = useTranslation();
  const hires = useDataStore((s) => s.hires);
  const people = useDataStore((s) => s.people);
  const k = kpis(hires);
  const weekly = weeklyCompletions(hires);
  const sofia = hires.find((h) => h.personId === 'p-sofia');
  const sofiaProgress = sofia ? progressOf(sofia.tasks) : { done: 0, total: 0, percent: 0 };
  const carla = people.find((p) => p.id === 'p-carla');
  const tasks = t('home.preview.tasks', { returnObjects: true }) as string[];

  const miniKpis = [
    { icon: 'group' as const, label: t('home.preview.kpiActive'), value: formatNumber(k.activeHires), tone: 'primary' as const },
    { icon: 'task_alt' as const, label: t('home.preview.kpiOnTime'), value: formatPercent(k.onTimeRate), tone: 'tertiary' as const },
  ];

  return (
    <div role="img" aria-label={t('home.preview.label')} className={cn('relative', className)}>
      <div aria-hidden className={cn(panel, 'flex flex-col gap-4 p-4', !compact && 'lg:p-5')}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {carla && <Avatar name={carla.name} role="admin" size="sm" />}
            <div className="min-w-0">
              <p className="truncate text-title-small text-on-surface">{t('home.preview.greeting')}</p>
              <p className="truncate text-body-small text-on-surface-variant">{t('home.preview.context')}</p>
            </div>
          </div>
          <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-surface-container px-3 text-label-medium text-on-surface-variant">
            <Icon name="calendar_today" size={16} />
            {t('home.preview.period')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {miniKpis.map((kpi, i) => (
            <div key={kpi.label} className="flex min-w-0 flex-col gap-2 rounded-lg border border-outline-variant p-3">
              <div className="flex items-start justify-between gap-2">
                <IconTile icon={kpi.icon} tone={kpi.tone} size="sm" />
                <Sparkline values={i === 0 ? startedJourneys(hires) : weekly} tone={kpi.tone} className="h-7 w-16" />
              </div>
              <p className="truncate text-body-small text-on-surface-variant">{kpi.label}</p>
              <p className="text-headline-small text-on-surface tabular-nums">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-outline-variant p-3">
          <p className="text-title-small text-on-surface">{t('home.preview.chartTitle')}</p>
          <MiniAreaChart values={weekly} />
        </div>
      </div>

      {/* Floating journey card (reference original-cf59fe35) */}
      <div
        aria-hidden
        className={cn(
          panel,
          'absolute -right-4 -bottom-16 hidden w-60 flex-col gap-3 p-4 shadow-elevation-1 sm:flex',
          !compact && 'xl:-right-8',
        )}
      >
        <div className="flex items-center gap-3">
          <IconTile icon="route" tone="brand" size="sm" />
          <div className="min-w-0">
            <p className="truncate text-title-small text-on-surface">{t('home.preview.journey')}</p>
            <p className="text-body-small text-on-surface-variant tabular-nums">
              {t('journey.progress.tasksDone', { done: sofiaProgress.done, total: sofiaProgress.total })}
            </p>
          </div>
        </div>
        <SegmentedProgress
          done={sofiaProgress.done}
          total={sofiaProgress.total}
          segments={24}
          className="h-6"
          label={t('home.preview.progress')}
          valueText=""
        />
        <ul className="flex flex-col divide-y divide-outline-variant rounded-md border border-outline-variant">
          {tasks.map((task, i) => (
            <li key={task} className="flex items-center gap-2 px-2.5 py-2 text-body-small text-on-surface">
              <Icon
                name={i < 2 ? 'check_circle' : 'radio_button_unchecked'}
                filled={i < 2}
                size={18}
                className={i < 2 ? 'text-success' : 'text-on-surface-variant'}
              />
              <span className="min-w-0 flex-1 truncate">{task}</span>
              <Icon name="chevron_right" size={18} className="text-on-surface-variant" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
