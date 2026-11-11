import type { ReactNode } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

export interface GreetingFact {
  icon: IconName;
  label: string;
  /** `accent` highlights the one fact that needs attention (tertiary, 2.1.1). */
  tone?: 'neutral' | 'accent';
}

interface GreetingHeaderProps {
  /** Today's date, written out ("martes, 10 de noviembre"). */
  date: string;
  /** Greeting before the name, for example "Buenos días". */
  greeting: string;
  name: string;
  /** Key facts of the person's situation, shown as chips under the greeting. */
  facts: GreetingFact[];
  actions?: ReactNode;
}

/**
 * Home greeting of each role (2.2.1, pattern 2; D-67): today's date on top, the greeting
 * with the person's name in the brand color, and the context as chips with icon and text
 * instead of a plain sentence. It is the single h1 of the screen.
 */
export function GreetingHeader({ date, greeting, name, facts, actions }: GreetingHeaderProps) {
  return (
    <header className="mb-(--space-section) flex min-w-0 flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between md:pt-4">
      {/* More presence and air (D-82): larger greeting, clear steps between date, title and chips */}
      <div className="flex min-w-0 flex-col gap-5">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="flex items-center gap-1.5 text-label-large text-on-surface-variant first-letter:uppercase">
            <Icon name="calendar_today" size={16} className="shrink-0" />
            <span className="first-letter:uppercase">{date}</span>
          </p>
          <h1 className="text-headline-small text-balance text-on-surface md:text-display-small">
            {greeting}, <span className="text-primary">{name}</span>
          </h1>
        </div>
        {/* Compact chips on phones so they share a line; full size from 640 px (D-90) */}
        <ul className="flex flex-wrap gap-2 sm:gap-3">
          {facts.map((fact) => (
            <li
              key={fact.label}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-label-medium sm:h-8 sm:px-3 sm:text-label-large',
                fact.tone === 'accent'
                  ? 'border-transparent bg-tertiary-container text-on-tertiary-container'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface',
              )}
            >
              <Icon
                name={fact.icon}
                size={16}
                className={cn('shrink-0', fact.tone === 'accent' ? 'text-tertiary' : 'text-primary')}
              />
              {fact.label}
            </li>
          ))}
        </ul>
      </div>
      {/* Full width on phones, next to the greeting from 640 px (2.1.3) */}
      {actions && (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      )}
    </header>
  );
}
