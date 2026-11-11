import { type ReactNode, type RefObject, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { CASE_STUDY_URL, DOCS_URL } from '@/app/links';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { resetDemo } from '@/features/auth/auth-service';
import { useShouldReduceMotion } from '@/lib/motion';
import { homePath } from '@/lib/permissions';
import { useSessionStore } from '@/store/session-store';
import { Band } from './Band';
import { FaqSection } from './FaqSection';
import { ProblemSection } from './ProblemSection';
import { HeroCards } from './HeroCards';
import { RoleShowcase } from './RoleShowcase';
import { SolutionSection } from './SolutionSection';
import { StatsBand } from './StatsBand';
import { StepsSection } from './StepsSection';

const FOOTER_LINK =
  'inline-flex min-h-11 items-center gap-1.5 rounded-sm text-left text-body-medium text-on-surface-variant hover:text-primary hover:underline underline-offset-4 md:min-h-9';

function FooterColumn({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <nav aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
      {/* Column titles stand out from the links (D-72): darker, heavier and with a rule below. */}
      <h2 id={id} className="border-b border-outline-variant pb-3 text-title-medium text-on-surface">
        {title}
      </h2>
      <ul className="flex flex-col gap-1">{children}</ul>
    </nav>
  );
}

/**
 * G0 · Demo start (CLAUDE.md F0; rebuilt in D-71 after Lourdes's two B2B references):
 * floating bar, centered hero with the product, the problem, the solution in a bento,
 * one alternating section per role with a miniature of its screen, the figures band,
 * three steps to start, questions and a footer organized by tasks. No logos of other
 * companies nor testimonials: they would be invented.
 */
export function DemoHomePage() {
  const { t } = useTranslation();
  const session = useSessionStore((s) => s.session);
  const lastLogout = useSessionStore((s) => s.lastLogout);
  const [resetOpen, setResetOpen] = useState(false);
  const problemRef = useRef<HTMLHeadingElement>(null);
  const solutionRef = useRef<HTMLHeadingElement>(null);
  const chooseRef = useRef<HTMLHeadingElement>(null);
  const faqRef = useRef<HTMLHeadingElement>(null);
  const reduce = useShouldReduceMotion();

  if (session) return <Navigate to={homePath(session)} replace />;

  // In-page jumps without hash links: the hash is the router's (HashRouter).
  const goTo = (ref: RefObject<HTMLHeadingElement | null>) => {
    ref.current?.scrollIntoView({
      block: 'start',
      behavior: reduce ? 'auto' : 'smooth',
    });
    ref.current?.focus({ preventScroll: true });
  };
  const goToJourneys = () => goTo(chooseRef);
  const sections = [
    { label: t('home.nav.how'), ref: problemRef },
    { label: t('home.nav.journeys'), ref: chooseRef },
    { label: t('home.nav.faq'), ref: faqRef },
  ];

  return (
    <div className="min-h-dvh bg-surface-container-lowest">
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-surface-container-lowest px-4 py-3 text-label-large text-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:shadow-elevation-1"
      >
        {t('app.skipToContent')}
      </a>

      {/* Floating white bar, the same as the app's top bar (D-69) */}
      <header className="sticky top-0 z-40 px-2 pt-2 md:px-(--space-gutter) md:pt-3">
        <div className="mx-auto flex h-16 w-full max-w-[max(80rem,80%)] min-w-0 items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest px-3 sm:px-4">
          <Logo />
          <div className="flex-1" />
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

      {/* The header floats over the first band */}
      <main id="main-content" tabIndex={-1} className="-mt-[5.5rem] flex w-full flex-col focus:outline-none">
        <Band tone="hero" className="pt-32 lg:pt-40">
          {lastLogout === 'reset' && (
            <InlineAlert tone="success" live="status" className="mb-10">
              {t('auth.login.logout.reset')}
            </InlineAlert>
          )}

          {/* Hero (D-73, reference): centered message with the key words in color, one main action,
              and real product cards floating on both sides from 1280 px (below, in a grid). */}
          <section className="relative flex flex-col items-center xl:min-h-[34rem] xl:justify-center">
            <div className="relative z-10 flex w-full max-w-2xl min-w-0 flex-col items-center gap-6 text-center">
              <p className="text-label-large text-primary">{t('home.eyebrow')}</p>
              <h1 className="text-display-small text-balance text-on-surface lg:text-display-medium">
                {t('home.title').replace(t('home.titleHighlight'), '')}
                <span className="text-primary">{t('home.titleHighlight')}</span>
              </h1>
              <p className="text-body-large text-pretty text-on-surface-variant">{t('home.intro')}</p>
              <div className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
                <Button
                  size="m"
                  trailingIcon="arrow_downward"
                  onClick={goToJourneys}
                  fullWidth
                  className="sm:w-auto md:h-12"
                >
                  {t('home.ctaChoose')}
                </Button>
                <Button asChild variant="text" trailingIcon="open_in_new">
                  <a href={CASE_STUDY_URL} target="_blank" rel="noopener noreferrer">
                    {t('home.caseStudy')}
                    <span className="sr-only"> {t('home.newTab')}</span>
                  </a>
                </Button>
              </div>
            </div>
            <HeroCards />
          </section>
        </Band>
        <Band>
          <ProblemSection ref={problemRef} />
        </Band>
        <Band>
          <SolutionSection ref={solutionRef} />
        </Band>
        <Band>
          <RoleShowcase ref={chooseRef} />
        </Band>
        <Band>
          <StatsBand />
        </Band>
        <Band>
          <StepsSection />
        </Band>
        <Band>
          <FaqSection ref={faqRef} />
        </Band>

        <Band className="pt-0 lg:pt-0">
          <div className="flex flex-col items-start gap-6 rounded-xl bg-primary-container px-6 py-10 md:flex-row md:items-center md:justify-between md:px-12">
            <div className="flex max-w-2xl flex-col gap-2">
              <h2 className="text-headline-small text-balance text-on-primary-container">{t('home.cta.title')}</h2>
              <p className="text-body-large text-on-primary-container">{t('home.cta.body')}</p>
            </div>
            <Button
              size="m"
              trailingIcon="arrow_upward"
              onClick={goToJourneys}
              className="w-full shrink-0 md:h-12 md:w-auto"
            >
              {t('home.ctaChoose')}
            </Button>
          </div>
        </Band>

        <div className="px-(--space-gutter) pb-10">
          <div className="mx-auto w-full max-w-[max(80rem,80%)]">
            {/* Footer organized by what people want to do (D-71): explore, the project, the demo */}
            <footer className="flex flex-col gap-10 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest px-5 pt-10 sm:px-8 lg:px-10">
              <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] lg:gap-8">
                <div className="col-span-2 flex min-w-0 flex-col gap-4 sm:col-span-3 lg:col-span-1">
                  <Logo />
                  <p className="max-w-sm text-body-medium text-on-surface-variant">{t('home.footerTagline')}</p>
                  <p className="flex max-w-sm items-start gap-2 rounded-md bg-surface-container p-3 text-body-small text-on-surface-variant">
                    <Icon name="info" size={16} className="mt-0.5 shrink-0 text-info" />
                    <span>
                      <strong className="font-medium text-on-surface">{t('home.demoTitle')}: </strong>
                      {t('home.demoBody')}
                    </span>
                  </p>
                </div>
                <FooterColumn id="footer-explore" title={t('home.footer.explore')}>
                  <li>
                    <button type="button" className={FOOTER_LINK} onClick={() => goTo(problemRef)}>
                      {t('home.footer.problem')}
                    </button>
                  </li>
                  <li>
                    <button type="button" className={FOOTER_LINK} onClick={() => goTo(solutionRef)}>
                      {t('home.footer.solution')}
                    </button>
                  </li>
                  <li>
                    <button type="button" className={FOOTER_LINK} onClick={() => goTo(chooseRef)}>
                      {t('home.footer.journeys')}
                    </button>
                  </li>
                  <li>
                    <button type="button" className={FOOTER_LINK} onClick={() => goTo(faqRef)}>
                      {t('home.footer.faq')}
                    </button>
                  </li>
                </FooterColumn>
                <FooterColumn id="footer-project" title={t('home.footer.project')}>
                  <li>
                    <a href={CASE_STUDY_URL} target="_blank" rel="noopener noreferrer" className={FOOTER_LINK}>
                      {t('home.caseStudy')}
                      <Icon name="open_in_new" size={16} className="text-on-surface-variant" />
                      <span className="sr-only"> {t('home.newTab')}</span>
                    </a>
                  </li>
                  <li>
                    <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className={FOOTER_LINK}>
                      {t('home.docs')}
                      <Icon name="open_in_new" size={16} className="text-on-surface-variant" />
                      <span className="sr-only"> {t('home.newTab')}</span>
                    </a>
                  </li>
                </FooterColumn>
                <FooterColumn id="footer-demo" title={t('home.footer.demo')}>
                  <li>
                    <button type="button" className={FOOTER_LINK} onClick={goToJourneys}>
                      {t('home.ctaChoose')}
                    </button>
                  </li>
                  <li>
                    <button type="button" className={FOOTER_LINK} onClick={() => setResetOpen(true)}>
                      <Icon name="refresh" size={16} className="text-on-surface-variant" />
                      {t('home.resetDemo')}
                    </button>
                  </li>
                </FooterColumn>
              </div>

              <div className="flex flex-col gap-2 border-t border-outline-variant pt-5 text-body-small text-on-surface-variant md:flex-row md:flex-wrap md:justify-between md:gap-x-8">
                <p>{t('home.author')}</p>
                <p>{t('home.footer.rights')}</p>
                <p>{t('home.photoCredit')}</p>
              </div>

              {/* Decorative wordmark, flat color and cut by the card edge, as in the reference */}
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
          </div>
        </div>
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
