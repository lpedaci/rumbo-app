import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BandTone = 'hero' | 'white';

const TONE: Record<BandTone, string> = {
  // The hero has a faint flat grid (index.css), never gradients (2.2); the rest is plain white.
  hero: 'bg-surface-container-lowest bg-texture-grid',
  white: 'bg-surface-container-lowest',
};

/**
 * Section wrapper of G0 (D-73): all sections share the white page and are separated by
 * space, as in Lourdes's reference, so the hero blends into the rest of the page.
 */
export function Band({
  tone = 'white',
  children,
  className,
}: {
  tone?: BandTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-(--space-gutter) py-16 lg:py-24', TONE[tone], className)}>
      <div className="mx-auto w-full max-w-[max(80rem,80%)] min-w-0">{children}</div>
    </div>
  );
}
