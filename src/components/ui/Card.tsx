import { type ReactNode, useId } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headingLevel?: 'h2' | 'h3';
}

/** Plain content card (no shadow, subtle border, CLAUDE.md 2.5). For non-bento pages. */
export function Card({ title, description, action, children, className, headingLevel: Heading = 'h2' }: CardProps) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={title ? titleId : undefined}
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding)',
        className,
      )}
    >
      {(title || action) && (
        <header className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <Heading id={titleId} className="text-title-medium text-on-surface">
                {title}
              </Heading>
            )}
            {description && <p className="text-body-medium text-on-surface-variant">{description}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}
