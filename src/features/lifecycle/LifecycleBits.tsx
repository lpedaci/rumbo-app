import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import type { IconName } from '@/components/ui/Icon';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';
import { formatDate, formatDateTime } from '@/lib/dates';
import { type LifecycleState, lifecycleState, progressOfEvent } from '@/lib/lifecycle';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import type { AccessTask, LifecycleEvent, LifecycleType } from '@/types/domain';

export const TYPE_ICON: Record<LifecycleType, IconName> = { joiner: 'person_add', mover: 'swap_horiz', leaver: 'logout' };
const STATE: Record<LifecycleState, { tone: StatusTone; icon: IconName }> = {
  scheduled: { tone: 'info', icon: 'schedule' },
  in_progress: { tone: 'warning', icon: 'pending' },
  done: { tone: 'success', icon: 'check_circle' },
};

export function LifecycleStatePill({ event }: { event: LifecycleEvent }) {
  const { t } = useTranslation();
  const state = lifecycleState(event);
  return <StatusPill {...STATE[state]} label={t(`lifecycle.state.${state}`)} />;
}

/** "Alta", "Cambio de puesto" or "Baja", with its icon (a fact, neutral chip). */
export function TypeChip({ type }: { type: LifecycleType }) {
  const { t } = useTranslation();
  return (
    <span className="inline-flex h-6 w-fit items-center gap-1 rounded-full border border-outline-variant px-2 text-label-medium text-on-surface">
      <Icon name={TYPE_ICON[type]} size={16} className="text-on-surface-variant" />
      {t(`lifecycle.types.${type}`)}
    </span>
  );
}

/**
 * One move (F12) in the list rhythm (D-106, D-115): the person on the left; type, jobs and
 * effective date, then the progress bar in the middle; the state on the right.
 */
export function EventSummary({ event, trailing }: { event: LifecycleEvent; trailing?: ReactNode }) {
  const { t } = useTranslation();
  const person = useDataStore((s) => s.people.find((p) => p.id === event.personId));
  const jobs = useDataStore((s) => s.jobTitles);
  const jobName = (id?: string) => jobs.find((j) => j.id === id)?.name ?? '';
  const { done, total } = progressOfEvent(event);
  return (
    <span className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
      <span className="flex min-w-0 flex-1 items-start gap-3">
        {person && <Avatar name={person.name} role={person.role} />}
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-title-small text-on-surface">{person?.name ?? event.personId}</span>
          <span className="flex flex-wrap items-center gap-2 text-body-small text-on-surface-variant">
            <TypeChip type={event.type} />
            {event.type === 'mover' && t('lifecycle.jobChange', { from: jobName(event.fromJobTitleId), to: jobName(event.toJobTitleId) })}
            {event.type === 'leaver' && event.leaverType && t(`lifecycle.leaverTypes.${event.leaverType}`)}
            <span className="tabular-nums">
              {/* The separator only on one line; on phones the date wraps without a stray dot. */}
              <span aria-hidden="true" className="hidden sm:inline">
                ·{' '}
              </span>
              {t('lifecycle.effective', { date: formatDate(event.effectiveDate) })}
            </span>
          </span>
          <span className="flex max-w-md flex-col gap-1">
            <ProgressBar value={total ? (done / total) * 100 : 0} label={t('lifecycle.progress', { done, total })} />
            <span className="text-body-small text-on-surface-variant tabular-nums">{t('lifecycle.progress', { done, total })}</span>
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <LifecycleStatePill event={event} />
        {person?.status === 'offboarded' && (
          <StatusPill tone="neutral" icon="logout" label={t('lifecycle.offboarded')} />
        )}
        {trailing}
      </span>
    </span>
  );
}

/** The access tasks of a move; `action` renders the control of a pending task (IT only). */
export function AccessTaskList({
  event,
  action,
}: {
  event: LifecycleEvent;
  action?: (task: AccessTask) => ReactNode;
}) {
  const { t } = useTranslation();
  const people = useDataStore((s) => s.people);
  return (
    <ul className="@container flex flex-col">
      {event.accessTasks.map((task) => (
        <li
          key={task.id}
          className="flex min-h-12 min-w-0 items-start gap-3 border-b border-outline-variant py-2.5 last:border-b-0"
        >
          <Icon
            name={task.status === 'done' ? 'check_circle' : task.action === 'grant' ? 'add_circle' : 'do_not_disturb_on'}
            size={20}
            className={cn('mt-0.5 shrink-0', task.status === 'done' ? 'text-success' : 'text-on-surface-variant')}
          />
          {/* Narrow container: the action goes under the text, never squeezing it (D-103). */}
          <span className="flex min-w-0 flex-1 flex-col items-start gap-2 @md:flex-row @md:items-center @md:gap-3">
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-body-medium text-on-surface">
                {t(`lifecycle.detail.${task.action}`)} · {task.system}
              </span>
              <span className="text-body-small text-on-surface-variant tabular-nums">
                {task.status === 'done' && task.doneAt
                  ? t('lifecycle.detail.done', {
                      date: formatDateTime(task.doneAt),
                      name: people.find((p) => p.id === task.doneBy)?.name ?? '',
                    })
                  : t('lifecycle.detail.pending')}
              </span>
            </span>
            {task.status === 'pending' && action?.(task)}
          </span>
        </li>
      ))}
    </ul>
  );
}
