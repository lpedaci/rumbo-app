import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { DetailHeader, HeaderChip } from '@/components/layout/DetailHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusPill } from '@/components/ui/StatusPill';
import { toast } from '@/components/ui/toast-store';
import { NotFoundPage } from '@/features/system/NotFoundPage';
import { campaignCsv, campaignProgress, closeBlock, itemState, progressByReviewer } from '@/lib/access-review';
import { DEMO_TODAY, formatDate } from '@/lib/dates';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { AccessReviewCampaign } from '@/types/domain';
import { CampaignStatusPill, ReviewStatePill, useReviewText } from './ReviewBits';

/**
 * S6 · Review campaign (F13): progress by reviewer (and why each one reviews: manager, or HR or IT
 * when there is no manager), with reminders; the revocations to execute, or the double approval
 * they wait for when they remove an admin role; and the closing with its CSV summary.
 */
export function CampaignDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const campaign = useDataStore((s) => s.accessReviews.find((c) => c.id === id));
  const text = useReviewText();
  if (!campaign) return <NotFoundPage />;
  const { done, total, percent } = campaignProgress(campaign.items);
  const due = text.due(campaign);

  return (
    <>
      <nav aria-label={t('accessReview.detail.breadcrumb')} className="mb-2">
        <Link
          to="/it/access-reviews"
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('accessReview.detail.back')}
        </Link>
      </nav>
      <DetailHeader
        chipsLabel={t('accessReview.detail.facts')}
        chips={
          <>
            <li>
              <CampaignStatusPill campaign={campaign} className="h-7" />
            </li>
            <HeaderChip icon="apartment">{text.scope(campaign)}</HeaderChip>
            <HeaderChip icon="event" tone={campaign.status === 'open' && due.late ? 'accent' : 'neutral'}>
              {campaign.status === 'open' ? due.text : t('accessReview.due', { date: formatDate(campaign.dueDate) })}
            </HeaderChip>
          </>
        }
        title={campaign.name}
        description={t('accessReview.detail.purpose')}
      />
      <div className="flex flex-col gap-(--space-bento-gap)">
        <Card title={t('accessReview.detail.reviewersTitle')}>
          <div className="flex flex-col gap-1">
            <ProgressBar value={percent} label={t('accessReview.progress', { done, total })} size="lg" />
            <p className="text-body-small text-on-surface-variant tabular-nums">{t('accessReview.progress', { done, total })}</p>
          </div>
          <Reviewers campaign={campaign} />
        </Card>
        <Revocations campaign={campaign} />
        <Closing campaign={campaign} />
      </div>
    </>
  );
}

