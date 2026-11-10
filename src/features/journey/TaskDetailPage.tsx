import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { formatDate } from '@/lib/dates';
import { blockingTasks, taskStatus } from '@/lib/journey';
import { canCompleteTask } from '@/lib/permissions';
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
      <nav aria-label={t('task.breadcrumb')} className="mb-2">
        <Link
          to="/me"
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('task.back')}
        </Link>
      </nav>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-1">
            <Icon name={TASK_TYPE_ICON[task.type]} size={16} />
            {t(`taskTypes.${task.type}`)} · {t(`stages.${task.stage}`)}
          </span>
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
            <InlineAlert tone="warning" title={t('task.blockedTitle')}>
              <p>{t('task.blockedBody')}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {blockers.map((b) => (
                  <li key={b.id}>
                    <Link to={`/me/tasks/${b.id}`} className="underline underline-offset-4">
                      {b.title}
                    </Link>{' '}
                    · {t('journey.ownerIs', { owner: t(`owners.${b.owner}`) })}
                  </li>
                ))}
              </ul>
            </InlineAlert>
          )}

          {!ownTask && status !== 'done' && (
            <InlineAlert tone="info">{t('task.otherOwner', { owner: t(`owners.${task.owner}`) })}</InlineAlert>
          )}

          <Card title={t('task.about')}>
            <p className="text-body-large text-on-surface">{task.description}</p>
          </Card>

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
            <Card title={t('task.material.title')}>
              <p className="text-body-medium text-on-surface-variant">{t(`task.material.${task.type}`)}</p>
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

        <Card title={t('task.status')} className="h-fit">
          <dl className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <dt className="text-label-medium text-on-surface-variant">{t('task.status')}</dt>
              <dd>
                <TaskStatusPill status={status} />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-label-medium text-on-surface-variant">{t('task.due')}</dt>
              <dd>
                <DueText task={task} status={status} className="text-body-medium" />
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-label-medium text-on-surface-variant">{t('task.owner')}</dt>
              <dd className="text-body-medium text-on-surface">
                {ownTask ? t('journey.yours') : t(`owners.${task.owner}`)}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-label-medium text-on-surface-variant">{t('task.type')}</dt>
              <dd className="text-body-medium text-on-surface">{t(`taskTypes.${task.type}`)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </>
  );
}
