import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { STAGES } from '@/lib/dates';
import { integerMask } from '@/lib/input-masks';
import { clampOffsetToStage, dependencyOptionState, newId, offsetFitsStage, STAGE_RANGES } from '@/lib/templates';
import { useFieldError } from '@/lib/use-field-error';
import { requiredText, taskOffsetField } from '@/lib/validation';
import type { Owner, Stage, TaskType, TemplateTask } from '@/types/domain';

const TASK_TYPES: TaskType[] = ['task', 'course', 'meeting', 'reading', 'document'];
const OWNERS: Owner[] = ['hire', 'manager', 'buddy', 'hr', 'it', 'facilities'];
export const TITLE_MAX = 120;
const DESCRIPTION_MAX = 500;
const offsetMask = integerMask({ allowNegative: true, maxDigits: 2 });

const schema = z
  .object({
    title: requiredText.pipe(z.string().max(TITLE_MAX, 'templates.taskForm.titleMax')),
    description: requiredText.pipe(z.string().max(DESCRIPTION_MAX, 'templates.taskForm.titleMax')),
    type: z.enum(TASK_TYPES),
    owner: z.enum(OWNERS),
    stage: z.enum(STAGES as [Stage, ...Stage[]]),
    offset: taskOffsetField,
    dependsOn: z.array(z.string()),
  })
  .superRefine((value, ctx) => {
    const offset = Number(value.offset);
    if (/^-?\d+$/.test(value.offset) && !offsetFitsStage(offset, value.stage)) {
      ctx.addIssue({ code: 'custom', path: ['offset'], message: 'templates.taskForm.offsetStage' });
    }
  });

type TaskFormValues = z.infer<typeof schema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Task being edited, or undefined to add a new one. */
  task?: TemplateTask;
  /** Stage preselected when adding from a stage section. */
  stage: Stage;
  /** All tasks of the template draft (for the dependency picker). */
  tasks: TemplateTask[];
  onSubmit: (task: TemplateTask) => void;
}

/**
 * Add or edit a template task (CLAUDE.md F2): title, description, type, owner, stage,
 * relative due day and dependencies. Options that would create a circular dependency
 * are disabled with the reason; a dependency due later is an error the person fixes.
 */
