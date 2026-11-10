import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageShell';

/** Temporary home page for step 1. Replaced by the login (G1) in step 4. */
export function PlaceholderPage() {
  const { t } = useTranslation();

  return (
    <PageShell>
      <p className="text-sm font-medium tracking-wide text-[#1F6F78] uppercase">
        {t('app.name')} · {t('app.company')}
      </p>
      <h1 className="text-2xl leading-8 font-semibold text-balance">{t('placeholder.title')}</h1>
      <p className="text-base text-[#4B5563]">{t('placeholder.body')}</p>
      <p className="rounded-lg border border-[#D5DBE0] bg-white px-4 py-3 text-sm text-[#4B5563]">
        {t('placeholder.status')}
      </p>
      <p role="note" className="text-sm text-[#4B5563]">
        {t('app.demoNotice')}
      </p>
    </PageShell>
  );
}
