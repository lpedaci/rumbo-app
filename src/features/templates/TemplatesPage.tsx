import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { IconTile } from '@/components/ui/IconTile';
import { SegmentedButton } from '@/components/ui/SegmentedButton';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { toast } from '@/components/ui/toast-store';
import { DEMO_TODAY, formatDate } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { duplicateTemplate, templateUsage } from '@/lib/templates';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Template } from '@/types/domain';
import { TemplateStatePill } from './TemplateStatePill';

/**
 * A5 · Templates by job title (CLAUDE.md F2): task count and usage, with create,
 * edit, preview, duplicate and delete. Catalog of cards by default with a "Crear plantilla"
 * card first (2.2.1, pattern 11; D-80), and a table view from 768 px.
 */
export function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const templates = useDataStore((s) => s.templates);
  const hires = useDataStore((s) => s.hires);
  const [toDelete, setToDelete] = useState<Template | null>(null);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const canEdit = can(user, 'template:edit');

  const sorted = [...templates].sort((a, b) => a.name.localeCompare(b.name, 'es'));

  const onDuplicate = (template: Template) => {
    if (!user) return;
    const copy = duplicateTemplate(template, t('templates.list.copyName', { name: template.name }), DEMO_TODAY);
    useDataStore.getState().saveTemplate(copy, user.personId);
    toast.success(t('templates.list.duplicated'));
    navigate(`/admin/templates/${copy.id}`);
  };

  const onDelete = () => {
    if (!user || !toDelete) return;
    useDataStore.getState().deleteTemplate(toDelete.id, user.personId);
    toast.success(t('templates.list.deleted'));
  };

  const actionsMenu = (template: Template, usage: number) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton icon="more_vert" label={t('templates.list.menu', { name: template.name })} />
      </DropdownMenuTrigger>
      <DropdownMenuContent label={t('templates.list.menu', { name: template.name })}>
        <DropdownMenuItem icon="edit" onSelect={() => navigate(`/admin/templates/${template.id}`)}>
          {t('templates.list.edit')}
        </DropdownMenuItem>
        <DropdownMenuItem icon="visibility" onSelect={() => navigate(`/admin/templates/${template.id}/preview`)}>
          {t('templates.list.preview')}
        </DropdownMenuItem>
        <DropdownMenuItem icon="history" onSelect={() => navigate(`/admin/templates/${template.id}/versions`)}>
          {t('templateVersions.history')}
        </DropdownMenuItem>
        {canEdit && (
          <>
            <DropdownMenuItem icon="content_copy" onSelect={() => onDuplicate(template)}>
              {t('templates.list.duplicate')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              icon="delete"
              destructive
              disabled={usage > 0}
              description={usage > 0 ? t('templates.list.deleteInUse', { count: usage }) : undefined}
              onSelect={() => setToDelete(template)}
            >
              {t('templates.list.delete')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const usageText = (usage: number) =>
    usage > 0 ? t('templates.list.usage', { count: usage }) : t('templates.list.usageNone');

  return (
    <>
      <PageHeader
        title={t('templates.list.title')}
        description={t('templates.list.description')}
        actions={
          canEdit && (
            <Button asChild leadingIcon="add">
              <Link to="/admin/templates/new">{t('templates.list.create')}</Link>
            </Button>
          )
        }
      />

      {sorted.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-body-medium text-on-surface-variant tabular-nums">
            {t('templates.list.count', { count: sorted.length })}
          </p>
          {/* Catalog by default (2.2.1, pattern 11); table from 768 px for a dense view */}
          <SegmentedButton
            label={t('templates.list.viewLabel')}
            options={[
              { value: 'cards', label: t('templates.list.viewCards') },
              { value: 'table', label: t('templates.list.viewTable') },
            ]}
            value={view}
            onValueChange={setView}
            className="hidden md:inline-flex"
          />
        </div>
      )}

      {sorted.length === 0 ? (
        <Card>
          <div className="flex flex-col items-start gap-3">
            <Icon name="route" size={24} className="text-on-surface-variant" />
            <p className="text-body-large text-on-surface">{t('templates.list.empty')}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Table view, from 768 px */}
          <div className={cn('hidden', view === 'table' && 'md:block')}>
            <TableContainer label={t('templates.list.tableLabel')} className="bg-surface-container-lowest">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{t('templates.list.columns.name')}</TableHeaderCell>
                    <TableHeaderCell>{t('templates.list.columns.state')}</TableHeaderCell>
                    <TableHeaderCell>{t('templates.list.columns.area')}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t('templates.list.columns.tasks')}</TableHeaderCell>
                    <TableHeaderCell className="text-right">{t('templates.list.columns.usage')}</TableHeaderCell>
                    <TableHeaderCell>{t('templates.list.columns.updated')}</TableHeaderCell>
                    <TableHeaderCell className="w-px">
                      <span className="sr-only">{t('templates.list.columns.actions')}</span>
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sorted.map((template) => {
                    const usage = templateUsage(template.id, hires);
                    return (
                      <TableRow key={template.id}>
                        <TableCell className="max-w-80">
                          <Link
                            to={`/admin/templates/${template.id}`}
                            className="block truncate rounded-xs text-title-small text-on-surface underline-offset-4 hover:underline"
                            title={template.name}
                          >
                            {template.name}
                          </Link>
                          <span
                            className="block truncate text-body-small text-on-surface-variant"
                            title={template.jobTitle}
                          >
                            {template.jobTitle}
                          </span>
                        </TableCell>
                        <TableCell>
                          <TemplateStatePill template={template} />
                        </TableCell>
                        <TableCell>{template.area}</TableCell>
                        <TableCell className="text-right tabular-nums">{template.tasks.length}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {usage > 0 ? (
                            usage
                          ) : (
                            <span className="text-on-surface-variant">{t('templates.list.usageNone')}</span>
                          )}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          <time dateTime={template.updatedAt}>{formatDate(template.updatedAt)}</time>
                        </TableCell>
                        <TableCell className="py-1">{actionsMenu(template, usage)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Catalog of cards (2.2.1, pattern 11, reference 7fa40cfb): always on phones */}
          <ul
            className={cn(
              'grid grid-cols-1 gap-(--space-bento-gap) sm:grid-cols-2 xl:grid-cols-3',
              view === 'table' && 'md:hidden',
            )}
            aria-label={t('templates.list.tableLabel')}
          >
            {canEdit && (
              <li className="relative hidden min-h-56 flex-col items-start justify-center gap-3 rounded-xl border-2 border-dashed sm:flex border-outline-variant p-5 transition-colors hover:border-primary hover:bg-surface-container-lowest">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary-container text-primary">
                  <Icon name="add" size={24} />
                </span>
                <Link
                  to="/admin/templates/new"
                  className="text-title-medium text-on-surface outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-primary"
                >
                  {t('templates.list.create')}
                </Link>
                <p className="text-body-medium text-on-surface-variant">{t('templates.list.createBody')}</p>
              </li>
            )}
            {sorted.map((template) => {
              const usage = templateUsage(template.id, hires);
              const showJobTitle = template.jobTitle.trim() !== template.name.trim();
              return (
                <li
                  key={template.id}
                  className="relative flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
                >
                  {/* Icon and name on one line, the menu at the end (D-134) */}
                  <div className="flex min-w-0 items-center gap-3">
                    <IconTile icon="route" />
                    <Link
                      to={`/admin/templates/${template.id}`}
                      className="line-clamp-2 min-w-0 flex-1 text-title-medium text-on-surface outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-primary"
                    >
                      {template.name}
                    </Link>
                    {/* Above the stretched link so it stays clickable */}
                    <div className="relative z-10 -mr-2 shrink-0">{actionsMenu(template, usage)}</div>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <ul className="flex flex-wrap gap-1.5" aria-label={t('templates.list.tags')}>
                      {showJobTitle && (
                        <li className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-label-medium text-on-surface">
                          {template.jobTitle}
                        </li>
                      )}
                      <li className="rounded-full bg-secondary-container px-2.5 py-0.5 text-label-medium text-on-secondary-container">
                        {template.area}
                      </li>
                    </ul>
                  </div>
                  <ul className="flex flex-wrap gap-x-5 gap-y-1 text-body-medium text-on-surface">
                    <li className="inline-flex items-center gap-1.5 tabular-nums">
                      <Icon name="checklist" size={18} className="text-primary" />
                      {t('templates.list.tasks', { count: template.tasks.length })}
                    </li>
                    <li className="inline-flex items-center gap-1.5 tabular-nums">
                      <Icon name="group" size={18} className="text-tertiary" />
                      {usageText(usage)}
                    </li>
                  </ul>
                  {/* State of the template (F8) next to the last update */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant pt-3">
                    <p className="text-body-small text-on-surface-variant tabular-nums">
                      {t('templates.list.updatedOn', { date: formatDate(template.updatedAt) })}
                    </p>
                    <TemplateStatePill template={template} />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t('templates.list.deleteTitle')}
        description={t('templates.list.deleteBody', { name: toDelete?.name ?? '' })}
        confirmLabel={t('templates.list.delete')}
        onConfirm={onDelete}
      />
    </>
  );
}
