import { z } from 'zod';

/**
 * Reusable Zod field schemas. Error messages are i18n keys (`validation.*`),
 * translated where the error is shown, so every message is concrete and says
 * what to fix (CLAUDE.md 2.9 and 2.10).
 */

/** Allowed range for a task offset, in days from the start date (D-27). */
export const TASK_OFFSET_MIN = -30;
export const TASK_OFFSET_MAX = 90;

/** Parses DD/MM/AAAA into an ISO date (YYYY-MM-DD), or null if the date does not exist. */
export function parseDisplayDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;
  const [, dd, mm, yyyy] = match as unknown as [string, string, string, string];
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) return null;
  return `${yyyy}-${mm}-${dd}`;
}

const required = (schema: z.ZodString) => schema.trim().min(1, 'validation.required');

export const emailField = required(z.string()).pipe(z.email('validation.email'));

export const dateField = required(z.string())
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'validation.dateFormat')
  .refine((value) => parseDisplayDate(value) !== null, 'validation.dateInvalid');

export const taskOffsetField = required(z.string())
  .regex(/^-?\d+$/, 'validation.integer')
  .refine((value) => {
    const n = Number(value);
    return n >= TASK_OFFSET_MIN && n <= TASK_OFFSET_MAX;
  }, 'validation.offsetRange');

export const otpField = required(z.string()).regex(/^\d{6}$/, 'validation.otp');

export const requiredText = required(z.string());
