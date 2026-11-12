import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog, Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import { Select } from '@/components/ui/Select';
import { TextField } from '@/components/ui/TextField';
import { toast } from '@/components/ui/toast-store';
import { can } from '@/lib/permissions';
import { isAssignable, newId } from '@/lib/templates';
import { issuesByPath } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Area, JobTitle } from '@/types/domain';

const PANEL = 'flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding)';

const nameSchema = (taken: string[]) =>
  z
    .string()
    .trim()
    .min(2, 'people.areas.nameRequired')
    .max(60, 'people.areas.nameMax')
    .refine((v) => !taken.includes(v.trim().toLowerCase()), 'people.areas.duplicate');

/** One catalog row (D-106, D-115): icon, name and counts; the actions in a menu on the right. */
function CatalogRow({
  icon,
  title,
  meta,
  menuLabel,
  editLabel,
  onEdit,
  deleteLabel,
  deleteReason,
  onDelete,
  canEdit,
}: {
  icon: 'apartment' | 'badge';
  title: string;
  meta: string;
  menuLabel: string;
  editLabel: string;
  onEdit: () => void;
  deleteLabel: string;
  deleteReason?: string;
  onDelete: () => void;
  canEdit: boolean;
}) {
  return (
    <li className="flex min-h-14 min-w-0 items-start gap-3 border-b border-outline-variant px-2 py-3 last:border-b-0">
      <IconTile icon={icon} tone="neutral" />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-title-small text-on-surface">{title}</span>
        <span className="text-body-small text-on-surface-variant">{meta}</span>
      </span>
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <IconButton icon="more_vert" size="xs" label={menuLabel} />
          </DropdownMenuTrigger>
          <DropdownMenuContent label={menuLabel}>
            <DropdownMenuItem icon="edit" onSelect={onEdit}>
              {editLabel}
            </DropdownMenuItem>
            <DropdownMenuItem
              icon="delete"
              destructive
              disabled={Boolean(deleteReason)}
              description={deleteReason}
              onSelect={onDelete}
            >
              {deleteLabel}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </li>
  );
}

