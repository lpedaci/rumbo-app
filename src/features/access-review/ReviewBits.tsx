import { useTranslation } from 'react-i18next';
import type { IconName } from '@/components/ui/Icon';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { daysToDue, type ItemState } from '@/lib/access-review';
import { formatDate } from '@/lib/dates';
import { useDataStore } from '@/store/data-store';
import type { AccessReviewCampaign, AccessReviewItem } from '@/types/domain';

const STATE: Record<ItemState, { tone: StatusTone; icon: IconName }> = {
  pending: { tone: 'neutral', icon: 'radio_button_unchecked' },
  kept: { tone: 'success', icon: 'check_circle' },
  revoke_pending: { tone: 'warning', icon: 'pending' },
  revoke_in_approval: { tone: 'warning', icon: 'hourglass_empty' },
  revoked: { tone: 'success', icon: 'do_not_disturb_on' },
  revoke_rejected: { tone: 'info', icon: 'info' },
  // D-121: not applied, IT would keep fewer than two people
  revoke_blocked: { tone: 'error', icon: 'block' },
};

export function ReviewStatePill({ state, className }: { state: ItemState; className?: string }) {
  const { t } = useTranslation();
  return <StatusPill {...STATE[state]} label={t(`accessReview.state.${state}`)} className={className} />;
}

export function CampaignStatusPill({ campaign, className }: { campaign: AccessReviewCampaign; className?: string }) {
  const { t } = useTranslation();
  return campaign.status === 'open' ? (
    <StatusPill tone="info" icon="schedule" label={t('accessReview.campaigns.status.open')} className={className} />
  ) : (
    <StatusPill tone="success" icon="check_circle" label={t('accessReview.campaigns.status.closed')} className={className} />
  );
}

/** Texts shared by J4, S5 and S6: the access of a row, the scope and the due date of a campaign. */
export function useReviewText() {
  const { t } = useTranslation();
  const areas = useDataStore((s) => s.areas);
  return {
    access: (item: AccessReviewItem) =>
      item.kind === 'role' ? t('accessReview.roleAccess', { role: t(`roles.${item.access}`) }) : item.access,
    scope: (campaign: AccessReviewCampaign) =>
      campaign.scope === 'company'
        ? t('accessReview.campaigns.scope.company')
        : t('accessReview.campaigns.scope.area', {
            area: areas.find((a) => a.id === (campaign.scope as { areaId: string }).areaId)?.name ?? '',
          }),
    due: (campaign: AccessReviewCampaign) => {
      const days = daysToDue(campaign);
      const date = formatDate(campaign.dueDate);
      if (days > 0) return { text: t('accessReview.dueIn', { count: days, date }), late: false };
      if (days === 0) return { text: t('accessReview.dueToday'), late: true };
      return { text: t('accessReview.overdue', { date }), late: true };
    },
  };
}
