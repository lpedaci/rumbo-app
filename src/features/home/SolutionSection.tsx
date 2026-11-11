import { forwardRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { Sparkline } from '@/components/ui/Sparkline';
import { formatPercent } from '@/lib/dates';
import { kpis } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { useDataStore } from '@/store/data-store';
import { SectionHeading } from './SectionHeading';

/** Decorative mini interface built with Rumbo's own pieces (2.2.1, pattern 9). */
function Scene({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div aria-hidden className={cn('flex h-44 items-center justify-center overflow-hidden rounded-lg p-4', className)}>
      {children}
    </div>
  );
}

function Card({
  title,
  body,
  scene,
  tint,
  className,
}: {
  title: string;
  body: string;
  scene: ReactNode;
  tint?: string;
  className?: string;
}) {
  return (
    <li
      className={cn(
        'flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 pb-5',
        className,
      )}
    >
      <div className={cn('rounded-lg', tint)}>{scene}</div>
      <div className="flex flex-col gap-1 px-2">
        <h3 className="text-title-medium text-on-surface">{title}</h3>
        <p className="text-body-medium text-on-surface-variant">{body}</p>
      </div>
    </li>
  );
}

/** G0 · "La solución" (D-70): what Rumbo does, in a bento of five cards with mini interfaces. */
export const SolutionSection = forwardRef<HTMLHeadingElement>(function SolutionSection(_, ref) {
  const { t } = useTranslation();
  const hires = useDataStore((s) => s.hires);
  const items = t('home.solution.items', { returnObjects: true }) as {
    title: string;
    body: string;
  }[];
  const stages = t('home.solution.illo.stages', {
    returnObjects: true,
  }) as string[];
  const tasks = t('home.solution.illo.tasks', {
    returnObjects: true,
  }) as string[];
  const milestones = t('home.solution.illo.milestones', {
    returnObjects: true,
  }) as string[];
  const chips = t('home.solution.illo.chips', {
    returnObjects: true,
  }) as string[];
  const onTime = kpis(hires).onTimeRate;

  const scenes = [
    // Journey timeline
    <Scene key="timeline">
      <div className="flex w-full max-w-64 flex-col gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-3">
        <div className="relative grid grid-cols-4 gap-1 pt-6">
          <span className="absolute top-0 left-[58%] rounded-sm bg-tertiary px-1.5 text-label-small text-on-tertiary">
            {t('home.solution.illo.today')}
          </span>
          <span className="absolute top-4 bottom-0 left-[64%] w-px bg-tertiary" />
          {[100, 85, 60, 0].map((fill, i) => (
            <span key={i} className="h-2 overflow-hidden rounded-full bg-outline-variant">
              <span className="block h-full bg-primary" style={{ width: `${fill}%` }} />
            </span>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1 text-label-small text-on-surface-variant">
          {stages.map((s) => (
            <span key={s} className="truncate">
              {s}
            </span>
          ))}
        </div>
      </div>
    </Scene>,
    // Template builder
    <Scene key="builder">
      <ul className="flex w-full max-w-60 flex-col gap-2">
        {tasks.map((task, i) => (
          <li
            key={task}
            className={cn(
              'flex items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest p-2 text-label-medium text-on-surface',
              i === 1 && 'translate-x-3 border-primary shadow-elevation-2',
            )}
          >
            <Icon name="drag_indicator" size={16} className="text-on-surface-variant" />
            <span className="truncate">{task}</span>
            <span className="ml-auto shrink-0 tabular-nums text-on-surface-variant">{['-3', '+1', '+9'][i]}</span>
          </li>
        ))}
      </ul>
    </Scene>,
    // Check-in milestones
    <Scene key="checkin">
      <ul className="flex w-full max-w-60 flex-col gap-2 rounded-md border border-outline-variant bg-surface-container-lowest p-3">
        {milestones.map((m, i) => (
          <li key={m} className="flex items-center gap-2 text-label-medium text-on-surface">
            <Icon name="flag" size={16} className="shrink-0 text-tertiary" />
            <span className="truncate">{m}</span>
            <span
              className={cn(
                'ml-auto shrink-0 rounded-full px-2 text-label-small',
                i < 2
                  ? 'bg-success-container text-on-success-container'
                  : 'bg-warning-container text-on-warning-container',
              )}
            >
              {i < 2 ? t('home.solution.illo.met') : t('home.solution.illo.partial')}
            </span>
          </li>
        ))}
      </ul>
    </Scene>,
    // Tracking dashboard (real metric from the demo data)
    <Scene key="dashboard">
      <div className="grid w-full max-w-md grid-cols-[auto_1fr] items-center gap-4 rounded-md border border-outline-variant bg-surface-container-lowest p-4">
        <div className="flex flex-col gap-1">
          <span className="text-label-medium text-on-surface-variant">{t('home.solution.illo.onTime')}</span>
          <span className="text-headline-small text-on-surface tabular-nums">{formatPercent(onTime)}</span>
        </div>
        <Sparkline values={[52, 58, 55, 63, 61, 70, 68, onTime]} tone="primary" className="h-16 w-full" />
        <div className="col-span-2 flex h-10 items-end gap-1.5">
          {[40, 65, 35, 80, 55, 30].map((h, i) => (
            <span
              key={i}
              className={cn('flex-1 rounded-t-sm', i === 3 ? 'bg-tertiary' : 'bg-primary/70')}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </Scene>,
    // Security
    <Scene key="security">
      <div className="flex w-full max-w-56 flex-col gap-3 rounded-md border border-outline-variant bg-surface-container-lowest p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary-container text-primary">
            <Icon name="verified_user" size={20} />
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label-small text-on-surface-variant">{t('home.solution.illo.code')}</span>
            <span className="text-title-small tracking-widest text-on-surface tabular-nums">246 810</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-surface-container-high px-2 text-label-small text-on-surface">
              {c}
            </span>
          ))}
        </div>
      </div>
    </Scene>,
  ];

  // Bento: three equal cards, then a wide one and a narrow one (2.4).
  const spans = ['md:col-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-4', 'md:col-span-2'];
  // Each scene on its own tint so the bento is not monochrome (D-72).
  const tints = [
    'bg-band-petrol',
    'bg-role-hire-container',
    'bg-band-plum',
    'bg-role-it-container',
    'bg-surface-container',
  ];

  return (
    <section aria-labelledby="solution-title" className="flex flex-col gap-10">
      <SectionHeading
        ref={ref}
        id="solution-title"
        eyebrow={t('home.solution.eyebrow')}
        title={t('home.solution.title')}
        subtitle={t('home.solution.subtitle')}
      />
      <ul className="grid grid-cols-1 gap-(--space-bento-gap) md:grid-cols-6">
        {items.map((item, i) => (
          <Card
            key={item.title}
            title={item.title}
            body={item.body}
            scene={scenes[i]}
            tint={tints[i]}
            className={spans[i]}
          />
        ))}
      </ul>
    </section>
  );
});
