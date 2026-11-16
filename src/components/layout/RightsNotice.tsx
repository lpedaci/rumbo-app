import { useTranslation } from 'react-i18next';
import { LICENSE_URL } from '@/app/links';
import { cn } from '@/lib/utils';

/**
 * Authorship and rights (D-144), at the foot of every screen: "© 2026 Lourdes Pedaci · Todos los
 * derechos reservados" with a link to the LICENSE of the repository, as in Alcancía. Body small on
 * on-surface-variant (AA on every surface); the link sits inside the sentence (WCAG 2.5.8).
 */
export function RightsNotice({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <p className={cn('text-body-small text-on-surface-variant', className)}>
      {t('rights.notice')} ·{' '}
      <a
        href={LICENSE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xs text-primary underline underline-offset-2 hover:no-underline"
      >
        {t('rights.license')}
        <span className="sr-only"> {t('rights.newTab')}</span>
      </a>
    </p>
  );
}

/** The notice as the footer of a layout; hidden when printing. */
export function RightsFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('print:hidden', className)}>
      <RightsNotice />
    </footer>
  );
}
