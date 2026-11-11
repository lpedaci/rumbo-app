import { forwardRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { SectionHeading } from './SectionHeading';

/** Small decorative scene made of Rumbo pieces (2.2.1, pattern 9): no stock illustrations. */
function Scene({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden className="flex h-40 items-center justify-center overflow-hidden rounded-lg bg-surface-container p-4">
      {children}
    </div>
  );
}

function SkeletonRow({ w }: { w: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest p-2">
      <span className="size-4 shrink-0 rounded-full border-2 border-outline" />
      <span className="h-2 rounded-full bg-outline-variant" style={{ width: w }} />
    </div>
  );
}

/** G0 · "El problema" (D-70): three pains of an onboarding without a journey. */
export const ProblemSection = forwardRef<HTMLHeadingElement>(function ProblemSection(_, ref) {
  const { t } = useTranslation();
  const items = t('home.problem.items', { returnObjects: true }) as {
    title: string;
    body: string;
  }[];

  const scenes = [
    <Scene key="today">
      <div className="relative flex w-full max-w-52 flex-col gap-2">
        <SkeletonRow w="70%" />
        <SkeletonRow w="50%" />
        <SkeletonRow w="60%" />
        <span className="absolute -top-3 -right-2 inline-flex items-center gap-1 rounded-md bg-inverse-surface px-2 py-1 text-label-medium text-inverse-on-surface">
          <Icon name="help" size={16} />
          {t('home.problem.illo.question')}
        </span>
      </div>
    </Scene>,
    <Scene key="blocked">
      <div className="flex w-full max-w-56 flex-col items-stretch gap-2">
        <div className="flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest p-2 text-label-medium text-on-surface">
          <Icon name="key" size={16} className="text-on-surface-variant" />
          <span className="truncate">{t('home.solution.illo.tasks.1')}</span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-warning">
            <Icon name="schedule" size={16} />
          </span>
        </div>
        <span className="mx-auto h-4 w-px bg-outline" />
        <div className="flex items-center gap-2 rounded-md border border-dashed border-outline bg-surface-container-lowest p-2 text-label-medium text-on-surface-variant">
          <Icon name="lock" size={16} />
          <span className="truncate">{t('home.solution.illo.tasks.2')}</span>
          <span className="ml-auto shrink-0 rounded-full bg-warning-container px-2 text-on-warning-container">
            {t('home.problem.illo.blocked')}
          </span>
        </div>
        <p className="text-center text-label-medium text-on-surface-variant">{t('home.problem.illo.waiting')}</p>
      </div>
    </Scene>,
    <Scene key="late">
      <div className="flex w-full max-w-52 flex-col gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-3">
        <div className="flex h-14 items-end gap-1.5">
          {[30, 45, 40, 60, 35, 25, 20].map((h, i) => (
            <span key={i} className="flex-1 rounded-t-sm bg-outline-variant" style={{ height: `${h}%` }} />
          ))}
        </div>
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-error-container px-2 py-0.5 text-label-medium text-on-error-container">
          <Icon name="error" size={16} className="text-error" />
          {t('home.problem.illo.late')}
        </span>
      </div>
    </Scene>,
  ];

  return (
    <section aria-labelledby="problem-title" className="flex flex-col gap-10">
      <SectionHeading
        ref={ref}
        id="problem-title"
        eyebrow={t('home.problem.eyebrow')}
        title={t('home.problem.title')}
        subtitle={t('home.problem.subtitle')}
      />
      <ul className="grid grid-cols-1 gap-(--space-bento-gap) md:grid-cols-3">
        {items.map((item, i) => (
          <li
            key={item.title}
            className="flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 pb-5"
          >
            {scenes[i]}
            <div className="flex flex-col gap-1 px-2">
              <h3 className="text-title-medium text-on-surface">{item.title}</h3>
              <p className="text-body-medium text-on-surface-variant">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
});
