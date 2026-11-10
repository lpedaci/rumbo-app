import { describe, expect, it } from 'vitest';
import { can, canViewHire, homePath, PERMISSIONS, requiredPermission, ROLES, scopeOf, visibleHires } from './permissions';

const carla = { personId: 'p-carla', role: 'admin' as const };
const martin = { personId: 'p-martin', role: 'manager' as const };
const sofia = { personId: 'p-sofia', role: 'hire' as const };
const diego = { personId: 'p-diego', role: 'it_admin' as const };

describe('permission matrix', () => {
  it('only uses known roles and scopes', () => {
    for (const byRole of Object.values(PERMISSIONS)) {
      for (const [role, scope] of Object.entries(byRole)) {
        expect(ROLES).toContain(role);
        expect(['all', 'team', 'own']).toContain(scope);
      }
    }
  });

  it('gives each role exactly one workspace', () => {
    for (const user of [carla, martin, sofia, diego]) {
      const workspaces = (['workspace:hr', 'workspace:team', 'workspace:journey', 'workspace:it'] as const).filter((a) =>
        can(user, a),
      );
      expect(workspaces).toHaveLength(1);
    }
  });

  it('keeps access management exclusive to IT (CLAUDE.md F6)', () => {
    expect(can(carla, 'access_request:resolve')).toBe(false);
    expect(can(carla, 'audit:view')).toBe(false);
    expect(can(diego, 'audit:view')).toBe(true);
  });

  it('denies everything without a session', () => {
    expect(can(null, 'demo:reset')).toBe(false);
    expect(homePath(null)).toBe('/login');
  });
});

describe('least privilege on hires', () => {
  const hires = [
    { id: 'h1', personId: 'p-sofia', managerId: 'p-martin' },
    { id: 'h2', personId: 'p-camila', managerId: 'p-lucia' },
  ];

  it('HR sees all, the manager only their team, the hire only themself, IT none', () => {
    expect(visibleHires(carla, hires).map((h) => h.id)).toEqual(['h1', 'h2']);
    expect(visibleHires(martin, hires).map((h) => h.id)).toEqual(['h1']);
    expect(visibleHires(sofia, hires).map((h) => h.id)).toEqual(['h1']);
    expect(visibleHires(diego, hires)).toEqual([]);
    expect(canViewHire(martin, hires[1]!)).toBe(false);
    expect(scopeOf(martin, 'hire:view')).toBe('team');
  });
});

describe('routes', () => {
  it('maps each internal route to its workspace permission', () => {
    expect(requiredPermission('/admin')).toBe('workspace:hr');
    expect(requiredPermission('/admin/templates/tpl-data/preview')).toBe('workspace:hr');
    expect(requiredPermission('/manager/hires/h1/checkin/day30')).toBe('workspace:team');
    expect(requiredPermission('/me/tasks/x')).toBe('workspace:journey');
    expect(requiredPermission('/it/security')).toBe('workspace:it');
    expect(requiredPermission('/account/security')).toBe('account:security_own');
    expect(requiredPermission('/administrator')).toBeNull();
  });

  it('sends each role to its home', () => {
    expect([carla, martin, sofia, diego].map(homePath)).toEqual(['/admin', '/manager', '/me', '/it/requests']);
  });
});
