import type { Role } from '@/types/domain';
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

/**
 * One container color per role, used the same way everywhere (2.2.1, pattern 6):
 * HR primary, managers tertiary, new hires secondary, IT info.
 */
export const ROLE_AVATAR_TONE: Record<Role, string> = {
  admin: 'bg-primary-container text-on-primary-container',
  manager: 'bg-tertiary-container text-on-tertiary-container',
  hire: 'bg-secondary-container text-on-secondary-container',
  it_admin: 'bg-info-container text-on-info-container',
};

/** Initials avatar (no photos of real people, 2.2). Decorative: the name is always next to it. */
export function Avatar({
  name,
  role,
  size = 'md',
  className,
}: {
  name: string;
  /** Platform role of the person: sets the container color. */
  role?: Role;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const tone = role ? ROLE_AVATAR_TONE[role] : 'bg-surface-container-high text-on-surface';
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        size === 'sm' && 'size-8 text-label-medium',
        size === 'md' && 'size-10 text-label-large',
        size === 'lg' && 'size-12 text-title-medium',
        size === 'xl' && 'size-14 text-title-large',
        tone,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
