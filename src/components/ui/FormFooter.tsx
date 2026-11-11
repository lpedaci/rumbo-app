import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface FormFooterProps {
  /** Buttons: the secondary one first, the main one last (it ends on the right, 2.1.3). */
  children: ReactNode;
  /** Short note on the left, for example who will see what is sent. */
  note?: ReactNode;
  noteIcon?: IconName;
}

/**
 * Action bar anchored to the bottom of the form card (D-85), so the buttons belong to the
 * form instead of floating under it: a divider and a white strip that bleeds to the card
 * edges (white, not tinted, so it never blends with the gray page; D-86) and, optionally,
 * a note on the left. On mobile the buttons go full width with the
 * main one on top (2.1.3).
 */
export function FormFooter({ children, note, noteIcon = 'info' }: FormFooterProps) {
  return (
    <div className="-mx-(--space-card-padding) mt-2 -mb-(--space-card-padding) flex flex-col gap-4 rounded-b-xl border-t border-outline-variant bg-surface-container-lowest px-(--space-card-padding) py-4 sm:flex-row sm:items-center sm:justify-between">
      {note ? (
        <p className="flex min-w-0 items-start gap-1.5 text-body-small text-on-surface-variant">
          <Icon name={noteIcon} size={16} className="mt-px shrink-0" />
          <span className="min-w-0">{note}</span>
        </p>
      ) : (
        <span aria-hidden className="hidden sm:block" />
      )}
      <div className="flex shrink-0 flex-col-reverse gap-3 sm:flex-row sm:justify-end">{children}</div>
    </div>
  );
}
