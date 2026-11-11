import { useTranslation } from 'react-i18next';
import { useRevealOnce } from '@/lib/use-reveal-once';
import { DEMO_ACCOUNTS } from '@/features/auth/auth-service';
import { formatNumber } from '@/lib/dates';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { SectionHeading } from './SectionHeading';

/** Screens of phase A (CLAUDE.md section 6): a fact of the spec, not a metric. */
const PHASE_A_SCREENS = 24;

/**
 * G0 · Figures (D-73, reference): large numbers on the white page, alternating primary and
 * plum, no cards. Every number comes from the demo data, never typed by hand.
 */
export function StatsBand() {
  const { t } = useTranslation();
  const stagger = useRevealOnce<HTMLElement>();
  const templates = useDataStore((s) => s.templates);
  const hires = useDataStore((s) => s.hires);
  const tasks = hires.reduce((sum, h) => sum + h.tasks.length, 0);

  const stats: { value: number; label: string }[] = [
    {
      value: DEMO_ACCOUNTS.length,
      label: t('home.stats.roles'),
    },
    {
      value: PHASE_A_SCREENS,
      label: t('home.stats.screens'),
    },
    {
      value: templates.length,
      label: t('home.stats.templates'),
    },
    {
      value: hires.length,
      label: t('home.stats.hires'),
    },
    {
      value: tasks,
      label: t('home.stats.tasks'),
    },
  ];

  return (
    <section aria-labelledby="stats-title" className="flex flex-col gap-10">
      <SectionHeading
        id="stats-title"
        eyebrow={t('home.stats.eyebrow')}
        title={t('home.stats.title')}
        highlight={t('home.stats.titleHighlight')}
        subtitle={t('home.stats.subtitle')}
      />
      <ul ref={stagger} data-stagger className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s, i) => (
          <li key={s.label} className="flex min-w-0 flex-col items-center gap-1 text-center">
            <span
              className={cn(
                'text-display-small tabular-nums lg:text-display-medium',
                i % 2 === 0 ? 'text-primary' : 'text-tertiary',
              )}
            >
              {formatNumber(s.value)}
            </span>
            <span className="text-body-medium text-on-surface-variant">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
