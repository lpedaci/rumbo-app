import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { DetailHeader, HeaderChip } from '@/components/layout/DetailHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormFooter } from '@/components/ui/FormFooter';
import { Icon } from '@/components/ui/Icon';
import { KpiCard, KpiRow } from '@/components/ui/KpiCard';
import { StatusPill } from '@/components/ui/StatusPill';
import { TextField } from '@/components/ui/TextField';
import { TaskRow } from '@/features/journey/TaskRow';
import type { HireTask } from '@/types/domain';

function Specimen({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-4 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-title-large text-on-surface">{title}</h3>
        <p className="text-body-medium text-on-surface-variant">{note}</p>
      </div>
      {/* The specimen sits on the page gray, as in the product */}
      <div className="min-w-0 rounded-md bg-surface p-4">{children}</div>
    </section>
  );
}

/**
 * Live component specimens (D-98): the same components the product uses, with the copy of
 * the product. Nothing here is a picture.
 */
export function ComponentsSection() {
  const { t } = useTranslation();
  const c = (k: string) => t(`designSystem.components.${k}`);
  const task = (
    id: string,
    title: string,
    dueDate: string,
    status: HireTask['status'],
    type: HireTask['type'],
  ): HireTask => ({
    id,
    templateTaskId: id,
    stage: 'month1',
    order: 1,
    title,
    description: '',
    type,
    owner: 'hire',
    dependsOn: [],
    dueDate,
    status,
  });
  const tasks = [
    task('ds-1', c('row1'), '2026-10-17', 'pending', 'reading'),
    task('ds-2', c('row2'), '2026-11-10', 'in_progress', 'task'),
  ];

  return (
    <div className="grid grid-cols-1 gap-(--space-bento-gap) xl:grid-cols-2">
      <Specimen title={c('buttons')} note={c('buttonsNote')}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <Button leadingIcon="save">{c('filled')}</Button>
            <Button variant="tonal">{c('tonal')}</Button>
            <Button variant="outlined">{c('outlined')}</Button>
            <Button variant="text" trailingIcon="arrow_forward">
              {c('text')}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" leadingIcon="delete">
              {c('danger')}
            </Button>
            <Button disabledReason={c('disabledReason')}>{c('disabled')}</Button>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Button size="xs" variant="tonal">
              {c('xs')} · 32 px
            </Button>
            <Button size="s" variant="tonal">
              {c('s')} · 40 px
            </Button>
            <Button size="m" variant="tonal">
              {c('m')} · 56 px
            </Button>
          </div>
        </div>
      </Specimen>

      <Specimen title={c('fields')} note={c('fieldsNote')}>
        <div className="flex flex-col gap-4">
          <TextField label={c('email')} helperText={c('emailHelp')} type="email" defaultValue="sofia@nortia.demo" />
          <TextField label={c('date')} helperText={c('dateHelp')} defaultValue="31/02/2026" error={c('dateError')} />
        </div>
      </Specimen>

      <Specimen title={c('chips')} note={c('chipsNote')}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="success" icon="check_circle" label={c('statuses.done')} />
            <StatusPill tone="info" icon="pending" label={c('statuses.progress')} />
            <StatusPill tone="warning" icon="schedule" label={c('statuses.soon')} />
            <StatusPill tone="error" icon="error" label={c('statuses.overdue')} />
            <StatusPill tone="neutral" icon="radio_button_unchecked" label={c('statuses.neutral')} />
          </div>
          <ul className="flex flex-wrap gap-2">
            <HeaderChip icon="event" tone="accent">
              {c('headerDue')}
            </HeaderChip>
            <HeaderChip icon="badge">{c('headerJob')}</HeaderChip>
          </ul>
        </div>
      </Specimen>

      <Specimen title={c('kpi')} note={c('kpiNote')}>
        <KpiRow>
          <KpiCard
            label={c('kpiActive')}
            value="6"
            icon="groups"
            series={[2, 3, 3, 4, 5, 6]}
            caption={c('kpiActiveCaption')}
            headingLevel="h3"
          />
          <KpiCard
            label={c('kpiOnTime')}
            value="86 %"
            icon="task_alt"
            iconTone="tertiary"
            trend={{ tone: 'success', icon: 'trending_up', label: c('kpiOnTimeTrend') }}
            headingLevel="h3"
          />
        </KpiRow>
      </Specimen>

      <Specimen title={c('header')} note={c('headerNote')}>
        {/* As a specimen the title is an h3, so the page keeps a single h1 */}
        <div className="[&_header]:mb-0">
          <DetailHeader
            titleAs="h3"
            person={{ name: 'Sofía Ramírez', role: 'hire' }}
            chips={
              <>
                <HeaderChip icon="event" tone="accent">
                  {c('headerDue')}
                </HeaderChip>
                <HeaderChip icon="badge">{c('headerJob')}</HeaderChip>
              </>
            }
            title={c('headerTitle')}
            description={c('headerDesc')}
          />
        </div>
      </Specimen>

      <Specimen title={c('list')} note={c('listNote')}>
        <ul className="rounded-md border border-outline-variant bg-surface-container-lowest px-2">
          {tasks.map((tk) => (
            <TaskRow key={tk.id} task={tk} allTasks={tasks} canComplete={false} onComplete={() => {}} />
          ))}
        </ul>
      </Specimen>

      <Specimen title={c('footer')} note={c('footerNote')}>
        <Card>
          <div className="flex items-start gap-2 text-body-medium text-on-surface">
            <Icon name="sentiment_satisfied" size={20} className="shrink-0 text-tertiary" />
            {t('selfReview.moods.5')}
          </div>
          <FormFooter note={c('footerNoteText')} noteIcon="lock">
            <Button variant="outlined">{c('outlined')}</Button>
            <Button leadingIcon="send">{c('send')}</Button>
          </FormFooter>
        </Card>
      </Specimen>
    </div>
  );
}
