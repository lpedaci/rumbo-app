import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import {
  DEVICES_ACCESS,
  isEffective,
  joinerTasks,
  leaverTasks,
  lifecycleState,
  moverTasks,
  nextLifecycleId,
} from '@/lib/lifecycle';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';
import type { LifecycleEvent } from '@/types/domain';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
  act(() => {
    switchRole('admin');
  });
});

const job = (id: string) => useDataStore.getState().jobTitles.find((j) => j.id === id)!;

describe('F12 · Access lifecycle rules', () => {
  it('grants every access of the job on a joiner', () => {
    const tasks = joinerTasks(job('jt-data'));
    expect(tasks.map((t) => t.system)).toEqual(job('jt-data').suggestedAccess);
    expect(tasks.every((t) => t.action === 'grant' && t.status === 'pending')).toBe(true);
  });

  it('grants what the new job adds and revokes what it no longer needs on a mover', () => {
    const tasks = moverTasks(job('jt-data'), job('jt-frontend'));
    expect(tasks.filter((t) => t.action === 'grant').map((t) => t.system)).toEqual(['GitHub', 'Figma']);
    expect(tasks.filter((t) => t.action === 'revoke').map((t) => t.system)).toEqual(['Data warehouse', 'Herramienta de BI']);
  });

  it('revokes every access and the devices on a leaver', () => {
    const tasks = leaverTasks(job('jt-sales'));
    expect(tasks.map((t) => t.system)).toEqual([...job('jt-sales').suggestedAccess, DEVICES_ACCESS]);
    expect(tasks.every((t) => t.action === 'revoke')).toBe(true);
  });

  it('derives the state from the effective date and the tasks done', () => {
    const base: LifecycleEvent = {
      id: 'LC-2026-0099',
      personId: 'p-bruno',
      type: 'leaver',
      effectiveDate: '2026-12-01',
      createdBy: 'p-carla',
      createdAt: '2026-11-10T10:00:00',
      accessTasks: leaverTasks(job('jt-frontend')),
    };
    expect(lifecycleState(base)).toBe('scheduled');
    expect(isEffective(base)).toBe(false);
    expect(isEffective({ effectiveDate: '2026-11-10' })).toBe(true);
    const oneDone = { ...base, accessTasks: base.accessTasks.map((t, i) => (i === 0 ? { ...t, status: 'done' as const } : t)) };
    expect(lifecycleState(oneDone)).toBe('in_progress');
    const allDone = { ...base, accessTasks: base.accessTasks.map((t) => ({ ...t, status: 'done' as const })) };
    expect(lifecycleState(allDone)).toBe('done');
    expect(nextLifecycleId(useDataStore.getState().lifecycle)).toBe('LC-2026-0005');
  });
});

describe('F12 · Store', () => {
  it('disables the account and closes its sessions when a leaver takes effect', () => {
    const event: LifecycleEvent = {
      id: 'LC-2026-0005',
      personId: 'p-lucas',
      type: 'leaver',
      leaverType: 'resignation',
      effectiveDate: '2026-11-10',
      createdBy: 'p-carla',
      createdAt: '2026-11-10T10:00:00',
      accessTasks: leaverTasks(job('jt-data')),
    };
    useDataStore.getState().registerLifecycle(event, 'p-carla');
    const state = useDataStore.getState();
    expect(state.people.find((p) => p.id === 'p-lucas')!.status).toBe('offboarded');
    expect(state.deviceSessions.filter((s) => s.personId === 'p-lucas').every((s) => s.revokedAt)).toBe(true);
    expect(state.auditEvents.at(-1)).toMatchObject({ action: 'lifecycle.leaver', resource: 'p-lucas' });
    expect(state.notifications.some((n) => n.type === 'access_tasks.new' && n.recipientId === 'p-diego')).toBe(true);
    expect(state.notifications.some((n) => n.type === 'offboarding.reminder')).toBe(true);
  });

  it('keeps a future change scheduled and moves the person only when it takes effect', () => {
    const future: LifecycleEvent = {
      id: 'LC-2026-0005',
      personId: 'p-valentina',
      type: 'mover',
      effectiveDate: '2026-12-01',
      fromJobTitleId: 'jt-frontend',
      toJobTitleId: 'jt-dev-lead',
      createdBy: 'p-carla',
      createdAt: '2026-11-10T10:00:00',
      accessTasks: moverTasks(job('jt-frontend'), job('jt-dev-lead')),
    };
    useDataStore.getState().registerLifecycle(future, 'p-carla');
    expect(useDataStore.getState().people.find((p) => p.id === 'p-valentina')!.jobTitleId).toBe('jt-frontend');

    useDataStore.getState().registerLifecycle({ ...future, id: 'LC-2026-0006', effectiveDate: '2026-11-10' }, 'p-carla');
    expect(useDataStore.getState().people.find((p) => p.id === 'p-valentina')!.jobTitleId).toBe('jt-dev-lead');
  });

  it('marks an access as done once, with who and when, and audits it', () => {
    const event = useDataStore.getState().lifecycle.find((e) => e.id === 'LC-2026-0004')!;
    const pending = event.accessTasks.find((t) => t.status === 'pending')!;
    useDataStore.getState().completeAccessTask(event.id, pending.id, 'p-diego');
    const done = useDataStore.getState().lifecycle.find((e) => e.id === event.id)!.accessTasks.find((t) => t.id === pending.id)!;
    expect(done).toMatchObject({ status: 'done', doneBy: 'p-diego' });
    expect(done.doneAt!.slice(0, 10)).toBe('2026-11-10');
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'access.revoke', actorId: 'p-diego' });
    const audits = useDataStore.getState().auditEvents.length;
    useDataStore.getState().completeAccessTask(event.id, pending.id, 'p-diego');
    expect(useDataStore.getState().auditEvents).toHaveLength(audits);
  });

  it('creates the joiner with the access of the job that suggests the template', () => {
    const state = useDataStore.getState();
    const base = state.hires.find((h) => h.id === 'h-sofia')!;
    const person = { ...state.people.find((p) => p.id === 'p-lucas')!, id: 'p-new', name: 'Ana Nueva' };
    state.addHire(person, { ...base, id: 'h-new', personId: 'p-new', startDate: '2026-12-01' }, 'p-carla');
    const joiner = useDataStore.getState().lifecycle.at(-1)!;
    const suggested = useDataStore.getState().jobTitles.find((j) => j.suggestedTemplateId === base.templateId)!;
    expect(joiner).toMatchObject({ personId: 'p-new', type: 'joiner', effectiveDate: '2026-12-01', toJobTitleId: suggested.id });
    expect(joiner.accessTasks.map((t) => t.system)).toEqual(suggested.suggestedAccess);
  });
});

