/**
 * Input masks: they keep characters that cannot belong to a field from being
 * typed or pasted (for example, letters in a date or in a number of days).
 * Masks only filter; they never decide if a value is valid. Validation lives in
 * `validation.ts` (Zod) and runs on blur and on submit (CLAUDE.md 2.10).
 */
export type InputMask = (raw: string) => string;

/**
 * DD/MM/AAAA: digits only, slashes inserted automatically, 8 digits max.
 * A slash is added only once the next digit is typed, so Backspace never gets stuck.
 */
export const dateMask: InputMask = (raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

/** Whole numbers, optionally negative (task offsets such as -3). */
export function integerMask({ allowNegative = false, maxDigits = 3 } = {}): InputMask {
  return (raw) => {
    // Negative only if a minus comes before the first digit (also when pasting "abc-45").
    const negative = allowNegative && raw.match(/[-\d]/)?.[0] === '-';
    const digits = raw.replace(/\D/g, '').slice(0, maxDigits);
    return negative ? `-${digits}` : digits;
  };
}

/** Fixed-length numeric codes, such as the 6-digit verification code. Spaces from pasting are removed. */
export function digitsMask(maxLength: number): InputMask {
  return (raw) => raw.replace(/\D/g, '').slice(0, maxLength);
}

/** Emails and user names cannot contain spaces. */
export const noSpacesMask: InputMask = (raw) => raw.replace(/\s/g, '');
