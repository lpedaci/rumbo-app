import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { toast } from '@/components/ui/toast-store';
import { progressOfEvent } from '@/lib/lifecycle';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import { AccessTaskList, EventSummary } from './LifecycleBits';

type Filter = 'pending' | 'all';

/**
 * S4 · Access tasks (F12), for IT: one card per joiner, mover or leaver with the access to grant
 * or revoke; each pending one is marked done with a button and goes to the audit log. The most
 * urgent first (by effective date). A notification link opens the move highlighted (?event=).
 */
export function AccessTasksPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const events = useDataStore((s) => s.lifecycle);
  const [filter, setFilter] = useState<Filter>('pending');
  const [params] = useSearchParams();
  const focus = params.get('event');
  const pendingOf = (e: (typeof events)[number]) => progressOfEvent(e).done < e.accessTasks.length;
  const shown = events
    .filter((e) => filter === 'all' || pendingOf(e))
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  const count = (f: Filter) => events.filter((e) => f === 'all' || pendingOf(e)).length;

  useEffect(() => {
    if (focus) document.getElementById(`event-${focus}`)?.scrollIntoView?.({ block: 'start' });
  }, [focus]);

  return (
    <>
      <PageHeader title={t('lifecycle.it.title')} description={t('lifecycle.it.description')} />
      <div className="flex flex-col gap-(--space-bento-gap)">
        <div role="group" aria-label={t('lifecycle.it.filter')} className="hidden flex-wrap gap-3 sm:flex">
          {(['pending', 'all'] as Filter[]).map((f) => (
            <FilterChip
              key={f}
              label={t(`lifecycle.it.${f}`)}
              count={count(f)}
              selected={filter === f}
              onClick={() => setFilter(f)}
            />
          ))}
        </div>
        <FilterMenu
          className="sm:hidden"
          label={t('lifecycle.it.filter')}
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          options={(['pending', 'all'] as Filter[]).map((f) => ({ value: f, label: t(`lifecycle.it.${f}`), count: count(f) }))}
        />

        {shown.length === 0 ? (
          <p className="rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding) text-body-medium text-on-surface-variant">
            {t('lifecycle.it.empty')}
          </p>
        ) : (
          shown.map((e) => (
            <section
              key={e.id}
              id={`event-${e.id}`}
              aria-label={`${e.id} · ${t(`lifecycle.types.${e.type}`)}`}
              className={cn(
                'flex min-w-0 scroll-mt-24 flex-col gap-4 rounded-xl border bg-surface-container-lowest p-(--space-card-padding)',
                focus === e.id ? 'border-primary' : 'border-outline-variant',
              )}
            >
              <EventSummary event={e} />
              <div className="border-t border-outline-variant pt-2">
                <AccessTaskList
                  event={e}
                  action={(task) => (
                    <Button
                      variant="outlined"
                      size="xs"
                      leadingIcon="check"
                      aria-label={t('lifecycle.it.markDoneLabel', {
                        action: t(`lifecycle.detail.${task.action}`),
                        system: task.system,
                      })}
                      onClick={() => {
                        if (!user) return;
                        useDataStore.getState().completeAccessTask(e.id, task.id, user.personId);
                        toast.success(t('lifecycle.it.doneToast', { system: task.system }));
                      }}
                    >
                      {t('lifecycle.it.markDone')}
                    </Button>
                  )}
                />
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
