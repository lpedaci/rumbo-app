import { Tabs } from 'radix-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import { nextEmployeeId, workEmailFor } from '@/lib/hires';
import { can } from '@/lib/permissions';
import { newId } from '@/lib/templates';
import { issuesByPath, requiredText } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import { AreasCatalog, JobTitlesCatalog } from './Catalogs';
import { PeopleList } from './PeopleList';

type Tab = 'people' | 'areas' | 'jobTitles';
const TABS: { value: Tab; icon: IconName }[] = [
  { value: 'people', icon: 'group' },
  { value: 'areas', icon: 'apartment' },
  { value: 'jobTitles', icon: 'badge' },
];

const personSchema = z.object({
  name: requiredText.pipe(z.string().max(80, 'templates.taskForm.titleMax')),
  jobTitleId: requiredText,
  jobTitle: requiredText.pipe(z.string().max(80, 'templates.taskForm.titleMax')),
  managerId: z.string(),
});

/**
 * A9 · People and catalogs (F15), for HR: the people of the company with search and filters, and
 * the catalogs of areas and jobs. Tabs as in S3 (D-90): a grid on phones, one row from 640 px.
 */
export function PeoplePage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const [tab, setTab] = useState<Tab>('people');
  const [adding, setAdding] = useState(false);

  return (
    <>
      <PageHeader
        title={t('people.title')}
        description={t('people.description')}
        actions={
          can(user, 'person:manage') ? (
            <Button leadingIcon="person_add" onClick={() => setAdding(true)}>
              {t('people.add')}
            </Button>
          ) : undefined
        }
      />
      <Tabs.Root value={tab} onValueChange={(v) => setTab(v as Tab)} className="flex flex-col gap-(--space-bento-gap)">
        <Tabs.List
          aria-label={t('people.tabsLabel')}
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap [&>*:last-child:nth-child(odd)]:col-span-2"
        >
          {TABS.map((item) => (
            <Tabs.Trigger
              key={item.value}
              value={item.value}
              className="inline-flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-sm border border-outline-variant bg-surface-container-lowest px-3 py-2 text-center text-label-large whitespace-nowrap text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-on-primary sm:min-h-10 sm:justify-start"
            >
              <Icon name={item.icon} size={20} filled={tab === item.value} />
              {t(`people.tabs.${item.value}`)}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="people" className="outline-none">
          <PeopleList />
        </Tabs.Content>
        <Tabs.Content value="areas" className="outline-none">
          <AreasCatalog />
        </Tabs.Content>
        <Tabs.Content value="jobTitles" className="outline-none">
          <JobTitlesCatalog />
        </Tabs.Content>
      </Tabs.Root>

      <Dialog open={adding} onOpenChange={setAdding}>
        {adding && <NewPersonDialog onDone={() => setAdding(false)} />}
      </Dialog>
    </>
  );
}

function NewPersonDialog({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const people = useDataStore((s) => s.people);
  const jobTitles = useDataStore((s) => s.jobTitles);
  const areas = useDataStore((s) => s.areas);
  const [form, setForm] = useState({ name: '', jobTitleId: '', jobTitle: '', managerId: '' });
  const [tried, setTried] = useState(false);
  const issues = tried ? issuesByPath(personSchema.safeParse(form)) : {};
  const error = (key: string) => (issues[key] ? t(issues[key]!, { max: 80 }) : undefined);
  const managers = people.filter((p) => p.role === 'manager' || p.role === 'admin');

  const save = () => {
    setTried(true);
    const result = personSchema.safeParse(form);
    if (!result.success) {
      // The focus goes to the first field with a problem (2.10)
      const first = ['name', 'jobTitleId', 'jobTitle'].find((k) => issuesByPath(result)[k]);
      const ids: Record<string, string> = { name: 'person-name', jobTitleId: 'person-job', jobTitle: 'person-title' };
      if (first) document.getElementById(ids[first]!)?.focus();
      return;
    }
    if (!user) return;
    const job = jobTitles.find((j) => j.id === form.jobTitleId)!;
    const area = areas.find((a) => a.id === job.areaId);
    const id = newId('p');
    useDataStore.getState().addPerson(
      {
        id,
        name: form.name.trim(),
        role: 'hire',
        jobTitle: form.jobTitle.trim(),
        jobTitleId: job.id,
        area: area?.name ?? '',
        areaId: area?.id,
        email: workEmailFor(
          form.name,
          people.map((p) => p.email),
        ),
        managerId: form.managerId || undefined,
        employeeId: nextEmployeeId(people),
        status: 'active',
      },
      user.personId,
    );
    toast.success(t('people.new.created', { name: form.name.trim() }));
    onDone();
    navigate(`/admin/people/${id}`);
  };

  return (
    <DialogContent
      title={t('people.new.title')}
      description={t('people.new.description')}
      className="max-w-xl"
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outlined">{t('ui.cancel')}</Button>
          </DialogClose>
          <Button leadingIcon="person_add" onClick={save}>
            {t('people.new.save')}
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
        <TextField
          id="person-name"
          label={t('people.fields.name')}
          required
          autoComplete="off"
          helperText={t('people.fields.nameHelp')}
          error={error('name')}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Select
          id="person-job"
          label={t('people.fields.jobTitleId')}
          required
          helperText={t('people.fields.jobTitleIdHelp')}
          error={error('jobTitleId')}
          value={form.jobTitleId}
          onChange={(event) => setForm({ ...form, jobTitleId: event.target.value })}
          options={[{ value: '', label: t('hires.form.choose') }, ...jobTitles.map((j) => ({ value: j.id, label: j.name }))]}
        />
        <TextField
          id="person-title"
          label={t('people.fields.jobTitle')}
          required
          helperText={t('people.fields.jobTitleHelp')}
          error={error('jobTitle')}
          value={form.jobTitle}
          onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
        />
        <Select
          id="person-manager"
          label={t('people.fields.managerId')}
          helperText={t('people.fields.managerIdHelp')}
          value={form.managerId}
          onChange={(event) => setForm({ ...form, managerId: event.target.value })}
          options={[{ value: '', label: t('people.fields.noManager') }, ...managers.map((m) => ({ value: m.id, label: m.name }))]}
        />
        {/* Enter in a field submits, as the buttons live outside the form (dialog actions) */}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </DialogContent>
  );
}
