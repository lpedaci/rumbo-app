import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router';
import { CASE_STUDY_URL, DOCS_URL } from '@/app/links';
import { Logo } from '@/components/layout/Logo';
import { Avatar, ROLE_ACCENT } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon, type IconName } from '@/components/ui/Icon';
import { IconTile } from '@/components/ui/IconTile';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { DEMO_ACCOUNTS, demoKeyFor, findDemoPerson, resetDemo } from '@/features/auth/auth-service';
import { useShouldReduceMotion } from '@/lib/motion';
import { homePath } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/session-store';
import { ProductPreview } from './ProductPreview';

const META_ICONS: IconName[] = ['groups', 'apartment', 'verified_user', 'devices'];
const FEATURE_ICONS: IconName[] = ['route', 'layers', 'event', 'security'];

function ExternalLink({ href, label, variant }: { href: string; label: string; variant: 'text' | 'outlined' }) {
  const { t } = useTranslation();
  return (
    <Button asChild variant={variant} trailingIcon="open_in_new">
      <a href={href} target="_blank" rel="noopener noreferrer">
        {label}
        <span className="sr-only"> {t('home.newTab')}</span>
      </a>
    </Button>
  );
}

/**
 * G0 · Demo start (CLAUDE.md F0; redesign D-69 with current B2B product-page patterns):
 * floating top bar with the main action, centered hero with the key facts of the demo,
 * the product in a frame, one card per journey with photo and role color, and what the
 * prototype covers. Keeps the portfolio layer out of the product, so the login stays clean.
 */
