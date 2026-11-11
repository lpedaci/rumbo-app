import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import { lockedAccounts } from '@/lib/access';
import es from '@/locales/es.json';
import { useDataStore } from '@/store/data-store';
import { useSessionStore } from '@/store/session-store';
import { renderAt } from '@/test/render-app';

beforeEach(() => {
  localStorage.clear();
  useDataStore.getState().resetData();
  useSessionStore.getState().resetSessionState();
  act(() => {
    switchRole('it_admin');
  });
  useSessionStore.getState().markWelcomeSeen('p-diego');
});

describe('S1 · Access request inbox', () => {
  it('lists every request and filters by status', async () => {
    renderAt('/it/requests');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/Diego/);
    const table = screen.getByRole('table');
    const total = useDataStore.getState().accessRequests.length;
    expect(within(table).getAllByRole('row')).toHaveLength(total + 1);
    fireEvent.click(screen.getAllByRole('button', { name: new RegExp(`^${es.it.filters.new}`) })[0]!);
    expect(within(table).getAllByRole('row')).toHaveLength(2);
  });
});

describe('S2 · Request detail', () => {
  it('verifies the identity before unlocking the account', async () => {
    const request = useDataStore.getState().accessRequests.find((r) => r.status === 'new' && r.reason === 'locked')!;
    renderAt(`/it/requests/${request.id}`);
    const apply = await screen.findByRole('button', { name: es.it.detail.apply });
    expect(apply).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(screen.getByRole('button', { name: es.it.detail.confirmIdentity }));
    expect(await screen.findByText(es.it.detail.checkRequired)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: new RegExp(es.it.detail.checks.manager) }));
    fireEvent.click(screen.getByRole('button', { name: es.it.detail.confirmIdentity }));
    expect(screen.getByRole('button', { name: es.it.detail.apply })).not.toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(screen.getByRole('button', { name: es.it.detail.apply }));
    expect((await screen.findAllByText(es.it.outcomes.unlock)).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: es.it.detail.outcome })).toBeInTheDocument();
    expect(lockedAccounts(useDataStore.getState().authAttempts).some((a) => a.email === request.email)).toBe(false);
  });

  it('asks for a reason before rejecting', async () => {
    const request = useDataStore.getState().accessRequests.find((r) => r.status === 'new')!;
    renderAt(`/it/requests/${request.id}`);
    fireEvent.click(await screen.findByRole('button', { name: es.it.detail.reject }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: es.it.detail.rejectConfirm }));
    expect(within(dialog).getByText(es.it.detail.rejectReasonRequired)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'No fue posible verificar la identidad' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: es.it.detail.rejectConfirm }));
    expect(useDataStore.getState().accessRequests.find((r) => r.id === request.id)!.status).toBe('rejected');
  });
});

describe('S3 · Security and audit', () => {
  it('shows the permission matrix generated from permissions.ts', async () => {
    renderAt('/it/security');
    fireEvent.mouseDown(await screen.findByRole('tab', { name: es.it.security.tabs.permissions }));
    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByText('account:unlock')).toBeInTheDocument();
  });

  it('is not available to HR', async () => {
    act(() => {
      switchRole('admin');
    });
    renderAt('/it/security');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(es.forbidden.title);
  });
});
