import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { normalize, search } from '@/lib/search';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
});

const as = (personId: string, role: 'admin' | 'manager' | 'hire' | 'it_admin') => ({ personId, role });
const groups = (results: { group: string }[]) => [...new Set(results.map((r) => r.group))];

describe('F16 · Global search only shows what the role can see', () => {
  it('ignores accents and case', () => {
    expect(normalize('  Sofía RAMÍREZ ')).toBe('sofia ramirez');
    const data = useDataStore.getState();
    expect(search(data, as('p-carla', 'admin'), 'sofia').some((r) => r.id === 'p-sofia')).toBe(true);
  });

  it('needs at least two letters', () => {
    expect(search(useDataStore.getState(), as('p-carla', 'admin'), 's')).toEqual([]);
  });

  it('lets HR find people, templates and every journey task, but not IT requests', () => {
    const data = useDataStore.getState();
    const results = search(data, as('p-carla', 'admin'), 'analista');
    expect(groups(results)).toEqual(expect.arrayContaining(['people', 'templates']));
    expect(search(data, as('p-carla', 'admin'), 'IT-2026')).toEqual([]);
    expect(search(data, as('p-carla', 'admin'), 'manual').length).toBeGreaterThan(1);
  });

  it('shows a manager only their team and a new hire only their own tasks', () => {
    const data = useDataStore.getState();
    const manager = search(data, as('p-martin', 'manager'), 'manual');
    const team = data.hires.filter((h) => h.managerId === 'p-martin').map((h) => h.personId);
    const owners = data.people.filter((p) => team.includes(p.id)).map((p) => p.name);
    expect(manager.every((r) => owners.includes(r.detail))).toBe(true);
    expect(search(data, as('p-martin', 'manager'), 'camila')).toEqual([]);

    const hire = search(data, as('p-sofia', 'hire'), 'manual');
    expect(hire).toHaveLength(1);
    expect(hire[0]).toMatchObject({ group: 'tasks', detail: 'Sofía Ramírez' });
    expect(hire[0]!.link).toMatch(/^\/me\/tasks\//);
    expect(search(data, as('p-sofia', 'hire'), 'analista').filter((r) => r.group === 'people')).toEqual([]);
  });

  it('lets IT find access requests and approvals, never templates or people', () => {
    const data = useDataStore.getState();
    const results = search(data, as('p-diego', 'it_admin'), 'IT-2026');
    expect(groups(results)).toEqual(['requests']);
    expect(search(data, as('p-diego', 'it_admin'), 'APR-2026').every((r) => r.kind === 'approval')).toBe(true);
    expect(search(data, as('p-diego', 'it_admin'), 'analista')).toEqual([]);
  });
});

describe('G12 · Search results page', () => {
  it('shows the results of the address and filters by type', async () => {
    act(() => {
      switchRole('admin');
    });
    renderAt('/search?q=analista');
    expect(await screen.findByRole('heading', { level: 1, name: 'Resultados de búsqueda' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Plantillas/ }));
    expect(screen.getAllByRole('link', { name: /Analista de Datos/ }).length).toBeGreaterThan(0);
  });
});
