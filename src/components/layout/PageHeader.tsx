import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Main action of the page (one filled button at most, 2.1.3). */
  actions?: ReactNode;
  /** Small line above the title, for example a greeting or breadcrumbs. */
  eyebrow?: ReactNode;
}

/** Page title zone: the single h1 of the screen (CLAUDE.md 2.10). */
export function PageHeader({ title, description, actions, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-(--space-section) flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {eyebrow && <div className="text-body-medium text-on-surface-variant">{eyebrow}</div>}
        <h1 className="text-headline-small text-balance text-on-surface">{title}</h1>
        {/* Uses the container width (D-78): no forced line breaks with empty space beside them. */}
        {description && <p className="text-body-large text-pretty text-on-surface-variant">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
