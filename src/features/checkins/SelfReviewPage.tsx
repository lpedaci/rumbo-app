import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ChoiceGroup } from '@/components/ui/ChoiceGroup';
import { FormFooter } from '@/components/ui/FormFooter';
import { Icon, type IconName } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { TextArea } from '@/components/ui/TextArea';
import { toast } from '@/components/ui/toast-store';
import { useOwnHire } from '@/features/journey/use-own-hire';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { findCheckin } from '@/lib/checkins';
import { formatDate } from '@/lib/dates';
import { CHECKIN_OFFSETS, checkinDueDate } from '@/lib/journey';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Mood } from '@/types/domain';

const MOOD_ICONS: Record<Mood, IconName> = {
  1: 'sentiment_very_dissatisfied',
  2: 'sentiment_dissatisfied',
  3: 'sentiment_neutral',
  4: 'sentiment_satisfied',
  5: 'sentiment_very_satisfied',
};

/**
 * N3 · Self-review (CLAUDE.md F5): how the new hire feels and a short comment, before the
 * meeting with the direct manager. Warm tone (2.9). Only the manager and HR see it. It can be
 * edited until the manager completes the check-in.
 */
export function SelfReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stage } = useParams();
  const user = useCurrentUser();
  const hire = useOwnHire();
  const people = useDataStore((s) => s.people);
  const checkin = hire ? findCheckin(hire, stage ?? '') : undefined;
  const [editing, setEditing] = useState(false);
  const [mood, setMood] = useState<string | undefined>(
    checkin?.hireSelfReview ? String(checkin.hireSelfReview.mood) : undefined,
  );
  const [comment, setComment] = useState(checkin?.hireSelfReview?.comment ?? '');
  const [submitted, setSubmitted] = useState(false);

  if (!hire || !checkin) return <AccessDeniedPage reason="not_found" />;

  const manager = people.find((p) => p.id === hire.managerId)?.name.split(' ')[0] ?? '';
  const days = CHECKIN_OFFSETS[checkin.stage];
  const sent = checkin.status === 'hire_done' && !editing;

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!mood || !user) return;
    useDataStore
      .getState()
      .submitSelfReview(hire.id, checkin.stage, { mood: Number(mood) as Mood, comment }, user.personId);
    toast.success(t('selfReview.sent'));
    setEditing(false);
    navigate('/me');
  };

  return (
    <>
      <nav aria-label={t('task.breadcrumb')} className="mb-4 md:mb-6">
        <Link
          to="/me"
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('selfReview.back')}
        </Link>
      </nav>
      <header className="mb-(--space-section) flex min-w-0 flex-col gap-3">
        <span className="inline-flex h-7 w-fit items-center gap-1.5 rounded-full bg-tertiary-container px-2.5 text-label-medium text-on-tertiary-container">
          <Icon name="event" size={16} />
          {t('selfReview.due', { date: formatDate(checkinDueDate(checkin)) })}
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-small text-balance text-on-surface">{t('selfReview.title', { days })}</h1>
          <p className="text-body-large text-pretty text-on-surface-variant">
            {t('selfReview.description', { manager })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="flex min-w-0 flex-col gap-(--space-bento-gap)">
          {checkin.status === 'completed' ? (
            <InlineAlert tone="success" title={t('selfReview.completedTitle')}>
              {t('selfReview.completedBody', {
                date: formatDate((checkin.completedAt ?? checkin.dueDate).slice(0, 10)),
              })}
            </InlineAlert>
          ) : sent ? (
            <InlineAlert
              tone="success"
              title={t('selfReview.sentTitle')}
              action={
                <Button variant="outlined" size="xs" onClick={() => setEditing(true)}>
                  {t('selfReview.edit')}
                </Button>
              }
            >
              {t('selfReview.sentBody')}
            </InlineAlert>
          ) : (
            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-(--space-bento-gap)">
              <Card>
                <div className="flex flex-col gap-6">
                  <ChoiceGroup
                    legend={t('selfReview.mood')}
                    helperText={t('selfReview.moodHelp')}
                    layout="scale"
                    value={mood}
                    onChange={setMood}
                    choices={([1, 2, 3, 4, 5] as Mood[]).map((m) => ({
                      value: String(m),
                      label: t(`selfReview.moods.${m}`),
                      icon: MOOD_ICONS[m],
                    }))}
                    error={submitted && !mood ? t('selfReview.moodRequired') : undefined}
                  />
                  <TextArea
                    label={t('selfReview.comment')}
                    helperText={t('selfReview.commentHelp')}
                    optional
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <FormFooter note={t('selfReview.privacy')} noteIcon="lock">
                  <Button asChild variant="outlined">
                    <Link to="/me">{t('managerCheckin.cancel')}</Link>
                  </Button>
                  <Button type="submit" leadingIcon="send">
                    {t('selfReview.submit')}
                  </Button>
                </FormFooter>
              </Card>
            </form>
          )}
        </div>

        <aside className="min-w-0">
          <Card title={t('selfReview.milestones')}>
            <ul className="flex flex-col gap-2">
              {checkin.milestones.map((m) => (
                <li key={m.id} className="flex items-start gap-2 text-body-medium text-on-surface">
                  <Icon name="flag" size={18} className="mt-0.5 shrink-0 text-tertiary" />
                  {m.label}
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </>
  );
}
