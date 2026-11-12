import { addDays as addDaysFns, addMinutes, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import type { Stage } from '@/types/domain';

/**
 * Fixed "today" of the demo, so data always looks coherent no matter when the
 * portfolio is opened (CLAUDE.md section 7).
 */
export const DEMO_TODAY = '2026-11-10';

/**
 * Current demo date-time for timestamps created during the session: DEMO_TODAY plus the local
 * clock time, with no zone, so the stored date and the date shown are always DEMO_TODAY (INC-021:
 * with the UTC time, actions after 21 h in Buenos Aires were shown on the day before).
 */
export function demoNow(now = new Date()): string {
  return `${DEMO_TODAY}T${format(now, 'HH:mm:ss.SSS')}`;
}

/** ISO `YYYY-MM-DD` + n days. Works on calendar days, independent of time zone. */
export function addDays(isoDate: string, days: number): string {
  return format(addDaysFns(parseISO(isoDate), days), 'yyyy-MM-dd');
}

/** Calendar days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: string, to: string): number {
  return differenceInCalendarDays(parseISO(to.slice(0, 10)), parseISO(from.slice(0, 10)));
}

// ---------- Display preferences (F17, D-129) ----------
// The data keeps its dates and Buenos Aires wall-clock times; only the way they are shown changes.

/** Time zone of the demo data. */
export const DATA_TIMEZONE = 'America/Argentina/Buenos_Aires';
let displayDateFormat: 'dmy' | 'iso' = 'dmy';
let displayTimezone: string = DATA_TIMEZONE;
let numberLanguage: 'es' | 'en' = 'es';

/** Numbers follow the interface language (set by the i18n setup on every change). */
export function setNumberLanguage(language: string): void {
  numberLanguage = language === 'en' ? 'en' : 'es';
}

export function setDisplayPreferences({ dateFormat, timezone }: { dateFormat: 'dmy' | 'iso'; timezone: string }): void {
  displayDateFormat = dateFormat;
  displayTimezone = timezone;
}

const datePattern = () => (displayDateFormat === 'iso' ? 'yyyy-MM-dd' : 'dd/MM/yyyy');

/** Minutes ahead of UTC of a time zone on a given day (daylight saving included). */
export function offsetMinutes(timezone: string, date: Date): number {
  const name =
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
      .formatToParts(date)
      .find((part) => part.type === 'timeZoneName')?.value ?? 'GMT';
  const match = /GMT([+-])(\d{2}):?(\d{2})?/.exec(name);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === '-' ? -minutes : minutes;
}

/** DD/MM/AAAA for the interface (CLAUDE.md 2.9), or AAAA-MM-DD if the person chose it. */
export function formatDate(isoDate: string): string {
  return format(parseISO(isoDate.slice(0, 10)), datePattern());
}

/** Date and time in the person's time zone (the stored times are Buenos Aires times). */
export function formatDateTime(isoDateTime: string): string {
  const date = parseISO(isoDateTime);
  const shift =
    displayTimezone === DATA_TIMEZONE ? 0 : offsetMinutes(displayTimezone, date) - offsetMinutes(DATA_TIMEZONE, date);
  return format(addMinutes(date, shift), `${datePattern()} HH:mm`);
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

/** Numbers with dot thousands separator and comma decimals (CLAUDE.md 2.9); US style in English. */
export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(numberLanguage === 'en' ? 'en-US' : 'es-AR', { maximumFractionDigits }).format(value);
}

const NBSP = String.fromCharCode(0xa0);

/** Percentage with a non-breaking space before the sign, as in "84 %" (CLAUDE.md 2.9); "84%" in English. */
export function formatPercent(value: number): string {
  return `${formatNumber(Math.round(value))}${numberLanguage === 'en' ? '' : NBSP}%`;
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
