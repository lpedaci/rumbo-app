import { motion } from 'motion/react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { STAGES } from '@/lib/dates';
import type { Progress } from '@/lib/journey';
import { duration, easing, useShouldReduceMotion } from '@/lib/motion';
import { STAGE_RANGES } from '@/lib/templates';
import { cn } from '@/lib/utils';
import type { Stage } from '@/types/domain';

type StageState = 'done' | 'current' | 'behind' | 'upcoming';

const STATE_ICON: Record<StageState, IconName> = {
  done: 'check_circle',
  current: 'flag',
  behind: 'schedule',
  upcoming: 'radio_button_unchecked',
};

interface JourneyTimelineProps {
  byStage: Record<Stage, Progress>;
  /** Current stage and day of the journey (day 0 = start date). */
  stage: Stage;
  day: number;
}

/**
 * Journey timeline (N1): one track per stage, filled with the tasks done in it, a
 * "Hoy" marker on the current day and, under each track, its name, "7 de 7" and its
 * state with icon and text. Replaces the segmented bar, which only said "how much".
 * Accessibility (2.10): each track is a labelled progressbar, every value is written,
 * and the same data is available as a table ("Ver como tabla").
 */
export function JourneyTimeline({ byStage, stage, day }: JourneyTimelineProps) {
  const { t } = useTranslation();
  const reduce = useShouldReduceMotion();
  const [asTable, setAsTable] = useState(false);
  const tableId = useId();
  const currentIndex = day < 0 ? -1 : STAGES.indexOf(stage);

  const stateOf = (s: Stage, index: number): StageState => {
    const progress = byStage[s];
    if (progress.total > 0 && progress.done === progress.total) return 'done';
    if (index === currentIndex) return 'current';
    if (index < currentIndex) return 'behind';
    return 'upcoming';
  };

  // Position of "Hoy" inside the current stage (stages have equal width for readability).
  const { min, max } = STAGE_RANGES[stage];
  const within = Math.min(1, Math.max(0, (day - min) / (max - min + 1)));
  const todayPercent = currentIndex < 0 ? 0 : ((currentIndex + within) / STAGES.length) * 100;
  const rangeLabel = (s: Stage) => t('journey.timeline.range', STAGE_RANGES[s]);

  return (
    <div className="flex flex-col gap-3">
      {asTable ? (
        <table id={tableId} className="w-full text-left text-body-medium">
          <caption className="sr-only">{t('journey.timeline.caption')}</caption>
          <thead>
            <tr className="border-b border-outline-variant text-title-small text-on-surface-variant">
              <th scope="col" className="py-2 pr-3">{t('journey.timeline.colStage')}</th>
              <th scope="col" className="py-2 pr-3">{t('journey.timeline.colDays')}</th>
              <th scope="col" className="py-2 pr-3 text-right">{t('journey.timeline.colDone')}</th>
              <th scope="col" className="py-2">{t('journey.timeline.colState')}</th>
            </tr>
          </thead>
          <tbody>
            {STAGES.map((s, i) => (
              <tr key={s} className="border-b border-outline-variant last:border-b-0">
                <th scope="row" className="py-2 pr-3 font-medium text-on-surface">{t(`stages.${s}`)}</th>
                <td className="py-2 pr-3 text-on-surface-variant">{rangeLabel(s)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {t('journey.timeline.count', { done: byStage[s].done, total: byStage[s].total })}
                </td>
                <td className="py-2">{t(`journey.timeline.state.${stateOf(s, i)}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative pt-9">
          {/* "Hoy" marker: tertiary accent, with its text written (not color alone) */}
          {currentIndex >= 0 && (
            <div
              className="absolute top-0 flex h-12 -translate-x-1/2 flex-col items-center"
              style={{ left: `${todayPercent}%` }}
            >
              <span className="rounded-full bg-tertiary px-2 py-0.5 text-label-medium whitespace-nowrap text-on-tertiary">
                {t('journey.timeline.today', { day })}
              </span>
              <span aria-hidden className="w-0.5 flex-1 bg-tertiary" />
            </div>
          )}
          <ol className="grid grid-cols-4 gap-x-2 gap-y-1.5 sm:gap-x-1.5">
            {STAGES.map((s, i) => {
              const progress = byStage[s];
              const state = stateOf(s, i);
              return (
                <li key={s} className="flex min-w-0 flex-col gap-2">
                  <div
                    role="progressbar"
                    aria-label={t('journey.progress.stage', { stage: t(`stages.${s}`) })}
                    aria-valuemin={0}
                    aria-valuemax={progress.total}
                    aria-valuenow={progress.done}
                    aria-valuetext={t('journey.timeline.count', { done: progress.done, total: progress.total })}
                    className={cn(
                      'h-3 overflow-hidden bg-surface-container-high',
                      i === 0 && 'rounded-l-full',
                      i === STAGES.length - 1 && 'rounded-r-full',
                    )}
                  >
                    <motion.div
                      className="h-full origin-left bg-primary"
                      initial={reduce ? false : { scaleX: 0 }}
                      animate={{ scaleX: progress.total ? progress.done / progress.total : 0 }}
                      transition={{
                        duration: reduce ? 0 : duration.long,
                        ease: easing.emphasizedDecelerate,
                        delay: reduce ? 0 : i * 0.08,
                      }}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span
                      className={cn(
                        'text-label-medium text-on-surface sm:text-label-large',
                        state === 'upcoming' && 'text-on-surface-variant',
                      )}
                    >
                      {t(`stages.${s}`)}
                    </span>
                    <span className="flex flex-wrap items-center gap-1 text-body-small text-on-surface-variant">
                      <Icon
                        name={STATE_ICON[state]}
                        size={16}
                        filled={state === 'done'}
                        className={cn(
                          state === 'done' && 'text-success',
                          state === 'current' && 'text-primary',
                          state === 'behind' && 'text-warning',
                        )}
                      />
                      <span className="tabular-nums">
                        {t('journey.timeline.count', { done: progress.done, total: progress.total })}
                      </span>
                      <span className="hidden sm:inline">· {t(`journey.timeline.state.${state}`)}</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      <Button
        variant="text"
        size="xs"
        leadingIcon={asTable ? 'bar_chart' : 'table_view'}
        aria-controls={asTable ? tableId : undefined}
        onClick={() => setAsTable((v) => !v)}
        className="w-fit"
      >
        {asTable ? t('journey.timeline.viewChart') : t('journey.timeline.viewTable')}
      </Button>
    </div>
  );
}
