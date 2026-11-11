import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import es from '@/locales/es.json';
import { alerts } from '@/lib/metrics';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

const sofia = () => useDataStore.getState().hires.find((h) => h.id === 'h-sofia')!;

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
});

describe('J1 · My team', () => {
  beforeEach(() => {
    act(() => {
      switchRole('manager');
    });
    useSessionStore.getState().markWelcomeSeen('p-martin');
  });

  it('shows only the manager team, with a check-in action', async () => {
    renderAt('/manager');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Martín/);
    const people = useDataStore.getState().people;
    const others = useDataStore
      .getState()
      .hires.filter((h) => h.managerId !== 'p-martin')
      .map((h) => people.find((p) => p.id === h.personId)!.name);
    for (const name of others) expect(screen.queryByRole('heading', { name })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: es.team.doCheckin }).length).toBeGreaterThan(0);
  });
});

describe('J3 · Manager check-in (F5)', () => {
  beforeEach(() => {
    act(() => {
      switchRole('manager');
    });
  });

  it('asks for a result in every milestone before saving', async () => {
    renderAt('/manager/hires/h-sofia/checkin/day30');
    fireEvent.click(await screen.findByRole('button', { name: es.managerCheckin.submit }));
    expect(await screen.findByText(es.managerCheckin.errors)).toBeInTheDocument();
    expect(sofia().checkins[0]!.status).not.toBe('completed');
  });

  it('a milestone not met and escalated creates an alert for HR', async () => {
    renderAt('/manager/hires/h-sofia/checkin/day30');
    const groups = await screen.findAllByRole('group');
    const milestones = groups.slice(0, 3);
    fireEvent.click(within(milestones[0]!).getByRole('radio', { name: /Cumplido/ }));
    fireEvent.click(within(milestones[1]!).getByRole('radio', { name: /Parcial/ }));
    fireEvent.click(within(milestones[2]!).getByRole('radio', { name: /No cumplido/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Escalar a RRHH/ }));
    fireEvent.change(screen.getByRole('textbox', { name: /Motivo para RRHH/ }), {
      target: { value: 'Todavía no tiene los accesos.' },
    });
    fireEvent.click(screen.getByRole('button', { name: es.managerCheckin.submit }));

    const checkin = sofia().checkins.find((c) => c.stage === 'day30')!;
    expect(checkin.status).toBe('completed');
    expect(checkin.action).toEqual({ type: 'escalate', note: 'Todavía no tiene los accesos.' });
    expect(
      alerts(useDataStore.getState().hires).some((a) => a.kind === 'checkin_escalated' && a.hireId === 'h-sofia'),
    ).toBe(true);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'checkin.escalate' });
  });
});

describe('N3 · Self-review', () => {
  beforeEach(() => {
    act(() => {
      switchRole('hire');
    });
    useSessionStore.getState().markWelcomeSeen('p-sofia');
  });

  it('asks how the hire feels and sends the self-review', async () => {
    renderAt('/me/checkin/day30');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Tu autoevaluación de los 30 días');
    fireEvent.click(screen.getByRole('button', { name: es.selfReview.submit }));
    expect(await screen.findByText(es.selfReview.moodRequired)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /Bien/ }));
    fireEvent.change(screen.getByRole('textbox', { name: /Cómo te va/ }), { target: { value: 'Voy aprendiendo.' } });
    fireEvent.click(screen.getByRole('button', { name: es.selfReview.submit }));
    const checkin = sofia().checkins.find((c) => c.stage === 'day30')!;
    expect(checkin.status).toBe('hire_done');
    expect(checkin.hireSelfReview).toMatchObject({ mood: 4, comment: 'Voy aprendiendo.' });
  });
});
