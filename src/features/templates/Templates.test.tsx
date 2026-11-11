import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { tasksOfStage } from '@/lib/templates';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';


const template = (id: string) => useDataStore.getState().templates.find((t) => t.id === id)!;

/** Opens a Radix dropdown with the keyboard (as a keyboard user would). */
function openMenu(name: string | RegExp) {
  const trigger = screen.getAllByRole('button', { name })[0]!;
  fireEvent.keyDown(trigger, { key: 'Enter' });
  return screen.getByRole('menu');
}

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
  act(() => {
    switchRole('admin');
  });
});

describe('A5 · Templates list', () => {
  it('lists the templates with task count and usage', async () => {
    renderAt('/admin/templates');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(es.templates.list.title);
    const table = screen.getByRole('table');
    const row = within(table).getByRole('link', { name: 'Analista de Datos' }).closest('tr')!;
    expect(within(row).getByText(String(template('tpl-data').tasks.length))).toBeInTheDocument();
  });

  it('does not allow deleting a template in use, and says why', async () => {
    renderAt('/admin/templates');
    await screen.findByRole('heading', { level: 1 });
    const menu = openMenu('Acciones de Analista de Datos');
    const item = within(menu).getByRole('menuitem', { name: /Eliminar plantilla/ });
    expect(item).toHaveAttribute('aria-disabled', 'true');
    expect(item).toHaveTextContent(/No se puede eliminar: 3 ingresos usan esta plantilla/);
  });

  it('duplicates a template and opens the copy in the editor', async () => {
    renderAt('/admin/templates');
    await screen.findByRole('heading', { level: 1 });
    const menu = openMenu('Acciones de Ejecutivo/a Comercial');
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Duplicar plantilla' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Ejecutivo/a Comercial (copia)' })).toBeInTheDocument();
    const templates = useDataStore.getState().templates;
    expect(templates).toHaveLength(4);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'template.create', actorId: 'p-carla' });
  });
});

describe('A6 · Template builder', () => {
  it('moves a task down with the menu alternative to dragging and saves it', async () => {
    renderAt('/admin/templates/tpl-data');
    await screen.findByRole('heading', { level: 1 });
    const before = tasksOfStage(template('tpl-data').tasks, 'week1').map((t) => t.title);

    const menu = openMenu(`Acciones de la tarea ${before[0]}`);
    fireEvent.click(within(menu).getByRole('menuitem', { name: 'Bajar' }));
    expect(screen.getByText(es.templates.editor.unsaved)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar plantilla' }));
    await waitFor(() => expect(screen.queryByText(es.templates.editor.unsaved)).not.toBeInTheDocument());
    const after = tasksOfStage(template('tpl-data').tasks, 'week1').map((t) => t.title);
    expect(after.slice(0, 2)).toEqual([before[1], before[0]]);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'template.update', resource: 'tpl-data' });
  });

  it('explains the due day range of the stage when adding a task', async () => {
    renderAt('/admin/templates/tpl-data');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar tarea a Semana 1' }));
    const dialog = await screen.findByRole('dialog');

    fireEvent.change(within(dialog).getByLabelText(/Título/), { target: { value: 'Revisar el plan' } });
    fireEvent.change(within(dialog).getByLabelText(/Descripción/), { target: { value: 'Lee el plan del equipo.' } });
    const offset = within(dialog).getByLabelText(/Plazo/);
    fireEvent.change(offset, { target: { value: '12' } });
    fireEvent.blur(offset);
    expect(await within(dialog).findByText('Para Semana 1, ingresa un día entre 0 y 6.')).toBeInTheDocument();

    fireEvent.change(offset, { target: { value: '5' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Agregar tarea' }));
    expect(await screen.findByRole('button', { name: 'Revisar el plan' })).toBeInTheDocument();
  });

  it('disables a dependency that would create a cycle, with the reason', async () => {
    renderAt('/admin/templates/tpl-data');
    await screen.findByRole('heading', { level: 1 });
    // "Crear cuenta…" (d2) is required by "Acceso a Jira…" (d8): d2 cannot depend on d8.
    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta de trabajo y correo' }));
    const dialog = await screen.findByRole('dialog');
    const offset = within(dialog).getByLabelText(/Plazo/);
    fireEvent.change(offset, { target: { value: '-1' } });
    const jira = within(dialog).getByRole('checkbox', { name: /Acceso a Jira y Confluence/ });
    expect(jira).toBeDisabled();
  });

  it('asks before leaving with unsaved changes, also from the side navigation (D-53)', async () => {
    const { router } = renderAt('/admin/templates/tpl-data');
    await screen.findByRole('heading', { level: 1 });
    const name = screen.getByLabelText(/Nombre de la plantilla/);
    fireEvent.change(name, { target: { value: 'Analista de Datos 2' } });

    act(() => {
      void router.navigate('/admin');
    });
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(es.templates.editor.leave.title);
    fireEvent.click(within(dialog).getByRole('button', { name: es.ui.cancel }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe('/admin/templates/tpl-data');
    expect(name).toHaveValue('Analista de Datos 2');

    act(() => {
      void router.navigate('/admin');
    });
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: es.templates.editor.leave.confirm }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
  });

  it('shows a summary with the problems instead of saving an incomplete template', async () => {
    renderAt('/admin/templates/new');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(es.templates.editor.titleNew);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar plantilla' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(es.templates.editor.issues.title);
    expect(alert).toHaveTextContent(es.templates.editor.issues.no_tasks);
    expect(useDataStore.getState().templates).toHaveLength(3);
  });

  it('shows not found for an unknown template', async () => {
    renderAt('/admin/templates/no-existe');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(es.notFound.title);
  });
});

describe('A7 · Preview', () => {
  it('shows the journey with dates from the sample start date and nothing to complete', async () => {
    renderAt('/admin/templates/tpl-data/preview');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Analista de Datos');
    expect(screen.getByLabelText(/Fecha de ingreso de ejemplo/)).toHaveValue('13/10/2026');
    expect(screen.queryByRole('button', { name: /Marcar como hecha/ })).not.toBeInTheDocument();
    // "Acceso a Jira…" is due on day 2: 15/10/2026.
    const row = screen.getByText('Acceso a Jira y Confluence').closest('li')!;
    expect(row).toHaveTextContent('15/10/2026');
  });
});
