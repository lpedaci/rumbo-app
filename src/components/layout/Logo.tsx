import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

/**
 * Rumbo mark: a path that turns towards a point, drawn with tokens.
 * Product logo + fictitious company name (CLAUDE.md F0). No third-party brands.
 */
export function Logo({
  showCompany = true,
  markOnly = false,
  className,
}: {
  showCompany?: boolean;
  /** Only the square mark (navigation rail). */
  markOnly?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden focusable="false">
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path
          d="M9 23c0-6 4-9 9-9h3"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-on-primary"
        />
        <path d="M19 10.5 23 14l-4 3.5" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-on-primary" />
      </svg>
      {!markOnly && (
      <span className="flex min-w-0 flex-col leading-none">
        <span className="text-title-medium text-on-surface">{t('app.name')}</span>
        {showCompany && <span className="truncate text-body-small text-on-surface-variant">{t('app.company')}</span>}
      </span>
      )}
    </span>
  );
}
