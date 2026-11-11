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
 * Portraits of the four demo personas and Sofía's buddy (D-69, D-84), chosen by Lourdes. Files go in
 * src/assets/avatars/ named after the person (carla, martin, sofia, diego, nicolas) as .webp,
 * .jpg or .png; anyone without a file keeps their initials. See SOURCE.md there.
 */
const FILES = import.meta.glob<string>('../../assets/avatars/*.{webp,jpg,jpeg,png}', {
  eager: true,
  import: 'default',
});
const PERSONA_FILE: Record<string, string> = {
  'Carla Méndez': 'carla',
  'Martín Rossi': 'martin',
  'Sofía Ramírez': 'sofia',
  'Diego Ferreyra': 'diego',
  'Nicolás Acosta': 'nicolas',
};
function photoFor(name: string): string | undefined {
  const stem = PERSONA_FILE[name];
  if (!stem) return undefined;
  const key = Object.keys(FILES).find((path) => path.split('/').pop()?.split('.')[0] === stem);
  return key ? FILES[key] : undefined;
}

/**
 * One color per role, used the same way everywhere (2.2.1, pattern 6; D-69):
 * HR petrol, managers plum, new hires violet, IT blue. Initials sit on the container;
 * photos get a ring in the role color.
 */
export const ROLE_AVATAR_TONE: Record<Role, string> = {
  admin: 'bg-role-hr-container text-on-surface ring-role-hr',
  manager: 'bg-role-manager-container text-on-surface ring-role-manager',
  hire: 'bg-role-hire-container text-on-surface ring-role-hire',
  it_admin: 'bg-role-it-container text-on-surface ring-role-it',
};

/** Role accent for cards and chips (D-69): solid bar, tinted chip and icon color. */
export const ROLE_ACCENT: Record<Role, { bar: string; chip: string; icon: string }> = {
  admin: { bar: 'bg-role-hr', chip: 'bg-role-hr-container text-on-surface', icon: 'text-role-hr' },
  manager: { bar: 'bg-role-manager', chip: 'bg-role-manager-container text-on-surface', icon: 'text-role-manager' },
  hire: { bar: 'bg-role-hire', chip: 'bg-role-hire-container text-on-surface', icon: 'text-role-hire' },
  it_admin: { bar: 'bg-role-it', chip: 'bg-role-it-container text-on-surface', icon: 'text-role-it' },
};

/** Decorative avatar: the name is always next to it, so the image has an empty alt. */
export function Avatar({
  name,
  role,
  size = 'md',
  className,
}: {
  name: string;
  /** Platform role of the person: sets the color. */
  role?: Role;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const tone = role ? ROLE_AVATAR_TONE[role] : 'bg-surface-container-high text-on-surface ring-outline-variant';
  const photo = photoFor(name);
  const sizeClass = cn(
    size === 'sm' && 'size-8 text-label-medium',
    size === 'md' && 'size-10 text-label-large',
    size === 'lg' && 'size-12 text-title-medium',
    size === 'xl' && 'size-14 text-title-large',
  );
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        aria-hidden
        className={cn(
          'shrink-0 rounded-full object-cover ring-2 ring-offset-2 ring-offset-surface-container-lowest',
          sizeClass,
          tone,
          className,
        )}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        sizeClass,
        tone,
        'ring-0',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
