import { forwardRef, type SelectHTMLAttributes, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  /** Supporting text under the field (CLAUDE.md 2.10). */
  helperText: string;
  error?: string;
  options: SelectOption[];
}

/**
 * Native select with the same anatomy as TextField: visible label, supporting text
 * linked with aria-describedby and the error in its place. Native on purpose: it
 * works with keyboard, screen readers and the mobile picker without extra code.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helperText, error, options, id, className, required, disabled, ...props },
  ref,
) {
  const { t } = useTranslation();
  const autoId = useId();
  const selectId = id ?? autoId;
  const supportId = `${selectId}-support`;
  const invalid = Boolean(error);

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={selectId} className={cn('text-label-medium text-on-surface', disabled && 'text-on-surface/38')}>
        {label}
        {required && <span className="text-on-surface-variant"> ({t('ui.required')})</span>}
      </label>
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={supportId}
          className={cn(
            'h-12 w-full min-w-0 cursor-pointer appearance-none rounded-sm border border-outline bg-surface-container-lowest pr-10 pl-3 text-body-large text-on-surface md:h-10 md:text-body-medium',
            'transition-colors duration-150 ease-standard hover:border-on-surface',
            'focus-visible:border-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
            'aria-invalid:border-error disabled:cursor-not-allowed disabled:border-on-surface/12 disabled:text-on-surface/38',
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon
          name="keyboard_arrow_down"
          className="pointer-events-none absolute right-3 text-on-surface-variant"
        />
      </div>
      <p
        id={supportId}
        className={cn('flex items-start gap-1 text-body-small', invalid ? 'text-error' : 'text-on-surface-variant')}
      >
        {invalid && <Icon name="error" size={16} className="mt-px" />}
        <span>{invalid ? error : helperText}</span>
      </p>
    </div>
  );
});
