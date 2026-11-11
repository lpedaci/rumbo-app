import { describe, expect, it } from 'vitest';
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

  it('masks identifiers and keeps only the last digits', () => {
    expect(mask('39.562.914', 'dni')).toBe('***.***.2914');
    expect(mask('23-39562914-4', 'cuil')).toBe('**-****914-4');
    expect(mask('0720143209705552469134', 'bankAccount')).toBe('•••• •••• •••• 9134');
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
