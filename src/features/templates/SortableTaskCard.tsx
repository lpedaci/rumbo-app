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
import type { Owner, Stage, TemplateTask } from '@/types/domain';

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
/** Owner chip: the role color for people with a platform role (D-69), neutral for the rest. */
const OWNER_CHIP: Record<Owner, string> = {
  hire: 'bg-role-hire-container',
  manager: 'bg-role-manager-container',
  hr: 'bg-role-hr-container',
  it: 'bg-role-it-container',
  buddy: 'bg-surface-container-high',
  facilities: 'bg-surface-container-high',
};

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
        'relative flex min-w-0 items-start gap-1 rounded-md border bg-surface-container-lowest py-2 pr-1 pl-1 outline-none transition-colors hover:bg-surface-container',
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
          'relative z-10 flex size-12 shrink-0 cursor-grab md:size-10 touch-none items-center justify-center rounded-sm text-on-surface-variant',
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
          // Stretched: the whole card opens the task; focus ring on the card, no underline (D-82)
          className="flex min-h-12 w-fit max-w-full items-center text-left text-title-small text-on-surface outline-none after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-primary md:min-h-0"
        >
          <span className="line-clamp-2">{task.title}</span>
        </button>
        {/* Each fact in its own chip with icon and text: type, owner and day (D-82) */}
        <ul className="flex min-w-0 flex-wrap items-center gap-1.5" aria-label={t('templates.editor.row.facts')}>
          <li className="inline-flex h-6 items-center gap-1 rounded-full bg-surface-container-high pr-2.5 pl-1.5 text-label-medium text-on-surface">
            <Icon name={TASK_TYPE_ICON[task.type]} size={16} className="text-on-surface-variant" />
            {t(`taskTypes.${task.type}`)}
          </li>
          <li
            className={cn(
              'inline-flex h-6 items-center gap-1 rounded-full pr-2.5 pl-1.5 text-label-medium text-on-surface',
              OWNER_CHIP[task.owner],
            )}
          >
            <Icon name="person" size={16} />
            <span className="sr-only">{t('templates.editor.row.owner')}: </span>
            {t(`owners.${task.owner}`)}
          </li>
          <li className="inline-flex h-6 items-center gap-1 rounded-full border border-outline-variant pr-2.5 pl-1.5 text-label-medium text-on-surface tabular-nums">
            <Icon name="calendar_today" size={16} className="text-on-surface-variant" />
            {t('templates.editor.row.day', { day: task.offsetDays })}
          </li>
        </ul>
        {dependencies.length > 0 && (
          <p className="flex min-w-0 items-start gap-1 text-body-small text-on-surface-variant">
            <Icon name="link" size={16} className="mt-px shrink-0" />
            <span className="min-w-0">{t('templates.editor.row.dependsOn', { tasks: dependencies.join(', ') })}</span>
          </p>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <IconButton
            className="relative z-10"
            icon="more_vert"
            label={t('templates.editor.row.menu', { title: task.title })}
          />
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
