import { useTranslation } from 'react-i18next';
import { formatDate, relativeDue } from '@/lib/dates';
import { cn } from '@/lib/utils';
import type { HireTask, TaskStatus } from '@/types/domain';

/**
 * Due date as "13/10/2026 · Vence en 3 días" (or "Hecha el …" for done tasks).
 * The date itself is a <time> element with tabular figures.
 */
export function DueText({
  task,
  status,
  className,
  dateOnly = false,
  stacked = false,
}: {
  task: HireTask;
  status: TaskStatus;
  className?: string;
  /** Only the date, without "Vence en…" (template preview, where today is not meaningful). */
  dateOnly?: boolean;
  /** Date and relative label on two lines (details lists). */
  stacked?: boolean;
}) {
  const { t } = useTranslation();

  if (status === 'done' && task.completedAt) {
    return (
      <span className={cn('text-body-small text-on-surface-variant', className)}>
        {t('due.doneOn', { date: '' })}
        <time dateTime={task.completedAt.slice(0, 10)}>{formatDate(task.completedAt)}</time>
      </span>
    );
  }

  if (dateOnly) {
    return (
      <span className={cn('text-body-small text-on-surface-variant', className)}>
        {t('due.dueOn', { date: '' })}
        <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time>
      </span>
    );
  }

  const rel = relativeDue(task.dueDate);
  const label = 'count' in rel ? t(`due.${rel.key}`, { count: rel.count }) : t(`due.${rel.key}`);
  if (stacked) {
    return (
      <span className={cn('flex flex-col', className)}>
        <time dateTime={task.dueDate} className="text-on-surface tabular-nums">
          {formatDate(task.dueDate)}
        </time>
        <span className={cn('text-body-small', status === 'overdue' ? 'text-error' : 'text-on-surface-variant')}>
          {label}
        </span>
      </span>
    );
  }
  return (
    <span className={cn('text-body-small', status === 'overdue' ? 'text-error' : 'text-on-surface-variant', className)}>
      <time dateTime={task.dueDate}>{formatDate(task.dueDate)}</time> · {label}
    </span>
  );
}
