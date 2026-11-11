import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormFooter } from '@/components/ui/FormFooter';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { Icon, type IconName } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { findCheckin, needsAction } from '@/lib/checkins';
import { DEMO_TODAY, formatDate } from '@/lib/dates';
import { dateMask } from '@/lib/input-masks';
import { CHECKIN_OFFSETS, checkinDueDate } from '@/lib/journey';
import { can, canViewHire } from '@/lib/permissions';
import { parseDisplayDate } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { CheckinAction, MilestoneResult } from '@/types/domain';

const RESULTS: { value: MilestoneResult; icon: IconName; tone: 'success' | 'warning' | 'error' }[] = [
  { value: 'met', icon: 'check_circle', tone: 'success' },
  { value: 'partial', icon: 'pending', tone: 'warning' },
  { value: 'not_met', icon: 'error', tone: 'error' },
];

/**
 * J3 · Manager check-in (CLAUDE.md F5): milestones of the stage, comments and next steps.
 * A milestone "not met" asks for a decision: reschedule (new date) or escalate to HR,
 * which shows up as an alert on the HR dashboard. Validation on submit, then live (2.10).
 */
export function ManagerCheckinPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id, stage } = useParams();
  const user = useCurrentUser();
  const hire = useDataStore((s) => s.hires.find((h) => h.id === id));
  const people = useDataStore((s) => s.people);
  const checkin = hire ? findCheckin(hire, stage ?? '') : undefined;

  const [results, setResults] = useState<(MilestoneResult | undefined)[]>(
    () => checkin?.milestones.map((m) => m.result) ?? [],
  );
  const [comment, setComment] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [actionType, setActionType] = useState<CheckinAction['type'] | undefined>();
  const [newDate, setNewDate] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  if (!hire || !checkin || !canViewHire(user, hire) || !can(user, 'checkin:fill')) {
    return <AccessDeniedPage reason="not_found" />;
  }

  const person = people.find((p) => p.id === hire.personId);
  const name = person?.name ?? '';
  const days = CHECKIN_OFFSETS[checkin.stage];
  const backTo = `/manager/hires/${hire.id}`;
  const askAction = needsAction(results);
  const newDateIso = parseDisplayDate(newDate);

  // Errors are computed after the first submit and update live as things get fixed (2.10).
  const errors = {
    results: results.map((r) => (r ? undefined : t('managerCheckin.resultRequired'))),
    action: askAction && !actionType ? t('validation.required') : undefined,
    newDate:
      askAction && actionType === 'reschedule'
        ? !newDate.trim()
          ? t('validation.required')
          : !newDateIso
            ? t('validation.dateFormat')
            : newDateIso <= DEMO_TODAY
              ? t('managerCheckin.newDatePast')
              : undefined
        : undefined,
    note: askAction && actionType === 'escalate' && !note.trim() ? t('validation.required') : undefined,
  };
  const problems = [
    ...errors.results.flatMap((e, i) => (e ? [`${checkin.milestones[i]!.label}: ${e}`] : [])),
    ...(errors.action ? [`${t('managerCheckin.action')}: ${errors.action}`] : []),
    ...(errors.newDate ? [`${t('managerCheckin.newDate')}: ${errors.newDate}`] : []),
    ...(errors.note ? [`${t('managerCheckin.note')}: ${errors.note}`] : []),
  ];
  const show = (error?: string) => (submitted ? error : undefined);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (problems.length > 0 || !user) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    const action: CheckinAction | undefined = askAction
      ? actionType === 'reschedule'
        ? { type: 'reschedule', newDate: newDateIso! }
        : { type: 'escalate', note: note.trim() }
      : undefined;
    useDataStore
      .getState()
      .completeCheckin(
        hire.id,
        checkin.stage,
        { results: results as MilestoneResult[], managerComment: comment, nextSteps, action },
        user.personId,
      );
    toast.success(action?.type === 'escalate' ? t('managerCheckin.escalated') : t('managerCheckin.done'));
    navigate(backTo);
  };

  return (
    <>
      <nav aria-label={t('managerCheckin.breadcrumb')} className="mb-4 md:mb-6">
        <Link
          to={backTo}
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('managerCheckin.back', { name: name.split(' ')[0] })}
        </Link>
      </nav>
      {/* Who and when at a glance (D-82): photo, name and the date as chips */}
      <header className="mb-(--space-section) flex min-w-0 flex-col gap-6">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          {person && <Avatar name={person.name} role={person.role} size="lg" />}
          <div className="flex min-w-0 flex-col gap-2">
            <span className="truncate text-title-medium text-on-surface">{person?.name}</span>
            <ul className="flex flex-wrap items-center gap-2">
              <li className="inline-flex h-7 items-center gap-1.5 rounded-full bg-tertiary-container px-2.5 text-label-medium text-on-tertiary-container">
                <Icon name="event" size={16} />
                {t('managerCheckin.due', { date: formatDate(checkinDueDate(checkin)) })}
              </li>
              <li className="inline-flex h-7 items-center gap-1.5 rounded-full border border-outline-variant px-2.5 text-label-medium text-on-surface">
                <Icon name="badge" size={16} className="text-on-surface-variant" />
                {person?.jobTitle}
              </li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-small text-balance text-on-surface">{t('managerCheckin.title', { days })}</h1>
          <p className="text-body-large text-pretty text-on-surface-variant">
            {t('managerCheckin.description', { name: name.split(' ')[0] })}
          </p>
        </div>
      </header>

      {checkin.status === 'completed' ? (
        <InlineAlert tone="success">{t('managerCheckin.alreadyDone')}</InlineAlert>
      ) : (
        <form
          noValidate
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
        >
          <div className="flex min-w-0 flex-col gap-(--space-bento-gap)">
            {submitted && problems.length > 0 && (
              <div ref={summaryRef} tabIndex={-1} className="outline-none">
                <InlineAlert tone="error" title={t('managerCheckin.errors')}>
                  <ul className="list-disc pl-5">
                    {problems.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </InlineAlert>
              </div>
            )}

            <Card title={t('managerCheckin.milestones')} description={t('managerCheckin.milestonesHelp')}>
              <div className="flex flex-col gap-6">
                {checkin.milestones.map((milestone, i) => (
                  <ChoiceGroup
                    key={milestone.id}
                    legend={milestone.label}
                    value={results[i]}
                    onChange={(value) =>
                      setResults((prev) => prev.map((r, j) => (j === i ? (value as MilestoneResult) : r)))
                    }
                    choices={RESULTS.map((r) => ({ ...r, label: t(`managerCheckin.result.${r.value}`) }))}
                    error={show(errors.results[i])}
                  />
                ))}
              </div>
            </Card>

            {askAction && (
              <Card title={t('managerCheckin.notMet')} description={t('managerCheckin.notMetHelp')}>
                <div className="flex flex-col gap-6">
                  <ChoiceGroup
                    legend={t('managerCheckin.action')}
                    helperText={t('managerCheckin.actionHelp')}
                    value={actionType}
                    onChange={(value) => setActionType(value as CheckinAction['type'])}
                    choices={[
                      { value: 'reschedule', label: t('managerCheckin.reschedule'), icon: 'schedule' },
                      { value: 'escalate', label: t('managerCheckin.escalate'), icon: 'warning', tone: 'error' },
                    ]}
                    error={show(errors.action)}
                  />
                  {actionType === 'reschedule' && (
                    <TextField
                      label={t('managerCheckin.newDate')}
                      helperText={t('managerCheckin.newDateHelp')}
                      inputMode="numeric"
                      mask={dateMask}
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      error={show(errors.newDate)}
                    />
                  )}
                  {actionType === 'escalate' && (
                    <TextArea
                      label={t('managerCheckin.note')}
                      helperText={t('managerCheckin.noteHelp')}
                      required
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      error={show(errors.note)}
                    />
                  )}
                </div>
              </Card>
            )}

            <Card>
              <div className="flex flex-col gap-6">
                <TextArea
                  label={t('managerCheckin.comment')}
                  helperText={t('managerCheckin.commentHelp')}
                  optional
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <TextArea
                  label={t('managerCheckin.nextSteps')}
                  helperText={t('managerCheckin.nextStepsHelp')}
                  optional
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                />
              </div>
              <FormFooter>
                <Button asChild variant="outlined">
                  <Link to={backTo}>{t('managerCheckin.cancel')}</Link>
                </Button>
                <Button type="submit" leadingIcon="check">
                  {t('managerCheckin.submit')}
                </Button>
              </FormFooter>
            </Card>
          </div>

          {/* The hire's self-review, visible to the manager (F0, least privilege) */}
          <aside className="min-w-0">
            <Card title={t('managerCheckin.selfReview')} className="lg:sticky lg:top-24">
              {checkin.hireSelfReview ? (
                <div className="flex flex-col gap-2 text-body-medium text-on-surface">
                  <p className="text-label-large">{t('managerCheckin.mood', { mood: checkin.hireSelfReview.mood })}</p>
                  {checkin.hireSelfReview.comment && <p>{checkin.hireSelfReview.comment}</p>}
                </div>
              ) : (
                <p className="text-body-medium text-on-surface-variant">{t('managerCheckin.selfReviewMissing')}</p>
              )}
            </Card>
          </aside>
        </form>
      )}
    </>
  );
}
