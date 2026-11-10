import { ToggleGroup } from 'radix-ui';
import { cn } from '@/lib/utils';
import { interactive } from './Button';
import { Icon } from './Icon';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedButtonProps<T extends string> {
  /** Accessible name of the group, for example "Ver avance por". */
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
}

/**
 * M3 segmented button for mutually exclusive options (2.1.3).
 * Keyboard: arrow keys move between options (Radix ToggleGroup, single selection).
 */
export function SegmentedButton<T extends string>({
  label,
  options,
  value,
  onValueChange,
  className,
}: SegmentedButtonProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      aria-label={label}
      value={value}
      onValueChange={(next) => {
        // Radix allows deselecting; a segmented button always keeps one option.
        if (next) onValueChange(next as T);
      }}
      className={cn('inline-flex w-fit max-w-full self-start rounded-sm border border-outline', className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            className={cn(
              'inline-flex h-10 min-w-0 items-center justify-center gap-1.5 border-l border-outline px-3 text-label-large whitespace-nowrap first:rounded-l-[7px] first:border-l-0 last:rounded-r-[7px] md:h-8',
              interactive,
              selected ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface',
            )}
          >
            {selected && <Icon name="check" size={18} />}
            <span className="truncate">{option.label}</span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}
