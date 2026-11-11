import { forwardRef } from 'react';

interface SectionHeadingProps {
  id: string;
  /** Short plain-text label above the title, in the brand color (no pill, no ornaments). */
  eyebrow: string;
  title: string;
  subtitle?: string;
}

/**
 * Section heading of G0 (D-73, after Lourdes's reference of a well organized B2B landing):
 * centered, with a small plain label in `primary`, the h2 and one line of context. Sections
 * share the white page and are separated by space, so the hero blends into the rest.
 * The h2 receives focus on in-page jumps.
 */
export const SectionHeading = forwardRef<HTMLHeadingElement, SectionHeadingProps>(function SectionHeading(
  { id, eyebrow, title, subtitle },
  ref,
) {
  return (
    <div className="mx-auto flex w-full max-w-2xl min-w-0 flex-col items-center gap-3 text-center">
      <p className="text-label-large text-primary">{eyebrow}</p>
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