/** A9 · Areas catalog (F15): add, rename (it renames on every person) and delete when unused. */
export function AreasCatalog() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const areas = useDataStore((s) => s.areas);
  const people = useDataStore((s) => s.people);
  const jobTitles = useDataStore((s) => s.jobTitles);
  const [editing, setEditing] = useState<Area | 'new' | null>(null);
  const [name, setName] = useState('');
  const [tried, setTried] = useState(false);
  const [toDelete, setToDelete] = useState<Area | null>(null);
  const canEdit = can(user, 'catalog:edit');
  const taken = areas.filter((a) => editing === 'new' || a.id !== editing?.id).map((a) => a.name.toLowerCase());
  const issue = issuesByPath(nameSchema(taken).safeParse(name))[''];

  const open = (area: Area | 'new') => {
    setEditing(area);
    setName(area === 'new' ? '' : area.name);
    setTried(false);
  };
  const save = () => {
    setTried(true);
    // The focus goes to the field with the problem (2.10)
    if (issue) return document.getElementById('area-name')?.focus();
    if (!user || !editing) return;
    useDataStore
      .getState()
      .saveArea({ id: editing === 'new' ? newId('a') : editing.id, name: name.trim() }, user.personId);
    toast.success(t('people.areas.saved'));
    setEditing(null);
  };

  return (
    <section aria-labelledby="areas-title" className={PANEL}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="areas-title" className="text-title-medium text-on-surface">
            {t('people.tabs.areas')}
          </h2>
          <p className="text-body-small text-on-surface-variant">{t('people.areas.description')}</p>
        </div>
        {canEdit && (
          <Button variant="outlined" leadingIcon="add" onClick={() => open('new')} className="w-fit shrink-0">
            {t('people.areas.add')}
          </Button>
        )}
      </div>
      <ul className="-mx-2 flex flex-col">
        {areas.map((a) => {
          const nPeople = people.filter((p) => p.areaId === a.id).length;
          const nJobs = jobTitles.filter((j) => j.areaId === a.id).length;
          return (
            <CatalogRow
              key={a.id}
              icon="apartment"
              title={a.name}
              meta={`${t('people.areas.people', { count: nPeople })} · ${t('people.areas.jobs', { count: nJobs })}`}
              menuLabel={t('people.areas.actions', { name: a.name })}
              editLabel={t('people.areas.rename')}
              onEdit={() => open(a)}
              deleteLabel={t('people.areas.delete')}
              deleteReason={nPeople || nJobs ? t('people.areas.deleteInUse') : undefined}
              onDelete={() => setToDelete(a)}
              canEdit={canEdit}
            />
          );
        })}
      </ul>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        {editing !== null && (
          <DialogContent
            title={editing === 'new' ? t('people.areas.dialogNew') : t('people.areas.dialogEdit')}
            actions={
              <>
                <DialogClose asChild>
                  <Button variant="outlined">{t('ui.cancel')}</Button>
                </DialogClose>
                <Button leadingIcon="check" onClick={save}>
                  {t('people.areas.save')}
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
            >
              <TextField
                id="area-name"
                label={t('people.areas.name')}
                required
                helperText={t('people.areas.nameHelp')}
                error={tried && issue ? t(issue) : undefined}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </form>
          </DialogContent>
        )}
      </Dialog>
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(v) => !v && setToDelete(null)}
        title={t('people.areas.deleteTitle', { name: toDelete?.name ?? '' })}
        description={t('people.areas.deleteBody')}
        confirmLabel={t('people.areas.deleteConfirm')}
        destructive
        onConfirm={() => {
          if (!toDelete || !user) return;
          useDataStore.getState().deleteArea(toDelete.id, user.personId);
          toast.success(t('people.areas.deleted'));
        }}
      />
    </section>
  );
}

