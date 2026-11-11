import { useTranslation } from 'react-i18next';
import { type IconName } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { DEMO_ACCOUNTS } from '@/features/auth/auth-service';
import { formatNumber } from '@/lib/dates';
import { useDataStore } from '@/store/data-store';

/** Screens of phase A (CLAUDE.md section 6): a fact of the spec, not a metric. */
const PHASE_A_SCREENS = 24;

/**
 * G0 · Figures band (D-70): a flat `primary` block, the only strong color area of the page,
 * with white cards. Every number comes from the demo data, never typed by hand.
 */
export function StatsBand() {
  const { t } = useTranslation();
  const templates = useDataStore((s) => s.templates);
  const hires = useDataStore((s) => s.hires);
  const tasks = hires.reduce((sum, h) => sum + h.tasks.length, 0);

  const stats: { icon: IconName; value: number; label: string }[] = [
    { icon: 'groups', value: DEMO_ACCOUNTS.length, label: t('home.stats.roles') },
    { icon: 'dashboard', value: PHASE_A_SCREENS, label: t('home.stats.screens') },
    { icon: 'layers', value: templates.length, label: t('home.stats.templates') },
    { icon: 'person', value: hires.length, label: t('home.stats.hires') },
    { icon: 'checklist', value: tasks, label: t('home.stats.tasks') },
  ];

  return (
    <section aria-labelledby="stats-title" className="rounded-xl bg-primary px-4 py-10 text-on-primary sm:px-8 lg:px-12 lg:py-14">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-2 text-center">
        <h2 id="stats-title" className="text-headline-small text-balance md:text-display-small">
          {t('home.stats.title')}
        </h2>
        <p className="text-body-large">{t('home.stats.subtitle')}</p>
      </div>
      <ul className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(min(100%,8rem),1fr))] gap-3">
        {stats.map((s) => (
          <li key={s.label} className="flex min-w-0 flex-col gap-3 rounded-lg bg-surface-container-lowest p-3 text-on-surface sm:gap-4 sm:p-4">
            <IconTile icon={s.icon} size="sm" />
            <p className="flex flex-col gap-1">
              <span className="text-headline-small tabular-nums md:text-display-small">{formatNumber(s.value)}</span>
              <span className="text-body-medium text-on-surface-variant">{s.label}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
