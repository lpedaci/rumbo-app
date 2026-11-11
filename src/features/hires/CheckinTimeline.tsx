import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { formatDate, relativeDue } from '@/lib/dates';
import { CHECKIN_OFFSETS, checkinDueDate } from '@/lib/journey';
import { cn } from '@/lib/utils';
import type { Checkin, Hire, MilestoneResult, Mood } from '@/types/domain';

const RESULT_ICON: Record<MilestoneResult, { icon: IconName; color: string }> = {
  met: { icon: 'check_circle', color: 'text-success' },
  partial: { icon: 'pending', color: 'text-warning' },
  not_met: { icon: 'error', color: 'text-error' },
};
const MOOD_ICON: Record<Mood, IconName> = {
  1: 'sentiment_very_dissatisfied',
  2: 'sentiment_dissatisfied',
  3: 'sentiment_neutral',
  4: 'sentiment_satisfied',
  5: 'sentiment_very_satisfied',
};

interface CheckinTimelineProps {
  hire: Hire;
  /** HR and the direct manager see the self-review (least privilege, F0). */
  canSeeSelfReview: boolean;
  /** The direct manager runs the check-in (J3). */
  canRun: boolean;
}

/**
 * Check-ins 30/60/90 of a hire record (A4, J2; D-85) as a timeline organized by what each
 * role needs: the next check-in stands out with the state of the self-review and the action;
 * the ones already done show a one-line result (milestones met, escalation) with the detail
 * folded; the ones further ahead show only their date.
 */
