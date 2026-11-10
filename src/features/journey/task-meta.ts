import type { IconName } from '@/components/ui/Icon';
import type { StatusTone } from '@/components/ui/StatusPill';
import type { TaskStatus, TaskType } from '@/types/domain';

/** Icon per task type (information-architecture.md 3.2). */
export const TASK_TYPE_ICON: Record<TaskType, IconName> = {
  task: 'checklist',
  course: 'school',
  meeting: 'event',
  reading: 'menu_book',
  document: 'description',
};

/** Status pill per derived task status (information-architecture.md 3.3, design-system.md). */
export const TASK_STATUS_PILL: Record<TaskStatus, { tone: StatusTone; icon: IconName }> = {
  pending: { tone: 'neutral', icon: 'radio_button_unchecked' },
  in_progress: { tone: 'info', icon: 'pending' },
  done: { tone: 'success', icon: 'check_circle' },
  blocked: { tone: 'warning', icon: 'lock' },
  overdue: { tone: 'error', icon: 'error' },
};

/** How long the "unlocked" highlight stays on a task row (CLAUDE.md 2.6). */
export const UNLOCK_HIGHLIGHT_MS = 1600;
