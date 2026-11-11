import { useTranslation } from 'react-i18next';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Icon } from '@/components/ui/Icon';
import type { Owner } from '@/types/domain';
import { ChartTooltip } from './ChartTooltip';

/**
 * Overdue tasks by responsible owner (F4), to spot bottlenecks. A task overdue because it is
 * blocked counts for the owner of the task that blocks it (D-30). The owner with the most
 * overdue tasks gets the accent color and the summary names it.
 */
export function BottleneckCard({ counts }: { counts: Record<Owner, number> }) {
  const { t } = useTranslation();
  const data = (Object.entries(counts) as [Owner, number][])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([owner, value]) => ({ owner, label: t(`owners.${owner}`), value }));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const top = data[0];

  if (!top) {
    return (
      <p className="flex items-start gap-2 rounded-md bg-success-container p-3 text-body-medium text-on-success-container">
        <Icon name="check_circle" size={20} className="shrink-0 text-success" />
        {t('dashboard.bottleneck.empty')}
      </p>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <p className="text-body-medium text-on-surface">
        {t('dashboard.bottleneck.summary', { owner: top.label, count: top.value, total })}
      </p>
      <div aria-hidden className="min-w-0" style={{ height: `${data.length * 2.75 + 1}rem` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap={8}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={104}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'var(--md-sys-color-on-surface)' }}
            />
            <Tooltip
              cursor={{ fill: 'var(--md-sys-color-surface-container)' }}
              content={({ active, payload }) => {
                const point = active && payload?.[0]?.payload;
                if (!point) return null;
                return (
                  <ChartTooltip
                    title={point.label}
                    lines={[t('dashboard.bottleneck.tooltip', { count: point.value })]}
                  />
                );
              }}
            />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
              isAnimationActive={false}
              label={{ position: 'right', fontSize: 12, fill: 'var(--md-sys-color-on-surface)' }}
            >
              {data.map((d, i) => (
                <Cell key={d.owner} fill={i === 0 ? 'var(--chart-2)' : 'var(--chart-1)'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">
        <table>
          <caption>{t('dashboard.bottleneck.tableCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('dashboard.bottleneck.colOwner')}</th>
              <th scope="col">{t('dashboard.bottleneck.colCount')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.owner}>
                <th scope="row">{d.label}</th>
                <td>{d.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
