import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'primary' | 'neutral';

const pillVariants = cva(
  'inline-flex h-6 max-w-full shrink-0 items-center gap-1 rounded-full pr-2.5 pl-1.5 text-label-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        success: 'bg-success-container text-on-success-container [&_svg]:text-success',
        warning: 'bg-warning-container text-on-warning-container [&_svg]:text-warning',
        error: 'bg-error-container text-on-error-container [&_svg]:text-error',
        info: 'bg-info-container text-on-info-container [&_svg]:text-info',
        primary: 'bg-primary-container text-on-primary-container [&_svg]:text-primary',
        neutral: 'bg-surface-container-high text-on-surface-variant',
      },
    },
  },
);

export interface StatusPillProps {
  tone: StatusTone;
  /** Visible text: color is never the only signal (2.1.1). */
  label: string;
  icon: IconName;
  className?: string;
}

/**
 * Status in a pill: container color + on-container text + icon in the base color (D-21).
 */
export function StatusPill({ tone, label, icon, className }: StatusPillProps) {
  return (
    <span className={cn(pillVariants({ tone }), className)}>
      <Icon name={icon} size={16} />
      <span className="truncate">{label}</span>
    </span>
  );
}
