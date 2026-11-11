import {
  type Announcements,
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { STAGE_RANGES } from '@/lib/templates';
import type { Stage, TemplateTask } from '@/types/domain';
import { SortableTaskCard } from './SortableTaskCard';

interface StageSectionProps {
  stage: Stage;
  /** Tasks of this stage, in order. */
  tasks: TemplateTask[];
  allTasks: TemplateTask[];
  invalidIds: string[];
  onReorder: (taskId: string, toIndex: number) => void;
  onAdd: () => void;
  onEdit: (task: TemplateTask) => void;
  onMove: (task: TemplateTask, direction: -1 | 1) => void;
  onMoveToStage: (task: TemplateTask, stage: Stage) => void;
  onDelete: (task: TemplateTask) => void;
}

/**
 * One stage of the builder: its own sortable list (tasks are reordered inside the
 * stage by dragging; moving across stages is done from the task menu, D-48).
 */
export function StageSection({
  stage,
  tasks,
  allTasks,
  invalidIds,
  onReorder,
  onAdd,
  onEdit,
  onMove,
  onMoveToStage,
  onDelete,
}: StageSectionProps) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const titleOf = (id: string | number) => tasks.find((x) => x.id === id)?.title ?? '';
  const positionOf = (id: string | number | undefined) => tasks.findIndex((x) => x.id === id) + 1;
  const total = tasks.length;

  // Spoken feedback while dragging with the keyboard or a screen reader (2.10).
  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t('templates.editor.dnd.start', { title: titleOf(active.id), position: positionOf(active.id), total }),
    onDragOver: ({ active, over }) =>
      over ? t('templates.editor.dnd.over', { title: titleOf(active.id), position: positionOf(over.id), total }) : '',
    onDragEnd: ({ active, over }) =>
      t('templates.editor.dnd.end', {
        title: titleOf(active.id),
        position: positionOf(over?.id ?? active.id),
        total,
      }),
    onDragCancel: ({ active }) => t('templates.editor.dnd.cancel', { title: titleOf(active.id) }),
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), tasks.findIndex((x) => x.id === over.id));
  };

  const { min, max } = STAGE_RANGES[stage];
  const headingId = `stage-heading-${stage}`;

  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-outline-variant pb-2">
        <h3 id={headingId} tabIndex={-1} className="text-title-medium text-on-surface outline-none">
          {t(`stages.${stage}`)}
        </h3>
        <span className="text-body-small text-on-surface-variant tabular-nums">
          {t(min < 0 ? 'templates.editor.tasks.rangeBefore' : 'templates.editor.tasks.range', { min, max })} ·{' '}
          {t('templates.editor.tasks.count', { count: total })}
        </span>
      </div>

      {total === 0 ? (
        <p className="text-body-medium text-on-surface-variant">{t('templates.editor.tasks.empty')}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={onDragEnd}
          accessibility={{
            announcements,
            screenReaderInstructions: { draggable: t('templates.editor.dnd.instructions') },
          }}
        >
          <SortableContext items={tasks.map((x) => x.id)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2">
              {tasks.map((task, index) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  allTasks={allTasks}
                  isFirst={index === 0}
                  isLast={index === total - 1}
                  invalid={invalidIds.includes(task.id)}
                  onEdit={() => onEdit(task)}
                  onMove={(direction) => onMove(task, direction)}
                  onMoveToStage={(target) => onMoveToStage(task, target)}
                  onDelete={() => onDelete(task)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <Button variant="text" leadingIcon="add" onClick={onAdd} className="w-fit">
        {t('templates.editor.tasks.addTo', { stage: t(`stages.${stage}`) })}
      </Button>
    </section>
  );
}
