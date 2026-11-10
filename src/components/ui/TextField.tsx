import { type ChangeEvent, forwardRef, type InputHTMLAttributes, type ReactNode, useId } from 'react';
import { useTranslation } from 'react-i18next';
import type { InputMask } from '@/lib/input-masks';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  /**
   * Supporting text: exactly what to enter and in which format, with an example
   * (CLAUDE.md 2.10). Required by design, because every field needs one.
   */
  helperText: string;
  /** Validation message. Replaces the helper text in the same place. */
  error?: string;
  /** Marks the label with "(opcional)" when most fields in the form are required. */
  optional?: boolean;
  /** Element inside the field on the right, such as a "show password" icon button. */
  trailing?: ReactNode;
  /**
   * Filters what can be typed or pasted (see `lib/input-masks.ts`), so a date or a
   * number field never receives letters. Validity is still checked by the form schema.
   */
  mask?: InputMask;
}

/**
 * Text field with a visible, permanent label above and supporting text below,
 * linked with aria-describedby. Errors appear where the helper text was, with an
 * icon and aria-invalid. The value is never cleared on error (2.10).
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    label,
    helperText,
    error,
    optional,
    required,
    trailing,
    mask,
    id,
    className,
    disabled,
    onChange,
    maxLength,
    ...props
  },
  ref,
) {
  // Masks already cap the length. A native maxLength would cut pasted text BEFORE the
  // mask cleans it ("13 / 10 / 2026" or "246 810"), so it is ignored on masked fields.
  const nativeMaxLength = mask ? undefined : maxLength;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (mask) {
      const input = event.target;
      const masked = mask(input.value);
      if (masked !== input.value) {
        // Keep the caret where the user was typing, adjusted by the removed characters.
        const caret = Math.max(0, (input.selectionStart ?? masked.length) - (input.value.length - masked.length));
        input.value = masked;
        input.setSelectionRange(caret, caret);
      }
    }
    onChange?.(event);
  };

  const { t } = useTranslation();
  const autoId = useId();
  const inputId = id ?? autoId;
  const supportId = `${inputId}-support`;
  const invalid = Boolean(error);

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <label htmlFor={inputId} className={cn('text-label-medium text-on-surface', disabled && 'text-on-surface/38')}>
        {label}
        {required && <span className="text-on-surface-variant"> ({t('ui.required')})</span>}
        {optional && !required && <span className="text-on-surface-variant"> ({t('ui.optional')})</span>}
      </label>

      <div className="relative flex items-center">
        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={supportId}
          onChange={handleChange}
          maxLength={nativeMaxLength}
          className={cn(
            'h-12 w-full min-w-0 rounded-sm border border-outline bg-surface-container-lowest px-3 text-body-large text-on-surface md:h-10 md:text-body-medium',
            'transition-colors duration-150 ease-standard placeholder:text-on-surface-variant',
            'hover:border-on-surface focus-visible:border-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
            'aria-invalid:border-error aria-invalid:focus-visible:outline-error',
            'disabled:cursor-not-allowed disabled:border-on-surface/12 disabled:text-on-surface/38',
            trailing ? 'pr-12 md:pr-11' : '',
          )}
          {...props}
        />
        {trailing && <div className="absolute right-1 flex items-center">{trailing}</div>}
      </div>

      <p
        id={supportId}
        className={cn(
          'flex items-start gap-1 text-body-small',
          // Supporting text keeps full contrast even when the field is disabled: it explains why.
          invalid ? 'text-error' : 'text-on-surface-variant',
        )}
      >
        {invalid && <Icon name="error" size={16} className="mt-px" />}
        <span>{invalid ? error : helperText}</span>
      </p>
    </div>
  );
});
