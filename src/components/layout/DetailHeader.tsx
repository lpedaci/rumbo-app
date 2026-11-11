import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import type { Role } from '@/types/domain';

interface HeaderChipProps {
  icon: IconName;
  children: ReactNode;
  /** `accent` for the fact that asks for attention (a date, a deadline), in tertiary. */
  tone?: 'accent' | 'neutral';
}

/** Fact of a detail header: icon and text in a 28 px chip (D-82, D-94). */
export function HeaderChip({ icon, children, tone = 'neutral' }: HeaderChipProps) {
  return (
    <li
      className={cn(
        'inline-flex h-7 max-w-full items-center gap-1.5 rounded-full px-2.5 text-label-medium',
        tone === 'accent'
          ? 'bg-tertiary-container text-on-tertiary-container'
          : 'border border-outline-variant bg-surface-container-lowest text-on-surface',
      )}
    >
      <Icon name={icon} size={16} className={cn('shrink-0', tone === 'neutral' && 'text-on-surface-variant')} />
      <span className="truncate">{children}</span>
    </li>
  );
}

interface DetailHeaderProps {
  /** Who the record is about: photo and name on top (J3, S2). */
  person?: { name: string; role: Role; email?: string };
  /** Chips with the key facts: `HeaderChip` items or status pills wrapped in `<li>`. */
  chips?: ReactNode;
  /** Accessible name of the chip list. */
  chipsLabel?: string;
  title: string;
  description?: ReactNode;
  /** h1 on detail screens; a lower level only when the header is shown as a specimen (design system site). */
  titleAs?: 'h1' | 'h2' | 'h3';
}

/**
 * Header of every detail screen (D-94), following the check-in header approved in D-82:
 * the person with photo and name (when there is one), the key facts as chips with icon and
 * text, then the single h1 and a line that says what this screen is for.
 */
export function DetailHeader({
  person,
  chips,
  chipsLabel,
  title,
  description,
  titleAs: Title = 'h1',
}: DetailHeaderProps) {
  const chipList = chips && (
    <ul aria-label={chipsLabel} className="flex flex-wrap items-center gap-2">
      {chips}
    </ul>
  );
  return (
    <header className="mb-(--space-section) flex min-w-0 flex-col gap-6">
      {person ? (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={person.name} role={person.role} size="lg" />
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-title-medium break-words text-on-surface">{person.name}</span>
            {chipList}
          </div>
        </div>
      ) : (
        chipList
      )}
      <div className="flex flex-col gap-1">
        <Title className="text-headline-small text-balance text-on-surface">{title}</Title>
        {description && <p className="text-body-large text-pretty text-on-surface-variant">{description}</p>}
      </div>
    </header>
  );
}
