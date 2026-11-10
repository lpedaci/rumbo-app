import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface PageShellProps {
  children: ReactNode;
}

/** Minimal shell for step 1: skip link and a single `main` landmark. Replaced by the G6 layout in step 4. */
export function PageShell({ children }: PageShellProps) {
  const { t } = useTranslation();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:outline-2 focus:outline-offset-2 focus:outline-[#1F6F78]"
      >
        {t('app.skipToContent')}
      </a>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center gap-6 px-4 py-12 focus:outline-none sm:px-6"
      >
        {children}
      </main>
    </>
  );
}
