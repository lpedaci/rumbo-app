import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { progressOf } from '@/lib/journey';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { Piece } from './HireWelcomeIllustrations';

/**
 * Illustrations of the HR, manager and IT welcomes (F16, D-127), with the same recipe as the new
 * hire's: real Rumbo pieces in miniature, with demo data, appearing in sequence. Decorative.
 */

const miniCard = 'rounded-lg border border-outline-variant bg-surface-container-lowest shadow-elevation-1';

// ---------- HR ----------

export function HrPanelIllustration({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const hires = useDataStore((s) => s.hires);
  const active = hires.filter((h) => h.status === 'active').length;
  const upcoming = hires.filter((h) => h.status === 'upcoming').length;
  return (
    <div className="grid w-64 grid-cols-2 gap-3">
      {[
        { icon: 'groups' as const, label: t('welcome.mini.activeHires'), value: active },
        { icon: 'person_add' as const, label: t('welcome.mini.upcoming'), value: upcoming },
      ].map((kpi, i) => (
        <Piece key={kpi.label} order={i} reduce={reduce} className={cn(miniCard, 'flex flex-col gap-2 p-3')}>
          <IconTile icon={kpi.icon} tone="primary" size="sm" />
          <span className="text-body-small text-on-surface-variant">{kpi.label}</span>
          <span className="text-headline-small text-on-surface tabular-nums">{kpi.value}</span>
        </Piece>
      ))}
    </div>
  );
}

export function HrTemplatesIllustration({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const templates = useDataStore((s) => s.templates).slice(0, 3);
  return (
    <div className="flex w-64 flex-col gap-2">
      {templates.map((tpl, i) => (
        <Piece key={tpl.id} order={i} reduce={reduce} className={cn(miniCard, 'flex items-center gap-2 px-3 py-2')}>
          <Icon name="description" size={18} className="text-on-surface-variant" />
          <span className="min-w-0 flex-1 truncate text-label-large text-on-surface">{tpl.name}</span>
          <span className="text-body-small text-on-surface-variant tabular-nums">
            {t('welcome.mini.tasks', { count: tpl.tasks.length })}
          </span>
        </Piece>
      ))}
    </div>
  );
}

export function HrAlertIllustration({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const people = useDataStore((s) => s.people);
  const hires = useDataStore((s) => s.hires);
  const escalated = hires.find((h) => h.checkins.some((c) => c.action?.type === 'escalate'));
  const person = people.find((p) => p.id === escalated?.personId);
  if (!person) return null;
  return (
    <Piece order={0} reduce={reduce} className={cn(miniCard, 'flex w-64 flex-col gap-3 p-4')}>
      <div className="flex items-center gap-2">
        <IconTile icon="warning" tone="error" size="sm" />
        <span className="text-label-medium text-on-surface-variant">{t('welcome.mini.alert')}</span>
      </div>
      <div className="flex items-center gap-3">
        <Avatar name={person.name} role={person.role} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-title-small text-on-surface">{person.name}</span>
          <span className="truncate text-body-small text-on-surface-variant">{t('welcome.mini.escalated')}</span>
        </div>
      </div>
    </Piece>
  );
}

// ---------- Manager ----------

export function TeamIllustration({ reduce, managerId }: { reduce: boolean; managerId: string }) {
  const people = useDataStore((s) => s.people);
  const hires = useDataStore((s) => s.hires);
  const team = hires.filter((h) => h.managerId === managerId && h.status === 'active').slice(0, 3);
  return (
    <div className="flex w-64 flex-col gap-2">
      {team.map((hire, i) => {
        const person = people.find((p) => p.id === hire.personId);
        const progress = progressOf(hire.tasks);
        return person ? (
          <Piece key={hire.id} order={i} reduce={reduce} className={cn(miniCard, 'flex items-center gap-3 px-3 py-2')}>
            <Avatar name={person.name} role={person.role} size="sm" />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-label-large text-on-surface">{person.name}</span>
              <ProgressBar value={progress.percent} label={person.name} />
            </span>
          </Piece>
        ) : null;
      })}
    </div>
  );
}

export function CheckinReviewIllustration({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const rows = [
    { label: t('welcome.mini.milestone1'), tone: 'success' as const, icon: 'check_circle' as const, state: t('welcome.mini.met') },
    { label: t('welcome.mini.milestone2'), tone: 'warning' as const, icon: 'pending' as const, state: t('welcome.mini.partial') },
  ];
  return (
    <Piece order={0} reduce={reduce} className={cn(miniCard, 'flex w-80 max-w-[calc(100vw-4rem)] flex-col gap-2 p-4')}>
      <span className="text-label-medium text-on-surface-variant">{t('welcome.mini.checkin')}</span>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <Icon name="flag" size={16} className="text-tertiary" />
          <span className="min-w-0 flex-1 truncate text-body-small text-on-surface">{row.label}</span>
          <StatusPill tone={row.tone} icon={row.icon} label={row.state} />
        </div>
      ))}
    </Piece>
  );
}

export function AccessReviewIllustration({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex w-64 flex-col gap-2">
      {['Jira', 'GitHub'].map((system, i) => (
        <Piece key={system} order={i} reduce={reduce} className={cn(miniCard, 'flex items-center gap-2 px-3 py-2')}>
          <Icon name="key" size={18} className="text-on-surface-variant" />
          <span className="min-w-0 flex-1 text-label-large text-on-surface">{system}</span>
          {i === 0 ? (
            <StatusPill tone="success" icon="check_circle" label={t('welcome.mini.keep')} />
          ) : (
            <span className="rounded-sm border border-outline px-2 py-0.5 text-label-medium text-primary">
              {t('welcome.mini.review')}
            </span>
          )}
        </Piece>
      ))}
    </div>
  );
}

// ---------- IT ----------

export function RequestIllustration({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const people = useDataStore((s) => s.people);
  const request = useDataStore((s) => s.accessRequests.find((r) => r.status === 'new'));
  const person = people.find((p) => p.id === request?.personId);
  if (!request) return null;
  return (
    <Piece order={0} reduce={reduce} className={cn(miniCard, 'flex w-64 flex-col gap-3 p-4')}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-medium text-on-surface-variant tabular-nums">{request.id}</span>
        <StatusPill tone="info" icon="schedule" label={t('welcome.mini.new')} />
      </div>
      {person && (
        <div className="flex items-center gap-3">
          <Avatar name={person.name} role={person.role} size="sm" />
          <span className="truncate text-label-large text-on-surface">{person.name}</span>
        </div>
      )}
      <span className="flex items-center gap-1.5 text-body-small text-on-surface-variant">
        <Icon name="verified_user" size={16} />
        {t('welcome.mini.verify')}
      </span>
    </Piece>
  );
}

export function TwoPeopleIllustration({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const people = useDataStore((s) => s.people);
  const admins = people.filter((p) => p.role === 'it_admin').slice(0, 2);
  return (
    <div className="flex w-64 flex-col items-center gap-3">
      <Piece order={0} reduce={reduce} className="flex items-center gap-3">
        {admins.map((p, i) => (
          <span key={p.id} className="flex items-center gap-3">
            {i > 0 && <Icon name="swap_horiz" className="text-on-surface-variant" />}
            <Avatar name={p.name} role={p.role} size="lg" />
          </span>
        ))}
      </Piece>
      <Piece order={1} reduce={reduce} className={cn(miniCard, 'flex items-center gap-2 px-3 py-2')}>
        <Icon name="approval" size={18} className="text-primary" />
        <span className="text-label-large text-on-surface">{t('welcome.mini.twoPeople')}</span>
      </Piece>
    </div>
  );
}

export function AuditIllustration({ reduce }: { reduce: boolean }) {
  const { t } = useTranslation();
  const rows = [
    { icon: 'check_circle' as const, tone: 'text-success', label: t('welcome.mini.auditLogin') },
    { icon: 'block' as const, tone: 'text-error', label: t('welcome.mini.auditDenied') },
    { icon: 'lock_open' as const, tone: 'text-success', label: t('welcome.mini.auditUnlock') },
  ];
  return (
    <div className="flex w-64 flex-col gap-2">
      {rows.map((row, i) => (
        <Piece key={row.label} order={i} reduce={reduce} className={cn(miniCard, 'flex items-center gap-2 px-3 py-2')}>
          <Icon name={row.icon} size={18} className={row.tone} />
          <span className="min-w-0 flex-1 truncate text-body-small text-on-surface">{row.label}</span>
        </Piece>
      ))}
    </div>
  );
}
