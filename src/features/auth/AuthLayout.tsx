import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/components/layout/Logo';

interface AuthLayoutProps {
  children: ReactNode;
  /** Right column on large screens (login preview, demo access). Hidden below 1024 px. */
  aside?: ReactNode;
}

/**
 * Two-column layout of the access screens (G1 to G4), after reference e97bf4eb:
 * form on the left, product context on the right. Flat surfaces, no gradients.
 */
export function AuthLayout({ children, aside }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-surface-container-lowest lg:grid-cols-2">
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-surface-container-lowest px-4 py-3 text-label-large text-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:shadow-elevation-1"
      >
        {t('app.skipToContent')}
      </a>
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-w-0 flex-col items-center px-(--space-gutter) py-8 focus:outline-none lg:py-12"
      >
        <div className="flex w-full max-w-md min-w-0 flex-col gap-6">
          <Logo />
          {children}
        </div>
      </main>
      {aside && (
        <aside className="hidden min-w-0 border-l border-outline-variant bg-surface-container px-10 py-12 lg:flex lg:items-center lg:justify-center">
          <div className="w-full max-w-md">{aside}</div>
        </aside>
      )}
    </div>
  );
}
