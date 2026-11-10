import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { interactive } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Tooltip } from '@/components/ui/Tooltip';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface CompleteTaskButtonProps {
  title: string;
  done: boolean;
  onComplete: () => void;
}

/**
 * Round "mark as done" control of a task row. When the task is done, the check
 * is revealed left to right, like being drawn (CLAUDE.md 2.6); with reduced
 * motion it simply appears. Completing is one-way, so a done task is a status, not a button.
 */
export function CompleteTaskButton({ title, done, onComplete }: CompleteTaskButtonProps) {
  const { t } = useTranslation();
  const reduce = useShouldReduceMotion();

  if (done) {
    return (
      <span className="flex size-10 shrink-0 items-center justify-center" role="img" aria-label={t('journey.completed')}>
        <motion.span
          className="flex text-success"
          initial={reduce ? { opacity: 0 } : { clipPath: 'inset(0 100% 0 0)' }}
          animate={reduce ? { opacity: 1 } : { clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: duration.long, ease: easing.emphasizedDecelerate }}
        >
          <Icon name="check_circle" size={24} filled />
        </motion.span>
      </span>
    );
  }

  const label = t('journey.completeTask', { title });
  return (
    <Tooltip content={t('journey.complete')}>
      <button
        type="button"
        aria-label={label}
        onClick={onComplete}
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full text-outline hover:text-success',
          interactive,
        )}
      >
        <Icon name="radio_button_unchecked" size={24} />
      </button>
    </Tooltip>
  );
}
