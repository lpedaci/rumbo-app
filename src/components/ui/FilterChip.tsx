import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { interactive } from './Button';
import { Icon } from './Icon';

export interface FilterChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  selected: boolean;
  /** Optional count shown after the label, for example "Vencidas 3". */
  count?: number;
}

/** M3 filter chip: a toggle (aria-pressed). Selected chips show a check, not only color. */
export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(function FilterChip(
  { label, selected, count, className, type, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      aria-pressed={selected}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-sm border px-3 text-label-large whitespace-nowrap',
        interactive,
        selected
          ? 'border-transparent bg-secondary-container pl-2 text-on-secondary-container'
          : 'border-outline text-on-surface-variant',
        className,
      )}
      {...props}
    >
      {selected && <Icon name="check" size={18} />}
      {label}
      {count !== undefined && <span className="tabular-nums">{count}</span>}
    </button>
  );
});
