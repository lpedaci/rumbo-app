import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { IconTile } from '@/components/ui/IconTile';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import { buildReviewItems, campaignProgress, nextCampaignId } from '@/lib/access-review';
import { addDays, DEMO_TODAY, formatDate } from '@/lib/dates';
import { dateMask } from '@/lib/input-masks';
import { cn } from '@/lib/utils';
import { parseDisplayDate } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { AccessReviewCampaign } from '@/types/domain';
import { CampaignStatusPill, useReviewText } from './ReviewBits';

/** Campaigns can be due between tomorrow and 60 days ahead. */
const MAX_DAYS = 60;

/**
 * S5 · Review campaigns (F13): open ones first, each with its scope, due date and progress; the
 * row opens the campaign (S6). IT creates a campaign for the whole company or one area. When
 * the IT admin is a reviewer too (HR has no manager), a notice links to their own review.
 */
export function CampaignsPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const campaigns = useDataStore((s) => s.accessReviews);
  const [creating, setCreating] = useState(false);
  const sorted = [...campaigns].sort(
    (a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.createdAt.localeCompare(a.createdAt),
  );
  const myTurn = campaigns
    .filter((c) => c.status === 'open')
    .map((c) => ({
      campaign: c,
      people: new Set(c.items.filter((i) => i.reviewerId === user?.personId && !i.decision).map((i) => i.personId)).size,
    }))
    .find((c) => c.people > 0);

  return (
    <>
      <PageHeader
        title={t('accessReview.campaigns.title')}
        description={t('accessReview.campaigns.description')}
        actions={
          <Button leadingIcon="add" onClick={() => setCreating(true)}>
            {t('accessReview.campaigns.create')}
          </Button>
        }
      />
      <div className="flex flex-col gap-(--space-bento-gap)">
        {myTurn && (
          <InlineAlert tone="info">
            <span className="flex flex-col items-start gap-2">
              {t('accessReview.campaigns.yourTurn', { count: myTurn.people, campaign: myTurn.campaign.name })}
              <Link
                to="/it/access-review"
                className="inline-flex min-h-12 items-center text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
              >
                {t('accessReview.campaigns.reviewNow')}
              </Link>
            </span>
          </InlineAlert>
        )}
        <Card title={t('accessReview.campaigns.listTitle')}>
          {sorted.length === 0 ? (
            <p className="border-t border-outline-variant pt-4 text-body-medium text-on-surface-variant">
              {t('accessReview.campaigns.empty')}
            </p>
          ) : (
            <ul className="-mx-2 flex flex-col border-t border-outline-variant pt-1">
              {sorted.map((c) => (
                <CampaignRow key={c.id} campaign={c} />
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Dialog open={creating} onOpenChange={setCreating}>
        {creating && <CreateCampaignDialog onDone={() => setCreating(false)} />}
      </Dialog>
    </>
  );
}

function CampaignRow({ campaign: c }: { campaign: AccessReviewCampaign }) {
  const { t } = useTranslation();
  const text = useReviewText();
  const { done, total, percent } = campaignProgress(c.items);
  const people = new Set(c.items.map((i) => i.personId)).size;
  const due = text.due(c);
  return (
    <li className="border-b border-outline-variant last:border-b-0">
      <Link
        to={`/it/access-reviews/${c.id}`}
        className="flex min-h-14 w-full min-w-0 flex-col gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:flex-row sm:items-start"
      >
        <span className="flex min-w-0 flex-1 items-start gap-3">
          <IconTile icon="fact_check" tone="primary" />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="text-title-small text-on-surface">{c.name}</span>
            <span className="text-body-small text-on-surface-variant">
              {c.id} · {text.scope(c)} · {t('accessReview.campaigns.people', { count: people })}
            </span>
            <span className="flex max-w-md flex-col gap-1">
              <ProgressBar value={percent} label={t('accessReview.campaigns.progress', { done, total })} />
              <span className="text-body-small text-on-surface-variant tabular-nums">
                {t('accessReview.campaigns.progress', { done, total })}
              </span>
            </span>
          </span>
        </span>
        {/* Status and due date on the right from 640 px; on phones, on their own line (D-119) */}
        <span className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 sm:flex-col sm:items-end sm:text-right">
          <CampaignStatusPill campaign={c} />
          <span className={cn('text-label-medium', c.status === 'open' && due.late ? 'text-error' : 'text-on-surface')}>
            {c.status === 'open'
              ? due.text
              : t('accessReview.campaigns.closedOn', { date: formatDate(c.closedAt ?? c.dueDate) })}
          </span>
        </span>
      </Link>
    </li>
  );
}

function CreateCampaignDialog({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const people = useDataStore((s) => s.people);
  const jobTitles = useDataStore((s) => s.jobTitles);
  const areas = useDataStore((s) => s.areas);
  const campaigns = useDataStore((s) => s.accessReviews);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [scope, setScope] = useState('company');
  const [tried, setTried] = useState(false);

  const iso = parseDisplayDate(date);
  const nameIssue = name.trim().length < 5 || name.trim().length > 80 ? 'accessReview.campaigns.form.nameRequired' : undefined;
  const dateIssue = !iso
    ? 'accessReview.campaigns.form.dueRequired'
    : iso <= DEMO_TODAY || iso > addDays(DEMO_TODAY, MAX_DAYS)
      ? 'accessReview.campaigns.form.dueRange'
      : undefined;
  const scopeValue: AccessReviewCampaign['scope'] = scope === 'company' ? 'company' : { areaId: scope };
  const preview = buildReviewItems(nextCampaignId(campaigns), people, jobTitles, scopeValue);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    const first = nameIssue ? 'campaign-name' : dateIssue ? 'campaign-date' : undefined;
    if (first || !iso || !user) {
      if (first) document.getElementById(first)?.focus();
      return;
    }
    const id = useDataStore.getState().createReviewCampaign({ name, dueDate: iso, scope: scopeValue }, user.personId);
    toast.success(t('accessReview.campaigns.form.created', { id }));
    onDone();
  };

  return (
    <DialogContent
      title={t('accessReview.campaigns.create')}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outlined">{t('ui.cancel')}</Button>
          </DialogClose>
          <Button type="submit" form="create-campaign" leadingIcon="add">
            {t('accessReview.campaigns.form.submit')}
          </Button>
        </>
      }
    >
      <form id="create-campaign" noValidate onSubmit={submit} className="flex flex-col gap-4">
        <TextField
          id="campaign-name"
          label={t('accessReview.campaigns.form.name')}
          required
          helperText={t('accessReview.campaigns.form.nameHelp')}
          error={tried && nameIssue ? t(nameIssue) : undefined}
          value={name}
          maxLength={80}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          id="campaign-date"
          label={t('accessReview.campaigns.form.dueDate')}
          required
          inputMode="numeric"
          mask={dateMask}
          helperText={t('accessReview.campaigns.form.dueHelp')}
          error={tried && dateIssue ? t(dateIssue) : undefined}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <Select
          id="campaign-scope"
          label={t('accessReview.campaigns.form.scope')}
          required
          helperText={t('accessReview.campaigns.form.scopeHelp')}
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          options={[
            { value: 'company', label: t('accessReview.campaigns.scope.company') },
            ...areas.map((a) => ({ value: a.id, label: a.name })),
          ]}
        />
        <p className="rounded-md bg-surface-container p-3 text-body-medium text-on-surface" aria-live="polite">
          {t('accessReview.campaigns.form.preview', {
            items: preview.length,
            people: new Set(preview.map((i) => i.personId)).size,
            reviewers: new Set(preview.map((i) => i.reviewerId)).size,
          })}
        </p>
      </form>
    </DialogContent>
  );
}
