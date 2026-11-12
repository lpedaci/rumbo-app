import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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

  it('G4 receives the email typed in the login, so it is not asked twice (WCAG 3.3.7, RNF-045)', async () => {
    renderAt('/login');
    fireEvent.click(await screen.findByRole('button', { name: es.auth.login.emailToggle }));
    fireEvent.change(screen.getByRole('textbox', { name: /correo/i }), { target: { value: 'sofia@nortia.demo' } });
    fireEvent.click(screen.getByRole('link', { name: es.auth.login.troubleLink }));
    expect(await screen.findByRole('heading', { level: 1, name: es.accessHelp.title })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /correo/i })).toHaveValue('sofia@nortia.demo');
    expect(screen.getByRole('radio', { name: es.accessHelp.reasons.locked })).not.toBeChecked();
  });

  it('after a lockout, G4 also comes with the reason "Mi cuenta está bloqueada" chosen', async () => {
    renderAt('/login');
    fireEvent.click(await screen.findByRole('button', { name: es.auth.login.emailToggle }));
    const email = screen.getByRole('textbox', { name: /correo/i });
    fireEvent.change(email, { target: { value: 'martin@nortia.demo' } });
    for (let attempt = 0; attempt < 5; attempt += 1) {
      fireEvent.change(screen.getByLabelText(new RegExp(`^${es.auth.login.passwordLabel}`)), { target: { value: 'otra-cosa' } });
      fireEvent.click(screen.getByRole('button', { name: es.auth.login.submit }));
      await waitFor(() => expect(screen.getByRole('button', { name: es.auth.login.submit })).not.toBeDisabled());
    }
    const alert = await screen.findByText(es.auth.login.lockedTitle);
    fireEvent.click(within(alert.closest('[role="alert"]') as HTMLElement).getByRole('link'));
    expect(await screen.findByRole('textbox', { name: /correo/i })).toHaveValue('martin@nortia.demo');
    expect(screen.getByRole('radio', { name: es.accessHelp.reasons.locked })).toBeChecked();
  });
});

