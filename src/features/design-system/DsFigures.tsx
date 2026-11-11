import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';

type Tone = 'token' | 'use' | 'check' | 'store';

const TONE: Record<Tone, string> = {
  token: 'border-primary/40 bg-primary-container text-on-primary-container',
  use: 'border-tertiary/40 bg-tertiary-container text-on-tertiary-container',
  check: 'border-success/40 bg-success-container text-on-success-container',
  store: 'border-outline-variant bg-surface-container text-on-surface',
};

function Node({ title, note, tone }: { title: string; note: string; tone: Tone }) {
  return (
    <li className={cn('flex min-w-0 flex-col gap-0.5 rounded-md border px-3 py-2', TONE[tone])}>
      <span className="text-label-large break-words">{title}</span>
      <span className="text-body-small opacity-80">{note}</span>
    </li>
  );
}

function Group({
  title,
  items,
  tone,
  className,
}: {
  title: string;
  items: string[][];
  tone: Tone;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-4',
        className,
      )}
    >
      <h4 className="text-title-small text-on-surface">{title}</h4>
      <ul className="flex flex-col gap-2">
        {items.map(([t, n]) => (
          <Node key={t} title={t!} note={n!} tone={tone} />
        ))}
      </ul>
    </section>
  );
}

/** Arrow between two figure blocks, with an optional label: down on phones, right from 1024 px. */
function Arrow({ label, vertical = false }: { label?: string; vertical?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'flex items-center justify-center gap-1 text-label-medium text-on-surface-variant',
        vertical ? 'flex-col py-1' : 'flex-col py-1 lg:flex-row lg:px-1 lg:py-0',
      )}
    >
      {label && <span className="text-center">{label}</span>}
      <Icon name={vertical ? 'arrow_downward' : 'arrow_downward'} size={20} className={cn(!vertical && 'lg:hidden')} />
      {!vertical && <Icon name="arrow_forward" size={20} className="hidden lg:block" />}
    </div>
  );
}

/**
 * Token tiers figure (D-98): reference → system → Tailwind theme → components, with the
 * quality checks under them. Drawn with the system's own tokens; also exported as an image
 * for the README and docs/design-system.md (`npm run og`).
 */
export function TokenTiersFigure() {
  const { t } = useTranslation();
  const tier = (key: string) =>
    t(`designSystem.tiers.${key}`, { returnObjects: true }) as { title: string; items: string[][] };
  return (
    <figure
      data-figure="tokens"
      className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 md:p-6"
    >
      <div className="grid grid-cols-1 items-stretch lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
        <Group {...tier('ref')} tone="token" />
        <Arrow />
        <Group {...tier('sys')} tone="token" />
        <Arrow />
        <Group {...tier('theme')} tone="token" />
        <Arrow />
        <Group {...tier('comp')} tone="use" />
      </div>
      <Group {...tier('qa')} tone="check" className="[&>ul]:sm:flex-row [&>ul>li]:sm:flex-1" />
      <figcaption className="text-body-small text-on-surface-variant">{t('designSystem.tiers.caption')}</figcaption>
    </figure>
  );
}

/**
 * Application layers figure (D-98), C4 component level: presentation, state and data on the
 * left, the pure domain on the right, with the direction of every dependency.
 */
export function AppLayersFigure() {
  const { t } = useTranslation();
  const layer = (key: string) =>
    t(`designSystem.layers.${key}`, { returnObjects: true }) as { title: string; items: string[][] };
  const link = (key: string) => t(`designSystem.layers.links.${key}`);
  return (
    <figure
      data-figure="layers"
      className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 md:p-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_9rem_minmax(0,1fr)] lg:grid-rows-[auto_auto_auto_auto_auto]">
        <Group {...layer('ui')} tone="use" className="lg:col-start-1 lg:row-start-1" />
        <div className="lg:col-start-1 lg:row-start-2">
          <Arrow vertical label={link('uiState')} />
        </div>
        <Group {...layer('state')} tone="store" className="lg:col-start-1 lg:row-start-3" />
        <div className="lg:col-start-1 lg:row-start-4">
          <Arrow vertical label={link('stateData')} />
        </div>
        <Group {...layer('data')} tone="store" className="lg:col-start-1 lg:row-start-5" />

        {/* Links to the domain, aligned with the presentation and state rows from 1024 px */}
        <div className="lg:col-start-2 lg:row-start-1 lg:self-center">
          <Arrow label={link('uiDomain')} />
        </div>
        <div className="lg:col-start-2 lg:row-start-3 lg:self-center">
          <Arrow label={link('stateDomain')} />
        </div>
        <Group {...layer('domain')} tone="token" className="lg:col-start-3 lg:row-span-3 lg:row-start-1" />
      </div>
      <figcaption className="text-body-small text-on-surface-variant">{t('designSystem.layers.caption')}</figcaption>
    </figure>
  );
}
