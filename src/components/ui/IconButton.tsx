import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { interactive } from './Button';
import { Icon, type IconName } from './Icon';
import { Tooltip } from './Tooltip';

const iconButtonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center rounded-sm',
    interactive,
    'disabled:cursor-not-allowed disabled:text-on-surface/38 disabled:before:hidden',
  ),
  {
    variants: {
      variant: {
        standard: 'text-on-surface-variant',
        tonal: 'bg-secondary-container text-on-secondary-container disabled:bg-on-surface/12',
        outlined: 'border border-outline text-on-surface-variant disabled:border-on-surface/12',
      },
      size: {
        xs: 'size-8',
        s: 'size-10',
      },
      selected: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'standard', selected: true, class: 'text-primary' },
      { variant: 'outlined', selected: true, class: 'border-transparent bg-inverse-surface text-inverse-on-surface' },
    ],
    defaultVariants: { variant: 'standard', size: 's', selected: false },
  },
);

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof iconButtonVariants> {
  icon: IconName;
  /** Required: becomes the accessible name and the tooltip (CLAUDE.md 2.3). */
  label: string;
}

/** Icon-only button. Always labelled and always with a tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant, size, selected, className, type, ...props },
  ref,
) {
  return (
    <Tooltip content={label}>
      <button
        ref={ref}
        type={type ?? 'button'}
        aria-label={label}
        aria-pressed={selected ?? undefined}
        className={cn(iconButtonVariants({ variant, size, selected }), className)}
        {...props}
      >
        <Icon name={icon} size={20} filled={Boolean(selected)} />
      </button>
    </Tooltip>
  );
});
