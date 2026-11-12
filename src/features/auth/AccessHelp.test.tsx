import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
  useSessionStore.getState().markWelcomeSeen('p-diego');
});

describe('G4 · Problems signing in (RF-010)', () => {
  it('creates a request and "Ver como sistemas (demo)" opens it in S2 as Diego', async () => {
    const { router } = renderAt('/access-help');
    fireEvent.change(await screen.findByRole('textbox', { name: /correo/i }), {
      target: { value: 'sofia@nortia.demo' },
    });
    fireEvent.click(screen.getByRole('radio', { name: es.accessHelp.reasons.locked }));
    fireEvent.click(screen.getByRole('button', { name: es.accessHelp.submit }));

    fireEvent.click(await screen.findByRole('button', { name: es.accessHelp.viewAsIt }, { timeout: 4000 }));
    const request = useDataStore.getState().accessRequests.at(-1)!;
    expect(request).toMatchObject({ email: 'sofia@nortia.demo', reason: 'locked', status: 'new' });
    await waitFor(() => expect(router.state.location.pathname).toBe(`/it/requests/${request.id}`));
    expect(useSessionStore.getState().session?.personId).toBe('p-diego');
  });
});
