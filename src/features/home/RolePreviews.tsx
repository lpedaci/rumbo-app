import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatNumber, formatPercent } from '@/lib/dates';
import { progressOf } from '@/lib/journey';
import { kpis } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import type { Role } from '@/types/domain';

const RAIL: Record<Role, IconName[]> = {
  admin: ['dashboard', 'group', 'layers'],
  manager: ['groups', 'event'],
  hire: ['route', 'fact_check'],
  it_admin: ['support_agent', 'security'],
};

/**
 * Miniature of a Rumbo screen inside an app frame (D-71, reference of alternating sections):
 * built with the product's own pieces and, where possible, the real demo data.
 * Decorative: the text next to it says the same.
 */
function AppFrame({ role, children }: { role: Role; children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="flex min-w-0 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-elevation-1"
    >
      <div className="hidden shrink-0 flex-col items-center gap-2 border-r border-outline-variant bg-surface-container p-2 sm:flex">
        <span className="size-6 rounded-sm bg-primary" />
        {RAIL[role].map((icon, i) => (
          <span
            key={icon}
            className={cn(
              'flex size-7 items-center justify-center rounded-sm',
              i === 0 ? 'bg-primary text-on-primary' : 'text-on-surface-variant',
            )}
          >
            <Icon name={icon} size={16} filled={i === 0} />
          </span>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-3 sm:p-4">{children}</div>
    </div>
  );
}

function AdminPreview() {
  const { t } = useTranslation();
  const hires = useDataStore((s) => s.hires);
  const k = kpis(hires);
  const cells: { icon: IconName; label: string; value: string }[] = [
    { icon: 'group', label: t('home.showcase.preview.active'), value: formatNumber(k.activeHires) },
    { icon: 'task_alt', label: t('home.showcase.preview.onTime'), value: formatPercent(k.onTimeRate) },
    { icon: 'warning', label: t('home.showcase.preview.delayed'), value: formatNumber(k.delayedJourneys) },
  ];
  return (
    <AppFrame role="admin">
      <p className="text-title-small text-on-surface">{t('home.showcase.preview.dashboard')}</p>
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="flex min-w-0 flex-col gap-1 rounded-md border border-outline-variant p-2">
            <IconTile icon={c.icon} size="sm" tone={c.icon === 'warning' ? 'tertiary' : 'primary'} />
            <span className="truncate text-label-small text-on-surface-variant">{c.label}</span>
            <span className="text-title-medium text-on-surface tabular-nums">{c.value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-outline-variant p-3">
        <Sparkline values={[48, 52, 50, 61, 58, 66, 70, Math.round(k.onTimeRate)]} className="h-14 w-full" />
      </div>
    </AppFrame>
  );
}

function ManagerPreview() {
  const { t } = useTranslation();
  const hires = useDataStore((s) => s.hires);
  const people = useDataStore((s) => s.people);
  const team = hires.filter((h) => h.managerId === 'p-martin' && h.status !== 'completed').slice(0, 3);
  return (
    <AppFrame role="manager">
      <p className="text-title-small text-on-surface">{t('home.showcase.preview.team')}</p>
      <ul className="flex flex-col divide-y divide-outline-variant rounded-md border border-outline-variant">
        {team.map((hire, i) => {
          const person = people.find((p) => p.id === hire.personId);
          const pct = progressOf(hire.tasks).percent;
          return (
            <li key={hire.id} className="flex min-w-0 items-center gap-2 p-2">
              {person && <Avatar name={person.name} role={person.role} size="sm" />}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-label-medium text-on-surface">{person?.name}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-outline-variant">
                  <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                </span>
              </div>
              <span
                className={cn(
                  'hidden shrink-0 rounded-full px-2 text-label-small sm:inline',
                  i === 0 ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container-high text-on-surface',
                )}
              >
                {t('home.showcase.preview.checkin')}
              </span>
            </li>
          );
        })}
      </ul>
    </AppFrame>
  );
}

function HirePreview() {
  const { t } = useTranslation();
  const tasks = t('home.showcase.preview.hireTasks', { returnObjects: true }) as string[];
  const status = [
    { icon: 'error' as IconName, cls: 'text-error', label: t('home.showcase.preview.overdue') },
    { icon: 'pending' as IconName, cls: 'text-info', label: t('home.showcase.preview.dueToday') },
    { icon: 'lock' as IconName, cls: 'text-warning', label: t('home.showcase.preview.blocked') },
  ];
  return (
    <AppFrame role="hire">
      <div className="relative grid grid-cols-4 gap-1 pt-6">
        <span className="absolute top-0 left-[58%] rounded-sm bg-tertiary px-1.5 text-label-small text-on-tertiary">
          {t('home.solution.illo.today')}
        </span>
        <span className="absolute top-4 bottom-0 left-[64%] w-px bg-tertiary" />
        {[100, 85, 60, 0].map((fill, i) => (
          <span key={i} className="h-2 overflow-hidden rounded-full bg-outline-variant">
            <span className="block h-full bg-primary" style={{ width: `${fill}%` }} />
          </span>
        ))}
      </div>
      <p className="text-title-small text-on-surface">{t('home.showcase.preview.next')}</p>
      <ul className="flex flex-col divide-y divide-outline-variant rounded-md border border-outline-variant">
        {tasks.map((task, i) => (
          <li key={task} className="flex min-w-0 items-center gap-2 p-2">
            <Icon name={status[i]!.icon} size={18} className={cn('shrink-0', status[i]!.cls)} />
            <span className="min-w-0 flex-1 truncate text-label-medium text-on-surface">{task}</span>
            <span className="hidden shrink-0 text-label-small text-on-surface-variant sm:inline">{status[i]!.label}</span>
          </li>
        ))}
      </ul>
    </AppFrame>
  );
}

function ItPreview() {
  const { t } = useTranslation();
  const rows = t('home.showcase.preview.requestRows', { returnObjects: true }) as {
    id: string;
    reason: string;
    status: string;
  }[];
  const tones = [
    'bg-info-container text-on-info-container',
    'bg-warning-container text-on-warning-container',
    'bg-success-container text-on-success-container',
  ];
  return (
    <AppFrame role="it_admin">
      <p className="text-title-small text-on-surface">{t('home.showcase.preview.requests')}</p>
      <ul className="flex flex-col divide-y divide-outline-variant rounded-md border border-outline-variant">
        {rows.map((row, i) => (
          <li key={row.id} className="flex min-w-0 items-center gap-2 p-2">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-label-medium text-on-surface tabular-nums">{row.id}</span>
              <span className="truncate text-label-small text-on-surface-variant">{row.reason}</span>
            </div>
            <span className={cn('shrink-0 rounded-full px-2 text-label-small', tones[i])}>{row.status}</span>
          </li>
        ))}
      </ul>
    </AppFrame>
  );
}

export const ROLE_PREVIEW: Record<Role, () => ReactNode> = {
  admin: AdminPreview,
  manager: ManagerPreview,
  hire: HirePreview,
  it_admin: ItPreview,
};
