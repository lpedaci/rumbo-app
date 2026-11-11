import { Accordion } from 'radix-ui';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from './SectionHeading';

/**
 * G0 · Frequently asked questions (D-70): Radix accordion (buttons with aria-expanded,
 * keyboard support), numbered rows as in the reference, one answer open at a time.
 */
export const FaqSection = forwardRef<HTMLHeadingElement>(function FaqSection(_, ref) {
  const { t } = useTranslation();
  const items = t('home.faq.items', { returnObjects: true }) as {
    q: string;
    a: string;
  }[];

  return (
    <section aria-labelledby="faq-title" className="flex flex-col gap-10">
      <SectionHeading
        ref={ref}
        id="faq-title"
        eyebrow={t('home.faq.eyebrow')}
        title={t('home.faq.title')}
        subtitle={t('home.faq.subtitle')}
      />
      <Accordion.Root type="single" collapsible className="flex w-full flex-col gap-2">
        {items.map((item, i) => (
          <Accordion.Item
            key={item.q}
            value={`faq-${i}`}
            className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest data-[state=open]:border-outline"
          >
            <Accordion.Header asChild>
              <h3>
                <Accordion.Trigger className="group flex min-h-14 w-full items-center gap-4 px-4 py-3 text-left text-title-small text-on-surface hover:bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
                  <span aria-hidden className="shrink-0 text-label-large text-on-surface-variant tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 flex-1">{item.q}</span>
                  <Icon
                    name="keyboard_arrow_down"
                    className="shrink-0 text-on-surface-variant transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
                  />
                </Accordion.Trigger>
              </h3>
            </Accordion.Header>
            <Accordion.Content className="px-4 pb-4 pl-13 text-body-medium text-on-surface-variant">
              {item.a}
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </section>
  );
});
