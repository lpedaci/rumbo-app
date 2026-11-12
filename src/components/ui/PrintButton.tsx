import { useTranslation } from 'react-i18next';
import { Button } from './Button';

/**
 * Print or save as PDF (F16): opens the browser's print dialog. The print styles hide the menu,
 * the top bar and every control marked `data-print-hide`, this button included.
 */
export function PrintButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <Button
      variant="outlined"
      leadingIcon="print"
      data-print-hide
      aria-label={t('ui.printLabel')}
      className={className}
      onClick={() => window.print()}
    >
      {t('ui.print')}
    </Button>
  );
}