export function TaskFormDialog({ open, onOpenChange, task, stage, tasks, onSubmit }: TaskFormDialogProps) {
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const taskId = useMemo(() => task?.id ?? newId('tt'), [task, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const defaults = (): TaskFormValues => ({
    title: task?.title ?? '',
    description: task?.description ?? '',
    type: task?.type ?? 'task',
    owner: task?.owner ?? 'hire',
    stage: task?.stage ?? stage,
    offset: String(task?.offsetDays ?? clampOffsetToStage(0, stage)),
    dependsOn: task?.dependsOn ?? [],
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    clearErrors,
    getValues,
    trigger,
    formState: { errors, isSubmitted },
  } = useForm<TaskFormValues>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: defaults() });

  // Fresh values every time the dialog opens.
  useEffect(() => {
    if (open) reset(defaults());
  }, [open, task, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const watchedStage = useWatch({ control, name: 'stage' });
  const watchedOffset = useWatch({ control, name: 'offset' });
  const dependsOn = useWatch({ control, name: 'dependsOn' });
  const offsetNumber = /^-?\d+$/.test(watchedOffset ?? '') ? Number(watchedOffset) : null;
  const others = tasks.filter((x) => x.id !== taskId);

  const optionState = (candidate: TemplateTask) =>
    dependencyOptionState(tasks, taskId, candidate, offsetNumber ?? Number.POSITIVE_INFINITY);

  // A chosen dependency that is now due later is an error to fix, never removed silently (2.10).
  const laterSelected = others.filter((x) => dependsOn?.includes(x.id) && optionState(x) === 'later');
  useEffect(() => {
    if (!isSubmitted && !errors.dependsOn) return;
    if (laterSelected.length > 0) {
      setError('dependsOn', { type: 'custom', message: 'later' });
    } else {
      clearErrors('dependsOn');
    }
  }, [laterSelected.length, isSubmitted]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDependency = (id: string, checked: boolean) => {
    const current = getValues('dependsOn');
    setValue('dependsOn', checked ? [...current, id] : current.filter((d) => d !== id), { shouldDirty: true });
  };

  const submit = (values: TaskFormValues) => {
    if (laterSelected.length > 0) {
      setError('dependsOn', { type: 'custom', message: 'later' }, { shouldFocus: true });
      return;
    }
    onSubmit({
      id: taskId,
      stage: values.stage,
      order: task?.stage === values.stage ? task.order : 0,
      title: values.title.trim(),
      description: values.description.trim(),
      type: values.type,
      owner: values.owner,
      offsetDays: Number(values.offset),
      dependsOn: values.dependsOn,
      ...(task?.resourceUrl ? { resourceUrl: task.resourceUrl } : {}),
    });
    onOpenChange(false);
  };

  const range = STAGE_RANGES[watchedStage ?? stage];
  const offsetError =
    errors.offset?.message === 'templates.taskForm.offsetStage'
      ? t('templates.taskForm.offsetStage', {
          stage: t(`stages.${watchedStage}`),
          min: range.min,
          max: range.max,
        })
      : fieldError(errors.offset);
  const titleError =
    errors.title?.message === 'templates.taskForm.titleMax'
      ? t('templates.taskForm.titleMax', { max: TITLE_MAX })
      : fieldError(errors.title);
  const descriptionError =
    errors.description?.message === 'templates.taskForm.titleMax'
      ? t('templates.taskForm.titleMax', { max: DESCRIPTION_MAX })
      : fieldError(errors.description);
  const depsErrorId = `${taskId}-deps-error`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={task ? t('templates.taskForm.titleEdit') : t('templates.taskForm.titleNew')}
        className="max-w-2xl"
      >
        <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-5">
          <TextField
            label={t('templates.taskForm.title')}
            required
            helperText={t('templates.taskForm.titleHelp')}
            error={titleError}
            {...register('title')}
          />
          <TextArea
            label={t('templates.taskForm.description')}
            required
            rows={3}
            helperText={t('templates.taskForm.descriptionHelp')}
            error={descriptionError}
            {...register('description')}
          />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Select
              label={t('templates.taskForm.type')}
              helperText={t('templates.taskForm.typeHelp')}
              options={TASK_TYPES.map((value) => ({ value, label: t(`taskTypes.${value}`) }))}
              {...register('type')}
            />
            <Select
              label={t('templates.taskForm.owner')}
              helperText={t('templates.taskForm.ownerHelp')}
              options={OWNERS.map((value) => ({ value, label: t(`owners.${value}`) }))}
              {...register('owner')}
            />
            <Select
              label={t('templates.taskForm.stage')}
              helperText={t('templates.taskForm.stageHelp')}
              options={STAGES.map((value) => ({ value, label: t(`stages.${value}`) }))}
              {...register('stage', {
                // Revalidate the due day against the new stage once it was checked.
                onChange: () => {
                  if (errors.offset || isSubmitted) void trigger('offset');
                },
              })}
            />
            <TextField
              label={t('templates.taskForm.offset')}
              required
              mask={offsetMask}
              inputMode="text"
              autoComplete="off"
              helperText={t('templates.taskForm.offsetHelp')}
              error={offsetError}
              {...register('offset')}
            />
          </div>

          <fieldset
            className="flex min-w-0 flex-col gap-2"
            aria-describedby={errors.dependsOn ? depsErrorId : `${taskId}-deps-help`}
          >
            <legend className="text-label-medium text-on-surface">{t('templates.taskForm.deps')}</legend>
            {errors.dependsOn ? (
              <div id={depsErrorId} className="flex flex-col gap-1 text-body-small text-error">
                {laterSelected.map((x) => (
                  <p key={x.id} className="flex items-start gap-1">
                    <Icon name="error" size={16} className="mt-px" />
                    {t('templates.taskForm.depLaterError', { task: x.title, day: x.offsetDays })}
                  </p>
                ))}
              </div>
            ) : (
              <p id={`${taskId}-deps-help`} className="text-body-small text-on-surface-variant">
                {t('templates.taskForm.depsHelp')}
              </p>
            )}
            {others.length === 0 ? (
              <p className="text-body-medium text-on-surface-variant">{t('templates.taskForm.depsEmpty')}</p>
            ) : (
              <div className="flex max-h-64 flex-col overflow-y-auto rounded-md border border-outline-variant px-3 py-1">
                {STAGES.map((s) => {
                  const ofStage = others.filter((x) => x.stage === s).sort((a, b) => a.order - b.order);
                  if (ofStage.length === 0) return null;
                  return (
                    <div key={s} className="flex flex-col border-b border-outline-variant py-1 last:border-b-0">
                      <span className="pt-1 text-label-medium text-on-surface-variant">{t(`stages.${s}`)}</span>
                      {ofStage.map((candidate) => {
                        const state = optionState(candidate);
                        const checked = dependsOn?.includes(candidate.id) ?? false;
                        const unavailable = state === 'cycle' || (state === 'later' && !checked);
                        return (
                          <Checkbox
                            key={candidate.id}
                            checked={checked}
                            disabled={unavailable}
                            onChange={(event) => toggleDependency(candidate.id, event.target.checked)}
                            label={
                              <>
                                {candidate.title}{' '}
                                <span className="text-on-surface-variant tabular-nums">
                                  · {t('templates.editor.row.day', { day: candidate.offsetDays })}
                                </span>
                              </>
                            }
                            description={
                              state === 'cycle'
                                ? t('templates.taskForm.depCycle')
                                : state === 'later'
                                  ? t('templates.taskForm.depLater', { day: candidate.offsetDays })
                                  : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="outlined" fullWidth className="sm:w-auto">
                {t('ui.cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" fullWidth className="sm:w-auto">
              {task ? t('templates.taskForm.submitEdit') : t('templates.taskForm.submitNew')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
