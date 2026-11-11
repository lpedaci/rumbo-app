import { DropdownMenu as Menu } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;

const itemClass = cn(
  'flex min-h-12 cursor-pointer items-center gap-3 rounded-sm px-3 text-body-medium text-on-surface outline-none select-none md:min-h-10',
  'data-highlighted:bg-surface-container-high data-disabled:cursor-not-allowed data-disabled:text-on-surface/38',
);

/** Floating menu: elevation-1, keyboard navigation and typeahead from Radix. */
export function DropdownMenuContent({
  children,
  align = 'end',
  className,
  label,
}: {
  children: ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  label?: string;
}) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={6}
        collisionPadding={8}
        aria-label={label}
        className={cn(
          'z-50 max-h-[calc(100dvh-5rem)] min-w-60 overflow-y-auto rounded-md border border-outline-variant bg-surface-container-lowest p-1 shadow-elevation-1',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          className,
        )}
      >
        {children}
      </Menu.Content>
    </Menu.Portal>
  );
}

export function DropdownMenuItem({
  icon,
  children,
  onSelect,
  destructive,
  disabled,
  description,
}: {
  icon?: IconName;
  children: ReactNode;
  onSelect?: (event: Event) => void;
  destructive?: boolean;
  /** Unavailable items stay in the menu and say why in `description` (2.1.3). */
  disabled?: boolean;
  description?: string;
}) {
  return (
    <Menu.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(itemClass, destructive && !disabled && 'text-error')}
    >
      {icon && (
        <Icon
          name={icon}
          size={20}
          className={disabled ? 'text-on-surface/38' : destructive ? 'text-error' : 'text-on-surface-variant'}
        />
      )}
      <span className="flex min-w-0 flex-1 flex-col py-1">
        <span className="truncate">{children}</span>
        {description && (
          // Full contrast even when disabled: it is the explanation (2.1.3).
          <span className="text-body-small whitespace-normal text-on-surface-variant">{description}</span>
        )}
      </span>
    </Menu.Item>
  );
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return <Menu.Label className="px-3 pt-2 pb-1 text-label-medium text-on-surface-variant">{children}</Menu.Label>;
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="my-1 h-px bg-outline-variant" />;
}

export const DropdownMenuRadioGroup = Menu.RadioGroup;

/** Radio item: the selected option shows a check and a filled icon, not only color. */
export function DropdownMenuRadioItem({
  value,
  icon,
  children,
  description,
}: {
  value: string;
  icon?: IconName;
  children: ReactNode;
  description?: string;
}) {
  return (
    <Menu.RadioItem value={value} className={cn(itemClass, 'data-[state=checked]:text-primary')}>
      {icon && <Icon name={icon} size={20} className="text-on-surface-variant" />}
      <span className="flex min-w-0 flex-1 flex-col py-1">
        <span className="truncate">{children}</span>
        {description && <span className="truncate text-body-small text-on-surface-variant">{description}</span>}
      </span>
      <Menu.ItemIndicator>
        <Icon name="check" size={20} />
      </Menu.ItemIndicator>
    </Menu.RadioItem>
  );
}
