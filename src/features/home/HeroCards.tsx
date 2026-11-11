import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/ui/Avatar';
import { IconTile } from '@/components/ui/IconTile';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatNumber, formatPercent } from '@/lib/dates';
import { progressOf } from '@/lib/journey';
import { alerts, kpis, overdueByOwner } from '@/lib/metrics';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { startedJourneys, weeklyCompletions } from './ProductPreview';

const CARD =
  'flex min-w-0 flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 shadow-elevation-1';

/**
 * Floating product cards around the G0 hero (D-73, reference): small real pieces of Rumbo
 * with the demo data. From 1280 px they float on both sides of the centered text; below,
 * they sit in a grid under it. Decorative: the page explains the same in text.
 */
export function HeroCards() {
  const { t } = useTranslation();
  const hires = useDataStore((s) => s.hires);
  const people = useDataStore((s) => s.people);
  const k = kpis(hires);
  const weekly = weeklyCompletions(hires);
  const started = startedJourneys(hires);
  const sofia = hires.find((h) => h.personId === 'p-sofia');
  const sofiaPerson = people.find((p) => p.id === 'p-sofia');
  const progress = sofia ? progressOf(sofia.tasks) : { done: 0, total: 0, percent: 0 };
  const max = Math.max(...weekly, 1);
  // Two more panels with the business idea (D-92): an escalated check-in and where journeys get stuck.
  const escalated = alerts(hires).find((a) => a.kind === 'checkin_escalated');
  const escalatedHire = escalated && hires.find((h) => h.id === escalated.hireId);
  const escalatedPerson = escalatedHire && people.find((p) => p.id === escalatedHire.personId);
  const owners = Object.entries(overdueByOwner(hires))
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const ownersMax = Math.max(...owners.map(([, n]) => n), 1);
  const reduce = useShouldReduceMotion();
  // Cards come in after the hero text, one by one (D-74).
  const enter = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduce ? duration.short : duration.long * 1.5,
      ease: easing.emphasizedDecelerate,
      delay: 0.3 + i * 0.05,
    },
  });

  return (
    <div
      aria-hidden
      className="mt-12 hidden w-full grid-cols-2 gap-3 sm:grid xl:pointer-events-none xl:absolute xl:inset-0 xl:mt-0 xl:block"
    >
      {/* Top left: tasks on time with its trend */}
      <motion.div {...enter(0)} className={cn(CARD, 'xl:absolute xl:top-4 xl:left-0 xl:w-60 xl:-rotate-0')}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-label-medium text-on-surface-variant">{t('home.showcase.preview.onTime')}</span>
          <IconTile icon="task_alt" size="sm" />
        </div>
        <span className="text-headline-small text-on-surface tabular-nums">{formatPercent(k.onTimeRate)}</span>
        <Sparkline values={[52, 58, 55, 63, 61, 70, 68, Math.round(k.onTimeRate)]} className="h-10 w-full" />
      </motion.div>

      {/* Top right: tasks completed per week, as bars */}
      <motion.div {...enter(1)} className={cn(CARD, 'xl:absolute xl:top-0 xl:right-0 xl:w-64')}>
        <span className="text-label-medium text-on-surface-variant">{t('home.preview.chartTitle')}</span>
        <div className="flex h-20 items-end gap-1.5">
          {weekly.map((v, i) => (
            <span
              key={i}
              className={cn('flex-1 rounded-t-sm', i === weekly.length - 1 ? 'bg-tertiary' : 'bg-primary/70')}
              style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
            />
          ))}
        </div>
      </motion.div>

      {/* Middle left: an escalated check-in that needs HR */}
      {escalatedPerson && (
        <motion.div {...enter(4)} className={cn(CARD, 'xl:absolute xl:top-[41%] xl:-left-4 xl:w-64')}>
          <div className="flex items-center gap-2">
            <IconTile icon="warning" size="sm" tone="error" />
            <span className="text-label-medium text-on-surface-variant">{t('home.heroCards.alert')}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Avatar name={escalatedPerson.name} role={escalatedPerson.role} size="sm" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-label-large text-on-surface">{escalatedPerson.name}</span>
              <span className="truncate text-body-small text-on-surface-variant">{t('home.heroCards.escalated')}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Middle right: where journeys get stuck */}
      {owners.length > 0 && (
        <motion.div {...enter(5)} className={cn(CARD, 'xl:absolute xl:top-[38%] xl:-right-4 xl:w-60')}>
          <span className="text-label-medium text-on-surface-variant">{t('home.heroCards.stuck')}</span>
          <ul className="flex flex-col gap-2">
            {owners.map(([owner, n], i) => (
              <li
                key={owner}
                className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-body-small text-on-surface"
              >
                <span className="truncate">{t(`owners.${owner}`)}</span>
                <span className="h-2 overflow-hidden rounded-full bg-surface-container-high">
                  <span
                    className={cn('block h-full rounded-full', i === 0 ? 'bg-tertiary' : 'bg-primary')}
                    style={{ width: `${(n / ownersMax) * 100}%` }}
                  />
                </span>
                <span className="tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Bottom left: active hires */}
      <motion.div {...enter(2)} className={cn(CARD, 'xl:absolute xl:bottom-6 xl:left-10 xl:w-56')}>
        <div className="flex items-center gap-3">
          <IconTile icon="group" size="sm" tone="tertiary" />
          <span className="text-label-medium text-on-surface-variant">{t('home.preview.kpiActive')}</span>
        </div>
        <div className="flex items-end justify-between gap-2">
          <span className="text-headline-small text-on-surface tabular-nums">{formatNumber(k.activeHires)}</span>
          <Sparkline values={started} tone="tertiary" className="h-8 w-20" />
        </div>
      </motion.div>

      {/* Bottom right: Sofía's journey */}
      <motion.div {...enter(3)} className={cn(CARD, 'xl:absolute xl:right-8 xl:bottom-0 xl:w-64')}>
        <div className="flex min-w-0 items-center gap-3">
          {sofiaPerson && <Avatar name={sofiaPerson.name} role={sofiaPerson.role} size="sm" />}
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label-large text-on-surface">{sofiaPerson?.name}</span>
            <span className="truncate text-body-small text-on-surface-variant tabular-nums">
              {t('journey.progress.tasksDone', { done: progress.done, total: progress.total })}
            </span>
          </div>
        </div>
        <span className="h-2 overflow-hidden rounded-full bg-outline-variant">
          <span className="block h-full bg-primary" style={{ width: `${progress.percent}%` }} />
        </span>
      </motion.div>
    </div>
  );
}
