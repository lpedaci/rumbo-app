import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/layout/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { IconTile } from '@/components/ui/IconTile';
import { Sparkline } from '@/components/ui/Sparkline';
import { withHighlight } from '@/features/home/SectionHeading';
import { formatNumber, formatPercent } from '@/lib/dates';
import { progressOf } from '@/lib/journey';
import { kpis } from '@/lib/metrics';
import { useDataStore } from '@/store/data-store';

const CARD = 'flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-5 shadow-elevation-1';

/**
 * Open Graph card (D-76): the 1200 × 630 image that social networks and messaging apps
 * show when the demo link is shared. Built with Rumbo's own pieces and demo data, on the
 * white page with the hero grid, like G0. Rendered at /og-card (development only) and
 * captured to public/og-image.png with `npm run og`.
 */
export function OgCard() {
  const { t } = useTranslation();
  const hires = useDataStore((s) => s.hires);
  const people = useDataStore((s) => s.people);
  const k = kpis(hires);
  const sofia = hires.find((h) => h.personId === 'p-sofia');
  const sofiaPerson = people.find((p) => p.id === 'p-sofia');
  const progress = sofia ? progressOf(sofia.tasks) : { done: 0, total: 0, percent: 0 };

  return (
    <div
      data-og-card
      className="bg-texture-grid relative flex h-[630px] w-[1200px] overflow-hidden bg-surface-container-lowest p-16"
    >
      <div className="flex w-[640px] flex-col justify-between">
        <Logo />
        <div className="flex flex-col gap-6">
          <p className="text-title-medium text-primary">{t('home.eyebrow')}</p>
          {/* Image asset, not interface text: one larger size so the title reads in a thumbnail. */}
          <p className="text-[3.5rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance text-on-surface">
            {withHighlight(t('home.title'), t('home.titleHighlight'))}
          </p>
        </div>
        <p className="text-title-medium text-on-surface-variant">{t('home.author').replace(/^[^:]+:\s*/, '')}</p>
      </div>

      <div className="relative flex-1">
        <div className={`${CARD} absolute top-8 right-0 w-72`}>
          <div className="flex items-center justify-between">
            <span className="text-label-large text-on-surface-variant">{t('home.showcase.preview.onTime')}</span>
            <IconTile icon="task_alt" size="sm" />
          </div>
          <span className="text-display-small text-on-surface tabular-nums">{formatPercent(k.onTimeRate)}</span>
          <Sparkline values={[52, 58, 55, 63, 61, 70, 68, Math.round(k.onTimeRate)]} className="h-12 w-full" />
        </div>
        <div className={`${CARD} absolute top-[13.5rem] left-4 w-60`}>
          <div className="flex items-center gap-3">
            <IconTile icon="group" size="sm" tone="tertiary" />
            <span className="text-label-large text-on-surface-variant">{t('home.preview.kpiActive')}</span>
          </div>
          <span className="text-display-small text-on-surface tabular-nums">{formatNumber(k.activeHires)}</span>
        </div>
        <div className={`${CARD} absolute right-0 bottom-6 w-80`}>
          <div className="flex items-center gap-3">
            {sofiaPerson && <Avatar name={sofiaPerson.name} role={sofiaPerson.role} size="md" />}
            <div className="flex flex-col">
              <span className="text-title-small text-on-surface">{sofiaPerson?.name}</span>
              <span className="text-body-small text-on-surface-variant tabular-nums">
                {t('journey.progress.tasksDone', { done: progress.done, total: progress.total })}
              </span>
            </div>
          </div>
          <span className="h-2.5 overflow-hidden rounded-full bg-outline-variant">
            <span className="block h-full bg-primary" style={{ width: `${progress.percent}%` }} />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Square app icon (D-76): the logo mark on the brand color, captured for touch icons and the manifest. */
export function AppIconCard() {
  return (
    <div data-app-icon className="flex size-[512px] items-center justify-center bg-primary">
      <svg viewBox="0 0 32 32" className="size-[340px]" aria-hidden>
        <path d="M9 23c0-6 4-9 9-9h3" fill="none" strokeWidth="2.5" strokeLinecap="round" className="stroke-on-primary" />
        <path
          d="M19 10.5 23 14l-4 3.5"
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-on-primary"
        />
      </svg>
    </div>
  );
}

/** Development page that renders both cards for capture. */
export function OgCardPage() {
  return (
    <div className="flex flex-col items-start gap-10 bg-surface p-10">
      <OgCard />
      <AppIconCard />
    </div>
  );
}
