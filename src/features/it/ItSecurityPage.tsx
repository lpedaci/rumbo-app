import { Tabs } from 'radix-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { Icon, type IconName } from '@/components/ui/Icon';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { toast } from '@/components/ui/toast-store';
import { AUDIT_CATEGORIES, auditCsv, type AuditCategory, filterAudit, isOpen, lockedAccounts } from '@/lib/access';
import { addDays, DEMO_TODAY, formatDateTime } from '@/lib/dates';
import { can, PERMISSIONS, ROLES, type Action } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { AuditEvent } from '@/types/domain';
import { OrgSessions } from './OrgSessions';

type Tab = 'locked' | 'sessions' | 'audit' | 'permissions' | 'policies';
const TABS: { value: Tab; icon: IconName }[] = [
  { value: 'locked', icon: 'lock' },
  { value: 'sessions', icon: 'devices' },
  { value: 'audit', icon: 'history' },
  { value: 'permissions', icon: 'admin_panel_settings' },
  { value: 'policies', icon: 'policy' },
];

/**
 * S3 · Security and audit (CLAUDE.md F6), for IT only: locked accounts with a direct unlock,
 * the audit log with filters and CSV export, the permission matrix generated from
 * permissions.ts and the organization policies. Tabs keep each tool one click away.
 */
export function ItSecurityPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('locked');
  const attempts = useDataStore((s) => s.authAttempts);
  const locked = lockedAccounts(attempts).length;

  return (
    <>
      <PageHeader title={t('it.security.title')} description={t('it.security.description')} />
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex flex-col gap-(--space-bento-gap)">
        <Tabs.List
          aria-label={t('it.security.tabsLabel')}
          // Every tab visible, never cut or scrolled (D-90): a 2 × 2 grid on phones, one row from 640 px
          // 5 tabs: the last one takes the whole row on phones, so none is left alone at half width
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>*:last-child:nth-child(odd)]:col-span-2"
        >
          {TABS.map((item) => (
            <Tabs.Trigger
              key={item.value}
              value={item.value}
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-sm whitespace-nowrap border border-outline-variant bg-surface-container-lowest px-3 py-2 text-center text-label-large text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-2 sm:min-h-10 sm:justify-start focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-on-primary"
            >
              <Icon name={item.icon} size={20} filled={tab === item.value} />
              {t(`it.security.tabs.${item.value}`)}
              {item.value === 'locked' && locked > 0 && (
                <span className="rounded-full bg-error px-1.5 text-label-small text-on-error tabular-nums">
                  {locked}
                </span>
              )}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="locked" className="outline-none">
          <LockedAccounts />
        </Tabs.Content>
        <Tabs.Content value="sessions" className="outline-none">
          <OrgSessions />
        </Tabs.Content>
        <Tabs.Content value="audit" className="outline-none">
          <AuditLog />
        </Tabs.Content>
        <Tabs.Content value="permissions" className="outline-none">
          <PermissionMatrix />
        </Tabs.Content>
        <Tabs.Content value="policies" className="outline-none">
          <Policies />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}

const PANEL = 'overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest';

function PanelHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between md:p-(--space-card-padding)">
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-title-medium text-on-surface">{title}</h2>
        <p className="text-body-small text-on-surface-variant">{description}</p>
      </div>
      {action}
    </div>
  );
}

// ---------- Locked accounts ----------

