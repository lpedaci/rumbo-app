import { motion } from 'motion/react';
import { type CSSProperties, type ReactNode, useId } from 'react';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import type { IconName } from './Icon';
import { IconTile, type IconTileProps } from './IconTile';
import { Sparkline } from './Sparkline';
import { StatusPill, type StatusTone } from './StatusPill';

export interface KpiCardProps {
  /** What is measured, for example "Avance del recorrido". It is the card heading. */
  label: string;
  /** Formatted value, for example "72 %". */
  value: string;
  icon: IconName;
  iconTone?: IconTileProps['tone'];
  /** Change or status in a pill, with icon and text (never color alone). */
  trend?: { label: string; tone: StatusTone; icon: IconName };
  /** Short line under the value, for example "13 de 18 tareas". */
  caption?: string;
  /** Mini trend line; decorative, so the caption has to say what it shows. */
  series?: number[];
  seriesTone?: 'primary' | 'tertiary';
  headingLevel?: 'h2' | 'h3';
  className?: string;
}

/**
 * KPI card of the bento grid (2.2.1, pattern 3, references 9d0f172e and ad2d9e23):
 * icon in a colored container, large number, change in a pill and a sparkline.
 * Same entry animation as BentoCard; size `sm` (3 columns).
 */
export function KpiCard({
  label,
  value,
  icon,
  iconTone = 'primary',
  trend,
  caption,
  series,
  seriesTone = 'primary',
  headingLevel: Heading = 'h2',
  className,
}: KpiCardProps) {
  const reduce = useShouldReduceMotion();
  const titleId = useId();

  return (
    <motion.section
      aria-labelledby={titleId}
      className={cn(
        // Reference ad2d9e23: icon and sparkline on top, then the label, then the number
        // with its change pill on the same line. Compact in every width (2 per row on mobile).
        '@container flex min-w-0 flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 sm:p-4 md:p-3 lg:p-4 xl:p-(--space-card-padding)',
        className,
      )}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: reduce ? duration.short : duration.long, ease: easing.emphasizedDecelerate },
        },
      }}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <IconTile icon={icon} tone={iconTone} size="sm" />
        {/* Only when the card is wide enough to read it (D-69): a squeezed chart says nothing. */}
        {series && (
          <Sparkline values={series} tone={seriesTone} className="hidden h-8 w-16 @[10.5rem]:block max-[22.5rem]:hidden! xl:w-24" />
        )}
      </div>
      {/* Data pinned to the bottom so cards of one row line up even if a label wraps. */}
      <div className="mt-auto flex min-w-0 flex-col gap-0.5">
        <Heading id={titleId} className="line-clamp-2 min-w-0 text-body-medium text-on-surface-variant">
          {label}
        </Heading>
        {/* The pill always goes under the number, so every card of a row has the same shape. */}
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <p className="text-headline-small text-on-surface tabular-nums xl:text-display-small">{value}</p>
          {/* The pill wraps instead of truncating in narrow cards (D-69). */}
          {trend && (
            <StatusPill
              tone={trend.tone}
              icon={trend.icon}
              label={trend.label}
              className="h-auto min-h-6 rounded-[0.75rem] py-0.5 [&>span]:whitespace-normal"
            />
          )}
        </div>
        {caption && <p className="text-body-small text-on-surface-variant">{caption}</p>}
      </div>
    </motion.section>
  );
}

/**
 * Row of KPI cards inside a bento grid, full width (D-68, D-69): at every width,
 * as many per row as fit with at least `minCardWidth` each, so 4 short KPIs share one line
 * on tablet and desktop, and cards with more content wrap to a second line on their own.
 */
export function KpiRow({ children, minCardWidth = '8.5rem' }: { children: ReactNode; minCardWidth?: string }) {
  return (
    <div
      className="col-span-full grid grid-cols-[repeat(auto-fit,minmax(min(100%,var(--kpi-min)),1fr))] gap-(--space-bento-gap)"
      style={{ '--kpi-min': minCardWidth } as CSSProperties}
    >
      {children}
    </div>
  );
}