export function DemoHomePage() {
  const { t } = useTranslation();
  const session = useSessionStore((s) => s.session);
  const lastLogout = useSessionStore((s) => s.lastLogout);
  const [resetOpen, setResetOpen] = useState(false);
  const chooseRef = useRef<HTMLHeadingElement>(null);
  const reduce = useShouldReduceMotion();

  if (session) return <Navigate to={homePath(session)} replace />;

  // In-page jump without a hash link: the hash is the router's (HashRouter).
  const goToJourneys = () => {
    chooseRef.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    chooseRef.current?.focus({ preventScroll: true });
  };

  const meta = t('home.meta', { returnObjects: true }) as string[];
  const features = t('home.features.items', { returnObjects: true }) as { title: string; body: string }[];

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-surface-container-lowest px-4 py-3 text-label-large text-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:shadow-elevation-1"
      >
        {t('app.skipToContent')}
      </a>

      {/* Floating white bar, the same as the app's top bar (D-69) */}
      <header className="sticky top-0 z-40 bg-surface px-2 pt-2 md:px-(--space-gutter) md:pt-3">
        <div className="mx-auto flex h-16 w-full max-w-[max(80rem,80%)] min-w-0 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 sm:px-4">
          <Logo />
          <div className="flex-1" />
          <nav aria-label={t('home.linksTitle')} className="hidden items-center gap-1 lg:flex">
            <ExternalLink href={CASE_STUDY_URL} label={t('home.caseStudy')} variant="text" />
            <ExternalLink href={DOCS_URL} label={t('home.docs')} variant="text" />
          </nav>
          <Button onClick={goToJourneys} trailingIcon="arrow_downward" className="hidden sm:inline-flex">
            {t('home.ctaChoose')}
          </Button>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-[max(80rem,80%)] flex-col gap-20 px-(--space-gutter) pt-10 pb-10 focus:outline-none lg:gap-28 lg:pt-16"
      >
        {lastLogout === 'reset' && (
          <InlineAlert tone="success" live="status">
            {t('auth.login.logout.reset')}
          </InlineAlert>
        )}

        {/* Hero: centered message, two actions and the facts of the demo; then the product */}
        <section className="flex flex-col items-center gap-12 lg:gap-16">
          <div className="flex w-full max-w-3xl min-w-0 flex-col items-center gap-6 text-center">
            <span className="inline-flex max-w-full items-center gap-2 rounded-[1rem] border border-outline-variant bg-surface-container-lowest py-1 pr-3 pl-1 text-label-large text-on-surface">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                <Icon name="route" size={16} />
              </span>
              <span className="text-left">{t('home.eyebrow')}</span>
            </span>
            <h1 className="text-display-small text-balance text-on-surface lg:text-display-medium">{t('home.title')}</h1>
            <p className="max-w-2xl text-body-large text-pretty text-on-surface-variant">{t('home.intro')}</p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button size="m" trailingIcon="arrow_downward" onClick={goToJourneys} fullWidth className="sm:w-auto md:h-12">
                {t('home.ctaChoose')}
              </Button>
              <Button asChild size="m" variant="outlined" trailingIcon="open_in_new" fullWidth className="sm:w-auto md:h-12">
                <a href={CASE_STUDY_URL} target="_blank" rel="noopener noreferrer">
                  {t('home.caseStudy')}
                  <span className="sr-only"> {t('home.newTab')}</span>
                </a>
              </Button>
            </div>
            <ul aria-label={t('home.metaLabel')} className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {meta.map((item, i) => (
                <li key={item} className="inline-flex items-center gap-1.5 text-body-medium text-on-surface-variant">
                  <Icon name={META_ICONS[i] ?? 'check_circle'} size={18} className="shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* The product in a frame: neutral container, no gradient (2.2). Decorative from 768 px. */}
          <figure className="hidden w-full rounded-xl border border-outline-variant bg-surface-container-lowest p-3 md:block">
            <figcaption className="flex items-center gap-2 px-2 pb-3 text-label-medium text-on-surface-variant">
              <span aria-hidden className="flex gap-1.5">
                <span className="size-2.5 rounded-full bg-outline-variant" />
                <span className="size-2.5 rounded-full bg-outline-variant" />
                <span className="size-2.5 rounded-full bg-outline-variant" />
              </span>
              {t('home.previewFrame')}
            </figcaption>
            <div className="rounded-lg bg-surface-container px-6 pt-10 pb-20 lg:px-16">
              <div className="mx-auto max-w-4xl">
                <ProductPreview />
              </div>
            </div>
          </figure>
        </section>

        {/* Journeys: one per role, with photo and role color */}
        <section aria-labelledby="choose-title" className="flex scroll-mt-28 flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 id="choose-title" ref={chooseRef} tabIndex={-1} className="scroll-mt-28 text-title-large text-on-surface outline-none">
              {t('home.chooseTitle')}
            </h2>
            <p className="max-w-3xl text-body-large text-on-surface-variant">{t('home.chooseSubtitle')}</p>
          </div>
          <ul className="grid grid-cols-1 gap-(--space-bento-gap) md:grid-cols-2 xl:grid-cols-4">
            {DEMO_ACCOUNTS.map(({ personId, role }) => {
              const person = findDemoPerson(personId);
              const key = demoKeyFor(personId)!;
              const accent = ROLE_ACCENT[role];
              const points = t(`home.roles.${role}.points`, { returnObjects: true }) as string[];
              return (
                <li
                  key={role}
                  className="relative flex min-w-0 flex-col gap-5 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-5 pt-6 transition-colors hover:border-outline"
                >
                  {/* Flat role color bar (2.2.1, pattern 6; D-69) */}
                  <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', accent.bar)} />
                  <div className="flex min-w-0 items-center gap-3">
                    {person && <Avatar name={person.name} role={role} size="xl" />}
                    <div className="flex min-w-0 flex-col gap-1">
                      <h3 className="text-title-medium text-on-surface">{person?.name}</h3>
                      <p className="truncate text-body-small text-on-surface-variant">{person?.jobTitle}</p>
                    </div>
                  </div>
                  <span className={cn('inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-label-medium', accent.chip)}>
                    <span className="sr-only">{t('home.roleLabel')}: </span>
                    {t(`roles.${role}`)}
                  </span>
                  <p className="text-body-medium text-on-surface-variant">{t(`home.roles.${role}.description`)}</p>
                  <div className="flex flex-col gap-2 border-t border-outline-variant pt-4">
                    <p className="text-label-medium text-on-surface">{t('home.youWillSee')}</p>
                    <ul className="flex flex-col gap-2">
                      {points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-body-medium text-on-surface">
                          <Icon name="check_circle" size={18} className={cn('mt-0.5 shrink-0', accent.icon)} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button asChild variant="outlined" trailingIcon="arrow_forward" className="mt-auto w-full">
                    <Link to={`/login?demo=${key}`}>
                      {t('home.cardAction', { name: person?.name.split(' ')[0] ?? '' })}
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* What the prototype covers */}
        <section aria-labelledby="features-title" className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 id="features-title" className="text-title-large text-on-surface">
              {t('home.features.title')}
            </h2>
            <p className="max-w-3xl text-body-large text-on-surface-variant">{t('home.features.subtitle')}</p>
          </div>
          <ul className="grid grid-cols-1 gap-(--space-bento-gap) sm:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, i) => (
              <li
                key={feature.title}
                className="flex min-w-0 flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5"
              >
                <IconTile icon={FEATURE_ICONS[i] ?? 'check_circle'} tone={i === 3 ? 'tertiary' : 'primary'} />
                <div className="flex flex-col gap-1">
                  <h3 className="text-title-medium text-on-surface">{feature.title}</h3>
                  <p className="text-body-medium text-on-surface-variant">{feature.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="flex max-w-3xl items-start gap-2 text-body-medium text-on-surface-variant">
            <Icon name="info" className="mt-0.5 shrink-0 text-info" />
            <span>
              <strong className="font-medium text-on-surface">{t('home.demoTitle')}: </strong>
              {t('home.demoBody')}
            </span>
          </p>
        </section>

        <footer className="flex flex-col gap-4 border-t border-outline-variant pt-6 md:flex-row md:items-center md:justify-between">
          <nav aria-label={t('home.linksFooter')} className="flex flex-wrap gap-2">
            <ExternalLink href={CASE_STUDY_URL} label={t('home.caseStudy')} variant="outlined" />
            <ExternalLink href={DOCS_URL} label={t('home.docs')} variant="outlined" />
          </nav>
          <div className="flex flex-col gap-2 md:items-end">
            <Button variant="text" leadingIcon="refresh" className="w-fit" onClick={() => setResetOpen(true)}>
              {t('home.resetDemo')}
            </Button>
            <p className="text-body-small text-on-surface-variant">{t('app.demoNotice')}</p>
          </div>
        </footer>
      </main>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t('home.resetTitle')}
        description={t('home.resetBody')}
        confirmLabel={t('home.resetConfirm')}
        onConfirm={resetDemo}
      />
    </div>
  );
}
