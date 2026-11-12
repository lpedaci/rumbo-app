import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { toCsv } from '@/lib/csv';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
});

describe('F16 · Exports', () => {
  it('quotes every value so commas, quotes and line breaks are safe', () => {
    expect(toCsv(['a', 'b'], [['x, y', 'dijo "hola"']])).toBe('"a","b"\r\n"x, y","dijo ""hola"""');
  });

  it('downloads a list with sensitive data hidden and records it', async () => {
    const created: Blob[] = [];
    URL.createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return 'blob:demo';
    });
    URL.revokeObjectURL = vi.fn();
    act(() => {
      switchRole('admin');
    });
    renderAt('/admin/reports');
    fireEvent.click(await screen.findByRole('button', { name: 'Descargar CSV: Personas' }));
    await waitFor(() => expect(created).toHaveLength(1));
    const text = await created[0]!.text();
    expect(text).toContain('***.***.');
    expect(text).not.toContain('40.294.371');
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'report.export', resource: 'people' });
  });

  it('unhides the data only after a second person approves, and only once (F14)', () => {
    const store = useDataStore.getState();
    const id = store.requestPiiExport('Alta de cuentas sueldo de noviembre.', 'p-carla');
    expect(useDataStore.getState().consumeUnmaskedExport(id, 'p-carla')).toBe(false);
    expect(useDataStore.getState().notifications.some((n) => n.type === 'approval.export_pending' && n.recipientId === 'p-diego')).toBe(true);
    // The requester can never approve it.
    expect(useDataStore.getState().decideApproval(id, 'approved', '', 'p-carla')).toBe(false);
    expect(useDataStore.getState().decideApproval(id, 'approved', '', 'p-diego')).toBe(true);
    // Only who asked downloads it, once.
    expect(useDataStore.getState().consumeUnmaskedExport(id, 'p-martin')).toBe(false);
    expect(useDataStore.getState().consumeUnmaskedExport(id, 'p-carla')).toBe(true);
    expect(useDataStore.getState().consumeUnmaskedExport(id, 'p-carla')).toBe(false);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'report.export', detail: `unmasked · ${id}` });
  });

  it('asks for a reason before sending the request', async () => {
    act(() => {
      switchRole('admin');
    });
    renderAt('/admin/reports');
    fireEvent.click(await screen.findByRole('button', { name: es.reports.unmasked.request }));
    fireEvent.click(await screen.findByRole('button', { name: es.reports.unmasked.send }));
    expect(await screen.findByText(es.reports.unmasked.reasonRequired)).toBeInTheDocument();
  });
});
