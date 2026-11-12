import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { FilterChip } from '@/components/ui/FilterChip';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { RadioGroup } from '@/components/ui/RadioGroup';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import { demoNow, formatDateTime } from '@/lib/dates';
import { dateMask } from '@/lib/input-masks';
import { isEffective, leaverTasks, moverTasks, nextLifecycleId } from '@/lib/lifecycle';
import { DEMO_PERSON_IDS, itMinimumBlock } from '@/lib/people';
import { parseDisplayDate } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { AccessTask, LeaverType, LifecycleEvent, LifecycleType } from '@/types/domain';
import { AccessTaskList, EventSummary } from './LifecycleBits';

type Filter = 'all' | LifecycleType;
const FILTERS: Filter[] = ['all', 'joiner', 'mover', 'leaver'];
const LEAVER_TYPES: LeaverType[] = ['resignation', 'dismissal', 'end_of_contract'];

/**
 * A11 · Joiners, movers and leavers (F12), for HR: every move with its access progress, filtered
 * by type, and the forms to register a job change or a leaver. Joiners come from the new hire
 * form (A3). The detail shows each access and who did it.
 */
export function LifecyclePage() {
  const { t } = useTranslation();
  const events = useDataStore((s) => s.lifecycle);
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<LifecycleEvent | null>(null);
  const [form, setForm] = useState<'mover' | 'leaver' | null>(null);
  const shown = events
    .filter((e) => filter === 'all' || e.type === filter)
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  const count = (f: Filter) => events.filter((e) => f === 'all' || e.type === f).length;
  const label = (f: Filter) => (f === 'all' ? t('lifecycle.all') : t(`lifecycle.types.${f}`));

  return (
    <>
      <PageHeader
        title={t('lifecycle.title')}
        description={t('lifecycle.description')}
        actions={
          <>
            <Button variant="outlined" leadingIcon="swap_horiz" onClick={() => setForm('mover')}>
              {t('lifecycle.registerMover')}
            </Button>
            <Button variant="outlined" leadingIcon="logout" onClick={() => setForm('leaver')}>
              {t('lifecycle.registerLeaver')}
            </Button>
          </>
        }
      />

      <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding)">
        <h2 className="sr-only">{t('lifecycle.title')}</h2>
        {/* Filters as in the other listings (D-78, D-107) */}
        <div role="group" aria-label={t('lifecycle.typeFilter')} className="hidden flex-wrap gap-3 sm:flex">
          {FILTERS.map((f) => (
            <FilterChip
              key={f}
              label={label(f)}
              count={count(f)}
              selected={filter === f}
              onClick={() => setFilter(f)}
            />
          ))}
        </div>
        <FilterMenu
          className="sm:hidden"
          label={t('lifecycle.typeFilter')}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={FILTERS.map((f) => ({
            value: f,
            label: label(f),
            count: count(f),
          }))}
        />
        {shown.length === 0 ? (
          <p className="border-t border-outline-variant pt-4 text-body-medium text-on-surface-variant">
            {t('lifecycle.empty')}
          </p>
        ) : (
          <ul className="-mx-2 flex flex-col border-t border-outline-variant pt-1">
            {shown.map((e) => (
              <li key={e.id} className="border-b border-outline-variant last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpen(e)}
                  className="flex min-h-14 w-full min-w-0 rounded-md px-2 py-3 text-left transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <EventSummary event={e} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        {open && <EventDetail eventId={open.id} />}
      </Dialog>
      <Dialog open={form !== null} onOpenChange={(v) => !v && setForm(null)}>
        {form && <MoveForm kind={form} onDone={() => setForm(null)} />}
      </Dialog>
    </>
  );
}

function EventDetail({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const event = useDataStore((s) => s.lifecycle.find((e) => e.id === eventId));
  const people = useDataStore((s) => s.people);
  if (!event) return null;
  return (
    <DialogContent
      title={t('lifecycle.detail.title', {
        id: event.id,
        type: t(`lifecycle.types.${event.type}`),
      })}
      className="max-w-2xl"
      actions={
        <DialogClose asChild>
          <Button variant="outlined">{t('ui.close')}</Button>
        </DialogClose>
      }
    >
      <EventSummary event={event} />
      {event.detail && <p className="text-body-medium text-on-surface">{event.detail}</p>}
      <p className="text-body-small text-on-surface-variant tabular-nums">
        {t('lifecycle.detail.registeredBy', {
          date: formatDateTime(event.createdAt),
          name: people.find((p) => p.id === event.createdBy)?.name ?? '',
        })}
      </p>
      <section className="flex flex-col gap-2 border-t border-outline-variant pt-4">
        <h3 className="text-title-small text-on-surface">{t('lifecycle.detail.tasks')}</h3>
        <AccessTaskList event={event} />
      </section>
    </DialogContent>
  );
}

function MoveForm({ kind, onDone }: { kind: 'mover' | 'leaver'; onDone: () => void }) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const people = useDataStore((s) => s.people);
  const jobs = useDataStore((s) => s.jobTitles);
  const events = useDataStore((s) => s.lifecycle);
  const [personId, setPersonId] = useState('');
  const [jobId, setJobId] = useState('');
  const [date, setDate] = useState('');
  const [leaverType, setLeaverType] = useState('');
  const [detail, setDetail] = useState('');
  const [tried, setTried] = useState(false);
  const candidates = people
    // Never the demo accounts, someone already offboarded, someone with a leaver registered or
    // someone with a job change still to come (one move at a time)
    .filter(
      (p) =>
        !DEMO_PERSON_IDS.includes(p.id) &&
        p.status !== 'offboarded' &&
        !events.some((e) => e.personId === p.id && (e.type === 'leaver' || (e.type === 'mover' && !isEffective(e)))),
    )
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  const person = people.find((p) => p.id === personId);
  const fromJob = jobs.find((j) => j.id === person?.jobTitleId);
  const toJob = jobs.find((j) => j.id === jobId);
  const iso = parseDisplayDate(date);

  const errors = {
    person: !personId
      ? t('lifecycle.form.personRequired')
      : kind === 'leaver' && itMinimumBlock(people, personId, { leaves: true })
        ? t('itMinimum.leaver')
        : undefined,
    job:
      kind !== 'mover'
        ? undefined
        : !jobId
          ? t('lifecycle.form.jobRequired')
          : jobId === person?.jobTitleId
            ? t('lifecycle.form.jobSame')
            : undefined,
    date: iso ? undefined : t('lifecycle.form.dateRequired'),
    type: kind === 'leaver' && !leaverType ? t('lifecycle.form.typeRequired') : undefined,
    detail: detail.trim().length > 300 ? t('lifecycle.form.detailMax') : undefined,
  };
  const shown = (e?: string) => (tried ? e : undefined);
  const tasks: AccessTask[] = !person
    ? []
    : kind === 'leaver'
      ? leaverTasks(fromJob)
      : toJob
        ? moverTasks(fromJob, toJob)
        : [];

  const save = () => {
    setTried(true);
    const order: [keyof typeof errors, string][] = [
      ['person', 'mv-person'],
      ['job', 'mv-job'],
      ['date', 'mv-date'],
      ['type', 'mv-type'],
      ['detail', 'mv-detail'],
    ];
    const first = order.find(([k]) => errors[k]);
    if (first && user && kind === 'leaver' && personId && itMinimumBlock(people, personId, { leaves: true })) {
      // D-121: the attempt is recorded as denied in the audit log
      useDataStore.getState().logAudit({
        actorId: user.personId,
        action: 'lifecycle.leaver',
        resource: personId,
        result: 'denied',
        detail: 'it_minimum',
      });
    }
    if (first) {
      // The focus goes to the first field with a problem (2.10)
      const target =
        document.getElementById(first[1]) ?? document.querySelector<HTMLInputElement>(`[name="${first[1]}"]`);
      target?.focus();
      return;
    }
    if (!user || !iso) return;
    const id = nextLifecycleId(events);
    useDataStore.getState().registerLifecycle(
      {
        id,
        personId,
        type: kind,
        effectiveDate: iso,
        createdBy: user.personId,
        createdAt: demoNow(),
        fromJobTitleId: person?.jobTitleId,
        toJobTitleId: kind === 'mover' ? jobId : undefined,
        leaverType: kind === 'leaver' ? (leaverType as LeaverType) : undefined,
        detail: detail.trim() || undefined,
        accessTasks: tasks,
      },
      user.personId,
    );
    toast.success(t('lifecycle.form.saved', { id }));
    onDone();
  };

  const grants = tasks.filter((x) => x.action === 'grant').map((x) => x.system);
  const revokes = tasks.filter((x) => x.action === 'revoke').map((x) => x.system);

  return (
    <DialogContent
      title={kind === 'mover' ? t('lifecycle.registerMover') : t('lifecycle.registerLeaver')}
      description={kind === 'leaver' ? t('lifecycle.form.leaverNote') : undefined}
      className="max-w-xl"
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outlined">{t('ui.cancel')}</Button>
          </DialogClose>
          <Button leadingIcon={kind === 'mover' ? 'swap_horiz' : 'logout'} onClick={save}>
            {kind === 'mover' ? t('lifecycle.form.saveMover') : t('lifecycle.form.saveLeaver')}
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
        className="flex flex-col gap-5"
      >
        <Select
          id="mv-person"
          label={t('lifecycle.form.person')}
          required
          helperText={t('lifecycle.form.personHelp')}
          error={shown(errors.person)}
          value={personId}
          onChange={(event) => setPersonId(event.target.value)}
          options={[
            { value: '', label: t('hires.form.choose') },
            ...candidates.map((p) => ({
              value: p.id,
              label: `${p.name} · ${p.jobTitle}`,
            })),
          ]}
        />
        {kind === 'mover' && (
          <Select
            id="mv-job"
            label={t('lifecycle.form.newJob')}
            required
            helperText={t('lifecycle.form.newJobHelp')}
            error={shown(errors.job)}
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
            options={[
              { value: '', label: t('hires.form.choose') },
              ...jobs.map((j) => ({ value: j.id, label: j.name })),
            ]}
          />
        )}
        <TextField
          id="mv-date"
          label={t('lifecycle.form.effectiveDate')}
          required
          inputMode="numeric"
          mask={dateMask}
          helperText={t('lifecycle.form.effectiveDateHelp')}
          error={shown(errors.date)}
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        {kind === 'leaver' && (
          <RadioGroup
            name="mv-type"
            legend={t('lifecycle.form.leaverType')}
            required
            helperText={t('lifecycle.form.leaverTypeHelp')}
            error={shown(errors.type)}
            value={leaverType}
            onChange={(event) => setLeaverType(event.target.value)}
            options={LEAVER_TYPES.map((v) => ({
              value: v,
              label: t(`lifecycle.leaverTypes.${v}`),
            }))}
          />
        )}
        <TextArea
          id="mv-detail"
          label={t('lifecycle.form.detail')}
          optional
          helperText={t('lifecycle.form.detailHelp')}
          error={shown(errors.detail)}
          value={detail}
          rows={2}
          onChange={(event) => setDetail(event.target.value)}
        />
        <section className="flex flex-col gap-1.5 rounded-md bg-surface-container p-3">
          <h3 className="text-label-large text-on-surface">{t('lifecycle.form.preview')}</h3>
          {tasks.length === 0 ? (
            <p className="text-body-small text-on-surface-variant">{t('lifecycle.form.previewNone')}</p>
          ) : (
            <>
              {grants.length > 0 && (
                <p className="text-body-small text-on-surface">
                  {t('lifecycle.form.grantCount', { list: grants.join(', ') })}
                </p>
              )}
              {revokes.length > 0 && (
                <p className="text-body-small text-on-surface">
                  {t('lifecycle.form.revokeCount', {
                    list: revokes.join(', '),
                  })}
                </p>
              )}
            </>
          )}
        </section>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </DialogContent>
  );
}
