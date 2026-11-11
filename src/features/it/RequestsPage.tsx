import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { GreetingHeader } from '@/components/layout/GreetingHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { Icon } from '@/components/ui/Icon';
import { KpiCard, KpiRow } from '@/components/ui/KpiCard';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { findDemoPerson } from '@/features/auth/auth-service';
import {
  countRequests,
  filterRequests,
  isOpen,
  lockedAccounts,
  REQUEST_FILTERS,
  requester,
  type RequestFilter,
} from '@/lib/access';
import { DEMO_TODAY, formatDateTime, formatLongDate, formatNumber } from '@/lib/dates';
import { greetingKey } from '@/lib/journey';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import type { AccessRequest, Person } from '@/types/domain';
import { RequestStatusPill } from './RequestStatusPill';

/**
 * S1 · Access request inbox (CLAUDE.md F6): requests from "¿Problemas para iniciar sesión?"
 * with number, person, reason, date and status, open ones first. Table from 1024 px,
 * compact rows below (2.7). Each request opens its detail (S2).
 */
export function RequestsPage() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const requests = useDataStore((s) => s.accessRequests);
  const people = useDataStore((s) => s.people);
  const attempts = useDataStore((s) => s.authAttempts);
  const [filter, setFilter] = useState<RequestFilter>('all');
  const me = user && findDemoPerson(user.personId);

  const counts = countRequests(requests);
  const shown = filterRequests(requests, filter);
  const open = requests.filter(isOpen).length;
  const locked = lockedAccounts(attempts).length;
  const lockedOpen = requests.filter((r) => isOpen(r) && r.reason === 'locked').length;

  return (
    <>
      <GreetingHeader
        date={formatLongDate(DEMO_TODAY, i18n.language === 'en' ? 'en' : 'es')}
        greeting={t(`journey.greetings.${greetingKey()}`)}
        name={me?.name.split(' ')[0] ?? ''}
        facts={[
          {
            icon: 'support_agent',
            label: t('it.facts.open', { count: open }),
            tone: open > 0 ? 'accent' : 'neutral',
          },
          { icon: 'lock', label: t('it.facts.locked', { count: locked }) },
        ]}
        actions={
          <Button asChild variant="outlined" leadingIcon="security">
            <Link to="/it/security">{t('it.requests.toSecurity')}</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-(--space-section)">
        <KpiRow>
          <KpiCard
            label={t('it.kpis.new')}
            value={formatNumber(counts.new)}
            icon="notifications"
            iconTone="info"
            caption={t('it.kpiCaption.new')}
          />
          <KpiCard
            label={t('it.kpis.verifying')}
            value={formatNumber(counts.verifying)}
            icon="verified_user"
            iconTone="warning"
            caption={t('it.kpiCaption.verifying')}
          />
          <KpiCard
            label={t('it.kpis.locked')}
            value={formatNumber(locked)}
            icon="lock"
            iconTone={locked > 0 ? 'error' : 'success'}
            caption={t('it.kpiCaption.locked', { count: lockedOpen })}
          />
          <KpiCard
            label={t('it.kpis.resolved')}
            value={formatNumber(counts.resolved)}
            icon="task_alt"
            iconTone="success"
            caption={t('it.kpiCaption.resolved', { count: counts.rejected })}
          />
        </KpiRow>

        <section
          aria-label={t('it.requests.tableLabel')}
          className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
        >
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="text-title-medium text-on-surface">{t('it.requests.title')}</h2>
              <p className="text-body-small text-on-surface-variant">{t('it.requests.description')}</p>
            </div>
            <div
              role="group"
              aria-label={t('it.requests.statusFilter')}
              className="hidden flex-wrap items-center gap-3 sm:flex"
            >
              {REQUEST_FILTERS.map((value) => (
                <FilterChip
                  key={value}
                  label={t(`it.filters.${value}`)}
                  count={counts[value]}
                  selected={filter === value}
                  onClick={() => setFilter(value)}
                />
              ))}
            </div>
            <FilterMenu
              label={t('it.requests.status')}
              value={filter}
              onChange={(value) => setFilter(value as RequestFilter)}
              options={REQUEST_FILTERS.map((value) => ({
                value,
                label: t(`it.filters.${value}`),
                count: counts[value],
              }))}
              className="sm:hidden"
            />
          </div>

          {shown.length === 0 ? (
            <div className="flex items-start gap-3 border-t border-outline-variant p-6">
              <Icon name="task_alt" size={24} className="text-success" />
              <p className="text-body-large text-on-surface">
                {filter === 'all' ? t('it.requests.empty') : t('it.requests.emptyFiltered')}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <TableContainer label={t('it.requests.tableLabel')} className="rounded-none border-x-0 border-b-0">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>{t('it.columns.request')}</TableHeaderCell>
                        <TableHeaderCell>{t('it.columns.person')}</TableHeaderCell>
                        <TableHeaderCell>{t('it.columns.reason')}</TableHeaderCell>
                        <TableHeaderCell>{t('it.columns.status')}</TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shown.map((r) => (
                        <TableRow key={r.id} className="relative cursor-pointer">
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col gap-0.5">
                              <Link
                                to={`/it/requests/${r.id}`}
                                // Stretched link: the whole row opens the request, no underline (D-94)
                                className="text-title-small text-on-surface tabular-nums outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
                              >
                                {r.id}
                              </Link>
                              <span className="text-body-small text-on-surface-variant tabular-nums">
                                {formatDateTime(r.createdAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-72">
                            <PersonCell request={r} person={requester(r, people)} />
                          </TableCell>
                          <TableCell className="text-body-medium">{t(`accessHelp.reasons.${r.reason}`)}</TableCell>
                          <TableCell>
                            <RequestStatusPill status={r.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </div>

              {/* Below 1024 px: compact rows, the whole row opens the request (2.7) */}
              <ul className="flex flex-col divide-y divide-outline-variant border-t border-outline-variant lg:hidden">
                {shown.map((r) => {
                  const person = requester(r, people);
                  return (
                    <li key={r.id} className="relative flex min-w-0 items-center gap-3 px-4 py-4">
                      <RequestAvatar person={person} />
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <Link
                          to={`/it/requests/${r.id}`}
                          className="truncate text-title-small text-on-surface after:absolute after:inset-0 after:content-['']"
                        >
                          {person?.name ?? r.email}
                        </Link>
                        <span className="truncate text-body-small text-on-surface-variant">
                          {t(`accessHelp.reasons.${r.reason}`)}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <RequestStatusPill status={r.status} />
                          <span className="text-body-small text-on-surface-variant tabular-nums">
                            {r.id} · {formatDateTime(r.createdAt)}
                          </span>
                        </span>
                      </div>
                      <Icon name="chevron_right" className="shrink-0 text-on-surface-variant" />
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}

function RequestAvatar({ person }: { person: Person | undefined }) {
  if (person) return <Avatar name={person.name} role={person.role} size="sm" />;
  // A request whose email matches nobody at Nortia: a neutral icon, no invented initials.
  return (
    <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-container">
      <Icon name="person" size={18} className="text-on-surface-variant" />
    </span>
  );
}

function PersonCell({ request, person }: { request: AccessRequest; person: Person | undefined }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-w-0 items-center gap-3">
      <RequestAvatar person={person} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-title-small text-on-surface" title={person?.name ?? request.email}>
          {person?.name ?? t('it.unknownPerson')}
        </span>
        <span className="truncate text-body-small text-on-surface-variant" title={request.email}>
          {request.email}
        </span>
      </div>
    </div>
  );
}
