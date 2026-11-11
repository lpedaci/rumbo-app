import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import { taskStatus } from '@/lib/journey';
import { cn } from '@/lib/utils';
import type { HireTask } from '@/types/domain';
import { DueText } from './DueText';
import { TASK_STATUS_PILL } from './task-meta';

/**
 * Row of the "Lo próximo" checklist (reference original-cf59fe35): status icon, title,
 * due date and a chevron. The whole row links to the task detail (N2).
 */
export function NextStepRow({ task, allTasks }: { task: HireTask; allTasks: HireTask[] }) {
  const { t } = useTranslation();
  const status = taskStatus(task, allTasks);
  const pill = TASK_STATUS_PILL[status];

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
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-title-small text-on-surface group-hover:underline group-hover:underline-offset-4">
            {task.title}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 text-body-small text-on-surface-variant">
            <span className={cn(status === 'overdue' && 'text-error')}>{t(`taskStatus.${status}`)}</span>
            <span aria-hidden>·</span>
            <DueText task={task} status={status} />
          </span>
        </span>
        <Icon name="chevron_right" className="shrink-0 text-on-surface-variant" />
      </Link>
    </li>
  );
}
