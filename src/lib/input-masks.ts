/**
 * Input masks: they keep characters that cannot belong to a field from being
 * typed or pasted (for example, letters in a date or in a number of days).
 * Masks only filter; they never decide if a value is valid. Validation lives in
 * `validation.ts` (Zod) and runs on blur and on submit (CLAUDE.md 2.10).
 *
 * Each mask declares which characters are legitimate input (`accepts`). Anything
 * else that gets removed is announced to screen readers by TextField, because the
 * reader already echoed the key that the mask discarded.
 */
export interface InputMask {
  (raw: string): string;
  /** Characters that are valid to type or paste, even if the mask reformats them. */
  accepts: RegExp;
}

function createMask(apply: (raw: string) => string, accepts: RegExp): InputMask {
  return Object.assign(apply, { accepts });
}

/**
 * DD/MM/AAAA: digits only, slashes inserted automatically, 8 digits max.
 * A slash is added only once the next digit is typed, so Backspace never gets stuck.
 * Common separators (/, -, ., space) are accepted when pasting.
 */
export const dateMask = createMask((raw) => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}, /[\d/.\- ]/);

/** Whole numbers, optionally negative (task offsets such as -3). */
export function integerMask({ allowNegative = false, maxDigits = 3 } = {}): InputMask {
  return createMask(
    (raw) => {
      // Negative only if a minus comes before the first digit (also when pasting "abc-45").
      const negative = allowNegative && raw.match(/[-\d]/)?.[0] === '-';
      const digits = raw.replace(/\D/g, '').slice(0, maxDigits);
      return negative ? `-${digits}` : digits;
    },
    allowNegative ? /[\d\- ]/ : /[\d ]/,
  );
}

/** Fixed-length numeric codes, such as the 6-digit verification code. Spaces from pasting are removed. */
export function digitsMask(maxLength: number): InputMask {
  return createMask((raw) => raw.replace(/\D/g, '').slice(0, maxLength), /[\d ]/);
}

/** Mobile numbers: a leading + and digits; spaces are kept for readability. 15 digits max (E.164). */
export const phoneMask = createMask((raw) => {
  const plus = raw.trimStart().startsWith('+') ? '+' : '';
  let digits = 0;
  const body = raw
    .replace(/[^\d ]/g, '')
    .replace(/\s+/g, ' ')
    .split('')
    .filter((char) => (char === ' ' ? true : ++digits <= 15))
    .join('')
    .trimStart();
  return plus + body;
}, /[\d+ ()-]/);

/** Emails and user names cannot contain spaces. */
export const noSpacesMask = createMask((raw) => raw.replace(/\s/g, ''), /\S/);

/** True when the raw input had characters the field does not accept (letters in a date, etc.). */
export function hasRejectedCharacters(mask: InputMask, raw: string): boolean {
  return [...raw].some((char) => !mask.accepts.test(char));
}
