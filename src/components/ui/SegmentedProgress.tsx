import { motion } from 'motion/react';
import { duration, easing, stagger, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface SegmentedProgressProps {
  /** Completed steps (for example, tasks done). */
  done: number;
  /** Total steps. */
  total: number;
  /** Number of bars drawn; filled in proportion to done/total. */
  segments?: number;
  /** Accessible name, for example "Avance del recorrido". */
  label: string;
  /** Spoken value, for example "13 de 18 tareas hechas". */
  valueText: string;
  className?: string;
}

/**
 * Segmented progress bar (reference original-cf59fe35, 2.2.1 pattern 10): thin rounded
 * vertical bars filled in proportion to the progress. Flat colors only: `primary` done, `outline-variant` pending.
 * Segments fill in sequence on mount (2.6); with reduced motion they render directly.
 */
export function SegmentedProgress({ done, total, segments = 30, label, valueText, className }: SegmentedProgressProps) {
  const reduce = useShouldReduceMotion();
  const filledCount = total > 0 ? Math.round((done / total) * segments) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={valueText}
      className={cn('flex h-8 min-w-0 items-stretch justify-between gap-0.5', className)}
    >
      {Array.from({ length: segments }, (_, i) => {
        const filled = i < filledCount;
        return (
          <span key={i} className="relative w-1 min-w-0 overflow-hidden rounded-full bg-outline-variant sm:w-1.5">
            {filled && (
              <motion.span
                className="absolute inset-0 origin-bottom rounded-full bg-primary"
                initial={reduce ? false : { scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{
                  duration: reduce ? 0 : duration.medium,
                  ease: easing.emphasizedDecelerate,
                  delay: reduce ? 0 : i * (stagger / 2),
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
}
