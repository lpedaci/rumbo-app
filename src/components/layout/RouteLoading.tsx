import { type ReactNode, Suspense, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { pageKind } from '@/lib/page-kind';

/**
 * Brief simulated load (CLAUDE.md section 6, D-140): the first time a screen opens in the
 * session, its skeleton shows for a moment, as if the data came from a server; afterwards the
 * screen opens at once. The same skeleton covers the time its code takes to arrive (D-131).
 * Off in unit tests, so they do not wait for it.
 */
export const SIMULATED_LOAD_MS = 450;
const seen = new Set<string>();
const enabled = import.meta.env.MODE !== 'test';

export function RouteLoading({ children, standalone = false }: { children: ReactNode; standalone?: boolean }) {
  const { pathname } = useLocation();
  const kind = pageKind(pathname);
  const [ready, setReady] = useState<string | null>(null);
  const loading = enabled && !seen.has(pathname) && ready !== pathname;

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => {
      seen.add(pathname);
      setReady(pathname);
    }, SIMULATED_LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [loading, pathname]);

  const skeleton = <PageSkeleton kind={kind} standalone={standalone} />;
  return <Suspense fallback={skeleton}>{loading ? skeleton : children}</Suspense>;
}
