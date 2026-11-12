import { describe, expect, it } from 'vitest';
import { PRIVACY_DEADLINES } from '@/app/legal';
import { buildSeed } from '@/data/seed';
import { addBusinessDays, anonymizationDate, daysLeft, dueDateFor, hasConsent, mask, nextPrivacyRequestId } from './privacy';

describe('privacy rules (F10)', () => {
  it('gives 10 calendar days for access and 5 business days for rectification and deletion', () => {
    // 10/11/2026 is a Tuesday
    expect(dueDateFor('access', '2026-11-10')).toBe('2026-11-20');
    expect(dueDateFor('rectification', '2026-11-10')).toBe('2026-11-17');
    expect(addBusinessDays('2026-11-13', 1)).toBe('2026-11-16'); // Friday to Monday
    expect(daysLeft('2026-11-08', '2026-11-10')).toBe(-2);
  });

  it('skips Saturday and Sunday for a rectification sent on a Friday (art. 16)', () => {
    // Friday 13/11/2026: Mon 16, Tue 17, Wed 18, Thu 19, Fri 20
    expect(new Date('2026-11-13T12:00:00Z').getUTCDay()).toBe(5);
    expect(dueDateFor('rectification', '2026-11-13')).toBe('2026-11-20');
    expect(dueDateFor('deletion', '2026-11-13')).toBe('2026-11-20');
    // Access counts calendar days, weekend included (art. 14): Friday 13 + 10 = Monday 23
    expect(dueDateFor('access', '2026-11-13')).toBe('2026-11-23');
  });

  it('never lands a business-day deadline on a weekend, whatever the day it was sent', () => {
    for (let d = 9; d <= 15; d += 1) {
      const sent = `2026-11-${String(d).padStart(2, '0')}`;
      const due = dueDateFor('rectification', sent);
      const weekday = new Date(`${due}T12:00:00Z`).getUTCDay();
      expect(weekday, `${sent} → ${due}`).not.toBe(0);
      expect(weekday, `${sent} → ${due}`).not.toBe(6);
    }
  });

  it('takes the deadlines from the legal configuration, so a reform changes one place', () => {
    expect(PRIVACY_DEADLINES).toMatchObject({
      access: { days: 10, kind: 'calendar', article: 'art. 14' },
      rectification: { days: 5, kind: 'business', article: 'art. 16' },
      deletion: { days: 5, kind: 'business', article: 'art. 16' },
    });
    const reformed = { ...PRIVACY_DEADLINES, access: { days: 15, kind: 'business' as const, article: 'art. 14' } };
    expect(dueDateFor('access', '2026-11-13', reformed)).toBe('2026-12-04');
  });

  it('masks identifiers and keeps only the last digits', () => {
    expect(mask('39.562.914', 'dni')).toBe('***.***.2914');
    expect(mask('23-39562914-4', 'cuil')).toBe('**-****914-4');
  });

  it('asks the demo hire for the notice and not the other demo people', () => {
    const seed = buildSeed();
    const v = seed.securityPolicy.privacyNoticeVersion;
    expect(hasConsent(seed.consents, 'p-sofia', v)).toBe(false);
    for (const id of ['p-carla', 'p-martin', 'p-diego']) expect(hasConsent(seed.consents, id, v)).toBe(true);
    expect(hasConsent(seed.consents, 'p-carla', '2027.1')).toBe(false);
  });

  it('schedules the anonymization of a finished journey and numbers new requests', () => {
    expect(anonymizationDate({ startDate: '2026-06-01' }, 2)).toBe('2028-08-29');
    expect(nextPrivacyRequestId([{ id: 'PRIV-2026-0008' }, { id: 'PRIV-2026-0007' }])).toBe('PRIV-2026-0009');
  });
});
