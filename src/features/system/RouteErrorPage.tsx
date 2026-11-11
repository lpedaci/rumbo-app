import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { resetDemo } from '@/features/auth/auth-service';

function messageOf(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Unexpected error (D-71): the router's error element, so a failing screen never shows the
 * raw stack. Serious tone without blame (2.9): what happened, that the demo data is safe and
 * what to do (reload, go home, or reset the demo if it repeats). The technical detail stays
 * folded, as plain text.
 */
export function RouteErrorPage() {
  const { t } = useTranslation();
  const error = useRouteError();

  const goHome = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface px-(--space-gutter) py-6">
      <header className="mx-auto w-full max-w-2xl">
        <Logo />
      </header>
      <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-10">
        <section
          aria-labelledby="error-title"
          className="flex flex-col gap-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 md:p-8"
        >
          <span className="flex size-12 items-center justify-center rounded-lg bg-error-container text-error">
            <Icon name="error" size={24} />
          </span>
          <div className="flex flex-col gap-2">
            <h1 id="error-title" className="text-headline-small text-on-surface">
              {t('errorPage.title')}
            </h1>
            <p className="text-body-large text-on-surface-variant">{t('errorPage.body')}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-end">
            <Button leadingIcon="refresh" onClick={() => window.location.reload()}>
              {t('errorPage.reload')}
            </Button>
            <Button variant="outlined" leadingIcon="home" onClick={goHome}>
              {t('errorPage.home')}
            </Button>
          </div>
          <div className="flex flex-col gap-2 border-t border-outline-variant pt-5">
            <p className="text-body-medium text-on-surface-variant">{t('errorPage.resetHint')}</p>
            <Button variant="text" leadingIcon="history"
              className="-ml-3 w-fit"
              onClick={() => {
                resetDemo();
                goHome();
              }}>
              {t('errorPage.reset')}
            </Button>
          </div>
          <details className="rounded-md bg-surface-container p-3 text-body-small text-on-surface-variant">
            <summary className="cursor-pointer text-label-large text-on-surface">{t('errorPage.details')}</summary>
            <pre className="mt-2 overflow-x-auto font-mono text-body-small whitespace-pre-wrap break-words">
              {messageOf(error)}
            </pre>
          </details>
        </section>
      </main>
    </div>
  );
}
