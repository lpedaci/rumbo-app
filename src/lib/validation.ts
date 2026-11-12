import { z } from 'zod';

// The CSP has no 'unsafe-eval' (8.2): Zod must not try to compile validators with
// `new Function`, which the browser blocks and reports as a policy violation (INC-029).
z.config({ jitless: true });
import { addDays } from './dates';
import { DATE_FORMATS, TIMEZONES } from './preferences';

/**
 * Reusable Zod field schemas. Error messages are i18n keys (`validation.*`),
 * translated where the error is shown, so every message is concrete and says
 * what to fix (CLAUDE.md 2.9 and 2.10).
 */

import { TASK_OFFSET_MAX, TASK_OFFSET_MIN } from './templates';

export { TASK_OFFSET_MAX, TASK_OFFSET_MIN };

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

/** Mobile with country and area code: 10 to 15 digits (D-78). */
export const phoneField = required(z.string()).refine((value) => {
  const digits = value.replace(/\D/g, '').length;
  return digits >= 10 && digits <= 15;
}, 'validation.phone');

/** Shows only the last 4 digits of a phone number, for example "*** 5555". */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length > 4 ? `*** ${digits.slice(-4)}` : value;
}

/** Error message keys of a failed parse, by dotted path ("results.0", "note"). */
export function issuesByPath(result: z.ZodSafeParseResult<unknown>): Record<string, string> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** N3 · Self-review (F5): how they feel is required; the comment is optional plain text (INC-018). */
export const selfReviewSchema = z.object({
  mood: z.enum(['1', '2', '3', '4', '5'], { error: 'selfReview.moodRequired' }),
  comment: z.string().trim().max(1000),
});

/**
 * J3 · Manager check-in (F5): every milestone needs a result; a milestone "not met" needs a
 * decision, and that decision its data (a later date, or a note for HR) (INC-018).
 */
export function managerCheckinSchema(today: string) {
  return z
    .object({
      results: z.array(z.enum(['met', 'partial', 'not_met']).optional()),
      actionType: z.enum(['reschedule', 'escalate']).optional(),
      newDate: z.string(),
      note: z.string(),
    })
    .superRefine((value, ctx) => {
      value.results.forEach((result, i) => {
        if (!result) ctx.addIssue({ code: 'custom', path: ['results', i], message: 'managerCheckin.resultRequired' });
      });
      if (!value.results.includes('not_met')) return;
      if (!value.actionType) {
        ctx.addIssue({ code: 'custom', path: ['actionType'], message: 'validation.required' });
        return;
      }
      if (value.actionType === 'reschedule') {
        const iso = parseDisplayDate(value.newDate);
        const message = !value.newDate.trim()
          ? 'validation.required'
          : !iso
            ? 'validation.dateFormat'
            : iso <= today
              ? 'managerCheckin.newDatePast'
              : null;
        if (message) ctx.addIssue({ code: 'custom', path: ['newDate'], message });
      }
      if (value.actionType === 'escalate' && !value.note.trim()) {
        ctx.addIssue({ code: 'custom', path: ['note'], message: 'validation.required' });
      }
    });
}

/** S2 · How IT verified the identity (D-90). */
export const identityCheckSchema = z.enum(['callback', 'manager'], { error: 'it.detail.checkRequired' });

/** S2 · Reason to reject an access request. */
export const rejectReasonSchema = z.string().trim().min(1, 'it.detail.rejectReasonRequired');

/** New password after a forced change: every rule of the policy has to be met. */
export function newPasswordSchema(meetsPolicy: (password: string) => boolean) {
  return z.string().refine(meetsPolicy, 'auth.newPassword.invalid');
}

/** F8: version note when publishing a template, required, 10 to 500 characters. */
export const publishNoteSchema = z
  .string()
  .trim()
  .min(10, 'templateVersions.dialog.noteRequired')
  .max(500, 'templateVersions.dialog.noteMax');

/** F9: a comment is plain text, 1 to 1.000 characters. */
export const COMMENT_MAX = 1000;
export const commentSchema = z
  .string()
  .trim()
  .min(1, 'comments.required')
  .max(COMMENT_MAX, 'comments.max');

/** F13: a review campaign has a name of 5 to 80 characters and a due date after today, up to `maxDays` ahead. */
export function campaignSchema(today: string, maxDays: number) {
  const last = addDays(today, maxDays);
  return z.object({
    name: z
      .string()
      .trim()
      .min(5, 'accessReview.campaigns.form.nameRequired')
      .max(80, 'accessReview.campaigns.form.nameRequired'),
    dueDate: z
      .string({ error: 'accessReview.campaigns.form.dueRequired' })
      .refine((iso) => iso > today && iso <= last, 'accessReview.campaigns.form.dueRange'),
  });
}

/**
 * F12: a job change or a leaver. The person and the date are required; a job change needs a
 * different job, a leaver needs its type; the detail is optional up to 300 characters. The rule
 * of the two IT people (D-121) is checked by the store, not here.
 */
export function lifecycleSchema(currentJobTitleId: string | undefined) {
  return z
    .object({
      kind: z.enum(['mover', 'leaver']),
      personId: z.string().min(1, 'lifecycle.form.personRequired'),
      jobTitleId: z.string(),
      effectiveDate: z.string({ error: 'lifecycle.form.dateRequired' }),
      leaverType: z.string(),
      detail: z.string().trim().max(300, 'lifecycle.form.detailMax'),
    })
    .superRefine((value, ctx) => {
      if (value.kind === 'mover' && !value.jobTitleId)
        ctx.addIssue({ code: 'custom', path: ['jobTitleId'], message: 'lifecycle.form.jobRequired' });
      else if (value.kind === 'mover' && value.jobTitleId === currentJobTitleId)
        ctx.addIssue({ code: 'custom', path: ['jobTitleId'], message: 'lifecycle.form.jobSame' });
      if (value.kind === 'leaver' && !value.leaverType)
        ctx.addIssue({ code: 'custom', path: ['leaverType'], message: 'lifecycle.form.typeRequired' });
    });
}

/** F17: preferences only take the listed values; anything else is rejected before saving. */
export const preferencesSchema = z.object({
  personId: z.string().min(1),
  language: z.enum(['es', 'en']),
  timezone: z.enum(TIMEZONES),
  dateFormat: z.enum(DATE_FORMATS),
  notifications: z.object({
    tasks: z.array(z.enum(['app', 'email'])).min(1),
    checkins: z.array(z.enum(['app', 'email'])).min(1),
    people: z.array(z.enum(['app', 'email'])).min(1),
    access: z.array(z.enum(['app', 'email'])).min(1),
  }),
  reduceMotion: z.boolean(),
  highContrast: z.boolean(),
});

