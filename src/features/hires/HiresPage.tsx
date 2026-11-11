import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { Icon } from '@/components/ui/Icon';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { formatDate, formatPercent } from '@/lib/dates';
import { countByStatus, filterHires, type HireStatusFilter, type HireSummary, summarizeHire } from '@/lib/hires';
import { checkinDueDate, CHECKIN_OFFSETS } from '@/lib/journey';
import { can, visibleHires } from '@/lib/permissions';
import { useDataStore } from '@/store/data-store';
import { useCurrentUser } from '@/store/session-store';
import { HireStatusPill, OverduePill } from './HireStatusPill';

const STATUS_FILTERS: HireStatusFilter[] = ['all', 'upcoming', 'active', 'completed'];

/**
 * A2 · Hires (CLAUDE.md F3): every journey with its status, progress, overdue tasks and
 * next check-in; filters by status and area. Table from 768 px, cards below (2.7).
 */
export function HiresPage() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const hires = useDataStore((s) => s.hires);
  const people = useDataStore((s) => s.people);
  const templates = useDataStore((s) => s.templates);
  const [status, setStatus] = useState<HireStatusFilter>('all');
  const [area, setArea] = useState('all');

  const summaries = visibleHires(user, hires).map((h) => summarizeHire(h, people, templates));
  const counts = countByStatus(summaries);
  const areas = [...new Set(summaries.map((s) => s.person?.area).filter((a): a is string => Boolean(a)))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
  const shown = filterHires(summaries, { status, area });
  const filtered = status !== 'all' || area !== 'all';

  const nextCheckinText = (s: HireSummary) =>
    s.nextCheckin
      ? `${t('hires.list.checkinLabel', { days: CHECKIN_OFFSETS[s.nextCheckin.stage] })} · ${formatDate(checkinDueDate(s.nextCheckin))}`
      : t('hires.list.noCheckin');

  return (
    <>
      <PageHeader
        title={t('hires.list.title')}
        description={t('hires.list.description')}
        actions={
          can(user, 'hire:create') && (
            <Button asChild leadingIcon="add">
              <Link to="/admin/hires/new">{t('hires.list.create')}</Link>
            </Button>
          )
        }
      />

      {/* One card: toolbar with the filters on top of the results, no loose blocks (D-78) */}
      <section
        aria-label={t('hires.list.tableLabel')}
        className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
      >
        <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label={t('hires.list.statusFilter')} className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((value) => (
              <FilterChip
                key={value}
                label={t(`hires.list.${value}`)}
                count={counts[value]}
                selected={status === value}
                onClick={() => setStatus(value)}
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* Filter, not data entry: label beside the control, no supporting text (D-78) */}
            <label className="flex items-center gap-2 text-label-large text-on-surface">
              {t('hires.list.area')}
              <span className="relative">
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="h-10 min-w-44 appearance-none rounded-sm border border-outline bg-surface-container-lowest pr-9 pl-3 text-body-medium text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <option value="all">{t('hires.list.allAreas')}</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <Icon
                  name="keyboard_arrow_down"
                  className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-on-surface-variant"
                />
              </span>
            </label>
            <p className="text-body-medium text-on-surface-variant tabular-nums" aria-live="polite">
              {t('hires.list.results', { count: shown.length })}
            </p>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="border-t border-outline-variant p-6">
            <div className="flex flex-col items-start gap-3">
              <Icon name="group" size={24} className="text-on-surface-variant" />
              <p className="text-body-large text-on-surface">
                {filtered ? t('hires.list.emptyFiltered') : t('hires.list.empty')}
              </p>
              {filtered && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setStatus('all');
                    setArea('all');
                  }}
                >
                  {t('hires.list.clearFilters')}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* From 768 px: table */}
            <div className="hidden md:block">
              <TableContainer label={t('hires.list.tableLabel')} className="rounded-none border-x-0 border-b-0">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>{t('hires.list.columns.person')}</TableHeaderCell>
                      <TableHeaderCell>{t('hires.list.columns.start')}</TableHeaderCell>
                      <TableHeaderCell>{t('hires.list.columns.status')}</TableHeaderCell>
                      <TableHeaderCell className="min-w-40">{t('hires.list.columns.progress')}</TableHeaderCell>
                      <TableHeaderCell>{t('hires.list.columns.overdue')}</TableHeaderCell>
                      <TableHeaderCell className="hidden xl:table-cell">
                        {t('hires.list.columns.checkin')}
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {shown.map((s) => (
                      <TableRow key={s.hire.id}>
                        <TableCell className="max-w-72">
                          <div className="flex min-w-0 items-center gap-3">
                            {s.person && <Avatar name={s.person.name} role={s.person.role} />}
                            <div className="flex min-w-0 flex-col">
                              <Link
                                to={`/admin/hires/${s.hire.id}`}
                                className="truncate rounded-xs text-title-small text-on-surface underline-offset-4 hover:underline"
                                title={s.person?.name}
                              >
                                {s.person?.name}
                              </Link>
                              <span
                                className="truncate text-body-small text-on-surface-variant"
                                title={s.person?.jobTitle}
                              >
                                {s.person?.jobTitle} · {s.person?.area}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">{formatDate(s.hire.startDate)}</TableCell>
                        <TableCell>
                          <HireStatusPill status={s.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ProgressBar
                              value={s.progress.percent}
                              label={t('hires.list.progressLabel', { name: s.person?.name ?? '' })}
                              className="w-24"
                            />
                            <span className="text-body-medium tabular-nums">{formatPercent(s.progress.percent)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <OverduePill count={s.overdue} />
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap text-body-medium text-on-surface-variant xl:table-cell">
                          {nextCheckinText(s)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>

            {/* Below 768 px: cards (2.7) */}
            <ul className="flex flex-col divide-y divide-outline-variant border-t border-outline-variant md:hidden">
              {shown.map((s) => (
                <li key={s.hire.id} className="relative flex flex-col gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {s.person && <Avatar name={s.person.name} role={s.person.role} />}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <Link
                        to={`/admin/hires/${s.hire.id}`}
                        className="truncate text-title-small text-on-surface after:absolute after:inset-0 after:content-['']"
                      >
                        {s.person?.name}
                      </Link>
                      <span className="truncate text-body-small text-on-surface-variant">{s.person?.jobTitle}</span>
                    </div>
                    <Icon name="chevron_right" className="shrink-0 text-on-surface-variant" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <HireStatusPill status={s.status} />
                    <OverduePill count={s.overdue} />
                  </div>
                  <ProgressBar
                    value={s.progress.percent}
                    label={t('hires.list.progressLabel', { name: s.person?.name ?? '' })}
                    valueText={formatPercent(s.progress.percent)}
                  />
                  <p className="text-body-small text-on-surface-variant tabular-nums">
                    {t(s.status === 'upcoming' ? 'hires.list.startsOn' : 'hires.list.startedOn', {
                      date: formatDate(s.hire.startDate),
                    })}{' '}
                    · {nextCheckinText(s)}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
