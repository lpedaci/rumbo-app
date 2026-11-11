import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Logo } from '@/components/layout/Logo';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: ReactNode;
  /** Right column on large screens (help channels in G4). Hidden below 1024 px. */
  aside?: ReactNode;
  /**
   * Product showcase on the right (G1, reference e97bf4eb): flat tinted panel with a
   * value sentence and the product preview. Hidden below 1024 px (form only on mobile).
   */
  showcase?: ReactNode;
}

/**
 * Layout of the access screens (G1 to G4): a clean, centered column like a real
 * company sign-in. An optional right column holds supporting content (G4).
 * Flat surfaces, no gradients.
 */
export function AuthLayout({ children, aside, showcase }: AuthLayoutProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'grid min-h-dvh grid-cols-1 bg-surface-container-lowest',
        aside && 'lg:grid-cols-2',
        showcase && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:p-3',
      )}
    >
      <a
        href="#main-content"
        className="sr-only rounded-sm bg-surface-container-lowest px-4 py-3 text-label-large text-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:shadow-elevation-1"
      >
        {t('app.skipToContent')}
      </a>
      <main
        id="main-content"
        tabIndex={-1}
        className={cn(
          // Vertically centered and compact on short screens, so G2 and G3 fit without scrolling (D-76).
          'flex min-w-0 flex-col items-center px-(--space-gutter) py-8 focus:outline-none md:justify-center lg:py-10',
          '[@media(max-height:50rem)]:py-6',
        )}
      >
        {/* 8-pt rhythm (D-69): 32 px between sections (24 px on short screens), 8 to 16 px inside. */}
        <div
          className={cn(
            'flex w-full min-w-0 flex-col gap-8 [@media(max-height:50rem)]:gap-6',
            // Wider column when there is no side panel (D-76): fewer line breaks, less height.
            showcase || aside ? 'max-w-md' : 'max-w-xl',
          )}
        >
          {/* The logo goes back to the demo start (G0). */}
          <Link to="/" className="w-fit rounded-sm">
            <Logo />
          </Link>
          {children}
        </div>
      </main>
      {showcase && (
        <aside className="hidden min-w-0 overflow-hidden rounded-xl bg-primary-container px-10 py-12 lg:flex lg:flex-col lg:justify-center xl:px-16">
          {showcase}
        </aside>
      )}
      {aside && (
        <aside className="hidden min-w-0 border-l border-outline-variant bg-surface-container px-10 py-12 lg:flex lg:items-center lg:justify-center">
          <div className="w-full max-w-md">{aside}</div>
        </aside>
      )}
    </div>
  );
}
