import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageShell } from '@/components/layout/PageShell';

/** Temporary 404 for step 1. Becomes G7 (access denied / not found) in step 4. */
export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <PageShell>
      <h1 className="text-2xl leading-8 font-semibold">{t('notFound.title')}</h1>
      <p className="text-base text-[#4B5563]">{t('notFound.body')}</p>
      <Link
        to="/"
        className="inline-flex min-h-12 w-fit items-center rounded-lg bg-[#1F6F78] px-5 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F6F78] sm:min-h-10"
      >
        {t('notFound.backHome')}
      </Link>
    </PageShell>
  );
}
