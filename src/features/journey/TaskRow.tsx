import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import { blockingTasks, taskStatus } from '@/lib/journey';
import { cn } from '@/lib/utils';
import type { HireTask } from '@/types/domain';
import { CompleteTaskButton } from './CompleteTaskButton';
import { DueText } from './DueText';
import { TASK_TYPE_ICON } from './task-meta';
import { TaskStatusPill } from './TaskStatusPill';

interface TaskRowProps {
  task: HireTask;
  allTasks: HireTask[];
  /** Detail route of the task. */
  to: string;
  /** The current user may mark it as done (from permissions.ts). */
  canComplete: boolean;
  onComplete: (task: HireTask) => void;
  /** Briefly highlighted because it was just unlocked (CLAUDE.md 2.6). */
  highlighted?: boolean;
}

/**
 * One task of a journey: completion control, title (link to the detail), type,
 * owner, due date, status, and the reason when it is blocked ("Primero completa: …").
 * Shared by N1 and, in later steps, J2 and A4.
 */
export function TaskRow({ task, allTasks, to, canComplete, onComplete, highlighted }: TaskRowProps) {
  const { t } = useTranslation();
  const status = taskStatus(task, allTasks);
  const blockers = status === 'blocked' ? blockingTasks(task, allTasks) : [];
  // Courses are completed from their detail page, after going through the content.
  const showComplete = canComplete && task.type !== 'course' && status !== 'blocked';

  return (
    <li
      className={cn(
        'flex min-w-0 items-start gap-3 rounded-md px-2 py-3 transition-colors duration-300 ease-standard',
        highlighted && 'bg-primary-container',
        status === 'blocked' && 'opacity-90',
      )}
    >
      {showComplete || status === 'done' ? (
        <CompleteTaskButton title={task.title} done={status === 'done'} onComplete={() => onComplete(task)} />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center text-on-surface-variant" aria-hidden>
          <Icon name={status === 'blocked' ? 'lock' : TASK_TYPE_ICON[task.type]} size={24} />
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <Link
            to={to}
            className={cn(
              'line-clamp-2 min-w-0 rounded-xs text-title-small text-on-surface underline-offset-4 hover:underline',
              status === 'done' && 'text-on-surface-variant',
            )}
          >
            {task.title}
          </Link>
          <TaskStatusPill status={status} className="w-fit" />
        </div>
        <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-body-small text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Icon name={TASK_TYPE_ICON[task.type]} size={16} />
            {t(`taskTypes.${task.type}`)}
          </span>
          <span>{task.owner === 'hire' ? t('journey.yours') : t('journey.ownerIs', { owner: t(`owners.${task.owner}`) })}</span>
          <DueText task={task} status={status} />
        </p>
        {blockers.length > 0 && (
          <p className="flex items-start gap-1 text-body-small text-on-warning-container">
            <Icon name="lock" size={16} className="mt-px text-warning" />
            {t('journey.blockedBy', { tasks: blockers.map((b) => b.title).join(', ') })}
          </p>
        )}
        {canComplete && task.type === 'course' && status !== 'done' && status !== 'blocked' && (
          <Link to={to} className="w-fit text-label-large text-primary underline-offset-4 hover:underline">
            {t('journey.openCourse')}
          </Link>
        )}
      </div>
    </li>
  );
}
