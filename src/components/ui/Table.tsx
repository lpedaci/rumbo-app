import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface TableContainerProps {
  /** Accessible name of the scroll region, for example "Ingresos". */
  label: string;
  children: ReactNode;
  className?: string;
}

/**
 * Keeps any horizontal scroll inside the table, never on the page (2.7).
 * Focusable so keyboard users can scroll it. Listings switch to cards on mobile
 * (pattern implemented with each listing, from step 7).
 */
export function TableContainer({ label, children, className }: TableContainerProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn('w-full max-w-full overflow-x-auto rounded-md border border-outline-variant', className)}
    >
      {children}
    </div>
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-left', className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-surface-container', className)} {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-outline-variant transition-colors duration-150 last:border-b-0 [tbody_&]:hover:bg-surface-container-high',
        className,
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn('px-4 py-2.5 text-title-small whitespace-nowrap text-on-surface-variant', className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3 text-body-medium text-on-surface', className)} {...props} />;
}
