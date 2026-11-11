import { Popover as PopoverPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

/**
 * Floating panel anchored to its trigger (elevation-1, 2.5). Opens on click or Enter,
 * closes with Escape or a click outside, and focus returns to the trigger (Radix).
 */
export function PopoverContent({
  children,
  label,
  align = 'center',
  className,
}: {
  children: ReactNode;
  /** Accessible name of the panel. */
  label: string;
  align?: 'start' | 'center' | 'end';
  className?: string;
}) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        aria-label={label}
        align={align}
        // Focus the panel itself (read by its label), not the first button inside it.
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
        sideOffset={8}
        collisionPadding={12}
        className={cn(
          'z-50 w-72 max-w-[calc(100vw-1.5rem)] rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-elevation-1 outline-none',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}
