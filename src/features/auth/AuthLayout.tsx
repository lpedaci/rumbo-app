import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: ReactNode;
  /** Right column on large screens (help channels in G4). Hidden below 1024 px. */
  aside?: ReactNode;
}

/**
 * Layout of the access screens (G1 to G4): a clean, centered column like a real
 * company sign-in. An optional right column holds supporting content (G4).
 * Flat surfaces, no gradients.
 */
export function AuthLayout({ children, aside }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('grid min-h-dvh grid-cols-1 bg-surface-container-lowest', aside && 'lg:grid-cols-2')}>
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
          {/* The logo goes back to the demo start (G0). */}
          <Link to="/" className="w-fit rounded-sm">
            <Logo />
          </Link>
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
