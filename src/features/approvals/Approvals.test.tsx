import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { switchRole } from '@/features/auth/auth-service';
import {
  applyPolicyChange,
  decideBlock,
  nextApprovalId,
  pendingPolicyChange,
  policyValueIssue,
  sortApprovals,
} from '@/lib/approvals';
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
});

const approval = (id: string) => useDataStore.getState().approvals.find((a) => a.id === id)!;

describe('F14 · Double approval rules', () => {
  it('never lets the requester or the person concerned decide', () => {
    expect(decideBlock(approval('APR-2026-0002'), 'p-carla')).toBe('own');
    expect(decideBlock(approval('APR-2026-0002'), 'p-julieta')).toBe('target');
    expect(decideBlock(approval('APR-2026-0002'), 'p-diego')).toBeUndefined();
    expect(decideBlock(approval('APR-2026-0003'), 'p-ramiro')).toBe('own');
    expect(decideBlock(approval('APR-2026-0001'), 'p-diego')).toBe('decided');
  });

  it('checks the range, the current value and one pending change per policy', () => {
    const { securityPolicy, approvals } = useDataStore.getState();
    expect(policyValueIssue('lockoutAttempts', 4, securityPolicy)).toBeUndefined();
    expect(policyValueIssue('lockoutAttempts', 5, securityPolicy)).toBe('approvals.policy.valueSame');
    expect(policyValueIssue('passwordMinLength', 8, securityPolicy)).toBe('approvals.policy.valueRange');
    expect(policyValueIssue('sessionIdleMinutes', undefined, securityPolicy)).toBe('approvals.policy.valueRequired');
    expect(pendingPolicyChange(approvals, 'passwordMinLength')?.id).toBe('APR-2026-0003');
    expect(pendingPolicyChange(approvals, 'lockoutAttempts')).toBeUndefined();
    expect(nextApprovalId(approvals)).toBe('APR-2026-0004');
  });

  it('moves the session warning with the session length', () => {
    const policy = applyPolicyChange(useDataStore.getState().securityPolicy, 'sessionIdleMinutes', 10);
    expect(policy).toMatchObject({ sessionIdleMinutes: 10, sessionWarningMinutes: 8 });
  });

  it('lists the pending ones first, the oldest on top', () => {
    expect(sortApprovals(useDataStore.getState().approvals).map((a) => a.id)).toEqual([
      'APR-2026-0002',
      'APR-2026-0003',
      'APR-2026-0001',
    ]);
  });
});

describe('F14 · Store', () => {
  it('applies an approved role change, audits it and tells the requester', () => {
    expect(useDataStore.getState().decideApproval('APR-2026-0002', 'approved', '', 'p-diego')).toBe(true);
    const state = useDataStore.getState();
    expect(state.people.find((p) => p.id === 'p-julieta')!.role).toBe('admin');
    expect(approval('APR-2026-0002')).toMatchObject({ status: 'approved', decidedBy: 'p-diego' });
    expect(state.auditEvents.slice(-2).map((e) => e.action)).toEqual(['approval.approve', 'person.role_change']);
    expect(state.notifications.at(-1)).toMatchObject({ recipientId: 'p-carla', type: 'approval.approved' });
  });

  it('refuses and audits a decision by the requester, without changing anything', () => {
    act(() => {
      switchRole('admin');
    });
    expect(useDataStore.getState().decideApproval('APR-2026-0002', 'approved', '', 'p-carla')).toBe(false);
    expect(approval('APR-2026-0002').status).toBe('pending');
    expect(useDataStore.getState().people.find((p) => p.id === 'p-julieta')!.role).toBe('hire');
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'approval.approve', result: 'denied', detail: 'own' });
  });

  it('proposes a policy change that applies only when someone else approves it', () => {
    const store = useDataStore.getState();
    const id = store.requestPolicyChange('lockoutAttempts', 4, 'Reducir el riesgo en cuentas con datos personales.', 'p-diego')!;
    expect(id).toBe('APR-2026-0004');
    expect(useDataStore.getState().securityPolicy.lockoutAttempts).toBe(5);
    // Only Ramiro is told: Diego asked.
    expect(useDataStore.getState().notifications.filter((n) => n.params.request === id).map((n) => n.recipientId)).toEqual(['p-ramiro']);
    // A second change of the same policy waits for the first one.
    expect(useDataStore.getState().requestPolicyChange('lockoutAttempts', 3, 'Otro cambio de prueba.', 'p-diego')).toBeUndefined();

    expect(useDataStore.getState().decideApproval(id, 'approved', '', 'p-diego')).toBe(false);
    expect(useDataStore.getState().decideApproval(id, 'approved', '', 'p-ramiro')).toBe(true);
    expect(useDataStore.getState().securityPolicy.lockoutAttempts).toBe(4);
    expect(useDataStore.getState().auditEvents.at(-1)).toMatchObject({ action: 'policy.update', resource: 'lockoutAttempts' });
  });

  it('keeps the policy as it was when the change is rejected', () => {
    useDataStore.getState().decideApproval('APR-2026-0003', 'rejected', 'Primero hay que avisar a todo el personal.', 'p-diego');
    expect(useDataStore.getState().securityPolicy.passwordMinLength).toBe(12);
    expect(approval('APR-2026-0003')).toMatchObject({ status: 'rejected', decisionNote: 'Primero hay que avisar a todo el personal.' });
  });
});

describe('S7 and S3 · Approval screens', () => {
  it('asks for a reason to reject and applies an approval from S7', async () => {
    renderAt('/it/approvals?request=APR-2026-0002');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: es.approvals.reject }));
    expect(await within(dialog).findByText(es.approvals.noteRequired)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: es.approvals.approve }));
    await waitFor(() => expect(approval('APR-2026-0002').status).toBe('approved'));
  });

  it('explains why the requester cannot decide', async () => {
    useDataStore.getState().requestPolicyChange('lockoutAttempts', 4, 'Reducir el riesgo en cuentas con datos personales.', 'p-diego');
    renderAt('/it/approvals?request=APR-2026-0004');
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(es.approvals.blocked.own)).toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: es.approvals.approve })).not.toBeInTheDocument();
  });

  it('sends a policy change from S3 for approval', async () => {
    renderAt('/it/security');
    fireEvent.mouseDown(await screen.findByRole('tab', { name: /Políticas/ }));
    fireEvent.click(await screen.findByRole('button', { name: es.approvals.policy.propose }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: es.approvals.policy.send }));
    expect(await within(dialog).findByText(es.approvals.policy.fieldRequired)).toBeInTheDocument();
    fireEvent.change(within(dialog).getByLabelText(new RegExp(es.approvals.policy.field)), { target: { value: 'sessionIdleMinutes' } });
    fireEvent.change(within(dialog).getByLabelText(new RegExp(es.approvals.policy.value)), { target: { value: '10' } });
    fireEvent.change(within(dialog).getByLabelText(new RegExp(es.approvals.policy.reason)), {
      target: { value: 'Menos tiempo de sesión abierta en computadoras compartidas.' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: es.approvals.policy.send }));
    await waitFor(() => expect(pendingPolicyChange(useDataStore.getState().approvals, 'sessionIdleMinutes')?.toValue).toBe(10));
  });
});
