import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'motion/react';
import { type ReactNode, useId } from 'react';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';

const bentoCardVariants = cva(
  // Cards are separated by surface and a subtle border, never by a shadow (2.5).
  'flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding)',
  {
    variants: {
      size: {
        sm: 'md:col-span-3 xl:col-span-3', // KPI
        md: 'md:col-span-3 xl:col-span-4',
        lg: 'md:col-span-6 xl:col-span-8', // main chart
        wide: 'md:col-span-6 xl:col-span-12', // tables, full-width blocks
        tall: 'md:col-span-3 md:row-span-2 xl:col-span-4', // alerts
      },
    },
    defaultVariants: { size: 'md' },
  },
);

export interface BentoCardProps extends VariantProps<typeof bentoCardVariants> {
  title: string;
  /** Heading level that keeps the page outline without skipping levels. */
  headingLevel?: 'h2' | 'h3';
  /** Short secondary line under the title. */
  description?: string;
  /** Optional action in the top right, for example a "Ver detalle" text button. */
  action?: ReactNode;
  /** Optional IconTile before the title (2.2.1). Decorative. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Card of the bento grid: title, main content and an optional action. */
export function BentoCard({
  size,
  title,
  headingLevel: Heading = 'h2',
  description,
  action,
  icon,
  children,
  className,
}: BentoCardProps) {
  const reduce = useShouldReduceMotion();
  const titleId = useId();

  return (
    <motion.section
      aria-labelledby={titleId}
      className={cn(bentoCardVariants({ size }), className)}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: reduce ? duration.short : duration.long, ease: easing.emphasizedDecelerate },
        },
      }}
    >
      <header className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon}
          <div className="min-w-0">
            <Heading id={titleId} className="truncate text-title-medium text-on-surface">
              {title}
            </Heading>
            {description && <p className="text-body-small text-on-surface-variant">{description}</p>}
          </div>
        </div>
        {action && <div className="-my-1 shrink-0">{action}</div>}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </motion.section>
  );
}
