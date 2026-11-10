import { addDays as addDaysFns, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import type { Stage } from '@/types/domain';

/**
 * Fixed "today" of the demo, so data always looks coherent no matter when the
 * portfolio is opened (CLAUDE.md section 7).
 */
export const DEMO_TODAY = '2026-11-10';

/** Current demo date-time for timestamps created during the session (DEMO_TODAY + real clock time). */
export function demoNow(): string {
  const now = new Date();
  const time = now.toISOString().slice(10); // "THH:mm:ss.sssZ"
  return `${DEMO_TODAY}${time}`;
}

/** ISO `YYYY-MM-DD` + n days. Works on calendar days, independent of time zone. */
export function addDays(isoDate: string, days: number): string {
  return format(addDaysFns(parseISO(isoDate), days), 'yyyy-MM-dd');
}

/** Calendar days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return differenceInCalendarDays(parseISO(to.slice(0, 10)), parseISO(from.slice(0, 10)));
}

/** DD/MM/AAAA for the interface (CLAUDE.md 2.9). */
export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate.slice(0, 10)), 'dd/MM/yyyy');
}

/** DD/MM/AAAA HH:mm for audit logs and timestamps. */
export function formatDateTime(isoDateTime: string): string {
  return format(parseISO(isoDateTime), 'dd/MM/yyyy HH:mm');
}

/** Long date for headings, for example "martes, 10 de noviembre". */
export function formatLongDate(isoDate: string, language: 'es' | 'en' = 'es'): string {
  return format(parseISO(isoDate.slice(0, 10)), language === 'es' ? "EEEE, d 'de' MMMM" : 'EEEE, MMMM d', {
    locale: language === 'es' ? es : enUS,
  });
}

/**
 * Stage limits (day 0 = start date, CLAUDE.md section 7): preboarding before day 0,
 * week 1 days 0 to 6, month 1 days 7 to 29, days 30 to 90 from day 30.
 */
export function stageForOffset(offsetDays: number): Stage {
  if (offsetDays < 0) return 'preboarding';
  if (offsetDays <= 6) return 'week1';
  if (offsetDays <= 29) return 'month1';
  return 'days30to90';
}

export const STAGES: Stage[] = ['preboarding', 'week1', 'month1', 'days30to90'];

/** Numbers with dot thousands separator and comma decimals (CLAUDE.md 2.9). */
export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits }).format(value);
}

const NBSP = String.fromCharCode(0xa0);

/** Percentage with a non-breaking space before the sign, as in "84 %" (CLAUDE.md 2.9). */
export function formatPercent(value: number): string {
  return `${formatNumber(Math.round(value))}${NBSP}%`;
}

export type RelativeDue =
  | { key: 'today' | 'tomorrow' | 'yesterday' }
  | { key: 'inDays' | 'daysAgo'; count: number };

/** Due date relative to the demo's today, for texts such as "Vence en 3 días". */
export function relativeDue(dueDate: string, today = DEMO_TODAY): RelativeDue {
  const diff = daysBetween(today, dueDate);
  if (diff === 0) return { key: 'today' };
  if (diff === 1) return { key: 'tomorrow' };
  if (diff === -1) return { key: 'yesterday' };
  return diff > 1 ? { key: 'inDays', count: diff } : { key: 'daysAgo', count: -diff };
}
