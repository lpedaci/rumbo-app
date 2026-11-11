import { forwardRef, type TextareaHTMLAttributes, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Icon } from './Icon';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  /** What to write, with an example (CLAUDE.md 2.10). */
  helperText: string;
  error?: string;
  optional?: boolean;
}

/** Multi-line field with the same label, helper text and error pattern as TextField. */
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, helperText, error, optional, required, id, className, rows = 3, ...props },
  ref,
) {
  const { t } = useTranslation();
  const autoId = useId();
  const fieldId = id ?? autoId;
  const supportId = `${fieldId}-support`;
  const invalid = Boolean(error);

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <label htmlFor={fieldId} className="text-label-medium text-on-surface">
        {label}
        {required && <span className="text-on-surface-variant"> ({t('ui.required')})</span>}
        {optional && !required && <span className="text-on-surface-variant"> ({t('ui.optional')})</span>}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={invalid || undefined}
        aria-describedby={supportId}
        className={cn(
          'w-full min-w-0 resize-y rounded-sm border border-outline bg-surface-container-lowest px-3 py-2.5 text-body-large text-on-surface md:text-body-medium',
          'transition-colors duration-150 ease-standard placeholder:text-on-surface-variant hover:border-on-surface',
          'focus-visible:border-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
          'aria-invalid:border-error aria-invalid:focus-visible:outline-error',
        )}
        {...props}
      />
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
