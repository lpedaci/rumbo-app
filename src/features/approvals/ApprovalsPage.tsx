import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { FilterChip } from '@/components/ui/FilterChip';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { TextArea } from '@/components/ui/TextArea';
import { toast } from '@/components/ui/toast-store';
import { decideBlock, sortApprovals } from '@/lib/approvals';
import { formatDateTime } from '@/lib/dates';
import { issuesByPath } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { ApprovalRequest } from '@/types/domain';
import { ApprovalRow, ApprovalStatusPill, useApprovalText } from './ApprovalBits';

type Filter = 'pending' | 'decided' | 'all';
const FILTERS: Filter[] = ['pending', 'decided', 'all'];
const match = (a: ApprovalRequest, f: Filter) => f === 'all' || (f === 'pending') === (a.status === 'pending');

const rejectSchema = z.string().trim().min(10, 'approvals.noteRequired').max(300, 'approvals.noteMax');
const approveSchema = z.string().trim().max(300, 'approvals.noteMax');

/**
 * S7 · Approvals (F14): the sensitive changes that wait for a second person in IT (admin roles,
 * security policies). Pending ones first; the detail shows what changes, who asked and why, and
 * lets someone else approve (applied at once) or reject with a reason. Whoever asked, or the
 * person the change is about, sees why they cannot decide it.
 */
export function ApprovalsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const approvals = useDataStore((s) => s.approvals);
  const [filter, setFilter] = useState<Filter>('pending');
  const [params, setParams] = useSearchParams();
  const selected = approvals.find((a) => a.id === params.get('request'));
  const shown = sortApprovals(approvals.filter((a) => match(a, filter)));
  const count = (f: Filter) => approvals.filter((a) => match(a, f)).length;
  const open = (id: string | null) => setParams(id ? { request: id } : {}, { replace: true });

  return (
    <>
      <PageHeader title={t('approvals.title')} description={t('approvals.description')} />

      <Card title={t('approvals.listTitle')}>
        {/* Filters as in the other listings (D-78, D-107): chips from 640 px, a menu on phones */}
        <div role="group" aria-label={t('approvals.filter')} className="hidden flex-wrap gap-3 sm:flex">
          {FILTERS.map((f) => (
            <FilterChip
              key={f}
              label={t(`approvals.filters.${f}`)}
              count={count(f)}
              selected={filter === f}
              onClick={() => setFilter(f)}
            />
          ))}
        </div>
        <FilterMenu
          className="sm:hidden"
          label={t('approvals.filter')}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={FILTERS.map((f) => ({ value: f, label: t(`approvals.filters.${f}`), count: count(f) }))}
        />

        {shown.length === 0 ? (
          <p className="border-t border-outline-variant pt-4 text-body-medium text-on-surface-variant">
            {t('approvals.empty')}
          </p>
        ) : (
          <ul className="-mx-2 flex flex-col border-t border-outline-variant pt-1">
            {shown.map((a) => (
              <ApprovalRow key={a.id} approval={a} viewerId={user?.personId ?? ''} onOpen={() => open(a.id)} />
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(v) => !v && open(null)}>
        {selected && <ApprovalDetail key={selected.id} approval={selected} onDone={() => open(null)} />}
      </Dialog>
    </>
  );
}

function ApprovalDetail({ approval: a, onDone }: { approval: ApprovalRequest; onDone: () => void }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const text = useApprovalText();
  const target = useDataStore((s) => (a.action === 'role.change' ? s.people.find((p) => p.id === a.targetId) : undefined));
  const [note, setNote] = useState('');
  const [tried, setTried] = useState<'approved' | 'rejected' | null>(null);
  const block = user ? decideBlock(a, user.personId) : 'decided';
  const canDecide = !block;
  const issue =
    tried && issuesByPath((tried === 'rejected' ? rejectSchema : approveSchema).safeParse(note))[''];

  const decide = (decision: 'approved' | 'rejected') => {
    if (!user) return;
    setTried(decision);
    const problem = issuesByPath((decision === 'rejected' ? rejectSchema : approveSchema).safeParse(note))[''];
    if (problem) {
      document.getElementById('approval-note')?.focus();
      return;
    }
    if (useDataStore.getState().decideApproval(a.id, decision, note, user.personId)) {
      toast.success(t(decision === 'approved' ? 'approvals.approvedToast' : 'approvals.rejectedToast', { id: a.id }));
      onDone();
    }
  };

  const facts: [string, string][] = [
    [t('approvals.facts.change'), text.change(a)],
    [t('approvals.facts.requester'), text.nameOf(a.requestedBy)],
    [t('approvals.facts.sent'), formatDateTime(a.createdAt)],
    ...(a.status !== 'pending' ? ([[t('approvals.facts.decision'), text.decided(a)]] as [string, string][]) : []),
  ];

  return (
    <DialogContent
      title={t('approvals.dialogTitle', { id: a.id, action: t(`approvals.actions.${a.action}`) })}
      className="max-w-2xl"
      actions={
        canDecide ? (
          <>
            <Button variant="outlined" leadingIcon="cancel" onClick={() => decide('rejected')}>
              {t('approvals.reject')}
            </Button>
            <Button leadingIcon="check" onClick={() => decide('approved')}>
              {t('approvals.approve')}
            </Button>
          </>
        ) : (
          <DialogClose asChild>
            <Button variant="outlined">{t('ui.close')}</Button>
          </DialogClose>
        )
      }
    >
      <div className="flex min-w-0 items-start gap-3">
        {target && <Avatar name={target.name} role={target.role} />}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-title-small text-on-surface">{text.title(a)}</span>
          {target && (
            <span className="text-body-small text-on-surface-variant [overflow-wrap:anywhere]">{target.email}</span>
          )}
        </div>
        <ApprovalStatusPill status={a.status} className="shrink-0" />
      </div>

      <dl className="flex flex-col border-y border-outline-variant">
        {facts.map(([label, value]) => (
          <div key={label} className="flex flex-wrap justify-between gap-2 border-b border-outline-variant py-3 last:border-b-0">
            <dt className="text-body-medium text-on-surface-variant">{label}</dt>
            <dd className="text-body-medium text-on-surface tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-1">
        <h3 className="text-title-small text-on-surface">{t('approvals.reason')}</h3>
        <p className="text-body-medium text-on-surface">{a.reason}</p>
      </section>

      {a.decisionNote && (
        <section className="flex flex-col gap-1 rounded-md bg-surface-container p-3">
          <h3 className="text-label-medium text-on-surface-variant">{t('approvals.decisionNote')}</h3>
          <p className="text-body-medium text-on-surface">{a.decisionNote}</p>
        </section>
      )}

      {(block === 'own' || block === 'target') && <InlineAlert tone="info">{t(`approvals.blocked.${block}`)}</InlineAlert>}

      {canDecide && (
        <>
          <p className="text-body-medium text-on-surface">
            {a.action === 'role.change'
              ? t('approvals.applyRole', { name: target?.name ?? '', role: text.roleName(a.toRole, a.targetId) })
              : t('approvals.applyPolicy')}
          </p>
          <TextArea
            id="approval-note"
            label={t('approvals.noteLabel')}
            helperText={t('approvals.noteHelp')}
            error={issue ? t(issue) : undefined}
            value={note}
            rows={3}
            onChange={(event) => setNote(event.target.value)}
          />
        </>
      )}
    </DialogContent>
  );
}
