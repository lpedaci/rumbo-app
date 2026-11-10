import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toast-store';
import { progressByStage, tasksUnlockedBy } from '@/lib/journey';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Hire, HireTask } from '@/types/domain';

/**
 * Marks a task as done and returns the ids of the tasks it unlocked, so the
 * screen can highlight them. Celebrates a finished stage (one exclamation, 2.9).
 */
export function useCompleteTask() {
  const { t } = useTranslation();
  const user = useCurrentUser();

  return (hire: Hire, task: HireTask): string[] => {
    if (!user) return [];
    const unlocked = tasksUnlockedBy(hire.tasks, task.id);
    useDataStore.getState().completeTask(hire.id, task.id, user.personId);

    const updated = useDataStore.getState().hires.find((h) => h.id === hire.id);
    const stageDone = updated && progressByStage(updated.tasks)[task.stage].percent === 100;
    const unlockedTitles = hire.tasks.filter((x) => unlocked.includes(x.id)).map((x) => x.title);

    toast.success(stageDone ? t('journey.stageDone', { stage: t(`stages.${task.stage}`) }) : t('journey.taskDone'));
    if (unlockedTitles.length > 0) toast.info(t('journey.unlocked', { tasks: unlockedTitles.join(', ') }));
    return unlocked;
  };
}
