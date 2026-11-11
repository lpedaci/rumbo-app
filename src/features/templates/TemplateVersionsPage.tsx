import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';
import { DetailHeader, HeaderChip } from '@/components/layout/DetailHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { Icon } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { StatusPill } from '@/components/ui/StatusPill';
import { toast } from '@/components/ui/toast-store';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { formatDate } from '@/lib/dates';
import { diffTemplates, hasDraftChanges, latestVersion, usageByVersion } from '@/lib/templates';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Template } from '@/types/domain';
import { TemplateDiffView } from './TemplateDiffView';
import { TemplateStatePill } from './TemplateStatePill';

const DRAFT = 'draft';

/**
 * A8 · Versions of a template (F8): the history of published versions with date, author, note,
 * tasks and how many journeys use each one, the unpublished draft on top, a comparison between
 * any two versions (or the draft) and "Restaurar como borrador" for a previous version.
 */
export function TemplateVersionsPage() {
  const { id = '' } = useParams();
  const template = useDataStore((s) => s.templates.find((x) => x.id === id));
  if (!template) return <AccessDeniedPage reason="not_found" />;
  return <Versions template={template} />;
}

function Versions({ template }: { template: Template }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const people = useDataStore((s) => s.people);
  const hires = useDataStore((s) => s.hires);
  const usage = usageByVersion(template.id, hires);
  const latest = latestVersion(template);
  const draft = hasDraftChanges(template);
  const versions = [...template.versions].reverse();

  // Default comparison: the draft against the version in force, or the last two versions.
  const [to, setTo] = useState(draft ? DRAFT : String(latest?.version ?? ''));
  const [from, setFrom] = useState(
    String(draft ? (latest?.version ?? '') : (template.versions.at(-2)?.version ?? latest?.version ?? '')),
  );
  const [toRestore, setToRestore] = useState<number | null>(null);

  const content = (key: string) =>
    key === DRAFT ? template : template.versions.find((v) => String(v.version) === key);
  const fromContent = content(from);
  const toContent = content(to);
  const options = [
    ...(draft ? [{ value: DRAFT, label: t('templateVersions.page.draftOption') }] : []),
    ...versions.map((v) => ({ value: String(v.version), label: t('templateVersions.page.versionOption', { version: v.version }) })),
  ];
  const nameOf = (personId: string) => people.find((p) => p.id === personId)?.name ?? personId;

  const restore = () => {
    if (toRestore === null || !user) return;
    useDataStore.getState().restoreTemplateVersion(template.id, toRestore, user.personId);
    toast.success(t('templateVersions.page.restored', { version: toRestore }));
    navigate(`/admin/templates/${template.id}`);
  };

  return (
    <>
      <nav aria-label={t('templates.editor.breadcrumb')} className="mb-2">
        <Link
          to={`/admin/templates/${template.id}`}
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('templateVersions.page.back')}
        </Link>
      </nav>

      {/* Detail header like every record (D-94): state and key facts as chips, then the h1 */}
      <DetailHeader
        chipsLabel={t('templateVersions.page.facts')}
        chips={
          <>
            <li>
              <TemplateStatePill template={template} className="h-7" />
            </li>
            <HeaderChip icon="badge">{template.jobTitle}</HeaderChip>
            <HeaderChip icon="apartment">{template.area}</HeaderChip>
          </>
        }
        title={t('templateVersions.page.title', { name: template.name })}
        description={t('templateVersions.page.description')}
      />

      <div className="flex flex-col gap-(--space-bento-gap)">

        <Card title={t('templateVersions.page.listTitle')}>
          {versions.length === 0 && !draft ? (
            <p className="text-body-medium text-on-surface-variant">{t('templateVersions.page.empty')}</p>
          ) : (
            // List pattern (D-65, D-106): icon, then title, note and facts; state and action on the right.
            <ol className="-mx-2 flex flex-col">
              {draft && (
                <VersionRow
                  icon="edit_note"
                  title={t('templateVersions.page.draftRow')}
                  note={t('templateVersions.page.draftRowHelp')}
                  meta={t('templateVersions.page.tasks', { count: template.tasks.length })}
                  pill={<StatusPill tone="neutral" icon="edit_note" label={t('templateVersions.state.draft')} />}
                  action={
                    <Button asChild variant="outlined" size="xs" leadingIcon="edit">
                      <Link to={`/admin/templates/${template.id}`}>{t('templateVersions.page.editDraft')}</Link>
                    </Button>
                  }
                />
              )}
              {versions.map((v) => {
                const isCurrent = v.version === latest?.version;
                const count = usage.get(v.version) ?? 0;
                return (
                  <VersionRow
                    key={v.version}
                    icon={isCurrent ? 'check_circle' : 'history'}
                    current={isCurrent}
                    title={t('templateVersions.page.versionTitle', { version: v.version })}
                    note={v.note}
                    meta={[
                      t('templateVersions.page.publishedBy', {
                        date: formatDate(v.publishedAt.slice(0, 10)),
                        name: nameOf(v.publishedBy),
                      }),
                      t('templateVersions.page.tasks', { count: v.tasks.length }),
                      count > 0 ? t('templateVersions.page.usage', { count }) : t('templateVersions.page.usageNone'),
                    ].join(' · ')}
                    pill={
                      isCurrent ? (
                        <StatusPill tone="success" icon="check_circle" label={t('templateVersions.page.current')} />
                      ) : (
                        <StatusPill tone="neutral" icon="history" label={t('templateVersions.page.previous')} />
                      )
                    }
                    action={
                      (!isCurrent || draft) && (
                        <Button
                          variant="outlined"
                          size="xs"
                          leadingIcon="settings_backup_restore"
                          onClick={() => setToRestore(v.version)}
                        >
                          {t('templateVersions.page.restore')}
                        </Button>
                      )
                    }
                  />
                );
              })}
            </ol>
          )}
        </Card>

        {options.length >= 2 && (
          <Card title={t('templateVersions.page.compareTitle')} description={t('templateVersions.page.compareDescription')}>
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:items-center sm:gap-6">
                <FilterMenu label={t('templateVersions.page.from')} value={from} onChange={setFrom} options={options} />
                <FilterMenu label={t('templateVersions.page.to')} value={to} onChange={setTo} options={options} />
              </div>
              <div className="border-t border-outline-variant pt-4">
                {fromContent && toContent && <TemplateDiffView diff={diffTemplates(fromContent, toContent)} />}
              </div>
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={toRestore !== null}
        onOpenChange={(open) => !open && setToRestore(null)}
        title={t('templateVersions.page.restoreTitle', { version: toRestore })}
        description={t('templateVersions.page.restoreBody', { version: toRestore })}
        confirmLabel={t('templateVersions.page.restoreConfirm')}
        onConfirm={restore}
      />
    </>
  );
}

/** One row of the history: same rhythm as the other lists (D-106). */
function VersionRow({
  icon,
  current = false,
  title,
  note,
  meta,
  pill,
  action,
}: {
  icon: 'edit_note' | 'check_circle' | 'history';
  current?: boolean;
  title: string;
  note: string;
  meta: string;
  pill: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <li className="flex min-h-14 flex-col gap-3 border-b border-outline-variant px-2 py-3 last:border-b-0 sm:flex-row sm:items-start sm:gap-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <IconTile icon={icon} tone={current ? 'success' : 'neutral'} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="text-title-small text-on-surface">{title}</span>
          <p className="text-body-medium text-on-surface">{note}</p>
          <p className="text-body-small text-on-surface-variant tabular-nums">{meta}</p>
        </div>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-3 sm:shrink-0 sm:flex-col sm:items-end">
        {pill}
        {action}
      </div>
    </li>
  );
}
