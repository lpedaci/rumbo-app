import { useId } from 'react';
import { cn } from '@/lib/utils';
import { interactive } from './Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from './DropdownMenu';
import { Icon } from './Icon';

export interface FilterOption {
  value: string;
  label: string;
  /** Optional count shown after the label, for example how many hires match. */
  count?: number;
}

interface FilterMenuProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  className?: string;
}

/**
 * Filter of a listing as a menu with the product's own style (D-80), instead of the native
 * select whose open list the operating system draws. A filter, not data entry, so it has no
 * supporting text. Label above the control on phones, beside it from 640 px. Radix menu:
 * keyboard, typeahead and the checked option announced as such.
 */
export function FilterMenu({ label, value, onChange, options, className }: FilterMenuProps) {
  const labelId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3', className)}>
      <span id={labelId} className="text-label-large text-on-surface">
        {label}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-labelledby={`${labelId} ${labelId}-value`}
            className={cn(
              'group flex h-12 w-full min-w-0 items-center gap-2 rounded-sm border border-outline bg-surface-container-lowest pr-2 pl-3 text-left text-body-medium text-on-surface sm:h-10 sm:w-auto sm:min-w-44',
              'data-[state=open]:border-primary data-[state=open]:outline-1 data-[state=open]:outline-primary',
              interactive,
            )}
          >
            <span id={`${labelId}-value`} className="min-w-0 flex-1 truncate">
              {current?.label}
              {current?.count !== undefined && (
                <span className="text-on-surface-variant tabular-nums"> {current.count}</span>
              )}
            </span>
            <Icon
              name="keyboard_arrow_down"
              className="shrink-0 text-on-surface-variant transition-transform duration-150 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent label={label} align="start" className="min-w-[var(--radix-dropdown-menu-trigger-width)]">
          <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
            {options.map((o) => (
              <DropdownMenuRadioItem key={o.value} value={o.value}>
                <span className="flex items-center justify-between gap-4">
                  {o.label}
                  {o.count !== undefined && <span className="text-on-surface-variant tabular-nums">{o.count}</span>}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
