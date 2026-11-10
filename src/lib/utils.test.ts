import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('keeps a text color next to an M3 type role', () => {
    expect(cn('text-on-primary', 'text-label-large')).toBe('text-on-primary text-label-large');
  });

  it('still resolves conflicts inside the same group', () => {
    expect(cn('text-body-small', 'text-label-large')).toBe('text-label-large');
    expect(cn('text-primary', 'text-error')).toBe('text-error');
    expect(cn('shadow-elevation-1', 'shadow-elevation-2')).toBe('shadow-elevation-2');
  });
});
