import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormFooter } from '@/components/ui/FormFooter';
import { ErrorSummary, type ErrorSummaryItem } from '@/components/ui/ErrorSummary';
import { Icon } from '@/components/ui/Icon';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import milestones from '@/data/checkin-milestones.json';
import { addDays, formatDate } from '@/lib/dates';
import { createHire, nextEmployeeId, workEmailFor } from '@/lib/hires';
import { dateMask, phoneMask } from '@/lib/input-masks';
import { CHECKIN_OFFSETS, hireStatus } from '@/lib/journey';
import { useFieldError } from '@/lib/use-field-error';
import { dateField, parseDisplayDate, phoneField, requiredText } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import { HireStatusPill } from './HireStatusPill';
import { asVersion, isAssignable, latestVersion } from '@/lib/templates';

const schema = z.object({
  name: requiredText,
  jobTitle: requiredText,
  area: requiredText,
  startDate: dateField,
  managerId: requiredText,
  buddyId: z.string(),
  templateId: requiredText,
  mobile: phoneField,
});
type Values = z.infer<typeof schema>;

/**
 * A3 · New hire (CLAUDE.md F3): person, team and template. On save the journey is
 * generated from the template with real dates; a summary on the side shows the result
 * before saving. Errors appear when leaving a field and never clear what was typed (2.10).
 */
