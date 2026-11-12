import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { filterPeople, needsApproval, personStatus } from '@/lib/people';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
  act(() => {
    switchRole('admin');
  });
});

describe('F15 · People rules', () => {
  it('asks for a second person only when an admin role is given or taken', () => {
    expect(needsApproval('hire', 'admin')).toBe(true);
    expect(needsApproval('it_admin', 'manager')).toBe(true);
    expect(needsApproval('hire', 'manager')).toBe(false);
  });

  it('derives the status and filters by name, area, role and status', () => {
    const { people, authAttempts } = useDataStore.getState();
    const joaquin = people.find((p) => p.id === 'p-joaquin')!;
    expect(personStatus(joaquin, authAttempts)).toBe('locked');
    const base = { query: '', areaId: 'all', role: 'all', status: 'all' };
    expect(filterPeople(people, authAttempts, { ...base, query: 'sofia' }).map((p) => p.id)).toEqual(['p-sofia']);
    expect(filterPeople(people, authAttempts, { ...base, status: 'locked' }).map((p) => p.id)).toEqual(['p-joaquin']);
    expect(filterPeople(people, authAttempts, { ...base, areaId: 'a-comercial', role: 'manager' }).map((p) => p.id)).toEqual(['p-lucia']);
  });

  it('applies a basic role change at once and sends an admin one to approval', () => {
    const store = useDataStore.getState();
    expect(store.changeRole('p-nicolas', 'manager', 'Pasa a liderar el equipo de Datos.', 'p-carla')).toBeUndefined();
    expect(useDataStore.getState().people.find((p) => p.id === 'p-nicolas')!.role).toBe('manager');

    const id = useDataStore.getState().changeRole('p-lucia', 'admin', 'Se suma al equipo de Personas.', 'p-carla');
    expect(id).toBe('APR-2026-0004');
    const state = useDataStore.getState();
    expect(state.people.find((p) => p.id === 'p-lucia')!.role).toBe('manager');
    expect(state.approvals.at(-1)).toMatchObject({ targetId: 'p-lucia', fromRole: 'manager', toRole: 'admin', status: 'pending', requestedBy: 'p-carla' });
    // Every IT admin hears about it (Diego and Ramiro), never the requester.
    expect(state.notifications.filter((n) => n.type === 'approval.pending' && n.params.request === id).map((n) => n.recipientId).sort()).toEqual(['p-diego', 'p-ramiro']);
  });

  it('renames an area on every person of the area and never deletes one in use', () => {
    const store = useDataStore.getState();
    store.saveArea({ id: 'a-comercial', name: 'Ventas' }, 'p-carla');
    expect(useDataStore.getState().people.filter((p) => p.areaId === 'a-comercial').every((p) => p.area === 'Ventas')).toBe(true);
    useDataStore.getState().deleteArea('a-comercial', 'p-carla');
    expect(useDataStore.getState().areas.some((a) => a.id === 'a-comercial')).toBe(true);
  });
});

describe('A9 and A10 · People screens', () => {
  it('lists people with search and opens a record', async () => {
    renderAt('/admin/people');
    expect(await screen.findByRole('heading', { level: 1, name: es.people.title })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(es.people.search), { target: { value: 'Nicolás' } });
    expect(screen.getByText('1 persona')).toBeInTheDocument();
    // Not a new hire: the basic role reads "Acceso básico".
    expect(screen.getByText(es.people.roleBasic)).toBeInTheDocument();
  });

  it('requests approval to make someone HR admin, with a required reason', async () => {
    renderAt('/admin/people/p-lucia');
    expect(await screen.findByRole('heading', { name: es.people.detail.roleCard })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(new RegExp(es.people.detail.newRole)), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: es.people.detail.requestApproval }));
    expect(await screen.findByText(es.people.detail.reasonRequired)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(new RegExp(es.people.detail.reason)), {
      target: { value: 'Se suma al equipo de Personas.' },
    });
    fireEvent.click(screen.getByRole('button', { name: es.people.detail.requestApproval }));
    await waitFor(() => expect(useDataStore.getState().approvals).toHaveLength(4));
    expect(await screen.findByText(/pendiente de aprobación/)).toBeInTheDocument();
  });

  it('keeps the role of the demo accounts', async () => {
    renderAt('/admin/people/p-sofia');
    expect(await screen.findByText(/Es una cuenta de demo/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: es.people.detail.changeRole })).not.toBeInTheDocument();
  });
});
