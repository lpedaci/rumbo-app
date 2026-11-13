import { describe, expect, it } from 'vitest';
import { pageKind } from './page-kind';

describe('pageKind (D-140)', () => {
  it.each([
    ['/admin', 'dashboard'],
    ['/manager', 'dashboard'],
    ['/me', 'dashboard'],
    ['/it/security', 'dashboard'],
    ['/admin/reports', 'dashboard'],
    ['/admin/templates', 'cards'],
    ['/admin/hires/new', 'form'],
    ['/manager/hires/h-sofia/checkin/day30', 'form'],
    ['/me/checkin/day30', 'form'],
    ['/account/preferences', 'form'],
    ['/admin/hires/h-sofia', 'detail'],
    ['/admin/people/p-valeria', 'detail'],
    ['/admin/templates/tpl-data', 'detail'],
    ['/admin/templates/tpl-data/versions', 'detail'],
    ['/manager/hires/h-sofia', 'detail'],
    ['/it/requests/IT-2026-0141', 'detail'],
    ['/it/access-reviews/AR-2026-0001', 'detail'],
    ['/me/tasks/h-sofia-d9', 'detail'],
    ['/login', 'steps'],
    ['/login/verify', 'steps'],
    ['/consent', 'steps'],
    ['/admin/hires', 'list'],
    ['/it/requests', 'list'],
    ['/notifications', 'list'],
  ])('%s → %s', (path, kind) => {
    expect(pageKind(path)).toBe(kind);
  });
});
