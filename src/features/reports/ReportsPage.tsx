import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import type { IconName } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { RefChip } from '@/components/ui/RefChip';
import { TextArea } from '@/components/ui/TextArea';
import { toast } from '@/components/ui/toast-store';
import { downloadCsv, toCsv } from '@/lib/csv';
import { daysBetween, DEMO_TODAY, formatDate } from '@/lib/dates';
import { checkinDueDate, progressOf, taskStatus } from '@/lib/journey';
import { personStatus } from '@/lib/people';
import { mask } from '@/lib/privacy';
import { issuesByPath } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';

type ReportKey = 'hires' | 'overdue' | 'checkins' | 'people';
const REPORTS: { key: ReportKey; icon: IconName }[] = [
  { key: 'hires', icon: 'groups' },
  { key: 'overdue', icon: 'error' },
  { key: 'checkins', icon: 'event' },
  { key: 'people', icon: 'badge' },
];

const reasonSchema = z.string().trim().min(10, 'reports.unmasked.reasonRequired').max(300, 'reports.unmasked.reasonMax');

/** The rows of each report, built from the demo data and always in the interface language. */
function useReports() {
  const { t } = useTranslation();
  const data = useDataStore();
  const nameOf = (id?: string) => data.people.find((p) => p.id === id)?.name ?? '';

  const people = (unmasked: boolean) => ({
    header: ['name', 'email', 'jobTitle', 'area', 'role', 'status', 'dni', 'cuil'].map((c) => t(`reports.columns.${c}`)),
    rows: data.people.map((p) => {
      const hasHire = data.hires.some((h) => h.personId === p.id);
      return [
        p.name,
        p.email,
        p.jobTitle,
        p.area,
        p.role === 'hire' && !hasHire ? t('people.roleBasic') : t(`roles.${p.role}`),
        t(`people.status.${personStatus(p, data.authAttempts)}`),
        // Sensitive data hidden unless the export was approved by a second person (F14).
        p.dni ? (unmasked ? p.dni : mask(p.dni, 'dni')) : '',
        p.cuil ? (unmasked ? p.cuil : mask(p.cuil, 'cuil')) : '',
      ];
    }),
  });

  const reports: Record<ReportKey, { header: string[]; rows: (string | number)[][] }> = {
    hires: {
      header: ['name', 'jobTitle', 'area', 'startDate', 'status', 'progress', 'overdue', 'manager', 'template'].map((c) =>
        t(`reports.columns.${c}`),
      ),
      rows: data.hires.map((h) => {
        const person = data.people.find((p) => p.id === h.personId);
        const template = data.templates.find((tpl) => tpl.id === h.templateId);
        return [
          person?.name ?? '',
          person?.jobTitle ?? '',
          person?.area ?? '',
          formatDate(h.startDate),
          t(`hires.status.${h.status}`),
          `${progressOf(h.tasks).percent} %`,
          h.tasks.filter((task) => taskStatus(task, h.tasks) === 'overdue').length,
          nameOf(h.managerId),
          template ? `${template.name} v${h.templateVersion ?? 1}` : '',
        ];
      }),
    },
    overdue: {
      header: ['name', 'task', 'owner', 'dueDate', 'daysLate'].map((c) => t(`reports.columns.${c}`)),
      rows: data.hires.flatMap((h) =>
        h.tasks
          .filter((task) => taskStatus(task, h.tasks) === 'overdue')
          .map((task) => [nameOf(h.personId), task.title, t(`owners.${task.owner}`), formatDate(task.dueDate), daysBetween(task.dueDate, DEMO_TODAY)]),
      ),
    },
    checkins: {
      header: ['name', 'checkin', 'dueDate', 'status', 'milestones'].map((c) => t(`reports.columns.${c}`)),
      rows: data.hires.flatMap((h) =>
        h.checkins.map((c) => [
          nameOf(h.personId),
          t(`reports.stages.${c.stage}`),
          formatDate(checkinDueDate(c)),
          t(`hires.detail.checkinStatus.${c.status}`),
          c.status === 'completed'
            ? t('reports.milestones', { met: c.milestones.filter((m) => m.result === 'met').length, total: c.milestones.length })
            : '',
        ]),
      ),
    },
    people: people(false),
  };
  return { reports, people };
}

/**
 * A13 · Reports and exports (F16): lists to CSV with sensitive data always hidden; an export with
 * DNI and CUIL unhidden only after a second person in IT approves it (F14), usable
 * once; and where to print or save as PDF. Every download goes to the audit log.
 */
