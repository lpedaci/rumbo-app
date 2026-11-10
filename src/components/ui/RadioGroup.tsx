import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  legend: string;
  options: RadioOption[];
  helperText?: string;
  error?: string;
  /** Controlled mode: the selected value (omit it with React Hook Form `register`). */
  value?: string;
}

/**
 * Native radio group inside a fieldset/legend: arrow keys, labels and the group name
 * work for every assistive technology. Compatible with React Hook Form `register`.
 */
export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(function RadioGroup(
  { legend, options, helperText, error, required, className, value, ...inputProps },
  ref,
) {
  const { t } = useTranslation();
  const groupId = useId();
  const supportId = `${groupId}-support`;
  const invalid = Boolean(error);

  return (
    <fieldset
      className={cn('flex min-w-0 flex-col gap-1', className)}
      aria-describedby={helperText || error ? supportId : undefined}
      aria-invalid={invalid || undefined}
    >
      <legend className="mb-1 text-label-medium text-on-surface">
        {legend}
        {required && <span className="text-on-surface-variant"> ({t('ui.required')})</span>}
      </legend>
      <div className="flex flex-col">
        {options.map((option) => {
          const id = `${groupId}-${option.value}`;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className="flex min-h-12 cursor-pointer items-start gap-3 rounded-sm px-1 py-2 hover:bg-surface-container md:min-h-0 md:py-1.5"
            >
              <input
                ref={ref}
                id={id}
                type="radio"
                value={option.value}
                {...(value !== undefined ? { checked: option.value === value } : {})}
                className="mt-0.5 size-5 shrink-0 cursor-pointer accent-primary"
                {...inputProps}
              />
              <span className="flex min-w-0 flex-col">
                <span className="text-body-medium text-on-surface">{option.label}</span>
                {option.description && (
                  <span className="text-body-small text-on-surface-variant">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {(helperText || error) && (
        <p
          id={supportId}
          className={cn('flex items-start gap-1 text-body-small', invalid ? 'text-error' : 'text-on-surface-variant')}
        >
          {invalid && <Icon name="error" size={16} className="mt-px" />}
          <span>{invalid ? error : helperText}</span>
        </p>
      )}
    </fieldset>
  );
});
