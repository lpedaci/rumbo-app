import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';

/** Temporary home page. Replaced by the login (G1) in step 4. */
export function PlaceholderPage() {
  const { t } = useTranslation();

  return (
    <PageShell>
      <p className="text-label-large text-primary">
        {t('app.name')} · {t('app.company')}
      </p>
      <h1 className="text-headline-small text-balance text-on-surface">{t('placeholder.title')}</h1>
      <p className="text-body-large text-on-surface-variant">{t('placeholder.body')}</p>
      <p className="rounded-md border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-medium text-on-surface-variant">
        {t('placeholder.status')}
      </p>
      <p role="note" className="text-body-small text-on-surface-variant">
        {t('app.demoNotice')}
      </p>
    </PageShell>
  );
}
