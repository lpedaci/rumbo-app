import { Trans, useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';
import { NAV_ITEMS } from '@/app/navigation';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { RefChip } from '@/components/ui/RefChip';
import { findDemoPerson } from '@/features/auth/auth-service';
import { can } from '@/lib/permissions';
import { useCurrentUser } from '@/store/session-store';

export type ScreenId =
  'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'A7' | 'J1' | 'J2' | 'J3' | 'N1' | 'N2' | 'N3' | 'S1' | 'S2' | 'S3';

/**
 * Screen still in progress (steps 8 to 10; redesign D-80): instead of a bare notice, it says
 * what the screen is going to show and offers the sections of the role that already work,
 * so the visitor of the portfolio always has somewhere to go.
 */
export function UpcomingPage({ screen }: { screen: ScreenId }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useCurrentUser();
  const person = user && findDemoPerson(user.personId);
  const preview = t(`upcoming.preview.${screen}`, { returnObjects: true, defaultValue: [] }) as string[];
  const available = NAV_ITEMS.filter((item) => can(user, item.action) && item.to !== pathname);

  return (
    <div className="flex flex-col gap-(--space-bento-gap)">
      <section
        aria-labelledby="upcoming-title"
        className="grid grid-cols-1 gap-8 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center"
      >
        <div className="flex min-w-0 flex-col gap-4">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-tertiary-container px-2.5 py-1 text-label-medium text-on-tertiary-container">
            <Icon name="schedule" size={16} />
            {t('upcoming.badge')}
          </span>
          <div className="flex flex-col gap-2">
            {person && (
              <p className="text-body-medium text-on-surface-variant">
                {t('upcoming.greeting', { name: person.name.split(' ')[0] })}
              </p>
            )}
            <h1 id="upcoming-title" className="text-headline-small text-balance text-on-surface">
              {t(`upcoming.screens.${screen}`)}
            </h1>
            <p className="text-body-large text-on-surface-variant">
              <Trans i18nKey="upcoming.body" components={{ viewAs: <RefChip icon="swap_horiz" /> }} />
            </p>
          </div>
          {preview.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-title-small text-on-surface">{t('upcoming.willShow')}</h2>
              <ul className="flex flex-col gap-2">
                {preview.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-body-medium text-on-surface">
                    <Icon name="check_circle" size={18} className="mt-0.5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Faint outline of the screen to come: flat placeholders, no animation (2.6) */}
        <div aria-hidden className="hidden flex-col gap-3 rounded-lg bg-surface-container p-4 lg:flex">
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-2 rounded-md bg-surface-container-lowest p-3">
                <span className="size-6 rounded-sm bg-primary-container" />
                <span className="h-2 w-2/3 rounded-full bg-outline-variant" />
                <span className="h-4 w-1/2 rounded-full bg-outline-variant" />
              </div>
            ))}
          </div>
          <div className="flex h-28 items-end gap-2 rounded-md bg-surface-container-lowest p-3">
            {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
              <span key={i} className="flex-1 rounded-t-sm bg-primary/25" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </section>

      {available.length > 0 && (
        <section aria-labelledby="upcoming-available" className="flex flex-col gap-3">
          <h2 id="upcoming-available" className="text-title-medium text-on-surface">
            {t('upcoming.available')}
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex min-h-16 items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-title-small text-on-surface transition-colors hover:border-outline hover:bg-surface-container"
                >
                  <IconTile icon={item.icon} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
                  <Icon name="chevron_right" className="shrink-0 text-on-surface-variant" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
