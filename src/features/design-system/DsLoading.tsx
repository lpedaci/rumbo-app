import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterChip } from '@/components/ui/FilterChip';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import type { PageKind } from '@/lib/page-kind';

const KINDS: PageKind[] = ['dashboard', 'list', 'cards', 'detail', 'form', 'steps'];

/**
 * Loading states (D-140): one skeleton per page template, shown live with the real component.
 * Chips choose the template (mutually exclusive, 2.1.3); the frame is the page background with
 * the white cards on top, as in the product.
 */
export function LoadingSection() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<PageKind>('dashboard');

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label={t('designSystem.loading.choose')} className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <FilterChip key={k} label={t(`designSystem.loading.kinds.${k}.name`)} selected={kind === k} onClick={() => setKind(k)} />
        ))}
      </div>
      <p className="text-body-medium text-on-surface-variant" aria-live="polite">
        {t(`designSystem.loading.kinds.${kind}.body`)}
      </p>
      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface p-4 md:p-6">
        <PageSkeleton kind={kind} preview />
      </div>
      <ul className="grid grid-cols-1 gap-(--space-bento-gap) md:grid-cols-3">
        {(t('designSystem.loading.rules', { returnObjects: true }) as [string, string][]).map(([title, body]) => (
          <li key={title} className="flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-5">
            <h3 className="text-title-medium text-on-surface">{title}</h3>
            <p className="text-body-medium text-on-surface-variant">{body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
