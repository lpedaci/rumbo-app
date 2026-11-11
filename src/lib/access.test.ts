import { beforeEach, describe, expect, it } from 'vitest';
import { useDataStore } from '@/store/data-store';
import type { AccessRequest, AuditEvent } from '@/types/domain';
import {
  auditCategory,
  auditCsv,
  countRequests,
  filterAudit,
  filterRequests,
  lockedAccounts,
  suggestedAction,
} from './access';

const req = (
  id: string,
  status: AccessRequest['status'],
  createdAt: string,
  reason: AccessRequest['reason'] = 'locked',
): AccessRequest => ({
  id,
  email: `${id}@nortia.demo`,
  createdAt,
  reason,
  status,
  identityVerified: false,
});

describe('access requests (F6)', () => {
  it('lists open requests first, newest first inside each group', () => {
    const list = [
      req('a', 'resolved', '2026-11-09T10:00:00Z'),
      req('b', 'new', '2026-11-01T10:00:00Z'),
      req('c', 'verifying', '2026-11-08T10:00:00Z'),
      req('d', 'new', '2026-11-05T10:00:00Z'),
    ];
    expect(filterRequests(list, 'all').map((r) => r.id)).toEqual(['d', 'b', 'c', 'a']);
    expect(filterRequests(list, 'new').map((r) => r.id)).toEqual(['d', 'b']);
    expect(countRequests(list)).toMatchObject({ all: 4, new: 2, verifying: 1, resolved: 1, rejected: 0 });
  });

  it('suggests the action that matches the reason', () => {
    expect(suggestedAction(req('x', 'new', '', 'locked'))).toBe('unlock');
    expect(suggestedAction(req('x', 'new', '', 'forgot_password'))).toBe('force_password_reset');
    expect(suggestedAction(req('x', 'new', '', 'mfa_issue'))).toBe('reset_mfa');
  });
});

describe('audit log (F6)', () => {
  const ev = (id: string, at: string, action: string, actorId = 'p-diego'): AuditEvent => ({
    id,
    at,
    action,
    actorId,
    result: 'success',
  });
  const events = [
    ev('1', '2026-10-01T10:00:00Z', 'auth.login'),
    ev('2', '2026-11-09T10:00:00Z', 'account.unlock'),
    ev('3', '2026-11-10T10:00:00Z', 'template.update', 'p-carla'),
  ];

  it('groups actions by category', () => {
    expect(auditCategory('auth.login_failed')).toBe('auth');
    expect(auditCategory('access_request.resolve')).toBe('access');
    expect(auditCategory('account.unlock')).toBe('account');
    expect(auditCategory('hire.create')).toBe('content');
  });

  it('filters by user, type and date, newest first', () => {
    expect(filterAudit(events, { actorId: 'all', category: 'all', from: '', to: '' }).map((e) => e.id)).toEqual([
      '3',
      '2',
      '1',
    ]);
    expect(
      filterAudit(events, { actorId: 'p-diego', category: 'all', from: '2026-11-01', to: '' }).map((e) => e.id),
    ).toEqual(['2']);
    expect(filterAudit(events, { actorId: 'all', category: 'content', from: '', to: '' }).map((e) => e.id)).toEqual([
      '3',
    ]);
  });

  it('exports quoted CSV that survives commas and quotes', () => {
    const csv = auditCsv(
      [{ ...events[0]!, detail: 'Dijo "hola", y salió' }],
      { at: 'Fecha', actor: 'Usuario', action: 'Acción', resource: 'Recurso', result: 'Resultado', detail: 'Detalle' },
      () => 'Diego Ferreyra',
    );
    expect(csv.split('\r\n')[1]).toBe(
      '"2026-10-01T10:00:00Z","Diego Ferreyra","auth.login","","success","Dijo ""hola"", y salió"',
    );
  });
});

describe('store: resolving an access request (S2)', () => {
  beforeEach(() => {
    localStorage.clear();
    useDataStore.getState().resetData();
  });

  it('only restores access after the identity is verified, unlocks the account and audits every step', () => {
    const store = useDataStore.getState;
    const request = store().accessRequests.find((r) => r.status === 'new' && r.reason === 'locked')!;
    expect(lockedAccounts(store().authAttempts).some((a) => a.email === request.email)).toBe(true);

    store().resolveAccessRequest(request.id, 'unlock', '', 'p-diego');
    expect(store().accessRequests.find((r) => r.id === request.id)!.status).toBe('new');

    store().startVerification(request.id, 'p-diego');
    store().verifyIdentity(request.id, 'manager', 'p-diego');
    store().resolveAccessRequest(request.id, 'unlock', 'Validado con el jefe', 'p-diego');

    const done = store().accessRequests.find((r) => r.id === request.id)!;
    expect(done.status).toBe('resolved');
    expect(done.resolution).toMatchObject({ action: 'unlock', by: 'p-diego' });
    expect(lockedAccounts(store().authAttempts).some((a) => a.email === request.email)).toBe(false);
    const actions = store()
      .auditEvents.filter((e) => e.resource === request.id || e.resource === request.email)
      .map((e) => e.action);
    expect(actions).toEqual(
      expect.arrayContaining([
        'access_request.start_verification',
        'access_request.verify_identity',
        'account.unlock',
        'access_request.resolve',
      ]),
    );
  });

  it('forcing a new password flags the account and rejecting needs no verification', () => {
    const store = useDataStore.getState;
    const request = store().accessRequests.find((r) => r.status === 'verifying')!;
    store().verifyIdentity(request.id, 'callback', 'p-diego');
    store().resolveAccessRequest(request.id, 'force_password_reset', '', 'p-diego');
    expect(store().accountFlags[request.personId!]?.mustChangePassword).toBe(true);

    const other = store().accessRequests.find((r) => r.status === 'new')!;
    store().rejectAccessRequest(other.id, 'No fue posible verificar la identidad', 'p-diego');
    expect(store().accessRequests.find((r) => r.id === other.id)!.status).toBe('rejected');
  });
});