function Reviewers({ campaign }: { campaign: AccessReviewCampaign }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const people = useDataStore((s) => s.people);
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? id;
  return (
    <ul className="-mx-2 flex flex-col border-t border-outline-variant">
      {progressByReviewer(campaign.items).map((r) => {
        const reviewer = people.find((p) => p.id === r.reviewerId);
        const complete = r.done === r.total;
        return (
          <li
            key={`${r.reviewerId}-${r.via}`}
            className="flex min-h-14 min-w-0 flex-col gap-3 border-b border-outline-variant px-2 py-3 last:border-b-0 sm:flex-row sm:items-start"
          >
            <span className="flex min-w-0 flex-1 items-start gap-3">
              {reviewer && <Avatar name={reviewer.name} role={reviewer.role} size="md" />}
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="text-title-small text-on-surface">{nameOf(r.reviewerId)}</span>
                <span className="text-body-small text-on-surface-variant">
                  {t(`accessReview.detail.viaPeople.${r.via}`, { names: r.people.map(nameOf).join(', ') })}
                </span>
                <span className="flex max-w-xs flex-col gap-1">
                  <ProgressBar value={(r.done / r.total) * 100} label={t('accessReview.campaigns.progress', { done: r.done, total: r.total })} />
                  <span className="text-body-small text-on-surface-variant tabular-nums">
                    {t('accessReview.campaigns.progress', { done: r.done, total: r.total })}
                  </span>
                </span>
              </span>
            </span>
            {complete ? (
              <StatusPill tone="success" icon="check_circle" label={t('accessReview.detail.complete')} className="shrink-0 self-start" />
            ) : (
              // No reminder to oneself: the viewer's own rows are in their review (J4).
              campaign.status === 'open' &&
              r.reviewerId !== user?.personId && (
                <Button
                  variant="outlined"
                  size="xs"
                  leadingIcon="notifications"
                  className="shrink-0 self-start"
                  aria-label={t('accessReview.detail.remindLabel', { name: nameOf(r.reviewerId) })}
                  onClick={() => {
                    if (!user) return;
                    useDataStore.getState().remindReviewer(campaign.id, r.reviewerId, user.personId);
                    toast.success(t('accessReview.detail.reminded', { name: nameOf(r.reviewerId) }));
                  }}
                >
                  {t('accessReview.detail.remind')}
                </Button>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Revocations({ campaign }: { campaign: AccessReviewCampaign }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const text = useReviewText();
  const people = useDataStore((s) => s.people);
  const approvals = useDataStore((s) => s.approvals);
  const rows = campaign.items.filter((i) => i.decision === 'revoke');
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? id;
  return (
    <Card title={t('accessReview.detail.revocationsTitle')}>
      {rows.length === 0 ? (
        <p className="border-t border-outline-variant pt-4 text-body-medium text-on-surface-variant">
          {t('accessReview.detail.revocationsEmpty')}
        </p>
      ) : (
        <ul className="-mx-2 flex flex-col border-t border-outline-variant">
          {rows.map((row) => {
            const person = people.find((p) => p.id === row.personId);
            const state = itemState(row, approvals);
            const access = text.access(row);
            return (
              <li
                key={row.id}
                className="flex min-h-14 min-w-0 flex-col gap-3 border-b border-outline-variant px-2 py-3 last:border-b-0 sm:flex-row sm:items-start"
              >
                <span className="flex min-w-0 flex-1 items-start gap-3">
                  {person && <Avatar name={person.name} role={person.role} size="md" />}
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-title-small text-on-surface">
                      {access} · {nameOf(row.personId)}
                    </span>
                    {row.reason && <span className="text-body-medium text-on-surface">{row.reason}</span>}
                    <span className="text-body-small text-on-surface-variant tabular-nums">
                      {t('accessReview.detail.revocationMeta', {
                        name: nameOf(row.reviewerId),
                        date: formatDate((row.decidedAt ?? DEMO_TODAY).slice(0, 10)),
                      })}
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 sm:flex-col sm:items-end">
                  <ReviewStatePill state={state} />
                  {state === 'revoke_pending' && (
                    <Button
                      variant="outlined"
                      size="xs"
                      leadingIcon="do_not_disturb_on"
                      aria-label={t('accessReview.detail.executeLabel', { access, name: nameOf(row.personId) })}
                      onClick={() => {
                        if (!user) return;
                        useDataStore.getState().executeReviewRevocation(campaign.id, row.id, user.personId);
                        toast.success(t('accessReview.detail.executed', { access }));
                      }}
                    >
                      {t('accessReview.detail.execute')}
                    </Button>
                  )}
                  {row.approvalId && (
                    <Link
                      to={`/it/approvals?request=${row.approvalId}`}
                      className="inline-flex min-h-12 items-center text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
                    >
                      {t('accessReview.detail.viewApproval')}
                    </Link>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function Closing({ campaign }: { campaign: AccessReviewCampaign }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const text = useReviewText();
  const people = useDataStore((s) => s.people);
  const approvals = useDataStore((s) => s.approvals);
  const block = closeBlock(campaign, approvals);
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? id;
  const blockText =
    block === 'undecided'
      ? t('accessReview.detail.closeBlock.undecided', { count: campaign.items.filter((i) => !i.decision).length })
      : block === 'revocations'
        ? t('accessReview.detail.closeBlock.revocations')
        : block === 'closed'
          ? t('accessReview.detail.closeBlock.closed', {
              date: formatDate((campaign.closedAt ?? DEMO_TODAY).slice(0, 10)),
              name: nameOf(campaign.closedBy ?? ''),
            })
          : t('accessReview.detail.closeText');

  const download = () => {
    if (!user) return;
    const csv = campaignCsv(
      campaign,
      approvals,
      {
        person: t('accessReview.detail.csv.person'),
        access: t('accessReview.detail.csv.access'),
        reviewer: t('accessReview.detail.csv.reviewer'),
        decision: t('accessReview.detail.csv.decision'),
        reason: t('accessReview.detail.csv.reason'),
        date: t('accessReview.detail.csv.date'),
      },
      { nameOf, access: text.access, state: (s) => t(`accessReview.state.${s}`) },
    );
    const url = URL.createObjectURL(
      new Blob([String.fromCharCode(0xfeff) + csv] /* BOM so spreadsheet apps read the accents */, {
        type: 'text/csv;charset=utf-8',
      }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `revision-accesos-${campaign.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    useDataStore.getState().logAudit({
      actorId: user.personId,
      action: 'access_review.export',
      resource: campaign.id,
      result: 'success',
      detail: campaign.name,
    });
  };

  return (
    <Card title={t('accessReview.detail.closeTitle')}>
      <p id="close-note" className="text-body-medium text-on-surface">
        {blockText}
      </p>
      {/* Phones: full width with the main action on top (2.1.3) */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outlined" leadingIcon="download" onClick={download}>
          {t('accessReview.detail.download')}
        </Button>
        {campaign.status === 'open' && (
          <Button
            leadingIcon="task_alt"
            disabled={Boolean(block)}
            aria-describedby="close-note"
            onClick={() => {
              if (user && useDataStore.getState().closeReviewCampaign(campaign.id, user.personId)) {
                toast.success(t('accessReview.detail.closedToast'));
              }
            }}
          >
            {t('accessReview.detail.close')}
          </Button>
        )}
      </div>
    </Card>
  );
}
