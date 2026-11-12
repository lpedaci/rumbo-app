import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';
import { helpKeyFor } from './ScreenHelp';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
});

describe('F16 · Contextual help', () => {
  it('finds the help of the most specific screen', () => {
    expect(helpKeyFor('/admin')).toBe('dashboard');
    expect(helpKeyFor('/admin/hires/new')).toBe('hireNew');
    expect(helpKeyFor('/admin/hires/h-sofia')).toBe('hireRecord');
    expect(helpKeyFor('/manager/hires/h-sofia/checkin/day30')).toBe('checkin');
    expect(helpKeyFor('/it/access-review')).toBe('accessReview');
    expect(helpKeyFor('/it/access-reviews/AR-2026-0001')).toBe('campaigns');
    expect(helpKeyFor('/nowhere')).toBeUndefined();
  });

  it('opens the help of the current screen from the Help menu', async () => {
    act(() => {
      switchRole('it_admin');
    });
    renderAt('/it/approvals');
    const help = await screen.findByRole('button', { name: es.layout.help.title });
    fireEvent.pointerDown(help, { button: 0, ctrlKey: false });
    fireEvent.click(await screen.findByRole('menuitem', { name: es.help.menuItem }));
    expect(await screen.findByRole('heading', { name: `Ayuda: ${es.help.screens.approvals.title}` })).toBeInTheDocument();
    expect(screen.getByText(es.help.screens.approvals.points[1]!)).toBeInTheDocument();
  });
});

describe('F16 · Guided welcome for every role', () => {
  it('welcomes HR on the first visit with three steps and is not shown again', async () => {
    act(() => {
      switchRole('admin');
    });
    renderAt('/admin', { welcome: true });
    expect(await screen.findByRole('heading', { name: 'Te damos la bienvenida, Carla' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: es.welcome.next }));
    fireEvent.click(screen.getByRole('button', { name: es.welcome.next }));
    fireEvent.click(screen.getByRole('button', { name: es.welcome.hr.finish }));
    await waitFor(() => expect(useSessionStore.getState().welcomeSeen).toContain('p-carla'));
  });

  it('welcomes managers and IT with their own steps', async () => {
    act(() => {
      switchRole('it_admin');
    });
    renderAt('/it/requests', { welcome: true });
    expect(await screen.findByRole('heading', { name: 'Te damos la bienvenida, Diego' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: es.welcome.next }));
    expect(await screen.findByRole('heading', { name: es.welcome.it.steps[1]!.title })).toBeInTheDocument();
  });
});
