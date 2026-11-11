import { motion } from 'motion/react';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  /** 0 to 100. */
  value: number;
  /** Accessible name, for example "Avance de Semana 1". */
  label: string;
  /** Optional visible text next to the bar, for example "60 %". */
  valueText?: string;
  tone?: 'primary' | 'success' | 'tertiary';
  /** `md` (8 px) in lists, `lg` (12 px) for the main progress of a screen (2.2.1, pattern 8). */
  size?: 'md' | 'lg';
  className?: string;
}

/**
 * Linear progress. Fills from 0 on mount and animates changes (2.6);
 * with reduced motion it renders the final value directly.
 */
export function ProgressBar({ value, label, valueText, tone = 'primary', size = 'md', className }: ProgressBarProps) {
  const reduce = useShouldReduceMotion();
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-valuetext={valueText}
        className={cn(
          'min-w-0 flex-1 overflow-hidden rounded-full bg-surface-container-high',
          size === 'lg' ? 'h-3' : 'h-2',
        )}
      >
        <motion.div
          className={cn(
            'h-full origin-left rounded-full',
            tone === 'success' ? 'bg-success' : tone === 'tertiary' ? 'bg-tertiary' : 'bg-primary',
          )}
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: clamped / 100 }}
          transition={{ duration: reduce ? 0 : duration.long, ease: easing.emphasizedDecelerate }}
        />
      </div>
      {valueText && (
        <span aria-hidden className="shrink-0 text-label-medium text-on-surface-variant tabular-nums">
          {valueText}
        </span>
      )}
    </div>
  );
}
