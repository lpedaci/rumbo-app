import { useTranslation } from 'react-i18next';
import type { IconName } from '@/components/ui/Icon';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import type { HireStatus } from '@/types/domain';

const META: Record<HireStatus, { tone: StatusTone; icon: IconName }> = {
  upcoming: { tone: 'info', icon: 'schedule' },
  active: { tone: 'primary', icon: 'route' },
  completed: { tone: 'success', icon: 'check_circle' },
};

/** Journey status with icon and text, never color alone (2.1.1). */
export function HireStatusPill({ status, className }: { status: HireStatus; className?: string }) {
  const { t } = useTranslation();
  return (
    <StatusPill
      tone={META[status].tone}
      icon={META[status].icon}
      label={t(`hires.status.${status}`)}
      className={className}
    />
  );
}

/** Overdue tasks as a pill: "Al día" or "N vencidas". */
export function OverduePill({ count, className }: { count: number; className?: string }) {
  const { t } = useTranslation();
  return count > 0 ? (
    <StatusPill tone="error" icon="error" label={t('hires.list.overdue', { count })} className={className} />
  ) : (
    <StatusPill tone="success" icon="check_circle" label={t('hires.list.onTrack')} className={className} />
  );
}
