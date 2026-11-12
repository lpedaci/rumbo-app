import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { z } from 'zod';
import { DetailHeader, HeaderChip } from '@/components/layout/DetailHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormFooter } from '@/components/ui/FormFooter';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import { MaskedValue } from '@/features/privacy/MaskedValue';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { formatDate, formatDateTime } from '@/lib/dates';
import {
  DEMO_PERSON_IDS,
  itMinimumBlock,
  needsApproval,
  pendingRoleChange,
  personStatus,
  readableRoles,
} from '@/lib/people';
import { ROLES } from '@/lib/permissions';
import { issuesByPath, requiredText } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Person, Role } from '@/types/domain';
import { PersonStatusPill, RoleChip } from './PeopleBits';

const reasonSchema = z.string().trim().min(10, 'people.detail.reasonRequired').max(300, 'people.detail.reasonMax');

/**
 * A10 · Person record (F15), for HR: the detail header (D-94), work data that can be edited
 * (job, title and manager; the area follows the job), masked identifiers (F10), the platform
 * role (admin roles go to a second person, F14) and the history of changes from the audit log.
 */
export function PersonDetailPage() {
  const { id = '' } = useParams();
  const person = useDataStore((s) => s.people.find((p) => p.id === id));
  if (!person) return <AccessDeniedPage reason="not_found" />;
  return <PersonDetail key={person.id} person={person} />;
}

