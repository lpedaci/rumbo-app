import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router';
import { CASE_STUDY_URL, DOCS_URL } from '@/app/links';
import { Logo } from '@/components/layout/Logo';
import { Avatar, ROLE_AVATAR_TONE } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { DEMO_ACCOUNTS, demoKeyFor, findDemoPerson, resetDemo } from '@/features/auth/auth-service';
import { homePath } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useSessionStore } from '@/store/session-store';
import { ProductPreview } from './ProductPreview';

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
 * G0 · Demo start (CLAUDE.md F0, redesign 2.2.1): two-column hero with a large headline
 * and a composed product preview, then one card per journey with the role color.
 * Keeps the portfolio layer out of the product, so the login stays clean.
 */
export function DemoHomePage() {
  const { t } = useTranslation();
  const session = useSessionStore((s) => s.session);
  const lastLogout = useSessionStore((s) => s.lastLogout);
  const [resetOpen, setResetOpen] = useState(false);
  const chooseRef = useRef<HTMLHeadingElement>(null);

  if (session) return <Navigate to={homePath(session)} replace />;

  // In-page jump without a hash link: the hash is the router's (HashRouter).
  const goToJourneys = () => {
    chooseRef.current?.scrollIntoView({ block: 'start' });
    chooseRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-surface-container-lowest px-4 py-3 text-label-large text-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:shadow-elevation-1"
      >
        {t('app.skipToContent')}
      </a>
      <header>
        <div className="mx-auto flex h-16 w-full max-w-[max(80rem,80%)] items-center gap-2 px-(--space-gutter)">
          <Logo />
          <div className="flex-1" />
          <nav aria-label={t('home.linksTitle')} className="hidden items-center gap-1 md:flex">
            <ExternalLink href={CASE_STUDY_URL} label={t('home.caseStudy')} variant="text" />
            <ExternalLink href={DOCS_URL} label={t('home.docs')} variant="text" />
          </nav>
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-[max(80rem,80%)] flex-col gap-16 px-(--space-gutter) pt-6 pb-10 focus:outline-none lg:gap-20 lg:pt-10"
      >
        {lastLogout === 'reset' && (
          <InlineAlert tone="success" live="status">
            {t('auth.login.logout.reset')}
          </InlineAlert>
        )}

        {/* Hero (2.2.1): headline + actions on the left, composed product preview on the right */}
        <section className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary-container py-1 pr-3 pl-1 text-label-large text-on-primary-container">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-on-primary">
                <Icon name="route" size={16} />
              </span>
              {t('home.eyebrow')}
            </span>
            <h1 className="text-display-small text-balance text-on-surface xl:text-display-medium">{t('home.title')}</h1>
            <p className="max-w-xl text-body-large text-on-surface-variant">{t('home.intro')}</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button trailingIcon="arrow_downward" onClick={goToJourneys} fullWidth className="sm:w-auto">
                {t('home.ctaChoose')}
              </Button>
              <Button asChild variant="outlined" trailingIcon="open_in_new" fullWidth className="sm:w-auto">
                <a href={CASE_STUDY_URL} target="_blank" rel="noopener noreferrer">
                  {t('home.caseStudy')}
                  <span className="sr-only"> {t('home.newTab')}</span>
                </a>
              </Button>
            </div>
            <p className="flex max-w-xl items-start gap-2 text-body-medium text-on-surface-variant">
              <Icon name="info" className="mt-0.5 shrink-0 text-info" />
              <span>
                <strong className="font-medium text-on-surface">{t('home.demoTitle')}: </strong>
                {t('home.demoBody')}
              </span>
            </p>
          </div>
          {/* Decorative preview from 768 px; on mobile the journeys come right after the intro. */}
          <div className="hidden pb-16 md:block lg:pr-4">
            <ProductPreview />
          </div>
        </section>

        <section aria-labelledby="choose-title" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 id="choose-title" ref={chooseRef} tabIndex={-1} className="text-title-large text-on-surface outline-none">
              {t('home.chooseTitle')}
            </h2>
            <p className="max-w-3xl text-body-medium text-on-surface-variant">{t('home.chooseSubtitle')}</p>
          </div>
          <ul className="grid grid-cols-1 gap-(--space-bento-gap) md:grid-cols-2 xl:grid-cols-4">
            {DEMO_ACCOUNTS.map(({ personId, role }) => {
              const person = findDemoPerson(personId);
              const key = demoKeyFor(personId)!;
              const points = t(`home.roles.${role}.points`, { returnObjects: true }) as string[];
              return (
                <li
                  key={role}
                  className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
                >
                  {/* Role color band (flat container color, 2.2.1 pattern 6) */}
                  <div className={cn('flex items-center gap-3 px-5 py-4', ROLE_AVATAR_TONE[role])}>
                    {person && (
                      <Avatar name={person.name} size="lg" className="bg-surface-container-lowest text-on-surface" />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-title-medium">{t(`home.roles.${role}.title`)}</h3>
                      <p className="truncate text-body-small opacity-90">{person?.jobTitle}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <p className="text-body-medium text-on-surface-variant">{t(`home.roles.${role}.description`)}</p>
                    <div className="flex flex-col gap-2">
                      <p className="text-label-medium text-on-surface">{t('home.youWillSee')}</p>
                      <ul className="flex flex-col gap-2">
                        {points.map((point) => (
                          <li key={point} className="flex items-start gap-2 text-body-medium text-on-surface">
                            <Icon name="check_circle" size={18} className="mt-0.5 shrink-0 text-primary" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button asChild variant="tonal" trailingIcon="arrow_forward" className="mt-auto w-full">
                      <Link to={`/login?demo=${key}`}>
                        {t('home.cardAction', { name: person?.name.split(' ')[0] ?? '' })}
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
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
