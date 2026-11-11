import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
});

describe('G8 · Privacy notice (F10)', () => {
  it('stops the hire until the notice is accepted, then goes back to the requested screen', async () => {
    act(() => {
      switchRole('hire');
    });
    useSessionStore.getState().markWelcomeSeen('p-sofia');
    const { router } = renderAt('/me', { consent: false });
    expect(await screen.findByRole('heading', { level: 1, name: es.privacy.consent.title })).toBeInTheDocument();

    for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByRole('button', { name: es.privacy.consent.next }));
    fireEvent.click(screen.getByRole('button', { name: es.privacy.consent.accept }));
    // Without checking the box, it explains what is missing.
    expect(await screen.findByRole('alert')).toHaveTextContent(es.privacy.consent.checkRequired);

    fireEvent.click(screen.getByLabelText(es.privacy.consent.check));
    fireEvent.click(screen.getByRole('button', { name: es.privacy.consent.accept }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/me'));
    expect(useDataStore.getState().consents.find((c) => c.personId === 'p-sofia')).toMatchObject({
      noticeVersion: '2026.1',
    });
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'privacy.consent', actorId: 'p-sofia' });
  });
});

describe('G10 and A12 · Requests about personal data (F10)', () => {
  it('sends a request from Mi privacidad, with its deadline, and notifies HR', async () => {
    act(() => {
      switchRole('hire');
    });
    useSessionStore.getState().markWelcomeSeen('p-sofia');
    renderAt('/account/privacy');
    expect(await screen.findByRole('heading', { level: 1, name: es.privacy.mine.title })).toBeInTheDocument();
    // Identifiers are shown masked to the person too.
    expect(screen.getAllByText(/\*\*\*\.\*\*\*\./).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: es.privacy.mine.send }));
    expect(await screen.findByText(es.privacy.mine.typeRequired)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Rectificación/));
    fireEvent.change(screen.getByLabelText(new RegExp(es.privacy.mine.detail)), {
      target: { value: 'Mi celular registrado está desactualizado.' },
    });
    fireEvent.click(screen.getByRole('button', { name: es.privacy.mine.send }));

    await waitFor(() =>
      expect(useDataStore.getState().privacyRequests.at(-1)).toMatchObject({
        id: 'PRIV-2026-0009',
        personId: 'p-sofia',
        type: 'rectification',
        dueAt: '2026-11-17',
        status: 'new',
      }),
    );
    expect(useDataStore.getState().notifications.at(-1)).toMatchObject({
      recipientId: 'p-carla',
      type: 'privacy_request.new',
    });
  });

  it('lets HR answer a request with a written answer that reaches the person', async () => {
    act(() => {
      switchRole('admin');
    });
    renderAt('/admin/privacy-requests?request=PRIV-2026-0008');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: es.privacy.requests.answer }));
    expect(await within(dialog).findByText(es.privacy.requests.responseRequired)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(new RegExp(es.privacy.requests.responseLabel)), {
      target: { value: 'Te enviamos por correo el detalle de tus datos y quién los ve.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: es.privacy.requests.answer }));
    await waitFor(() =>
      expect(useDataStore.getState().privacyRequests.find((r) => r.id === 'PRIV-2026-0008')).toMatchObject({
        status: 'answered',
        handledBy: 'p-carla',
      }),
    );
    expect(useDataStore.getState().notifications.at(-1)).toMatchObject({
      recipientId: 'p-lucas',
      type: 'privacy_request.answered',
    });
  });

  it('shows a masked DNI to HR only after a reason, and audits it', async () => {
    act(() => {
      switchRole('admin');
    });
    renderAt('/admin/hires/h-sofia');
    const show = await screen.findByRole('button', { name: es.privacy.pii.showLabel.replace('{{field}}', 'DNI') });
    fireEvent.click(show);
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(new RegExp(es.privacy.pii.reason)), {
      target: { value: 'Alta en la obra social.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: es.privacy.pii.confirm }));
    await waitFor(() =>
      expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({
        action: 'pii.reveal',
        resource: 'p-sofia:dni',
        detail: 'Alta en la obra social.',
      }),
    );
  });
});
