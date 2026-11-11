import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { TextField } from '@/components/ui/TextField';
import { TaskRow } from '@/features/journey/TaskRow';
import { AccessDeniedPage } from '@/features/system/AccessDeniedPage';
import { addDays, formatDate, STAGES } from '@/lib/dates';
import { dateMask } from '@/lib/input-masks';
import { generateHireTasks } from '@/lib/journey';
import { can } from '@/lib/permissions';
import { useFieldError } from '@/lib/use-field-error';
import { dateField, parseDisplayDate } from '@/lib/validation';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';

/** Sample start date: the one of the demo new hire (CLAUDE.md section 7). */
const SAMPLE_START = '13/10/2026';

/**
 * A7 · Template preview (CLAUDE.md F2): the journey as the new hire will see it,
 * with real dates calculated from a sample start date. Nothing can be completed.
 */
export function TemplatePreviewPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const user = useCurrentUser();
  const fieldError = useFieldError();
  const template = useDataStore((s) => s.templates.find((x) => x.id === id));
  const [input, setInput] = useState(SAMPLE_START);
  const [startDate, setStartDate] = useState(parseDisplayDate(SAMPLE_START)!);
  const [error, setError] = useState<string | undefined>();

  if (!template) return <AccessDeniedPage reason="not_found" />;

  const validate = (value: string, live: boolean) => {
    const result = dateField.safeParse(value);
    if (result.success) {
      setError(undefined);
      setStartDate(parseDisplayDate(value)!);
    } else if (!live || error) {
      // First validation on blur; once there is an error, it updates while typing (2.10).
      setError(fieldError({ type: 'custom', message: result.error.issues[0]?.message }));
    }
  };

  // Every task is pending: "today" is set before the first due date, so nothing shows as overdue.
  const tasks = generateHireTasks(template, startDate, 'preview');
  const firstDue = tasks.reduce((min, x) => (x.dueDate < min ? x.dueDate : min), tasks[0]?.dueDate ?? startDate);
  const lastDue = tasks.reduce((max, x) => (x.dueDate > max ? x.dueDate : max), startDate);
  const previewToday = addDays(firstDue, -1);

  return (
    <>
      <nav aria-label={t('templates.editor.breadcrumb')} className="mb-2">
        <Link
          to={`/admin/templates/${template.id}`}
          className="inline-flex min-h-12 items-center gap-1 rounded-sm text-label-large text-primary underline-offset-4 hover:underline md:min-h-0"
        >
          <Icon name="arrow_back" />
          {t('templates.preview.back')}
        </Link>
      </nav>

      <PageHeader
        eyebrow={t('templates.preview.eyebrow')}
        title={template.name}
        description={t('templates.preview.description')}
        actions={
          can(user, 'template:edit') && (
            <Button asChild variant="outlined" leadingIcon="edit">
              <Link to={`/admin/templates/${template.id}`}>{t('templates.preview.edit')}</Link>
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-(--space-bento-gap)">
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <TextField
              className="md:max-w-72"
              label={t('templates.preview.startDate')}
              helperText={t('templates.preview.startDateHelp')}
              inputMode="numeric"
              mask={dateMask}
              value={input}
              error={error}
              onChange={(event) => {
                setInput(event.target.value);
                validate(event.target.value, true);
              }}
              onBlur={(event) => validate(event.target.value, false)}
            />
            <p className="text-body-medium text-on-surface-variant tabular-nums md:pt-7" aria-live="polite">
              {t('templates.preview.summary', {
                count: tasks.length,
                from: formatDate(firstDue),
                to: formatDate(lastDue),
              })}
            </p>
          </div>
          <InlineAlert tone="info">{t('templates.preview.note')}</InlineAlert>
        </Card>

        <Card title={t('journey.all.title')}>
          <div className="flex flex-col gap-6">
            {STAGES.map((stage) => {
              const ofStage = tasks.filter((x) => x.stage === stage);
              if (ofStage.length === 0) return null;
              return (
                <section key={stage} aria-labelledby={`preview-${stage}`} className="flex flex-col gap-2">
                  <h3
                    id={`preview-${stage}`}
                    className="border-b border-outline-variant pb-2 text-title-medium text-on-surface"
                  >
                    {t(`stages.${stage}`)}
                  </h3>
                  <ul className="flex flex-col divide-y divide-outline-variant">
                    {ofStage.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        allTasks={tasks}
                        canComplete={false}
                        onComplete={() => undefined}
                        preview
                        today={previewToday}
                      />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
