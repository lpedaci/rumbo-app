import { act, fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { formatNumber } from '@/lib/dates';
import { alerts, kpis } from '@/lib/metrics';
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

/** Value shown in the KPI card whose heading is `label`. */
function kpiValue(label: string) {
  const card = screen.getByRole('heading', { name: label }).closest('section')!;
  return card.querySelector('p.tabular-nums')?.textContent;
}

describe('A1 · HR panel (F4)', () => {
  it('shows the KPIs computed from the data', async () => {
    renderAt('/admin');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Carla/);
    const k = kpis(useDataStore.getState().hires);
    expect(kpiValue(es.dashboard.kpis.active)).toBe(formatNumber(k.activeHires));
    expect(kpiValue(es.dashboard.kpis.delayed)).toBe(formatNumber(k.delayedJourneys));
  });

  it('updates the KPIs when the data changes', async () => {
    const { hires } = useDataStore.getState();
    const before = kpis(hires).delayedJourneys;
    const delayed = hires.find(
      (h) => h.status === 'active' && h.tasks.some((t) => t.dueDate < '2026-11-10' && t.status !== 'done'),
    )!;
    act(() => {
      useDataStore.setState({
        hires: hires.map((h) =>
          h.id === delayed.id
            ? { ...h, tasks: h.tasks.map((t) => ({ ...t, status: 'done' as const, completedAt: t.dueDate })) }
            : h,
        ),
      });
    });
    renderAt('/admin');
    await screen.findByRole('heading', { level: 1 });
    expect(kpiValue(es.dashboard.kpis.delayed)).toBe(formatNumber(before - 1));
  });

  it('lists the escalated check-in first and each alert opens the hire record', async () => {
    renderAt('/admin');
    await screen.findByRole('heading', { name: es.dashboard.alerts.title });
    const list = alerts(useDataStore.getState().hires);
    expect(list[0]?.kind).toBe('checkin_escalated');
    const first = screen.getAllByRole('link', { name: /Escalado a RRHH/ })[0]!;
    fireEvent.click(first);
    expect(await screen.findByRole('link', { name: es.hires.detail.back })).toBeInTheDocument();
  });

  it('switches the progress chart to the per-hire view', async () => {
    renderAt('/admin');
    fireEvent.click(await screen.findByRole('radio', { name: es.dashboard.progress.byHire }));
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
  });
});