describe('A11 and S4 · Lifecycle screens', () => {
  it('registers a leaver from A11, with errors first and the access preview', async () => {
    renderAt('/admin/lifecycle');
    expect(await screen.findByRole('heading', { level: 1, name: es.lifecycle.title })).toBeInTheDocument();
    // One main action with its variants (D-134): the menu offers joiner, job change and leaver
    fireEvent.pointerDown(screen.getByRole('button', { name: es.lifecycle.register }), { button: 0, ctrlKey: false });
    const items = (await screen.findAllByRole('menuitem')).map((i) => i.textContent);
    expect(items).toEqual([
      expect.stringContaining(es.lifecycle.registerJoiner),
      expect.stringContaining(es.lifecycle.types.mover),
      expect.stringContaining(es.lifecycle.types.leaver),
    ]);
    fireEvent.click(screen.getByRole('menuitem', { name: new RegExp(`^${es.lifecycle.types.leaver}`) }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: es.lifecycle.form.saveLeaver }));
    expect(await within(dialog).findByText(es.lifecycle.form.personRequired)).toBeInTheDocument();
    // Demo accounts and people already leaving are never offered.
    const select = within(dialog).getByLabelText(new RegExp(es.lifecycle.form.person));
    const options = within(select).getAllByRole('option').map((o) => o.getAttribute('value'));
    expect(options).not.toContain('p-sofia');
    expect(options).not.toContain('p-federico');

    fireEvent.change(select, { target: { value: 'p-bruno' } });
    fireEvent.change(within(dialog).getByLabelText(new RegExp(es.lifecycle.form.effectiveDate)), {
      target: { value: '10/11/2026' },
    });
    fireEvent.click(within(dialog).getByLabelText(es.lifecycle.leaverTypes.resignation));
    expect(within(dialog).getByText(/Revocar: Cuenta de trabajo/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: es.lifecycle.form.saveLeaver }));
    await waitFor(() => expect(useDataStore.getState().lifecycle).toHaveLength(5));
    expect(useDataStore.getState().people.find((p) => p.id === 'p-bruno')!.status).toBe('offboarded');
  });

  it('lets IT mark an access as done in S4', async () => {
    act(() => {
      switchRole('it_admin');
    });
    renderAt('/it/lifecycle?event=LC-2026-0004');
    expect(await screen.findByRole('heading', { level: 1, name: es.lifecycle.it.title })).toBeInTheDocument();
    const card = screen.getByRole('region', { name: /LC-2026-0004/ });
    const before = within(card).getAllByRole('button', { name: new RegExp(es.lifecycle.it.markDone) }).length;
    fireEvent.click(within(card).getAllByRole('button', { name: new RegExp(es.lifecycle.it.markDone) })[0]!);
    await waitFor(() =>
      expect(within(card).getAllByRole('button', { name: new RegExp(es.lifecycle.it.markDone) })).toHaveLength(before - 1),
    );
  });
});
