import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { SegmentedProgress } from '@/components/ui/SegmentedProgress';
import { StatusPill } from '@/components/ui/StatusPill';
import { duration, easing } from '@/lib/motion';
import { cn } from '@/lib/utils';

/**
 * Illustrations of the new hire welcome, built with real Rumbo components in miniature
 * (2.2.1, pattern 9; reference video original-d624f662). Decorative: the step title and
 * text say everything. Pieces appear in sequence, without bounce (2.6).
 */

/** One piece that appears after `order` steps of the stagger. Opacity only when motion is reduced. */
export function Piece({
  order,
  reduce,
  className,
  children,
}: {
  order: number;
  reduce: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: duration.long,
        ease: easing.emphasizedDecelerate,
        delay: reduce ? 0 : 0.12 + order * 0.12,
      }}
    >
      {children}
    </motion.div>
  );
}

const miniCard = 'rounded-lg border border-outline-variant bg-surface-container-lowest shadow-elevation-1';

export function JourneyIllustration({
  name,
  jobTitle,
  done,
  total,
  reduce,
}: {
  name: string;
  jobTitle: string;
  done: number;
  total: number;
  reduce: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="relative flex w-64 flex-col gap-3">
      <Piece order={0} reduce={reduce} className={cn(miniCard, 'flex flex-col gap-3 p-4')}>
        <div className="flex items-center gap-3">
          <Avatar name={name} role="hire" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-title-small text-on-surface">{name}</span>
            <span className="truncate text-body-small text-on-surface-variant">{jobTitle}</span>
          </div>
        </div>
        <SegmentedProgress
          done={done}
          total={total}
          className="h-6"
          label={t('journey.progress.overall')}
          valueText={t('journey.progress.tasksDone', { done, total })}
        />
        <span className="text-body-small text-on-surface-variant tabular-nums">
          {t('journey.progress.tasksDone', { done, total })}
        </span>
      </Piece>
      <Piece order={2} reduce={reduce} className="absolute -top-3 -right-3">
        <StatusPill tone="primary" icon="route" label={t('stages.month1')} />
      </Piece>
    </div>
  );
}

export function TasksIllustration({ reduce, done, next }: { reduce: boolean; done: string; next: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex w-64 flex-col gap-2">
      <Piece order={0} reduce={reduce} className={cn(miniCard, 'flex items-center gap-3 px-3 py-2.5')}>
        <motion.span
          className="text-success"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.medium, ease: easing.emphasizedDecelerate, delay: reduce ? 0 : 0.5 }}
        >
          <Icon name="check_circle" filled size={24} />
        </motion.span>
        <span className="min-w-0 flex-1 truncate text-body-medium text-on-surface-variant line-through">{done}</span>
      </Piece>
      <Piece order={2} reduce={reduce} className={cn(miniCard, 'flex flex-col gap-2 px-3 py-2.5')}>
        <div className="flex items-center gap-3">
          <Icon name="lock_open" size={24} className="text-primary" />
          <span className="min-w-0 flex-1 truncate text-body-medium text-on-surface">{next}</span>
        </div>
        <StatusPill tone="primary" icon="lock_open" label={t('welcome.hire.unlocked')} className="w-fit" />
      </Piece>
    </div>
  );
}

export function CheckinIllustration({
  reduce,
  date,
  manager,
}: {
  reduce: boolean;
  date: string;
  manager: string;
}) {
  const { t } = useTranslation();
  const moods = ['sentiment_dissatisfied', 'sentiment_neutral', 'sentiment_satisfied', 'sentiment_very_satisfied'] as const;
  return (
    <div className="relative flex w-64 flex-col">
      <Piece order={0} reduce={reduce} className={cn(miniCard, 'flex flex-col gap-3 p-4')}>
        <div className="flex items-center gap-3">
          <IconTile icon="event" tone="tertiary" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-title-small text-on-surface">{t('welcome.hire.checkinTitle')}</span>
            <span className="text-body-small text-on-surface-variant tabular-nums">{date}</span>
          </div>
        </div>
        <div className="flex justify-between gap-1">
          {moods.map((mood, i) => (
            <span
              key={mood}
              className={cn(
                'flex size-10 items-center justify-center rounded-full',
                i === 2 ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container text-on-surface-variant',
              )}
            >
              <Icon name={mood} size={24} filled={i === 2} />
            </span>
          ))}
        </div>
      </Piece>
      <Piece order={2} reduce={reduce} className="absolute -bottom-4 -left-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest py-1 pr-3 pl-1 shadow-elevation-1">
          <Avatar name={manager} role="manager" size="sm" />
          <span className="text-label-medium text-on-surface">{manager}</span>
        </span>
      </Piece>
    </div>
  );
}
