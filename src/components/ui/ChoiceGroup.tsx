import { useId } from 'react';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

export interface Choice {
  value: string;
  label: string;
  icon?: IconName;
  /** Color of the selected tile; status tones only when the choice is a status (2.1.1). */
  tone?: 'primary' | 'success' | 'warning' | 'error';
}

interface ChoiceGroupProps {
  legend: string;
  choices: Choice[];
  value: string | undefined;
  onChange: (value: string) => void;
  helperText?: string;
  error?: string;
  /** `row` for 2 to 3 short choices, `scale` for a 1 to 5 scale such as the mood. */
  layout?: 'row' | 'scale';
  className?: string;
}

const SELECTED: Record<NonNullable<Choice['tone']>, string> = {
  primary: 'peer-checked:border-primary peer-checked:bg-primary-container peer-checked:text-on-primary-container',
  success: 'peer-checked:border-success peer-checked:bg-success-container peer-checked:text-on-success-container',
  warning: 'peer-checked:border-warning peer-checked:bg-warning-container peer-checked:text-on-warning-container',
  error: 'peer-checked:border-error peer-checked:bg-error-container peer-checked:text-on-error-container',
};

/**
 * Single choice as tiles (D-81): native radios inside a fieldset with its legend, so arrow
 * keys and screen readers work as usual; the selected tile shows a check and its icon,
 * not only color (2.1.1). Error in place of the supporting text, never while choosing.
 */
export function ChoiceGroup({
  legend,
  choices,
  value,
  onChange,
  helperText,
  error,
  layout = 'row',
  className,
}: ChoiceGroupProps) {
  const id = useId();
  const supportId = `${id}-support`;

  return (
    <fieldset
      className={cn('@container flex min-w-0 flex-col gap-2', className)}
      aria-describedby={helperText || error ? supportId : undefined}
      aria-invalid={error ? true : undefined}
    >
      <legend className="mb-2 text-label-large text-on-surface">{legend}</legend>
      <div
        className={cn(
          'grid gap-2',
          // The scale is a list when the form is narrow and 5 columns from 32rem of form width (D-85)
          layout === 'scale'
            ? 'grid-cols-1 @[32rem]:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(8rem,1fr))]',
        )}
      >
        {choices.map((choice) => {
          const inputId = `${id}-${choice.value}`;
          const checked = value === choice.value;
          return (
            <div key={choice.value} className="relative min-w-0">
              <input
                id={inputId}
                type="radio"
                name={id}
                value={choice.value}
                checked={checked}
                onChange={() => onChange(choice.value)}
                className="peer absolute inset-0 size-full cursor-pointer opacity-0"
              />
              <label
                htmlFor={inputId}
                className={cn(
                  'pointer-events-none flex min-h-12 items-center gap-2 rounded-md border border-outline bg-surface-container-lowest px-3 py-2 text-label-large text-on-surface transition-colors',
                  'peer-hover:bg-surface-container peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
                  layout === 'scale' &&
                    '@[32rem]:flex-col @[32rem]:justify-center @[32rem]:gap-1 @[32rem]:px-1 @[32rem]:text-center @[32rem]:text-label-medium',
                  error && !value && 'border-error',
                  SELECTED[choice.tone ?? 'primary'],
                )}
              >
                {choice.icon && <Icon name={choice.icon} size={layout === 'scale' ? 24 : 20} filled={checked} />}
                <span className="min-w-0 flex-1">{choice.label}</span>
                {checked && (
                  <Icon name="check" size={18} className={layout === 'scale' ? '@[32rem]:hidden' : undefined} />
                )}
              </label>
            </div>
          );
        })}
      </div>
      {(helperText || error) && (
        <p
          id={supportId}
          className={cn('flex items-start gap-1 text-body-small', error ? 'text-error' : 'text-on-surface-variant')}
        >
          {error && <Icon name="error" size={16} className="mt-px shrink-0" />}
          {error ?? helperText}
        </p>
      )}
    </fieldset>
  );
}
