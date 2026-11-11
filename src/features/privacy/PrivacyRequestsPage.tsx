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
import { TextArea } from '@/components/ui/TextArea';
import { toast } from '@/components/ui/toast-store';
import { formatDate, formatDateTime } from '@/lib/dates';
import { issuesByPath } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { PrivacyRequest, PrivacyRequestStatus } from '@/types/domain';
import { PrivacyRequestRow, PrivacyStatusPill, useDueText } from './PrivacyRequestRow';

type Filter = 'open' | 'all' | PrivacyRequestStatus;
const FILTERS: Filter[] = ['open', 'new', 'in_progress', 'answered', 'rejected', 'all'];
const responseSchema = z
  .string()
  .trim()
  .min(10, 'privacy.requests.responseRequired')
  .max(1000, 'privacy.requests.responseMax');

const isOpen = (r: PrivacyRequest) => r.status === 'new' || r.status === 'in_progress';

/**
 * A12 · Requests about personal data (F10): HR sees every request with its legal deadline
 * (overdue first), filters them by status and, in the detail, takes, answers or rejects each
 * one with a written answer that reaches the person. Every step goes to the audit log.
 */
export function PrivacyRequestsPage() {
  const { t } = useTranslation();
  const people = useDataStore((s) => s.people);
  const requests = useDataStore((s) => s.privacyRequests);
  const [filter, setFilter] = useState<Filter>('open');
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('request');
  const selected = requests.find((r) => r.id === selectedId);

  const count = (f: Filter) =>
    requests.filter((r) => (f === 'all' ? true : f === 'open' ? isOpen(r) : r.status === f)).length;
  const label = (f: Filter) =>
    f === 'open' ? t('privacy.requests.open') : f === 'all' ? t('privacy.requests.all') : t(`privacy.status.${f}`);
  const shown = requests
    .filter((r) => (filter === 'all' ? true : filter === 'open' ? isOpen(r) : r.status === filter))
    // Open ones by deadline (the most urgent first), closed ones newest first.
    .sort((a, b) =>
      isOpen(a) && isOpen(b) ? a.dueAt.localeCompare(b.dueAt) : Number(isOpen(b)) - Number(isOpen(a)) || b.createdAt.localeCompare(a.createdAt),
    );
  const open = (id: string | null) => setParams(id ? { request: id } : {}, { replace: true });

  return (
    <>
      <PageHeader title={t('privacy.requests.title')} description={t('privacy.requests.description')} />

      <Card title={t('privacy.requests.listTitle')}>
        {/* Filters as in the other listings (D-78, D-107): chips from 640 px, a menu on phones */}
        <div role="group" aria-label={t('privacy.requests.statusFilter')} className="hidden flex-wrap gap-3 sm:flex">
          {FILTERS.map((f) => (
            <FilterChip key={f} label={label(f)} count={count(f)} selected={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>
        <FilterMenu
          className="sm:hidden"
          label={t('privacy.requests.statusFilter')}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={FILTERS.map((f) => ({ value: f, label: label(f), count: count(f) }))}
        />

        {shown.length === 0 ? (
          <p className="border-t border-outline-variant pt-4 text-body-medium text-on-surface-variant">
            {t('privacy.requests.empty')}
          </p>
        ) : (
          <ul className="-mx-2 flex flex-col border-t border-outline-variant pt-1">
            {shown.map((r) => (
              <PrivacyRequestRow
                key={r.id}
                request={r}
                person={people.find((p) => p.id === r.personId)}
                onOpen={() => open(r.id)}
              />
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={Boolean(selected)} onOpenChange={(v) => !v && open(null)}>
        {selected && <RequestDetail key={selected.id} request={selected} onDone={() => open(null)} />}
      </Dialog>
    </>
  );
}

function RequestDetail({ request: r, onDone }: { request: PrivacyRequest; onDone: () => void }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const person = useDataStore((s) => s.people.find((p) => p.id === r.personId));
  const [response, setResponse] = useState('');
  const [tried, setTried] = useState(false);
  const due = useDueText()(r);
  const issue = issuesByPath(responseSchema.safeParse(response))[''];
  const editable = isOpen(r);

  const update = (status: PrivacyRequestStatus) => {
    if (!user) return;
    if (status !== 'in_progress') {
      setTried(true);
      if (issue) {
        document.getElementById('privacy-response')?.focus();
        return;
      }
    }
    useDataStore.getState().updatePrivacyRequest(r.id, { status, response }, user.personId);
    toast.success(t(`privacy.requests.${status === 'in_progress' ? 'taken' : status}`));
    if (status !== 'in_progress') onDone();
  };

  return (
    <DialogContent
      title={t('privacy.requests.dialogTitle', { id: r.id, type: t(`privacy.types.${r.type}`) })}
      className="max-w-2xl"
      actions={
        editable ? (
          <>
            {r.status === 'new' && (
              <Button variant="outlined" leadingIcon="pending" onClick={() => update('in_progress')}>
                {t('privacy.requests.take')}
              </Button>
            )}
            <Button variant="outlined" leadingIcon="cancel" onClick={() => update('rejected')}>
              {t('privacy.requests.reject')}
            </Button>
            <Button leadingIcon="send" onClick={() => update('answered')}>
              {t('privacy.requests.answer')}
            </Button>
          </>
        ) : (
          <DialogClose asChild>
            <Button variant="outlined">{t('ui.close')}</Button>
          </DialogClose>
        )
      }
    >
      {person && (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={person.name} role={person.role} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-title-small text-on-surface">{person.name}</span>
            <span className="text-body-small text-on-surface-variant [overflow-wrap:anywhere]">{person.email}</span>
          </div>
          <PrivacyStatusPill status={r.status} className="ml-auto self-start" />
        </div>
      )}
      <dl className="flex flex-col border-y border-outline-variant">
        <div className="flex flex-wrap justify-between gap-2 border-b border-outline-variant py-3">
          <dt className="text-body-medium text-on-surface-variant">{t('privacy.requests.sent')}</dt>
          <dd className="text-body-medium text-on-surface tabular-nums">{formatDateTime(r.createdAt)}</dd>
        </div>
        <div className="flex flex-wrap justify-between gap-2 py-3">
          <dt className="text-body-medium text-on-surface-variant">{t('privacy.requests.due')}</dt>
          <dd className={due.late ? 'text-label-large text-error' : 'text-body-medium text-on-surface'}>
            {formatDate(r.dueAt)} · {due.text}
          </dd>
        </div>
      </dl>
      <section className="flex flex-col gap-1">
        <h3 className="text-title-small text-on-surface">{t('privacy.requests.request')}</h3>
        <p className="text-body-medium text-on-surface">{r.detail}</p>
      </section>
      {r.response && (
        <section className="flex flex-col gap-1 rounded-md bg-surface-container p-3">
          <h3 className="text-label-medium text-on-surface-variant">{t('privacy.mine.response')}</h3>
          <p className="text-body-medium text-on-surface">{r.response}</p>
        </section>
      )}
      {editable ? (
        <TextArea
          id="privacy-response"
          label={t('privacy.requests.responseLabel')}
          required
          helperText={t('privacy.requests.responseHelp')}
          error={tried && issue ? t(issue) : undefined}
          value={response}
          rows={3}
          onChange={(event) => setResponse(event.target.value)}
        />
      ) : (
        <p className="text-body-small text-on-surface-variant">{t('privacy.requests.closedNote')}</p>
      )}
    </DialogContent>
  );
}
