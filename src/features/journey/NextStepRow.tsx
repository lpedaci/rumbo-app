import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import { relativeDue } from '@/lib/dates';
import { taskStatus } from '@/lib/journey';
import { cn } from '@/lib/utils';
import type { HireTask } from '@/types/domain';
import { TASK_STATUS_PILL } from './task-meta';

/**
 * Row of the "Lo próximo" checklist (reference original-cf59fe35): status icon, title,
 * due date and a chevron. The whole row links to the task detail (N2).
 */
export function NextStepRow({ task, allTasks }: { task: HireTask; allTasks: HireTask[] }) {
  const { t } = useTranslation();
  const status = taskStatus(task, allTasks);
  const pill = TASK_STATUS_PILL[status];
  const rel = relativeDue(task.dueDate);
  const dueLabel = 'count' in rel ? t(`due.${rel.key}`, { count: rel.count }) : t(`due.${rel.key}`);

  return (
    <li>
      <Link
        to={`/me/tasks/${task.id}`}
        className="group flex min-h-14 min-w-0 items-center gap-3 px-3 py-2.5 transition-colors duration-150 hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        <Icon
          name={pill.icon}
          size={24}
          className={cn(
            'shrink-0',
            status === 'overdue' ? 'text-error' : status === 'in_progress' ? 'text-info' : 'text-on-surface-variant',
          )}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate text-title-small text-on-surface">{task.title}</span>
          {/* One fact to act on (D-84): when it is due, plus the status only when it adds something */}
          <span className="flex flex-wrap items-baseline gap-x-1.5">
            <span className={cn('text-label-medium', status === 'overdue' ? 'text-error' : 'text-on-surface')}>
              {dueLabel}
            </span>
            {status !== 'overdue' && status !== 'pending' && (
              <span className="text-body-small text-on-surface-variant">· {t(`taskStatus.${status}`)}</span>
            )}
          </span>
        </span>
        <Icon name="chevron_right" className="shrink-0 text-on-surface-variant" />
      </Link>
    </li>
  );
}
