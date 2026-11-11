import { describe, expect, it } from 'vitest';
import { dateMask, digitsMask, hasRejectedCharacters, integerMask, noSpacesMask } from './input-masks';

describe('dateMask', () => {
  it('drops letters and symbols', () => {
    expect(dateMask('asd')).toBe('');
    expect(dateMask('1a3b')).toBe('13');
  });

  it('inserts slashes as digits are typed', () => {
    expect(dateMask('13')).toBe('13');
    expect(dateMask('131')).toBe('13/1');
    expect(dateMask('13102026')).toBe('13/10/2026');
  });

  it('keeps an already formatted date and caps at 8 digits', () => {
    expect(dateMask('13/10/2026')).toBe('13/10/2026');
    expect(dateMask('13/10/20269999')).toBe('13/10/2026');
  });

  it('accepts other separators when pasting', () => {
    expect(dateMask('13-10-2026')).toBe('13/10/2026');
    expect(dateMask(' 13.10.2026 ')).toBe('13/10/2026');
  });

  it('lets Backspace remove the slash (no trailing slash is added)', () => {
    expect(dateMask('13/')).toBe('13');
  });
});

describe('integerMask', () => {
  const offset = integerMask({ allowNegative: true, maxDigits: 3 });

  it('drops letters, decimals and exponent characters', () => {
    expect(offset('abc')).toBe('');
    expect(offset('5e2')).toBe('52');
    expect(offset('3,5')).toBe('35');
  });

  it('keeps a leading minus only when negatives are allowed', () => {
    expect(offset('-3')).toBe('-3');
    expect(offset('-')).toBe('-');
    expect(offset('3-')).toBe('3');
    expect(offset('abc-45e')).toBe('-45');
    expect(offset(' - 3')).toBe('-3');
    expect(integerMask()('-3')).toBe('3');
  });

  it('caps the number of digits', () => {
    expect(offset('12345')).toBe('123');
  });
});

describe('digitsMask and noSpacesMask', () => {
  it('cleans a pasted verification code', () => {
    expect(digitsMask(6)('246 810')).toBe('246810');
    expect(digitsMask(6)('2468101')).toBe('246810');
  });

  it('removes spaces from emails', () => {
    expect(noSpacesMask(' sofia @nortia.demo ')).toBe('sofia@nortia.demo');
  });
});

describe('hasRejectedCharacters', () => {
  it('flags letters but not separators in dates', () => {
    expect(hasRejectedCharacters(dateMask, '13a')).toBe(true);
    expect(hasRejectedCharacters(dateMask, '13-10-2026')).toBe(false);
    expect(hasRejectedCharacters(dateMask, '13/10/2026')).toBe(false);
  });

  it('flags decimals and letters in integers, but not the minus sign', () => {
    const offset = integerMask({ allowNegative: true });
    expect(hasRejectedCharacters(offset, '-3')).toBe(false);
    expect(hasRejectedCharacters(offset, '3,5')).toBe(true);
    expect(hasRejectedCharacters(integerMask(), '-3')).toBe(true);
  });

  it('accepts spaces in pasted codes and flags them in emails', () => {
    expect(hasRejectedCharacters(digitsMask(6), '246 810')).toBe(false);
    expect(hasRejectedCharacters(noSpacesMask, 'sofia @nortia.demo')).toBe(true);
  });
});

describe('phoneMask (D-78)', () => {
  it('keeps a leading plus, digits and spaces, up to 15 digits', async () => {
    const { phoneMask } = await import('./input-masks');
    expect(phoneMask('+54 9 11 5555-5555')).toBe('+54 9 11 55555555');
    expect(phoneMask('abc 11 2222')).toBe('11 2222');
    expect(phoneMask('1234567890123456789').replace(/\D/g, '')).toHaveLength(15);
  });
});
