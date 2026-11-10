import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  /** Optional line under the label. */
  description?: string;
}

/**
 * Native checkbox (keyboard and screen readers work out of the box), styled with tokens.
 * The whole row is the click target: at least 48 px tall on mobile.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, description, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <div className={cn('flex min-h-12 items-start gap-3 py-2 md:min-h-0 md:py-1', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        aria-describedby={descriptionId}
        className="mt-0.5 size-5 shrink-0 cursor-pointer rounded-xs accent-primary"
        {...props}
      />
      <div className="flex min-w-0 flex-col">
        <label htmlFor={inputId} className="cursor-pointer text-body-medium text-on-surface">
          {label}
        </label>
        {description && (
          <span id={descriptionId} className="text-body-small text-on-surface-variant">
            {description}
          </span>
        )}
      </div>
    </div>
  );
});
