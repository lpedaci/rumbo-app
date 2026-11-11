import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  /** Narrow centered column (default) or full-width content. */
  width?: 'narrow' | 'wide';
}

/** Minimal shell until the G6 layout (step 4): skip link and a single `main` landmark. */
export function PageShell({ children, width = 'narrow' }: PageShellProps) {
  const { t } = useTranslation();

  return (
    <>
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
          'mx-auto flex w-full flex-col px-(--space-gutter) focus:outline-none',
          width === 'narrow' ? 'min-h-dvh max-w-2xl justify-center gap-6 py-12' : 'max-w-[max(80rem,80%)] gap-(--space-section) py-8',
        )}
      >
        {children}
      </main>
    </>
  );
}
