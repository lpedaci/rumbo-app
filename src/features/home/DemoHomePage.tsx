import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router';
import { CASE_STUDY_URL, DOCS_URL } from '@/app/links';
import { Logo } from '@/components/layout/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { BentoCard } from '@/components/ui/BentoCard';
import { BentoGrid } from '@/components/ui/BentoGrid';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { DEMO_ACCOUNTS, demoKeyFor, findDemoPerson, resetDemo } from '@/features/auth/auth-service';
import { homePath } from '@/lib/permissions';
import { useSessionStore } from '@/store/session-store';
import { ProductPreview } from './ProductPreview';

/**
 * G0 · Demo start (CLAUDE.md F0): presents the project and lets the visitor choose a
 * journey. Keeps the portfolio layer out of the product, so the login stays clean.
 */
export function DemoHomePage() {
  const { t } = useTranslation();
  const session = useSessionStore((s) => s.session);
  const lastLogout = useSessionStore((s) => s.lastLogout);
  const [resetOpen, setResetOpen] = useState(false);

  if (session) return <Navigate to={homePath(session)} replace />;

  return (
    <div className="min-h-dvh bg-surface">
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-surface-container-lowest px-4 py-3 text-label-large text-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:shadow-elevation-1"
      >
        {t('app.skipToContent')}
      </a>
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-(--space-gutter)">
          <Logo />
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex w-full max-w-7xl flex-col gap-(--space-section) px-(--space-gutter) py-8 focus:outline-none lg:py-12"
      >
        {lastLogout === 'reset' && (
          <InlineAlert tone="success" live="status">
            {t('auth.login.logout.reset')}
          </InlineAlert>
        )}

        <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="flex min-w-0 flex-col gap-4">
            <p className="text-label-large text-primary">{t('home.eyebrow')}</p>
            <h1 className="text-headline-small text-balance text-on-surface md:text-display-small">{t('home.title')}</h1>
            <p className="max-w-2xl text-body-large text-on-surface-variant">{t('home.intro')}</p>
            <div className="flex max-w-2xl flex-col gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
              <h2 className="flex items-center gap-2 text-title-medium text-on-surface">
                <Icon name="info" className="text-info" />
                {t('home.demoTitle')}
              </h2>
              <p className="text-body-medium text-on-surface-variant">{t('home.demoBody')}</p>
            </div>
          </div>
          {/* Decorative: shown from 768 px so on mobile the journeys come right after the intro. */}
          <div className="hidden md:block">
            <ProductPreview />
          </div>
        </section>

        <section aria-labelledby="choose-title" className="flex flex-col gap-4">
          <div>
            <h2 id="choose-title" className="text-title-large text-on-surface">
              {t('home.chooseTitle')}
            </h2>
            <p className="max-w-3xl text-body-medium text-on-surface-variant">{t('home.chooseSubtitle')}</p>
          </div>
          <BentoGrid>
            {DEMO_ACCOUNTS.map(({ personId, role }) => {
              const person = findDemoPerson(personId);
              const key = demoKeyFor(personId)!;
              const points = t(`home.roles.${role}.points`, { returnObjects: true }) as string[];
              return (
                <BentoCard key={role} size="sm" title={t(`home.roles.${role}.title`)} headingLevel="h3" className="md:col-span-3 xl:col-span-3">
                  <div className="flex h-full flex-col gap-4">
                    <div className="flex items-start gap-3">
                      {person && <Avatar name={person.name} />}
                      <p className="text-body-medium text-on-surface-variant">{t(`home.roles.${role}.description`)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <p className="text-label-medium text-on-surface">{t('home.youWillSee')}</p>
                      <ul className="flex flex-col gap-1.5">
                        {points.map((point) => (
                          <li key={point} className="flex items-start gap-2 text-body-medium text-on-surface">
                            <Icon name="check" size={18} className="mt-0.5 text-primary" />
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
                </BentoCard>
              );
            })}
          </BentoGrid>
        </section>

        <footer className="flex flex-col gap-4 border-t border-outline-variant pt-6 md:flex-row md:items-center md:justify-between">
          <nav aria-label={t('home.linksTitle')} className="flex flex-wrap gap-2">
            <Button asChild variant="outlined" trailingIcon="open_in_new">
              <a href={CASE_STUDY_URL} target="_blank" rel="noopener noreferrer">
                {t('home.caseStudy')}
                <span className="sr-only"> {t('home.newTab')}</span>
              </a>
            </Button>
            <Button asChild variant="outlined" trailingIcon="open_in_new">
              <a href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                {t('home.docs')}
                <span className="sr-only"> {t('home.newTab')}</span>
              </a>
            </Button>
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