export function NewHirePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const fieldError = useFieldError();
  const people = useDataStore((s) => s.people);
  const templates = useDataStore((s) => s.templates);
  const hires = useDataStore((s) => s.hires);

  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    setFocus,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    // The focus goes to the error summary instead (2.10, RNF-043)
    shouldFocusError: false,
    defaultValues: {
      name: '',
      jobTitle: '',
      area: '',
      startDate: '',
      managerId: '',
      buddyId: '',
      templateId: '',
      mobile: '',
    },
  });
  const [name, startDate, templateId] = useWatch({ control, name: ['name', 'startDate', 'templateId'] });

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'es');
  const managers = people.filter((p) => p.role === 'manager').sort(byName);
  const buddies = people.filter((p) => p.role === 'hire').sort(byName);
  const areas = [...new Set([...people.map((p) => p.area), ...templates.map((tp) => tp.area)])].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
  const choose = { value: '', label: t('hires.form.choose') };

  // F8: only published templates can be assigned, and the journey uses the version in force.
  const assignable = templates.filter(isAssignable);
  const chosenTemplate = assignable.find((tp) => tp.id === templateId);
  const version = chosenTemplate && latestVersion(chosenTemplate);
  const template = chosenTemplate && version ? asVersion(chosenTemplate, version) : undefined;
  const start = parseDisplayDate(startDate);

  // Choosing a template fills in the job title and area when they are still empty.
  const templateField = register('templateId');
  const onTemplateChange = (id: string) => {
    const chosen = templates.find((tp) => tp.id === id);
    if (!chosen) return;
    if (!getValues('jobTitle').trim()) setValue('jobTitle', chosen.jobTitle, { shouldValidate: true });
    if (!getValues('area')) setValue('area', chosen.area, { shouldValidate: true });
  };

  const onSubmit = handleSubmit((values) => {
    const chosen = assignable.find((tp) => tp.id === values.templateId);
    const startIso = parseDisplayDate(values.startDate);
    if (!user || !chosen || !startIso) return;
    const { person, hire } = createHire(
      { ...values, startDate: startIso, buddyId: values.buddyId || undefined },
      { template: chosen, hrId: user.personId, people, hires, milestones },
    );
    useDataStore.getState().addHire(person, hire, user.personId);
    toast.success(t('hires.form.created'));
    navigate(`/admin/hires/${hire.id}`);
  });

  // Error summary above the form, in the order of the fields (2.10, RNF-043)
  const FIELD_LABELS: [keyof Values, string][] = [
    ['name', 'hires.form.name'],
    ['startDate', 'hires.form.startDate'],
    ['jobTitle', 'hires.form.jobTitle'],
    ['area', 'hires.form.area'],
    ['templateId', 'hires.form.template'],
    ['managerId', 'hires.form.manager'],
    ['buddyId', 'hires.form.buddy'],
    ['mobile', 'hires.form.mobile'],
  ];
  const problems: ErrorSummaryItem[] = FIELD_LABELS.flatMap(([field, label]) => {
    const message = fieldError(errors[field]);
    return message ? [{ key: field, label: t(label), message, focus: () => setFocus(field) }] : [];
  });

  // Summary of what will be created
  const offsets = template?.tasks.map((task) => task.offsetDays) ?? [];
  const summary =
    template && start
      ? {
          tasks: t('hires.form.summary.tasks', {
            count: template.tasks.length,
            from: formatDate(addDays(start, Math.min(...offsets))),
            to: formatDate(addDays(start, Math.max(...offsets))),
          }),
          checkins: t('hires.form.summary.checkins', {
            dates: Object.values(CHECKIN_OFFSETS)
              .map((d) => formatDate(addDays(start, d)))
              .join(', '),
          }),
          status: hireStatus({ startDate: start, checkins: [] }),
        }
      : null;

  return (
    <>
      <nav aria-label={t('hires.form.breadcrumb')} className="mb-4 md:mb-6">
        <Link
          to="/admin/hires"
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('hires.form.back')}
        </Link>
      </nav>
      <PageHeader title={t('hires.form.title')} description={t('hires.form.description')} />

      <form
        noValidate
        onSubmit={onSubmit}
        className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
      >
        <div className="flex min-w-0 flex-col gap-(--space-bento-gap)">
          {submitCount > 0 && <ErrorSummary items={problems} attempt={submitCount} />}
          <Card title={t('hires.form.person')}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <TextField
                label={t('hires.form.name')}
                helperText={t('hires.form.nameHelp')}
                autoComplete="off"
                required
                error={fieldError(errors.name)}
                {...register('name')}
              />
              <TextField
                label={t('hires.form.startDate')}
                helperText={t('hires.form.startDateHelp')}
                inputMode="numeric"
                mask={dateMask}
                required
                error={fieldError(errors.startDate)}
                {...register('startDate')}
              />
              <TextField
                label={t('hires.form.jobTitle')}
                helperText={t('hires.form.jobTitleHelp')}
                required
                error={fieldError(errors.jobTitle)}
                {...register('jobTitle')}
              />
              <Select
                label={t('hires.form.area')}
                helperText={t('hires.form.areaHelp')}
                required
                error={fieldError(errors.area)}
                options={[choose, ...areas.map((a) => ({ value: a, label: a }))]}
                {...register('area')}
              />
            </div>
          </Card>

          <Card title={t('hires.form.team')}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Select
                label={t('hires.form.template')}
                helperText={t('hires.form.templateHelp')}
                required
                error={fieldError(errors.templateId)}
                options={[
                  choose,
                  ...assignable.map((tp) => ({
                    value: tp.id,
                    label: `${tp.name} · v${latestVersion(tp)?.version}`,
                  })),
                ]}
                {...templateField}
                onChange={(e) => {
                  void templateField.onChange(e);
                  onTemplateChange(e.target.value);
                }}
              />
              <Select
                label={t('hires.form.manager')}
                helperText={t('hires.form.managerHelp')}
                required
                error={fieldError(errors.managerId)}
                options={[choose, ...managers.map((p) => ({ value: p.id, label: `${p.name} · ${p.jobTitle}` }))]}
                {...register('managerId')}
              />
              <Select
                label={t('hires.form.buddy')}
                helperText={t('hires.form.buddyHelp')}
                options={[
                  { value: '', label: t('hires.form.noBuddy') },
                  ...buddies.map((p) => ({ value: p.id, label: `${p.name} · ${p.jobTitle}` })),
                ]}
                {...register('buddyId')}
              />
              <TextField
                label={t('hires.form.mobile')}
                helperText={t('hires.form.mobileHelp')}
                type="tel"
                inputMode="tel"
                autoComplete="off"
                mask={phoneMask}
                required
                error={fieldError(errors.mobile)}
                {...register('mobile')}
              />
            </div>
            {/* Actions anchored to the form (D-85): main one on the right; full width, main on top, on mobile */}
            <FormFooter>
              <Button asChild variant="outlined">
                <Link to="/admin/hires">{t('hires.form.cancel')}</Link>
              </Button>
              <Button type="submit" leadingIcon="add" loading={isSubmitting} loadingText={t('hires.form.submitting')}>
                {t('hires.form.submit')}
              </Button>
            </FormFooter>
          </Card>
        </div>

        {/* What will be created, before saving */}
        <aside className="min-w-0">
          <Card title={t('hires.form.summary.title')} className="lg:sticky lg:top-24">
            {summary ? (
              <ul className="flex flex-col gap-4 text-body-medium text-on-surface" aria-live="polite">
                <li className="flex flex-col gap-2 rounded-md bg-surface-container p-3">
                  <span className="text-body-small text-on-surface-variant">{t('hires.form.summary.generated')}</span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-label-medium text-on-surface-variant">{t('hires.form.summary.email')}</span>
                    <span className="break-all">
                      {workEmailFor(
                        name || '',
                        people.map((p) => p.email),
                      )}
                    </span>
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="text-label-medium text-on-surface-variant">
                      {t('hires.form.summary.employeeId')}
                    </span>
                    <span className="tabular-nums">{nextEmployeeId(people)}</span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="checklist" size={20} className="mt-0.5 shrink-0 text-primary" />
                  {summary.tasks}
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="event" size={20} className="mt-0.5 shrink-0 text-tertiary" />
                  {summary.checkins}
                </li>
                <li className="flex flex-col items-start gap-1">
                  <span className="text-label-medium text-on-surface-variant">{t('hires.form.summary.status')}</span>
                  <HireStatusPill status={summary.status} />
                </li>
              </ul>
            ) : (
              <p className="text-body-medium text-on-surface-variant">{t('hires.form.summary.pick')}</p>
            )}
          </Card>
        </aside>
      </form>
    </>
  );
}