export function CheckinTimeline({ hire, canSeeSelfReview, canRun }: CheckinTimelineProps) {
  const nextIndex = hire.checkins.findIndex((c) => c.status !== 'completed');

  return (
    <ol className="flex flex-col">
      {hire.checkins.map((checkin, i) => {
        const state = checkin.status === 'completed' ? 'done' : i === nextIndex ? 'next' : 'later';
        const last = i === hire.checkins.length - 1;
        return (
          <li key={checkin.id} className="relative flex min-w-0 gap-3">
            {/* Marker and connector */}
            <div className="flex w-8 shrink-0 flex-col items-center">
              <Marker state={state} />
              {!last && <span aria-hidden className="w-0.5 flex-1 bg-outline-variant" />}
            </div>
            <div className={cn('flex min-w-0 flex-1 flex-col gap-2', !last && 'pb-5')}>
              {state === 'done' && <DoneCheckin checkin={checkin} canSeeSelfReview={canSeeSelfReview} />}
              {state === 'next' && (
                <NextCheckin hire={hire} checkin={checkin} canSeeSelfReview={canSeeSelfReview} canRun={canRun} />
              )}
              {state === 'later' && <LaterCheckin checkin={checkin} />}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Marker({ state }: { state: 'done' | 'next' | 'later' }) {
  const style = {
    done: { icon: 'check_circle' as const, cls: 'bg-success-container text-success' },
    next: { icon: 'event' as const, cls: 'bg-primary text-on-primary' },
    later: { icon: 'schedule' as const, cls: 'bg-surface-container text-on-surface-variant' },
  }[state];
  return (
    <span aria-hidden className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', style.cls)}>
      <Icon name={style.icon} size={18} />
    </span>
  );
}

function Heading({ checkin, meta, metaClass }: { checkin: Checkin; meta: string; metaClass?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-8 min-w-0 flex-col justify-center">
      <h3 className="text-title-small text-on-surface">
        {t('hires.detail.checkinTitle', { days: CHECKIN_OFFSETS[checkin.stage] })}
      </h3>
      <span className={cn('text-body-small text-on-surface-variant tabular-nums', metaClass)}>{meta}</span>
    </div>
  );
}

function DoneCheckin({ checkin, canSeeSelfReview }: { checkin: Checkin; canSeeSelfReview: boolean }) {
  const { t } = useTranslation();
  const rated = checkin.milestones.filter((m) => m.result);
  const count = (r: MilestoneResult) => rated.filter((m) => m.result === r).length;
  const review = canSeeSelfReview ? checkin.hireSelfReview : undefined;
  const date = (checkin.completedAt ?? checkinDueDate(checkin)).slice(0, 10);

  return (
    <>
      <Heading checkin={checkin} meta={t('hires.detail.doneOn', { date: formatDate(date) })} />
      {/* The result in one line: what the business needs to know at a glance */}
      <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-body-medium text-on-surface">
        <span className="text-label-large">
          {t('hires.detail.milestonesMet', { met: count('met'), total: checkin.milestones.length })}
        </span>
        {count('partial') > 0 && (
          <span className="inline-flex items-center gap-1 text-body-small text-on-surface-variant">
            <Icon name="pending" size={16} className="text-warning" />
            {t('hires.detail.partialCount', { count: count('partial') })}
          </span>
        )}
        {count('not_met') > 0 && (
          <span className="inline-flex items-center gap-1 text-body-small text-on-surface-variant">
            <Icon name="error" size={16} className="text-error" />
            {t('hires.detail.notMetCount', { count: count('not_met') })}
          </span>
        )}
      </p>
      <ActionNote checkin={checkin} />

      <details className="group rounded-md border border-outline-variant">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 text-label-large text-primary hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
          {t('hires.detail.viewDetail')}
          <Icon name="keyboard_arrow_down" className="shrink-0 transition-transform group-open:rotate-180" />
        </summary>
        <div className="flex flex-col gap-4 border-t border-outline-variant p-3">
          <section className="flex flex-col gap-2">
            <h4 className="text-label-medium text-on-surface-variant">{t('hires.detail.milestonesTitle')}</h4>
            <ul className="flex flex-col gap-2">
              {checkin.milestones.map((m) => (
                <li key={m.id} className="flex min-w-0 items-start gap-2 text-body-small text-on-surface">
                  {m.result ? (
                    <Icon
                      name={RESULT_ICON[m.result].icon}
                      size={16}
                      className={cn('mt-0.5 shrink-0', RESULT_ICON[m.result].color)}
                    />
                  ) : (
                    <Icon name="radio_button_unchecked" size={16} className="mt-0.5 shrink-0 text-on-surface-variant" />
                  )}
                  <span className="min-w-0">
                    {m.label}
                    <span className="text-on-surface-variant">
                      {' · '}
                      {m.result ? t(`hires.detail.results.${m.result}`) : t('hires.detail.noResult')}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          {review && <SelfReview mood={review.mood} comment={review.comment} />}
          {(checkin.managerComment || checkin.nextSteps) && (
            <section className="flex flex-col gap-1">
              {checkin.managerComment && (
                <>
                  <h4 className="text-label-medium text-on-surface-variant">{t('hires.detail.managerComment')}</h4>
                  <p className="text-body-small text-on-surface">{checkin.managerComment}</p>
                </>
              )}
              {checkin.nextSteps && (
                <>
                  <h4 className="mt-2 text-label-medium text-on-surface-variant">{t('hires.detail.nextSteps')}</h4>
                  <p className="text-body-small text-on-surface">{checkin.nextSteps}</p>
                </>
              )}
            </section>
          )}
        </div>
      </details>
    </>
  );
}

function NextCheckin({
  hire,
  checkin,
  canSeeSelfReview,
  canRun,
}: {
  hire: Hire;
  checkin: Checkin;
  canSeeSelfReview: boolean;
  canRun: boolean;
}) {
  const { t } = useTranslation();
  const due = checkinDueDate(checkin);
  const rel = relativeDue(due);
  const label = 'count' in rel ? t(`due.${rel.key}`, { count: rel.count }) : t(`due.${rel.key}`);
  const overdue = rel.key === 'yesterday' || rel.key === 'daysAgo';
  const review = checkin.hireSelfReview;

  return (
    <>
      <Heading
        checkin={checkin}
        meta={`${formatDate(due)} · ${label}`}
        metaClass={overdue ? 'text-error' : undefined}
      />
      <div className="flex flex-col gap-3 rounded-md bg-surface-container p-3">
        <p className="flex min-w-0 items-start gap-2 text-body-small text-on-surface">
          <Icon
            name={review ? 'fact_check' : 'hourglass_empty'}
            size={16}
            className={cn('mt-0.5 shrink-0', review ? 'text-success' : 'text-on-surface-variant')}
          />
          <span className="min-w-0">
            {review ? t('hires.detail.selfReviewReady') : t('hires.detail.selfReviewWaiting')}
          </span>
        </p>
        {review && canSeeSelfReview && <SelfReview mood={review.mood} comment={review.comment} compact />}
        <ActionNote checkin={checkin} />
        {canRun && (
          <Button asChild variant="tonal" size="xs" leadingIcon="fact_check" className="w-fit">
            <Link to={`/manager/hires/${hire.id}/checkin/${checkin.stage}`}>{t('hires.detail.doCheckin')}</Link>
          </Button>
        )}
      </div>
    </>
  );
}

function LaterCheckin({ checkin }: { checkin: Checkin }) {
  const { t } = useTranslation();
  return (
    <Heading checkin={checkin} meta={t('hires.detail.scheduledFor', { date: formatDate(checkinDueDate(checkin)) })} />
  );
}

/** The self-review: mood with icon and text, the comment and who can see it. */
function SelfReview({ mood, comment, compact = false }: { mood: Mood; comment: string; compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col gap-1.5">
      {!compact && <h4 className="text-label-medium text-on-surface-variant">{t('hires.detail.selfReviewTitle')}</h4>}
      <p className="flex min-w-0 items-start gap-2 text-body-small text-on-surface">
        <Icon name={MOOD_ICON[mood]} size={16} className="mt-0.5 shrink-0 text-tertiary" />
        <span className="min-w-0">
          <span className="text-label-medium">{t('hires.detail.mood', { mood })}</span>
          {comment && <span className="text-on-surface-variant">{` · “${comment}”`}</span>}
        </span>
      </p>
      <p className="flex items-center gap-1 text-body-small text-on-surface-variant">
        <Icon name="lock" size={16} className="shrink-0" />
        {t('hires.detail.selfReviewPrivate')}
      </p>
    </section>
  );
}

function ActionNote({ checkin }: { checkin: Checkin }) {
  const { t } = useTranslation();
  if (checkin.action?.type === 'escalate') {
    return (
      <p className="flex items-start gap-1.5 rounded-sm bg-error-container px-2 py-1.5 text-body-small text-on-error-container">
        <Icon name="warning" size={16} className="mt-px shrink-0 text-error" />
        {t('hires.detail.escalated', { note: checkin.action.note })}
      </p>
    );
  }
  if (checkin.action?.type === 'reschedule') {
    return (
      <p className="flex items-start gap-1.5 text-body-small text-on-surface-variant">
        <Icon name="schedule" size={16} className="mt-px shrink-0" />
        {t('hires.detail.rescheduled', { date: formatDate(checkin.action.newDate) })}
      </p>
    );
  }
  return null;
}
