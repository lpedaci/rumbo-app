import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { taskStatus } from '@/lib/journey';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';


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
  // The guided welcome has its own test below; here it is already seen.
  useSessionStore.getState().markWelcomeSeen('p-sofia');
});

describe('N1 · Mi recorrido', () => {
  it('shows the journey with a single h1, progress and the next tasks', async () => {
    renderAt('/me');
    const h1 = await screen.findByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/^(Buenos días|Buenas tardes|Buenas noches), Sofía$/);
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

describe('Guided welcome (F16, 2.2.1)', () => {
  it('opens on the first visit, moves between steps and is not shown again', async () => {
    useSessionStore.setState({ welcomeSeen: [] });
    renderAt('/me');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'Te damos la bienvenida, Sofía' })).toBeInTheDocument();
    // First step: nothing to go back to.
    expect(within(dialog).queryByRole('button', { name: es.welcome.previous })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: es.welcome.next }));
    expect(await within(dialog).findByRole('heading', { name: es.welcome.hire.steps[1]!.title })).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: es.welcome.next }));
    fireEvent.click(await within(dialog).findByRole('button', { name: es.welcome.hire.finish }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(useSessionStore.getState().welcomeSeen).toContain('p-sofia');
  });

  it('can be skipped', async () => {
    useSessionStore.setState({ welcomeSeen: [] });
    renderAt('/me');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: es.welcome.skip }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(useSessionStore.getState().welcomeSeen).toContain('p-sofia');
  });
});
