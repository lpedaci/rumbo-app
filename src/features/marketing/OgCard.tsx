import { useTranslation } from 'react-i18next';
import heroHire from '@/assets/home/hero-hire.jpg';
import heroHr from '@/assets/home/hero-hr.jpg';
import heroManager from '@/assets/home/hero-manager.jpg';
import { Logo } from '@/components/layout/Logo';
import { withHighlight } from '@/features/home/SectionHeading';
import { cn } from '@/lib/utils';

/** The three role homes of the G0 hero (D-122, D-123): Sofía and Martín behind, Carla in front. */
const SCREENS = [
  { src: heroHire, className: 'left-0 top-10 w-[44%]', front: false },
  { src: heroManager, className: 'right-0 top-10 w-[44%]', front: false },
  { src: heroHr, className: 'left-[23%] top-0 w-[54%]', front: true },
];

/**
 * Open Graph card (D-76, D-133): the 1200 × 630 image that social networks and messaging apps
 * show when the demo link is shared. The same composition as the G0 hero: label, title with
 * the key words in primary and the three small screens fading out downwards with a
 * transparency mask (not a colored gradient, 2.2), on the white page with the faint grid.
 * Rendered at /og-card (development only) and captured to public/og-image.png with `npm run og`.
 */
export function OgCard() {
  const { t } = useTranslation();

  return (
    <div
      data-og-card
      className="bg-texture-grid relative flex h-[630px] w-[1200px] flex-col items-center overflow-hidden bg-surface-container-lowest px-16 pt-12"
    >
      <div className="absolute top-10 left-12">
        <Logo />
      </div>
      <p className="mt-14 text-title-medium text-primary">{t('home.eyebrow')}</p>
      {/* Image asset, not interface text: one larger size so the title reads in a thumbnail. */}
      <p className="mt-4 max-w-[60rem] text-center text-[3.25rem] leading-[1.1] font-semibold tracking-[-0.02em] text-balance text-on-surface">
        {withHighlight(t('home.title'), t('home.titleHighlight'))}
      </p>
      <div className="relative mt-10 h-[22rem] w-[58rem] [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]">
        {SCREENS.map((screen) => (
          <div
            key={screen.src}
            className={cn(
              'absolute overflow-hidden rounded-lg border border-outline-variant bg-surface p-1',
              screen.front ? 'z-10 shadow-elevation-1' : 'z-0',
              screen.className,
            )}
          >
            <img src={screen.src} alt="" className="aspect-[16/10] w-full rounded-md object-cover object-top" />
          </div>
        ))}
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
