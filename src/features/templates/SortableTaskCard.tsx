import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { TASK_TYPE_ICON } from '@/features/journey/task-meta';
import { STAGES } from '@/lib/dates';
import { useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { Stage, TemplateTask } from '@/types/domain';

interface SortableTaskCardProps {
  task: TemplateTask;
  allTasks: TemplateTask[];
  isFirst: boolean;
  isLast: boolean;
  /** Highlighted when the save summary points to it. */
  invalid?: boolean;
  onEdit: () => void;
  onMove: (direction: -1 | 1) => void;
  onMoveToStage: (stage: Stage) => void;
  onDelete: () => void;
}

/**
 * One task in the template builder. Reordered by dragging its handle (mouse, touch or
 * keyboard) or, as the single-pointer alternative of WCAG 2.5.7, from its menu:
 * "Subir", "Bajar" and "Mover a etapa…".
 */
export function SortableTaskCard({
  task,
  allTasks,
  isFirst,
  isLast,
  invalid,
  onEdit,
  onMove,
  onMoveToStage,
  onDelete,
}: SortableTaskCardProps) {
  const { t } = useTranslation();
  const reduceMotion = useShouldReduceMotion();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const dependencies = task.dependsOn
    .map((id) => allTasks.find((x) => x.id === id)?.title)
    .filter((title): title is string => Boolean(title));

  return (
    <li
      ref={setNodeRef}
      id={`task-card-${task.id}`}
      tabIndex={-1}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: reduceMotion ? undefined : transition,
      }}
      className={cn(
        'relative flex min-w-0 items-start gap-1 rounded-md border bg-surface-container-lowest py-2 pr-1 pl-1 outline-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        invalid ? 'border-error' : 'border-outline-variant',
        // The dragged card lifts slightly (2.6); elevation only while it floats (2.5).
        isDragging && 'z-10 border-primary shadow-elevation-2',
        isDragging && !reduceMotion && 'scale-[1.01]',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className={cn(
          'flex size-12 shrink-0 cursor-grab md:size-10 touch-none items-center justify-center rounded-sm text-on-surface-variant',
          'hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-primary active:cursor-grabbing',
        )}
        {...attributes}
        {...listeners}
        aria-label={t('templates.editor.row.drag', { title: task.title })}
      >
        <Icon name="drag_indicator" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex min-h-12 w-fit max-w-full items-center rounded-xs text-left text-title-small md:min-h-0 text-on-surface underline-offset-4 hover:underline"
        >
          <span className="line-clamp-2">{task.title}</span>
        </button>
        <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-body-small text-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Icon name={TASK_TYPE_ICON[task.type]} size={16} />
            {t(`taskTypes.${task.type}`)}
          </span>
          <span>{t('journey.ownerIs', { owner: t(`owners.${task.owner}`) })}</span>
          <span className="tabular-nums">{t('templates.editor.row.day', { day: task.offsetDays })}</span>
        </p>
        {dependencies.length > 0 && (
          <p className="flex min-w-0 items-start gap-1 text-body-small text-on-surface-variant">
            <Icon name="link" size={16} className="mt-px shrink-0" />
            <span className="min-w-0">{t('templates.editor.row.dependsOn', { tasks: dependencies.join(', ') })}</span>
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton icon="more_vert" label={t('templates.editor.row.menu', { title: task.title })} />
        </DropdownMenuTrigger>
        <DropdownMenuContent label={t('templates.editor.row.menu', { title: task.title })}>
          <DropdownMenuItem icon="edit" onSelect={onEdit}>
            {t('templates.editor.row.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem icon="arrow_upward" disabled={isFirst} onSelect={() => onMove(-1)}>
            {t('templates.editor.row.up')}
          </DropdownMenuItem>
          <DropdownMenuItem icon="arrow_downward" disabled={isLast} onSelect={() => onMove(1)}>
            {t('templates.editor.row.down')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{t('templates.editor.row.moveTo')}</DropdownMenuLabel>
          {STAGES.filter((s) => s !== task.stage).map((s) => (
            <DropdownMenuItem key={s} icon="drive_file_move" onSelect={() => onMoveToStage(s)}>
              {t(`stages.${s}`)}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem icon="delete" destructive onSelect={onDelete}>
            {t('templates.editor.row.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
