import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { FilterChip } from '@/components/ui/FilterChip';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { TextField } from '@/components/ui/TextField';
import { MIN_QUERY, search, SEARCH_GROUPS, type SearchGroup } from '@/lib/search';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import { moveFocus, SearchResultRow } from './SearchResults';

type Filter = 'all' | SearchGroup;

/**
 * G12 · Search results (F16): the same search as the quick one, with every result and filters by
 * type (chips from 640 px, a menu on phones, D-107). The query lives in the address (?q=), so the
 * results can be shared and the back button keeps them.
 */
export function SearchPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const data = useDataStore();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const [filter, setFilter] = useState<Filter>('all');
  const listRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => search(data, user, query), [data, user, query]);
  const ready = query.trim().length >= MIN_QUERY;
  const count = (f: Filter) => (f === 'all' ? results.length : results.filter((r) => r.group === f).length);
  const filters: Filter[] = ['all', ...SEARCH_GROUPS.filter((g) => count(g) > 0)];
  const shown = filter === 'all' ? results : results.filter((r) => r.group === filter);
  const label = (f: Filter) => (f === 'all' ? t('search.page.all') : t(`search.groups.${f}`));

  return (
    <>
      <PageHeader title={t('search.page.title')} description={t('search.page.description')} />
      <Card title={t('search.page.listTitle')}>
        <div ref={listRef} className="flex flex-col gap-4" onKeyDown={(event) => moveFocus(event, listRef.current)}>
          <TextField
            id="search-page"
            label={t('search.label')}
            helperText={t('search.help')}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setFilter('all');
              setParams(event.target.value ? { q: event.target.value } : {}, { replace: true });
            }}
          />
          {ready && results.length > 0 && (
            <>
              <p className="text-body-medium text-on-surface" aria-live="polite">
                {t('search.page.results', { count: results.length, q: query.trim() })}
              </p>
              <div role="group" aria-label={t('search.page.filter')} className="hidden flex-wrap gap-3 sm:flex">
                {filters.map((f) => (
                  <FilterChip key={f} label={label(f)} count={count(f)} selected={filter === f} onClick={() => setFilter(f)} />
                ))}
              </div>
              <FilterMenu
                className="sm:hidden"
                label={t('search.page.filter')}
                value={filter}
                onChange={(v) => setFilter(v as Filter)}
                options={filters.map((f) => ({ value: f, label: label(f), count: count(f) }))}
              />
            </>
          )}
          {!ready ? (
            <p className="border-t border-outline-variant pt-4 text-body-medium text-on-surface-variant">{t('search.hint')}</p>
          ) : results.length === 0 ? (
            <p className="border-t border-outline-variant pt-4 text-body-medium text-on-surface-variant" aria-live="polite">
              {t('search.empty', { q: query.trim() })}
            </p>
          ) : (
            <ul className="-mx-2 flex flex-col border-t border-outline-variant pt-1">
              {shown.map((r) => (
                <SearchResultRow key={`${r.group}-${r.id}`} result={r} />
              ))}
            </ul>
          )}
        </div>
      </Card>
    </>
  );
}
