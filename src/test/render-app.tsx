import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { appRoutes } from '@/app/App';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';

/**
 * Renders the whole app at a route, with the same data router setup as production.
 * The signed-in person has accepted the privacy notice (F10) unless `consent: false`, so each
 * test checks its own screen; the notice (G8) has its own tests. Likewise the guided welcome
 * (F16) counts as seen unless `welcome: true`.
 */
export function renderAt(
  path: string,
  { consent = true, welcome = false }: { consent?: boolean; welcome?: boolean } = {},
) {
  const personId = useSessionStore.getState().session?.personId;
  if (!welcome && personId) useSessionStore.getState().markWelcomeSeen(personId);
  if (consent && personId) {
    useDataStore.setState((s) =>
      s.consents.some((c) => c.personId === personId && c.noticeVersion === s.securityPolicy.privacyNoticeVersion)
        ? s
        : {
            consents: [
              ...s.consents,
              { personId, noticeVersion: s.securityPolicy.privacyNoticeVersion, acceptedAt: '2026-11-01T12:00:00.000Z' },
            ],
          },
    );
  }
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return { router, ...render(<RouterProvider router={router} />) };
}
