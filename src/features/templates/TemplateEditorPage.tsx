import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import { type FieldErrors, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useBlocker, useNavigate, useParams } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { DEMO_TODAY, STAGES } from '@/lib/dates';
import {
  clampOffsetToStage,
  dependentsOf,
  moveTask,
  moveToStage,
  newId,
  removeTask,
  reorderInStage,
  tasksOfStage,
  templateUsage,
  type TemplateIssue,
  upsertTask,
  validateTemplate,
} from '@/lib/templates';
import { useFieldError } from '@/lib/use-field-error';
import { requiredText } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser, useSessionStore } from '@/store/session-store';
import type { Stage, Template, TemplateTask } from '@/types/domain';
import { StageSection } from './StageSection';
import { TaskFormDialog } from './TaskFormDialog';

const NAME_MAX = 80;
const detailsSchema = z.object({
  name: requiredText.pipe(z.string().max(NAME_MAX, 'templates.taskForm.titleMax')),
  jobTitle: requiredText.pipe(z.string().max(NAME_MAX, 'templates.taskForm.titleMax')),
  area: requiredText.pipe(z.string().max(NAME_MAX, 'templates.taskForm.titleMax')),
});
type DetailsValues = z.infer<typeof detailsSchema>;

type SummaryItem = { key: string; message: string; target: string };

/**
 * A6 · Template builder (CLAUDE.md F2). Works on a draft in memory: details,
 * tasks by stage, drag and drop with a menu alternative, and validation of
 * dependencies (no cycles, no dependency due later) before saving.
 */
export function TemplateEditorPage() {
  const { id = 'new' } = useParams();
  const template = useDataStore((s) => s.templates.find((x) => x.id === id));
  if (id !== 'new' && !template) return <AccessDeniedPage reason="not_found" />;
  // Remount on id change so the draft always starts from the saved template.
  return <TemplateEditor key={id} template={template} />;
}

