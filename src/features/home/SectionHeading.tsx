import { forwardRef, type ReactNode } from 'react';

interface SectionHeadingProps {
  id: string;
  /** Short plain-text label above the title, in the brand color (no pill, no ornaments). */
  eyebrow: string;
  title: string;
  /** Key words of the title, shown in `primary` (D-74). Must be part of `title`. */
  highlight?: string;
  subtitle?: string;
}

/** Splits `title` so `highlight` is shown in the brand color; the text read stays the same. */
export function withHighlight(title: string, highlight?: string, className = 'text-primary'): ReactNode {
  if (!highlight || !title.includes(highlight)) return title;
  const [before, after] = title.split(highlight, 2);
  return (
    <>
      {before}
      <span className={className}>{highlight}</span>
      {after}
    </>
  );
}

/**
 * Section heading of G0 (D-73, D-74): centered, with a small plain label in `primary`, the
 * h2 with its key words in color and one line of context. The title uses up to 56 rem and
 * balances its lines at every width. The h2 receives focus on in-page jumps.
 */
export const SectionHeading = forwardRef<HTMLHeadingElement, SectionHeadingProps>(function SectionHeading(
  { id, eyebrow, title, highlight, subtitle },
  ref,
) {
  return (
    <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col items-center gap-3 text-center">
      <p className="text-label-large text-primary">{eyebrow}</p>
      <h2
        id={id}
        ref={ref}
        tabIndex={-1}
        className="scroll-mt-28 text-headline-small text-balance text-on-surface outline-none md:text-display-small lg:text-display-medium"
      >
        {withHighlight(title, highlight)}
      </h2>
      {subtitle && <p className="max-w-2xl text-body-large text-pretty text-on-surface-variant">{subtitle}</p>}
    </div>
  );
});
