import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { tasksOfStage } from '@/lib/templates';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { useUiStore } from '@/store/ui-store';
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
    // The editor is loaded on demand (route-level code splitting): give it time under a busy test run.
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ejecutivo/a Comercial (copia)' }, { timeout: 5000 }),
    ).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: es.templateVersions.saveDraft }));
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
    fireEvent.click(within(dialog).getByRole('button', { name: es.templates.editor.leave.stay }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe('/admin/templates/tpl-data');
    expect(name).toHaveValue('Analista de Datos 2');

    act(() => {
      void router.navigate('/admin');
    });
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: es.templates.editor.leave.discard }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'));
    expect(useDataStore.getState().templates.find((x) => x.id === 'tpl-data')?.name).not.toBe('Analista de Datos 2');
  });

  it('"Ver como" with unsaved changes asks the same: save the draft and switch, or stay (D-53)', async () => {
    const { router } = renderAt('/admin/templates/tpl-data');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.change(screen.getByLabelText(/Nombre de la plantilla/), { target: { value: 'Analista de Datos 2' } });

    // The guard holds the switch back and opens the dialog; the session does not change
    const proceed = vi.fn();
    let held = false;
    act(() => {
      held = useUiStore.getState().leaveGuard?.(proceed) ?? false;
    });
    expect(held).toBe(true);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(es.templates.editor.leave.title);
    fireEvent.click(within(dialog).getByRole('button', { name: es.templates.editor.leave.stay }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(proceed).not.toHaveBeenCalled();
    expect(useSessionStore.getState().session?.personId).toBe('p-carla');

    // Save the draft and leave: the change is kept and the switch goes on
    act(() => {
      useUiStore.getState().leaveGuard?.(proceed);
    });
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: es.templates.editor.leave.save }));
    await waitFor(() => expect(proceed).toHaveBeenCalledTimes(1));
    expect(useDataStore.getState().templates.find((x) => x.id === 'tpl-data')?.name).toBe('Analista de Datos 2');
    expect(router.state.location.pathname).toBe('/admin/templates/tpl-data');
  });

  it('"Ver como" from the top bar switches only after choosing in the dialog (D-53)', async () => {
    const { router } = renderAt('/admin/templates/tpl-data');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.change(screen.getByLabelText(/Nombre de la plantilla/), { target: { value: 'Otra' } });
    const [trigger] = screen.getAllByRole('button', { name: new RegExp(es.layout.viewAs) });
    fireEvent.pointerDown(trigger!, { button: 0, ctrlKey: false });
    fireEvent.click(await screen.findByRole('menuitemradio', { name: new RegExp(es.roles.manager) }));
    const dialog = await screen.findByRole('dialog');
    expect(useSessionStore.getState().session?.personId).toBe('p-carla');
    fireEvent.click(within(dialog).getByRole('button', { name: es.templates.editor.leave.discard }));
    await waitFor(() => expect(useSessionStore.getState().session?.personId).toBe('p-martin'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/manager'));
  });

  it('shows a summary with the problems instead of saving an incomplete template', async () => {
    renderAt('/admin/templates/new');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(es.templates.editor.titleNew);
    fireEvent.click(screen.getByRole('button', { name: es.templateVersions.saveDraft }));
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

describe('F8 · Template versions', () => {
  it('publishes a saved draft with a required note and keeps journeys on their version', async () => {
    act(() => {
      switchRole('admin');
    });
    const before = useDataStore.getState().templates.find((x) => x.id === 'tpl-data')!;
    // Change the draft and save it, as HR would in the builder.
    act(() => {
      useDataStore
        .getState()
        .saveTemplate({ ...before, tasks: before.tasks.filter((task) => task.id !== 'd18') }, 'p-carla');
    });
    renderAt('/admin/templates/tpl-data');
    await screen.findByRole('heading', { level: 1, name: before.name });
    fireEvent.click(screen.getByRole('button', { name: es.templateVersions.publish }));
    const dialog = await screen.findByRole('dialog');
    // The summary shows the removed task and the note is required.
    expect(within(dialog).getByText(/Quitadas \(1\)/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /Publicar v3/ }));
    expect(await within(dialog).findByText(es.templateVersions.dialog.noteRequired)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(new RegExp(es.templateVersions.dialog.note)), {
      target: { value: 'Quita la retrospectiva duplicada.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /Publicar v3/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    const after = useDataStore.getState().templates.find((x) => x.id === 'tpl-data')!;
    expect(after.versions.map((v) => v.version)).toEqual([1, 2, 3]);
    expect(after.versions.at(-1)!.tasks.some((task) => task.id === 'd18')).toBe(false);
    // Sofía's journey was created from v2 and keeps its tasks.
    const sofia = useDataStore.getState().hires.find((h) => h.id === 'h-sofia')!;
    expect(sofia.templateVersion).toBe(2);
    expect(sofia.tasks.some((task) => task.templateTaskId === 'd18')).toBe(true);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'template.publish', resource: 'tpl-data' });
  });

  it('restores a previous version as a draft from the history (A8)', async () => {
    act(() => {
      switchRole('admin');
    });
    renderAt('/admin/templates/tpl-data/versions');
    await screen.findByRole('heading', { level: 1 });
    fireEvent.click(screen.getByRole('button', { name: es.templateVersions.page.restore }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: es.templateVersions.page.restoreConfirm }));
    await waitFor(() => {
      const tpl = useDataStore.getState().templates.find((x) => x.id === 'tpl-data')!;
      expect(tpl.tasks.some((task) => task.id === 'd17')).toBe(false);
      expect(tpl.versions).toHaveLength(2);
    });
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'template.restore' });
  });
});