function TemplateEditor({ template }: { template?: Template }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const fieldError = useFieldError();
  const hires = useDataStore((s) => s.hires);
  const isNew = !template;

  const savedDetails: DetailsValues = {
    name: template?.name ?? '',
    jobTitle: template?.jobTitle ?? '',
    area: template?.area ?? '',
  };
  const [baseline, setBaseline] = useState(() => JSON.stringify({ ...savedDetails, tasks: template?.tasks ?? [] }));
  const [tasks, setTasks] = useState<TemplateTask[]>(template?.tasks ?? []);
  const [formState, setFormState] = useState<{ open: boolean; task?: TemplateTask; stage: Stage }>({
    open: false,
    stage: 'preboarding',
  });
  const [toDelete, setToDelete] = useState<TemplateTask | null>(null);
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    mode: 'onTouched',
    defaultValues: savedDetails,
    shouldFocusError: false,
  });
  const details = useWatch({ control }) as DetailsValues;

  const dirty = JSON.stringify({ ...savedDetails, ...details, tasks }) !== baseline;
  // Set right before navigating after a save, when `dirty` has not re-rendered yet.
  const allowLeave = useRef(false);

  // Any in-app navigation with unsaved changes asks first: back link, side navigation
  // or browser back (D-50, D-53). A role switch already closed this session, so it is
  // not held back (the next role could not see this screen anyway).
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !allowLeave.current &&
      currentLocation.pathname !== nextLocation.pathname &&
      useSessionStore.getState().session?.personId === user?.personId,
  );
  const usage = template ? templateUsage(template.id, hires) : 0;

  // Leaving the page with unsaved changes asks the browser to confirm (D-50).
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (summary.length > 0) summaryRef.current?.focus();
  }, [summary]);

  const titleOf = (taskId: string) => tasks.find((x) => x.id === taskId)?.title ?? '';
  const announce = (message: string) => {
    setAnnouncement('');
    window.setTimeout(() => setAnnouncement(message), 50);
  };

  const issueMessage = (issue: TemplateIssue): SummaryItem => {
    switch (issue.kind) {
      case 'no_tasks':
        return { key: 'no_tasks', message: t('templates.editor.issues.no_tasks'), target: 'stage-heading-preboarding' };
      case 'stage_range': {
        const task = tasks.find((x) => x.id === issue.taskId);
        return {
          key: `range-${issue.taskId}`,
          message: t('templates.editor.issues.stage_range', {
            task: task?.title,
            stage: t(`stages.${task?.stage ?? 'week1'}`),
          }),
          target: `task-card-${issue.taskId}`,
        };
      }
      case 'cycle':
        return {
          key: 'cycle',
          message: t('templates.editor.issues.cycle', { path: issue.path.map(titleOf).join(' → ') }),
          target: `task-card-${issue.path[0]}`,
        };
      case 'later_dependency':
        return {
          key: `later-${issue.taskId}-${issue.dependencyId}`,
          message: t('templates.editor.issues.later_dependency', {
            task: titleOf(issue.taskId),
            dependency: titleOf(issue.dependencyId),
          }),
          target: `task-card-${issue.taskId}`,
        };
      case 'missing':
        return {
          key: `missing-${issue.taskId}`,
          message: t('templates.editor.issues.missing', { task: titleOf(issue.taskId) }),
          target: `task-card-${issue.taskId}`,
        };
    }
  };

  const invalidIds = useMemo(
    () => summary.filter((s) => s.target.startsWith('task-card-')).map((s) => s.target.replace('task-card-', '')),
    [summary],
  );

  const fieldSummary = (fieldErrors: FieldErrors<DetailsValues>): SummaryItem[] =>
    (['name', 'jobTitle', 'area'] as const)
      .filter((field) => fieldErrors[field])
      .map((field) => ({
        key: field,
        message: `${t(`templates.editor.details.${field}`)}: ${detailErrorText(fieldErrors[field]?.message)}`,
        target: `tpl-${field}`,
      }));

  const detailErrorText = (message?: string) =>
    message === 'templates.taskForm.titleMax' ? t(message, { max: NAME_MAX }) : fieldError({ type: 'custom', message });

  const save = (values: DetailsValues) => {
    if (!user) return;
    const issues = validateTemplate(tasks).map(issueMessage);
    if (issues.length > 0) {
      setSummary(issues);
      return;
    }
    setSummary([]);
    const saved: Template = {
      id: template?.id ?? newId('tpl'),
      name: values.name.trim(),
      jobTitle: values.jobTitle.trim(),
      area: values.area.trim(),
      updatedAt: DEMO_TODAY,
      tasks,
    };
    useDataStore.getState().saveTemplate(saved, user.personId);
    setBaseline(JSON.stringify({ ...savedDetails, ...values, tasks }));
    toast.success(isNew ? t('templates.editor.created') : t('templates.editor.saved'));
    if (isNew) {
      allowLeave.current = true;
      navigate(`/admin/templates/${saved.id}`, { replace: true });
    }
  };

  const onInvalid = (fieldErrors: FieldErrors<DetailsValues>) => {
    setSummary([...fieldSummary(fieldErrors), ...validateTemplate(tasks).map(issueMessage)]);
  };

  const focusTarget = (target: string) => {
    const element = document.getElementById(target);
    element?.scrollIntoView({ block: 'center' });
    element?.focus();
  };

  // ---------- Task operations ----------
  const onTaskSubmit = (task: TemplateTask) => {
    const existed = tasks.some((x) => x.id === task.id);
    setTasks((current) => upsertTask(current, task));
    toast.success(existed ? t('templates.taskForm.updated') : t('templates.taskForm.added'));
  };

  const onReorder = (taskId: string, toIndex: number) => {
    const task = tasks.find((x) => x.id === taskId);
    if (!task) return;
    setTasks((current) => reorderInStage(current, taskId, toIndex));
    // dnd-kit announces the drop itself.
  };

  const onMove = (task: TemplateTask, direction: -1 | 1) => {
    const next = moveTask(tasks, task.id, direction);
    if (next === tasks) return;
    setTasks(next);
    const stageTasks = tasksOfStage(next, task.stage);
    announce(
      t('templates.editor.moved', {
        title: task.title,
        position: stageTasks.findIndex((x) => x.id === task.id) + 1,
        total: stageTasks.length,
        stage: t(`stages.${task.stage}`),
      }),
    );
  };

  const onMoveToStage = (task: TemplateTask, stage: Stage) => {
    setTasks((current) => moveToStage(current, task.id, stage));
    const day = clampOffsetToStage(task.offsetDays, stage);
    const message =
      day === task.offsetDays
        ? t('templates.editor.movedStage', { title: task.title, stage: t(`stages.${stage}`) })
        : t('templates.editor.movedStageOffset', { title: task.title, stage: t(`stages.${stage}`), day });
    announce(message);
    toast.info(message);
  };

  const onDeleteConfirmed = () => {
    if (!toDelete) return;
    const stage = toDelete.stage;
    setTasks((current) => removeTask(current, toDelete.id));
    toast.success(t('templates.editor.deleteTask.done'));
    // The menu that opened the dialog no longer exists: focus goes to the stage heading.
    window.setTimeout(() => document.getElementById(`stage-heading-${stage}`)?.focus(), 250);
  };

  const dependents = toDelete ? dependentsOf(tasks, toDelete.id) : [];
  const previewReason = isNew
    ? t('templates.editor.previewNew')
    : dirty
      ? t('templates.editor.previewUnsaved')
      : undefined;

  return (
    <>
      <nav aria-label={t('templates.editor.breadcrumb')} className="mb-2">
        <Link
          to="/admin/templates"
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('templates.editor.back')}
        </Link>
      </nav>

      <PageHeader
        eyebrow={t('templates.editor.eyebrow')}
        title={template?.name ?? t('templates.editor.titleNew')}
        description={usage > 0 ? t('templates.editor.usageNote', { count: usage }) : undefined}
        actions={
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {dirty && (
              <span className="flex items-center gap-1 text-body-small text-on-surface-variant">
                <Icon name="info" size={16} />
                {t('templates.editor.unsaved')}
              </span>
            )}
            {previewReason ? (
              <Button variant="outlined" leadingIcon="visibility" disabledReason={previewReason}>
                {t('templates.editor.preview')}
              </Button>
            ) : (
              <Button asChild variant="outlined" leadingIcon="visibility">
                <Link to={`/admin/templates/${template?.id}/preview`}>{t('templates.editor.preview')}</Link>
              </Button>
            )}
            <Button leadingIcon="save" onClick={() => void handleSubmit(save, onInvalid)()}>
              {t('templates.editor.save')}
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-(--space-bento-gap)">
        {summary.length > 0 && (
          <div ref={summaryRef} tabIndex={-1} className="outline-none">
            <InlineAlert tone="error" live="alert" title={t('templates.editor.issues.title')}>
              <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
                {summary.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => focusTarget(item.target)}
                      className="text-left underline underline-offset-4"
                    >
                      {item.message}
                    </button>
                  </li>
                ))}
              </ul>
            </InlineAlert>
          </div>
        )}

        <Card title={t('templates.editor.details.title')}>
          <form
            noValidate
            onSubmit={(event) => void handleSubmit(save, onInvalid)(event)}
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
          >
            <TextField
              id="tpl-name"
              label={t('templates.editor.details.name')}
              required
              helperText={t('templates.editor.details.nameHelp')}
              error={errors.name && detailErrorText(errors.name.message)}
              {...register('name')}
            />
            <TextField
              id="tpl-jobTitle"
              label={t('templates.editor.details.jobTitle')}
              required
              helperText={t('templates.editor.details.jobTitleHelp')}
              error={errors.jobTitle && detailErrorText(errors.jobTitle.message)}
              {...register('jobTitle')}
            />
            <TextField
              id="tpl-area"
              label={t('templates.editor.details.area')}
              required
              helperText={t('templates.editor.details.areaHelp')}
              error={errors.area && detailErrorText(errors.area.message)}
              {...register('area')}
            />
            {/* Enter in a field saves the template. */}
            <button type="submit" hidden aria-hidden tabIndex={-1} />
          </form>
        </Card>

        <Card title={t('templates.editor.tasks.title')} description={t('templates.editor.tasks.description')}>
          <div className="flex flex-col gap-8">
            {STAGES.map((stage) => (
              <StageSection
                key={stage}
                stage={stage}
                tasks={tasksOfStage(tasks, stage)}
                allTasks={tasks}
                invalidIds={invalidIds}
                onReorder={onReorder}
                onAdd={() => setFormState({ open: true, stage })}
                onEdit={(task) => setFormState({ open: true, task, stage: task.stage })}
                onMove={onMove}
                onMoveToStage={onMoveToStage}
                onDelete={setToDelete}
              />
            ))}
          </div>
        </Card>
      </div>

      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>

      <TaskFormDialog
        open={formState.open}
        onOpenChange={(open) => setFormState((current) => ({ ...current, open }))}
        task={formState.task}
        stage={formState.stage}
        tasks={tasks}
        onSubmit={onTaskSubmit}
      />

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t('templates.editor.deleteTask.title')}
        description={
          dependents.length > 0
            ? t('templates.editor.deleteTask.bodyDependents', {
                title: toDelete?.title,
                tasks: dependents.map((x) => x.title).join(', '),
              })
            : t('templates.editor.deleteTask.body', { title: toDelete?.title })
        }
        confirmLabel={t('templates.editor.deleteTask.confirm')}
        onConfirm={onDeleteConfirmed}
      />

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset();
        }}
        title={t('templates.editor.leave.title')}
        description={t('templates.editor.leave.body')}
        confirmLabel={t('templates.editor.leave.confirm')}
        onConfirm={() => blocker.proceed?.()}
      />
    </>
  );
}
