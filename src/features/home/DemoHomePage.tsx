import { type RefObject, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router';
import { CASE_STUDY_URL, DOCS_URL } from '@/app/links';
import { Logo } from '@/components/layout/Logo';
import { Avatar, ROLE_ACCENT } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon, type IconName } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { DEMO_ACCOUNTS, demoKeyFor, findDemoPerson, resetDemo } from '@/features/auth/auth-service';
import { useShouldReduceMotion } from '@/lib/motion';
import { homePath } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/session-store';
import { FaqSection } from './FaqSection';
import { ProblemSection } from './ProblemSection';
import { ProductPreview } from './ProductPreview';
import { SolutionSection } from './SolutionSection';
import { SectionHeading } from './SectionHeading';
import { StatsBand } from './StatsBand';

const META_ICONS: IconName[] = ['groups', 'apartment', 'verified_user', 'devices'];

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
 * G0 · Demo start (CLAUDE.md F0; redesign D-70 after Lourdes's B2B reference): floating bar
 * with section links and the main action, centered hero with the product in a frame, the
 * problem, the solution in a bento, a figures band, the journeys, questions and a footer with
 * the wordmark. No logos of other companies nor testimonials: they would be invented.
 * Keeps the portfolio layer out of the product, so the login stays clean.
 */
export function DemoHomePage() {
  const { t } = useTranslation();
  const session = useSessionStore((s) => s.session);
  const lastLogout = useSessionStore((s) => s.lastLogout);
  const [resetOpen, setResetOpen] = useState(false);
  const chooseRef = useRef<HTMLHeadingElement>(null);
  const problemRef = useRef<HTMLHeadingElement>(null);
  const faqRef = useRef<HTMLHeadingElement>(null);
  const reduce = useShouldReduceMotion();

  if (session) return <Navigate to={homePath(session)} replace />;

  // In-page jump without a hash link: the hash is the router's (HashRouter).
  const goTo = (ref: RefObject<HTMLHeadingElement | null>) => {
    ref.current?.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    ref.current?.focus({ preventScroll: true });
  };
  const goToJourneys = () => goTo(chooseRef);
  const sections = [
    { label: t('home.nav.how'), ref: problemRef },
    { label: t('home.nav.journeys'), ref: chooseRef },
    { label: t('home.nav.faq'), ref: faqRef },
  ];

  const meta = t('home.meta', { returnObjects: true }) as string[];

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
          {/* Section links (buttons: the hash belongs to the router) */}
          <nav aria-label={t('home.nav.label')} className="hidden items-center gap-1 md:flex">
            {sections.map((section) => (
              <Button key={section.label} variant="text" onClick={() => goTo(section.ref)}>
                {section.label}
              </Button>
            ))}
          </nav>
          <div className="flex-1" />
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

        <ProblemSection ref={problemRef} />
        <SolutionSection />
        <StatsBand />

        {/* Journeys: one per role, with photo and role color */}
        <section aria-labelledby="choose-title" className="flex flex-col gap-10">
          <SectionHeading
            ref={chooseRef}
            id="choose-title"
            eyebrow={t('home.nav.journeys')}
            title={t('home.chooseTitle')}
            subtitle={t('home.chooseSubtitle')}
          />
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

        <FaqSection ref={faqRef} />

        <footer className="flex flex-col gap-8 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest px-5 pt-8 sm:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-3">
              <Logo />
              <p className="max-w-md text-body-medium text-on-surface-variant">{t('home.footerTagline')}</p>
              <p className="flex max-w-xl items-start gap-2 text-body-small text-on-surface-variant">
                <Icon name="info" size={16} className="mt-0.5 shrink-0 text-info" />
                <span>
                  <strong className="font-medium text-on-surface">{t('home.demoTitle')}: </strong>
                  {t('home.demoBody')}
                </span>
              </p>
            </div>
            <div className="flex min-w-0 flex-col items-start gap-3 md:items-end">
              <nav aria-label={t('home.linksFooter')} className="flex flex-wrap gap-2 md:justify-end">
                <ExternalLink href={CASE_STUDY_URL} label={t('home.caseStudy')} variant="outlined" />
                <ExternalLink href={DOCS_URL} label={t('home.docs')} variant="outlined" />
              </nav>
              <Button variant="text" leadingIcon="refresh" className="w-fit" onClick={() => setResetOpen(true)}>
                {t('home.resetDemo')}
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1 border-t border-outline-variant pt-4 text-body-small text-on-surface-variant sm:flex-row sm:justify-between">
            <p>{t('home.author')}</p>
            <p>
              {t('app.demoNotice')} · {t('home.photoCredit')}
            </p>
          </div>
          {/* Decorative wordmark, flat color and cut by the card edge, as in the reference */}
          {/* SVG so it scales with the card and is not read as text (2.1.2: no loose text sizes) */}
          <svg aria-hidden focusable="false" viewBox="0 0 1000 210" className="-mb-2 w-full text-primary-container">
            <text
              x="500"
              y="235"
              textAnchor="middle"
              fontSize="300"
              fontWeight="700"
              letterSpacing="-14"
              fill="currentColor"
            >
              {t('app.name')}
            </text>
          </svg>
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
