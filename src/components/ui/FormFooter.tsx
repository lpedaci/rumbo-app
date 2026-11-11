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
 * a note on the left. The layout follows the width of the card, not the screen (D-103): below
 * 36 rem the note goes on top and the buttons below it, full width with the main one on top
 * (2.1.3); from 36 rem, note and buttons share the row and the note takes the free space, so
 * it never gets squeezed into a column of single words.
 */
export function FormFooter({ children, note, noteIcon = 'info' }: FormFooterProps) {
  return (
    <div className="@container -mx-(--space-card-padding) mt-2 -mb-(--space-card-padding) rounded-b-xl border-t border-outline-variant bg-surface-container-lowest px-(--space-card-padding) py-4">
      <div className="flex flex-col gap-4 @xl:flex-row @xl:items-center @xl:justify-between">
        {note ? (
          <p className="flex min-w-0 flex-1 items-start gap-1.5 text-body-small text-on-surface-variant">
            <Icon name={noteIcon} size={16} className="mt-px shrink-0" />
            <span className="min-w-0">{note}</span>
          </p>
        ) : (
          <span aria-hidden className="hidden @xl:block" />
        )}
        <div className="flex shrink-0 flex-col-reverse gap-3 @xl:flex-row @xl:justify-end">{children}</div>
      </div>
    </div>
  );
}
