import { AnimatePresence, motion } from 'motion/react';
import { type ReactNode, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Done tasks of a stage, folded behind a disclosure button ("Ver 4 tareas hechas")
 * so the tasks still to do stay in view. Keyboard and screen reader friendly
 * (aria-expanded + aria-controls); height animates unless motion is reduced.
 */
export function FoldedDoneTasks({ count, children }: { count: number; children: ReactNode }) {
  const { t } = useTranslation();
  const reduce = useShouldReduceMotion();
  const [open, setOpen] = useState(false);
  const listId = useId();
  if (count === 0) return null;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex min-h-12 w-full items-center gap-2 rounded-md px-2 text-left text-label-large text-on-surface-variant transition-colors duration-150 md:min-h-10',
          'hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary',
        )}
      >
        <Icon name="check_circle" filled className="shrink-0 text-success" />
        <span className="flex-1">
          {open ? t('journey.all.hideDone', { count }) : t('journey.all.showDone', { count })}
        </span>
        <Icon
          name="keyboard_arrow_down"
          className={cn('shrink-0 transition-transform duration-200', open && 'rotate-180', reduce && 'transition-none')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={listId}
            key="done"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: duration.long, ease: easing.standard }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col divide-y divide-outline-variant">{children}</ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
