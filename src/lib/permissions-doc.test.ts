import { describe, expect, it } from 'vitest';
import rolesDoc from '../../docs/roles.md?raw';
import { PERMISSIONS } from './permissions';
import { ACTION_DESCRIPTIONS, MATRIX_END, MATRIX_START, permissionMatrixMarkdown } from './permissions-doc';

describe('docs/roles.md stays in sync with permissions.ts (D-08)', () => {
  it('every action has a description', () => {
    expect(Object.keys(ACTION_DESCRIPTIONS).sort()).toEqual(Object.keys(PERMISSIONS).sort());
  });

  it('the matrix in the docs matches the code', () => {
    const doc = rolesDoc.replace(/\r\n/g, '\n');
    const start = doc.indexOf(MATRIX_START);
    const end = doc.indexOf(MATRIX_END);
    expect(start, 'permissions markers missing in docs/roles.md').toBeGreaterThan(-1);
    const documented = doc.slice(start + MATRIX_START.length, end).trim();
    expect(documented, 'Regenerate the table in docs/roles.md from permissionMatrixMarkdown()').toBe(
      permissionMatrixMarkdown(),
    );
  });
});
