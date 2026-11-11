import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Icon } from '@/components/ui/Icon';
import { formatDate, relativeDue } from '@/lib/dates';
import { blockingTasks, taskStatus } from '@/lib/journey';
import { cn } from '@/lib/utils';
import type { HireTask, TaskStatus } from '@/types/domain';
import { CompleteTaskButton } from './CompleteTaskButton';
import { TASK_TYPE_ICON } from './task-meta';
import { TaskStatusPill } from './TaskStatusPill';

interface TaskRowProps {
  task: HireTask;
  allTasks: HireTask[];
  /** Detail route of the task. Without it the title is plain text (template preview). */
  to?: string;
  /** The current user may mark it as done (from permissions.ts). */
  canComplete: boolean;
  onComplete: (task: HireTask) => void;
  /** Briefly highlighted because it was just unlocked (CLAUDE.md 2.6). */
  highlighted?: boolean;
  /** Template preview (A7): statuses as of the start of the journey, no relative dates. */
  preview?: boolean;
  /** Reference day for the status. Defaults to the demo "today". */
  today?: string;
}

/**
 * One task of a journey, as a standard list row (D-65):
 * - Leading: completion control, or the type / lock icon.
 * - Main: title and, under it, "Tipo · Responsable"; the blocked reason when it applies.
 * - Trailing: due date (date + "Vence en…") and the status pill, aligned right from 640 px.
 * The whole row is the link to the detail (stretched link); the hover background stays
 * inside the row so it never covers the dividers, and there is no underline.
 * Shared by N1, the template preview (A7) and, later, J2 and A4.
 */
export function TaskRow({
  task,
  allTasks,
  to,
  canComplete,
  onComplete,
  highlighted,
  preview = false,
  today,
}: TaskRowProps) {
  const { t } = useTranslation();
  const status = taskStatus(task, allTasks, today);
  const blockers = status === 'blocked' ? blockingTasks(task, allTasks) : [];
  // Courses are completed from their detail page, after going through the content.
  const showComplete = canComplete && task.type !== 'course' && status !== 'blocked';
  const owner =
    task.owner === 'hire' && !preview ? t('journey.yours') : t('journey.ownerIs', { owner: t(`owners.${task.owner}`) });

  return (
    <li className="py-1">
      <div
        className={cn(
          'relative flex min-w-0 items-start gap-3 rounded-md px-2 py-2.5 transition-colors duration-300 ease-standard',
          to && 'hover:bg-surface-container focus-within:bg-surface-container',
          highlighted && 'bg-primary-container hover:bg-primary-container',
        )}
      >
        {/* Above the stretched link so it stays clickable */}
        <div className="relative z-10 shrink-0">
          {showComplete || status === 'done' ? (
            <CompleteTaskButton title={task.title} done={status === 'done'} onComplete={() => onComplete(task)} />
          ) : (
            <span className="flex size-10 items-center justify-center text-on-surface-variant" aria-hidden>
              <Icon name={status === 'blocked' ? 'lock' : TASK_TYPE_ICON[task.type]} size={24} />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
          {/* Main: title and its context */}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {to ? (
              <Link
                to={to}
                className={cn(
                  'line-clamp-2 min-w-0 text-title-small text-on-surface outline-none',
                  // Stretched link: the whole row opens the detail; focus ring on the row.
                  "after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-primary",
                  status === 'done' && 'text-on-surface-variant',
                )}
              >
                {task.title}
              </Link>
            ) : (
              <span className="line-clamp-2 min-w-0 text-title-small text-on-surface">{task.title}</span>
            )}
            <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-body-small text-on-surface-variant">
              <span>{t(`taskTypes.${task.type}`)}</span>
              <span aria-hidden>·</span>
              <span>{owner}</span>
            </p>
            {blockers.length > 0 && (
              <p className="flex min-w-0 items-start gap-1 text-body-small text-on-surface-variant">
                <Icon name="lock" size={16} className="mt-px shrink-0 text-warning" />
                <span className="line-clamp-2 min-w-0">
                  {t('journey.blockedBy', { tasks: blockers.map((b) => b.title).join(', ') })}
                </span>
              </p>
            )}
          </div>

          {/* Trailing: due date and status, in fixed columns from 640 px */}
          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
            <DueColumn task={task} status={status} dateOnly={preview} />
            <TaskStatusPill status={status} className="w-fit sm:w-28 sm:justify-center" />
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * Due information with a clear hierarchy (D-84): what to act on first ("Vence hoy",
 * label-medium, red when overdue) and the exact date as secondary text. Below 640 px only
 * the relative label goes next to the status (the row is too narrow for both); from 640 px
 * both are stacked and right-aligned.
 */
function DueColumn({ task, status, dateOnly }: { task: HireTask; status: TaskStatus; dateOnly: boolean }) {
  const { t } = useTranslation();
  const wrap =
    'flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 sm:w-32 sm:flex-none sm:flex-col sm:items-end sm:text-right';
  if (status === 'done' && task.completedAt) {
    return (
      <span className={cn(wrap, 'text-body-small text-on-surface-variant')}>
        <span>{t('journey.row.doneOn')}</span>
        <time dateTime={task.completedAt.slice(0, 10)} className="tabular-nums">
          {formatDate(task.completedAt)}
        </time>
      </span>
    );
  }
  if (dateOnly) {
    return (
      <time dateTime={task.dueDate} className="text-label-medium text-on-surface tabular-nums sm:w-32 sm:text-right">
        {formatDate(task.dueDate)}
      </time>
    );
  }
  const rel = relativeDue(task.dueDate);
  const label = 'count' in rel ? t(`due.${rel.key}`, { count: rel.count }) : t(`due.${rel.key}`);
  return (
    <span className={wrap}>
      <span className={cn('text-label-medium', status === 'overdue' ? 'text-error' : 'text-on-surface')}>{label}</span>
      {/* The exact date only where it fits next to the status; always in the detail (N2) */}
      <time dateTime={task.dueDate} className="hidden text-body-small text-on-surface-variant tabular-nums sm:inline">
        {formatDate(task.dueDate)}
      </time>
    </span>
  );
}
