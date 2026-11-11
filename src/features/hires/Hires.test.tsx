import { act, fireEvent, screen, within } from '@testing-library/react';
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
  act(() => {
    switchRole('admin');
  });
  useSessionStore.getState().markWelcomeSeen('p-carla');
});

describe('A2 · Hires', () => {
  it('lists every hire and filters by status', async () => {
    renderAt('/admin/hires');
    expect(await screen.findByRole('heading', { level: 1, name: es.hires.list.title })).toBeInTheDocument();
    const total = useDataStore.getState().hires.length;
    expect(screen.getByText(`${total} ingresos`)).toBeInTheDocument();

    const upcoming = screen.getByRole('button', { name: /Próximos a ingresar/ });
    fireEvent.click(upcoming);
    expect(upcoming).toHaveAttribute('aria-pressed', 'true');
    const table = screen.getByRole('table');
    for (const row of within(table).getAllByRole('row').slice(1)) {
      expect(within(row).getByText(es.hires.status.upcoming)).toBeInTheDocument();
    }
  });
});

describe('A3 · New hire', () => {
  it('shows errors when leaving required fields empty and keeps what was typed', async () => {
    renderAt('/admin/hires/new');
    const name = await screen.findByRole('textbox', { name: /Nombre y apellido/ });
    fireEvent.change(name, { target: { value: 'Martina Gómez' } });
    fireEvent.click(screen.getByRole('button', { name: es.hires.form.submit }));
    expect(await screen.findAllByText(es.validation.required)).not.toHaveLength(0);
    expect(name).toHaveValue('Martina Gómez');
  });

  it('creates the journey from the template and opens the hire record (F3)', async () => {
    renderAt('/admin/hires/new');
    fireEvent.change(await screen.findByRole('textbox', { name: /Nombre y apellido/ }), {
      target: { value: 'Martina Gómez' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /Fecha de ingreso/ }), { target: { value: '01/12/2026' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Plantilla/ }), { target: { value: 'tpl-data' } });
    fireEvent.change(screen.getByRole('combobox', { name: /Jefe directo/ }), { target: { value: 'p-martin' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Celular/ }), { target: { value: '+54 9 11 5555 5555' } });
    // The template fills in the job title and the area
    expect(screen.getByRole('textbox', { name: /Puesto/ })).not.toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: es.hires.form.submit }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Martina Gómez' })).toBeInTheDocument();
    const state = useDataStore.getState();
    const hire = state.hires.find((h) => h.personId === state.people.find((p) => p.name === 'Martina Gómez')?.id)!;
    const template = state.templates.find((t) => t.id === 'tpl-data')!;
    expect(hire.tasks).toHaveLength(template.tasks.length);
    expect(hire.startDate).toBe('2026-12-01');
    expect(state.auditEvents.at(-1)).toMatchObject({ action: 'hire.create', resource: hire.id });
  });
});

describe('A4 · Hire record', () => {
  it('shows the journey and lets HR complete tasks of other owners', async () => {
    renderAt('/admin/hires/h-sofia');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sofía Ramírez' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: es.hires.detail.checkins })).toBeInTheDocument();
    const hire = useDataStore.getState().hires.find((h) => h.id === 'h-sofia')!;
    const pending = hire.tasks.find(
      (t) => t.status !== 'done' && t.owner !== 'hire' && t.type !== 'course' && t.dependsOn.length === 0,
    );
    if (pending) {
      fireEvent.click(screen.getByRole('button', { name: `Marcar como hecha: ${pending.title}` }));
      const updated = useDataStore.getState().hires.find((h) => h.id === 'h-sofia')!;
      expect(updated.tasks.find((t) => t.id === pending.id)!.status).toBe('done');
    }
  });

  it('shows "not found" for an unknown hire', async () => {
    renderAt('/admin/hires/no-existe');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(es.notFound.title);
  });
});