export function ReportsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { reports, people } = useReports();

  const download = (key: ReportKey) => {
    if (!user) return;
    const report = reports[key];
    downloadCsv(`rumbo-${key}-${DEMO_TODAY}.csv`, toCsv(report.header, report.rows));
    useDataStore.getState().logAudit({
      actorId: user.personId,
      action: 'report.export',
      resource: key,
      result: 'success',
      detail: `${report.rows.length} · masked`,
    });
    toast.success(t('reports.downloaded', { report: t(`reports.items.${key}.title`) }));
  };

  return (
    <>
      <PageHeader title={t('reports.title')} description={t('reports.description')} />
      <div className="flex flex-col gap-(--space-bento-gap)">
        <Card title={t('reports.listTitle')} description={t('reports.listHelp')}>
          <ul className="-mx-2 flex flex-col border-t border-outline-variant">
            {REPORTS.map(({ key, icon }) => (
              <li
                key={key}
                className="flex min-h-14 min-w-0 flex-col gap-3 border-b border-outline-variant px-2 py-3 last:border-b-0 sm:flex-row sm:items-center"
              >
                <span className="flex min-w-0 flex-1 items-start gap-3">
                  <IconTile icon={icon} tone="neutral" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-title-small text-on-surface">{t(`reports.items.${key}.title`)}</span>
                    <span className="text-body-small text-on-surface-variant">{t(`reports.items.${key}.body`)}</span>
                    <span className="text-body-small text-on-surface-variant tabular-nums">
                      {t('reports.rows', { count: reports[key].rows.length })}
                    </span>
                  </span>
                </span>
                <Button
                  variant="outlined"
                  size="xs"
                  leadingIcon="download"
                  className="shrink-0 self-start sm:self-center"
                  aria-label={t('reports.downloadLabel', { report: t(`reports.items.${key}.title`) })}
                  onClick={() => download(key)}
                >
                  {t('reports.download')}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
        <UnmaskedExport build={() => people(true)} />
        <Card title={t('reports.print.title')}>
          <p className="text-body-medium text-on-surface">
            <Trans
              i18nKey="reports.print.body"
              components={{
                panel: <RefChip icon="dashboard" to="/admin" />,
                hires: <RefChip icon="group" to="/admin/hires" />,
              }}
            />
          </p>
        </Card>
      </div>
    </>
  );
}

/** The export with sensitive data unhidden: asked, waits for IT, downloaded once (F14, F16). */
function UnmaskedExport({ build }: { build: () => { header: string[]; rows: (string | number)[][] } }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const approvals = useDataStore((s) => s.approvals);
  const people = useDataStore((s) => s.people);
  const [asking, setAsking] = useState(false);
  const mine = approvals.filter((a) => a.action === 'pii.export' && a.requestedBy === user?.personId);
  const last = mine.at(-1);
  const pending = last?.status === 'pending' ? last : undefined;
  const ready = last?.status === 'approved' && !last.usedAt ? last : undefined;
  const nameOf = (id?: string) => people.find((p) => p.id === id)?.name ?? '';

  const downloadUnmasked = () => {
    if (!user || !ready) return;
    if (!useDataStore.getState().consumeUnmaskedExport(ready.id, user.personId)) return;
    const report = build();
    downloadCsv(`rumbo-people-unmasked-${DEMO_TODAY}.csv`, toCsv(report.header, report.rows));
    toast.success(t('reports.unmasked.downloaded'));
  };

  return (
    <Card title={t('reports.unmasked.title')} description={t('reports.unmasked.description')}>
      {pending ? (
        <InlineAlert tone="warning">{t('reports.unmasked.pending', { id: pending.id })}</InlineAlert>
      ) : ready ? (
        <InlineAlert tone="success">{t('reports.unmasked.approved', { id: ready.id, name: nameOf(ready.decidedBy) })}</InlineAlert>
      ) : last?.status === 'rejected' ? (
        <InlineAlert tone="info">
          {t('reports.unmasked.rejected', { id: last.id, name: nameOf(last.decidedBy), note: last.decisionNote ?? '' })}
        </InlineAlert>
      ) : last?.usedAt ? (
        <p className="text-body-medium text-on-surface-variant">{t('reports.unmasked.used', { id: last.id, date: formatDate(last.usedAt.slice(0, 10)) })}</p>
      ) : null}
      <div className="flex flex-col gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:justify-end">
        {ready ? (
          <Button leadingIcon="download" onClick={downloadUnmasked}>
            {t('reports.unmasked.download')}
          </Button>
        ) : (
          <Button
            variant="outlined"
            leadingIcon="approval"
            disabled={Boolean(pending)}
            aria-describedby={pending ? 'unmasked-pending' : undefined}
            onClick={() => setAsking(true)}
          >
            {t('reports.unmasked.request')}
          </Button>
        )}
      </div>
      {pending && (
        <p id="unmasked-pending" className="sr-only">
          {t('reports.unmasked.pending', { id: pending.id })}
        </p>
      )}
      <Dialog open={asking} onOpenChange={setAsking}>
        {asking && <RequestDialog onDone={() => setAsking(false)} />}
      </Dialog>
    </Card>
  );
}

function RequestDialog({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const issue = issuesByPath(reasonSchema.safeParse(reason))[''];
  const submit = () => {
    setTried(true);
    if (issue || !user) {
      document.getElementById('unmasked-reason')?.focus();
      return;
    }
    const id = useDataStore.getState().requestPiiExport(reason, user.personId);
    toast.success(t('reports.unmasked.sent', { id }));
    onDone();
  };
  return (
    <DialogContent
      title={t('reports.unmasked.dialogTitle')}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outlined">{t('ui.cancel')}</Button>
          </DialogClose>
          <Button leadingIcon="approval" onClick={submit}>
            {t('reports.unmasked.send')}
          </Button>
        </>
      }
    >
      <p className="text-body-medium text-on-surface">{t('reports.unmasked.intro')}</p>
      <TextArea
        id="unmasked-reason"
        label={t('reports.unmasked.reason')}
        required
        helperText={t('reports.unmasked.reasonHelp')}
        error={tried && issue ? t(issue) : undefined}
        value={reason}
        rows={3}
        onChange={(event) => setReason(event.target.value)}
      />
    </DialogContent>
  );
}
