import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { leaverTasks } from '@/lib/lifecycle';
import { itMinimumBlock } from '@/lib/people';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

/** D-121: IT never keeps fewer than two active people, or the double approval stops working. */
beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
  act(() => {
    switchRole('admin');
  });
});

const person = (id: string) => useDataStore.getState().people.find((p) => p.id === id)!;
const lastAudit = () => useDataStore.getState().auditEvents.at(-1)!;

describe('D-121 · Minimum of two people in IT', () => {
  it('blocks taking the IT role away or offboarding when only two remain', () => {
    const { people } = useDataStore.getState();
    expect(itMinimumBlock(people, 'p-ramiro', { toRole: 'hire' })).toBe(true);
    expect(itMinimumBlock(people, 'p-ramiro', { leaves: true })).toBe(true);
    expect(itMinimumBlock(people, 'p-ramiro', { toRole: 'it_admin' })).toBe(false);
    expect(itMinimumBlock(people, 'p-julieta', { toRole: 'admin' })).toBe(false);
  });

  it('does not create the role change request and records the attempt as denied (F15)', () => {
    const before = useDataStore.getState().approvals.length;
    expect(useDataStore.getState().changeRole('p-ramiro', 'hire', 'Deja de administrar Rumbo.', 'p-carla')).toBeUndefined();
    expect(useDataStore.getState().approvals).toHaveLength(before);
    expect(lastAudit()).toMatchObject({ action: 'approval.request', resource: 'p-ramiro', result: 'denied' });
  });

  it('checks again when approving, in case IT changed in between (F14)', () => {
    const store = useDataStore.getState();
    // Three people in IT, then two requests that each remove one of them.
    const add = store.changeRole('p-julieta', 'it_admin', 'Se suma a la mesa de ayuda.', 'p-carla')!;
    useDataStore.getState().decideApproval(add, 'approved', '', 'p-diego');
    const first = useDataStore.getState().changeRole('p-julieta', 'hire', 'Vuelve a su equipo de desarrollo.', 'p-carla')!;
    const second = useDataStore.getState().changeRole('p-ramiro', 'hire', 'Deja de administrar Rumbo.', 'p-carla')!;
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(useDataStore.getState().decideApproval(first, 'approved', '', 'p-diego')).toBe(true);
    // Now only Diego and Ramiro remain: the second one can no longer be applied.
    expect(useDataStore.getState().decideApproval(second, 'approved', '', 'p-diego')).toBe(false);
    expect(person('p-ramiro').role).toBe('it_admin');
    expect(lastAudit()).toMatchObject({ action: 'approval.approve', resource: second, result: 'denied' });
    // It can still be rejected.
    expect(useDataStore.getState().decideApproval(second, 'rejected', 'Sistemas no puede quedar con una persona.', 'p-diego')).toBe(true);
  });

  it('does not register the leaver of an IT admin (F12)', () => {
    const events = useDataStore.getState().lifecycle.length;
    const job = useDataStore.getState().jobTitles.find((j) => j.id === 'jt-helpdesk');
    useDataStore.getState().registerLifecycle(
      {
        id: 'LC-2026-0099',
        personId: 'p-ramiro',
        type: 'leaver',
        leaverType: 'resignation',
        effectiveDate: '2026-11-10',
        createdBy: 'p-carla',
        createdAt: '2026-11-10T10:00:00',
        accessTasks: leaverTasks(job),
      },
      'p-carla',
    );
    expect(useDataStore.getState().lifecycle).toHaveLength(events);
    expect(person('p-ramiro').status).not.toBe('offboarded');
    expect(lastAudit()).toMatchObject({ action: 'lifecycle.leaver', resource: 'p-ramiro', result: 'denied' });
  });

  it('shows the reason in the review and leaves the row as Revocación bloqueada (F13)', async () => {
    renderAt('/admin/access-review');
    fireEvent.click(await screen.findByRole('button', { name: /Revocar Rol Sistemas de Ramiro Sosa/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText(new RegExp(es.accessReview.revokeDialog.reason)), {
      target: { value: 'Ya no administra Rumbo.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: es.accessReview.revokeDialog.confirmRole }));
    expect(await within(dialog).findByText(es.itMinimum.role)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: es.itMinimum.close }));
    await waitFor(() => expect(screen.getAllByText(es.accessReview.state.revoke_blocked).length).toBeGreaterThan(0));
  });
});
