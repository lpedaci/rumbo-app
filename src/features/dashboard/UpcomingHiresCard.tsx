import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { DEMO_TODAY, daysBetween, formatDate } from '@/lib/dates';
import type { HireSummary } from '@/lib/hires';

/**
 * People who start soon (F4): HR checks that their preboarding is moving before day 0.
 * Each row shows the countdown, the start date and how much of the preboarding is done.
 */
export function UpcomingHiresCard({ upcoming }: { upcoming: HireSummary[] }) {
  const { t } = useTranslation();

  if (upcoming.length === 0) {
    return <p className="text-body-medium text-on-surface-variant">{t('dashboard.upcoming.empty')}</p>;
  }

  return (
    <ul className="-mx-2 flex flex-col">
      {upcoming.map((s) => {
        if (!s.person) return null;
        const days = daysBetween(DEMO_TODAY, s.hire.startDate);
        const pre = s.hire.tasks.filter((task) => task.stage === 'preboarding');
        const done = pre.filter((task) => task.status === 'done').length;
        return (
          <li key={s.hire.id} className="border-b border-outline-variant last:border-b-0">
            <Link
              to={`/admin/hires/${s.hire.id}`}
              className="flex min-h-14 min-w-0 items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            >
              <Avatar name={s.person.name} role={s.person.role} size="sm" />
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="truncate text-title-small text-on-surface">{s.person.name}</span>
                <span className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-label-medium text-on-surface">
                    {t('dashboard.upcoming.startsIn', { count: days })}
                  </span>
                  <span className="text-body-small text-on-surface-variant tabular-nums">
                    {formatDate(s.hire.startDate)}
                  </span>
                </span>
                <span className="text-body-small text-on-surface-variant">
                  {t('dashboard.upcoming.preboarding', { done, total: pre.length })}
                </span>
              </span>
              <Icon name="chevron_right" className="shrink-0 text-on-surface-variant" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
