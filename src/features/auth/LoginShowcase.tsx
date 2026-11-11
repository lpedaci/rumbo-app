import { useTranslation } from 'react-i18next';
import { ProductPreview } from '@/features/home/ProductPreview';

/**
 * Right panel of the login (G1, reference e97bf4eb, 2.2.1): a value sentence and the
 * product preview on a flat tinted surface. No gradients, no third-party brands.
 */
export function LoginShowcase() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-10">
      <div className="flex flex-col gap-3">
        <p className="text-headline-small text-balance text-on-primary-container">{t('auth.login.showcase.title')}</p>
        <p className="text-body-large text-on-primary-container">{t('auth.login.showcase.body')}</p>
      </div>
      <ProductPreview compact className="mr-4 mb-16" />
    </div>
  );
}