function LockedAccounts() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const attempts = useDataStore((s) => s.authAttempts);
  const people = useDataStore((s) => s.people);
  const requests = useDataStore((s) => s.accessRequests);
  const [confirm, setConfirm] = useState<string | null>(null);
  const list = lockedAccounts(attempts);
  const canUnlock = can(user, 'account:unlock');

  return (
    <section aria-labelledby="locked-title" className={PANEL}>
      <div className="flex flex-col gap-1 p-4 md:p-(--space-card-padding)">
        <h2 id="locked-title" className="text-title-medium text-on-surface">
          {t('it.locked.title')}
        </h2>
        <p className="text-body-small text-on-surface-variant">{t('it.locked.description')}</p>
      </div>
      {list.length === 0 ? (
        <p className="flex items-start gap-2 border-t border-outline-variant p-4 text-body-medium text-on-surface md:p-(--space-card-padding)">
          <Icon name="check_circle" size={20} className="shrink-0 text-success" />
          {t('it.locked.empty')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-outline-variant border-t border-outline-variant">
          {list.map((a) => {
            const person = people.find((p) => p.email.toLowerCase() === a.email.toLowerCase());
            const request = requests.find((r) => isOpen(r) && r.email.toLowerCase() === a.email.toLowerCase());
            return (
              <li
                key={a.email}
                className="flex min-w-0 flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:gap-6 md:px-(--space-card-padding)"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {person && <Avatar name={person.name} role={person.role} size="sm" />}
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <span className="truncate text-title-small text-on-surface">{person?.name ?? a.email}</span>
                    <span className="text-body-small [overflow-wrap:anywhere] text-on-surface-variant">{a.email}</span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-small text-on-surface-variant tabular-nums">
                      <StatusPill tone="error" icon="lock" label={t('it.locked.attempts', { count: a.failedCount })} />
                      {a.lastAttemptAt && t('it.locked.last', { date: formatDateTime(a.lastAttemptAt) })}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3 pl-11 sm:gap-4 sm:pl-0">
                  {request && (
                    <Button asChild variant="text" size="xs" trailingIcon="arrow_forward">
                      <Link to={`/it/requests/${request.id}`}>{t('it.locked.viewRequest', { id: request.id })}</Link>
                    </Button>
                  )}
                  {canUnlock && (
                    <Button variant="tonal" size="xs" leadingIcon="lock_open" onClick={() => setConfirm(a.email)}>
                      {t('it.locked.unlock')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={t('it.locked.confirmTitle')}
        description={t('it.locked.confirmBody', { email: confirm ?? '' })}
        confirmLabel={t('it.locked.confirmAction')}
        destructive={false}
        onConfirm={() => {
          if (!confirm || !user) return;
          useDataStore.getState().unlockAccount(confirm, user.personId);
          toast.success(t('it.locked.unlocked'));
        }}
      />
    </section>
  );
}

// ---------- Audit log ----------

const RESULT: Record<AuditEvent['result'], { tone: StatusTone; icon: IconName }> = {
  success: { tone: 'success', icon: 'check_circle' },
  failure: { tone: 'error', icon: 'error' },
  denied: { tone: 'warning', icon: 'block' },
};
type Range = '7' | '30' | 'all';
const PAGE = 15;

function AuditLog() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const events = useDataStore((s) => s.auditEvents);
  const people = useDataStore((s) => s.people);
  const [actorId, setActorId] = useState('all');
  const [category, setCategory] = useState<AuditCategory | 'all'>('all');
  const [range, setRange] = useState<Range>('30');
  const [limit, setLimit] = useState(PAGE);

  const nameOf = (id: string) =>
    id === 'anonymous' ? t('it.history.anonymous') : (people.find((p) => p.id === id)?.name ?? id);
  const actors = [...new Set(events.map((e) => e.actorId))].sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'es'));
  const from = range === 'all' ? '' : addDays(DEMO_TODAY, -Number(range));
  const shown = filterAudit(events, { actorId, category, from, to: '' });
  const actionLabel = (action: string) => t(`it.audit.actions.${action}`, { defaultValue: action });

  const exportCsv = () => {
    if (!user) return;
    const csv = auditCsv(
      shown,
      {
        at: t('it.audit.columns.at'),
        actor: t('it.audit.columns.actor'),
        action: t('it.audit.columns.action'),
        resource: t('it.audit.columns.resource'),
        result: t('it.audit.columns.result'),
        detail: t('it.audit.columns.detail'),
      },
      nameOf,
    );
    const url = URL.createObjectURL(
      new Blob([String.fromCharCode(0xfeff) + csv] /* BOM so spreadsheet apps read the accents */, {
        type: 'text/csv;charset=utf-8',
      }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria-rumbo-${DEMO_TODAY}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    useDataStore.getState().logAudit({
      actorId: user.personId,
      action: 'audit.export',
      result: 'success',
      detail: `${shown.length} eventos`,
    });
    toast.success(t('it.audit.exported'));
  };

  return (
    <section aria-labelledby="audit-title" className={PANEL}>
      <div className="flex flex-col gap-4 p-4 md:p-(--space-card-padding)">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="audit-title" className="text-title-medium text-on-surface">
              {t('it.audit.title')}
            </h2>
            <p className="text-body-small text-on-surface-variant">{t('it.audit.description')}</p>
          </div>
          {can(user, 'audit:export') && (
            <Button
              variant="outlined"
              leadingIcon="download"
              onClick={exportCsv}
              disabledReason={shown.length === 0 ? t('it.audit.empty') : undefined}
            >
              {t('it.audit.export')}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
          <FilterMenu
            label={t('it.audit.filters.actor')}
            value={actorId}
            onChange={(v) => {
              setActorId(v);
              setLimit(PAGE);
            }}
            options={[
              { value: 'all', label: t('it.audit.filters.allActors') },
              ...actors.map((id) => ({ value: id, label: nameOf(id) })),
            ]}
          />
          <FilterMenu
            label={t('it.audit.filters.category')}
            value={category}
            onChange={(v) => {
              setCategory(v as AuditCategory | 'all');
              setLimit(PAGE);
            }}
            options={[
              { value: 'all', label: t('it.audit.filters.allCategories') },
              ...AUDIT_CATEGORIES.map((c) => ({ value: c, label: t(`it.audit.categories.${c}`) })),
            ]}
          />
          <FilterMenu
            label={t('it.audit.filters.range')}
            value={range}
            onChange={(v) => {
              setRange(v as Range);
              setLimit(PAGE);
            }}
            options={(['7', '30', 'all'] as Range[]).map((r) => ({ value: r, label: t(`it.audit.ranges.${r}`) }))}
          />
          <p className="text-body-medium text-on-surface-variant tabular-nums" aria-live="polite">
            {t('it.audit.results', { count: shown.length })}
          </p>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="border-t border-outline-variant p-6 text-body-large text-on-surface">{t('it.audit.empty')}</p>
      ) : (
        <>
          <div className="hidden lg:block">
            <TableContainer label={t('it.audit.title')} className="rounded-none border-x-0 border-b-0">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{t('it.audit.columns.at')}</TableHeaderCell>
                    <TableHeaderCell>{t('it.audit.columns.actor')}</TableHeaderCell>
                    <TableHeaderCell>{t('it.audit.columns.action')}</TableHeaderCell>
                    <TableHeaderCell>{t('it.audit.columns.resource')}</TableHeaderCell>
                    <TableHeaderCell>{t('it.audit.columns.result')}</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shown.slice(0, limit).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap tabular-nums">{formatDateTime(e.at)}</TableCell>
                      <TableCell className="max-w-48 truncate">{nameOf(e.actorId)}</TableCell>
                      <TableCell className="max-w-80">
                        <div className="flex flex-col gap-0.5">
                          <span>{actionLabel(e.action)}</span>
                          {e.detail && (
                            <span className="truncate text-body-small text-on-surface-variant" title={e.detail}>
                              {e.detail}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-on-surface-variant" title={e.resource}>
                        {e.resource ?? '·'}
                      </TableCell>
                      <TableCell>
                        <StatusPill
                          tone={RESULT[e.result].tone}
                          icon={RESULT[e.result].icon}
                          label={t(`it.audit.results_.${e.result}`)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          <ul className="flex flex-col divide-y divide-outline-variant border-t border-outline-variant lg:hidden">
            {shown.slice(0, limit).map((e) => (
              <li key={e.id} className="flex min-w-0 flex-col gap-1.5 px-4 py-4">
                <span className="flex min-w-0 items-start justify-between gap-3">
                  <span className="min-w-0 text-title-small text-on-surface">{actionLabel(e.action)}</span>
                  <StatusPill
                    tone={RESULT[e.result].tone}
                    icon={RESULT[e.result].icon}
                    label={t(`it.audit.results_.${e.result}`)}
                    className="shrink-0"
                  />
                </span>
                <span className="truncate text-body-small text-on-surface-variant tabular-nums">
                  {nameOf(e.actorId)} · {formatDateTime(e.at)}
                </span>
                {(e.resource || e.detail) && (
                  <span className="truncate text-body-small text-on-surface-variant">
                    {[e.resource, e.detail].filter(Boolean).join(' · ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {shown.length > limit && (
            <div className="border-t border-outline-variant p-3">
              <Button
                variant="text"
                size="xs"
                trailingIcon="keyboard_arrow_down"
                onClick={() => setLimit((l) => l + PAGE)}
              >
                {t('it.audit.more', { count: Math.min(PAGE, shown.length - limit) })}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ---------- Permission matrix ----------

function PermissionMatrix() {
  const { t } = useTranslation();
  const actions = Object.keys(PERMISSIONS) as Action[];

  return (
    <section aria-labelledby="perm-title" className={PANEL}>
      <PanelHeader title={t('it.permissions.title')} description={t('it.permissions.description')} />
      <TableContainer label={t('it.permissions.title')} className="rounded-none border-x-0 border-b-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell id="perm-title-action" className="min-w-56">
                {t('it.permissions.action')}
              </TableHeaderCell>
              {ROLES.map((role) => (
                <TableHeaderCell key={role} className="text-center whitespace-nowrap">
                  {t(`roles.${role}`)}
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {actions.map((action) => (
              <TableRow key={action}>
                <TableHeaderCell scope="row" className="bg-transparent font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-body-medium text-on-surface">
                      {t(`it.permissions.actions.${action.replace(':', '_')}`)}
                    </span>
                    <code className="text-body-small text-on-surface-variant">{action}</code>
                  </div>
                </TableHeaderCell>
                {ROLES.map((role) => {
                  const scope = (PERMISSIONS[action] as Partial<Record<string, string>>)[role];
                  return (
                    <TableCell key={role} className="text-center">
                      {scope ? (
                        <span className="inline-flex items-center gap-1 text-body-small text-on-surface">
                          <Icon name="check_circle" size={16} className="text-success" />
                          {t(`it.permissions.scopes.${scope}`)}
                        </span>
                      ) : (
                        <span className="text-body-small text-on-surface-variant">
                          <span aria-hidden>·</span>
                          <span className="sr-only">{t('it.permissions.none')}</span>
                        </span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </section>
  );
}

// ---------- Policies ----------

function Policies() {
  const { t } = useTranslation();
  const policy = useDataStore((s) => s.securityPolicy);
  const items: { icon: IconName; title: string; value: string; detail: string }[] = [
    {
      icon: 'verified_user',
      title: t('it.policies.mfa'),
      value: policy.mfaRequiredFor.map((r) => t(`roles.${r}`)).join(', '),
      detail: t('it.policies.mfaDetail'),
    },
    {
      icon: 'schedule',
      title: t('it.policies.session'),
      value: t('it.policies.minutes', { count: policy.sessionIdleMinutes }),
      detail: t('it.policies.sessionDetail', { count: policy.sessionWarningMinutes }),
    },
    {
      icon: 'lock',
      title: t('it.policies.lockout'),
      value: t('it.policies.attempts', { count: policy.lockoutAttempts }),
      detail: t('it.policies.lockoutDetail'),
    },
    {
      icon: 'password',
      title: t('it.policies.password'),
      value: t('it.policies.chars', { count: policy.passwordMinLength }),
      detail: t('it.policies.passwordDetail'),
    },
    // F10: retention and the privacy notice in force
    {
      icon: 'history',
      title: t('privacy.policies.retentionJourney'),
      value: t('privacy.policies.years', { count: policy.retentionJourneyYears }),
      detail: t('privacy.policies.retentionJourneyDetail'),
    },
    {
      icon: 'fact_check',
      title: t('privacy.policies.retentionSelfReview'),
      value: t('privacy.policies.years', { count: policy.retentionSelfReviewYears }),
      detail: t('privacy.policies.retentionSelfReviewDetail'),
    },
    {
      icon: 'policy',
      title: t('privacy.policies.notice'),
      value: t('privacy.noticeVersion', { version: policy.privacyNoticeVersion }),
      detail: t('privacy.policies.noticeDetail'),
    },
  ];
  return (
    <section aria-labelledby="policies-title" className={cn(PANEL, 'p-4 md:p-(--space-card-padding)')}>
      <div className="mb-4 flex flex-col gap-1">
        <h2 id="policies-title" className="text-title-medium text-on-surface">
          {t('it.policies.title')}
        </h2>
        <p className="text-body-small text-on-surface-variant">{t('it.policies.description')}</p>
      </div>
      <ul className="grid grid-cols-1 gap-(--space-bento-gap) md:grid-cols-2">
        {items.map((item) => (
          <li key={item.title} className="flex min-w-0 items-start gap-3 rounded-md border border-outline-variant p-4">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-container text-on-primary-container"
            >
              <Icon name={item.icon} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="text-title-small text-on-surface-variant">{item.title}</h3>
              <p className="text-title-medium text-on-surface">{item.value}</p>
              <p className="text-body-small text-on-surface-variant">{item.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
