import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TextArea } from '@/components/ui/TextArea';
import { toast } from '@/components/ui/toast-store';
import { campaignProgress, itemState, revokeBlock } from '@/lib/access-review';
import { cn } from '@/lib/utils';
import { issuesByPath } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { AccessReviewCampaign, AccessReviewItem, Person } from '@/types/domain';
import { ReviewStatePill, useReviewText } from './ReviewBits';

const reasonSchema = z
  .string()
  .trim()
  .min(10, 'accessReview.revokeDialog.reasonRequired')
  .max(300, 'accessReview.revokeDialog.reasonMax');

/**
 * J4 · Access review (F13): the rows assigned to whoever looks at it, by open campaign and by
 * person. Managers review their team; HR reviews the people without a direct manager and IT
 * reviews HR (the same screen under /admin and /it). Nobody sees their own access here.
 */
export function ReviewPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const campaigns = useDataStore((s) => s.accessReviews);
  const mine = campaigns
    .filter((c) => c.status === 'open')
    .map((c) => ({ campaign: c, items: c.items.filter((i) => i.reviewerId === user?.personId) }))
    .filter((c) => c.items.length > 0);

  return (
    <>
      <PageHeader title={t('accessReview.title')} description={t('accessReview.description')} />
      {mine.length === 0 ? (
        <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding) text-body-medium text-on-surface-variant">
          {t('accessReview.empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-(--space-bento-gap)">
          {mine.map(({ campaign, items }) => (
            <CampaignReview key={campaign.id} campaign={campaign} items={items} />
          ))}
        </div>
      )}
    </>
  );
}

function CampaignReview({ campaign, items }: { campaign: AccessReviewCampaign; items: AccessReviewItem[] }) {
  const { t } = useTranslation();
  const text = useReviewText();
  const people = useDataStore((s) => s.people);
  const due = text.due(campaign);
  const { done, total, percent } = campaignProgress(items);
  const byPerson = [...new Set(items.map((i) => i.personId))]
    .map((id) => ({ person: people.find((p) => p.id === id), rows: items.filter((i) => i.personId === id) }))
    // People with something pending first, then by name.
    .sort(
      (a, b) =>
        Number(b.rows.some((r) => !r.decision)) - Number(a.rows.some((r) => !r.decision)) ||
        (a.person?.name ?? '').localeCompare(b.person?.name ?? '', 'es'),
    );

  return (
    <Card title={campaign.name}>
      <div className="flex flex-col gap-2">
        <p className={cn('flex items-center gap-1 text-label-medium', due.late ? 'text-error' : 'text-on-surface')}>
          <Icon name={due.late ? 'error' : 'event'} size={16} />
          {due.text}
        </p>
        <ProgressBar value={percent} label={t('accessReview.progress', { done, total })} size="lg" />
        <p className="text-body-small text-on-surface-variant tabular-nums">{t('accessReview.progress', { done, total })}</p>
      </div>
      <div className="flex flex-col gap-6 border-t border-outline-variant pt-4">
        {byPerson.map(({ person, rows }) =>
          person ? <PersonReview key={person.id} campaign={campaign} person={person} rows={rows} /> : null,
        )}
      </div>
    </Card>
  );
}

