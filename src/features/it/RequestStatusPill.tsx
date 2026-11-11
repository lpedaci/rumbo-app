import { useTranslation } from 'react-i18next';
import type { IconName } from '@/components/ui/Icon';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import type { AccessRequestStatus } from '@/types/domain';

const STATUS: Record<AccessRequestStatus, { tone: StatusTone; icon: IconName }> = {
  new: { tone: 'info', icon: 'notifications' },
  verifying: { tone: 'warning', icon: 'verified_user' },
  resolved: { tone: 'success', icon: 'check_circle' },
  rejected: { tone: 'error', icon: 'block' },
};

/** Status of an access request with icon and text, never color alone (2.1.1). */
export function RequestStatusPill({ status, className }: { status: AccessRequestStatus; className?: string }) {
  const { t } = useTranslation();
  const s = STATUS[status];
  return <StatusPill tone={s.tone} icon={s.icon} label={t(`it.status.${status}`)} className={className} />;
}
