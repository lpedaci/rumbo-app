import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppProviders } from '@/app/AppProviders';
import { AppRoutes } from '@/app/AppRoutes';
import { switchRole } from '@/features/auth/auth-service';
import { taskStatus } from '@/lib/journey';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
}

const sofiaTasks = () => useDataStore.getState().hires.find((h) => h.personId === 'p-sofia')!.tasks;
const statusOf = (id: string) => {
  const tasks = sofiaTasks();
  return taskStatus(tasks.find((x) => x.id === id)!, tasks);
};

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
  act(() => {
    switchRole('hire');
  });
});

describe('N1 · Mi recorrido', () => {
  it('shows the journey with a single h1, progress and the next tasks', async () => {
    renderAt('/me');
    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(es.journey.title);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: es.journey.next.title })).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(1);
  });

  it('completing a task unlocks the tasks that depend on it (F1)', async () => {
    renderAt('/me');
    await screen.findByRole('heading', { level: 1 });
    expect(statusOf('h-sofia-d16')).toBe('blocked');

    const [button] = screen.getAllByRole('button', { name: 'Marcar como hecha: Primer análisis guiado' });
    fireEvent.click(button!);

    expect(statusOf('h-sofia-d15')).toBe('done');
    expect(statusOf('h-sofia-d16')).not.toBe('blocked');
    expect(await screen.findByText('Se desbloqueó: Presentar resultados al equipo')).toBeInTheDocument();
  });

  it('never offers to complete tasks owned by someone else', async () => {
    renderAt('/me');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: /Retrospectiva del recorrido/ })).not.toBeInTheDocument();
  });
});

describe('N2 · Task detail', () => {
  it('explains why a blocked task is not available, with a link to the blocker', async () => {
    renderAt('/me/tasks/h-sofia-d17');
    await screen.findByRole('heading', { level: 1, name: 'Proyecto propio: tablero de métricas' });
    const alert = screen.getByText(es.task.blockedTitle).closest('div')!.parentElement!;
    expect(within(alert).getByRole('link', { name: 'Presentar resultados al equipo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: es.journey.complete })).not.toBeInTheDocument();
  });

  it('completes an available task from its detail', async () => {
    renderAt('/me/tasks/h-sofia-d15');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(screen.getByRole('button', { name: es.journey.complete }));
    expect(statusOf('h-sofia-d15')).toBe('done');
    expect(await screen.findByText(es.task.doneTitle)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Presentar resultados al equipo' })).toBeInTheDocument();
  });

  it('shows a course with its lessons', async () => {
    renderAt('/me/tasks/h-sofia-d9');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('heading', { name: es.task.course.title })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(3);
  });

  it('does not reveal tasks from another journey (least privilege)', async () => {
    const other = useDataStore.getState().hires.find((h) => h.personId !== 'p-sofia')!;
    renderAt(`/me/tasks/${other.tasks[0]!.id}`);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(es.notFound.title);
  });
});
