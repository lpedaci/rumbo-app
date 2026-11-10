import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';

/** Temporary 404. Becomes G7 (access denied / not found) in step 4. */
export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <PageShell>
      <h1 className="text-headline-small text-on-surface">{t('notFound.title')}</h1>
      <p className="text-body-large text-on-surface-variant">{t('notFound.body')}</p>
      <Button asChild className="w-fit">
        <Link to="/">{t('notFound.backHome')}</Link>
      </Button>
    </PageShell>
  );
}
