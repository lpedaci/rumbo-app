import type { SVGProps } from 'react';
import { cn } from '@/lib/utils';
import { ICON_VIEWBOX, type IconName, iconPaths } from './icon-paths.generated';

export type { IconName };

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'name'> {
  name: IconName;
  /** 20 px in dense UI, 24 px in navigation (CLAUDE.md 2.3). 16 and 18 only inside pills and chips. */
  size?: 16 | 18 | 20 | 24;
  /** Filled glyph: only for the active navigation item and selected states. */
  filled?: boolean;
  /** Accessible name. Without it the icon is decorative and hidden from assistive tech. */
  label?: string;
}

/**
 * The only way to render icons in Rumbo: Material Symbols Rounded, weight 300,
 * outline by default and filled for active/selected states.
 */
export function Icon({ name, size = 20, filled = false, label, className, ...rest }: IconProps) {
  const glyph = iconPaths[name];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={ICON_VIEWBOX}
      width={size}
      height={size}
      fill="currentColor"
      focusable="false"
      className={cn('shrink-0', className)}
      {...a11y}
      {...rest}
    >
      <path d={filled ? glyph.fill : glyph.outline} />
    </svg>
  );
}
