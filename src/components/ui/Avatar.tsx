import { cn } from '@/lib/utils';

/** First letter of the first two words, for example "Sofía Ramírez" → "SR". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

const tones = [
  'bg-primary-container text-on-primary-container',
  'bg-tertiary-container text-on-tertiary-container',
  'bg-secondary-container text-on-secondary-container',
];

/** Initials avatar (no photos of real people, CLAUDE.md 14.1). Decorative: the name is always next to it. */
export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const tone = tones[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % tones.length];
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'sm' && 'size-8 text-label-medium',
        size === 'md' && 'size-10 text-label-large',
        size === 'lg' && 'size-12 text-title-medium',
        tone,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
