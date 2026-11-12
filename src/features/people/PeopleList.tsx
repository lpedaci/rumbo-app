import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Avatar } from '@/components/ui/Avatar';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { Icon } from '@/components/ui/Icon';
import { TextField } from '@/components/ui/TextField';
import { filterPeople, personStatus } from '@/lib/people';
import { ROLES } from '@/lib/permissions';
import { useDataStore } from '@/store/data-store';
import { PersonStatusPill, RoleChip } from './PeopleBits';
import { EmailText } from '@/components/ui/EmailText';

const PANEL = 'flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding)';

/**
 * A9 · People (F15): search by name or email and filter by area, role and status. Each row is
 * the whole link to the person (D-94, D-106): avatar, name and email; job and area; role and
 * status on the right.
 */
export function PeopleList() {
  const { t } = useTranslation();
  const people = useDataStore((s) => s.people);
  const areas = useDataStore((s) => s.areas);
  const attempts = useDataStore((s) => s.authAttempts);
  const hires = useDataStore((s) => s.hires);
  const [query, setQuery] = useState('');
  const [areaId, setAreaId] = useState('all');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const shown = filterPeople(people, attempts, { query, areaId, role, status });

  return (
    <section aria-labelledby="people-list-title" className={PANEL}>
      <h2 id="people-list-title" className="sr-only">
        {t('people.tabs.people')}
      </h2>
      {/* Search on top; the filters as menus of the same height (D-78, D-107) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <TextField
          id="people-search"
          type="search"
          label={t('people.search')}
          helperText={t('people.searchHelp')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 items-end gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
        <FilterMenu
          label={t('people.filters.area')}
          value={areaId}
          onChange={setAreaId}
          options={[{ value: 'all', label: t('people.filters.anyArea') }, ...areas.map((a) => ({ value: a.id, label: a.name }))]}
        />
        <FilterMenu
          label={t('people.filters.role')}
          value={role}
          onChange={setRole}
          options={[{ value: 'all', label: t('people.filters.anyRole') }, ...ROLES.map((r) => ({ value: r, label: r === 'hire' ? t('people.roleBasicFilter') : t(`roles.${r}`) }))]}
        />
        <FilterMenu
          label={t('people.filters.status')}
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: t('people.filters.anyStatus') },
            ...(['active', 'locked', 'offboarded'] as const).map((s) => ({ value: s, label: t(`people.status.${s}`) })),
          ]}
        />
        <p className="col-span-2 text-body-medium text-on-surface-variant tabular-nums" aria-live="polite">
          {t('people.results', { count: shown.length })}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="border-t border-outline-variant pt-4 text-body-medium text-on-surface-variant">{t('people.empty')}</p>
      ) : (
        <ul className="-mx-2 flex flex-col border-t border-outline-variant pt-1">
          {shown.map((p) => (
            <li key={p.id} className="border-b border-outline-variant last:border-b-0">
              <Link
                to={`/admin/people/${p.id}`}
                className="flex min-h-14 min-w-0 flex-col gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:flex-row sm:items-center sm:gap-4"
              >
                <span className="flex min-w-0 flex-1 items-start gap-3">
                  <Avatar name={p.name} role={p.role} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-title-small text-on-surface">{p.name}</span>
                    <span className="text-body-small text-on-surface-variant">
                      {p.jobTitle} · {p.area}
                    </span>
                    <EmailText email={p.email} className="text-body-small text-on-surface-variant" />
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  <RoleChip role={p.role} newHire={hires.some((h) => h.personId === p.id)} />
                  <PersonStatusPill status={personStatus(p, attempts)} />
                </span>
                <Icon name="chevron_right" className="hidden shrink-0 text-on-surface-variant sm:block" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