function PersonDetail({ person }: { person: Person }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const people = useDataStore((s) => s.people);
  const attempts = useDataStore((s) => s.authAttempts);
  const jobTitles = useDataStore((s) => s.jobTitles);
  const hire = useDataStore((s) => s.hires.find((h) => h.personId === person.id));
  const events = useDataStore((s) => s.auditEvents);
  const [form, setForm] = useState({
    jobTitleId: person.jobTitleId ?? '',
    jobTitle: person.jobTitle,
    managerId: person.managerId ?? '',
  });
  const [tried, setTried] = useState(false);
  const managers = people.filter((p) => (p.role === 'manager' || p.role === 'admin') && p.id !== person.id);
  const titleIssue = issuesByPath(requiredText.safeParse(form.jobTitle))[''];
  const nameOf = (pid: string) => people.find((p) => p.id === pid)?.name ?? pid;
  const roleName = (r: Role) => (r === 'hire' ? t('people.roleBasic') : t(`roles.${r}`));
  const history = events
    .filter((e) => e.resource === person.id || e.resource?.startsWith(`${person.id}:`))
    .sort((a, b) => b.at.localeCompare(a.at));

  const save = () => {
    setTried(true);
    if (titleIssue || !user) return;
    useDataStore.getState().updatePerson(
      person.id,
      { jobTitleId: form.jobTitleId || undefined, jobTitle: form.jobTitle.trim(), managerId: form.managerId || undefined },
      user.personId,
    );
    toast.success(t('people.detail.saved'));
  };

  return (
    <>
      <nav aria-label={t('people.detail.back')} className="mb-2">
        <Link
          to="/admin/people"
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('people.detail.back')}
        </Link>
      </nav>

      <DetailHeader
        person={{ name: person.name, role: person.role, email: person.email }}
        chipsLabel={t('people.detail.facts')}
        chips={
          <>
            <li>
              <RoleChip role={person.role} newHire={Boolean(hire)} className="h-7" />
            </li>
            <li>
              <PersonStatusPill status={personStatus(person, attempts)} className="h-7" />
            </li>
            <HeaderChip icon="apartment">{person.area}</HeaderChip>
            {person.employeeId && <HeaderChip icon="badge">{person.employeeId}</HeaderChip>}
          </>
        }
        title={person.jobTitle}
        description={t('people.detail.description')}
      />

      <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-2">
        <Card
          title={t('people.detail.workCard')}
          action={
            hire ? (
              <Button asChild variant="text" size="xs" trailingIcon="arrow_forward">
                <Link to={`/admin/hires/${hire.id}`}>{t('people.detail.journey')}</Link>
              </Button>
            ) : undefined
          }
        >
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            className="flex flex-col gap-5"
          >
            <Select
              id="pd-job"
              label={t('people.fields.jobTitleId')}
              helperText={t('people.fields.jobTitleIdHelp')}
              value={form.jobTitleId}
              onChange={(event) => setForm({ ...form, jobTitleId: event.target.value })}
              options={jobTitles.map((j) => ({ value: j.id, label: j.name }))}
            />
            <TextField
              id="pd-title"
              label={t('people.fields.jobTitle')}
              required
              helperText={t('people.fields.jobTitleHelp')}
              error={tried && titleIssue ? t(titleIssue) : undefined}
              value={form.jobTitle}
              onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
            />
            <Select
              id="pd-manager"
              label={t('people.fields.managerId')}
              helperText={t('people.fields.managerIdHelp')}
              value={form.managerId}
              onChange={(event) => setForm({ ...form, managerId: event.target.value })}
              options={[
                { value: '', label: t('people.fields.noManager') },
                ...managers.map((m) => ({ value: m.id, label: m.name })),
              ]}
            />
            <dl className="flex flex-col border-t border-outline-variant">
              {[
                [t('people.fields.email'), <span key="e" className="[overflow-wrap:anywhere]">{person.email}</span>],
                ...(['dni', 'cuil', 'bankAccount'] as const)
                  .filter((f) => person[f])
                  .map((f) => [
                    t(`privacy.mine.fields.${f}`),
                    <MaskedValue key={f} personId={person.id} personName={person.name} field={f} value={person[f]!} />,
                  ]),
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-outline-variant py-3 last:border-b-0"
                >
                  <dt className="text-body-medium text-on-surface-variant">{label}</dt>
                  <dd className="min-w-0 text-body-medium text-on-surface">{value}</dd>
                </div>
              ))}
            </dl>
            <FormFooter>
              <Button type="submit" leadingIcon="save">
                {t('people.detail.save')}
              </Button>
            </FormFooter>
          </form>
        </Card>

        <RoleCard person={person} />

        <Card title={t('people.detail.historyCard')} className="lg:col-span-2">
          {history.length === 0 ? (
            <p className="text-body-medium text-on-surface-variant">{t('people.detail.historyEmpty')}</p>
          ) : (
            <ol className="-mx-2 flex flex-col">
              {history.map((e) => (
                <li
                  key={e.id}
                  className="flex min-w-0 flex-col gap-1 border-b border-outline-variant px-2 py-3 last:border-b-0"
                >
                  <span className="text-title-small text-on-surface">
                    {t(`it.audit.actions.${e.action}`, { defaultValue: e.action })}
                  </span>
                  <span className="text-body-small text-on-surface-variant tabular-nums">
                    {formatDateTime(e.at)} · {nameOf(e.actorId)}
                    {e.detail ? ` · ${readableRoles(e.detail, roleName, t('itMinimum.audit'))}` : ''}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}

/** Platform role (F15): admin roles are given or taken only with a second person (F14). */
function RoleCard({ person }: { person: Person }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const approvals = useDataStore((s) => s.approvals);
  const people = useDataStore((s) => s.people);
  const hasHire = useDataStore((s) => s.hires.some((h) => h.personId === person.id));
  const pending = pendingRoleChange(approvals, person.id);
  const isDemo = DEMO_PERSON_IDS.includes(person.id);
  const [toRole, setToRole] = useState<Role | ''>('');
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const approval = toRole ? needsApproval(person.role, toRole) : false;
  // D-121: taking the IT role away must never leave IT with fewer than two people
  const itBlocked = toRole ? itMinimumBlock(people, person.id, { toRole }) : false;
  const roleIssue = !toRole ? 'people.detail.roleSame' : itBlocked ? 'itMinimum.role' : undefined;
  const reasonIssue = issuesByPath(reasonSchema.safeParse(reason))[''];

  const submit = () => {
    setTried(true);
    if (itBlocked && user && toRole) {
      // The attempt is recorded as denied in the audit log (the store checks it too).
      useDataStore.getState().changeRole(person.id, toRole, reason, user.personId);
      document.getElementById('pd-role')?.focus();
      return;
    }
    if (roleIssue || reasonIssue || !user || !toRole) return;
    const id = useDataStore.getState().changeRole(person.id, toRole, reason, user.personId);
    toast.success(id ? t('people.detail.approvalRequested', { id }) : t('people.detail.roleChanged'));
    setToRole('');
    setReason('');
    setTried(false);
  };

  return (
    <Card title={t('people.detail.roleCard')} description={t('people.detail.roleHelp')}>
      <p className="flex flex-wrap items-center gap-2 text-body-medium text-on-surface-variant">
        {t('people.detail.currentRole')}: <RoleChip role={person.role} newHire={hasHire} />
      </p>
      {pending ? (
        <InlineAlert tone="warning">
          {t('people.detail.pending', {
            role: pending.toRole === 'hire' && !hasHire ? t('people.roleBasic') : t(`roles.${pending.toRole}`),
            id: pending.id,
            name: people.find((p) => p.id === pending.requestedBy)?.name ?? '',
            date: formatDate(pending.createdAt.slice(0, 10)),
          })}
        </InlineAlert>
      ) : isDemo ? (
        <p className="flex items-start gap-2 text-body-medium text-on-surface-variant">
          <Icon name="info" size={20} className="mt-px shrink-0" />
          {t('people.detail.demoLocked')}
        </p>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="flex flex-col gap-5"
        >
          <Select
            id="pd-role"
            label={t('people.detail.newRole')}
            required
            helperText={t('people.detail.newRoleHelp')}
            error={tried && roleIssue ? t(roleIssue) : undefined}
            value={toRole}
            onChange={(event) => setToRole(event.target.value as Role)}
            options={[
              { value: '', label: t('hires.form.choose') },
              ...ROLES.filter((r) => r !== person.role).map((r) => ({
                value: r,
                label: r === 'hire' ? t('people.roleBasicFilter') : t(`roles.${r}`),
              })),
            ]}
          />
          <TextArea
            id="pd-reason"
            label={t('people.detail.reason')}
            required
            helperText={t('people.detail.reasonHelp')}
            error={tried && reasonIssue ? t(reasonIssue) : undefined}
            value={reason}
            rows={2}
            onChange={(event) => setReason(event.target.value)}
          />
          <FormFooter noteIcon="admin_panel_settings" note={approval ? t('people.detail.approvalNote') : undefined}>
            <Button type="submit" leadingIcon={approval ? 'admin_panel_settings' : 'check'}>
              {approval ? t('people.detail.requestApproval') : t('people.detail.changeRole')}
            </Button>
          </FormFooter>
        </form>
      )}
    </Card>
  );
}
