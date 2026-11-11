import { forwardRef } from 'react';

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}

/**
 * Centered section heading of G0 (D-70): small label, h2 and one line of context,
 * the pattern of current B2B product pages. The h2 can receive focus for in-page jumps.
 */
export const SectionHeading = forwardRef<HTMLHeadingElement, SectionHeadingProps>(function SectionHeading(
  { id, eyebrow, title, subtitle },
  ref,
) {
  return (
    <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col items-center gap-3 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-sm border border-outline-variant bg-surface-container-lowest px-2.5 py-1 text-label-medium text-on-surface-variant">
        <span aria-hidden className="size-1.5 rounded-full bg-primary" />
        {eyebrow}
      </span>
      <h2
        id={id}
        ref={ref}
        tabIndex={-1}
        className="scroll-mt-28 text-headline-small text-balance text-on-surface outline-none md:text-display-small"
      >
        {title}
      </h2>
      {subtitle && <p className="text-body-large text-pretty text-on-surface-variant">{subtitle}</p>}
    </div>
  );
});
