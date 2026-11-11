import { useTranslation } from 'react-i18next';
import { SectionHeading } from './SectionHeading';

/** G0 · "Recorre la demo en tres pasos" (D-71, reference "simple to set up"): numbered steps. */
export function StepsSection() {
  const { t } = useTranslation();
  const items = t('home.steps.items', { returnObjects: true }) as { title: string; body: string }[];

  return (
    <section aria-labelledby="steps-title" className="flex flex-col gap-10">
      <SectionHeading
        id="steps-title"
        eyebrow={t('home.steps.eyebrow')}
        title={t('home.steps.title')}
        subtitle={t('home.steps.subtitle')}
      />
      <ol className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        {items.map((item, i) => (
          <li key={item.title} className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-title-medium text-on-primary tabular-nums"
              >
                {i + 1}
              </span>
              <h3 className="text-title-medium text-on-surface">{item.title}</h3>
            </div>
            <p className="text-body-medium text-on-surface-variant">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
