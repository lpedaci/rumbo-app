import { Trans, useTranslation } from 'react-i18next';
import { RefChip } from '@/components/ui/RefChip';
import { cn } from '@/lib/utils';
import { SectionHeading } from './SectionHeading';

/** One role color per step (D-72): the steps read as a sequence, not as one block. */
const STEP_COLOR = ['bg-role-hr', 'bg-role-manager', 'bg-role-hire'];

/** G0 · "Recorre la demo en tres pasos" (D-71, reference "simple to set up"): numbered steps. */
export function StepsSection() {
  const { t } = useTranslation();
  const items = t('home.steps.items', { returnObjects: true }) as {
    title: string;
    body: string;
  }[];

  return (
    <section aria-labelledby="steps-title" className="flex flex-col gap-10">
      <SectionHeading
        id="steps-title"
        eyebrow={t('home.steps.eyebrow')}
        title={t('home.steps.title')}
        highlight={t('home.steps.titleHighlight')}
        subtitle={t('home.steps.subtitle')}
      />
      <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        {items.map((item, i) => (
          <li
            key={item.title}
            className="flex min-w-0 flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
          >
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-md text-title-medium text-on-primary tabular-nums',
                  STEP_COLOR[i],
                )}
              >
                {i + 1}
              </span>
              <h3 className="text-title-medium text-on-surface">{item.title}</h3>
            </div>
            <p className="text-body-medium text-on-surface-variant">
              <Trans i18nKey={`home.steps.items.${i}.body`} components={{ viewAs: <RefChip icon="swap_horiz" /> }} />
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
