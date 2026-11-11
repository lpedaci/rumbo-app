import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/Dialog';
import { TextArea } from '@/components/ui/TextArea';
import { diffTemplates, latestVersion } from '@/lib/templates';
import { issuesByPath, publishNoteSchema } from '@/lib/validation';
import type { Template } from '@/types/domain';
import { TemplateDiffView } from './TemplateDiffView';

/**
 * Publish a template (F8): summary of the changes since the version in force (added, removed
 * and changed tasks) and a required version note. Validation follows 2.10: the error shows
 * after the first try and goes away as soon as the note is valid; the note is never cleared.
 */
export function PublishDialog({
  template,
  open,
  onOpenChange,
  onPublish,
}: {
  template: Template;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (note: string) => void;
}) {
  const { t } = useTranslation();
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const latest = latestVersion(template);
  const next = (latest?.version ?? 0) + 1;
  const issue = issuesByPath(publishNoteSchema.safeParse(note))[''];
  const error = tried && issue ? t(issue) : undefined;

  const submit = () => {
    setTried(true);
    if (issue) {
      document.getElementById('publish-note')?.focus();
      return;
    }
    onPublish(note.trim());
    setNote('');
    setTried(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={t('templateVersions.dialog.title', { version: next })}
        description={t('templateVersions.dialog.description')}
        className="max-w-2xl"
        actions={
          <>
            <DialogClose asChild>
              <Button variant="outlined">{t('ui.cancel')}</Button>
            </DialogClose>
            <Button leadingIcon="publish" onClick={submit}>
              {t('templateVersions.dialog.confirm', { version: next })}
            </Button>
          </>
        }
      >
        <section className="flex flex-col gap-3 rounded-lg border border-outline-variant p-4">
          {latest ? (
            <>
              <h3 className="text-title-medium text-on-surface">
                {t('templateVersions.dialog.summaryTitle', { version: latest.version })}
              </h3>
              <TemplateDiffView diff={diffTemplates(latest, template)} headingLevel="h4" />
            </>
          ) : (
            <p className="text-body-medium text-on-surface">
              {t('templateVersions.dialog.first', { count: template.tasks.length })}
            </p>
          )}
        </section>
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <TextArea
            id="publish-note"
            label={t('templateVersions.dialog.note')}
            required
            helperText={t('templateVersions.dialog.noteHelp')}
            error={error}
            value={note}
            rows={3}
            maxLength={600}
            onChange={(event) => setNote(event.target.value)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}
