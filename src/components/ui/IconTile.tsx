import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

const iconTileVariants = cva('inline-flex shrink-0 items-center justify-center rounded-md', {
  variants: {
    tone: {
      primary: 'bg-primary-container text-on-primary-container',
      secondary: 'bg-secondary-container text-on-secondary-container',
      tertiary: 'bg-tertiary-container text-on-tertiary-container',
      // Status tones: only when the tile represents a status (2.1.1).
      success: 'bg-success-container text-on-success-container',
      warning: 'bg-warning-container text-on-warning-container',
      error: 'bg-error-container text-on-error-container',
      info: 'bg-info-container text-on-info-container',
      neutral: 'bg-surface-container text-on-surface-variant',
      brand: 'bg-primary text-on-primary',
    },
    size: {
      sm: 'size-8',
      md: 'size-10',
      lg: 'size-12',
    },
  },
  defaultVariants: { tone: 'primary', size: 'md' },
});

export interface IconTileProps extends VariantProps<typeof iconTileVariants> {
  icon: IconName;
  className?: string;
}

/** Icon inside a colored container, as in the KPI cards of the references (2.2.1, pattern 3). Decorative. */
export function IconTile({ icon, tone, size, className }: IconTileProps) {
  return (
    <span aria-hidden className={cn(iconTileVariants({ tone, size }), className)}>
      <Icon name={icon} size={size === 'lg' ? 24 : 20} />
    </span>
  );
}