function PersonReview({ campaign, person, rows }: { campaign: AccessReviewCampaign; person: Person; rows: AccessReviewItem[] }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const text = useReviewText();
  const approvals = useDataStore((s) => s.approvals);
  const [revoking, setRevoking] = useState<AccessReviewItem | null>(null);
  const pending = rows.filter((r) => !r.decision);
  const done = rows.length - pending.length;
  const headingId = `review-${campaign.id}-${person.id}`;
  // People already reviewed start folded, so the pending ones stay in view.
  const [open, setOpen] = useState(pending.length > 0);

  const keep = (ids: string[]) => {
    if (!user) return;
    const count = useDataStore.getState().decideReviewItems(campaign.id, ids, 'keep', '', user.personId);
    if (count) toast.success(t('accessReview.keptToast', { count }));
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={person.name} role={person.role} />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 id={headingId} className="text-title-medium text-on-surface">
              {person.name}
            </h3>
            <p className="text-body-small text-on-surface-variant">
              {person.jobTitle} · {person.area}
            </p>
            <p className="text-body-small text-on-surface-variant tabular-nums">
              {rows[0] && rows[0].via !== 'manager' && `${t(`accessReview.via.${rows[0].via}`)} · `}
              {t('accessReview.personProgress', { done, total: rows.length })}
            </p>
          </div>
        </div>
        {pending.length > 0 ? (
          <Button variant="text" leadingIcon="done_all" className="self-start" onClick={() => keep(pending.map((r) => r.id))}>
            {t('accessReview.keepAll', { count: pending.length })}
          </Button>
        ) : (
          <Button
            variant="text"
            leadingIcon={open ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
            className="self-start"
            aria-expanded={open}
            aria-controls={`${headingId}-rows`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? t('accessReview.hideRows') : t('accessReview.showRows', { count: rows.length })}
          </Button>
        )}
      </div>

      <ul id={`${headingId}-rows`} hidden={!open} className="-mx-2 flex flex-col border-t border-outline-variant">
        {rows.map((row) => {
          const state = itemState(row, approvals);
          const access = text.access(row);
          const blocked = revokeBlock(row);
          return (
            <li
              key={row.id}
              className="flex min-h-14 min-w-0 flex-col gap-3 border-b border-outline-variant px-2 py-3 last:border-b-0 sm:flex-row sm:items-start"
            >
              <span className="flex min-w-0 flex-1 items-start gap-3">
                <IconTile icon={row.kind === 'role' ? 'admin_panel_settings' : 'key'} tone="neutral" />
                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-title-small text-on-surface">{access}</span>
                  <span className="text-body-small text-on-surface-variant">{t(`accessReview.kind.${row.kind}`)}</span>
                  {row.reason && <span className="text-body-small text-on-surface-variant">{row.reason}</span>}
                  {/* D-115: the clarification goes under the row text, never in the action column */}
                  {state === 'pending' && blocked && (
                    <span className="text-body-small text-on-surface-variant">{t('accessReview.demoRole')}</span>
                  )}
                </span>
              </span>
              {state === 'pending' ? (
                <span className="flex shrink-0 flex-wrap gap-2 self-start">
                  <Button
                    variant="outlined"
                    size="xs"
                    leadingIcon="check"
                    aria-label={t('accessReview.keepLabel', { access, name: person.name })}
                    onClick={() => keep([row.id])}
                  >
                    {t('accessReview.keep')}
                  </Button>
                  {!blocked && (
                    <Button
                      variant="outlined"
                      size="xs"
                      leadingIcon="do_not_disturb_on"
                      aria-label={t('accessReview.revokeLabel', { access, name: person.name })}
                      onClick={() => setRevoking(row)}
                    >
                      {t('accessReview.revoke')}
                    </Button>
                  )}
                </span>
              ) : (
                <ReviewStatePill state={state} className="shrink-0 self-start" />
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={Boolean(revoking)} onOpenChange={(v) => !v && setRevoking(null)}>
        {revoking && (
          <RevokeDialog campaign={campaign} item={revoking} person={person} onDone={() => setRevoking(null)} />
        )}
      </Dialog>
    </section>
  );
}

function RevokeDialog({
  campaign,
  item,
  person,
  onDone,
}: {
  campaign: AccessReviewCampaign;
  item: AccessReviewItem;
  person: Person;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const text = useReviewText();
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  const issue = issuesByPath(reasonSchema.safeParse(reason))[''];
  const role = item.kind === 'role';

  const submit = () => {
    setTried(true);
    if (issue || !user) {
      document.getElementById('revoke-reason')?.focus();
      return;
    }
    if (useDataStore.getState().decideReviewItems(campaign.id, [item.id], 'revoke', reason, user.personId)) {
      toast.success(t(role ? 'accessReview.revokeDialog.doneRole' : 'accessReview.revokeDialog.done'));
      onDone();
    }
  };

  return (
    <DialogContent
      title={t('accessReview.revokeDialog.title', { access: text.access(item) })}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outlined">{t('ui.cancel')}</Button>
          </DialogClose>
          <Button variant="danger" leadingIcon="do_not_disturb_on" onClick={submit}>
            {t(role ? 'accessReview.revokeDialog.confirmRole' : 'accessReview.revokeDialog.confirm')}
          </Button>
        </>
      }
    >
      <p className="text-body-medium text-on-surface">
        {t(role ? 'accessReview.revokeDialog.introRole' : 'accessReview.revokeDialog.intro', { name: person.name })}
      </p>
      <TextArea
        id="revoke-reason"
        label={t('accessReview.revokeDialog.reason')}
        required
        helperText={t('accessReview.revokeDialog.reasonHelp')}
        error={tried && issue ? t(issue) : undefined}
        value={reason}
        rows={3}
        onChange={(event) => setReason(event.target.value)}
      />
    </DialogContent>
  );
}
