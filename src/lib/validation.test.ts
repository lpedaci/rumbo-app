import { describe, expect, it } from 'vitest';
import { dateField, emailField, otpField, parseDisplayDate, taskOffsetField } from './validation';

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.success ? null : result.error?.issues[0]?.message;

describe('parseDisplayDate', () => {
  it('converts valid dates to ISO', () => {
    expect(parseDisplayDate('13/10/2026')).toBe('2026-10-13');
    expect(parseDisplayDate('29/02/2028')).toBe('2028-02-29');
  });

  it('rejects dates that do not exist', () => {
    expect(parseDisplayDate('31/02/2026')).toBeNull();
    expect(parseDisplayDate('29/02/2026')).toBeNull();
    expect(parseDisplayDate('00/10/2026')).toBeNull();
    expect(parseDisplayDate('13/13/2026')).toBeNull();
  });
});

describe('field schemas', () => {
  it('date: required, format and real date', () => {
    expect(firstError(dateField.safeParse(''))).toBe('validation.required');
    expect(firstError(dateField.safeParse('13/10'))).toBe('validation.dateFormat');
    expect(firstError(dateField.safeParse('31/02/2026'))).toBe('validation.dateInvalid');
    expect(dateField.safeParse('13/10/2026').success).toBe(true);
  });

  it('task offset: whole number within range', () => {
    expect(firstError(taskOffsetField.safeParse('-'))).toBe('validation.integer');
    expect(firstError(taskOffsetField.safeParse('-45'))).toBe('validation.offsetRange');
    expect(firstError(taskOffsetField.safeParse('120'))).toBe('validation.offsetRange');
    expect(taskOffsetField.safeParse('-3').success).toBe(true);
    expect(taskOffsetField.safeParse('90').success).toBe(true);
  });

  it('email: required and well formed', () => {
    expect(firstError(emailField.safeParse(''))).toBe('validation.required');
    expect(firstError(emailField.safeParse('sofia@'))).toBe('validation.email');
    expect(emailField.safeParse('sofia@nortia.demo').success).toBe(true);
  });

  it('verification code: exactly 6 digits', () => {
    expect(firstError(otpField.safeParse('2468'))).toBe('validation.otp');
    expect(otpField.safeParse('246810').success).toBe(true);
  });
});
