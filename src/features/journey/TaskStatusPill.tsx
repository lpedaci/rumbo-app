import { useTranslation } from 'react-i18next';
import { StatusPill } from '@/components/ui/StatusPill';
import type { TaskStatus } from '@/types/domain';
import { TASK_STATUS_PILL } from './task-meta';

/** Derived task status as a pill: icon + text, never color alone. */
export function TaskStatusPill({ status, className }: { status: TaskStatus; className?: string }) {
  const { t } = useTranslation();
  const { tone, icon } = TASK_STATUS_PILL[status];
  return <StatusPill tone={tone} icon={icon} label={t(`taskStatus.${status}`)} className={className} />;
}
