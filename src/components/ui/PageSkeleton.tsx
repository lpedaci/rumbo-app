import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { PageKind } from '@/lib/page-kind';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

/**
 * Loading state of a screen (2.6, D-131, D-140): gray blocks in the shape of the page that is
 * coming, on the same white cards, so the person knows what to expect. One per page template of
 * the information architecture: panel, listing, catalog, record, form and step flow. The blocks
 * follow the type roles (a title block is as tall as its line) and the real radii. Announced once
 * to screen readers; the pulse stops with reduced motion (global CSS).
 */
export function PageSkeleton({
  kind = 'list',
  standalone = false,
  preview = false,
}: {
  kind?: PageKind;
  standalone?: boolean;
  /** Shown as an example (design system site): not announced and without the full-screen height. */
  preview?: boolean;
}) {
  const { t } = useTranslation();
  const body = {
    dashboard: <DashboardSkeleton />,
    list: <ListSkeleton />,
    cards: <CardsSkeleton />,
    detail: <DetailSkeleton />,
    form: <FormSkeleton />,
    steps: <StepsSkeleton full={!preview} />,
  }[kind];

  return (
    <div
      role={preview ? undefined : 'status'}
      aria-live={preview ? undefined : 'polite'}
      aria-hidden={preview || undefined}
      data-page-skeleton={kind}
      className={cn(
        'flex w-full min-w-0 flex-col',
        standalone && kind !== 'steps' && 'mx-auto max-w-6xl px-(--space-gutter) py-10',
      )}
    >
      {!preview && <span className="sr-only">{t('ui.loading')}</span>}
      {body}
    </div>
  );
}

/** White card of the product (2.5): surface, subtle border, no shadow. */
function SkeletonCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-(--space-card-padding)',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Page title (headline-small) and its purpose line (body-large), like PageHeader. */
function HeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="mb-(--space-section) flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-5 w-[32rem] max-w-full" />
      </div>
      {action && <Skeleton className="h-10 w-48 max-w-full rounded-sm" />}
    </div>
  );
}

/** A row of a listing: avatar, two lines and the status pill on the right. */
function RowSkeleton({ wide }: { wide?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-outline-variant py-3 last:border-b-0">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className={cn('h-4 max-w-full', wide ? 'w-56' : 'w-40')} />
        <Skeleton className="h-3 w-64 max-w-full" />
      </div>
      <Skeleton className="hidden h-6 w-24 shrink-0 rounded-full sm:block" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* Greeting: date, title and context chips (2.2.1, pattern 2) */}
      <div className="mb-(--space-section) flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-72 max-w-full md:h-10" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-8 w-36 rounded-full" />
        </div>
      </div>
      <div className="flex flex-col gap-(--space-bento-gap)">
        {/* KPIs: icon tile, label, number and pill (pattern 3) */}
        <div className="grid grid-cols-2 gap-(--space-bento-gap) md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i}>
              <Skeleton className="size-10 rounded-md" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3 w-24 max-w-full" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </SkeletonCard>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-3">
          {/* Main chart */}
          <SkeletonCard className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-md" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-64 max-w-full" />
              </div>
            </div>
            <Skeleton className="h-44 w-full rounded-md md:h-56" />
          </SkeletonCard>
          {/* Alerts or next items */}
          <SkeletonCard>
            <Skeleton className="h-4 w-28" />
            <div className="flex flex-col">
              {[0, 1, 2].map((i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          </SkeletonCard>
        </div>
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <SkeletonCard>
        {/* Search and filters */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-12 w-full rounded-sm md:h-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-36 rounded-sm" />
          <Skeleton className="h-10 w-36 rounded-sm" />
          <Skeleton className="hidden h-10 w-36 rounded-sm sm:block" />
        </div>
        <div className="flex flex-col">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <RowSkeleton key={i} wide={i % 2 === 0} />
          ))}
        </div>
      </SkeletonCard>
    </>
  );
}

function CardsSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <div className="grid grid-cols-1 gap-(--space-bento-gap) sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonCard key={i}>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0 rounded-md" />
              <Skeleton className="h-5 w-40 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="flex items-center justify-between border-t border-outline-variant pt-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </>
  );
}

/** Label and value on one line, as in the "Detalles" lists (pattern 14). */
function DetailRowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 border-b border-outline-variant py-3 last:border-b-0">
          <Skeleton className="h-4 w-24" />
          <Skeleton className={cn('h-4', i % 2 ? 'w-32' : 'w-40')} />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <>
      {/* DetailHeader (pattern 28): photo next to the name, chips, title and purpose line */}
      <div className="mb-(--space-section) flex min-w-0 flex-col gap-3">
        <Skeleton className="h-4 w-36" />
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-8 w-64 max-w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
            </div>
          </div>
        </div>
        <Skeleton className="h-5 w-[28rem] max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-3">
        <SkeletonCard className="lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <div className="flex flex-col">
            {[0, 1, 2, 3].map((i) => (
              <RowSkeleton key={i} wide={i % 2 === 1} />
            ))}
          </div>
        </SkeletonCard>
        <SkeletonCard>
          <Skeleton className="h-5 w-24" />
          <DetailRowsSkeleton />
        </SkeletonCard>
      </div>
    </>
  );
}

/** A field: label, input and supporting text (2.10), 8 px apart. */
function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-12 w-full rounded-sm md:h-10" />
      <Skeleton className="h-3 w-64 max-w-full" />
    </div>
  );
}

function FormSkeleton() {
  return (
    <>
      <HeaderSkeleton action={false} />
      <SkeletonCard className="max-w-3xl gap-6">
        <Skeleton className="h-5 w-40" />
        <FieldSkeleton />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
        <FieldSkeleton />
        {/* Anchored footer (pattern 17): note on the left, actions on the right */}
        <div className="-mx-(--space-card-padding) -mb-(--space-card-padding) flex flex-col gap-3 border-t border-outline-variant px-(--space-card-padding) py-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-3 w-48 max-w-full" />
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Skeleton className="h-10 w-full rounded-sm sm:w-28" />
            <Skeleton className="h-10 w-full rounded-sm sm:w-36" />
          </div>
        </div>
      </SkeletonCard>
    </>
  );
}

function StepsSkeleton({ full }: { full: boolean }) {
  return (
    <div className={cn('flex items-center justify-center', full && 'min-h-dvh px-(--space-gutter) py-10')}>
      <div className="flex w-full max-w-xl flex-col gap-8">
        {/* Logo, title and context, then the step card */}
        <Skeleton className="h-8 w-40" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
        <SkeletonCard className="gap-6">
          <Skeleton className="h-12 w-full rounded-sm" />
          <Skeleton className="h-12 w-full rounded-sm" />
          <FieldSkeleton />
          <Skeleton className="h-12 w-full rounded-sm md:h-10" />
        </SkeletonCard>
      </div>
    </div>
  );
}
