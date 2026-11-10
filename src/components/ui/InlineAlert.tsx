import { cva } from 'class-variance-authority';
import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

const alertVariants = cva('flex min-w-0 items-start gap-3 rounded-md border px-4 py-3 text-body-medium', {
  variants: {
    tone: {
      info: 'border-info/30 bg-info-container text-on-info-container [&>svg]:text-info',
      success: 'border-success/30 bg-success-container text-on-success-container [&>svg]:text-success',
      warning: 'border-warning/30 bg-warning-container text-on-warning-container [&>svg]:text-warning',
      error: 'border-error/30 bg-error-container text-on-error-container [&>svg]:text-error',
    },
  },
});

const toneIcon: Record<AlertTone, IconName> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

export type AlertTone = 'info' | 'success' | 'warning' | 'error';

interface InlineAlertProps {
  tone: AlertTone;
  title?: string;
  children?: ReactNode;
  /** Optional action (link or button) under the text. */
  action?: ReactNode;
  /**
   * `alert` for errors that need attention now (announced immediately),
   * `status` for confirmations, `none` for static notices already on the page.
   */
  live?: 'alert' | 'status' | 'none';
  className?: string;
}

/** Message inside the page: errors, confirmations and notices. Icon + text, never color alone. */
export const InlineAlert = forwardRef<HTMLDivElement, InlineAlertProps>(function InlineAlert(
  { tone, title, children, action, live = 'none', className },
  ref,
) {
  const role = live === 'none' ? undefined : live;
  return (
    <div ref={ref} role={role} tabIndex={-1} className={cn(alertVariants({ tone }), 'focus:outline-none', className)}>
      <Icon name={toneIcon[tone]} size={20} className="mt-px" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="text-title-small">{title}</p>}
        {children && <div className="min-w-0 break-words">{children}</div>}
        {action && <div className="mt-1">{action}</div>}
      </div>
    </div>
  );
});