/** A9 · Jobs catalog (F15): area, suggested template and suggested access package (used by F12). */
export function JobTitlesCatalog() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const areas = useDataStore((s) => s.areas);
  const people = useDataStore((s) => s.people);
  const jobTitles = useDataStore((s) => s.jobTitles);
  const templates = useDataStore((s) => s.templates);
  const [editing, setEditing] = useState<JobTitle | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', areaId: '', templateId: '', access: '' });
  const [tried, setTried] = useState(false);
  const [toDelete, setToDelete] = useState<JobTitle | null>(null);
  const canEdit = can(user, 'catalog:edit');
  const taken = jobTitles.filter((j) => editing === 'new' || j.id !== editing?.id).map((j) => j.name.toLowerCase());
  const nameIssue = issuesByPath(nameSchema(taken).safeParse(form.name))[''];
  const areaIssue = form.areaId ? undefined : 'people.jobs.areaRequired';
  const areaName = (id: string) => areas.find((a) => a.id === id)?.name ?? '';

  const open = (job: JobTitle | 'new') => {
    setEditing(job);
    setForm(
      job === 'new'
        ? { name: '', areaId: '', templateId: '', access: '' }
        : { name: job.name, areaId: job.areaId, templateId: job.suggestedTemplateId ?? '', access: job.suggestedAccess.join(', ') },
    );
    setTried(false);
  };
  const save = () => {
    setTried(true);
    if (nameIssue) return document.getElementById('job-name')?.focus();
    if (areaIssue) return document.getElementById('job-area')?.focus();
    if (!user || !editing) return;
    useDataStore.getState().saveJobTitle(
      {
        id: editing === 'new' ? newId('jt') : editing.id,
        name: form.name.trim(),
        areaId: form.areaId,
        suggestedTemplateId: form.templateId || undefined,
        suggestedAccess: form.access
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      },
      user.personId,
    );
    toast.success(t('people.jobs.saved'));
    setEditing(null);
  };

  return (
    <section aria-labelledby="jobs-title" className={PANEL}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id="jobs-title" className="text-title-medium text-on-surface">
            {t('people.tabs.jobTitles')}
          </h2>
          <p className="text-body-small text-on-surface-variant">{t('people.jobs.description')}</p>
        </div>
        {canEdit && (
          <Button variant="outlined" leadingIcon="add" onClick={() => open('new')} className="w-fit shrink-0">
            {t('people.jobs.add')}
          </Button>
        )}
      </div>
      <ul className="-mx-2 flex flex-col">
        {jobTitles.map((j) => {
          const nPeople = people.filter((p) => p.jobTitleId === j.id).length;
          const template = templates.find((tp) => tp.id === j.suggestedTemplateId);
          return (
            <CatalogRow
              key={j.id}
              icon="badge"
              title={j.name}
              meta={[
                areaName(j.areaId),
                template ? template.name : t('people.jobs.templateNone'),
                t('people.jobs.accessCount', { count: j.suggestedAccess.length }),
                t('people.areas.people', { count: nPeople }),
              ].join(' · ')}
              menuLabel={t('people.areas.actions', { name: j.name })}
              editLabel={t('people.jobs.edit')}
              onEdit={() => open(j)}
              deleteLabel={t('people.jobs.delete')}
              deleteReason={nPeople ? t('people.jobs.deleteInUse') : undefined}
              onDelete={() => setToDelete(j)}
              canEdit={canEdit}
            />
          );
        })}
      </ul>

      <Dialog open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        {editing !== null && (
          <DialogContent
            title={editing === 'new' ? t('people.jobs.dialogNew') : t('people.jobs.dialogEdit')}
            className="max-w-xl"
            actions={
              <>
                <DialogClose asChild>
                  <Button variant="outlined">{t('ui.cancel')}</Button>
                </DialogClose>
                <Button leadingIcon="check" onClick={save}>
                  {t('people.jobs.save')}
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
                id="job-name"
                label={t('people.jobs.name')}
                required
                helperText={t('people.jobs.nameHelp')}
                error={tried && nameIssue ? t(nameIssue) : undefined}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <Select
                id="job-area"
                label={t('people.jobs.area')}
                required
                helperText={t('people.jobs.areaHelp')}
                error={tried && areaIssue ? t(areaIssue) : undefined}
                value={form.areaId}
                onChange={(event) => setForm({ ...form, areaId: event.target.value })}
                options={[{ value: '', label: t('hires.form.choose') }, ...areas.map((a) => ({ value: a.id, label: a.name }))]}
              />
              <Select
                id="job-template"
                label={t('people.jobs.template')}
                helperText={t('people.jobs.templateHelp')}
                value={form.templateId}
                onChange={(event) => setForm({ ...form, templateId: event.target.value })}
                options={[
                  { value: '', label: t('people.jobs.templateNone') },
                  ...templates.filter(isAssignable).map((tp) => ({ value: tp.id, label: tp.name })),
                ]}
              />
              <TextField
                id="job-access"
                label={t('people.jobs.access')}
                optional
                helperText={t('people.jobs.accessHelp')}
                value={form.access}
                onChange={(event) => setForm({ ...form, access: event.target.value })}
              />
              {/* Enter in a field submits, as the buttons live outside the form (dialog actions) */}
              <button type="submit" hidden aria-hidden tabIndex={-1} />
            </form>
          </DialogContent>
        )}
      </Dialog>
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(v) => !v && setToDelete(null)}
        title={t('people.jobs.deleteTitle', { name: toDelete?.name ?? '' })}
        description={t('people.jobs.deleteBody')}
        confirmLabel={t('people.jobs.deleteConfirm')}
        destructive
        onConfirm={() => {
          if (!toDelete || !user) return;
          useDataStore.getState().deleteJobTitle(toDelete.id, user.personId);
          toast.success(t('people.jobs.deleted'));
        }}
      />
    </section>
  );
}
