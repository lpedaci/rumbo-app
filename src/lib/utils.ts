import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge must know the M3 type roles are font sizes. Otherwise it reads
 * `text-label-large` as a color and drops the real color class (`text-on-primary`).
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-small',
            'headline-small',
            'title-large',
            'title-medium',
            'title-small',
            'body-large',
            'body-medium',
            'body-small',
            'label-large',
            'label-medium',
            'label-small',
          ],
        },
      ],
      shadow: [{ shadow: ['elevation-1', 'elevation-2'] }],
    },
  },
});

/** Merges conditional class names and resolves Tailwind conflicts (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
