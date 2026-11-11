import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from './Icon';

interface RefChipProps {
  /** Filled by i18next `<Trans>` with the text between the tags, for example "Lo próximo". */
  children?: ReactNode;
  icon: IconName;
  /** Id of a section on the same page: the chip scrolls there and moves the focus. */
  targetId?: string;
  /** Route of another screen. */
  to?: string;
}

const CHIP =
  'inline-flex h-6 items-center gap-1 rounded-full bg-primary-container pr-2 pl-1.5 align-middle text-label-medium whitespace-nowrap text-on-primary-container';

/**
 * Reference to another part of the product inside a sentence (D-83), for example
 * "Revísala en [Lo próximo]" or "con [Ver como]". It reads as part of the sentence and
 * looks like a chip, so the eye finds the place it names. When the place is on the same
 * page or another screen it is also a link; when it is a control elsewhere (the role
 * selector) it is a plain chip.
 */
export function RefChip({ children, icon, targetId, to }: RefChipProps) {
  const content = (
    <>
      <Icon name={icon} size={16} className="shrink-0" />
      {children}
    </>
  );
  const interactive =
    'transition-colors hover:bg-primary/20 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary';

  if (to) {
    return (
      <Link to={to} className={cn(CHIP, interactive)}>
        {content}
      </Link>
    );
  }
  if (targetId) {
    return (
      <button
        type="button"
        className={cn(CHIP, interactive)}
        onClick={() => {
          const target = document.getElementById(targetId);
          target?.scrollIntoView({ block: 'center', behavior: 'smooth' });
          target?.focus({ preventScroll: true });
        }}
      >
        {content}
      </button>
    );
  }
  return <span className={CHIP}>{content}</span>;
}
