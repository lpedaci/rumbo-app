import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { type ButtonHTMLAttributes, forwardRef, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';
import { Tooltip } from './Tooltip';

/**
 * Shared interaction classes:
 * - state layer (M3): translucent overlay in the content color on hover/press
 * - 48 px touch target on mobile, even when the button looks smaller (2.1.3)
 */
export const interactive = cn(
  'relative isolate select-none transition-colors duration-150 ease-standard',
  "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-current before:opacity-0 before:transition-opacity before:duration-150 before:content-['']",
  'hover:before:opacity-8 active:before:opacity-10',
  "max-md:after:absolute max-md:after:top-1/2 max-md:after:left-1/2 max-md:after:h-12 max-md:after:min-w-12 max-md:after:w-full max-md:after:-translate-x-1/2 max-md:after:-translate-y-1/2 max-md:after:content-['']",
);

const disabledLook =
  'disabled:cursor-not-allowed disabled:before:hidden aria-disabled:cursor-not-allowed aria-disabled:before:hidden';

export const buttonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-sm whitespace-nowrap',
    interactive,
    disabledLook,
  ),
  {
    variants: {
      variant: {
        filled: cn(
          'bg-primary text-on-primary',
          'disabled:bg-on-surface/12 disabled:text-on-surface/38 aria-disabled:bg-on-surface/12 aria-disabled:text-on-surface/38',
        ),
        tonal: cn(
          'bg-secondary-container text-on-secondary-container',
          'disabled:bg-on-surface/12 disabled:text-on-surface/38 aria-disabled:bg-on-surface/12 aria-disabled:text-on-surface/38',
        ),
        outlined: cn(
          'border border-outline bg-transparent text-primary',
          'disabled:border-on-surface/12 disabled:text-on-surface/38 aria-disabled:border-on-surface/12 aria-disabled:text-on-surface/38',
        ),
        text: cn('bg-transparent text-primary', 'disabled:text-on-surface/38 aria-disabled:text-on-surface/38'),
        danger: cn(
          'bg-error text-on-error',
          'disabled:bg-on-surface/12 disabled:text-on-surface/38 aria-disabled:bg-on-surface/12 aria-disabled:text-on-surface/38',
        ),
      },
      size: {
        xs: 'h-8 px-3 text-label-large',
        s: 'h-10 px-4 text-label-large',
        m: 'h-14 px-6 text-title-medium',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    compoundVariants: [
      { variant: 'text', size: 's', class: 'px-3' },
      { variant: 'text', size: 'xs', class: 'px-2' },
    ],
    defaultVariants: { variant: 'filled', size: 's', fullWidth: false },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element (for example a router Link) with button styles. */
  asChild?: boolean;
  leadingIcon?: IconName;
  trailingIcon?: IconName;
  /** Shows a spinner and `loadingText`, keeps the button width and blocks clicks. */
  loading?: boolean;
  loadingText?: string;
  /**
   * Why the action is not available. The button stays focusable (aria-disabled)
   * so keyboard and screen reader users can read the reason in a tooltip (2.1.3).
   */
  disabledReason?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    fullWidth,
    asChild = false,
    leadingIcon,
    trailingIcon,
    loading = false,
    loadingText,
    disabledReason,
    disabled,
    children,
    onClick,
    type,
    ...props
  },
  ref,
) {
  const { t } = useTranslation();
  const iconSize = size === 'm' ? 24 : 20;
  // A loading button keeps its color (it is busy, not unavailable): only clicks are blocked.
  const softDisabled = Boolean(disabledReason);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (softDisabled || loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const content: ReactNode = (
    <>
      {leadingIcon && <Icon name={leadingIcon} size={iconSize} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={iconSize} />}
    </>
  );

  if (asChild) {
    return (
      <Slot.Root ref={ref} className={cn(buttonVariants({ variant, size, fullWidth }), className)} {...props}>
        {children}
      </Slot.Root>
    );
  }

  const button = (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={disabled && !disabledReason}
      aria-disabled={softDisabled || undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...props}
    >
      {/* Both layers share one grid cell, so the width never changes while loading. */}
      <span className="grid place-items-center">
        <span className={cn('col-start-1 row-start-1 inline-flex items-center gap-2', loading && 'invisible')}>
          {content}
        </span>
        {loading && (
          <span className="col-start-1 row-start-1 inline-flex items-center gap-2" role="status">
            <Icon name="progress_activity" size={iconSize} className="animate-spin" />
            {loadingText ?? t('ui.loading')}
          </span>
        )}
      </span>
    </button>
  );

  return disabledReason ? <Tooltip content={disabledReason}>{button}</Tooltip> : button;
});
