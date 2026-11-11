import { motion } from 'motion/react';
import { useId } from 'react';
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
        // Mobile: compact row (icon left, data right) so the card has no empty space.
        // From 768 px: the vertical KPI layout of the references.
        'flex min-w-0 gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4',
        'md:col-span-3 md:flex-col md:p-(--space-card-padding)',
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
      <div className="flex shrink-0 items-start justify-between gap-3">
        <IconTile icon={icon} tone={iconTone} />
        {series && <Sparkline values={series} tone={seriesTone} className="hidden md:block" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <Heading id={titleId} className="min-w-0 truncate text-body-medium text-on-surface-variant">
            {label}
          </Heading>
          {series && <Sparkline values={series} tone={seriesTone} className="h-6 w-16 md:hidden" />}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-display-small text-on-surface tabular-nums">{value}</p>
          {trend && <StatusPill tone={trend.tone} icon={trend.icon} label={trend.label} />}
        </div>
        {caption && <p className="text-body-small text-on-surface-variant">{caption}</p>}
      </div>
    </motion.section>
  );
}
