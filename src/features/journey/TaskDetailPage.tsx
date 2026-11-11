import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DetailHeader, HeaderChip } from '@/components/layout/DetailHeader';
import { Link, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { formatDate } from '@/lib/dates';
import { blockingTasks, taskStatus } from '@/lib/journey';
import { canCompleteTask } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/store/session-store';
import { DueText } from './DueText';
import { TASK_TYPE_ICON } from './task-meta';
import { TaskStatusPill } from './TaskStatusPill';
import { useCompleteTask } from './use-complete-task';
import { useOwnHire } from './use-own-hire';

const LESSON_MINUTES = [8, 20, 12];

/**
 * N2 · Task or course detail (CLAUDE.md F1). Courses show simulated content and are
 * completed here; blocked tasks explain what has to happen first, with links.
 * Only tasks of the hire's own journey are reachable (least privilege).
 */
export function TaskDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const user = useCurrentUser();
  const hire = useOwnHire();
  const complete = useCompleteTask();
  const [unlocked, setUnlocked] = useState<string[]>([]);

  const task = hire?.tasks.find((x) => x.id === id);
  if (!hire || !task) return <AccessDeniedPage reason="not_found" />;

  const status = taskStatus(task, hire.tasks);
  const blockers = status === 'blocked' ? blockingTasks(task, hire.tasks) : [];
  const canComplete = canCompleteTask(user, hire, task) && status !== 'done' && status !== 'blocked';
  const ownTask = task.owner === 'hire';
  const unlockedTasks = hire.tasks.filter((x) => unlocked.includes(x.id));
  const lessons = t('task.course.lessons', { returnObjects: true }) as string[];

  const onComplete = () => setUnlocked(complete(hire, task));

  return (
    <>
      <nav aria-label={t('task.breadcrumb')} className="mb-4 md:mb-6">
        <Link
          to="/me"
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('task.back')}
        </Link>
      </nav>

      <DetailHeader
        chipsLabel={t('task.facts')}
        chips={
          <>
            <li>
              <TaskStatusPill status={status} className="h-7" />
            </li>
            <HeaderChip icon={TASK_TYPE_ICON[task.type]}>{t(`taskTypes.${task.type}`)}</HeaderChip>
            <HeaderChip icon="flag">{t(`stages.${task.stage}`)}</HeaderChip>
          </>
        }
        title={task.title}
      />

      <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
        <div className="flex min-w-0 flex-col gap-(--space-bento-gap)">
          {status === 'done' && (
            <InlineAlert tone="success" live="status" title={t('task.doneTitle')}>
              {task.completedAt &&
                (task.completedBy === user?.personId
                  ? t('task.doneBody', { date: formatDate(task.completedAt) })
                  : t('task.doneByOther', { date: formatDate(task.completedAt) }))}
            </InlineAlert>
          )}

          {unlockedTasks.length > 0 && (
            <InlineAlert tone="info" live="status" title={t('task.nextUnlocked')}>
              <ul className="flex flex-col gap-1">
                {unlockedTasks.map((x) => (
                  <li key={x.id}>
                    <Link to={`/me/tasks/${x.id}`} className="underline underline-offset-4">
                      {x.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </InlineAlert>
          )}

          {blockers.length > 0 && (
            // Blocked (D-69): what has to happen first, who does it and a way to get there.
            <section
              aria-labelledby="blocked-title"
              className="flex flex-col gap-4 rounded-xl border border-warning/40 bg-warning-container p-4 text-on-warning-container md:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-container-lowest text-warning">
                  <Icon name="lock" size={24} />
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <h2 id="blocked-title" className="text-title-medium">
                    {t('task.blockedTitle')}
                  </h2>
                  <p className="text-body-medium">{t('task.blockedBody', { count: blockers.length })}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {blockers.map((b) => {
                  const mine = b.owner === 'hire';
                  return (
                    <li
                      key={b.id}
                      className="relative flex min-w-0 items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 text-on-surface hover:bg-surface-container focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary"
                    >
                      <Icon name={TASK_TYPE_ICON[b.type]} size={24} className="shrink-0 text-on-surface-variant" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Link
                          to={`/me/tasks/${b.id}`}
                          className="text-title-small outline-none after:absolute after:inset-0 after:content-['']"
                        >
                          {b.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-small text-on-surface-variant">
                          <span
                            className={cn(
                              'inline-flex h-6 items-center gap-1 rounded-full pr-2.5 pl-1.5 text-label-medium',
                              mine
                                ? 'bg-primary-container text-on-primary-container'
                                : 'bg-surface-container-high text-on-surface',
                            )}
                          >
                            <Icon name="person" size={16} />
                            {mine ? t('task.blockerYours') : t('task.blockerOwner', { owner: t(`owners.${b.owner}`) })}
                          </span>
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Icon name="calendar_today" size={16} />
                            {t('task.blockerDue', { date: formatDate(b.dueDate) })}
                          </span>
                        </div>
                      </div>
                      <span
                        className="hidden shrink-0 items-center gap-1 text-label-large text-primary sm:inline-flex"
                        aria-hidden
                      >
                        {mine ? t('task.blockerGo') : t('task.blockerSee')}
                        <Icon name="chevron_right" size={20} />
                      </span>
                      <Icon name="chevron_right" size={20} className="shrink-0 text-on-surface-variant sm:hidden" />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {!ownTask && status !== 'done' && (
            <InlineAlert tone="info">{t('task.otherOwner', { owner: t(`owners.${task.owner}`) })}</InlineAlert>
          )}

          {task.type === 'course' && (
            <Card title={t('task.about')}>
              <p className="text-body-large text-on-surface">{task.description}</p>
            </Card>
          )}
          {task.type === 'course' ? (
            <Card title={t('task.course.title')} description={t('task.course.intro')}>
              <ol className="flex flex-col divide-y divide-outline-variant rounded-md border border-outline-variant">
                {lessons.map((lesson, i) => (
                  <li key={lesson} className="flex items-center gap-3 px-4 py-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-label-large text-on-primary-container tabular-nums">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-body-medium text-on-surface">{lesson}</span>
                    <span className="shrink-0 text-body-small text-on-surface-variant tabular-nums">
                      {t('task.course.minutes', { count: LESSON_MINUTES[i] })}
                    </span>
                  </li>
                ))}
              </ol>
              {canComplete && (
                <div className="flex justify-end">
                  <Button leadingIcon="check" onClick={onComplete} fullWidth className="sm:w-auto">
                    {t('task.course.complete')}
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card title={t('task.about')}>
              <p className="text-body-large text-on-surface">{task.description}</p>
              <p className="flex items-start gap-2 rounded-md bg-surface-container px-3 py-2.5 text-body-medium text-on-surface-variant">
                <Icon name={TASK_TYPE_ICON[task.type]} className="mt-0.5 shrink-0" />
                {t(`task.material.${task.type}`)}
              </p>
              {canComplete && (
                <div className="flex justify-end">
                  <Button leadingIcon="check" onClick={onComplete} fullWidth className="sm:w-auto">
                    {t('journey.complete')}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        <Card title={t('task.details')} className="h-fit">
          <dl className="flex flex-col divide-y divide-outline-variant">
            <DetailRow label={t('task.due')}>
              {status === 'done' ? (
                <time dateTime={task.dueDate} className="tabular-nums">
                  {formatDate(task.dueDate)}
                </time>
              ) : (
                <DueText task={task} status={status} className="text-body-medium" stacked />
              )}
            </DetailRow>
            {status === 'done' && task.completedAt && (
              <DetailRow label={t('journey.row.doneOn')}>
                <time dateTime={task.completedAt.slice(0, 10)} className="tabular-nums">
                  {formatDate(task.completedAt)}
                </time>
              </DetailRow>
            )}
            <DetailRow label={t('task.owner')}>
              {ownTask ? t('journey.yoursShort') : t(`owners.${task.owner}`)}
            </DetailRow>
            <DetailRow label={t('task.type')}>{t(`taskTypes.${task.type}`)}</DetailRow>
            <DetailRow label={t('task.stage')}>{t(`stages.${task.stage}`)}</DetailRow>
          </dl>
        </Card>
      </div>
    </>
  );
}

/** One row of the details list: label on the left, value on the right (stacks on very narrow cards). */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-0.5 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-body-medium text-on-surface-variant">{label}</dt>
      <dd className="text-right text-body-medium text-on-surface">{children}</dd>
    </div>
  );
}
