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
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { Template } from '@/types/domain';

/**
 * A5 · Templates by job title (CLAUDE.md F2): task count and usage, with create,
 * edit, preview, duplicate and delete. Table on desktop, cards on mobile (2.7).
 */
export function TemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useCurrentUser();
  const templates = useDataStore((s) => s.templates);
  const hires = useDataStore((s) => s.hires);
  const [toDelete, setToDelete] = useState<Template | null>(null);
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

      {sorted.length === 0 ? (
        <Card>
          <div className="flex flex-col items-start gap-3">
            <Icon name="route" size={24} className="text-on-surface-variant" />
            <p className="text-body-large text-on-surface">{t('templates.list.empty')}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop and tablet: table */}
          <div className="hidden md:block">
            <TableContainer label={t('templates.list.tableLabel')} className="bg-surface-container-lowest">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{t('templates.list.columns.name')}</TableHeaderCell>
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
                          <span className="block truncate text-body-small text-on-surface-variant" title={template.jobTitle}>
                            {template.jobTitle}
                          </span>
                        </TableCell>
                        <TableCell>{template.area}</TableCell>
                        <TableCell className="text-right tabular-nums">{template.tasks.length}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {usage > 0 ? usage : <span className="text-on-surface-variant">{t('templates.list.usageNone')}</span>}
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

          {/* Mobile: one card per template (2.7) */}
          <ul className="flex flex-col gap-3 md:hidden" aria-label={t('templates.list.tableLabel')}>
            {sorted.map((template) => {
              const usage = templateUsage(template.id, hires);
              return (
                <li
                  key={template.id}
                  className="flex min-w-0 items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-4"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link
                      to={`/admin/templates/${template.id}`}
                      className="flex min-h-12 items-center rounded-xs text-title-medium text-on-surface underline-offset-4 hover:underline"
                    >
                      <span className="line-clamp-2">{template.name}</span>
                    </Link>
                    <span className="truncate text-body-medium text-on-surface-variant">
                      {template.jobTitle} · {template.area}
                    </span>
                    <span className="text-body-small text-on-surface-variant tabular-nums">
                      {t('templates.list.tasks', { count: template.tasks.length })} · {usageText(usage)}
                    </span>
                    <span className="text-body-small text-on-surface-variant tabular-nums">
                      {t('templates.list.updatedOn', { date: formatDate(template.updatedAt) })}
                    </span>
                  </div>
                  {actionsMenu(template, usage)}
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
