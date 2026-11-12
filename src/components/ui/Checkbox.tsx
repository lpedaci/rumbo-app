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
      {/* The box gets a 48 × 48 px touch area on mobile, like the buttons (2.1.3); this label adds no text. */}
      <label
        htmlFor={inputId}
        className="relative mt-0.5 flex shrink-0 cursor-pointer max-md:after:absolute max-md:after:top-1/2 max-md:after:left-1/2 max-md:after:size-12 max-md:after:-translate-x-1/2 max-md:after:-translate-y-1/2 max-md:after:content-['']"
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-describedby={descriptionId}
          className="size-5 cursor-pointer rounded-xs accent-primary"
          {...props}
        />
      </label>
      <div className="flex min-w-0 flex-col gap-0.5">
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
