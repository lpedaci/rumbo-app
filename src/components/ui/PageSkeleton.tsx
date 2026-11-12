import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';

/**
 * Loading state of a screen while its code arrives (lazy routes, D-131): the shape of a page
 * (title, purpose line and a bento of cards) with the soft pulse of 2.6, never a blank screen.
 * Announced once to screen readers; the pulse stops with reduced motion (global CSS).
 */
export function PageSkeleton({ standalone = false }: { standalone?: boolean }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex w-full min-w-0 flex-col gap-8', standalone && 'mx-auto max-w-6xl px-(--space-gutter) py-10')}
    >
      <span className="sr-only">{t('ui.loading')}</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-5 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-(--space-bento-gap) md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-(--space-bento-gap) lg:grid-cols-3">
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}
