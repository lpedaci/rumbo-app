import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { sortRequests } from '@/lib/access';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
  useSessionStore.getState().markWelcomeSeen('p-sofia');
});

describe('F11 · Sessions and sign-in alerts', () => {
  it('"No fui yo" closes that session and opens an urgent request for IT', async () => {
    act(() => {
      switchRole('hire');
    });
    renderAt('/account/security');
    expect(await screen.findByRole('heading', { name: es.sessions.alert.title })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: es.sessions.alert.no }));

    expect(await screen.findByText(es.sessions.alert.reportedTitle)).toBeInTheDocument();
    const state = useDataStore.getState();
    const request = state.accessRequests.at(-1)!;
    expect(request).toMatchObject({ personId: 'p-sofia', reason: 'unrecognized_login', urgent: true, status: 'new' });
    expect(state.deviceSessions.find((s) => s.id === 'ds-sofia-2')?.revokedAt).toBeTruthy();
    expect(state.loginAlerts[0]).toMatchObject({ status: 'reported', requestId: request.id });
    // Every IT admin is told (Diego and Ramiro).
    expect(state.notifications.some((n) => n.recipientId === 'p-diego' && n.type === 'login.reported')).toBe(true);
    // The urgent request goes first in the IT inbox.
    expect(sortRequests(state.accessRequests)[0]!.id).toBe(request.id);
  });

  it('"Sí, fui yo" keeps the session', async () => {
    act(() => {
      switchRole('hire');
    });
    renderAt('/account/security');
    fireEvent.click(await screen.findByRole('button', { name: es.sessions.alert.yes }));
    await waitFor(() => expect(useDataStore.getState().loginAlerts[0]!.status).toBe('confirmed'));
    expect(useDataStore.getState().deviceSessions.find((s) => s.id === 'ds-sofia-2')?.revokedAt).toBeUndefined();
  });

  it('closes the other sessions but never the current one', async () => {
    act(() => {
      switchRole('admin');
    });
    renderAt('/account/security');
    fireEvent.click(await screen.findByRole('button', { name: es.sessions.revokeOthers }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: es.sessions.revokeOthersConfirm }));
    await waitFor(() => {
      const carla = useDataStore.getState().deviceSessions.filter((s) => s.personId === 'p-carla');
      expect(carla.find((s) => s.current)?.revokedAt).toBeUndefined();
      expect(carla.filter((s) => !s.current).every((s) => s.revokedAt)).toBe(true);
    });
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'session.revoke_others' });
  });

  it('lets IT force-close every session of an account, with an audit event', () => {
    act(() => {
      useDataStore.getState().revokeOtherSessions('p-martin', 'p-diego', true);
    });
    const martin = useDataStore.getState().deviceSessions.filter((s) => s.personId === 'p-martin');
    expect(martin.every((s) => s.revokedBy === 'p-diego')).toBe(true);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({
      action: 'session.force_close',
      resource: 'p-martin',
      actorId: 'p-diego',
    });
  });
});
