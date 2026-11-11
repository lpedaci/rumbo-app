import { format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar } from '@/components/ui/Avatar';
import { SegmentedButton } from '@/components/ui/SegmentedButton';
import { formatPercent } from '@/lib/dates';
import type { CohortPoint, HireProgressPoint } from '@/lib/metrics';
import type { Person } from '@/types/domain';
import { ChartTooltip } from './ChartTooltip';

type View = 'cohort' | 'hire';

/**
 * Main chart of the HR panel (F4): average progress by cohort (start month) as an area with
 * a flat 12 % fill and the dark tooltip (2.2), or progress per hire as bars with the person.
 * Text summary on top and a table for screen readers (2.10, D-83).
 */
export function ProgressCard({
  cohorts,
  byHire,
  people,
}: {
  cohorts: CohortPoint[];
  byHire: HireProgressPoint[];
  people: Person[];
}) {
  const { t, i18n } = useTranslation();
  const [view, setView] = useState<View>('cohort');
  const locale = i18n.language === 'en' ? enUS : es;
  const monthLabel = (cohort: string) => format(parseISO(`${cohort}-01`), 'MMM yyyy', { locale });
  const data = cohorts.map((c) => ({ ...c, label: monthLabel(c.cohort), value: Math.round(c.averageProgress) }));
  const latest = data.at(-1);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 text-body-medium text-on-surface">
          {view === 'cohort'
            ? latest &&
              t('dashboard.progress.summaryCohort', {
                month: latest.label,
                value: formatPercent(latest.averageProgress),
                count: latest.hires,
              })
            : t('dashboard.progress.summaryHire', { count: byHire.length })}
        </p>
        <SegmentedButton
          label={t('dashboard.progress.viewBy')}
          value={view}
          onValueChange={setView}
          options={[
            { value: 'cohort', label: t('dashboard.progress.byCohort') },
            { value: 'hire', label: t('dashboard.progress.byHire') },
          ]}
        />
      </div>

      {view === 'cohort' ? (
        <>
          <div aria-hidden className="h-56 min-w-0 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="var(--md-sys-color-outline-variant)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'var(--md-sys-color-on-surface-variant)' }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: 'var(--md-sys-color-on-surface-variant)' }}
                  tickFormatter={(v: number) => `${v}`}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--md-sys-color-outline)' }}
                  content={({ active, payload }) => {
                    const point = active && payload?.[0]?.payload;
                    if (!point) return null;
                    return (
                      <ChartTooltip
                        title={point.label}
                        lines={[
                          t('dashboard.progress.tooltipAvg', { value: formatPercent(point.averageProgress) }),
                          t('dashboard.progress.tooltipHires', { count: point.hires }),
                        ]}
                      />
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="var(--chart-1)"
                  fillOpacity={0.12}
                  dot={{ r: 3, fill: 'var(--chart-1)', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* sr-only on a wrapper: tables ignore the 1 px width and overflow (D-83) */}
          <div className="sr-only">
            <table>
              <caption>{t('dashboard.progress.tableCaption')}</caption>
              <thead>
                <tr>
                  <th scope="col">{t('dashboard.progress.colCohort')}</th>
                  <th scope="col">{t('dashboard.progress.colHires')}</th>
                  <th scope="col">{t('dashboard.progress.colAvg')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c) => (
                  <tr key={c.cohort}>
                    <th scope="row">{c.label}</th>
                    <td>{c.hires}</td>
                    <td>{formatPercent(c.averageProgress)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {byHire.map((point) => {
            const person = people.find((p) => p.id === point.personId);
            if (!person) return null;
            return (
              <li key={point.hireId}>
                <Link
                  to={`/admin/hires/${point.hireId}`}
                  className="flex min-w-0 items-center gap-3 rounded-md p-1 transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Avatar name={person.name} role={person.role} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex min-w-0 items-baseline justify-between gap-2">
                      <span className="truncate text-title-small text-on-surface">{person.name}</span>
                      <span className="shrink-0 text-label-large text-on-surface tabular-nums">
                        {formatPercent(point.percent)}
                      </span>
                    </span>
                    <span
                      role="progressbar"
                      aria-label={t('dashboard.progress.barLabel', { name: person.name })}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(point.percent)}
                      className="h-2 overflow-hidden rounded-full bg-surface-container-high"
                    >
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${point.percent}%` }} />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
